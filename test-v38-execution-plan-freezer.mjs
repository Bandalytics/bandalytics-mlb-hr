import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {spawnSync} from 'node:child_process';

const good={date:'2026-09-21',rows:[
  {player:'A',final_cut:true,exposure_state:'PRIORITY',ticket_paths:2,opportunity_verified:true,observed_starting_lineup:true,evidence_lanes:['PROFILE','HEAT','MATCHUP']},
  {player:'B',final_cut:true,exposure_state:'ONE_PATH',ticket_paths:2,lineup_type:'CONFIRMED',evidence_lanes:['PROFILE','VALUE']},
  {player:'C',final_cut:true,exposure_state:'INTENTIONAL_ZERO',ticket_paths:0,zero_path_reason:'Baseball-based no-ticket decision.',evidence_lanes:['PROFILE']}
],tickets:[['A','B'],['A','B']]};
const badNonstarter={date:'2026-09-21',rows:[
  {player:'Bench',final_cut:true,exposure_state:'PRIORITY',ticket_paths:1,opportunity_verified:true,observed_starting_lineup:false},
  {player:'Other',final_cut:true,exposure_state:'ONE_PATH',ticket_paths:1,opportunity_verified:true,observed_starting_lineup:true}
],tickets:[['Bench','Other']]};
const badMismatch={date:'2026-09-21',rows:[
  {player:'A',final_cut:true,exposure_state:'PRIORITY',ticket_paths:2,opportunity_verified:true,observed_starting_lineup:true},
  {player:'B',final_cut:true,exposure_state:'ONE_PATH',ticket_paths:1,opportunity_verified:true,observed_starting_lineup:true}
],tickets:[['A','B']]};
const badUnclassifiedZero={date:'2026-09-21',rows:[
  {player:'A',final_cut:true,exposure_state:'UNCLASSIFIED',ticket_paths:0}
],tickets:[]};
const badZeroReason={date:'2026-09-21',rows:[
  {player:'A',final_cut:true,exposure_state:'INTENTIONAL_ZERO',ticket_paths:0}
],tickets:[]};
const badUnknownOpportunity={date:'2026-09-21',rows:[
  {player:'A',final_cut:true,exposure_state:'ONE_PATH',ticket_paths:1},
  {player:'B',final_cut:true,exposure_state:'ONE_PATH',ticket_paths:1,opportunity_verified:true,observed_starting_lineup:true}
],tickets:[['A','B']]};
const badOutsideFinalCut={date:'2026-09-21',rows:[
  {player:'A',final_cut:false,exposure_state:'ONE_PATH',ticket_paths:1,opportunity_verified:true,observed_starting_lineup:true},
  {player:'B',final_cut:true,exposure_state:'ONE_PATH',ticket_paths:1,opportunity_verified:true,observed_starting_lineup:true}
],tickets:[['A','B']]};
const badLane={date:'2026-09-21',rows:[
  {player:'A',final_cut:true,exposure_state:'INTENTIONAL_ZERO',ticket_paths:0,zero_path_reason:'No path',evidence_lanes:['PROFILE','DBD']}
],tickets:[]};

for(const [name,obj] of Object.entries({good,badNonstarter,badMismatch,badUnclassifiedZero,badZeroReason,badUnknownOpportunity,badOutsideFinalCut,badLane})){
  await fs.writeFile(`/tmp/${name}.json`,JSON.stringify(obj));
}
const run=name=>spawnSync(process.execPath,['scripts/freeze-v38-execution-plan.mjs',`/tmp/${name}.json`],{encoding:'utf8'});
let r=run('good');
assert.equal(r.status,0,r.stderr);
assert.match(r.stdout,/V38_EXECUTION_PLAN_FROZEN=/);
for(const [name,pattern] of [
  ['badNonstarter',/verified nonstarter/],
  ['badMismatch',/ticket_paths mismatch/],
  ['badUnclassifiedZero',/requires INTENTIONAL_ZERO classification/],
  ['badZeroReason',/requires zero_path_reason/],
  ['badUnknownOpportunity',/requires verified lineup\/opportunity/],
  ['badOutsideFinalCut',/outside FINAL CUT/],
  ['badLane',/bad evidence lane DBD/]
]){
  r=run(name);assert.notEqual(r.status,0,`${name} should fail`);assert.match(r.stderr,pattern);
}
console.log('V38 EXECUTION PLAN FREEZER CONTRACT PASS');
