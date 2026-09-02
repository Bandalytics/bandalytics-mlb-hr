import fs from'node:fs/promises';

const finite=v=>v!==null&&v!==''&&Number.isFinite(+v);
const complete=x=>[x.ev,x.hh,x.barrel,x.iso,x.pullair,x.blast].every(finite);
const gates=[
  ['ev',x=>+x.ev>89],
  ['hh',x=>+x.hh>35],
  ['barrel',x=>+x.barrel>8],
  ['iso',x=>+x.iso>.180],
  ['pullair',x=>+x.pullair>18],
  ['blast',x=>+x.blast>8]
];
function combinations(a,k){const out=[];function rec(start,p){if(p.length===k){out.push([...p]);return}for(let i=start;i<a.length;i++){p.push(a[i]);rec(i+1,p);p.pop()}}rec(0,[]);return out}
const path=process.argv[2];if(!path)throw Error('usage: node scripts/analyze-v38-gate-combinations.mjs <snapshot.json>');
const z=JSON.parse(await fs.readFile(path,'utf8')),rows=(z.items||[]).filter(complete);
const passMap=rows.map(x=>Object.fromEntries(gates.map(([n,f])=>[n,f(x)])));
const gateRates=gates.map(([name])=>({gate:name,n:rows.length,pass:passMap.filter(r=>r[name]).length,pass_rate:+(100*passMap.filter(r=>r[name]).length/rows.length).toFixed(2)}));
const exactCounts=[0,1,2,3,4,5,6].map(k=>({passed_gates:k,n:passMap.filter(r=>Object.values(r).filter(Boolean).length===k).length}));
const comboStats=combinations(gates.map(x=>x[0]),4).map(combo=>{const n=passMap.filter(r=>combo.every(g=>r[g])).length;return{combo:combo.join('+'),n,share:+(100*n/rows.length).toFixed(2)}}).sort((a,b)=>a.share-b.share||a.combo.localeCompare(b.combo));
const coreRules=[
 ['4of6',r=>Object.values(r).filter(Boolean).length>=4],
 ['5of6',r=>Object.values(r).filter(Boolean).length>=5],
 ['6of6',r=>Object.values(r).filter(Boolean).length===6],
 ['4of6_barrel',r=>Object.values(r).filter(Boolean).length>=4&&r.barrel],
 ['4of6_iso',r=>Object.values(r).filter(Boolean).length>=4&&r.iso],
 ['4of6_barrel_or_iso',r=>Object.values(r).filter(Boolean).length>=4&&(r.barrel||r.iso)],
 ['4of6_barrel_and_iso',r=>Object.values(r).filter(Boolean).length>=4&&r.barrel&&r.iso],
 ['4of6_2selective',r=>Object.values(r).filter(Boolean).length>=4&&[r.ev,r.barrel,r.iso,r.pullair].filter(Boolean).length>=2]
].map(([rule,f])=>{const n=passMap.filter(f).length;return{rule,n,share:+(100*n/rows.length).toFixed(2)}});
console.log(JSON.stringify({snapshot:z.sha256,date:z.date,complete_profiles:rows.length,gate_rates:gateRates,exact_gate_counts:exactCounts,core_rules:coreRules,combos_4of6:comboStats},null,2));
