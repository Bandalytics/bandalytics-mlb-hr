import fs from 'node:fs/promises';
const s=await fs.readFile('build.mjs','utf8');
for(const x of ["if(hb)hb.style.display='none'","isolated from this historical CSV","async function importCsv(file){ZIPDATE=slateDateFromNames([file.name]);ZIPMODE=classify(ZIPDATE)"])if(!s.includes(x))throw Error('historical reset/CSV guard missing '+x);
console.log('HISTORICAL MODE RESET PASS');
