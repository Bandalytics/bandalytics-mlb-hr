import fs from 'node:fs/promises';
const b=await fs.readFile('build.mjs','utf8');
for(const x of ["desired=ZIPDATE||ymd()","basis=lock?'LOCKED':(ZIPDATE===desired?'RECOMPUTED':'NO LOADED SLATE')","fetch('/api/results-identity?date='+encodeURIComponent(date)","if(busy&&['calibration','final','snapshot','daily','results'].includes(m)"]){if(!b.includes(x))throw Error('historical results isolation marker missing '+x)}
console.log('HISTORICAL RESULTS ISOLATION PASS');
