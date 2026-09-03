import { classifyLongshotQuality } from './v38-longshot-quality.mjs';
import { researchPoolHierarchy } from './v38-research-pool-hierarchy.mjs';
import { classifyPoolLayer, poolArchitectureProspectiveActive } from './v38-pool-architecture-v2.mjs';

export const V38_POOL_ARCHITECTURE_PROSPECTIVE_EVAL=Object.freeze({
  protocol:'V38_POOL_ARCHITECTURE_PROSPECTIVE_EVAL_V1',
  preregistered_at:'2026-09-03',
  first_eligible_date:'2026-09-04',
  minimum_final_slates_before_interpretation:3,
  research_only:true,
  scoring_enabled:false,
  scoring_eligible:false,
  production_rule_changed:false,
  auto_promote:false,
  threshold_review:false,
  deliberate_approval:false,
  historical_backfill_allowed:false,
  purpose:'Observe incremental HR capture from CORE -> PROTECTED -> QUALITY_VALUE -> ESCAPE_WATCH without changing locked gates.'
});

const LAYERS=['CORE','PROTECTED_POOL','QUALITY_VALUE_POOL','ESCAPE_WATCH'];
const CUMULATIVE=[
  ['CORE'],
  ['CORE','PROTECTED_POOL'],
  ['CORE','PROTECTED_POOL','QUALITY_VALUE_POOL'],
  ['CORE','PROTECTED_POOL','QUALITY_VALUE_POOL','ESCAPE_WATCH']
];

function oddsOf(row){
  const m=row?.context?.market;
  const x=Number(m?.best_odds??m?.current_odds??m?.american_odds);
  return Number.isFinite(x)?x:null;
}
function qualityOf(row,odds){
  if(odds!=null&&odds>=700){
    const l=classifyLongshotQuality(row,odds);
    return {quality_tier:l.quality_tier,longshot_policy:l};
  }
  if(+row?.gate_count>=5)return{quality_tier:'PROTECTED_5OF6_PLUS',longshot_policy:null};
  if(+row?.gate_count>=4&&row?.gate_passes?.iso===true)return{quality_tier:'QUALITY_4OF6_PLUS_ISO',longshot_policy:null};
  if(+row?.gate_count>=4)return{quality_tier:'BASE_PROFILE_4OF6',longshot_policy:null};
  return{quality_tier:'INELIGIBLE',longshot_policy:null};
}
function summarize(rows){
  const n=rows.length,hr=rows.filter(r=>r.homer===true).length;
  return {n,hr,hr_rate:n?+(100*hr/n).toFixed(2):null};
}

export function classifyProspectiveArchitectureRow(row,date){
  if(!poolArchitectureProspectiveActive(date))return{eligible_date:false,pool_layer:'OUTSIDE_PRIMARY_POOL'};
  const american_odds=oddsOf(row),{quality_tier,longshot_policy}=qualityOf(row,american_odds);
  const hierarchy=researchPoolHierarchy({
    quality_tier,
    pitchfit_band:row?.pitchfit_band,
    bbe_band:row?.bbe_band,
    lineup:row?.context?.lineup,
    american_odds
  });
  const pool_layer=classifyPoolLayer({date,priority_band:hierarchy.priority_band,quality_tier,american_odds,longshot_policy});
  return {eligible_date:true,american_odds,quality_tier,longshot_policy,hierarchy,pool_layer};
}

export function evaluateProspectivePoolArchitecture(rows,date){
  if(!poolArchitectureProspectiveActive(date))return{
    protocol:V38_POOL_ARCHITECTURE_PROSPECTIVE_EVAL.protocol,
    date,
    eligible:false,
    reason:`FIRST_ELIGIBLE_DATE_${V38_POOL_ARCHITECTURE_PROSPECTIVE_EVAL.first_eligible_date}`,
    research_only:true,
    scoring_enabled:false,
    production_rule_changed:false,
    auto_promote:false
  };
  const complete=(rows||[]).filter(r=>r?.profile_complete===true);
  const classified=complete.map(r=>({...r,architecture:classifyProspectiveArchitectureRow(r,date)}));
  const totalHr=complete.filter(r=>r.homer===true).length;
  const by_layer={};
  for(const layer of LAYERS){
    const a=classified.filter(r=>r.architecture.pool_layer===layer),s=summarize(a);
    by_layer[layer]={...s,hr_capture_pct:totalHr?+(100*s.hr/totalHr).toFixed(2):null};
  }
  const cumulative={};
  for(const layers of CUMULATIVE){
    const key=layers.join('+'),a=classified.filter(r=>layers.includes(r.architecture.pool_layer)),s=summarize(a);
    cumulative[key]={...s,hr_capture_pct:totalHr?+(100*s.hr/totalHr).toFixed(2):null};
  }
  const structured=classified.filter(r=>LAYERS.includes(r.architecture.pool_layer));
  const outsideHr=classified.filter(r=>r.homer===true&&!LAYERS.includes(r.architecture.pool_layer));
  return {
    protocol:V38_POOL_ARCHITECTURE_PROSPECTIVE_EVAL.protocol,
    date,
    eligible:true,
    minimum_final_slates_before_interpretation:V38_POOL_ARCHITECTURE_PROSPECTIVE_EVAL.minimum_final_slates_before_interpretation,
    research_only:true,
    scoring_enabled:false,
    scoring_eligible:false,
    production_rule_changed:false,
    auto_promote:false,
    threshold_review:false,
    deliberate_approval:false,
    full_complete_population:complete.length,
    full_population_hr:totalHr,
    structured_pool_rows:structured.length,
    structured_pool_hr:structured.filter(r=>r.homer===true).length,
    by_layer,
    cumulative,
    outside_primary_pool_hr:outsideHr.length,
    outside_primary_pool_hr_rows:outsideHr.map(r=>({player_id:r.player_id,player:r.player,gamePk:r.gamePk,gate_count:r.gate_count,american_odds:r.architecture.american_odds,quality_tier:r.architecture.quality_tier,priority_band:r.architecture.hierarchy?.priority_band||null})),
    rows:classified.filter(r=>LAYERS.includes(r.architecture.pool_layer)).map(r=>({player_id:r.player_id,player:r.player,gamePk:r.gamePk,homer:r.homer,american_odds:r.architecture.american_odds,gate_count:r.gate_count,quality_tier:r.architecture.quality_tier,priority_band:r.architecture.hierarchy?.priority_band||null,pool_layer:r.architecture.pool_layer}))
  };
}
