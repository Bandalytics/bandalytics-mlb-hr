import fs from 'node:fs';

const path=process.argv[2];
if(!path) throw Error('Usage: node scripts/evaluate-v38-ticket-no-lineup-revalidation.mjs <workflow-revalidation.json>');
const input=JSON.parse(fs.readFileSync(path,'utf8'));
if(input.protocol!=='V38_WORKFLOW_REVALIDATION_V1'||input.point_in_time!==true||input.as_of_verified!==true||Number(input.forward_leakage_days)!==0) throw Error('Invalid workflow revalidation artifact');

const pitch={INELIGIBLE:0,BASE_TRUE:1,TOP_QUARTILE:2,TOP_DECILE:3};
const bbe={INELIGIBLE:0,BASE:1,TOP_QUARTILE:2,TOP_DECILE:3};
const starter={LOW_LT_1_2:0,SMALL_SAMPLE:1,UNAVAILABLE:1,MID_1_2_TO_1_5:2,HIGH_GE_1_5:3};
const value=(map,key)=>map[key]??0;
const cmp=(a,b)=>{for(let i=0;i<a.length;i++){if(a[i]!==b[i])return b[i]-a[i]}return 0};
const profileKey=r=>[Number(r.gate_count)||0,value(starter,r.starter_hr9_band),value(pitch,r.pitchfit_band),value(bbe,r.bbe_hrshape_band)];
const pitchfitKey=r=>[value(pitch,r.pitchfit_band),value(starter,r.starter_hr9_band),Number(r.gate_count)||0,value(bbe,r.bbe_hrshape_band)];
const eligible=(input.rows||[]).filter(r=>r?.revalidation?.anti_overcompression===true);
const slateBand=n=>n<=50?'SMALL_LE_50':n<=75?'MEDIUM_51_75':'LARGE_GE_76';
const band=slateBand(eligible.length);
const seriousStrategy=band==='SMALL_LE_50'?'PROFILE_FIRST':'PITCHFIT_FIRST';
const keyFn=seriousStrategy==='PROFILE_FIRST'?profileKey:pitchfitKey;
const ranked=[...eligible].sort((a,b)=>cmp(keyFn(a),keyFn(b))||Number(a.player_id)-Number(b.player_id));
const seriousN=eligible.length?Math.max(1,Math.ceil(eligible.length*0.40)):0;
const serious=ranked.slice(0,seriousN).map((r,i)=>({...r,serious_rank:i+1}));
const budgetShares=[25,33,40,50];
const pairKey=(a,b)=>[Number(a.player_id),Number(b.player_id)].sort((x,y)=>x-y).join(':');

function buildTickets(rows,capFn,maxTickets){
  const uses=new Map(rows.map(r=>[Number(r.player_id),0]));
  const seen=new Set(),tickets=[]; let guard=0;
  while(tickets.length<maxTickets&&guard++<10000){
    let made=false;
    for(const a of rows){
      const aid=Number(a.player_id); if((uses.get(aid)||0)>=capFn(a)) continue;
      const b=rows.find(x=>{const bid=Number(x.player_id);return bid!==aid&&a.gamePk!=null&&x.gamePk!=null&&String(a.gamePk)!==String(x.gamePk)&&(uses.get(bid)||0)<capFn(x)&&!seen.has(pairKey(a,x))});
      if(!b) continue;
      const bid=Number(b.player_id); seen.add(pairKey(a,b)); uses.set(aid,(uses.get(aid)||0)+1); uses.set(bid,(uses.get(bid)||0)+1);
      tickets.push({a_player_id:aid,b_player_id:bid,a_homer:a.homer,b_homer:b.homer,won:a.homer===true&&b.homer===true}); made=true; break;
    }
    if(!made) break;
  }
  return {tickets,uses};
}
function summarize(rows,built,requested,priorityN=0){
  const outcome=built.tickets.filter(t=>typeof t.a_homer==='boolean'&&typeof t.b_homer==='boolean');
  const wins=outcome.filter(t=>t.won===true).length,ids=new Set(); for(const t of built.tickets){ids.add(t.a_player_id);ids.add(t.b_player_id)}
  const ticketed=rows.filter(r=>ids.has(Number(r.player_id))), ticketedHr=ticketed.filter(r=>r.homer===true).length, boardHr=rows.filter(r=>r.homer===true).length;
  const useVals=[...built.uses.values()],priorityIds=new Set(rows.slice(0,priorityN).map(r=>Number(r.player_id))); let priorityLegs=0,totalLegs=0;
  for(const t of built.tickets) for(const id of [t.a_player_id,t.b_player_id]){totalLegs++;if(priorityIds.has(id))priorityLegs++}
  return {requested_tickets:requested,tickets:built.tickets.length,budget_utilization_pct:requested?Number((100*built.tickets.length/requested).toFixed(2)):null,outcome_tickets:outcome.length,winning_tickets:wins,ticket_win_rate:outcome.length?Number((100*wins/outcome.length).toFixed(2)):null,any_winning_ticket:wins>0,unique_ticketed_hitters:ids.size,serious_board_coverage_pct:rows.length?Number((100*ids.size/rows.length).toFixed(2)):null,ticketed_hr:ticketedHr,serious_board_hr:boardHr,ticketed_hr_capture_pct:boardHr?Number((100*ticketedHr/boardHr).toFixed(2)):null,max_hitter_uses:useVals.length?Math.max(...useVals):0,avg_hitter_uses:useVals.length?Number((useVals.reduce((a,b)=>a+b,0)/useVals.length).toFixed(2)):0,priority_leg_share_pct:totalLegs&&priorityN?Number((100*priorityLegs/totalLegs).toFixed(2)):null};
}

const results={};
for(const pct of budgetShares){
  const requested=serious.length?Math.max(1,Math.ceil(serious.length*pct/100)):0;
  const policies={BROAD_ONE_PATH:{priorityN:0,capFn:()=>1}};
  for(const pp of [25,33,50]){const pn=serious.length?Math.max(1,Math.ceil(serious.length*pp/100)):0,pids=new Set(serious.slice(0,pn).map(r=>Number(r.player_id)));policies[`PRIORITY_${pp}_PCT_TWO_PATH_REST_ONE`]={priorityN:pn,capFn:r=>pids.has(Number(r.player_id))?2:1}}
  policies.UNIFORM_TWO_PATH={priorityN:0,capFn:()=>2};
  results[`BUDGET_${pct}_PCT_BOARD`]={requested_tickets:requested,policies:{}};
  for(const [name,p] of Object.entries(policies)) results[`BUDGET_${pct}_PCT_BOARD`].policies[name]=summarize(serious,buildTickets(serious,p.capFn,requested),requested,p.priorityN);
}
const seriousOutcome=serious.filter(r=>typeof r.homer==='boolean'),seriousHr=seriousOutcome.filter(r=>r.homer===true).length;
const sample=input.date>='2026-06-01'&&input.date<='2026-07-10'?'FRESH_HOLDOUT_2026_06_01_TO_07_10':input.date>='2026-07-24'&&input.date<='2026-09-01'?'DEVELOPMENT_2026_07_24_TO_09_01':'OUTSIDE_DECLARED_WINDOWS';
const out={protocol:'V38_TICKET_NO_LINEUP_REVALIDATION_V1',date:input.date,sample,point_in_time:true,as_of_verified:true,forward_leakage_days:0,research_only:true,scoring_enabled:false,candidate_source:'ANTI_OVERCOMPRESSION',serious_board_contract:'40_PCT_SLATE_ADAPTIVE_SMALL_PROFILE_MEDIUM_LARGE_PITCHFIT_NO_LINEUP_RANKING',ranking_contract:'LINEUP_SLOT_EXCLUDED_FROM_ALL_RANKING_KEYS',historical_lineup_membership_note:'STARTER_MEMBERSHIP_RECONSTRUCTED_FROM_ACTUAL_GAME PARTICIPATION; LINEUP POSITION IS NOT USED AS RANKING EVIDENCE',serious_board_strategy:seriousStrategy,slate_band:band,eligible_rows:eligible.length,serious_board_rows:serious.length,serious_board_hr:seriousHr,serious_board_hr_rate:seriousOutcome.length?Number((100*seriousHr/seriousOutcome.length).toFixed(2)):null,ticket_budget_contract:'CEIL_SERIOUS_BOARD_X_BUDGET_SHARE_EQUAL_REQUESTED_TICKETS',budget_shares_pct:budgetShares,ticket_contract:'DETERMINISTIC_GREEDY_CROSS_GAME_NO_DUPLICATE_PAIR_NO_OUTCOME_INPUT',results,roi_status:'UNAVAILABLE_NOT_FABRICATED',protected_4of6_status:'FAIL_CLOSED_NOT_EVALUATED'};
fs.mkdirSync('snapshots',{recursive:true}); const outPath=`snapshots/v38-ticket-no-lineup-revalidation-${input.date}.json`; fs.writeFileSync(outPath,JSON.stringify(out,null,2)+'\n');
console.log(`V38_TICKET_NO_LINEUP_REVALIDATION_PATH=${outPath}`); console.log(`V38_TICKET_NO_LINEUP_REVALIDATION_SUMMARY=${JSON.stringify({date:out.date,sample:out.sample,slate_band:band,eligible_rows:out.eligible_rows,serious_board_rows:out.serious_board_rows,serious_board_hr:out.serious_board_hr})}`);
