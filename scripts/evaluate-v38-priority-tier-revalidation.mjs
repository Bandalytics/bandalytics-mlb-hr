import fs from 'node:fs';

const path=process.argv[2];
if(!path) throw Error('Usage: node scripts/evaluate-v38-priority-tier-revalidation.mjs <workflow-revalidation.json>');
const input=JSON.parse(fs.readFileSync(path,'utf8'));
if(input.protocol!=='V38_WORKFLOW_REVALIDATION_V1'||input.point_in_time!==true||input.as_of_verified!==true||Number(input.forward_leakage_days)!==0) throw Error('Invalid workflow revalidation artifact');

const pitch={INELIGIBLE:0,BASE_TRUE:1,TOP_QUARTILE:2,TOP_DECILE:3};
const bbe={INELIGIBLE:0,BASE:1,TOP_QUARTILE:2,TOP_DECILE:3};
const starter={LOW_LT_1_2:0,SMALL_SAMPLE:1,UNAVAILABLE:1,MID_1_2_TO_1_5:2,HIGH_GE_1_5:3};
const opp=x=>Number.isFinite(Number(x))?(Number(x)<=5?3:Number(x)===6?2:Number(x)<=9?1:0):0;
const value=(map,key)=>map[key]??0;
const cmp=(a,b)=>{for(let i=0;i<a.length;i++){if(a[i]!==b[i])return b[i]-a[i]}return 0};
const cohort=rows=>{const outcome=rows.filter(r=>typeof r.homer==='boolean');const hr=outcome.filter(r=>r.homer===true).length;return{rows:rows.length,outcome_rows:outcome.length,hr,hr_rate:outcome.length?Number((100*hr/outcome.length).toFixed(2)):null,player_ids:rows.map(r=>Number(r.player_id))}};
const eligible=(input.rows||[]).filter(r=>r?.revalidation?.anti_overcompression===true);
const profileKey=r=>[Number(r.gate_count)||0,value(starter,r.starter_hr9_band),value(pitch,r.pitchfit_band),opp(r.lineup_slot),value(bbe,r.bbe_hrshape_band)];
const ranked=[...eligible].sort((a,b)=>cmp(profileKey(a),profileKey(b))||Number(a.player_id)-Number(b.player_id));
const boardN=eligible.length?Math.max(1,Math.ceil(eligible.length*0.30)):0;
const board=ranked.slice(0,boardN);
const outside=ranked.slice(boardN);
const pitchPositive=r=>r.pitchfit_band==='TOP_QUARTILE'||r.pitchfit_band==='TOP_DECILE';
const starterFavorable=r=>r.starter_hr9_band==='MID_1_2_TO_1_5'||r.starter_hr9_band==='HIGH_GE_1_5';
const priorityPlus=board.filter(r=>pitchPositive(r)&&starterFavorable(r));
const priority=board.filter(r=>pitchPositive(r)!==starterFavorable(r));
const onePath=board.filter(r=>!pitchPositive(r)&&!starterFavorable(r));
const eligibleHr=eligible.filter(r=>r.homer===true).length;
const boardHr=board.filter(r=>r.homer===true).length;
const tier=(rows)=>{const c=cohort(rows);return{...c,eligible_hr_capture_pct:eligibleHr?Number((100*c.hr/eligibleHr).toFixed(2)):null,board_hr_capture_pct:boardHr?Number((100*c.hr/boardHr).toFixed(2)):null}};
const out={
  protocol:'V38_PRIORITY_TIER_REVALIDATION_V1',
  date:input.date,
  point_in_time:true,
  as_of_verified:true,
  forward_leakage_days:0,
  research_only:true,
  scoring_enabled:false,
  candidate_source:'ANTI_OVERCOMPRESSION',
  serious_board_contract:'PROFILE_FIRST_TOP_30_PCT_CEIL',
  tier_assignment_contract:'WITHIN_SERIOUS_BOARD__BOTH_PITCHFIT_AND_FAVORABLE_STARTER=PRIORITY_PLUS__EXACTLY_ONE=PRIORITY__NEITHER=ONE_PATH',
  recent_bbe_role:'DIAGNOSTIC_TIEBREAKER_ONLY_NOT_TIER_GATE',
  eligible:cohort(eligible),
  serious_board:{...cohort(board),selected_n:boardN,eligible_hr_capture_pct:eligibleHr?Number((100*boardHr/eligibleHr).toFixed(2)):null},
  outside_serious_board:cohort(outside),
  tiers:{PRIORITY_PLUS:tier(priorityPlus),PRIORITY:tier(priority),ONE_PATH:tier(onePath)},
  roi_status:'UNAVAILABLE_NOT_FABRICATED',
  protected_4of6_status:'OUTSIDE_REPLAY_WITHOUT_FROZEN_PRICE_PROVENANCE'
};
const outPath=`snapshots/v38-priority-tier-revalidation-${input.date}.json`;
fs.mkdirSync('snapshots',{recursive:true});
fs.writeFileSync(outPath,JSON.stringify(out,null,2)+'\n');
console.log(`V38_PRIORITY_TIER_REVALIDATION_PATH=${outPath}`);
console.log(`V38_PRIORITY_TIER_REVALIDATION_SUMMARY=${JSON.stringify(out)}`);
