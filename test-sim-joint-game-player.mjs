import assert from 'node:assert/strict';
import {simulateJointGamePlayer} from './sim-joint-game-player-core.mjs';
let x=777;const rng=()=>((x=(1664525*x+1013904223)>>>0)/4294967296);
const stats={pa:500,avg:.275,rates:{single:.15,double:.05,triple:.005,hr:.055,bb:.09,k:.20},sbAttemptPerOnBase:.04,sbSuccess:.8};
const contexts=new Map([[1,{player:{player:'A',player_id:1,team:'TB',lineup:2},stats,teamExpectedRuns:5.0,starter:{HR9:1.4},parkHrFactor:1.05,bbe:null}]]);
const out=simulateJointGamePlayer({away:'NYM',home:'TB',awayExpectedRuns:4.1,homeExpectedRuns:5.0,playerSelections:[{playerId:1,market:'hit1'}],gameSelections:[{market:'home_ml'},{market:'game_over',line:8.5}],playerContexts:contexts,sims:15000,rng});
assert.equal(out.ok,true);assert.equal(out.legs.length,3);assert.ok(out.joint.probability>0&&out.joint.probability<1);assert.ok(out.independenceBenchmark.probability>0);assert.equal(out.model,'COUPLED_GAME_PLAYER_SHOCK_V1');
const exact=simulateJointGamePlayer({away:'A',home:'H',awayExpectedRuns:4,homeExpectedRuns:4,gameSelections:[{market:'exact_score',awayRuns:4,homeRuns:5}],sims:6000,rng});assert.equal(exact.ok,true);assert.ok(exact.legs[0].probability>0);
console.log('joint game+player sim: ok');
