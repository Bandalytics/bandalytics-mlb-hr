import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

fs.mkdirSync('snapshots',{recursive:true});
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'v38-priority-tier-'));
const inputPath=path.join(tmp,'input.json');
const rows=[];
for(let i=1;i<=12;i++) rows.push({
  player_id:i,
  gate_count:i<=6?6:5,
  starter_hr9_band:i%3===0?'HIGH_GE_1_5':i%3===1?'MID_1_2_TO_1_5':'LOW_LT_1_2',
  pitchfit_band:i%2===0?'TOP_DECILE':'BASE_TRUE',
  lineup_slot:((i-1)%9)+1,
  bbe_hrshape_band:i%4===0?'TOP_QUARTILE':'BASE',
  homer:i===2||i===6||i===11,
  revalidation:{anti_overcompression:true}
});
const input={protocol:'V38_WORKFLOW_REVALIDATION_V1',date:'2026-08-01',point_in_time:true,as_of_verified:true,forward_leakage_days:0,rows};
fs.writeFileSync(inputPath,JSON.stringify(input));
execFileSync(process.execPath,['scripts/evaluate-v38-priority-tier-revalidation.mjs',inputPath],{cwd:process.cwd(),stdio:'pipe'});
const out=JSON.parse(fs.readFileSync('snapshots/v38-priority-tier-revalidation-2026-08-01.json','utf8'));
assert.equal(out.protocol,'V38_PRIORITY_TIER_REVALIDATION_V1');
assert.equal(out.serious_board.selected_n,4);
assert.equal(out.serious_board.rows,4);
assert.equal(out.tiers.PRIORITY_PLUS.rows+out.tiers.PRIORITY.rows+out.tiers.ONE_PATH.rows,out.serious_board.rows);
assert.equal(out.serious_board_contract,'PROFILE_FIRST_TOP_30_PCT_CEIL');
assert.equal(out.scoring_enabled,false);
const ids1=[...out.serious_board.player_ids];
const tiers1=Object.fromEntries(Object.entries(out.tiers).map(([k,v])=>[k,[...v.player_ids]]));
const altered={...input,rows:rows.map(r=>({...r,homer:!r.homer}))};
fs.writeFileSync(inputPath,JSON.stringify(altered));
execFileSync(process.execPath,['scripts/evaluate-v38-priority-tier-revalidation.mjs',inputPath],{cwd:process.cwd(),stdio:'pipe'});
const out2=JSON.parse(fs.readFileSync('snapshots/v38-priority-tier-revalidation-2026-08-01.json','utf8'));
assert.deepEqual(out2.serious_board.player_ids,ids1);
for(const k of Object.keys(tiers1)) assert.deepEqual(out2.tiers[k].player_ids,tiers1[k]);
fs.unlinkSync('snapshots/v38-priority-tier-revalidation-2026-08-01.json');
console.log('v38 priority tier revalidation tests passed');
