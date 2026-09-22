import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {classifyLockedPolicy} from '../v38-locked-policy-core.mjs';

export const COMPRESSION_ESCAPE_WATCH_PROTOCOL='BANDALYTICS_COMPRESSION_ESCAPE_WATCH_V1';
function n(v){const x=Number(v);return Number.isFinite(x)?x:null}
function policyInput(row={}){const p=row?.profile&&typeof row.profile==='object'?row.profile:{};return {...p,gate_count:row?.gate_count,context:{market:row?.context?.market??null}};}
function lineupVerified(row={}){const slot=n(row?.context?.lineup);return row?.context?.confirmed_lineup===true&&slot!=null&&slot>=1&&slot<=9;}
function evidence(row,policy){
  const me=row?.modifier_evidence||{},b=row?.bbe_band||{},p=row?.pitchfit||null;
  const bbeOk=me.bbe_cryptographically_verified===true,pitchOk=me.pitchfit_cryptographically_verified===true;
  const heat=bbeOk&&(b.hrshape_band==='TOP_DECILE'||b.hrshape_band==='TOP_QUARTILE'||b.contact_high===true||b.rising===true);
  const matchup=pitchOk&&p?.fit_status==='TRUE';
  const confirmed=['PROFILE'];if(heat)confirmed.push('HEAT');if(matchup)confirmed.push('MATCHUP');
  return {confirmed_lanes:confirmed,confirmed_lane_count:confirmed.length,PROFILE:{support:policy.qualified===true},HEAT:{available:bbeOk,support:bbeOk?heat:null},MATCHUP:{available:pitchOk,support:pitchOk?matchup:null},VALUE:{available:policy.hr_american_odds!=null,support:null},opportunity:{verified:lineupVerified(row),lineup:n(row?.context?.lineup)},park_context:{hr_factor:n(row?.park_factor?.hr_factor),not_an_evidence_lane:true}};
}
export function buildCompressionEscapeWatch(board={}){
  if(board?.protocol!=='V38_LIVE_RESEARCH_BOARD_V1'||board?.point_in_time!==true||board?.research_only!==true)throw Error('valid point-in-time live research board required');
  if(!Array.isArray(board?.rows))throw Error('board rows required');
  const rows=[];
  for(const r of board.rows){
    if(r?.final_review_queue===true)continue;
    const policy=classifyLockedPolicy(policyInput(r));
    if(!policy.qualified)continue;
    const ev=evidence(r,policy);
    rows.push({player_id:r.player_id,player:r.player,gamePk:r.gamePk,matchup:r.matchup,start_time:r.start_time,gate_count:policy.gate_count,locked_policy:policy,lineup_verified:ev.opportunity.verified,lineup:ev.opportunity.lineup,american_odds:policy.hr_american_odds,hr_price_source:policy.hr_price_source,evidence:ev,watch_state:ev.opportunity.verified&&ev.confirmed_lane_count>=2?'MULTI_LANE_OUTSIDE_REVIEW':ev.opportunity.verified?'QUALIFIED_OUTSIDE_REVIEW':'OUTSIDE_REVIEW_PENDING_OPPORTUNITY'});
  }
  const body={protocol:COMPRESSION_ESCAPE_WATCH_PROTOCOL,date:board.date,generated_at:new Date().toISOString(),source_board_generated_at:board.generated_at??null,source_profile_snapshot_sha256:board.profile_snapshot_sha256??null,point_in_time:true,research_only:true,scoring_enabled:false,production_rule_changed:false,auto_promote:false,semantics:'This artifact protects against review-compression/comfort bias. It records locked-qualified hitters omitted from the research review queue. MULTI_LANE_OUTSIDE_REVIEW means confirmed PROFILE plus at least one independently verified HEAT or MATCHUP lane and verified opportunity. It is a review flag, not an automatic final-cut or ticket recommendation. VALUE is not auto-confirmed from price alone.',summary:{qualified_outside_review:rows.length,verified_opportunity:rows.filter(r=>r.lineup_verified).length,multi_lane_outside_review:rows.filter(r=>r.watch_state==='MULTI_LANE_OUTSIDE_REVIEW').length,by_gate_count:{six_of_six:rows.filter(r=>r.gate_count===6).length,five_of_six:rows.filter(r=>r.gate_count===5).length,protected_four_of_six:rows.filter(r=>r.locked_policy?.label==='PROTECTED_4OF6_700PLUS').length}},rows};
  const sha256=crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');return {...body,sha256};
}

if(import.meta.url===`file://${process.argv[1]}`){const input=process.argv[2];if(!input)throw Error('usage: node scripts/build-v38-compression-escape-watch.mjs <v38-live-research-board.json>');const board=JSON.parse(await fs.readFile(input,'utf8')),out=buildCompressionEscapeWatch(board);await fs.mkdir('snapshots',{recursive:true});const outfile=path.join('snapshots',`v38-compression-escape-watch-${out.date}-${out.generated_at.replace(/[:.]/g,'')}.json`);await fs.writeFile(outfile,JSON.stringify(out,null,2)+'\n');console.log('V38_COMPRESSION_ESCAPE_WATCH='+JSON.stringify({outfile,date:out.date,summary:out.summary,multi_lane:out.rows.filter(r=>r.watch_state==='MULTI_LANE_OUTSIDE_REVIEW').map(r=>({player:r.player,gate_count:r.gate_count,lineup:r.lineup,lanes:r.evidence.confirmed_lanes}))}));}
