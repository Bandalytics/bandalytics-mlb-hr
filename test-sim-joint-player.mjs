import assert from 'node:assert/strict';
import {simulateJointPlayerSelections} from './sim-joint-player-core.mjs';
let x=123456789;const rng=()=>((x=(1664525*x+1013904223)>>>0)/4294967296);
const stats={pa:500,avg:.280,rates:{single:.15,double:.05,triple:.005,hr:.06,bb:.09,k:.20},sbAttemptPerOnBase:.05,sbSuccess:.8};
const contexts=new Map([[1,{player:{player:'A',player_id:1,team:'TB',lineup:2},stats,teamExpectedRuns:5.1,starter:{HR9:1.5},parkHrFactor:1.1,bbe:null}],[2,{player:{player:'B',player_id:2,team:'TB',lineup:4},stats:{...stats,avg:.265},teamExpectedRuns:5.1,starter:{HR9:1.5},parkHrFactor:1.1,bbe:null}]]);
const out=simulateJointPlayerSelections({selections:[{playerId:1,market:'hit1'},{playerId:2,market:'tb2'}],playerContexts:contexts,sims:12000,rng});
assert.equal(out.ok,true);assert.equal(out.legs.length,2);assert.ok(out.joint.probability>0&&out.joint.probability<1);assert.ok(out.independenceBenchmark.probability>0);assert.ok(Number.isFinite(out.correlationLift));assert.equal(out.model,'SHARED_TEAM_AND_GAME_SHOCK_V1');
console.log('joint player sim: ok');
