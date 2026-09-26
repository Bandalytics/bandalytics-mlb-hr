import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
fs.mkdirSync('tmp/manual-price-fallback',{recursive:true});
const dir='tmp/manual-price-fallback',date='2026-09-26',captured='2026-09-26T19:50:00Z',frozen='2026-09-26T20:00:00Z',start='2026-09-26T23:00:00Z';
const rows=[
  {player_id:1,player:'A',gamePk:101,start_time:start,profile_gate_count:5},
  {player_id:2,player:'B',gamePk:102,start_time:start,profile_gate_count:5},
  {player_id:3,player:'C',gamePk:103,start_time:start,profile_gate_count:5},
  {player_id:4,player:'D',gamePk:104,start_time:start,profile_gate_count:5},
  {player_id:5,player:'E',gamePk:105,start_time:start,profile_gate_count:5},
  {player_id:6,player:'F',gamePk:106,start_time:start,profile_gate_count:4,longshot_700_rule:{eligible:true}}
];
const board={protocol:'V38_DAILY_RESEARCH_BOARD_V2',date,generated_at:'2026-09-26T18:00:00Z',point_in_time:true,rows};
const candidateIds=[1,2,6,3,4,5];
const plan={protocol:'V38_CANARY_EXECUTION_PLAN_V1',date,frozen_at:frozen,candidate_pool_player_ids:candidateIds,candidate_pool_ranking_strategy:'PROFILE_FIRST',serious_board_player_ids:candidateIds.slice(0,3),tickets:[{player_ids:[1,6],stake_units:1}],intentional_zeros:[{player_id:2,reason:'one-path coverage choice'}]};
const manual={protocol:'V38_MANUAL_PRICE_INPUT_V1',date,captured_at:captured,rows:rows.map(r=>({player_id:r.player_id,player:r.player,american_odds:r.player_id===6?800:500,book:'USER_BOOK',source_note:'pregame screenshot transcription'}))};
fs.writeFileSync(`${dir}/board.json`,JSON.stringify(board));
fs.writeFileSync(`${dir}/plan.json`,JSON.stringify(plan));
fs.writeFileSync(`${dir}/manual-input.json`,JSON.stringify(manual));
execFileSync('node',['scripts/capture-v38-manual-price-snapshot.mjs',`${dir}/manual-input.json`,`${dir}/manual-snapshot.json`],{stdio:'inherit'});
const snap=JSON.parse(fs.readFileSync(`${dir}/manual-snapshot.json`,'utf8'));
if(snap.schema!=='BANDALYTICS_MANUAL_PRICE_SNAPSHOT_V1'||snap.row_count!==6||!snap.sha256) throw Error('manual snapshot contract failed');
execFileSync('node',['scripts/freeze-v38-canary-execution.mjs',`${dir}/board.json`,`${dir}/plan.json`,`${dir}/manual-snapshot.json`,`${dir}/freeze.json`],{stdio:'inherit'});
const freeze=JSON.parse(fs.readFileSync(`${dir}/freeze.json`,'utf8'));
if(freeze.price_snapshot_kind!=='MANUAL_PRICE_SNAPSHOT'||freeze.market_snapshot_used!==false) throw Error('manual snapshot provenance missing');
if(freeze.price_coverage_pct!==100||freeze.roi_status!=='READY_FOR_POST_SLATE_SETTLEMENT') throw Error('manual prices did not make freeze settlement-ready');
if(!freeze.tickets_detail.flatMap(t=>t.legs).every(l=>l.price?.source==='MANUAL_PRICE_SNAPSHOT'&&l.price?.book==='USER_BOOK')) throw Error('manual price source not preserved');
if(freeze.serious_board.find(r=>r.player_id===6)?.price?.american_odds!==800) throw Error('protected 4/6 price provenance failed');
console.log('V38_MANUAL_PRICE_FALLBACK_TEST_OK');
