import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {classifyLockedPolicy} from '../v38-locked-policy-core.mjs';

export const LOCK_READINESS_PROTOCOL='BANDALYTICS_LOCK_READINESS_V1';
export const LOCK_READINESS_STATES=Object.freeze(['ACTIONABLE_REVIEW','PENDING_LINEUP','PRICE_BLOCKED_4OF6','POLICY_BLOCKED']);

function n(v){const x=Number(v);return Number.isFinite(x)?x:null}
function verifiedStartingLineup(row={}){
  const slot=n(row?.context?.lineup);
  return row?.context?.confirmed_lineup===true&&slot!=null&&slot>=1&&slot<=9;
}
function policyInput(row={}){
  const p=row?.profile&&typeof row.profile==='object'?row.profile:{};
  return {...p,gate_count:row?.gate_count,context:{market:row?.context?.market??null}};
}
export function buildLockReadiness(board={}){
  if(board?.protocol!=='V38_LIVE_RESEARCH_BOARD_V1')throw Error('valid V38 live research board required');
  if(board?.point_in_time!==true||board?.research_only!==true)throw Error('point-in-time research board required');
  if(!Array.isArray(board?.rows))throw Error('board rows required');
  const reviewRows=board.rows.filter(r=>r?.final_review_queue===true);
  const rows=reviewRows.map(r=>{
    const policy=classifyLockedPolicy(policyInput(r));
    const lineupVerified=verifiedStartingLineup(r);
    let readiness_state;
    if(!policy.qualified&&policy.label==='PRICE_UNKNOWN_4OF6')readiness_state='PRICE_BLOCKED_4OF6';
    else if(!policy.qualified)readiness_state='POLICY_BLOCKED';
    else if(!lineupVerified)readiness_state='PENDING_LINEUP';
    else readiness_state='ACTIONABLE_REVIEW';
    return {player_id:r.player_id,player:r.player,gamePk:r.gamePk,matchup:r.matchup,start_time:r.start_time,lineup:r?.context?.lineup??null,lineup_verified:lineupVerified,gate_count:policy.gate_count,locked_policy:policy,american_odds:policy.hr_american_odds,hr_price_source:policy.hr_price_source,pool_layer:r.pool_layer,priority_band:r?.hierarchy?.priority_band??null,readiness_state};
  });
  const count=s=>rows.filter(r=>r.readiness_state===s).length;
  const body={protocol:LOCK_READINESS_PROTOCOL,date:board.date,generated_at:new Date().toISOString(),source_board_generated_at:board.generated_at??null,source_profile_snapshot_sha256:board.profile_snapshot_sha256??null,point_in_time:true,research_only:true,scoring_enabled:false,production_rule_changed:false,final_cut_promoted:false,rule:'ACTIONABLE_REVIEW means locked-policy qualified plus verified starting lineup. It is not an automatic final cut or ticket recommendation. 4/6 requires authoritative frozen current HR price >= +700; missing price fails closed.',counts:{review_rows:rows.length,actionable_review:count('ACTIONABLE_REVIEW'),pending_lineup:count('PENDING_LINEUP'),price_blocked_4of6:count('PRICE_BLOCKED_4OF6'),policy_blocked:count('POLICY_BLOCKED')},rows};
  const sha256=crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
  return {...body,sha256};
}

if(import.meta.url===`file://${process.argv[1]}`){
  const input=process.argv[2];if(!input)throw Error('usage: node scripts/build-v38-lock-readiness.mjs <v38-live-research-board.json>');
  const board=JSON.parse(await fs.readFile(input,'utf8'));
  const out=buildLockReadiness(board);
  await fs.mkdir('snapshots',{recursive:true});
  const path=`snapshots/v38-lock-readiness-${out.date}-${out.generated_at.replaceAll(':','').replaceAll('.','')}.json`;
  await fs.writeFile(path,JSON.stringify(out,null,2)+'\n');
  console.log(`V38_LOCK_READINESS_PATH=${path}`);
  console.log(`V38_LOCK_READINESS=${JSON.stringify({date:out.date,counts:out.counts,actionable:out.rows.filter(r=>r.readiness_state==='ACTIONABLE_REVIEW').map(r=>({player:r.player,gate_count:r.gate_count,odds:r.american_odds,lineup:r.lineup}))})}`);
}
