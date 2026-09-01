import assert from 'node:assert/strict';import {calibrationSummary} from './sim-calibration-core.mjs';
const p=[{gamePk:1,away:'A',home:'B',estimates:{away:{expectedRuns:4},home:{expectedRuns:5}},sim:{fullGame:{homeWinPct:60}}},{gamePk:2,away:'C',home:'D',estimates:{away:{expectedRuns:3},home:{expectedRuns:4}},sim:{fullGame:{homeWinPct:55}}}];
const a=[{gamePk:1,awayRuns:3,homeRuns:6},{gamePk:2,awayRuns:5,homeRuns:2}];const s=calibrationSummary(p,a);assert.equal(s.games,2);assert(s.teamRunMAE>0&&s.moneylineBrier>0);console.log('SIM CALIBRATION PASS');
