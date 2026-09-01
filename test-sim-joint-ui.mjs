import assert from 'node:assert/strict';
import fs from 'node:fs';
const h=fs.readFileSync(new URL('./sim-lab.html',import.meta.url),'utf8');
for(const token of ['data-tab="joint"','id="joint"','id="jointGame"','id="jointBuilder"','id="jointRun"','/api/sim-joint-game-player','correlation lift','renderJointGameOptions']) assert.ok(h.toLowerCase().includes(token.toLowerCase()),`missing ${token}`);
assert.ok(h.includes('selections.length+jointGameLegs.length<2'),'joint builder must require at least two total legs');
console.log('joint player UI: ok');
