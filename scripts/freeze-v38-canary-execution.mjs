import fs from 'node:fs';
import crypto from 'node:crypto';

const [boardPath, planPath, marketPath, outPathArg] = process.argv.slice(2);
if (!boardPath || !planPath) throw Error('Usage: node scripts/freeze-v38-canary-execution.mjs <daily-board.json> <execution-plan.json> [market-snapshot.json] [output.json]');
const board = JSON.parse(fs.readFileSync(boardPath,'utf8'));
const plan = JSON.parse(fs.readFileSync(planPath,'utf8'));
const market = marketPath ? JSON.parse(fs.readFileSync(marketPath,'utf8')) : null;

if (board.protocol !== 'V38_DAILY_RESEARCH_BOARD_V2' || board.point_in_time !== true) throw Error('invalid daily research board');
if (plan.protocol !== 'V38_CANARY_EXECUTION_PLAN_V1') throw Error('invalid canary plan');
if (plan.date !== board.date) throw Error('date mismatch');
if (!plan.frozen_at || !Number.isFinite(Date.parse(plan.frozen_at))) throw Error('missing frozen_at');
if (!Array.isArray(plan.serious_board_player_ids) || !Array.isArray(plan.tickets)) throw Error('plan arrays missing');
if (market && (market.schema !== 'BANDALYTICS_MARKET_MOVEMENT_SNAPSHOT_V1' || market.point_in_time !== true || market.date !== board.date)) throw Error('invalid market snapshot');
if (market && Date.parse(market.captured_at) > Date.parse(plan.frozen_at)) throw Error('market snapshot after execution freeze');

const rows = new Map((board.rows||[]).map(r=>[Number(r.player_id),r]));
const marketRows = new Map((market?.rows||[]).map(r=>[Number(r.player_id),r]));
const manual = new Map((plan.manual_prices||[]).map(r=>[Number(r.player_id),r]));
const serious = plan.serious_board_player_ids.map((id,i)=>{
  const r=rows.get(Number(id));
  if(!r) throw Error(`serious board player missing from board: ${id}`);
  if(Date.parse(r.start_time) <= Date.parse(plan.frozen_at)) throw Error(`serious board game already started: ${id}`);
  return {...r, serious_rank:i+1};
});
if(new Set(serious.map(r=>r.player_id)).size!==serious.length) throw Error('duplicate serious board player');

function priceFor(id){
  const m=marketRows.get(Number(id));
  if(m && Number.isFinite(Number(m.best_odds))) return {american_odds:Number(m.best_odds),book:m.best_book||null,captured_at:market.captured_at,source:'MARKET_SNAPSHOT'};
  const x=manual.get(Number(id));
  if(x && Number.isFinite(Number(x.american_odds)) && x.captured_at && Date.parse(x.captured_at)<=Date.parse(plan.frozen_at)) return {american_odds:Number(x.american_odds),book:x.book||null,captured_at:x.captured_at,source:'MANUAL_FROZEN'};
  return null;
}
function implied(o){return o>0?100/(o+100):(-o)/((-o)+100)}
function decimal(o){return o>0?1+o/100:1+100/(-o)}
function americanFromDecimal(d){if(!Number.isFinite(d)||d<=1)return null;const x=d>=2?(d-1)*100:-100/(d-1);return Math.round(x)}

for(const r of serious){
  if((r.profile_gate_count||0)>=5) continue;
  const p=priceFor(r.player_id);
  const protected4=(r.profile_gate_count===4 && r.longshot_700_rule?.eligible===true && p && p.american_odds>=700);
  if(!protected4) throw Error(`unqualified serious board player: ${r.player_id}`);
}

const seriousIds=new Set(serious.map(r=>r.player_id));
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
  tickets.push({ticket_index:idx+1,player_ids:ids,players:[a.player,b.player],gamePks:[a.gamePk,b.gamePk],legs:[{player_id:a.player_id,player:a.player,price:pa},{player_id:b.player_id,player:b.player,price:pb}],fully_priced:priced,combined_decimal:dec?+dec.toFixed(4):null,combined_american:dec?americanFromDecimal(dec):null});
}

const n=serious.length;
const slateBand=n<=20?'SMALL':n<=30?'MEDIUM':'LARGE';
const maxTickets=n?Math.max(1,Math.ceil(n*0.40)):0;
if(tickets.length>maxTickets) throw Error(`ticket budget exceeded: ${tickets.length} > ${maxTickets}`);
const priorityN=n?Math.max(1,Math.ceil(n*0.25)):0;
for(const r of serious){
  const u=uses.get(r.player_id)||0;
  const cap=slateBand==='LARGE' && r.serious_rank<=priorityN ? 2 : 1;
  if(u>cap) throw Error(`path cap exceeded for ${r.player_id}: ${u} > ${cap}`);
}

const zeroReasons=new Map((plan.intentional_zeros||[]).map(z=>[Number(z.player_id),String(z.reason||'').trim()]));
for(const r of serious){if((uses.get(r.player_id)||0)===0 && !zeroReasons.get(r.player_id)) throw Error(`missing intentional-zero reason for ${r.player_id}`)}
const ticketedIds=new Set(tickets.flatMap(t=>t.player_ids));
const pricedLegs=tickets.flatMap(t=>t.legs).filter(l=>l.price).length;
const totalLegs=tickets.length*2;
const output={
  protocol:'V38_CANARY_EXECUTION_FREEZE_V1',date:plan.date,frozen_at:plan.frozen_at,canary_only:true,production_normal_volume:false,
  source_board_protocol:board.protocol,source_board_generated_at:board.generated_at,source_board_sha256:crypto.createHash('sha256').update(JSON.stringify(board)).digest('hex'),
  market_snapshot_used:!!market,market_snapshot_captured_at:market?.captured_at||null,market_snapshot_sha256:market?.sha256||null,
  serious_board_contract:'HUMAN_REVIEWED_POOL_FIRST_40_PCT_TICKET_BUDGET',ticket_contract:'CROSS_GAME_TWO_LEG_SMALL_MEDIUM_ONE_PATH_LARGE_TOP25_SECOND_PATH',
  ticket_budget_share_pct:40,large_priority_repeat_share_pct:25,serious_board_rows:n,slate_band:slateBand,max_ticket_budget:maxTickets,tickets:tickets.length,
  unique_ticketed_hitters:ticketedIds.size,board_coverage_pct:n?+(100*ticketedIds.size/n).toFixed(2):0,priced_legs:pricedLegs,total_legs:totalLegs,price_coverage_pct:totalLegs?+(100*pricedLegs/totalLegs).toFixed(2):0,
  serious_board:serious.map(r=>({serious_rank:r.serious_rank,player_id:r.player_id,player:r.player,gamePk:r.gamePk,start_time:r.start_time,profile_gate_count:r.profile_gate_count,price:priceFor(r.player_id),paths:uses.get(r.player_id)||0,intentional_zero_reason:(uses.get(r.player_id)||0)===0?zeroReasons.get(r.player_id):null})),
  tickets,
  readiness:{all_ticket_legs_priced:totalLegs>0&&pricedLegs===totalLegs,all_zero_paths_explained:true,cross_game_only:true,ticket_budget_compliant:true,path_caps_compliant:true},
  roi_status:pricedLegs===totalLegs&&totalLegs>0?'READY_FOR_POST_SLATE_SETTLEMENT':'BLOCKED_INCOMPLETE_FROZEN_PRICES',
  notes:['No outcome data are accepted by this freeze step.','A 4/6 hitter is permitted only when the live frozen price is +700 or longer and the daily board marks the longshot rule eligible.','This artifact is for controlled canary use and does not enable normal-volume production betting.']
};
const {sha256:_,...without}=output; output.sha256=crypto.createHash('sha256').update(JSON.stringify(without)).digest('hex');
const outPath=outPathArg||`snapshots/v38-canary-execution-freeze-${plan.date}.json`;
fs.mkdirSync(outPath.split('/').slice(0,-1).join('/')||'.',{recursive:true}); fs.writeFileSync(outPath,JSON.stringify(output,null,2)+'\n');
console.log(`V38_CANARY_EXECUTION_FREEZE_PATH=${outPath}`);
console.log(`V38_CANARY_EXECUTION_FREEZE_SUMMARY=${JSON.stringify({date:output.date,serious_board_rows:n,slate_band:slateBand,tickets:output.tickets,max_ticket_budget:maxTickets,price_coverage_pct:output.price_coverage_pct,roi_status:output.roi_status})}`);
