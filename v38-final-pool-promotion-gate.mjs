export const V38_FINAL_POOL_PROMOTION_GATE=Object.freeze({
  protocol:'V38_FINAL_POOL_PROMOTION_GATE_V1',
  candidate:'GENERAL_HR_FINAL_POOL',
  primary_metric:'SELECTED_POOL_HR_RATE',
  min_historical_slates:10,
  min_historical_selected:200,
  min_historical_hr:35,
  min_selected_pool_lift_vs_base:1.50,
  min_hr_capture_pct:30,
  min_positive_lift_slates_pct:70,
  min_prospective_final_slates:3,
  min_prospective_selected:40,
  min_prospective_hr:6,
  min_context_coverage_pct:90,
  min_modifier_evidence_coverage_pct:80,
  pool_target:[20,25],
  pool_target_forced:false,
  requires_market_band_report:true,
  requires_escape_audit:true,
  requires_threshold_review:true,
  requires_deliberate_approval:true,
  auto_promote:false,
  research_only:true,
  scoring_enabled:false,
  scoring_eligible:false
});

const n=x=>Number(x);
export function evaluateFinalPoolPromotion(e={}){
  const g=V38_FINAL_POOL_PROMOTION_GATE;
  const checks={
    historical_slates:n(e.historical_slates)>=g.min_historical_slates,
    historical_selected:n(e.historical_selected)>=g.min_historical_selected,
    historical_hr:n(e.historical_hr)>=g.min_historical_hr,
    selected_pool_lift:n(e.selected_pool_lift_vs_base)>=g.min_selected_pool_lift_vs_base,
    hr_capture:n(e.hr_capture_pct)>=g.min_hr_capture_pct,
    positive_slates:n(e.positive_lift_slates_pct)>=g.min_positive_lift_slates_pct,
    prospective_slates:n(e.prospective_final_slates)>=g.min_prospective_final_slates,
    prospective_selected:n(e.prospective_selected)>=g.min_prospective_selected,
    prospective_hr:n(e.prospective_hr)>=g.min_prospective_hr,
    context_coverage:n(e.context_coverage_pct)>=g.min_context_coverage_pct,
    modifier_coverage:n(e.modifier_evidence_coverage_pct)>=g.min_modifier_evidence_coverage_pct,
    market_band_report:e.market_band_report===true,
    escape_audit:e.escape_audit===true,
    pool_target_not_forced:e.pool_target_forced!==true,
    threshold_review:e.threshold_review===true,
    deliberate_approval:e.deliberate_approval===true
  };
  return {protocol:g.protocol,candidate:g.candidate,checks,eligible_for_promotion:Object.values(checks).every(Boolean),auto_promote:false,research_only:true,scoring_enabled:false,scoring_eligible:false};
}
