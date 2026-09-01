import fs from 'node:fs';import assert from 'node:assert/strict';
const p=fs.readFileSync('./api/sim-players.js','utf8'),j=fs.readFileSync('./api/sim-joint-game-player.js','utf8');
for(const [name,s] of [['players',p],['joint',j]]){
 assert.match(s,/hydrateGameStatsAsOf/);assert.match(s,/hydrateHittersAsOf/);assert.match(s,/historicalMode/);assert.match(s,/strictHistoricalInputs/);
}
console.log('historical route wiring test passed');
