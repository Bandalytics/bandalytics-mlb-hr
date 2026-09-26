import fs from 'node:fs';
import {execFileSync,spawnSync} from 'node:child_process';
fs.mkdirSync('tmp',{recursive:true});
const rows=[];
for(let i=1;i<=20;i++) rows.push({player_id:i,player:`P${i}`,gamePk:Math.ceil(i/2),lineup_slot:i%9+1,gate_count:i<=8?6:5,homer:i===1||i===3||i===9,pitchfit_band:i<=10?'TOP_DECILE':'BASE_TRUE',bbe_hrshape_band:i%3===0?'TOP_QUARTILE':'BASE',starter_hr9_band:i%4===0?'HIGH_GE_1_5':'MID_1_2_TO_1_5',revalidation:{anti_overcompression:true}});
const input={protocol:'V38_WORKFLOW_REVALIDATION_V1',date:'2026-06-15',point_in_time:true,as_of_verified:true,forward_leakage_days:0,rows};
fs.writeFileSync('tmp/no-lineup-input.json',JSON.stringify(input));
execFileSync('node',['scripts/evaluate-v38-ticket-no-lineup-revalidation.mjs','tmp/no-lineup-input.json'],{stdio:'inherit'});
const out=JSON.parse(fs.readFileSync('snapshots/v38-ticket-no-lineup-revalidation-2026-06-15.json','utf8'));
if(out.protocol!=='V38_TICKET_NO_LINEUP_REVALIDATION_V1'||out.sample!=='FRESH_HOLDOUT_2026_06_01_TO_07_10') throw Error('bad protocol/sample');
if(out.ranking_contract!=='LINEUP_SLOT_EXCLUDED_FROM_ALL_RANKING_KEYS') throw Error('lineup exclusion contract missing');
if(out.serious_board_rows!==8||out.slate_band!=='SMALL_LE_50'||out.serious_board_strategy!=='PROFILE_FIRST') throw Error('bad serious board contract');
for(const k of ['BUDGET_25_PCT_BOARD','BUDGET_33_PCT_BOARD','BUDGET_40_PCT_BOARD','BUDGET_50_PCT_BOARD']){
  const p=out.results[k]?.policies||{};
  for(const name of ['BROAD_ONE_PATH','PRIORITY_25_PCT_TWO_PATH_REST_ONE','PRIORITY_33_PCT_TWO_PATH_REST_ONE','PRIORITY_50_PCT_TWO_PATH_REST_ONE','UNIFORM_TWO_PATH']) if(!p[name]) throw Error(`missing ${k} ${name}`);
}
// Prove lineup slot cannot affect board ordering: reverse every slot and require identical output metrics.
for(const r of input.rows) r.lineup_slot=10-r.lineup_slot;
fs.writeFileSync('tmp/no-lineup-input-2.json',JSON.stringify(input));
execFileSync('node',['scripts/evaluate-v38-ticket-no-lineup-revalidation.mjs','tmp/no-lineup-input-2.json'],{stdio:'ignore'});
const out2=JSON.parse(fs.readFileSync('snapshots/v38-ticket-no-lineup-revalidation-2026-06-15.json','utf8'));
if(JSON.stringify(out.results)!==JSON.stringify(out2.results)||out.serious_board_hr!==out2.serious_board_hr) throw Error('lineup slot changed ranking/ticket results');
const bad={...input,forward_leakage_days:1}; fs.writeFileSync('tmp/no-lineup-bad.json',JSON.stringify(bad));
const run=spawnSync('node',['scripts/evaluate-v38-ticket-no-lineup-revalidation.mjs','tmp/no-lineup-bad.json'],{encoding:'utf8'});
if(run.status===0||!String(run.stderr).includes('Invalid workflow revalidation artifact')) throw Error('leakage guard failed');
console.log('V38_TICKET_NO_LINEUP_REVALIDATION_TEST_OK');
