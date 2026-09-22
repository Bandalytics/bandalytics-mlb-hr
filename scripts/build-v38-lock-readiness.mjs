import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {classifyLockedPolicy} from '../v38-locked-policy-core.mjs';

export const LOCK_READINESS_PROTOCOL='BANDALYTICS_LOCK_READINESS_V2';
export const LOCK_READINESS_STATES=Object.freeze(['ACTIONABLE_REVIEW','PENDING_LINEUP','PRICE_BLOCKED_4OF6','POLICY_BLOCKED']);

function n(v){const x=Number(v);return Number.isFinite(x)?x:null}
function verifiedStartingLineup(row={}){const slot=n(row?.context?.lineup);return row?.context?.confirmed_lineup===true&&slot!=null&&slot>=1&&slot<=9;}
function policyInput(row={}){const p=row?.profile&&typeof row.profile==='object'?row.profile:{};return {...p,gate_count:row?.gate_count,context:{market:row?.context?.market??null}};}
function laneInputs(row,policy){
  const me=row?.modifier_evidence||{},bbeVerified=me.bbe_cryptographically_verified===true,pitchVerified=me.pitchfit_cryptographically_verified===true;
  const b=row?.bbe_band||{},p=row?.pitchfit||null,odds=policy.hr_american_odds;
  const heatSupport=bbeVerified&&(b.hrshape_band==='TOP_DECILE'||b.hrshape_band==='TOP_QUARTILE'||b.contact_high===true||b.rising===true);
  const matchupSupport=pitchVerified&&p?.fit_status==='TRUE';
  return {
    PROFILE:{available:true,support:policy.qualified===true,basis:policy.label},
    HEAT:{available:bbeVerified,support:bbeVerified?heatSupport:null,basis:bbeVerified?{hrshape_band:b.hrshape_band??null,contact_high:b.contact_high===true,rising:b.rising===true,tracked_bbe:n(row?.bbe?.tracked_bbe)}:null,source_sha256:me.bbe_snapshot_sha256??null,captured_at:me.bbe_captured_at??null},
    MATCHUP:{available:pitchVerified,support:pitchVerified?matchupSupport:null,basis:pitchVerified?{fit_status:p?.fit_status??null,fit_score:n(p?.fit_score),band:row?.pitchfit_band??null}:null,source_sha256:me.pitchfit_snapshot_sha256??null,captured_at:me.pitchfit_captured_at??null},
    VALUE:{available:odds!=null,support:null,basis:odds!=null?{american_odds:odds,preferred_price_window:odds>=500&&odds<=1500,price_source:policy.hr_price_source}:null},
    opportunity:{available:true,support:verifiedStartingLineup(row),lineup:n(row?.context?.lineup)},
    park_context:{available:!!row?.park_factor,support_only:true,hr_factor:n(row?.park_factor?.hr_factor),not_an_evidence_lane:true}
  };
}
function qualifierPopulation(boardRows=[]){
  const p=boardRows.map(r=>({row:r,policy:classifyLockedPolicy(policyInput(r))}));
  const countLabel=l=>p.filter(x=>x.policy.label===l).length;
  const q6=countLabel('QUALIFIED_6OF6'),q5=countLabel('QUALIFIED_5OF6'),q4=countLabel('PROTECTED_4OF6_700PLUS'),u4=countLabel('PRICE_UNKNOWN_4OF6');
  return {locked_6of6:q6,locked_5of6:q5,protected_4of6_700plus:q4,price_unknown_4of6:u4,locked_qualified_total:p.filter(x=>x.policy.qualified).length};
}
export function buildLockReadiness(board={}){
  if(board?.protocol!=='V38_LIVE_RESEARCH_BOARD_V1')throw Error('valid V38 live research board required');
  if(board?.point_in_time!==true||board?.research_only!==true)throw Error('point-in-time research board required');
  if(!Array.isArray(board?.rows))throw Error('board rows required');
  const reviewRows=board.rows.filter(r=>r?.final_review_queue===true),population=qualifierPopulation(board.rows);
  const rows=reviewRows.map(r=>{
    const policy=classifyLockedPolicy(policyInput(r)),lineupVerified=verifiedStartingLineup(r);let readiness_state;
    if(!policy.qualified&&policy.label==='PRICE_UNKNOWN_4OF6')readiness_state='PRICE_BLOCKED_4OF6';else if(!policy.qualified)readiness_state='POLICY_BLOCKED';else if(!lineupVerified)readiness_state='PENDING_LINEUP';else readiness_state='ACTIONABLE_REVIEW';
    return {player_id:r.player_id,player:r.player,gamePk:r.gamePk,matchup:r.matchup,start_time:r.start_time,lineup:r?.context?.lineup??null,lineup_verified:lineupVerified,gate_count:policy.gate_count,locked_policy:policy,american_odds:policy.hr_american_odds,hr_price_source:policy.hr_price_source,pool_layer:r.pool_layer,priority_band:r?.hierarchy?.priority_band??null,readiness_state,evidence_lane_inputs:laneInputs(r,policy)};
  });
  const count=s=>rows.filter(r=>r.readiness_state===s).length,q6=rows.filter(r=>r.locked_policy?.label==='QUALIFIED_6OF6').length,q5=rows.filter(r=>r.locked_policy?.label==='QUALIFIED_5OF6').length,q4=rows.filter(r=>r.locked_policy?.label==='PROTECTED_4OF6_700PLUS').length;
  const profileOnlySaturation=population.locked_5of6>0&&rows.length>0&&q5===0&&q6===rows.length;
  const compression_diagnostics={review_queue_6of6:q6,review_queue_5of6:q5,review_queue_protected_4of6:q4,locked_5of6_outside_review_queue:Math.max(0,population.locked_5of6-q5),profile_only_saturation:profileOnlySaturation,warning:profileOnlySaturation?'REVIEW_QUEUE_IS_6OF6_ONLY_WHILE_STANDARD_5OF6_QUALIFIERS_EXIST':null,interpretation:'Review queue is a research compression layer, not the locked qualifier universe. Standard 5/6 remains qualified even when outside this queue.'};
  const body={protocol:LOCK_READINESS_PROTOCOL,date:board.date,generated_at:new Date().toISOString(),source_board_generated_at:board.generated_at??null,source_profile_snapshot_sha256:board.profile_snapshot_sha256??null,point_in_time:true,research_only:true,scoring_enabled:false,production_rule_changed:false,final_cut_promoted:false,evidence_lane_policy:'PROFILE/HEAT/MATCHUP/VALUE inputs are frozen pregame research evidence only. Support flags do not auto-promote, score, assign exposure, or create a final-cut recommendation. VALUE is never auto-confirmed from price alone. Opportunity is an eligibility control, not a fifth evidence lane. Park is support context, not an evidence lane.',rule:'ACTIONABLE_REVIEW means locked-policy qualified plus verified starting lineup inside the research review queue. It is not the full locked qualifier universe and is not an automatic final cut or ticket recommendation. 4/6 requires authoritative frozen current HR price >= +700; missing price fails closed.',qualification_population:population,compression_diagnostics,counts:{review_rows:rows.length,actionable_review:count('ACTIONABLE_REVIEW'),pending_lineup:count('PENDING_LINEUP'),price_blocked_4of6:count('PRICE_BLOCKED_4OF6'),policy_blocked:count('POLICY_BLOCKED')},rows};
  const sha256=crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');return {...body,sha256};
}

if(import.meta.url===`file://${process.argv[1]}`){const input=process.argv[2];if(!input)throw Error('usage: node scripts/build-v38-lock-readiness.mjs <v38-live-research-board.json>');const board=JSON.parse(await fs.readFile(input,'utf8')),out=buildLockReadiness(board);await fs.mkdir('snapshots',{recursive:true});const path=`snapshots/v38-lock-readiness-${out.date}-${out.generated_at.replaceAll(':','').replaceAll('.','')}.json`;await fs.writeFile(path,JSON.stringify(out,null,2)+'\n');console.log(`V38_LOCK_READINESS_PATH=${path}`);console.log(`V38_LOCK_READINESS=${JSON.stringify({date:out.date,counts:out.counts,qualification_population:out.qualification_population,compression_diagnostics:out.compression_diagnostics,actionable:out.rows.filter(r=>r.readiness_state==='ACTIONABLE_REVIEW').map(r=>({player:r.player,gate_count:r.gate_count,odds:r.american_odds,lineup:r.lineup,evidence_inputs:r.evidence_lane_inputs}))})}`);}
