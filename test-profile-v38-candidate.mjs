import assert from'node:assert/strict';
import{V38_PROFILE_CANDIDATE,normalizeV38Candidate,v38CandidateReadiness}from'./profile-v38-candidate.mjs';

assert.equal(V38_PROFILE_CANDIDATE.model,'v38');
assert.equal(V38_PROFILE_CANDIDATE.scoring_eligible,false);
assert.equal(V38_PROFILE_CANDIDATE.fields.blast.semantic,'blasts_swing');

const judge=normalizeV38Candidate({bulk:{player_id:592450,ev:94.1,hard_hit:57.3,barrel:21.7,iso:.350,sweet_spot:33.6,pull:43.4,blast_contact:20.8,blast_swing:14.5},pullair:{player_id:592450,pull_air:18.2}});
assert.equal(judge.player_id,592450);
assert.equal(judge.pullair,18.2);
assert.equal(judge.blast,14.5);
assert.equal(judge.blast_contact_reference,20.8);
assert.equal(judge.v37_parity_verified,false);
assert.equal(judge.scoring_eligible,false);

assert.equal(v38CandidateReadiness().scoring_eligible,false);
assert.equal(v38CandidateReadiness({point_in_time_backtest:true,candidate_regression_pass:true,threshold_review:true,deliberate_cutover_approved:false}).scoring_eligible,false);
assert.equal(v38CandidateReadiness({point_in_time_backtest:true,candidate_regression_pass:true,threshold_review:true,deliberate_cutover_approved:true}).scoring_eligible,true);
console.log('V38 PROFILE CANDIDATE GATE PASS');
