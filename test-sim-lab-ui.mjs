import fs from 'node:fs';
const s=fs.readFileSync('sim-lab.html','utf8');
const must=[
  'data-tab="exact"','data-tab="calibration"','id="exactBuilder"','id="calOut"',
  '/api/sim-exact-parlay','/api/sim-calibrate','/api/sim-calibrate-range','localYmd','same-game combinations stay blocked',
  'teamRunMAE','totalRunMAE','moneylineBrier','calRangeRun','exactScoreLogLoss','jointReadinessFile','/api/sim-research-readiness','Joint / SGP Research Readiness'
];
for(const x of must) if(!s.includes(x)) throw new Error(`missing ${x}`);
if(s.includes("date.value=new Date().toISOString().slice(0,10)")) throw new Error('UTC date initializer regressed');
console.log('SIM LAB UI PASS');
