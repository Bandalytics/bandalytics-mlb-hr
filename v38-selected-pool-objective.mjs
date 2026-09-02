export const V38_SELECTED_POOL_OBJECTIVE=Object.freeze({
  id:'V38_SELECTED_POOL_OBJECTIVE_V1',
  population_base_hr_rate_role:'REFERENCE_ONLY',
  primary_optimization_metric:'SELECTED_POOL_HR_RATE',
  required_guardrail_metrics:Object.freeze(['HR_CAPTURE','QUALIFIED_POOL_SIZE','MULTI_SLATE_STABILITY']),
  market_validation_metrics:Object.freeze(['ACTUAL_700_PLUS_ODDS_LINK','MARKET_VALUE','PROSPECTIVE_OUTCOMES']),
  disallowed:Object.freeze([
    'REDEFINE_POPULATION_DENOMINATOR_TO_RAISE_BASE_RATE',
    'WEAKEN_LOCKED_GATES_TO_FORCE_POOL_SIZE',
    'PROMOTE_FROM_HISTORICAL_PROFILE_ONLY_WITHOUT_PROSPECTIVE_MARKET_VALIDATION'
  ]),
  research_only:true,
  scoring_enabled:false,
  scoring_eligible:false,
  deliberate_approval_required:true
});

export function validateSelectedPoolObjective(x=V38_SELECTED_POOL_OBJECTIVE){
  return x.population_base_hr_rate_role==='REFERENCE_ONLY'&&x.primary_optimization_metric==='SELECTED_POOL_HR_RATE'&&x.research_only===true&&x.scoring_enabled===false&&x.scoring_eligible===false&&x.disallowed.includes('WEAKEN_LOCKED_GATES_TO_FORCE_POOL_SIZE');
}
