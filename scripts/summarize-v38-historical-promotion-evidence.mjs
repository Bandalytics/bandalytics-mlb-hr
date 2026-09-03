import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const root=process.argv[2]||'incoming/historical';
const EXPECTED_DATES=['2026-08-23','2026-08-24','2026-08-25','2026-08-26','2026-08-27','2026-08-28','2026-08-29','2026-08-30','2026-08-31','2026-09-01'];
const SELECTED_RULE='4of6_iso+pitchfit_top_quartile';
const sha256=x=>crypto.createHash('sha256').update(x).digest('hex');
const canonical=x=>JSON.stringify(x,Object.keys(x).sort());
async function files(p){const out=[];async function walk(q){let es;try{es=await fs.readdir(q,{withFileTypes:true})}catch{return}for(const e of es){const z=path.join(q,e.name);if(e.isDirectory())await walk(z);else if(e.isFile()&&e.name.endsWith('.json'))out.push(z)} }await walk(p);return out;}
const all=await files(root);
const convByDate=new Map(),profileByDate=new Map(),rejected=[];
for(const f of all){let z;try{z=JSON.parse(await fs.readFile(f,'utf8'));}catch{continue}
  if(z?.protocol==='V38_HISTORICAL_CONVERGENCE_V1'){
    const d=String(z.date||'');
    if(!EXPECTED_DATES.includes(d)){rejected.push({source:path.basename(f),date:d,reason:'OUTSIDE_PREREGISTERED_WINDOW'});continue;}
    if(z.point_in_time!==true||z.as_of_verified!==true||z.research_only!==true||z.scoring_enabled!==false){rejected.push({source:path.basename(f),date:d,reason:'INVALID_CONVERGENCE_INTEGRITY'});continue;}
    const raw=await fs.readFile(f);const x={z,f,sha256:sha256(raw)};const prior=convByDate.get(d);if(!prior||x.sha256<prior.sha256)convByDate.set(d,x);
  }
  if(z?.protocol==='V38_POINT_IN_TIME_REPLAY_V1'){
    const d=String(z.date||'');if(!EXPECTED_DATES.includes(d))continue;
    if(z.point_in_time!==true||z.research_only!==true||z.scoring_enabled!==false||Number(z.forward_leakage_days||0)!==0)continue;
    const raw=await fs.readFile(f);const x={z,f,sha256:sha256(raw)};const prior=profileByDate.get(d);if(!prior||x.sha256<prior.sha256)profileByDate.set(d,x);
  }
}
const missing=EXPECTED_DATES.filter(d=>!convByDate.has(d)||!profileByDate.has(d));
if(missing.length)throw new Error(`Missing preregistered historical evidence: ${missing.join(',')}`);
let historicalSelected=0,historicalHr=0,baseN=0,baseHr=0,positive=0;
const slates=[];
for(const d of EXPECTED_DATES){const c=convByDate.get(d),p=profileByDate.get(d);const g=(c.z.results||[]).find(x=>x.rule===SELECTED_RULE);if(!g)throw new Error(`Missing selected rule ${SELECTED_RULE} for ${d}`);const rows=(p.z.rows||[]).filter(r=>r.profile_complete===true);const ph=rows.filter(r=>r.homer===true).length;if(Number(c.z.profile_rows)!==rows.length)throw new Error(`Profile row mismatch ${d}`);historicalSelected+=+g.qualified||0;historicalHr+=+g.hr||0;baseN+=rows.length;baseHr+=ph;if(Number(g.lift_vs_base)>1)positive++;slates.push({date:d,convergence_sha256:c.sha256,profile_sha256:p.sha256,profile_rows:rows.length,base_hr:ph,selected:+g.qualified||0,hr:+g.hr||0,hr_rate:g.hr_rate,hr_capture:g.hr_capture,lift_vs_base:g.lift_vs_base});}
const rate=(a,b)=>b?100*a/b:0;
const selectedRate=rate(historicalHr,historicalSelected),baseRate=rate(baseHr,baseN),lift=baseRate?selectedRate/baseRate:0,capture=rate(historicalHr,baseHr),positivePct=rate(positive,EXPECTED_DATES.length);
const convergenceSource=await fs.readFile(new URL('./evaluate-v38-historical-convergence.mjs',import.meta.url));
const rulesSource=await fs.readFile(new URL('../v38-baseball-convergence.mjs',import.meta.url));
const implementation={historical_convergence_sha256:sha256(convergenceSource),baseball_convergence_rules_sha256:sha256(rulesSource)};
const evidenceCore={protocol:'V38_HISTORICAL_PROMOTION_EVIDENCE_V1',preregistered_window:{start:EXPECTED_DATES[0],end:EXPECTED_DATES.at(-1),dates:EXPECTED_DATES},selected_definition:'quality_plus_pitchfit',selected_rule:SELECTED_RULE,historical_slates:EXPECTED_DATES.length,historical_selected:historicalSelected,historical_hr:historicalHr,historical_selected_hr_rate:+selectedRate.toFixed(2),population_n:baseN,population_hr:baseHr,population_hr_rate:+baseRate.toFixed(2),selected_pool_lift_vs_base:+lift.toFixed(3),hr_capture_pct:+capture.toFixed(2),positive_lift_slates_pct:+positivePct.toFixed(2),escape_audit:false,research_only:true,scoring_enabled:false,scoring_eligible:false,auto_promote:false,implementation,slates};
const manifestDigest=sha256(JSON.stringify(evidenceCore));
const out={...evidenceCore,manifest_valid:true,manifest_digest:manifestDigest,rejected_artifacts:rejected};
await fs.mkdir('snapshots',{recursive:true});const outPath='snapshots/v38-historical-promotion-evidence.json';await fs.writeFile(outPath,JSON.stringify(out,null,2)+'\n');
console.log(`V38_HISTORICAL_PROMOTION_PATH=${outPath}`);
console.log(`V38_HISTORICAL_PROMOTION=${JSON.stringify({historical_slates:out.historical_slates,historical_selected:out.historical_selected,historical_hr:out.historical_hr,selected_pool_lift_vs_base:out.selected_pool_lift_vs_base,hr_capture_pct:out.hr_capture_pct,positive_lift_slates_pct:out.positive_lift_slates_pct,manifest_digest:out.manifest_digest})}`);
