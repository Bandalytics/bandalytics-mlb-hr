import assert from'node:assert/strict';
import{evaluateLongshotPromotion,V38_LONGSHOT_PROMOTION_GATE as G}from'./v38-longshot-promotion-gate.mjs';
const sixSlate={historical_slates:6,historical_qualified:394,historical_hr:72,hr_capture_pct:50.7,lift_vs_base:1.82,positive_lift_slates_pct:100,prospective_final_slates:0,prospective_confirmed:false,threshold_review:false,deliberate_approval:false};
const a=evaluateLongshotPromotion(sixSlate);assert.equal(a.eligible_for_promotion,false);assert.equal(a.checks.historical_slates,false);assert.equal(a.checks.historical_qualified,false);assert.equal(a.checks.prospective,false);assert.equal(a.scoring_enabled,false);assert.equal(G.auto_promote,false);
const complete={historical_slates:10,historical_qualified:500,historical_hr:50,hr_capture_pct:45,lift_vs_base:1.35,positive_lift_slates_pct:70,prospective_final_slates:3,prospective_confirmed:true,threshold_review:true,deliberate_approval:true};assert.equal(evaluateLongshotPromotion(complete).eligible_for_promotion,true);
console.log('V38 LONGSHOT PROMOTION GATE PASS');
