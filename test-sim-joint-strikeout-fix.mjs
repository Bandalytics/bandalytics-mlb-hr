import assert from 'node:assert/strict';
import {simulateJointPlayerSelections} from './sim-joint-player-core.mjs';
import {simulateJointGamePlayer} from './sim-joint-game-player-core.mjs';

function seeded(seed){let x=seed>>>0;return()=>((x=(1664525*x+1013904223)>>>0)/4294967296)}
const stats={pa:500,avg:.245,rates:{single:.145,double:.045,triple:.004,hr:.031,bb:.085,k:.22},sbAttemptPerOnBase:.03,sbSuccess:.78};
const contexts=new Map([[1,{player:{player:'K Test',player_id:1,team:'TB',lineup:4},stats,teamExpectedRuns:4.45,starter:{},parkHrFactor:1,bbe:null}]]);
const a=simulateJointPlayerSelections({selections:[{playerId:1,market:'strikeouts2'}],playerContexts:contexts,sims:30000,rng:seeded(42)});
assert.equal(a.ok,true);assert(a.legs[0].probability>.20,'joint hitter simulator must use K as a direct plate-appearance outcome');
const b=simulateJointGamePlayer({away:'TB',home:'NYY',awayExpectedRuns:4.45,homeExpectedRuns:4.45,playerSelections:[{playerId:1,market:'strikeouts2'}],playerContexts:contexts,sims:30000,rng:seeded(43)});
assert.equal(b.ok,true);assert(b.legs[0].probability>.20,'joint game/player simulator must use K as a direct plate-appearance outcome');
console.log('JOINT STRIKEOUT FIX PASS');
