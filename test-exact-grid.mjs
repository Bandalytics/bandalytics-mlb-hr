import assert from 'node:assert/strict';import {simulateGame} from './sim-core.mjs';
const s=simulateGame({away:'A',home:'H',awayExpectedRuns:4,homeExpectedRuns:5,sims:12000,includeScoreGrid:true});assert(s.scoreGrid&&s.scoreGrid['4-5']&&s.scoreGrid['4-5'].probability>0);console.log('EXACT GRID PASS');
