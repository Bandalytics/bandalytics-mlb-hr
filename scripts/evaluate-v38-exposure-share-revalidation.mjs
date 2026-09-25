import fs from 'node:fs';

const path=process.argv[2];
if(!path) throw Error('Usage: node scripts/evaluate-v38-exposure-share-revalidation.mjs <workflow-revalidation.json>');
const input=JSON.parse(fs.readFileSync(path,'utf8'));
if(input.protocol!=='V38_WORKFLOW_REVALIDATION_V1'||input.point_in_time!==true||input.as_of_verified!==true||Number(input.forward_leakage_days)!==0) throw Error('Invalid workflow revalidation artifact');

const pitch={INELIGIBLE:0,BASE_TRUE:1,TOP_QUARTILE:2,TOP_DECILE:3};
const bbe={INELIGIBLE:0,BASE:1,TOP_QUARTILE:2,TOP_DECILE:3};
const starter={LOW_LT_1_2:0,SMALL_SAMPLE:1,UNAVAILABLE:1,MID_1_2_TO_1_5:2,HIGH_GE_1_5:3};
const opp=x=>Number.isFinite(Number(x))?(Number(x)<=5?3:Number(x)===6?2:Number(x)<=9?1:0):0;
const value=(map,key)=>map[key]??0;
const eligible=(input.rows||[]).filter(r=>r?.revalidation?.anti_overcompression===true);
const slateBand=n=>n<=50?'SMALL_LE_50':n<=75?'MEDIUM_51_75':'LARGE_GE_76';
const strategies={
  PROFILE_FIRST:r=>[Number(r.gate_count)||0,value(starter,r.starter_hr9_band),value(pitch,r.pitchfit_band),opp(r.lineup_slot),value(bbe,r.bbe_hrshape_band)],
  PITCHFIT_FIRST:r=>[value(pitch,r.pitchfit_band),value(starter,r.starter_hr9_band),Number(r.gate_count)||0,opp(r.lineup_slot),value(bbe,r.bbe_hrshape_band)],
  MATCHUP_FIRST:r=>[value(starter,r.starter_hr9_band),value(pitch,r.pitchfit_band),Number(r.gate_count)||0,opp(r.lineup_slot),value(bbe,r.bbe_hrshape_band)],
  OPPORTUNITY_FIRST:r=>[opp(r.lineup_slot),Number(r.gate_count)||0,value(starter,r.starter_hr9_band),value(pitch,r.pitchfit_band),value(bbe,r.bbe_hrshape_band)]
};
const shares=[20,25,30,35,40];
const cmp=(a,b)=>{for(let i=0;i<a.length;i++){if(a[i]!==b[i])return b[i]-a[i]}return 0};
const cohort=rows=>{const outcome=rows.filter(r=>typeof r.homer==='boolean');const hr=outcome.filter(r=>r.homer===true).length;return{rows:rows.length,outcome_rows:outcome.length,hr,hr_rate:outcome.length?Number((100*hr/outcome.length).toFixed(2)):null}};
const totalHr=eligible.filter(r=>r.homer===true).length;
const results={};
for(const [name,keyFn] of Object.entries(strategies)){
  const ranked=[...eligible].sort((a,b)=>cmp(keyFn(a),keyFn(b))||Number(a.player_id)-Number(b.player_id));
  results[name]={};
  for(const pct of shares){
    const n=eligible.length?Math.max(1,Math.ceil(eligible.length*pct/100)):0;
    const selected=ranked.slice(0,n);
    results[name][`TOP_${pct}_PCT`]={...cohort(selected),selected_n:n,share_pct:pct,qualified_hr_capture_pct:totalHr?Number((100*selected.filter(r=>r.homer===true).length/totalHr).toFixed(2)):null};
  }
}
const out={protocol:'V38_EXPOSURE_SHARE_REVALIDATION_V1',date:input.date,point_in_time:true,as_of_verified:true,forward_leakage_days:0,research_only:true,scoring_enabled:false,ranking_contract:'LEXICOGRAPHIC_PREDECLARED_NO_OUTCOME_INPUT',candidate_source:'ANTI_OVERCOMPRESSION',share_contract:'CEIL_ELIGIBLE_X_SHARE',shares_pct:shares,slate_band:slateBand(eligible.length),eligible:cohort(eligible),strategies:results,roi_status:'UNAVAILABLE_NOT_FABRICATED'};
const outPath=`snapshots/v38-exposure-share-revalidation-${input.date}.json`;
fs.writeFileSync(outPath,JSON.stringify(out,null,2)+'\n');
console.log(`V38_EXPOSURE_SHARE_REVALIDATION_PATH=${outPath}`);
console.log(`V38_EXPOSURE_SHARE_REVALIDATION_SUMMARY=${JSON.stringify(out)}`);
