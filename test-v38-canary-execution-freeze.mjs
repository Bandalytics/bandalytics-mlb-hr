import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
fs.mkdirSync('tmp',{recursive:true});
const date='2026-09-26', start='2026-09-26T23:00:00Z';
const rows=Array.from({length:8},(_,i)=>({player_id:i+1,player:`P${i+1}`,gamePk:100+i,start_time:start,profile_gate_count:i===7?4:5,longshot_700_rule:i===7?{eligible:true}:{applies:false}}));
const board={protocol:'V38_DAILY_RESEARCH_BOARD_V2',date,generated_at:'2026-09-26T18:00:00Z',point_in_time:true,rows};
const boardSha=crypto.createHash('sha256').update(JSON.stringify(board)).digest('hex');
const sealPlan=body=>({...body,plan_sha256:crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex')});
const sealSnapshot=body=>({...body,sha256:crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex')});
const candidateIds=[1,2,3,8,4,5,6,7];
const plan=sealPlan({protocol:'V38_CANARY_EXECUTION_PLAN_V1',date,frozen_at:'2026-09-26T20:00:00Z',candidate_pool_player_ids:candidateIds,candidate_pool_ranking_strategy:'PROFILE_FIRST',serious_board_player_ids:candidateIds.slice(0,4),tickets:[{player_ids:[1,3],stake_units:1},{player_ids:[2,8],stake_units:.5}],intentional_zeros:[],research_metadata:{source_board_sha256:boardSha}});
const market=sealSnapshot({schema:'BANDALYTICS_MARKET_MOVEMENT_SNAPSHOT_V1',date,captured_at:'2026-09-26T19:55:00Z',point_in_time:true,rows:rows.map(r=>({player_id:r.player_id,best_odds:r.player_id===8?800:500,best_book:'BOOK'}))});
fs.writeFileSync('tmp/board.json',JSON.stringify(board)); fs.writeFileSync('tmp/plan.json',JSON.stringify(plan)); fs.writeFileSync('tmp/market.json',JSON.stringify(market));
execFileSync('node',['scripts/freeze-v38-canary-execution.mjs','tmp/board.json','tmp/plan.json','tmp/market.json','tmp/out.json'],{stdio:'inherit'});
const out=JSON.parse(fs.readFileSync('tmp/out.json','utf8'));
if(out.protocol!=='V38_CANARY_EXECUTION_FREEZE_V2'||out.architecture_contract!=='HOLDOUT_ALIGNED_40PCT_SERIOUS_BOARD_V1') throw Error('bad architecture contract');
if(out.source_plan_sha256!==plan.plan_sha256||out.source_board_sha256!==boardSha||out.readiness.plan_hash_verified!==true||out.readiness.plan_board_provenance_verified!==true) throw Error('plan provenance missing');
if(out.price_snapshot_sha256!==market.sha256||out.readiness.price_snapshot_hash_verified!==true) throw Error('price snapshot provenance missing');
if(out.candidate_pool_rows!==8||out.serious_board_rows!==4||out.serious_board_share_pct!==40||out.slate_band!=='SMALL_LE_50') throw Error('bad pool sizing');
if(out.tickets!==2||out.max_ticket_budget!==2||out.total_stake_units!==1.5) throw Error('bad ticket budget');
if(out.readiness.all_ticket_legs_priced!==true||out.roi_status!=='READY_FOR_POST_SLATE_SETTLEMENT') throw Error('price freeze failed');
if(out.serious_board.find(r=>r.player_id===8)?.profile_gate_count!==4) throw Error('4/6 protected longshot missing');

const tampered={...plan,tickets:plan.tickets.map((t,i)=>i? t:{...t,stake_units:9})};
fs.writeFileSync('tmp/plan-tampered.json',JSON.stringify(tampered));
const tamperRun=spawnSync('node',['scripts/freeze-v38-canary-execution.mjs','tmp/board.json','tmp/plan-tampered.json','tmp/market.json','tmp/tampered.json'],{encoding:'utf8'});
if(tamperRun.status===0||!String(tamperRun.stderr).includes('canary plan sha256 mismatch')) throw Error('tampered plan was not rejected');

const tamperedMarket={...market,rows:market.rows.map((r,i)=>i? r:{...r,best_odds:9999})};
fs.writeFileSync('tmp/market-tampered.json',JSON.stringify(tamperedMarket));
const marketTamperRun=spawnSync('node',['scripts/freeze-v38-canary-execution.mjs','tmp/board.json','tmp/plan.json','tmp/market-tampered.json','tmp/market-tampered-out.json'],{encoding:'utf8'});
if(marketTamperRun.status===0||!String(marketTamperRun.stderr).includes('price snapshot sha256 mismatch')) throw Error('tampered market snapshot was not rejected');

const wrongBoardPlan=sealPlan({...plan,research_metadata:{source_board_sha256:'not-the-board'},plan_sha256:undefined});
fs.writeFileSync('tmp/plan-wrong-board.json',JSON.stringify(wrongBoardPlan));
const wrongBoardRun=spawnSync('node',['scripts/freeze-v38-canary-execution.mjs','tmp/board.json','tmp/plan-wrong-board.json','tmp/market.json','tmp/wrong-board.json'],{encoding:'utf8'});
if(wrongBoardRun.status===0||!String(wrongBoardRun.stderr).includes('board provenance mismatch')) throw Error('wrong plan board provenance was not rejected');

const {plan_sha256:_,...badBody}=plan;
badBody.serious_board_player_ids=[1,2,3,4];
const bad=sealPlan(badBody); fs.writeFileSync('tmp/plan-bad.json',JSON.stringify(bad));
const run=spawnSync('node',['scripts/freeze-v38-canary-execution.mjs','tmp/board.json','tmp/plan-bad.json','tmp/market.json','tmp/bad.json'],{encoding:'utf8'});
if(run.status===0||!String(run.stderr).includes('top 40%')) throw Error('non-top-40 serious board was not rejected');

// Large-slate regression: band must come from 80-candidate pool, not 32-row serious board.
const largeRows=Array.from({length:80},(_,i)=>({player_id:1000+i,player:`L${i+1}`,gamePk:1000+i,start_time:start,profile_gate_count:5,longshot_700_rule:{applies:false}}));
const largeBoard={...board,rows:largeRows};
const largeBoardSha=crypto.createHash('sha256').update(JSON.stringify(largeBoard)).digest('hex');
const largeIds=largeRows.map(r=>r.player_id), largeSerious=largeIds.slice(0,32);
const largePlan=sealPlan({protocol:'V38_CANARY_EXECUTION_PLAN_V1',date,frozen_at:'2026-09-26T20:00:00Z',candidate_pool_player_ids:largeIds,candidate_pool_ranking_strategy:'PITCHFIT_FIRST',serious_board_player_ids:largeSerious,tickets:[{player_ids:[largeIds[0],largeIds[8]],stake_units:1},{player_ids:[largeIds[0],largeIds[9]],stake_units:1}],intentional_zeros:largeSerious.slice(1).filter(id=>![largeIds[8],largeIds[9]].includes(id)).map(id=>({player_id:id,reason:'synthetic coverage choice'})),research_metadata:{source_board_sha256:largeBoardSha}});
const largeMarket=sealSnapshot({schema:'BANDALYTICS_MARKET_MOVEMENT_SNAPSHOT_V1',date,captured_at:'2026-09-26T19:55:00Z',point_in_time:true,rows:largeRows.map(r=>({player_id:r.player_id,best_odds:500,best_book:'BOOK'}))});
fs.writeFileSync('tmp/large-board.json',JSON.stringify(largeBoard)); fs.writeFileSync('tmp/large-plan.json',JSON.stringify(largePlan)); fs.writeFileSync('tmp/large-market.json',JSON.stringify(largeMarket));
execFileSync('node',['scripts/freeze-v38-canary-execution.mjs','tmp/large-board.json','tmp/large-plan.json','tmp/large-market.json','tmp/large-out.json'],{stdio:'inherit'});
const largeOut=JSON.parse(fs.readFileSync('tmp/large-out.json','utf8'));
if(largeOut.candidate_pool_rows!==80||largeOut.serious_board_rows!==32||largeOut.slate_band!=='LARGE_GE_76'||largeOut.candidate_pool_ranking_strategy!=='PITCHFIT_FIRST') throw Error('large slate band regression');
if(largeOut.serious_board.find(r=>r.player_id===largeIds[0])?.paths!==2) throw Error('large top-25 repeat path not allowed');
console.log('V38_CANARY_EXECUTION_FREEZE_TEST_OK');
