import assert from'node:assert/strict';
import{evaluateProfileCutover,currentV37ProfileGate}from'./profile-cutover-gate.mjs';

const current=currentV37ProfileGate();
assert.equal(current.requested_model,'v37');
assert.equal(current.scoring_eligible,false);
assert.deepEqual(current.missing_exact_fields,['pullair','blast']);

const fakeLegacy=evaluateProfileCutover({requested_model:'v37',exact_ev:true,exact_hh:true,exact_barrel:true,exact_iso:true,exact_sweet:true,exact_pullair:true,exact_blast:false,legacy_regression_pass:true});
assert.equal(fakeLegacy.scoring_eligible,false,'v37 must fail closed when either exact legacy field is missing');

const exactLegacy=evaluateProfileCutover({requested_model:'v37',exact_ev:true,exact_hh:true,exact_barrel:true,exact_iso:true,exact_sweet:true,exact_pullair:true,exact_blast:true,legacy_regression_pass:true});
assert.equal(exactLegacy.scoring_eligible,true);

const disguised=evaluateProfileCutover({requested_model:'v37',versioned_metric_definitions:true,historical_backtest_pass:true,candidate_regression_pass:true,deliberate_cutover_approved:true});
assert.equal(disguised.scoring_eligible,false,'replacement definitions cannot masquerade as v37');

const unapproved=evaluateProfileCutover({requested_model:'v38',versioned_metric_definitions:true,historical_backtest_pass:true,candidate_regression_pass:true,deliberate_cutover_approved:false});
assert.equal(unapproved.scoring_eligible,false,'new model cannot cut over without deliberate approval');

const candidate=evaluateProfileCutover({requested_model:'v38',versioned_metric_definitions:true,historical_backtest_pass:true,candidate_regression_pass:true,deliberate_cutover_approved:true});
assert.equal(candidate.scoring_eligible,true);
assert.equal(candidate.mode,'VERSIONED_MIGRATION');

console.log('PROFILE CUTOVER GATE PASS');
