import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {buildPitchfitBands} from '../v38-pitchfit-bands.mjs';

const root=process.argv[2]||'incoming/historical';
const outPath=process.argv[3]||'snapshots/v38-historical-escape-audit.json';
const EXPECTED_DATES=['2026-08-23','2026-08-24','2026-08-25','2026-08-26','2026-08-27','2026-08-28','2026-08-29','2026-08-30','2026-08-31','2026-09-01'];
const SELECTED_RULE='4of6_iso+pitchfit_top_quartile';
const sha256=x=>crypto.createHash('sha256').update(x).digest('hex');
async function files(p){const out=[];async function walk(q){let es;try{es=await fs.readdir(q,{withFileTypes:true})}catch{return}for(const e of es){const z=path.join(q,e.name);if(e.isDirectory())await walk(z);else if(e.isFile()&&e.name.endsWith('.json'))out.push(z)}}await walk(p);return out}
const all=await files(root),profiles=new Map(),pitchfits=new Map(),convergence=new Map(),rejected=[];
function keep(map,d,x){const prior=map.get(d);if(!prior||x.sha256<prior.sha256)map.set(d,x)}
for(const f of all){let z,raw;try{raw=await fs.readFile(f);z=JSON.parse(raw)}catch{continue}const d=String(z?.date||'');if(!EXPECTED_DATES.includes(d))continue;const x={z,f,sha256:sha256(raw)};
  if(z.protocol==='V38_POINT_IN_TIME_REPLAY_V1'&&z.point_in_time===true&&z.research_only===true&&z.scoring_enabled===false&&Number(z.forward_leakage_days||0)===0)keep(profiles,d,x);
  else if(z.protocol==='V38_PITCHFIT_DISTRIBUTION_V1'&&z.as_of_verified===true&&z.research_only===true&&z.scoring_enabled===false)keep(pitchfits,d,x);
  else if(z.protocol==='V38_HISTORICAL_CONVERGENCE_V1'&&z.point_in_time===true&&z.as_of_verified===true&&z.research_only===true&&z.scoring_enabled===false)keep(convergence,d,x);
}
const missing=EXPECTED_DATES.filter(d=>!profiles.has(d)||!pitchfits.has(d)||!convergence.has(d));if(missing.length)throw new Error(`Missing escape-audit inputs: ${missing.join(',')}`);
const buckets={CAPTURED_QUALITY_PLUS_PITCHFIT:0,QUALITY_PITCHFIT_BELOW_TOP_QUARTILE:0,QUALITY_PITCHFIT_INELIGIBLE:0,FOUR_OF_SIX_WITHOUT_ISO:0,THREE_OF_SIX_PROFILE:0,LOW_PROFILE_ZERO_TO_TWO:0};
const perSlate=[];let population=0,totalHr=0,selected=0,selectedHr=0,escapedHr=0;
for(const d of EXPECTED_DATES){const p=profiles.get(d).z,pf=pitchfits.get(d).z,c=convergence.get(d).z;const bandModel=buildPitchfitBands(pf.rows||[]),pfById=new Map((pf.rows||[]).map(r=>[Number(r.player_id),r]));const conv=(c.results||[]).find(r=>r.rule===SELECTED_RULE);if(!conv)throw new Error(`Missing ${SELECTED_RULE} convergence row for ${d}`);let dn=0,dhr=0,dsel=0,dselhr=0;const db={};
  for(const r of (p.rows||[]).filter(r=>r.profile_complete===true)){dn++;if(r.homer===true)dhr++;const pr=pfById.get(Number(r.player_id)),band=bandModel.classify(pr),quality=r.candidate_rules?.['4of6_iso']===true,isSelected=quality&&['TOP_QUARTILE','TOP_DECILE'].includes(band);if(isSelected){dsel++;if(r.homer===true)dselhr++}if(r.homer!==true)continue;let bucket;if(isSelected)bucket='CAPTURED_QUALITY_PLUS_PITCHFIT';else if(quality&&band==='BASE_TRUE')bucket='QUALITY_PITCHFIT_BELOW_TOP_QUARTILE';else if(quality)bucket='QUALITY_PITCHFIT_INELIGIBLE';else if(Number(r.gate_count)>=4)bucket='FOUR_OF_SIX_WITHOUT_ISO';else if(Number(r.gate_count)===3)bucket='THREE_OF_SIX_PROFILE';else bucket='LOW_PROFILE_ZERO_TO_TWO';buckets[bucket]++;db[bucket]=(db[bucket]||0)+1;}
  if(dsel!==Number(conv.qualified)||dselhr!==Number(conv.hr))throw new Error(`Escape audit selection mismatch ${d}: derived ${dsel}/${dselhr}, convergence ${conv.qualified}/${conv.hr}`);population+=dn;totalHr+=dhr;selected+=dsel;selectedHr+=dselhr;escapedHr+=dhr-dselhr;perSlate.push({date:d,population:dn,hr:dhr,selected:dsel,selected_hr:dselhr,escaped_hr:dhr-dselhr,buckets:db,profile_sha256:profiles.get(d).sha256,pitchfit_sha256:pitchfits.get(d).sha256,convergence_sha256:convergence.get(d).sha256});}
const core={protocol:'V38_HISTORICAL_ESCAPE_AUDIT_V1',window:{start:EXPECTED_DATES[0],end:EXPECTED_DATES.at(-1),dates:EXPECTED_DATES,slates:EXPECTED_DATES.length},selected_rule:SELECTED_RULE,population,total_hr:totalHr,selected,selected_hr:selectedHr,escaped_hr:escapedHr,hr_capture_pct:totalHr?+(100*selectedHr/totalHr).toFixed(2):0,buckets,per_slate:perSlate,interpretation:{purpose:'DESCRIBE_ESCAPES_WITHOUT_RETROACTIVE_THRESHOLD_CHANGES',rule_changes_from_audit:false,threshold_changes_from_audit:false,pool_fill_rule_changed:false,production_promotion:false},point_in_time:true,as_of_verified:true,research_only:true,scoring_enabled:false,scoring_eligible:false,auto_promote:false};
const manifest_digest=sha256(JSON.stringify(core));const out={...core,audit_complete:true,manifest_valid:true,manifest_digest,rejected_artifacts:rejected};await fs.mkdir(path.dirname(outPath),{recursive:true});await fs.writeFile(outPath,JSON.stringify(out,null,2)+'\n');console.log(`V38_HISTORICAL_ESCAPE_AUDIT_PATH=${outPath}`);console.log(`V38_HISTORICAL_ESCAPE_AUDIT=${JSON.stringify({population,total_hr:totalHr,selected,selected_hr:selectedHr,escaped_hr:escapedHr,hr_capture_pct:out.hr_capture_pct,buckets,manifest_digest})}`);
