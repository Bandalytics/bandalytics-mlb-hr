import assert from 'node:assert/strict';
import {calibrationSummary,aggregateCalibration} from './sim-calibration-core.mjs';
const mk=(date,gp,homeP,pa,ph,aa,ah,exact=.02)=>({date,gamePk:gp,away:'A',home:'H',estimates:{away:{expectedRuns:pa},home:{expectedRuns:ph}},sim:{fullGame:{homeWinPct:homeP*100},scoreGrid:{[`${aa}-${ah}`]:{probability:exact}}}});
const d1=calibrationSummary([mk('2026-08-29',1,.65,4,5,3,6,.025)],[{gamePk:1,awayRuns:3,homeRuns:6}],{date:'2026-08-29'});
const d2=calibrationSummary([mk('2026-08-30',2,.40,5,4,6,2,.015)],[{gamePk:2,awayRuns:6,homeRuns:2}],{date:'2026-08-30'});
assert.equal(d1.games,1);assert.equal(d1.rows[0].date,'2026-08-29');assert.equal(d1.winnerAccuracy,1);
const a=aggregateCalibration([{date:'2026-08-29',strictReady:true,summary:d1},{date:'2026-08-30',strictReady:false,summary:d2}]);
assert.equal(a.games,2);assert.equal(a.days,2);assert.equal(a.strictDays,1);assert.equal(a.daily.length,2);assert.ok(a.meanActualExactScoreProb>0);assert.ok(Number.isFinite(a.exactScoreLogLoss));
console.log('sim calibration range aggregation: ok');
