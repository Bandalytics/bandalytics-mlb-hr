import fs from 'node:fs';
import crypto from 'node:crypto';
import {validStarterDamageSnapshot,selectLatestStarterDamage} from '../v38-starter-damage-selector.mjs';

const [boardPath,starterPath,frozenAtArg,stakeArg,outPathArg]=process.argv.slice(2);
if(!boardPath||!starterPath||!frozenAtArg) throw Error('Usage: node scripts/build-v38-canary-execution-plan.mjs <daily-board.json> <starter-snapshot.json> <frozen-at> [stake-units] [output.json]');
const board=JSON.parse(fs.readFileSync(boardPath,'utf8'));
const starter=JSON.parse(fs.readFileSync(starterPath,'utf8'));
const frozen_at=new Date(frozenAtArg).toISOString();
const stake=stakeArg==null?1:Number(stakeArg);
if(board.protocol!=='V38_DAILY_RESEARCH_BOARD_V2'||board.point_in_time!==true) throw Error('invalid daily board');
if(!validStarterDamageSnapshot(starter)||starter.date!==board.date) throw Error('invalid starter snapshot');
if(!Number.isFinite(Date.parse(frozen_at))||!Number.isFinite(stake)||stake<=0) throw Error('invalid freeze time/stake');
const standardRows=(board.rows||[]).filter(r=>Number(r.profile_gate_count)>=5&&Number.isFinite(Date.parse(r.start_time)));
if(!standardRows.length) throw Error('no standard 5of6+ rows on daily board');
const earliestStandardStart=Math.min(...standardRows.map(r=>Date.parse(r.start_time)));
if(Date.parse(frozen_at)>=earliestStandardStart) throw Error('FULL_SLATE_CANARY_FREEZE_REQUIRED_BEFORE_EARLIEST_STANDARD_CANDIDATE_START');
if(Date.parse(starter.captured_at)>=earliestStandardStart) throw Error('FULL_SLATE_STARTER_SNAPSHOT_REQUIRED_BEFORE_EARLIEST_STANDARD_CANDIDATE_START');

const pitch={INELIGIBLE:0,BASE_TRUE:1,TOP_QUARTILE:2,TOP_DECILE:3};
const bbe={INELIGIBLE:0,BASE:1,TOP_QUARTILE:2,TOP_DECILE:3};
const starterRank={LOW_LT_1_2:0,SMALL_SAMPLE:1,UNAVAILABLE:1,MID_1_2_TO_1_5:2,HIGH_GE_1_5:3};
const opp=x=>Number.isFinite(Number(x))?(Number(x)<=5?3:Number(x)===6?2:Number(x)<=9?1:0):0;
const confirmedLineup=r=>Number.isInteger(Number(r.lineup))&&Number(r.lineup)>=1&&Number(r.lineup)<=9;
const val=(map,key)=>map[key]??0;
const cmp=(a,b)=>{for(let i=0;i<a.length;i++) if(a[i]!==b[i]) return b[i]-a[i]; return 0};
const bbeBand=r=>typeof r.bbe_band==='string'?r.bbe_band:(r.bbe_band?.hrshape_band||r.bbe?.hrshape_band||'INELIGIBLE');
const pitchBand=r=>r.pitchfit_band||'INELIGIBLE';
const starterFor=r=>selectLatestStarterDamage([starter],r.player_id,r.gamePk,r.start_time);
const enriched=standardRows.map(r=>{
  const s=starterFor(r); const sb=s?.row?.starter_hr9_band||'UNAVAILABLE';
  const pb=pitchBand(r), bb=bbeBand(r);
  const pitchPositive=val(pitch,pb)>0, bbePositive=val(bbe,bb)>0, suppressive=sb==='LOW_LT_1_2';
  return {...r,starter_hr9_band:sb,starter_damage_captured_at:s?.captured_at||null,starter_damage_sha256:s?.sha256||null,bbe_hrshape_band:bb,pitchfit_positive:pitchPositive,bbe_positive:bbePositive,starter_suppressive:suppressive,anti_overcompression:!(suppressive&&!pitchPositive&&!bbePositive),lineup_confirmed:confirmedLineup(r)};
});
const candidate=enriched.filter(r=>r.anti_overcompression===true);
if(!candidate.length) throw Error('no anti-overcompression candidates before freeze');
const band=candidate.length<=50?'SMALL_LE_50':candidate.length<=75?'MEDIUM_51_75':'LARGE_GE_76';
const strategy=band==='SMALL_LE_50'?'PROFILE_FIRST':'PITCHFIT_FIRST';
const profileKey=r=>[Number(r.profile_gate_count)||0,val(starterRank,r.starter_hr9_band),val(pitch,pitchBand(r)),opp(r.lineup),val(bbe,r.bbe_hrshape_band)];
const pitchKey=r=>[val(pitch,pitchBand(r)),val(starterRank,r.starter_hr9_band),Number(r.profile_gate_count)||0,opp(r.lineup),val(bbe,r.bbe_hrshape_band)];
const keyFn=strategy==='PROFILE_FIRST'?profileKey:pitchKey;
const ranked=[...candidate].sort((a,b)=>cmp(keyFn(a),keyFn(b))||Number(a.player_id)-Number(b.player_id));
const seriousN=Math.max(1,Math.ceil(ranked.length*0.40));
const serious=ranked.slice(0,seriousN);
const priorityN=Math.max(1,Math.ceil(seriousN*0.25));
const priorityIds=new Set(serious.slice(0,priorityN).map(r=>Number(r.player_id)));
const cap=r=>band==='LARGE_GE_76'&&priorityIds.has(Number(r.player_id))?2:1;
const budget=Math.max(1,Math.ceil(seriousN*0.40));
const uses=new Map(serious.map(r=>[Number(r.player_id),0])), seen=new Set(), tickets=[];
const pairKey=(a,b)=>[Number(a.player_id),Number(b.player_id)].sort((x,y)=>x-y).join(':');
const ticketEligible=serious.filter(confirmedLineup);
let guard=0;
while(tickets.length<budget&&guard++<10000){
  let made=false;
  for(const a of ticketEligible){
    const aid=Number(a.player_id); if((uses.get(aid)||0)>=cap(a)) continue;
    const b=ticketEligible.find(x=>{const bid=Number(x.player_id);return bid!==aid&&String(x.gamePk)!==String(a.gamePk)&&(uses.get(bid)||0)<cap(x)&&!seen.has(pairKey(a,x));});
    if(!b) continue;
    const bid=Number(b.player_id); seen.add(pairKey(a,b)); uses.set(aid,(uses.get(aid)||0)+1); uses.set(bid,(uses.get(bid)||0)+1);
    tickets.push({player_ids:[aid,bid],stake_units:+stake.toFixed(4)}); made=true; break;
  }
  if(!made) break;
}
if(!tickets.length) throw Error('unable to build any cross-game tickets from confirmed lineups');
const intentional_zeros=serious.filter(r=>(uses.get(Number(r.player_id))||0)===0).map(r=>({player_id:Number(r.player_id),reason:confirmedLineup(r)?'DETERMINISTIC_40PCT_TICKET_BUDGET_BROAD_COVERAGE_ZERO':'LINEUP_NOT_CONFIRMED_AT_FREEZE'}));
const body={protocol:'V38_CANARY_EXECUTION_PLAN_V1',date:board.date,frozen_at,candidate_pool_player_ids:ranked.map(r=>Number(r.player_id)),candidate_pool_ranking_strategy:strategy,serious_board_player_ids:serious.map(r=>Number(r.player_id)),tickets,intentional_zeros,research_metadata:{protocol:'V38_CANARY_PLAN_BUILDER_V1',point_in_time:true,outcome_input:false,candidate_source:'STANDARD_5OF6_PLUS_ANTI_OVERCOMPRESSION',protected_4of6_status:'SHADOW_ONLY_NOT_MIXED_IN_REACTIVATION_CANARY',opportunity_guard:'TICKET_LEGS_REQUIRE_CONFIRMED_LINEUP_SLOT_1_TO_9',freeze_scope:'FULL_STANDARD_5OF6_PLUS_SLATE_BEFORE_EARLIEST_CANDIDATE_START',candidate_pool_rows:ranked.length,serious_board_rows:seriousN,confirmed_lineup_serious_rows:serious.filter(confirmedLineup).length,unconfirmed_lineup_serious_rows:serious.filter(r=>!confirmedLineup(r)).length,slate_band:band,serious_board_share_pct:40,ticket_budget_share_pct:40,large_priority_repeat_share_pct:25,priority_rows:priorityN,requested_ticket_budget:budget,actual_tickets:tickets.length,budget_underfill_due_to_opportunity:tickets.length<budget,excluded_concrete_negative:enriched.length-ranked.length,earliest_standard_candidate_start:new Date(earliestStandardStart).toISOString(),source_board_sha256:crypto.createHash('sha256').update(JSON.stringify(board)).digest('hex'),source_starter_snapshot_sha256:starter.sha256}};
const output={...body,plan_sha256:crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex')};
const outPath=outPathArg||`snapshots/v38-canary-execution-plan-${board.date}.json`;
fs.mkdirSync(outPath.split('/').slice(0,-1).join('/')||'.',{recursive:true});
fs.writeFileSync(outPath,JSON.stringify(output,null,2)+'\n');
console.log(`V38_CANARY_EXECUTION_PLAN_PATH=${outPath}`);
console.log(`V38_CANARY_EXECUTION_PLAN=${JSON.stringify(output.research_metadata)}`);
