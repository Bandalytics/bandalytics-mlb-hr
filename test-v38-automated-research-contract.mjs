import assert from'node:assert/strict';
import{buildResearchBoardPlan}from'./api-handlers/research-board.js';
import researchStatus from'./api-handlers/research-status.js';

const feed={date:'2026-09-02',games:1,lineups:2,starters:2,items:[{gamePk:1}],lineup_players:[{player:'Test Hitter',player_id:123,team:'AAA',matchup:'AAA @ BBB',lineup:3,opp_pitcher:'Test Pitcher',opp_pitcher_id:456,opp_pitcher_hand:'R',iso:.2}]};
const board=buildResearchBoardPlan(feed);
assert.equal(board.protocol,'V38_RESEARCH_BOARD_PLAN_V2');
assert.equal(board.automation.canonical_artifact_protocol,'V38_LIVE_RESEARCH_BOARD_V1');
assert.equal(board.automation.vig_dependency,'OPTIONAL_CROSS_CHECK_ONLY');
assert.equal(board.policy.longshot_700_min_odds,700);
assert.equal(board.policy.longshot_policy_scope,'ONLY_APPLIES_AT_+700_OR_LONGER');
assert.equal(board.policy.pool_target_forced,false);
assert.equal(board.policy.hierarchy_rules.includes('NEVER_WEAKEN_GATE_TO_FILL_POOL'),true);
assert.equal(board.research_only,true);
assert.equal(board.scoring_enabled,false);
assert.equal(board.scoring_eligible,false);

let body=null,statusCode=null;
const res={status(n){statusCode=n;return this},json(x){body=x;return x}};
researchStatus({},res);
assert.equal(statusCode,200);
assert.equal(body.automated_research_flow,true);
assert.equal(body.canonical_research_board_protocol,'V38_LIVE_RESEARCH_BOARD_V1');
assert.equal(body.vig_dependency,'OPTIONAL_CROSS_CHECK_ONLY');
assert.equal(body.gates.automation.status,'LIVE_RESEARCH_BOARD_ACTIVE');
assert.equal(body.scoring_enabled,false);
assert.equal(body.pool_before_tickets,true);
console.log('V38 AUTOMATED RESEARCH CONTRACT PASS');
