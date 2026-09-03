import assert from 'node:assert/strict';
import {buildResearchBoardPlan} from './api-handlers/research-board.js';

function feed(games){return{date:'2026-09-04',games,items:Array.from({length:games},(_,i)=>({gamePk:900000+i})),lineup_players:[],lineups:0,starters:games*2}}

for(const [games,ceiling] of [[6,20],[9,25],[15,30]]){
  const z=buildResearchBoardPlan(feed(games));
  assert.equal(z.policy.pool_architecture_protocol,'V38_POOL_ARCHITECTURE_V2');
  assert.equal(z.policy.shortlist_protocol,'V38_POOL_SHORTLIST_V3');
  assert.equal(z.policy.first_prospective_date,'2026-09-04');
  assert.equal(z.policy.dynamic_review_policy.slate_game_count,games);
  assert.equal(z.policy.dynamic_review_policy.ceiling,ceiling);
  assert.equal(z.policy.review_queue_no_minimum,true);
  assert.equal(z.policy.no_fill_to_target,true);
  assert.equal(z.policy.pool_target_forced,false);
  assert.equal(z.policy.production_rule_changed,false);
  assert.equal(z.policy.final_pool_promoted,false);
  assert.equal(z.pool_target_role,'TARGET_ONLY_NOT_FORCED');
}
console.log('RESEARCH_BOARD_V3_POLICY_PASS');
