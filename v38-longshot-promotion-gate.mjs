export const V38_LONGSHOT_PROMOTION_GATE=Object.freeze({
  protocol:'V38_LONGSHOT_PROMOTION_GATE_V1',
  candidate:'QUALITY_4OF6_PLUS_ISO',
  min_historical_slates:10,
  min_historical_qualified:500,
  min_historical_hr:50,
  min_hr_capture_pct:45,
  min_lift_vs_base:1.35,
  min_positive_lift_slates_pct:70,
  min_prospective_final_slates:3,
  requires_prospective_confirmation:true,
  requires_threshold_review:true,
  requires_deliberate_approval:true,
  auto_promote:false,
  scoring_enabled:false
});
export function evaluateLongshotPromotion(e={}){
  const g=V38_LONGSHOT_PROMOTION_GATE;
  const checks={
    historical_slates:Number(e.historical_slates)>=g.min_historical_slates,
    historical_qualified:Number(e.historical_qualified)>=g.min_historical_qualified,
    historical_hr:Number(e.historical_hr)>=g.min_historical_hr,
    hr_capture:Number(e.hr_capture_pct)>=g.min_hr_capture_pct,
    lift:Number(e.lift_vs_base)>=g.min_lift_vs_base,
    positive_slates:Number(e.positive_lift_slates_pct)>=g.min_positive_lift_slates_pct,
    prospective:Number(e.prospective_final_slates)>=g.min_prospective_final_slates&&e.prospective_confirmed===true,
    threshold_review:e.threshold_review===true,
    deliberate_approval:e.deliberate_approval===true
  };
  return {protocol:g.protocol,candidate:g.candidate,checks,eligible_for_promotion:Object.values(checks).every(Boolean),auto_promote:false,scoring_enabled:false};
}
