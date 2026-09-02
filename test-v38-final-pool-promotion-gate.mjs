import assert from'node:assert/strict';
import{V38_FINAL_POOL_PROMOTION_GATE,evaluateFinalPoolPromotion}from'./v38-final-pool-promotion-gate.mjs';
const g=V38_FINAL_POOL_PROMOTION_GATE;
const pass={historical_slates:g.min_historical_slates,historical_selected:g.min_historical_selected,historical_hr:g.min_historical_hr,selected_pool_lift_vs_base:g.min_selected_pool_lift_vs_base,hr_capture_pct:g.min_hr_capture_pct,positive_lift_slates_pct:g.min_positive_lift_slates_pct,prospective_final_slates:g.min_prospective_final_slates,prospective_selected:g.min_prospective_selected,prospective_hr:g.min_prospective_hr,context_coverage_pct:g.min_context_coverage_pct,modifier_evidence_coverage_pct:g.min_modifier_evidence_coverage_pct,market_band_report:true,escape_audit:true,pool_target_forced:false,threshold_review:true,deliberate_approval:true};
assert.equal(evaluateFinalPoolPromotion(pass).eligible_for_promotion,true);
for(const k of ['prospective_final_slates','selected_pool_lift_vs_base','context_coverage_pct','modifier_evidence_coverage_pct']){const x={...pass,[k]:0};assert.equal(evaluateFinalPoolPromotion(x).eligible_for_promotion,false,k)}
assert.equal(evaluateFinalPoolPromotion({...pass,pool_target_forced:true}).eligible_for_promotion,false);
assert.equal(evaluateFinalPoolPromotion({...pass,deliberate_approval:false}).eligible_for_promotion,false);
assert.equal(g.auto_promote,false);assert.equal(g.scoring_enabled,false);assert.equal(g.scoring_eligible,false);
console.log('V38_FINAL_POOL_PROMOTION_GATE_PASS');
