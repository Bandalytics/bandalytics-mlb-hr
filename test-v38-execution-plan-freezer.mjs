import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {spawnSync} from 'node:child_process';

const good={date:'2026-09-21',rows:[
  {player:'A',final_cut:true,exposure_state:'PRIORITY',ticket_paths:2,opportunity_verified:true,observed_starting_lineup:true},
  {player:'B',final_cut:true,exposure_state:'ONE_PATH',ticket_paths:2},
  {player:'C',final_cut:true,exposure_state:'INTENTIONAL_ZERO',ticket_paths:0}
],tickets:[['A','B'],['A','B']]};
const badNonstarter={date:'2026-09-21',rows:[
  {player:'Bench',final_cut:true,exposure_state:'PRIORITY',ticket_paths:1,opportunity_verified:true,observed_starting_lineup:false},
  {player:'Other',final_cut:true,exposure_state:'ONE_PATH',ticket_paths:1}
],tickets:[['Bench','Other']]};
const badMismatch={date:'2026-09-21',rows:[
  {player:'A',final_cut:true,exposure_state:'PRIORITY',ticket_paths:2},
  {player:'B',final_cut:true,exposure_state:'ONE_PATH',ticket_paths:1}
],tickets:[['A','B']]};
await fs.writeFile('/tmp/execution-good.json',JSON.stringify(good));
await fs.writeFile('/tmp/execution-bad-nonstarter.json',JSON.stringify(badNonstarter));
await fs.writeFile('/tmp/execution-bad-mismatch.json',JSON.stringify(badMismatch));
let r=spawnSync(process.execPath,['scripts/freeze-v38-execution-plan.mjs','/tmp/execution-good.json'],{encoding:'utf8'});
assert.equal(r.status,0,r.stderr);
assert.match(r.stdout,/V38_EXECUTION_PLAN_FROZEN=/);
r=spawnSync(process.execPath,['scripts/freeze-v38-execution-plan.mjs','/tmp/execution-bad-nonstarter.json'],{encoding:'utf8'});
assert.notEqual(r.status,0);
assert.match(r.stderr,/verified nonstarter/);
r=spawnSync(process.execPath,['scripts/freeze-v38-execution-plan.mjs','/tmp/execution-bad-mismatch.json'],{encoding:'utf8'});
assert.notEqual(r.status,0);
assert.match(r.stderr,/ticket_paths mismatch/);
console.log('V38 EXECUTION PLAN FREEZER CONTRACT PASS');
