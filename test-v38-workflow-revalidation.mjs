import assert from'node:assert/strict';
import{buildHistoricalBlastUrl,buildHistoricalStatcastUrl}from'./v38-historical-profile-core.mjs';
import{classifyWorkflowRevalidationRow,evaluateWorkflowRevalidation}from'./v38-workflow-revalidation-core.mjs';

const blast=new URL(buildHistoricalBlastUrl('2026-09-23'));
assert.equal(blast.searchParams.get('dateEnd'),'2026-09-22','Blast replay must stop before target slate');
const statcast=new URL(buildHistoricalStatcastUrl([1,2],'2026-09-23'));
assert.equal(statcast.searchParams.get('game_date_lt'),'2026-09-23','Statcast replay must exclude target slate');

const base={gate_count:6,pitchfit_band:'TOP_QUARTILE',bbe_hrshape_band:'TOP_QUARTILE',starter_hr9_band:'HIGH_GE_1_5'};
assert.deepEqual(classifyWorkflowRevalidationRow({...base,homer:true}),classifyWorkflowRevalidationRow({...base,homer:false}),'Outcome must not affect cohort assignment');

const missing={gate_count:5,pitchfit_band:'INELIGIBLE',bbe_hrshape_band:'INELIGIBLE',starter_hr9_band:'UNAVAILABLE'};
assert.equal(classifyWorkflowRevalidationRow(missing).anti_overcompression,true,'Missing evidence must not become an automatic cut');
assert.equal(classifyWorkflowRevalidationRow(missing).serial_compression_proxy,false);

const negative={gate_count:5,pitchfit_band:'INELIGIBLE',bbe_hrshape_band:'INELIGIBLE',starter_hr9_band:'LOW_LT_1_2'};
assert.equal(classifyWorkflowRevalidationRow(negative).concrete_negative,true);
assert.equal(classifyWorkflowRevalidationRow(negative).anti_overcompression,false);

const protected4={gate_count:4,pitchfit_band:'TOP_DECILE',bbe_hrshape_band:'TOP_DECILE',starter_hr9_band:'HIGH_GE_1_5'};
assert.equal(classifyWorkflowRevalidationRow(protected4).standard_qualified,false,'4/6 must fail closed without frozen historical price provenance');

const rows=[{...base,homer:true},{...base,homer:false},{...missing,homer:true},{...negative,homer:false},{...protected4,homer:true}];
const out=evaluateWorkflowRevalidation(rows);
assert.equal(out.cohorts.qualified_5plus.rows,4);
assert.equal(out.cohorts.qualified_5plus.hr,2);
assert.equal(out.cohorts.serial_compression_proxy.rows,2);
assert.equal(out.cohorts.serial_compression_proxy.hr,1);
assert.equal(out.cohorts.anti_overcompression.rows,3);
assert.equal(out.cohorts.anti_overcompression.hr,2);
console.log('V38 workflow revalidation tests passed');
