import fs from 'node:fs';
const s=fs.readFileSync('build.mjs','utf8');
for(const m of [
  'HISTORICAL SLATE',
  'Current live MLB feed is isolated from this historical ZIP',
  'id="historicalModeBanner"'
]) if(!s.includes(m)) throw Error('missing historical banner marker '+m);
console.log('HISTORICAL MODE BANNER PASS');
