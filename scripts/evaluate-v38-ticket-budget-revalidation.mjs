import fs from 'node:fs';

const path=process.argv[2];
if(!path) throw Error('Usage: node scripts/evaluate-v38-ticket-budget-revalidation.mjs <workflow-revalidation.json>');
const input=JSON.parse(fs.readFileSync(path,'utf8'));
if(input.protocol!=='V38_WORKFLOW_REVALIDATION_V1'||input.point_in_time!==true||input.as_of_verified!==true||Number(input.forward_leakage_days)!==0) throw Error('Invalid workflow revalidation artifact');

const pitch={INELIGIBLE:0,BASE_TRUE:1,TOP_QUARTILE:2,TOP_DECILE:3};
const bbe={INELIGIBLE:0,BASE:1,TOP_QUARTILE:2,TOP_DECILE:3};
const starter={LOW_LT_1_2:0,SMALL_SAMPLE:1,UNAVAILABLE:1,MID_1_2_TO_1_5:2,HIGH_GE_1_5:3};
const opp=x=>Number.isFinite(Number(x))?(Number(x)<=5?3:Number(x)===6?2:Number(x)<=9?1:0):0;
const value=(map,key)=>map[key]??0;
const cmp=(a,b)=>{for(let i=0;i<a.length;i++){if(a[i]!==b[i])return b[i]-a[i]}return 0};
const profileKey=r=>[Number(r.gate_count)||0,value(starter,r.starter_hr9_band),value(pitch,r.pitchfit_band),opp(r.lineup_slot),value(bbe,r.bbe_hrshape_band)];
const pitchfitKey=r=>[value(pitch,r.pitchfit_band),value(starter,r.starter_hr9_band),Number(r.gate_count)||0,opp(r.lineup_slot),value(bbe,r.bbe_hrshape_band)];
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
  const seen=new Set();
  const tickets=[];
  let guard=0;
  while(tickets.length<maxTickets&&guard++<10000){
    let made=false;
    for(const a of rows){
      const aid=Number(a.player_id),acap=capFn(a);
      if((uses.get(aid)||0)>=acap) continue;
      const b=rows.find(x=>{
        const bid=Number(x.player_id);
        if(bid===aid) return false;
        if(a.gamePk==null||x.gamePk==null||String(a.gamePk)===String(x.gamePk)) return false;
        if((uses.get(bid)||0)>=capFn(x)) return false;
        if(seen.has(pairKey(a,x))) return false;
        return true;
      });
      if(!b) continue;
      const bid=Number(b.player_id),k=pairKey(a,b);
      seen.add(k);
      uses.set(aid,(uses.get(aid)||0)+1); uses.set(bid,(uses.get(bid)||0)+1);
      tickets.push({a_player_id:aid,b_player_id:bid,a_homer:a.homer,b_homer:b.homer,won:a.homer===true&&b.homer===true});
      made=true; break;
    }
    if(!made) break;
  }
  return {tickets,uses};
}
function summarize(rows,built,requested,priorityN=0){
  const outcome=built.tickets.filter(t=>typeof t.a_homer==='boolean'&&typeof t.b_homer==='boolean');
  const wins=outcome.filter(t=>t.won===true).length;
  const ids=new Set(); for(const t of built.tickets){ids.add(t.a_player_id);ids.add(t.b_player_id)}
  const ticketed=rows.filter(r=>ids.has(Number(r.player_id)));
  const ticketedHr=ticketed.filter(r=>r.homer===true).length;
  const boardHr=rows.filter(r=>r.homer===true).length;
  const useVals=[...built.uses.values()];
  const priorityIds=new Set(rows.slice(0,priorityN).map(r=>Number(r.player_id)));
  let priorityLegs=0,totalLegs=0;
  for(const t of built.tickets) for(const id of [t.a_player_id,t.b_player_id]){totalLegs++;if(priorityIds.has(id))priorityLegs++;}
  return {requested_tickets:requested,tickets:built.tickets.length,budget_utilization_pct:requested?Number((100*built.tickets.length/requested).toFixed(2)):null,outcome_tickets:outcome.length,winning_tickets:wins,ticket_win_rate:outcome.length?Number((100*wins/outcome.length).toFixed(2)):null,any_winning_ticket:wins>0,unique_ticketed_hitters:ids.size,serious_board_coverage_pct:rows.length?Number((100*ids.size/rows.length).toFixed(2)):null,ticketed_hr:ticketedHr,serious_board_hr:boardHr,ticketed_hr_capture_pct:boardHr?Number((100*ticketedHr/boardHr).toFixed(2)):null,max_hitter_uses:useVals.length?Math.max(...useVals):0,avg_hitter_uses:useVals.length?Number((useVals.reduce((a,b)=>a+b,0)/useVals.length).toFixed(2)):0,priority_leg_share_pct:totalLegs&&priorityN?Number((100*priorityLegs/totalLegs).toFixed(2)):null};
}

const results={};
for(const pct of budgetShares){
  const requested=serious.length?Math.max(1,Math.ceil(serious.length*pct/100)):0;
  const variants={BROAD_ONE_PATH:{priorityPct:0,capFn:()=>1},UNIFORM_TWO_PATH:{priorityPct:0,capFn:()=>2}};
  for(const pp of [25,33,50]){
    const pn=serious.length?Math.max(1,Math.ceil(serious.length*pp/100)):0;
    const pids=new Set(serious.slice(0,pn).map(r=>Number(r.player_id)));
    variants[`PRIORITY_${pp}_PCT_TWO_PATH_REST_ONE`]={priorityPct:pp,priorityN:pn,capFn:r=>pids.has(Number(r.player_id))?2:1};
  }
  results[`BUDGET_${pct}_PCT_BOARD`]={requested_tickets:requested,variants:{}};
  for(const [name,v] of Object.entries(variants)){
    const built=buildTickets(serious,v.capFn,requested);
    results[`BUDGET_${pct}_PCT_BOARD`].variants[name]=summarize(serious,built,requested,v.priorityN||0);
  }
}
const seriousOutcome=serious.filter(r=>typeof r.homer==='boolean');
const seriousHr=seriousOutcome.filter(r=>r.homer===true).length;
const out={protocol:'V38_TICKET_BUDGET_REVALIDATION_V1',date:input.date,point_in_time:true,as_of_verified:true,forward_leakage_days:0,research_only:true,scoring_enabled:false,candidate_source:'ANTI_OVERCOMPRESSION',serious_board_contract:'40_PCT_SLATE_ADAPTIVE_SMALL_PROFILE_MEDIUM_LARGE_PITCHFIT',serious_board_strategy:seriousStrategy,slate_band:band,eligible_rows:eligible.length,serious_board_rows:serious.length,serious_board_hr:seriousHr,serious_board_hr_rate:seriousOutcome.length?Number((100*seriousHr/seriousOutcome.length).toFixed(2)):null,ticket_budget_contract:'CEIL_SERIOUS_BOARD_X_BUDGET_SHARE_EQUAL_REQUESTED_TICKETS',budget_shares_pct:budgetShares,ticket_contract:'DETERMINISTIC_GREEDY_CROSS_GAME_NO_DUPLICATE_PAIR_NO_OUTCOME_INPUT',results,roi_status:'UNAVAILABLE_NOT_FABRICATED',protected_4of6_status:'FAIL_CLOSED_NOT_EVALUATED'};
fs.mkdirSync('snapshots',{recursive:true});
const outPath=`snapshots/v38-ticket-budget-revalidation-${input.date}.json`;
fs.writeFileSync(outPath,JSON.stringify(out,null,2)+'\n');
console.log(`V38_TICKET_BUDGET_REVALIDATION_PATH=${outPath}`);
console.log(`V38_TICKET_BUDGET_REVALIDATION_SUMMARY=${JSON.stringify(out)}`);
