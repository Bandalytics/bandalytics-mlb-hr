import assert from'node:assert/strict';
import{preferredOdds,evaluateContextConvergence}from'./v38-context-eval.mjs';
assert.equal(preferredOdds(500),true);assert.equal(preferredOdds(1500),true);assert.equal(preferredOdds(499),false);assert.equal(preferredOdds(1501),false);assert.equal(preferredOdds(null),false);
const rows=[
 {homer:true,candidate_rules:{'4of6':true,'5of6':true,'4of6_barrel_and_iso':true},context:{confirmed_lineup:true,market:{signal:'STEAM',best_odds:650}}},
 {homer:false,candidate_rules:{'4of6':true,'5of6':false,'4of6_barrel_and_iso':false},context:{confirmed_lineup:true,market:{signal:'LINE_LENGTHENED',best_odds:550}}},
 {homer:false,candidate_rules:{'4of6':false,'5of6':false,'4of6_barrel_and_iso':false},context:{confirmed_lineup:false,market:{signal:'STEAM',best_odds:350}}}
];
const out=Object.fromEntries(evaluateContextConvergence(rows).map(x=>[x.rule,x]));
assert.equal(out['5of6+steam'].qualified,1);assert.equal(out['5of6+steam'].hr,1);assert.equal(out['4of6+preferred_odds'].qualified,2);assert.equal(out['4of6_barrel_and_iso+preferred_odds'].qualified,1);
console.log('V38 CONTEXT EVAL PASS');
