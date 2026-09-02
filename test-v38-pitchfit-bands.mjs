import assert from'node:assert/strict';
import{buildPitchfitBands}from'./v38-pitchfit-bands.mjs';
const rows=[35,40,45,50,55,60,65,70,75,80].map(fit_score=>({fit_score,fit_status:'TRUE'}));rows.push({fit_score:99,fit_status:'PENDING'});
const b=buildPitchfitBands(rows);assert.equal(b.population,10);assert.equal(b.classify({fit_score:99,fit_status:'PENDING'}),'INELIGIBLE');assert.equal(b.classify({fit_score:80,fit_status:'TRUE'}),'TOP_DECILE');assert.equal(b.classify({fit_score:70,fit_status:'TRUE'}),'TOP_QUARTILE');assert.equal(b.classify({fit_score:40,fit_status:'TRUE'}),'BASE_TRUE');assert.ok(b.p90>b.p75);console.log('V38 PITCHFIT BANDS PASS');
