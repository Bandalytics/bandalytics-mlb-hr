import fs from'node:fs/promises';
import path from'node:path';
import{evaluateFinalPoolPromotion,V38_FINAL_POOL_PROMOTION_GATE}from'../v38-final-pool-promotion-gate.mjs';

const root=process.argv[2]||'incoming/postgame';
const historicalPath=process.argv[3]||null;
async function files(p){const out=[];async function walk(q){let es;try{es=await fs.readdir(q,{withFileTypes:true})}catch{return}for(const e of es){const z=path.join(q,e.name);if(e.isDirectory())await walk(z);else if(e.isFile()&&e.name.endsWith('.json'))out.push(z)}}await walk(p);return out}
const pct=(a,b)=>b?+(100*a/b).toFixed(2):0;
const jsons=[];for(const f of await files(root)){try{const z=JSON.parse(await fs.readFile(f,'utf8'));if(z.evaluation_protocol==='V38_PREGAME_OUTCOME_EVAL_V5'&&z.status==='FINAL'&&z.prospective_validation===true&&z.qualifying_backtest===true&&z.selected_pool_report?.protocol==='V38_SELECTED_POOL_REPORT_V1')jsons.push({z,f})}catch{}}
const dedupe=new Map();for(const x of jsons){const k=`${x.z.date}|${x.z.snapshot_sha256}`;if(!dedupe.has(k))dedupe.set(k,x)}
const slates=[...dedupe.values()].sort((a,b)=>String(a.z.date).localeCompare(String(b.z.date)));
let historical={};if(historicalPath){try{historical=JSON.parse(await fs.readFile(historicalPath,'utf8'))}catch{}}
let prospectiveSelected=0,prospectiveHr=0,totalComplete=0,totalContext=0,totalModifier=0,positive=0,weightedBaseN=0,weightedBaseHr=0;
const slate_rows=[];
for(const{x,f}of slates){const g=x.selected_pool_report.groups?.quality_plus_pitchfit||{n:0,hr:0,hr_rate:null,lift_vs_base:null,hr_capture:null};prospectiveSelected+=+g.n||0;prospectiveHr+=+g.hr||0;totalComplete+=+x.complete_profiled_hitters||0;totalContext+=+x.context_coverage?.rows_with_context||0;totalModifier+=+x.modifier_coverage?.rows_with_per_game_modifier_evidence||0;weightedBaseN+=+x.complete_profiled_hitters||0;weightedBaseHr+=+x.complete_profile_hr_hitters||0;if(Number(g.lift_vs_base)>1)positive++;slate_rows.push({date:x.date,snapshot_sha256:x.snapshot_sha256,source:path.basename(f),selected:g.n,hr:g.hr,hr_rate:g.hr_rate,lift_vs_base:g.lift_vs_base,hr_capture:g.hr_capture,base_hr_rate:x.base_hr_rate,context_coverage_pct:pct(+x.context_coverage?.rows_with_context||0,+x.complete_profiled_hitters||0),modifier_coverage_pct:pct(+x.modifier_coverage?.rows_with_per_game_modifier_evidence||0,+x.complete_profiled_hitters||0)})}
const prospectiveRate=prospectiveSelected?+(100*prospectiveHr/prospectiveSelected).toFixed(2):null,baseRate=weightedBaseN?+(100*weightedBaseHr/weightedBaseN).toFixed(2):null,prospectiveLift=prospectiveRate!=null&&baseRate?+(prospectiveRate/baseRate).toFixed(3):null;
const evidence={
 historical_slates:+historical.historical_slates||0,historical_selected:+historical.historical_selected||0,historical_hr:+historical.historical_hr||0,selected_pool_lift_vs_base:Number(historical.selected_pool_lift_vs_base)||0,hr_capture_pct:Number(historical.hr_capture_pct)||0,positive_lift_slates_pct:Number(historical.positive_lift_slates_pct)||0,
 prospective_final_slates:slates.length,prospective_selected:prospectiveSelected,prospective_hr:prospectiveHr,context_coverage_pct:pct(totalContext,totalComplete),modifier_evidence_coverage_pct:pct(totalModifier,totalComplete),market_band_report:slates.length>0&&slates.every(x=>x.z.selected_pool_report?.market_bands),escape_audit:historical.escape_audit===true,pool_target_forced:false,threshold_review:false,deliberate_approval:false
};
const gate=evaluateFinalPoolPromotion(evidence);
const out={protocol:'V38_PROMOTION_READINESS_AGGREGATE_V1',research_only:true,scoring_enabled:false,scoring_eligible:false,auto_promote:false,dedupe_rule:'date + immutable snapshot_sha256',selected_definition:'quality_plus_pitchfit',prospective:{final_slates:slates.length,selected:prospectiveSelected,hr:prospectiveHr,hr_rate:prospectiveRate,weighted_base_hr_rate:baseRate,lift_vs_base:prospectiveLift,positive_lift_slates_pct:pct(positive,slates.length),context_coverage_pct:evidence.context_coverage_pct,modifier_evidence_coverage_pct:evidence.modifier_evidence_coverage_pct},historical_input:historical,evidence,gate,required:V38_FINAL_POOL_PROMOTION_GATE,slates:slate_rows};
await fs.mkdir('snapshots',{recursive:true});const p='snapshots/v38-promotion-readiness.json';await fs.writeFile(p,JSON.stringify(out,null,2)+'\n');console.log(`V38_PROMOTION_READINESS_PATH=${p}`);console.log(`V38_PROMOTION_READINESS=${JSON.stringify({prospective:out.prospective,checks:gate.checks,eligible_for_promotion:gate.eligible_for_promotion})}`);
