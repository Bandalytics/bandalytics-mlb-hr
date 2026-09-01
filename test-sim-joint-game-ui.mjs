import assert from 'node:assert/strict';
import fs from 'node:fs';
const h=fs.readFileSync(new URL('./sim-lab.html',import.meta.url),'utf8');
for(const token of ['id="jointGameMarket"','id="jointAddGame"','id="jointGameLegs"','home_tt_over','exact_score','score_band','/api/sim-joint-game-player','playerSelections:selections','gameSelections:jointGameLegs']) assert.ok(h.includes(token),`missing ${token}`);
assert.ok(h.includes('selections.length+jointGameLegs.length<2'));
console.log('joint game UI: ok');
