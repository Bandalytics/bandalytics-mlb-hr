import fs from 'node:fs/promises';
import path from 'node:path';
import {evaluateExecutionHandoff} from '../v38-execution-handoff-core.mjs';

const [evalFile,planFile]=process.argv.slice(2);
if(!evalFile||!planFile)throw Error('usage: node scripts/evaluate-v38-execution-handoff.mjs <evaluated.json> <execution-plan.json>');
const evalJson=JSON.parse(await fs.readFile(evalFile,'utf8'));
const planJson=JSON.parse(await fs.readFile(planFile,'utf8'));
if(!Array.isArray(evalJson?.rows))throw Error('evaluated rows missing');
const rawPlan0=Array.isArray(planJson)?planJson:(planJson?.rows||planJson?.players||[]);
if(!Array.isArray(rawPlan0))throw Error('execution plan rows missing');

function norm(s){
  return String(s||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+(jr|sr|ii|iii|iv|v)$/,'').trim();
}
function paths(p){return Math.max(0,Math.trunc(Number(p?.ticket_paths??p?.ticket_count??p?.exposure_count??0)||0))}
const ticketMap=new Map();
for(const [i,t] of (Array.isArray(planJson?.tickets)?planJson.tickets:[]).entries()){
  const tid=`T${i+1}`;
  for(const name of Array.isArray(t)?t:[]){const k=norm(name);if(!k)continue;if(!ticketMap.has(k))ticketMap.set(k,[]);ticketMap.get(k).push(tid)}
}
const rawPlan=rawPlan0.map(p=>{
  const ids=Array.isArray(p?.ticket_ids)?p.ticket_ids:ticketMap.get(norm(p?.player));
  return ids?.length?{...p,ticket_ids:[...new Set(ids.map(String))]}:p;
});
const rowByName=new Map();
for(const r of evalJson.rows){
  const k=norm(r.player); if(!k)continue;
  if(!rowByName.has(k))rowByName.set(k,[]);
  rowByName.get(k).push(r);
}
const resolvedPlan=[];const unresolved=[];const verifiedPlanOnlyNonstarters=[];
for(const p of rawPlan){
  if(Number.isInteger(Number(p?.player_id))&&Number.isInteger(Number(p?.gamePk??p?.game_pk))){resolvedPlan.push(p);continue}
  const hits=rowByName.get(norm(p?.player))||[];
  if(hits.length===1){resolvedPlan.push({...p,player_id:hits[0].player_id,gamePk:hits[0].gamePk});continue}
  const item={...p,resolution_hits:hits.map(x=>({player_id:x.player_id,gamePk:x.gamePk,player:x.player}))};
  unresolved.push(item);
  if(p?.opportunity_verified===true&&p?.observed_starting_lineup===false){verifiedPlanOnlyNonstarters.push(item)}
}
const report=evaluateExecutionHandoff(evalJson.rows,resolvedPlan);
const verifiedPlannedExposureNonstarters=verifiedPlanOnlyNonstarters.filter(p=>paths(p)>0);
const totalPlannedTickets=Array.isArray(planJson?.tickets)?planJson.tickets.length:null;
let exactPlanDependency=null,exactPlanDependencyPlayer=null;
if(totalPlannedTickets){
  for(const p of rawPlan){const c=Array.isArray(p?.ticket_ids)?new Set(p.ticket_ids.map(String)).size:0;if(exactPlanDependency==null||c>exactPlanDependency){exactPlanDependency=c;exactPlanDependencyPlayer=p?.player||null}}
}
const planFinal=rawPlan.filter(p=>p?.final_cut===true||p?.kept===true||p?.in_final_pool===true);
const planTicketed=planFinal.filter(p=>paths(p)>0||p?.ticketed===true);
const planZero=planFinal.filter(p=>paths(p)===0&&p?.ticketed!==true);
const planTotalPaths=planFinal.reduce((s,p)=>s+paths(p),0);
const planUsage=[...planFinal].map(p=>paths(p)).sort((a,b)=>b-a);
const planTop3=planUsage.slice(0,3).reduce((a,b)=>a+b,0);
const planNonstarters=planFinal.filter(p=>p?.opportunity_verified===true&&p?.observed_starting_lineup===false);
const planNonstarterTicketPaths=planNonstarters.reduce((s,p)=>s+paths(p),0);
const resolvedByKey=new Map(report.rows.map(r=>[`${Number(r.gamePk)}:${Number(r.player_id)}`,r]));
const resolvedPlanPolicy=[];
const outcomeByName=new Map();
for(const r of evalJson.rows){if(typeof r?.homer==='boolean')outcomeByName.set(norm(r.player),r.homer)}
for(const p of rawPlan){if(p?.outcome_verified===true&&typeof p?.homer==='boolean')outcomeByName.set(norm(p.player),p.homer)}
for(const p of resolvedPlan){
  const r=resolvedByKey.get(`${Number(p?.gamePk??p?.game_pk)}:${Number(p?.player_id)}`);
  if(!r)continue;
  resolvedPlanPolicy.push({player:p.player||r.player,hr_odds:Number(p?.hr_odds??p?.odds??p?.american_odds)||null,gate_count:r.execution?.policy?.gate_count??null,policy_label:r.execution?.policy?.label||null,locked_qualified:r.execution?.policy?.qualified===true,final_cut:p?.final_cut===true,ticket_paths:paths(p),homer:r.homer===true});
}
const policyMismatches=resolvedPlanPolicy.filter(x=>x.final_cut&&!x.locked_qualified);
const ticketOutcomes=(Array.isArray(planJson?.tickets)?planJson.tickets:[]).map((legs,i)=>{
  const resolved=(Array.isArray(legs)?legs:[]).map(player=>({player,homer:outcomeByName.has(norm(player))?outcomeByName.get(norm(player)):null}));
  const unknown=resolved.filter(x=>x.homer==null).map(x=>x.player);
  const status=unknown.length?'UNKNOWN':resolved.every(x=>x.homer===true)?'WIN':'LOSS';
  return {ticket_id:`T${i+1}`,legs:[...legs],status,unknown_players:unknown,winning_legs:resolved.filter(x=>x.homer===true).map(x=>x.player),losing_legs:resolved.filter(x=>x.homer===false).map(x=>x.player)};
});
const knownTickets=ticketOutcomes.filter(t=>t.status!=='UNKNOWN'),winningTickets=knownTickets.filter(t=>t.status==='WIN');
const out={
  ...report,
  date:evalJson.date||planJson.date||null,
  source_evaluation_protocol:evalJson.evaluation_protocol||evalJson.protocol||null,
  source_snapshot_sha256:evalJson.snapshot_sha256||null,
  execution_plan_protocol:planJson.protocol||'BANDALYTICS_EXECUTION_PLAN_ADHOC_V1',
  execution_plan_rows:rawPlan.length,
  resolved_execution_plan_rows:resolvedPlan.length,
  unresolved_execution_plan_rows:unresolved.length,
  unresolved_execution_plan:unresolved,
  verified_plan_only_nonstarters:verifiedPlanOnlyNonstarters,
  plan_only_opportunity_mismatch_count:verifiedPlannedExposureNonstarters.length,
  plan_only_opportunity_mismatch_ticket_paths:verifiedPlannedExposureNonstarters.reduce((s,p)=>s+paths(p),0),
  combined_opportunity_mismatch_count:(report.summary?.opportunity_mismatch_count||0)+verifiedPlannedExposureNonstarters.length,
  exact_planned_ticket_count:totalPlannedTickets,
  exact_max_player_ticket_appearances:exactPlanDependency,
  exact_max_portfolio_dependency_player:exactPlanDependencyPlayer,
  exact_max_portfolio_dependency_pct:totalPlannedTickets&&exactPlanDependency!=null?+(100*exactPlanDependency/totalPlannedTickets).toFixed(2):null,
  recovered_plan_summary:{
    final_pool_n:planFinal.length,
    ticketed_n:planTicketed.length,
    zero_path_n:planZero.length,
    pool_coverage_pct:planFinal.length?+(100*planTicketed.length/planFinal.length).toFixed(2):null,
    total_ticket_paths:planTotalPaths,
    top3_leg_concentration_pct:planTotalPaths?+(100*planTop3/planTotalPaths).toFixed(2):null,
    nonstarter_n:planNonstarters.length,
    nonstarter_ticket_paths:planNonstarterTicketPaths,
    exact_ticket_count:totalPlannedTickets,
    known_ticket_outcomes_n:knownTickets.length,
    winning_tickets_n:winningTickets.length,
    ticket_conversion_pct:knownTickets.length?+(100*winningTickets.length/knownTickets.length).toFixed(2):null,
    exact_max_portfolio_dependency_player:exactPlanDependencyPlayer,
    exact_max_portfolio_dependency_pct:totalPlannedTickets&&exactPlanDependency!=null?+(100*exactPlanDependency/totalPlannedTickets).toFixed(2):null,
    resolved_policy_rows:resolvedPlanPolicy.length,
    resolved_final_pool_policy_mismatch_n:policyMismatches.length
  },
  ticket_outcomes:ticketOutcomes,
  resolved_plan_policy:resolvedPlanPolicy,
  resolved_final_pool_policy_mismatches:policyMismatches
};
const stem=path.basename(evalFile).replace(/\.json$/,'');
const outfile=path.join(path.dirname(evalFile),`${stem}-execution-handoff.json`);
await fs.writeFile(outfile,JSON.stringify(out,null,2)+'\n','utf8');
console.log('V38_EXECUTION_HANDOFF='+JSON.stringify({outfile,date:out.date,summary:out.summary,recovered_plan_summary:out.recovered_plan_summary,unresolved:out.unresolved_execution_plan_rows,plan_only_opportunity_mismatch_count:out.plan_only_opportunity_mismatch_count,combined_opportunity_mismatch_count:out.combined_opportunity_mismatch_count,exact_max_portfolio_dependency_pct:out.exact_max_portfolio_dependency_pct}));
