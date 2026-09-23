import fs from 'node:fs/promises';
import crypto from 'node:crypto';

const [planFile]=process.argv.slice(2);
if(!planFile)throw Error('usage: node scripts/diagnose-v38-execution-plan.mjs <frozen-plan.json>');
const plan=JSON.parse(await fs.readFile(planFile,'utf8'));
if(!Array.isArray(plan?.rows)||!Array.isArray(plan?.tickets))throw Error('frozen execution plan required');
const allowedPlanProtocols=new Set(['BANDALYTICS_EXECUTION_PLAN_PROSPECTIVE_V2','BANDALYTICS_EXECUTION_PLAN_PROSPECTIVE_V3']);
if(!allowedPlanProtocols.has(plan?.protocol))throw Error('prospective V2/V3 execution plan required');
if(plan?.point_in_time!==true||plan?.prospective!==true||plan?.research_only!==true)throw Error('unsafe plan flags');
if(typeof plan?.sha256!=='string')throw Error('plan sha256 required');
const {sha256,...body}=plan;
const calc=crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
if(calc!==sha256)throw Error('execution plan sha256 mismatch');

const laneCount=r=>new Set(Array.isArray(r?.evidence_lanes)?r.evidence_lanes:[]).size;
const paths=r=>Math.max(0,Math.trunc(Number(r?.ticket_paths)||0));
const odds=r=>{const x=Number(r?.hr_odds??r?.odds??r?.american_odds);return Number.isFinite(x)?x:null};
function priceBucket(v){
  if(v==null)return 'UNKNOWN';
  if(v<400)return 'SUB_400';
  if(v<500)return '400_499';
  if(v<700)return '500_699';
  if(v<=1500)return '700_1500';
  return '1501_PLUS';
}
const final=plan.rows.filter(r=>r?.final_cut===true);
const ineligible=plan.rows.filter(r=>r?.final_cut===false&&r?.eligible_for_final_cut===false);
const cuts=plan.rows.filter(r=>r?.final_cut===false&&r?.eligible_for_final_cut!==false);
const ticketed=final.filter(r=>paths(r)>0);
const zeros=final.filter(r=>paths(r)===0);
const totalLegs=ticketed.reduce((s,r)=>s+paths(r),0);
const byPrice={};
for(const b of ['SUB_400','400_499','500_699','700_1500','1501_PLUS','UNKNOWN'])byPrice[b]={players:0,ticket_legs:0,leg_share_pct:null,zero_path_players:0};
for(const r of final){
  const b=priceBucket(odds(r));
  if(paths(r)>0){byPrice[b].players++;byPrice[b].ticket_legs+=paths(r)}else byPrice[b].zero_path_players++;
}
for(const v of Object.values(byPrice))v.leg_share_pct=totalLegs?+(100*v.ticket_legs/totalLegs).toFixed(2):null;
const byLaneCount={};
for(const r of final){
  const k=String(laneCount(r));
  if(!byLaneCount[k])byLaneCount[k]={players:0,ticketed_players:0,zero_path_players:0,ticket_legs:0};
  byLaneCount[k].players++;
  if(paths(r)>0){byLaneCount[k].ticketed_players++;byLaneCount[k].ticket_legs+=paths(r)}else byLaneCount[k].zero_path_players++;
}
const inversions=[];
for(const z of zeros){
  const zl=laneCount(z);
  if(zl<2)continue;
  for(const t of ticketed){
    const tl=laneCount(t);
    if(paths(t)>=2&&tl<zl){
      inversions.push({zero_path_player:z.player,zero_path_lanes:zl,zero_path_evidence_lanes:z.evidence_lanes||[],zero_path_odds:odds(z),repeated_player:t.player,repeated_paths:paths(t),repeated_lanes:tl,repeated_evidence_lanes:t.evidence_lanes||[],repeated_odds:odds(t)});
    }
  }
}
const repeated=ticketed.filter(r=>paths(r)>=2).map(r=>({player:r.player,ticket_paths:paths(r),lane_count:laneCount(r),evidence_lanes:r.evidence_lanes||[],odds:odds(r),price_bucket:priceBucket(odds(r)),exposure_state:r.exposure_state||null})).sort((a,b)=>b.ticket_paths-a.ticket_paths||b.lane_count-a.lane_count);
const zeroPath=zeros.map(r=>({player:r.player,lane_count:laneCount(r),evidence_lanes:r.evidence_lanes||[],odds:odds(r),price_bucket:priceBucket(odds(r)),zero_path_reason:r.zero_path_reason||null})).sort((a,b)=>b.lane_count-a.lane_count);
const cutAudit=cuts.map(r=>({player:r.player,cut_type:r.cut_type||null,cut_reason:r.cut_reason||null,lane_count:laneCount(r),evidence_lanes:r.evidence_lanes||[],odds:odds(r),price_bucket:priceBucket(odds(r))})).sort((a,b)=>b.lane_count-a.lane_count);
const eligibilityBlocks=ineligible.map(r=>({player:r.player,readiness_state:r.readiness_state||null,locked_policy_label:r?.locked_policy?.label||null,lineup_verified:r?.lineup_verified??null,gate_count:r?.locked_policy?.gate_count??r?.gate_count??null}));
const compressionWatch=Array.isArray(plan?.compression_watch)?plan.compression_watch:[];
const compressionAudit=compressionWatch.map(r=>({player:r.player,review_disposition:r.review_disposition||null,review_cut_type:r.review_cut_type||null,review_reason:r.review_reason||null,confirmed_lane_count:Number(r.confirmed_lane_count)||0,confirmed_lanes:r.confirmed_lanes||[],odds:odds(r)}));
const shortLegs=(byPrice.SUB_400.ticket_legs||0)+(byPrice['400_499'].ticket_legs||0);
const preferredLegs=(byPrice['500_699'].ticket_legs||0)+(byPrice['700_1500'].ticket_legs||0);
const comfortCuts=cutAudit.filter(r=>r.cut_type==='COMFORT_CUT');
const baseballCuts=cutAudit.filter(r=>r.cut_type==='BASEBALL_CUT');
const compressionComfortCuts=compressionAudit.filter(r=>r.review_cut_type==='COMFORT_CUT');
const out={
  protocol:'BANDALYTICS_EXECUTION_DIAGNOSTICS_V2',date:plan.date,captured_at:plan.captured_at,source_plan_protocol:plan.protocol,source_plan_sha256:sha256,research_only:true,scoring_enabled:false,production_rule_changed:false,thresholds_locked:false,
  summary:{final_pool_n:final.length,cut_n:cuts.length,ineligible_n:ineligible.length,baseball_cut_n:baseballCuts.length,comfort_cut_n:comfortCuts.length,ticketed_n:ticketed.length,zero_path_n:zeros.length,total_ticket_legs:totalLegs,repeated_exposure_players:repeated.length,evidence_inversion_count:inversions.length,short_price_leg_share_pct:totalLegs?+(100*shortLegs/totalLegs).toFixed(2):null,preferred_500_1500_leg_share_pct:totalLegs?+(100*preferredLegs/totalLegs).toFixed(2):null,compression_watch_n:compressionAudit.length,compression_comfort_cut_n:compressionComfortCuts.length},
  by_price_bucket:byPrice,by_evidence_lane_count:byLaneCount,repeated_exposure:repeated,zero_path:zeroPath,evidence_inversions:inversions,cut_audit:cutAudit,eligibility_blocks:eligibilityBlocks,compression_watch_audit:compressionAudit,
  semantics:{evidence_inversion:'Diagnostic only: a 2+ lane zero-path hitter had more independent evidence lanes than a hitter repeated on 2+ tickets.',price_buckets:'Descriptive only; no automatic exposure cap or promotion.',market_chalk_not_process_chalk:'Short price share measures market chalk. Evidence inversions and repeated exposure measure process allocation.',comfort_cut:'Descriptive audit label for a cut made primarily for safety/familiarity rather than materially weaker baseball evidence. It never auto-promotes a hitter.',eligibility_block:'Policy/lineup-blocked rows are tracked separately and are not counted as BASEBALL_CUT or COMFORT_CUT decisions.'}
};
console.log('V38_EXECUTION_DIAGNOSTICS='+JSON.stringify(out));
