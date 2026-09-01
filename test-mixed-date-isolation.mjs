import fs from 'node:fs';
const s=fs.readFileSync('build.mjs','utf8');
const req=[
  'v95 mixed-date isolation',
  'HISTORICAL ZIP ISOLATED',
  "Historical replay…",
  "ZIPDATE&&ZIPDATE!==z.date",
  "Current posted lineups",
  "is not mixed into"
];
for(const x of req) if(!s.includes(x)) throw Error('mixed-date guard missing: '+x);
if(!s.includes("sameLive=!ZIPDATE||window.__LIVE_FEED?.date===ZIPDATE")) throw Error('games same-date guard missing');
if(!s.includes("sameDate=!ZIPDATE||window.__LIVE_FEED?.date===ZIPDATE")) throw Error('lineups same-date guard missing');
console.log('MIXED DATE ISOLATION PASS');
