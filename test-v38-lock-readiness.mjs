import assert from 'node:assert/strict';
import {buildLockReadiness,LOCK_READINESS_PROTOCOL} from './scripts/build-v38-lock-readiness.mjs';
import {LOCKED_HR_MARKET_SCHEMA} from './v38-locked-policy-core.mjs';

const exactMarket=best=>({market_schema:LOCKED_HR_MARKET_SCHEMA,market_type:'MLB_BATTER_HOME_RUN_YES',identity_status:'EXACT',best_odds:best});
const base={ev:91,hh:42,barrel:12,iso:.22,pullair:24,blast:10};
const row=(id,profile,extra={})=>({player_id:id,player:`P${id}`,gamePk:100+id,matchup:'AAA @ BBB',start_time:'2026-09-21T23:00:00Z',profile,gate_count:extra.gate_count,final_review_queue:true,pool_layer:'PROTECTED_POOL',hierarchy:{priority_band:'STRONG_PROFILE'},context:{lineup:extra.lineup??3,confirmed_lineup:extra.confirmed_lineup??true,market:extra.market??null}});
const board={protocol:'V38_LIVE_RESEARCH_BOARD_V1',date:'2026-09-21',generated_at:'2026-09-21T21:00:00Z',profile_snapshot_sha256:'a'.repeat(64),point_in_time:true,research_only:true,rows:[
  row(1,base,{gate_count:6}),
  row(2,{...base,blast:7},{gate_count:5,confirmed_lineup:false,lineup:null}),
  row(3,{...base,blast:7,pullair:17},{gate_count:4,market:exactMarket(800),lineup:6}),
  row(4,{...base,blast:7,pullair:17},{gate_count:4,market:{best_odds:900},lineup:7}),
  row(5,{...base,blast:7,pullair:17,iso:.12},{gate_count:3,lineup:8})
]};
const z=buildLockReadiness(board);
assert.equal(z.protocol,LOCK_READINESS_PROTOCOL);
assert.equal(z.research_only,true);assert.equal(z.scoring_enabled,false);assert.equal(z.production_rule_changed,false);assert.equal(z.final_cut_promoted,false);
assert.deepEqual(z.counts,{review_rows:5,actionable_review:2,pending_lineup:1,price_blocked_4of6:1,policy_blocked:1});
assert.equal(z.rows.find(r=>r.player_id===1).readiness_state,'ACTIONABLE_REVIEW');
assert.equal(z.rows.find(r=>r.player_id===2).readiness_state,'PENDING_LINEUP');
assert.equal(z.rows.find(r=>r.player_id===3).readiness_state,'ACTIONABLE_REVIEW');
assert.equal(z.rows.find(r=>r.player_id===3).hr_price_source,'FROZEN_CONTEXT_MARKET');
assert.equal(z.rows.find(r=>r.player_id===4).readiness_state,'PRICE_BLOCKED_4OF6');
assert.equal(z.rows.find(r=>r.player_id===4).american_odds,null);
assert.equal(z.rows.find(r=>r.player_id===5).readiness_state,'POLICY_BLOCKED');
assert.match(z.sha256,/^[a-f0-9]{64}$/);
assert.throws(()=>buildLockReadiness({...board,point_in_time:false}),/point-in-time research board required/);
console.log('V38 LOCK READINESS CONTRACT PASS');
