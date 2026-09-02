import assert from'node:assert/strict';
import{buildResearchBoardPlan}from'./api-handlers/research-board.js';
import researchStatus from'./api-handlers/research-status.js';

const feed={date:'2026-09-02',games:1,lineups:2,starters:2,items:[{gamePk:1,away:'NYY',home:'BOS',awayStarter:'A',homeStarter:'B',awayStarterId:11,homeStarterId:22}],lineup_players:[
 {player:'Away Hitter',player_id:101,team:'NYY',matchup:'NYY @ BOS',lineup:1,opp_pitcher:'B',opp_pitcher_id:22,opp_pitcher_hand:'R',bat_side:'L',iso:.2},
 {player:'Home Hitter',player_id:202,team:'BOS',matchup:'BOS @ NYY',lineup:1,opp_pitcher:'A',opp_pitcher_id:11,opp_pitcher_hand:'L',bat_side:'R',iso:.21}
]};
const b=buildResearchBoardPlan(feed);
assert.equal(b.protocol,'V38_RESEARCH_BOARD_PLAN_V2');
assert.equal(b.research_only,true);assert.equal(b.scoring_enabled,false);assert.equal(b.scoring_eligible,false);assert.equal(b.model_scoring_changed,false);
assert.equal(b.pool_target_role,'TARGET_ONLY_NOT_FORCED');
assert.equal(b.automation.canonical_artifact_protocol,'V38_LIVE_RESEARCH_BOARD_V1');
assert.equal(b.automation.vig_dependency,'OPTIONAL_CROSS_CHECK_ONLY');
assert.equal(b.policy.pool_target_forced,false);
assert.equal(b.policy.longshot_700_min_odds,700);
assert.equal(b.policy.longshot_policy_scope,'ONLY_APPLIES_AT_+700_OR_LONGER');
assert.equal(b.policy.hierarchy_rules.includes('NEVER_WEAKEN_GATE_TO_FILL_POOL'),true);
assert.equal(b.counts.hitters,2);assert.equal(b.counts.profile_batches,1);assert.equal(b.counts.pitchfit_requests,2);assert.equal(b.counts.bbe_batches,1);
assert.match(b.hydration.profile.batches[0].url,/profile-v38-candidate/);assert.match(b.hydration.recent_bbe.batches[0].url,/player-bbe-native/);assert.match(b.hydration.market.url,/market-native/);
assert.equal(b.hitters[0].opp_pitcher_id,22);assert.equal(b.hitters[0].profile_status,'PENDING');
assert.deepEqual(b.flow,['IDENTITY_LINEUP_STARTER','PROFILE_V38','PITCHFIT','RECENT_BBE','MARKET','RESEARCH_POOL_HIERARCHY','IMMUTABLE_INTRADAY_BOARD']);
let statusBody=null,statusCode=null;const res={status(n){statusCode=n;return this},json(x){statusBody=x;return x}};researchStatus({},res);
assert.equal(statusCode,200);assert.equal(statusBody.automated_research_flow,true);assert.equal(statusBody.canonical_research_board_protocol,'V38_LIVE_RESEARCH_BOARD_V1');assert.equal(statusBody.vig_dependency,'OPTIONAL_CROSS_CHECK_ONLY');assert.equal(statusBody.gates.automation.status,'LIVE_RESEARCH_BOARD_ACTIVE');assert.equal(statusBody.scoring_enabled,false);assert.equal(statusBody.pool_before_tickets,true);
console.log('V38_RESEARCH_BOARD_CONTRACT_OK');
