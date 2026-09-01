import assert from 'node:assert/strict';import {noVigTwoWay,evalMarket,evalCrossGameParlay} from './market-eval-core.mjs';
const n=noVigTwoWay(-110,-110);assert(Math.abs(n.a-.5)<1e-9&&n.hold>0);
const x=evalMarket({modelProb:.55,americanOdds:+110,oppositeOdds:-130});assert(x.fairAmerican<0&&Number.isFinite(x.evPct));
const p=evalCrossGameParlay([{modelProb:.6},{modelProb:.5}],+300);assert(Math.abs(p.modelProb-.3)<1e-9&&Number.isFinite(p.evPct));
console.log('MARKET EVAL PASS');
