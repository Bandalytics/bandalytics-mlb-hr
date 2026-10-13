import assert from 'node:assert/strict';
import {drawPlateAppearance} from './sim-player-core.mjs';

function sample(rates, n=120000) {
  const counts = new Map();
  for (let i=0;i<n;i++) {
    const outcome=drawPlateAppearance(rates);
    counts.set(outcome,(counts.get(outcome)||0)+1);
  }
  return Object.fromEntries([...counts].map(([k,v])=>[k,v/n]));
}

const ordinary=sample({single:.12,double:.05,triple:.006,hr:.06,bb:.09,k:.22});
assert(Math.abs((ordinary.K||0)-.22)<.01, 'K outcome should match the supplied per-PA strikeout rate');
assert((ordinary.HR||0)>0 && (ordinary.BB||0)>0, 'other mutually exclusive outcomes remain available');
assert(Math.abs(Object.values(ordinary).reduce((a,b)=>a+b,0)-1)<1e-12, 'outcome frequencies sum to one');

const saturated=sample({single:.5,double:.25,triple:.05,hr:.2,bb:.2,k:.22});
assert(Math.abs((saturated.K||0)-.22)<.01, 'high-power profile must preserve strikeout probability');
const offensive=(saturated['1B']||0)+(saturated['2B']||0)+(saturated['3B']||0)+(saturated.HR||0)+(saturated.BB||0);
assert(offensive<=.73, 'non-strikeout offensive outcomes respect the historical 72% cap within sampling error');
assert((saturated.OUT||0)>0, 'remaining probability is retained as non-strikeout outs');

const noK=sample({single:.14,double:.04,triple:.003,hr:.03,bb:.08,k:0});
assert((noK.K||0)===0, 'zero strikeout rate must never generate strikeouts');

console.log('STRIKEOUT OUTCOME FIX PASS');
