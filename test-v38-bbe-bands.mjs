import assert from'node:assert/strict';
import{buildBbeBands}from'./v38-bbe-bands.mjs';
const rows=[5,8,10,12,14,16,18,22,26,30].map((hrshape,i)=>({tracked_bbe:15,bbe:{hrshape,contact:20+i*3,trend:i===9?'RISING':'FLAT'}}));rows.push({tracked_bbe:10,bbe:{hrshape:99,contact:99,trend:'RISING'}});
const b=buildBbeBands(rows);assert.equal(b.population,10);assert.equal(b.classify(rows.at(-1)).eligible,false);assert.equal(b.classify(rows[9]).hrshape_band,'TOP_DECILE');assert.equal(b.classify(rows[9]).rising,true);assert.equal(b.classify(rows[0]).hrshape_band,'BASE');assert.ok(b.hrshape_p90>b.hrshape_p75);console.log('V38 BBE BANDS PASS');
