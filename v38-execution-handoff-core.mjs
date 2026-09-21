import {classifyLockedPolicy} from './v38-locked-policy-core.mjs';

export const EXECUTION_HANDOFF_PROTOCOL='BANDALYTICS_EXECUTION_HANDOFF_V2';
export const EXPOSURE_STATES=Object.freeze(['PRIORITY_PLUS','PRIORITY','ONE_PATH','INTENTIONAL_ZERO','UNCLASSIFIED']);
export const EVIDENCE_LANES=Object.freeze(['PROFILE','HEAT','MATCHUP','VALUE']);

function n(v){const x=Number(v);return Number.isFinite(x)?x:null}
function bool(v){return v===true}
function idKey(gamePk,playerId){return `${Number(gamePk)}:${Number(playerId)}`}
function lineupInfo(row={}){
  const l=row?.context?.lineup||row?.lineup||{};
  const slot=n(l?.lineup??l?.lineup_slot??l?.batting_order??row?.lineup_slot);
  const type=String(l?.lineup_type??l?.status??row?.lineup_type??'').toUpperCase();
  const confirmed=type==='CONFIRMED'||bool(l?.confirmed)||bool(row?.lineup_confirmed)||bool(row?.observed_starting_lineup);
  const starter=bool(l?.starting)||bool(row?.starting)||bool(row?.observed_starting_lineup)||slot!=null||(confirmed&&!/BENCH|NOT_STARTING|OUT/.test(type));
  const pinchRisk=bool(l?.pinch_risk)||bool(row?.pinch_risk)||/BENCH|NOT_STARTING/.test(type);
  return {slot,type:type||null,confirmed,starter,pinch_risk:pinchRisk,eligible:starter&&!pinchRisk,source:row?.opportunity_source||null};
}
function summarize(rows=[]){const hr=rows.filter(r=>r.homer===true).length;return {n:rows.length,hr,hr_rate:rows.length?+(100*hr/rows.length).toFixed(2):null}}
function exposureState(v){const s=String(v||'UNCLASSIFIED').trim().toUpperCase().replace(/[ -]+/g,'_');return EXPOSURE_STATES.includes(s)?s:'UNCLASSIFIED'}
function evidenceLanes(v){const a=Array.isArray(v)?v:[];return [...new Set(a.map(x=>String(x||'').trim().toUpperCase().replace(/[ -]+/g,'_')).filter(x=>EVIDENCE_LANES.includes(x)))];}
function rowWithPlanMarket(row,p){const odds=n(p?.hr_odds??p?.odds??p?.american_odds);return odds==null?row:{...row,hr_odds:odds,hr_odds_source:'FROZEN_EXECUTION_PLAN'};}
function ticketIds(p={}){return [...new Set(Array.isArray(p?.ticket_ids)?p.ticket_ids.map(String).filter(Boolean):[])]}

export function evaluateExecutionHandoff(rows=[],executionPlan=[]){
  const planMap=new Map();for(const p of executionPlan||[]){const g=n(p?.gamePk??p?.game_pk),pid=n(p?.player_id);if(g==null||pid==null)continue;planMap.set(idKey(g,pid),p)}
  const out=[];
  for(const row of rows||[]){
    const key=idKey(row?.gamePk,row?.player_id),p=planMap.get(key)||{};
    const policy=classifyLockedPolicy(rowWithPlanMarket(row,p)),lineup=lineupInfo(row);
    const finalCut=p?.final_cut===true||p?.kept===true||p?.in_final_pool===true,explicitCut=p?.final_cut===false||p?.kept===false||p?.in_final_pool===false;
    const state=exposureState(p?.exposure_state),lanes=evidenceLanes(p?.evidence_lanes),ids=ticketIds(p);
    const ticketPaths=Math.max(0,Math.trunc(n(p?.ticket_paths??p?.ticket_count??p?.exposure_count)??ids.length??0)),ticketed=ticketPaths>0||ids.length>0||p?.ticketed===true;
    const plannedExposure=state!=='INTENTIONAL_ZERO'&&(ticketed||['PRIORITY_PLUS','PRIORITY','ONE_PATH'].includes(state));
    out.push({...row,execution:{policy,lineup,final_cut:finalCut,explicit_cut:explicitCut,cut_reason:p?.cut_reason||p?.reason||null,zero_path_reason:p?.zero_path_reason||null,exposure_state:state,evidence_lanes:lanes,evidence_lane_count:lanes.length,ticket_paths:ticketPaths,ticket_ids:ids,ticketed,planned_exposure:plannedExposure,opportunity_mismatch:plannedExposure&&!lineup.eligible,zero_path_qualified:policy.qualified&&finalCut&&lineup.eligible&&!ticketed&&state!=='INTENTIONAL_ZERO',intentional_zero:policy.qualified&&finalCut&&state==='INTENTIONAL_ZERO'&&!ticketed,unclassified_qualified:policy.qualified&&!finalCut&&!explicitCut,plan_hr_odds:n(p?.hr_odds??p?.odds??p?.american_odds)}});
  }
  const qualified=out.filter(r=>r.execution.policy.qualified),finalPool=qualified.filter(r=>r.execution.final_cut),eligible=finalPool.filter(r=>r.execution.lineup.eligible),ticketed=eligible.filter(r=>r.execution.ticketed);
  const totalLegs=eligible.reduce((s,r)=>s+r.execution.ticket_paths,0),usage=[...eligible].map(r=>r.execution.ticket_paths).sort((a,b)=>b-a),top3=usage.slice(0,3).reduce((a,b)=>a+b,0);
  const allTicketIds=new Set(finalPool.flatMap(r=>r.execution.ticket_ids)),maxTicketAppearances=finalPool.reduce((m,r)=>Math.max(m,r.execution.ticket_ids.length),0),portfolioDependency=allTicketIds.size?maxTicketAppearances/allTicketIds.size:null,maxLegShare=totalLegs?Math.max(...usage,0)/totalLegs:null;
  const byExposure={};for(const s of EXPOSURE_STATES)byExposure[s]=summarize(finalPool.filter(r=>r.execution.exposure_state===s));
  const byLaneCount={},ticketedByLaneCount={};for(let i=0;i<=4;i++){byLaneCount[String(i)]=summarize(finalPool.filter(r=>r.execution.evidence_lane_count===i));ticketedByLaneCount[String(i)]=summarize(ticketed.filter(r=>r.execution.evidence_lane_count===i))}
  const lanePresence={};for(const lane of EVIDENCE_LANES)lanePresence[lane]=summarize(finalPool.filter(r=>r.execution.evidence_lanes.includes(lane)));
  const cut=qualified.filter(r=>r.execution.explicit_cut);
  return {protocol:EXECUTION_HANDOFF_PROTOCOL,research_only:true,scoring_enabled:false,production_rule_changed:false,auto_promote:false,rows:out,summary:{qualified:summarize(qualified),final_pool:summarize(finalPool),lineup_eligible_final_pool:summarize(eligible),ticketed_eligible:summarize(ticketed),qualified_explicit_cuts:summarize(cut),qualified_retained_hr:finalPool.filter(r=>r.homer===true).length,qualified_cut_hr:cut.filter(r=>r.homer===true).length,pool_coverage_pct:finalPool.length?+(100*ticketed.length/finalPool.length).toFixed(2):null,eligible_pool_coverage_pct:eligible.length?+(100*ticketed.length/eligible.length).toFixed(2):null,zero_path_count:eligible.filter(r=>r.execution.zero_path_qualified).length,intentional_zero_count:finalPool.filter(r=>r.execution.intentional_zero).length,opportunity_mismatch_count:finalPool.filter(r=>r.execution.opportunity_mismatch).length,unclassified_qualified_count:qualified.filter(r=>r.execution.unclassified_qualified).length,total_ticket_paths:totalLegs,unique_ticket_count:allTicketIds.size||null,top3_exposure_concentration_pct:totalLegs?+(100*top3/totalLegs).toFixed(2):null,max_single_hitter_leg_share_pct:maxLegShare==null?null:+(100*maxLegShare).toFixed(2),max_single_hitter_portfolio_dependency_pct:portfolioDependency==null?null:+(100*portfolioDependency).toFixed(2),by_exposure_state:byExposure,by_evidence_lane_count:byLaneCount,ticketed_by_evidence_lane_count:ticketedByLaneCount,by_evidence_lane_presence:lanePresence}};
}
