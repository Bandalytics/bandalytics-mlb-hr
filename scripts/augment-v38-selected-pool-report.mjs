import fs from'node:fs/promises';
import pathMod from'node:path';
import{selectedPoolReport}from'../v38-selected-pool-report.mjs';
import{buildEvidenceManifest,sha256}from'../v38-evidence-manifest.mjs';
import{V38_PROFILE_CANDIDATE}from'../profile-v38-candidate.mjs';
import{LONGSHOT_700_POLICY}from'../mlb-hr-locked-policy.mjs';
import{V38_CANDIDATE_RULES}from'../v38-gate-rules.mjs';
import{V38_RESEARCH_POOL_HIERARCHY}from'../v38-research-pool-hierarchy.mjs';
import{V38_FINAL_POOL_PROMOTION_GATE}from'../v38-final-pool-promotion-gate.mjs';

async function jsonFiles(root){const out=[];async function walk(p){let es;try{es=await fs.readdir(p,{withFileTypes:true})}catch{return}for(const e of es){const q=pathMod.join(p,e.name);if(e.isDirectory())await walk(q);else if(e.isFile()&&e.name.endsWith('.json'))out.push(q)}}if(root)await walk(root);return out.sort()}
async function evidenceArtifacts(root,kind){const files=await jsonFiles(root),out=[];for(const f of files){try{const raw=await fs.readFile(f,'utf8'),z=JSON.parse(raw),parent=pathMod.basename(pathMod.dirname(f));out.push({name:`${kind}:${pathMod.basename(f)}`,artifact_id:parent&&parent!==pathMod.basename(root)?parent:sha256(raw).slice(0,16),protocol:z.context_protocol||z.protocol||z.snapshot_protocol||'UNKNOWN_JSON_PROTOCOL',sha256:sha256(raw),captured_at:z.captured_at||null})}catch{}}return out}

const p=process.argv[2],contextDir=process.argv[3]||'incoming/contexts',modifierDir=process.argv[4]||'incoming/modifiers';
if(!p)throw Error('usage: node scripts/augment-v38-selected-pool-report.mjs <evaluated.json> [context-dir] [modifier-dir]');
const z=JSON.parse(await fs.readFile(p,'utf8'));
if(z.evaluation_protocol!=='V38_PREGAME_OUTCOME_EVAL_V5'||z.status!=='FINAL'||z.prospective_validation!==true||z.research_only!==true||z.scoring_enabled!==false)throw Error('selected-pool report requires final V5 prospective research evaluation');
z.selected_pool_report=selectedPoolReport(z.rows||[]);
const artifacts=[{name:'pregame_snapshot',artifact_id:String(z.snapshot_sha256||'').slice(0,16),protocol:z.snapshot_protocol||'V38_PREGAME_SNAPSHOT_V1',sha256:z.snapshot_sha256||'',captured_at:z.captured_at||null},...await evidenceArtifacts(contextDir,'context'),...await evidenceArtifacts(modifierDir,'modifier')];
const outcomeRows=(z.rows||[]).map(r=>({gamePk:+r.gamePk||null,player_id:+r.player_id||null,homer:r.homer===true})).sort((a,b)=>(a.gamePk??0)-(b.gamePk??0)||(a.player_id??0)-(b.player_id??0));
const field_fingerprint=sha256(V38_PROFILE_CANDIDATE.fields),outcomes_digest=sha256(outcomeRows);
const selectedPoolSource=await fs.readFile(new URL('../v38-selected-pool-report.mjs',import.meta.url),'utf8');
const selected_pool_report_implementation_sha256=sha256(selectedPoolSource);
z.evidence_manifest=buildEvidenceManifest({date:z.date,evaluation_protocol:z.evaluation_protocol,field_fingerprint,pullair_threshold_deg:15.5,rules:{candidate_rules:V38_CANDIDATE_RULES,longshot_700_policy:LONGSHOT_700_POLICY,research_pool_hierarchy:V38_RESEARCH_POOL_HIERARCHY,final_pool_promotion_gate:V38_FINAL_POOL_PROMOTION_GATE,modifier_selection_rule:z.modifier_selection_rule,selected_pool_report:{protocol:z.selected_pool_report?.protocol||null,implementation_sha256:selected_pool_report_implementation_sha256}},artifacts,outcomes_digest,metadata:{selected_pool_report_protocol:z.selected_pool_report?.protocol||null,selected_pool_report_implementation_sha256,eligible_games:z.eligible_games,complete_profiled_hitters:z.complete_profiled_hitters}});
await fs.writeFile(p,JSON.stringify(z,null,2)+'\n');
console.log('V38_SELECTED_POOL_REPORT='+JSON.stringify(z.selected_pool_report));
console.log('V38_EVIDENCE_MANIFEST='+JSON.stringify({protocol:z.evidence_manifest.protocol,manifest_digest:z.evidence_manifest.manifest_digest,dedupe_key:z.evidence_manifest.dedupe_key,artifacts:z.evidence_manifest.artifacts.length,selected_pool_report_implementation_sha256}));
