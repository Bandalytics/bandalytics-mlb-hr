import assert from 'node:assert/strict';
import fs from 'node:fs';
const s=fs.readFileSync('scripts/capture-market-movement-snapshot.mjs','utf8');
for(const x of [
  'BANDALYTICS_MARKET_MOVEMENT_SNAPSHOT_V1',
  '/api/market-native?date=',
  '/api/projected-lineups?date=',
  'point_in_time:true',
  'append_only:true',
  'research_only:true',
  'scoring_enabled:false',
  'scoring_eligible:false',
  'model_scoring_changed:false',
  'profile_gate_changed:false',
  'longshot_rule_changed:false',
  'no_forced_pool:true',
  'LINEUP_CONFIRMED',
  'open_to_current_pp',
  'books_with_open',
  'IMMUTABLE_SNAPSHOT_EXISTS'
]) assert.ok(s.includes(x),`missing ${x}`);
assert.ok(!s.includes('scoring_enabled:true'));
assert.ok(!s.includes('model_scoring_changed:true'));
console.log('MARKET MOVEMENT SNAPSHOT CONTRACT PASS');
