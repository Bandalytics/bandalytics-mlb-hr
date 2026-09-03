import assert from'node:assert/strict';
import crypto from'node:crypto';
import{selectLatestPregameContext,contextForGame,validContextSnapshot}from'./v38-context-selector.mjs';
const base={context_protocol:'V38_CONTEXT_SNAPSHOT_V1',point_in_time:true,research_only:true,scoring_enabled:false,scoring_eligible:false,pregame_games:[{gamePk:1,away:'NYY',home:'BOS'}],lineup_rows:[],market_rows:[]};
function signed(x){const body={...x};const sha256=crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');return{...body,sha256};}
const a=signed({...base,captured_at:'2026-09-02T14:00:00Z'}),b=signed({...base,captured_at:'2026-09-02T17:00:00Z'}),late=signed({...base,captured_at:'2026-09-02T23:00:00Z'}),bad=signed({...base,captured_at:'2026-09-02T18:00:00Z',scoring_enabled:true}),tampered={...b,lineup_rows:[{player_id:999}]};
assert.equal(validContextSnapshot(a),true);assert.equal(validContextSnapshot(bad),false);assert.equal(validContextSnapshot(tampered),false);
assert.equal(selectLatestPregameContext([a,b,late,bad,tampered],1,'2026-09-02T22:00:00Z').sha256,b.sha256);
assert.equal(selectLatestPregameContext([late],1,'2026-09-02T22:00:00Z'),null);
assert.equal(selectLatestPregameContext([a,b],2,'2026-09-02T22:00:00Z'),null);
assert.equal(contextForGame(b,1).game.home,'BOS');
console.log('V38 CONTEXT SELECTOR PASS');
