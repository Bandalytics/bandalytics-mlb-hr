import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'v38-ticket-'));
const inputPath=path.join(tmp,'input.json');
const rows=[];
for(let i=1;i<=10;i++){
  rows.push({
    player_id:i,
    player:`P${i}`,
    gamePk:i%2===0?200:100,
    lineup_slot:i,
    gate_count:i<=5?6:5,
    homer:i===1||i===2,
    pitchfit_band:i%2===0?'TOP_DECILE':'BASE_TRUE',
    bbe_hrshape_band:'BASE',
    starter_hr9_band:'MID_1_2_TO_1_5',
    revalidation:{anti_overcompression:true}
  });
}
const input={protocol:'V38_WORKFLOW_REVALIDATION_V1',date:'2026-08-01',point_in_time:true,as_of_verified:true,forward_leakage_days:0,rows};
fs.writeFileSync(inputPath,JSON.stringify(input));
fs.mkdirSync('snapshots',{recursive:true});
execFileSync(process.execPath,['scripts/evaluate-v38-ticket-architecture-revalidation.mjs',inputPath],{cwd:process.cwd(),stdio:'pipe'});
const out=JSON.parse(fs.readFileSync('snapshots/v38-ticket-architecture-revalidation-2026-08-01.json','utf8'));
assert.equal(out.protocol,'V38_TICKET_ARCHITECTURE_REVALIDATION_V1');
assert.equal(out.point_in_time,true);
assert.equal(out.forward_leakage_days,0);
assert.equal(out.research_only,true);
assert.equal(out.scoring_enabled,false);
assert.equal(out.slate_band,'SMALL_LE_50');
assert.equal(out.serious_board_strategy,'PROFILE_FIRST');
assert.equal(out.serious_board_rows,4);
assert.equal(out.architectures.ONE_PATH.max_hitter_uses,1);
assert.equal(out.architectures.TWO_PATH.max_hitter_uses,2);
assert.ok(out.architectures.TWO_PATH.tickets>=out.architectures.ONE_PATH.tickets);
assert.equal(out.ticket_contract,'DETERMINISTIC_GREEDY_CROSS_GAME_NO_DUPLICATE_PAIR_NO_OUTCOME_INPUT');
assert.equal(out.roi_status,'UNAVAILABLE_NOT_FABRICATED');
assert.equal(out.protected_4of6_status,'FAIL_CLOSED_NOT_EVALUATED');
console.log('v38 ticket architecture revalidation tests passed');
