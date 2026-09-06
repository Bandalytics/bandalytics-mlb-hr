import fs from 'node:fs/promises';

const path='dist/mobile/index.html';
let html=await fs.readFile(path,'utf8');
const old=`function lineup(g,t){return g.all.filter(x=>x.team===t).sort((a,b)=>a.lineup-b.lineup).filter(x=>!fcount()||passFilter(x)).map(x=>`;
const next=`function lineup(g,t){return g.all.filter(x=>x.team===t).sort((a,b)=>a.lineup-b.lineup).map(x=>`;
if(!html.includes(old)) throw new Error('Expected mobile lineup renderer not found; refusing unsafe patch');
html=html.replace(old,next);
if(html.includes(`sort((a,b)=>a.lineup-b.lineup).filter(x=>!fcount()||passFilter(x)).map(x=>`)) throw new Error('Lineup filter still present after integrity patch');
await fs.writeFile(path,html,'utf8');
console.log('Mobile lineup integrity patch applied: filters no longer remove lineup players');
