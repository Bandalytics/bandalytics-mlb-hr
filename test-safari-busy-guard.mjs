import fs from 'node:fs';
const s=fs.readFileSync('build.mjs','utf8');
for(const x of [
  "['calibration','final','snapshot','daily','results'].includes(m)",
  'HISTORICAL REPLAY IN PROGRESS',
  'This derived board is deferred until data loading finishes so Safari stays responsive',
  'UI-only'
]) if(!s.includes(x)) throw Error('Safari busy guard missing: '+x);
console.log('SAFARI BUSY GUARD PASS');
