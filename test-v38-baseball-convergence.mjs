import assert from'node:assert/strict';
import{evaluateBaseballConvergence}from'./v38-baseball-convergence.mjs';
const rows=[
 {homer:true,candidate_rules:{'5of6':true,'4of6_iso':true,'4of6_barrel_and_iso':true},pitchfit_band:'TOP_DECILE',bbe_band:{hrshape_band:'TOP_QUARTILE'}},
 {homer:false,candidate_rules:{'5of6':true,'4of6_iso':true,'4of6_barrel_and_iso':false},pitchfit_band:'BASE_TRUE',bbe_band:{hrshape_band:'TOP_DECILE'}},
 {homer:false,candidate_rules:{'5of6':false,'4of6_iso':true,'4of6_barrel_and_iso':true},pitchfit_band:'TOP_QUARTILE',bbe_band:{hrshape_band:'BASE'}}
];
const out=Object.fromEntries(evaluateBaseballConvergence(rows).map(x=>[x.rule,x]));
assert.equal(out['5of6+pitchfit_top_quartile'].qualified,1);
assert.equal(out['4of6_iso+pitchfit_top_quartile'].qualified,2);
assert.equal(out['4of6_barrel_and_iso+pitchfit_top_quartile'].qualified,2);
assert.equal(out['5of6+bbe_hrshape_top_quartile'].qualified,2);
assert.equal(out['4of6_iso+bbe_hrshape_top_quartile'].qualified,2);
assert.equal(out['5of6+pitchfit_top_quartile+bbe_hrshape_top_quartile'].qualified,1);
assert.equal(out['4of6_iso+pitchfit_top_quartile+bbe_hrshape_top_quartile'].qualified,1);
console.log('V38 BASEBALL CONVERGENCE PASS');
