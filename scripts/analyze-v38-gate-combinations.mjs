import fs from'node:fs/promises';
import{profileComplete}from'../v38-profile-validity.mjs';
import{V38_GATE_NAMES,V38_CANDIDATE_RULES,v38GatePasses}from'../v38-gate-rules.mjs';

function combinations(a,k){const out=[];function rec(start,p){if(p.length===k){out.push([...p]);return}for(let i=start;i<a.length;i++){p.push(a[i]);rec(i+1,p);p.pop()}}rec(0,[]);return out}
const path=process.argv[2];if(!path)throw Error('usage: node scripts/analyze-v38-gate-combinations.mjs <snapshot.json>');
const z=JSON.parse(await fs.readFile(path,'utf8')),rows=(z.items||[]).filter(profileComplete),passMap=rows.map(v38GatePasses);
const gateRates=V38_GATE_NAMES.map(name=>{const pass=passMap.filter(r=>r[name]).length;return{gate:name,n:rows.length,pass,pass_rate:+(100*pass/rows.length).toFixed(2)}});
const exactCounts=[0,1,2,3,4,5,6].map(k=>({passed_gates:k,n:passMap.filter(r=>Object.values(r).filter(Boolean).length===k).length}));
const comboStats=combinations(V38_GATE_NAMES,4).map(combo=>{const n=passMap.filter(r=>combo.every(g=>r[g])).length;return{combo:combo.join('+'),n,share:+(100*n/rows.length).toFixed(2)}}).sort((a,b)=>a.share-b.share||a.combo.localeCompare(b.combo));
const candidateRules=Object.entries(V38_CANDIDATE_RULES).map(([rule,f])=>{const n=passMap.filter(f).length;return{rule,n,share:+(100*n/rows.length).toFixed(2)}});
console.log(JSON.stringify({snapshot:z.sha256,date:z.date,complete_profiles:rows.length,gate_rates:gateRates,exact_gate_counts:exactCounts,candidate_rules:candidateRules,combos_4of6:comboStats},null,2));
