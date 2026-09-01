import fs from'node:fs/promises';
import{RESEARCH_GATE_ORDER}from'./research-status-core.mjs';
const s=await fs.readFile('api/research-status.js','utf8');
for(const k of RESEARCH_GATE_ORDER)if(!s.includes(`${k}:`))throw Error('missing gate '+k);
for(const x of ["production_source:'ZIP'","direct_mode:'RESEARCH_ONLY'","scoring_enabled:false","pool_before_tickets:true"])if(!s.includes(x))throw Error('missing contract '+x);
for(const x of ['legacy_lenses','sharp_money','steam','sweet_spot','tired_pen','double_edge'])if(!s.includes(x))throw Error('missing lens status '+x);
console.log('RESEARCH STATUS PASS');
