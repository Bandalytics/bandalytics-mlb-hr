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
  role:'EVIDENCE_READINESS_FILTER_INSIDE_LAYERED_RESEARCH_POOL',
  notes:Object.freeze([
    'CORE_ALWAYS_RETAINED_FOR_RESEARCH_REVIEW',
    'NONCORE_REQUIRES_MULTIPLE_INDEPENDENT_SUPPORT_SIGNALS',
    'PARK_IS_SUPPORT_ONLY_AND_NEVER_STANDALONE',
    'MISSING_EVIDENCE_IS_PENDING_NOT_AUTOMATIC_NEGATIVE',
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
