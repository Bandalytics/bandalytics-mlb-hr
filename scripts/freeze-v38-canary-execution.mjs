import fs from 'node:fs';
import crypto from 'node:crypto';

const [boardPath, planPath, priceSnapshotPath, outPathArg] = process.argv.slice(2);
if (!boardPath || !planPath) throw Error('Usage: node scripts/freeze-v38-canary-execution.mjs <daily-board.json> <execution-plan.json> [price-snapshot.json] [output.json]');
const board = JSON.parse(fs.readFileSync(boardPath,'utf8'));
const plan = JSON.parse(fs.readFileSync(planPath,'utf8'));
const priceSnapshot = priceSnapshotPath ? JSON.parse(fs.readFileSync(priceSnapshotPath,'utf8')) : null;

if (board.protocol !== 'V38_DAILY_RESEARCH_BOARD_V2' || board.point_in_time !== true) throw Error('invalid daily research board');
if (plan.protocol !== 'V38_CANARY_EXECUTION_PLAN_V1') throw Error('invalid canary plan');
if (!plan.plan_sha256) throw Error('canary plan missing plan_sha256');
const {plan_sha256:claimedPlanSha,...planBody}=plan;
const computedPlanSha=crypto.createHash('sha256').update(JSON.stringify(planBody)).digest('hex');
if(computedPlanSha!==claimedPlanSha) throw Error('canary plan sha256 mismatch');
const boardSha=crypto.createHash('sha256').update(JSON.stringify(board)).digest('hex');
if(plan.research_metadata?.source_board_sha256!==boardSha) throw Error('canary plan board provenance mismatch');
if (plan.date !== board.date) throw Error('date mismatch');
if(!/^2027-/.test(plan.date)) throw Error('regular-season forward canary freeze accepts 2027 dates only');
if (!plan.frozen_at || !Number.isFinite(Date.parse(plan.frozen_at))) throw Error('missing frozen_at');
if (!Array.isArray(plan.candidate_pool_player_ids) || !plan.candidate_pool_player_ids.length) throw Error('candidate pool missing');
if (!Array.isArray(plan.serious_board_player_ids) || !Array.isArray(plan.tickets)) throw Error('plan arrays missing');

let snapshotKind=null;
if(priceSnapshot){
  if(priceSnapshot.schema==='BANDALYTICS_MARKET_MOVEMENT_SNAPSHOT_V1') snapshotKind='MARKET_SNAPSHOT';
  else if(priceSnapshot.schema==='BANDALYTICS_MANUAL_PRICE_SNAPSHOT_V1') snapshotKind='MANUAL_PRICE_SNAPSHOT';
  else throw Error('invalid price snapshot schema');
  if(priceSnapshot.point_in_time!==true||priceSnapshot.date!==board.date) throw Error('invalid price snapshot');
  if(!priceSnapshot.captured_at||!Number.isFinite(Date.parse(priceSnapshot.captured_at))) throw Error('price snapshot missing captured_at');
  if(Date.parse(priceSnapshot.captured_at)>Date.parse(plan.frozen_at)) throw Error('price snapshot after execution freeze');
  if(!priceSnapshot.sha256) throw Error('price snapshot missing sha256');
  const {sha256:claimedPriceSha,...priceBody}=priceSnapshot;
  const computedPriceSha=crypto.createHash('sha256').update(JSON.stringify(priceBody)).digest('hex');
  if(computedPriceSha!==claimedPriceSha) throw Error('price snapshot sha256 mismatch');
  if(snapshotKind==='MANUAL_PRICE_SNAPSHOT'){
    if(priceSnapshot.canary_only!==true||priceSnapshot.production_normal_volume!==false) throw Error('unsafe manual price snapshot flags');
  }
}

const rows = new Map((board.rows||[]).map(r=>[Number(r.player_id),r]));
const snapshotRows = new Map((priceSnapshot?.rows||[]).map(r=>[Number(r.player_id),r]));
const planManual = new Map((plan.manual_prices||[]).map(r=>[Number(r.player_id),r]));
function validPriceTime(capturedAt,row){
  const t=Date.parse(capturedAt), freeze=Date.parse(plan.frozen_at), start=Date.parse(row?.start_time);
  return Number.isFinite(t)&&t<=freeze&&Number.isFinite(start)&&t<start;
}
function priceFor(id){
  const row=rows.get(Number(id));
  const s=snapshotRows.get(Number(id));
  if(snapshotKind==='MARKET_SNAPSHOT' && s && Number.isFinite(Number(s.best_odds)) && validPriceTime(priceSnapshot.captured_at,row)) return {american_odds:Number(s.best_odds),book:s.best_book||null,captured_at:priceSnapshot.captured_at,source:'MARKET_SNAPSHOT',snapshot_sha256:priceSnapshot.sha256};
  if(snapshotKind==='MANUAL_PRICE_SNAPSHOT' && s && Number.isFinite(Number(s.american_odds)) && validPriceTime(s.captured_at||priceSnapshot.captured_at,row)) return {american_odds:Number(s.american_odds),book:s.book||null,captured_at:s.captured_at||priceSnapshot.captured_at,source:'MANUAL_PRICE_SNAPSHOT',snapshot_sha256:priceSnapshot.sha256};
  const x=planManual.get(Number(id));
  if(x && Number.isFinite(Number(x.american_odds)) && x.captured_at && validPriceTime(x.captured_at,row)) return {american_odds:Number(x.american_odds),book:x.book||null,captured_at:x.captured_at,source:'MANUAL_FROZEN'};
  return null;
}
function qualified(r){
  if((r.profile_gate_count||0)>=5) return true;
  const p=priceFor(r.player_id);
  return r.profile_gate_count===4 && r.longshot_700_rule?.eligible===true && p && p.american_odds>=700;
}
function decimal(o){return o>0?1+o/100:1+100/(-o)}
function americanFromDecimal(d){if(!Number.isFinite(d)||d<=1)return null;const x=d>=2?(d-1)*100:-100/(d-1);return Math.round(x)}

const candidateIds=plan.candidate_pool_player_ids.map(Number);
if(new Set(candidateIds).size!==candidateIds.length) throw Error('duplicate candidate pool player');
const candidatePool=candidateIds.map((id,i)=>{
  const r=rows.get(id); if(!r) throw Error(`candidate pool player missing from board: ${id}`);
  if(Date.parse(r.start_time)<=Date.parse(plan.frozen_at)) throw Error(`candidate pool game already started: ${id}`);
  if(!qualified(r)) throw Error(`unqualified candidate pool player: ${id}`);
  return {...r,candidate_rank:i+1};
});
const candidateN=candidatePool.length;
const slateBand=candidateN<=50?'SMALL_LE_50':candidateN<=75?'MEDIUM_51_75':'LARGE_GE_76';
const seriousStrategy=slateBand==='SMALL_LE_50'?'PROFILE_FIRST':'PITCHFIT_FIRST';
if(plan.candidate_pool_ranking_strategy!==seriousStrategy) throw Error(`ranking strategy mismatch: expected ${seriousStrategy}`);
const seriousN=Math.max(1,Math.ceil(candidateN*0.40));
const expectedSeriousIds=candidateIds.slice(0,seriousN);
const seriousIds=plan.serious_board_player_ids.map(Number);
if(seriousIds.length!==seriousN || seriousIds.some((id,i)=>id!==expectedSeriousIds[i])) throw Error(`serious board must be top 40% of ordered candidate pool: expected ${seriousN}`);
const serious=expectedSeriousIds.map((id,i)=>({...rows.get(id),serious_rank:i+1}));

const seenPairs=new Set(), uses=new Map(serious.map(r=>[r.player_id,0]));
const tickets=[];
for(const [idx,t] of plan.tickets.entries()){
  const ids=(t.player_ids||[]).map(Number);
  if(ids.length!==2 || ids[0]===ids[1]) throw Error(`ticket ${idx+1} must be two distinct hitters`);
  const a=serious.find(r=>r.player_id===ids[0]), b=serious.find(r=>r.player_id===ids[1]);
  if(!a||!b) throw Error(`ticket ${idx+1} hitter outside serious board`);
  if(a.gamePk==null||b.gamePk==null||String(a.gamePk)===String(b.gamePk)) throw Error(`ticket ${idx+1} is not cross-game`);
  const key=[...ids].sort((x,y)=>x-y).join(':'); if(seenPairs.has(key)) throw Error(`duplicate pair ${key}`); seenPairs.add(key);
  uses.set(a.player_id,(uses.get(a.player_id)||0)+1); uses.set(b.player_id,(uses.get(b.player_id)||0)+1);
  const pa=priceFor(a.player_id), pb=priceFor(b.player_id);
  const priced=!!pa&&!!pb;
  const dec=priced?decimal(pa.american_odds)*decimal(pb.american_odds):null;
  const stake=Number(t.stake_units);
  if(!Number.isFinite(stake)||stake<=0) throw Error(`ticket ${idx+1} missing positive stake_units`);
  tickets.push({ticket_index:idx+1,player_ids:ids,players:[a.player,b.player],gamePks:[a.gamePk,b.gamePk],stake_units:+stake.toFixed(4),legs:[{player_id:a.player_id,player:a.player,price:pa},{player_id:b.player_id,player:b.player,price:pb}],fully_priced:priced,combined_decimal:dec?+dec.toFixed(4):null,combined_american:dec?americanFromDecimal(dec):null});
}

const maxTickets=Math.max(1,Math.ceil(seriousN*0.40));
if(tickets.length>maxTickets) throw Error(`ticket budget exceeded: ${tickets.length} > ${maxTickets}`);
const priorityN=Math.max(1,Math.ceil(seriousN*0.25));
for(const r of serious){
  const u=uses.get(r.player_id)||0;
  const cap=slateBand==='LARGE_GE_76' && r.serious_rank<=priorityN ? 2 : 1;
  if(u>cap) throw Error(`path cap exceeded for ${r.player_id}: ${u} > ${cap}`);
}

const zeroReasons=new Map((plan.intentional_zeros||[]).map(z=>[Number(z.player_id),String(z.reason||'').trim()]));
for(const r of serious){if((uses.get(r.player_id)||0)===0 && !zeroReasons.get(r.player_id)) throw Error(`missing intentional-zero reason for ${r.player_id}`)}
const ticketedIds=new Set(tickets.flatMap(t=>t.player_ids));
const pricedLegs=tickets.flatMap(t=>t.legs).filter(l=>l.price).length;
const totalLegs=tickets.length*2;
const totalStake=+tickets.reduce((s,t)=>s+t.stake_units,0).toFixed(4);
const output={
  protocol:'V38_CANARY_EXECUTION_FREEZE_V2',architecture_contract:'HOLDOUT_ALIGNED_40PCT_SERIOUS_BOARD_V1',date:plan.date,frozen_at:plan.frozen_at,canary_only:true,production_normal_volume:false,
  source_plan_sha256:computedPlanSha,source_board_protocol:board.protocol,source_board_generated_at:board.generated_at,source_board_sha256:boardSha,
  price_snapshot_used:!!priceSnapshot,price_snapshot_kind:snapshotKind,price_snapshot_captured_at:priceSnapshot?.captured_at||null,price_snapshot_sha256:priceSnapshot?.sha256||null,
  market_snapshot_used:snapshotKind==='MARKET_SNAPSHOT',market_snapshot_captured_at:snapshotKind==='MARKET_SNAPSHOT'?priceSnapshot?.captured_at||null:null,market_snapshot_sha256:snapshotKind==='MARKET_SNAPSHOT'?priceSnapshot?.sha256||null:null,
  candidate_pool_contract:'ORDERED_OUTCOME_BLIND_POOL_WITH_SLATE_BAND_FROM_CANDIDATE_COUNT',candidate_pool_rows:candidateN,candidate_pool_ranking_strategy:seriousStrategy,large_priority_repeat_status:slateBand==='LARGE_GE_76'?'PROVISIONAL_FORWARD_REVALIDATION':'NOT_APPLICABLE',
  serious_board_contract:'TOP_40_PCT_OF_ORDERED_CANDIDATE_POOL',serious_board_share_pct:40,ticket_contract:'CROSS_GAME_TWO_LEG_SMALL_MEDIUM_ONE_PATH_LARGE_TOP25_SECOND_PATH',
  ticket_budget_share_pct:40,large_priority_repeat_share_pct:25,serious_board_rows:seriousN,slate_band:slateBand,max_ticket_budget:maxTickets,tickets:tickets.length,total_stake_units:totalStake,
  unique_ticketed_hitters:ticketedIds.size,board_coverage_pct:seriousN?+(100*ticketedIds.size/seriousN).toFixed(2):0,priced_legs:pricedLegs,total_legs:totalLegs,price_coverage_pct:totalLegs?+(100*pricedLegs/totalLegs).toFixed(2):0,
  candidate_pool:candidatePool.map(r=>({candidate_rank:r.candidate_rank,player_id:r.player_id,player:r.player,gamePk:r.gamePk,start_time:r.start_time,profile_gate_count:r.profile_gate_count})),
  serious_board:serious.map(r=>({serious_rank:r.serious_rank,player_id:r.player_id,player:r.player,gamePk:r.gamePk,start_time:r.start_time,profile_gate_count:r.profile_gate_count,price:priceFor(r.player_id),paths:uses.get(r.player_id)||0,intentional_zero_reason:(uses.get(r.player_id)||0)===0?zeroReasons.get(r.player_id):null})),
  tickets_detail:tickets,
  readiness:{candidate_pool_frozen:true,serious_board_share_compliant:true,slate_band_holdout_aligned:true,plan_hash_verified:true,plan_board_provenance_verified:true,price_snapshot_hash_verified:!priceSnapshot||!!priceSnapshot.sha256,all_ticket_legs_priced:totalLegs>0&&pricedLegs===totalLegs,all_ticket_stakes_frozen:tickets.length>0&&tickets.every(t=>t.stake_units>0),all_zero_paths_explained:true,cross_game_only:true,ticket_budget_compliant:true,path_caps_compliant:true},
  roi_status:pricedLegs===totalLegs&&totalLegs>0&&tickets.every(t=>t.stake_units>0)?'READY_FOR_POST_SLATE_SETTLEMENT':'BLOCKED_INCOMPLETE_FROZEN_PRICE_OR_STAKE',
  notes:['The execution plan SHA-256 is verified before any ticket membership or stake is accepted, and the plan must point to the exact daily-board hash used by this freeze.','Any automated or manual price snapshot is SHA-256 verified before frozen odds are accepted.','Slate band is derived from the candidate pool count using the validated <=50 / 51-75 / >=76 holdout bands, not from serious-board size.','The serious board is exactly the top 40% of the frozen ordered candidate pool, matching the holdout architecture.','No outcome data are accepted by this freeze step.','A 4/6 hitter is permitted only when the live frozen price is +700 or longer and the daily board marks the longshot rule eligible.','Every played canary ticket must freeze a positive stake_units value before first pitch so realized ROI cannot be backfilled.','A hashed manual price snapshot is an allowed temporary fallback when the automated market provider is unavailable; missing prices are never inferred.','This artifact is for controlled canary use and does not enable normal-volume production betting.']
};
const {sha256:_,...without}=output; output.sha256=crypto.createHash('sha256').update(JSON.stringify(without)).digest('hex');
const outPath=outPathArg||`snapshots/v38-canary-execution-freeze-${plan.date}.json`;
fs.mkdirSync(outPath.split('/').slice(0,-1).join('/')||'.',{recursive:true}); fs.writeFileSync(outPath,JSON.stringify(output,null,2)+'\n');
console.log(`V38_CANARY_EXECUTION_FREEZE_PATH=${outPath}`);
console.log(`V38_CANARY_EXECUTION_FREEZE_SUMMARY=${JSON.stringify({date:output.date,candidate_pool_rows:candidateN,serious_board_rows:seriousN,slate_band:slateBand,tickets:output.tickets,max_ticket_budget:maxTickets,total_stake_units:totalStake,price_snapshot_kind:snapshotKind,price_coverage_pct:output.price_coverage_pct,roi_status:output.roi_status})}`);
