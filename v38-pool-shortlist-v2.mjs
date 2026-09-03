export const V38_POOL_SHORTLIST_V2=Object.freeze({
  protocol:'V38_POOL_SHORTLIST_V2',
  preregistered_at:'2026-09-03',
  first_prospective_date:'2026-09-04',
  research_only:true,
  scoring_enabled:false,
  scoring_eligible:false,
  model_scoring_changed:false,
  production_rule_changed:false,
  pool_target_forced:false,
  review_queue_max:25,
  role:'EVIDENCE_READINESS_FILTER_INSIDE_LAYERED_RESEARCH_POOL',
  notes:Object.freeze([
    'CORE_ALWAYS_RETAINED_FOR_RESEARCH_REVIEW',
    'NONCORE_REQUIRES_MULTIPLE_INDEPENDENT_SUPPORT_SIGNALS',
    'PARK_IS_SUPPORT_ONLY_AND_NEVER_STANDALONE',
    'MISSING_EVIDENCE_IS_PENDING_NOT_AUTOMATIC_NEGATIVE',
    'MAXIMUM_25_REVIEW_QUEUE_WITH_NO_MINIMUM_FILL',
    'CORE_IS_NEVER_DROPPED_BY_QUEUE_CAP',
    'NO_FILL_TO_TARGET'
  ])
});

function preferredMarket(o){const n=Number(o);return Number.isFinite(n)&&n>=500&&n<=1500}
function bbeSupport(b){return['TOP_QUARTILE','TOP_DECILE'].includes(b?.hrshape_band)}
function supportFlags(row={}){return{
  preferred_market:preferredMarket(row.american_odds),
  confirmed_lineup:row.context?.confirmed_lineup===true,
  bbe_support:bbeSupport(row.bbe_band),
  exact_side_park:!!(row.park_factor&&Number.isFinite(Number(row.park_factor.hr_factor)))
}}

export function poolShortlistReadiness(row={}){
  const layer=row.pool_layer||'OUTSIDE_PRIMARY_POOL',flags=supportFlags(row),support_count=Object.values(flags).filter(Boolean).length;
  if(layer==='OUTSIDE_PRIMARY_POOL')return{status:'OUTSIDE_PRIMARY_POOL',support_count,flags,research_only:true};
  if(layer==='CORE')return{status:'RETAIN_FOR_FINAL_REVIEW',support_count,flags,reason:'CORE_GATE_UNCHANGED',research_only:true};
  if(layer==='PROTECTED_POOL'){
    const six=Number(row.gate_count)>=6;
    if(six||support_count>=2)return{status:'RETAIN_FOR_FINAL_REVIEW',support_count,flags,reason:six?'SIX_OF_SIX_PROFILE':'MULTI_SIGNAL_SUPPORT',research_only:true};
    return{status:'PENDING_EVIDENCE',support_count,flags,reason:'PROTECTED_PROFILE_NEEDS_MORE_NIGHTLY_EVIDENCE',research_only:true};
  }
  if(layer==='QUALITY_VALUE_POOL'){
    if(support_count>=2&&(flags.preferred_market||flags.bbe_support))return{status:'RETAIN_FOR_FINAL_REVIEW',support_count,flags,reason:'QUALITY_MULTI_SIGNAL_SUPPORT',research_only:true};
    return{status:'PENDING_EVIDENCE',support_count,flags,reason:'QUALITY_LAYER_NEEDS_MULTI_SIGNAL_SUPPORT',research_only:true};
  }
  if(layer==='ESCAPE_WATCH'){
    if(flags.preferred_market&&support_count>=3)return{status:'RETAIN_FOR_FINAL_REVIEW',support_count,flags,reason:'LOCKED_700_ESCAPE_WITH_THREE_SIGNAL_SUPPORT',research_only:true};
    return{status:'PENDING_EVIDENCE',support_count,flags,reason:'ESCAPE_WATCH_REQUIRES_STRONGER_CORROBORATION',research_only:true};
  }
  return{status:'PENDING_EVIDENCE',support_count,flags,reason:'UNKNOWN_LAYER',research_only:true};
}

const layerRank={CORE:0,PROTECTED_POOL:1,QUALITY_VALUE_POOL:2,ESCAPE_WATCH:3,OUTSIDE_PRIMARY_POOL:9};
function boolRank(v){return v?0:1}
export function compareFinalReviewRows(a,b){
  const la=layerRank[a?.pool_layer]??9,lb=layerRank[b?.pool_layer]??9;if(la!==lb)return la-lb;
  const af=a?.shortlist?.flags||{},bf=b?.shortlist?.flags||{};
  for(const k of ['preferred_market','confirmed_lineup','bbe_support','exact_side_park']){const d=boolRank(af[k])-boolRank(bf[k]);if(d)return d}
  const sc=(Number(b?.shortlist?.support_count)||0)-(Number(a?.shortlist?.support_count)||0);if(sc)return sc;
  const gc=(Number(b?.gate_count)||0)-(Number(a?.gate_count)||0);if(gc)return gc;
  return(Number(a?.player_id)||0)-(Number(b?.player_id)||0);
}

export function buildFinalReviewQueue(rows=[],maxRows=V38_POOL_SHORTLIST_V2.review_queue_max){
  const retained=rows.filter(r=>r?.shortlist?.status==='RETAIN_FOR_FINAL_REVIEW'),core=retained.filter(r=>r.pool_layer==='CORE').sort(compareFinalReviewRows),noncore=retained.filter(r=>r.pool_layer!=='CORE').sort(compareFinalReviewRows),max=Math.max(0,Number(maxRows)||0),capacity=Math.max(0,max-core.length),queue=core.concat(noncore.slice(0,capacity));
  return{queue,retained_count:retained.length,trimmed_count:Math.max(0,retained.length-queue.length),max_rows:max,core_overflow:core.length>max,pool_target_forced:false,research_only:true};
}
