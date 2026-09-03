export const V38_POOL_ARCHITECTURE_V2=Object.freeze({
  protocol:'V38_POOL_ARCHITECTURE_V2',
  preregistered_at:'2026-09-03',
  first_prospective_date:'2026-09-04',
  research_only:true,
  scoring_enabled:false,
  scoring_eligible:false,
  model_scoring_changed:false,
  production_rule_changed:false,
  final_pool_promoted:false,
  pool_target_forced:false,
  target_role:'TARGET_ONLY_NOT_FORCED',
  cumulative_soft_targets:Object.freeze({core:[2,6],through_protected:[8,14],through_quality:[16,23],with_escape_max:25}),
  principles:Object.freeze([
    'CORE_GATE_UNCHANGED',
    'PROTECT_5OF6_WITHOUT_REQUIRING_NIGHTLY_UPGRADE',
    'KEEP_4OF6_PLUS_ISO_AS_QUALITY_LAYER',
    'GENERIC_4OF6_WITHOUT_ISO_NOT_PRIMARY_POOL',
    'LOCKED_700_4OF6_MAY_ENTER_ESCAPE_WATCH_ONLY',
    'NEVER_WEAKEN_GATE_TO_FILL_TARGET',
    'NO_RETROSPECTIVE_RECLASSIFICATION'
  ]),
  deliberate_review_required:true
});

const CORE=new Set(['CORE_PROTECTED_PLUS','CORE_PROTECTED','CORE_QUALITY_PLUS','CORE_QUALITY']);
const QUALITY=new Set(['QUALITY_WITH_BBE_SUPPORT','QUALITY_PROFILE']);

export function classifyPoolLayer({priority_band,quality_tier,american_odds,longshot_policy}={}){
  if(CORE.has(priority_band))return'CORE';
  if(priority_band==='STRONG_PROFILE'&&quality_tier==='PROTECTED_5OF6_PLUS')return'PROTECTED_POOL';
  if(QUALITY.has(priority_band)&&quality_tier==='QUALITY_4OF6_PLUS_ISO')return'QUALITY_VALUE_POOL';
  const odds=Number(american_odds);
  const locked700=Number.isFinite(odds)&&odds>=700&&longshot_policy?.applicable===true&&longshot_policy?.qualifies===true;
  if(priority_band==='WATCH_BASE_ELIGIBLE'&&quality_tier==='BASE_ELIGIBLE_4OF6'&&locked700)return'ESCAPE_WATCH';
  return'OUTSIDE_PRIMARY_POOL';
}

export function isStructuredPoolLayer(layer){return['CORE','PROTECTED_POOL','QUALITY_VALUE_POOL','ESCAPE_WATCH'].includes(layer)}
