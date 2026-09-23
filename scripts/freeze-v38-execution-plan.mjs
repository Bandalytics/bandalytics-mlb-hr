import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const [inputFile]=process.argv.slice(2);
if(!inputFile)throw Error('usage: node scripts/freeze-v38-execution-plan.mjs <execution-plan-draft.json>');
const draft=JSON.parse(await fs.readFile(inputFile,'utf8'));
const rows=Array.isArray(draft?.rows)?draft.rows:[];
const tickets=Array.isArray(draft?.tickets)?draft.tickets:[];
const compressionWatch=Array.isArray(draft?.compression_watch)?draft.compression_watch:[];
const date=String(draft?.date||'');
if(!/^2026-\d\d-\d\d$/.test(date))throw Error('valid 2026 date required');
if(!rows.length)throw Error('rows required');
const allowedStates=new Set(['PRIORITY_PLUS','PRIORITY','ONE_PATH','INTENTIONAL_ZERO','UNCLASSIFIED']);
const allowedLanes=new Set(['PROFILE','HEAT','MATCHUP','VALUE']);
const allowedCutTypes=new Set(['BASEBALL_CUT','COMFORT_CUT']);
const allowedCompressionDispositions=new Set(['REVIEWED_KEEP','REVIEWED_CUT']);
const norm=s=>String(s||'').trim();
const key=s=>norm(s).toLowerCase();
const normState=s=>String(s||'UNCLASSIFIED').trim().toUpperCase().replace(/[ -]+/g,'_');
const normLane=s=>String(s||'').trim().toUpperCase().replace(/[ -]+/g,'_');
const normCut=s=>String(s||'').trim().toUpperCase().replace(/[ -]+/g,'_');
const names=new Set();
let finalPool=0,baseballCuts=0,comfortCuts=0,decisionEligibleRows=0,ineligibleRows=0;
for(const r of rows){
  const player=norm(r?.player);if(!player)throw Error('every row requires player');
  const k=key(player);if(names.has(k))throw Error(`duplicate player ${player}`);names.add(k);
  if(typeof r?.final_cut!=='boolean')throw Error(`resolved final_cut boolean required for ${player}`);
  const isFinal=r.final_cut===true,state=normState(r?.exposure_state),cutType=normCut(r?.cut_type),cutReason=norm(r?.cut_reason),decisionEligible=r?.eligible_for_final_cut!==false;
  if(decisionEligible)decisionEligibleRows++;else ineligibleRows++;
  if(!allowedStates.has(state))throw Error(`bad exposure_state for ${player}`);
  const lanes=(Array.isArray(r?.evidence_lanes)?r.evidence_lanes:[]).map(normLane).filter(Boolean);
  if(new Set(lanes).size!==lanes.length)throw Error(`duplicate evidence lane for ${player}`);
  for(const lane of lanes)if(!allowedLanes.has(lane))throw Error(`bad evidence lane ${lane} for ${player}`);
  if(isFinal){
    if(!decisionEligible)throw Error(`FINAL CUT cannot include eligibility-blocked row: ${player}`);
    if(cutType||cutReason)throw Error(`FINAL CUT row cannot retain cut label/reason: ${player}`);
    finalPool++;
  }else if(decisionEligible){
    if(!allowedCutTypes.has(cutType))throw Error(`non-final actionable row requires BASEBALL_CUT or COMFORT_CUT: ${player}`);
    if(!cutReason)throw Error(`non-final actionable row requires cut_reason: ${player}`);
    if(state!=='UNCLASSIFIED')throw Error(`cut row must remain UNCLASSIFIED exposure: ${player}`);
    if(cutType==='BASEBALL_CUT')baseballCuts++;else comfortCuts++;
  }else{
    if(state!=='UNCLASSIFIED')throw Error(`eligibility-blocked row must remain UNCLASSIFIED exposure: ${player}`);
    if(cutType||cutReason)throw Error(`eligibility-blocked row must not be mislabeled as a decision cut: ${player}`);
  }
}
let compressionReviewedKeep=0,compressionReviewedCut=0,compressionComfortCut=0;
for(const c of compressionWatch){
  const player=norm(c?.player);if(!player)throw Error('compression watch row requires player');
  const disposition=normCut(c?.review_disposition),reviewCutType=normCut(c?.review_cut_type),reviewReason=norm(c?.review_reason);
  if(!allowedCompressionDispositions.has(disposition))throw Error(`compression watch requires REVIEWED_KEEP or REVIEWED_CUT: ${player}`);
  if(!reviewReason)throw Error(`compression watch requires review_reason: ${player}`);
  if(disposition==='REVIEWED_CUT'){
    if(!allowedCutTypes.has(reviewCutType))throw Error(`compression REVIEWED_CUT requires BASEBALL_CUT or COMFORT_CUT: ${player}`);
    compressionReviewedCut++;if(reviewCutType==='COMFORT_CUT')compressionComfortCut++;
  }else{
    if(reviewCutType)throw Error(`compression REVIEWED_KEEP cannot retain review_cut_type: ${player}`);
    compressionReviewedKeep++;
  }
}
const appearances=new Map([...names].map(k=>[k,0]));
for(const [i,t] of tickets.entries()){
  if(!Array.isArray(t)||t.length<2)throw Error(`ticket ${i+1} must contain at least 2 players`);
  const seen=new Set();
  for(const p0 of t){
    const p=norm(p0),k=key(p);if(!names.has(k))throw Error(`ticket ${i+1} references unknown player ${p}`);
    if(seen.has(k))throw Error(`ticket ${i+1} duplicates player ${p}`);seen.add(k);
    appearances.set(k,(appearances.get(k)||0)+1);
  }
}
let totalPaths=0,ticketed=0,intentionalZero=0;
const frozenRows=[];
const exposureCounts={PRIORITY_PLUS:0,PRIORITY:0,ONE_PATH:0,INTENTIONAL_ZERO:0,UNCLASSIFIED:0};
const laneCounts={PROFILE:0,HEAT:0,MATCHUP:0,VALUE:0};
for(const r of rows){
  const player=norm(r.player),k=key(player),decisionEligible=r?.eligible_for_final_cut!==false;
  const state=normState(r?.exposure_state);
  const lanes=(Array.isArray(r?.evidence_lanes)?r.evidence_lanes:[]).map(normLane).filter(Boolean);
  const declaredRaw=r?.ticket_paths;
  const declared=declaredRaw==null?null:Math.max(0,Math.trunc(Number(declaredRaw)||0));
  const exact=appearances.get(k)||0;
  if(declared!=null&&declared!==exact)throw Error(`ticket_paths mismatch for ${player}: declared ${declared}, exact ${exact}`);
  const paths=exact;
  const isFinal=r?.final_cut===true;
  if(paths>0&&!isFinal)throw Error(`ticket exposure outside FINAL CUT: ${player}`);
  if(state==='INTENTIONAL_ZERO'&&paths>0)throw Error(`INTENTIONAL_ZERO cannot have ticket paths: ${player}`);
  if(isFinal&&paths===0&&state!=='INTENTIONAL_ZERO')throw Error(`FINAL CUT zero-path requires INTENTIONAL_ZERO classification: ${player}`);
  if(isFinal&&paths===0&&!norm(r?.zero_path_reason))throw Error(`INTENTIONAL_ZERO requires zero_path_reason: ${player}`);
  const lineupType=String(r?.lineup_type||'');
  const opportunityKnown=r?.opportunity_verified===true||/CONFIRMED|STARTING/i.test(lineupType);
  if(paths>0&&!opportunityKnown)throw Error(`ticket exposure requires verified lineup/opportunity: ${player}`);
  if(paths>0&&r?.opportunity_verified===true&&r?.observed_starting_lineup===false)throw Error(`planned exposure assigned to verified nonstarter: ${player}`);
  if(paths>0&&/BENCH|NOT_STARTING|OUT/i.test(lineupType))throw Error(`planned exposure assigned to nonstarting lineup status: ${player}`);
  if(paths>0){ticketed++;totalPaths+=paths}
  if(isFinal&&paths===0)intentionalZero++;
  if(isFinal)exposureCounts[state]=(exposureCounts[state]||0)+1;
  for(const lane of lanes)if(isFinal)laneCounts[lane]=(laneCounts[lane]||0)+1;
  frozenRows.push({...r,cut_type:isFinal||!decisionEligible?null:normCut(r.cut_type),cut_reason:isFinal||!decisionEligible?null:norm(r.cut_reason),exposure_state:state,evidence_lanes:lanes,ticket_paths:paths,ticket_ids:tickets.map((t,i)=>t.some(x=>key(x)===k)?`T${i+1}`:null).filter(Boolean)});
}
const frozenCompressionWatch=compressionWatch.map(c=>({...c,review_disposition:normCut(c.review_disposition),review_cut_type:normCut(c.review_cut_type)||null,review_reason:norm(c.review_reason)}));
const usage=frozenRows.filter(r=>r.final_cut===true).map(r=>r.ticket_paths).sort((a,b)=>b-a);
const top3=usage.slice(0,3).reduce((a,b)=>a+b,0);
const maxPaths=usage[0]||0;
const capturedAt=new Date().toISOString();
const body={
  protocol:'BANDALYTICS_EXECUTION_PLAN_PROSPECTIVE_V3',
  date,captured_at:capturedAt,point_in_time:true,prospective:true,research_only:true,scoring_enabled:false,production_rule_changed:false,
  source:draft?.source||'CHATGPT_BANDALYTICS_WORKFLOW',notes:draft?.notes||null,rows:frozenRows,compression_watch:frozenCompressionWatch,tickets,
  semantics:{
    opportunity:'Eligibility control only; not an evidence lane.',
    evidence_lanes:['PROFILE','HEAT','MATCHUP','VALUE'],
    exposure_states:['PRIORITY_PLUS','PRIORITY','ONE_PATH','INTENTIONAL_ZERO','UNCLASSIFIED'],
    cut_labels:['BASEBALL_CUT','COMFORT_CUT'],
    eligibility_block:'Rows already blocked by policy/lineup readiness are not labeled BASEBALL_CUT or COMFORT_CUT; those labels audit discretionary cuts from the actionable review universe only.',
    compression_watch:'Every multi-lane qualified hitter outside the review queue must be explicitly dispositioned before freeze; no auto-promotion.',
    no_auto_scoring:true
  },
  summary:{
    readiness_rows_n:rows.length,review_universe_n:decisionEligibleRows,ineligible_n:ineligibleRows,final_pool_n:finalPool,baseball_cut_n:baseballCuts,comfort_cut_n:comfortCuts,
    ticketed_n:ticketed,intentional_zero_n:intentionalZero,zero_path_n:intentionalZero,
    pool_coverage_pct:finalPool?+(100*ticketed/finalPool).toFixed(2):null,total_ticket_paths:totalPaths,ticket_count:tickets.length,
    top3_leg_concentration_pct:totalPaths?+(100*top3/totalPaths).toFixed(2):null,
    max_single_hitter_leg_share_pct:totalPaths?+(100*maxPaths/totalPaths).toFixed(2):null,
    max_single_hitter_portfolio_dependency_pct:tickets.length?+(100*maxPaths/tickets.length).toFixed(2):null,
    compression_watch_n:frozenCompressionWatch.length,compression_reviewed_keep_n:compressionReviewedKeep,compression_reviewed_cut_n:compressionReviewedCut,compression_comfort_cut_n:compressionComfortCut,
    by_exposure_state:exposureCounts,evidence_lane_counts:laneCounts
  }
};
const sha256=crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
const out={...body,sha256};
await fs.mkdir('prospective-execution-plans',{recursive:true});
const outfile=path.join('prospective-execution-plans',`${date}-${capturedAt.replace(/[:.]/g,'-')}.json`);
await fs.writeFile(outfile,JSON.stringify(out,null,2)+'\n','utf8');
console.log('V38_EXECUTION_PLAN_FROZEN='+JSON.stringify({outfile,date,captured_at:capturedAt,summary:body.summary,sha256}));
