import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

export const EXECUTION_DRAFT_TEMPLATE_PROTOCOL='BANDALYTICS_EXECUTION_DRAFT_TEMPLATE_V1';
export function buildExecutionDraftTemplate(readiness={}){
  if(readiness?.protocol!=='BANDALYTICS_LOCK_READINESS_V2'||readiness?.point_in_time!==true||readiness?.research_only!==true)throw Error('valid lock readiness v2 required');
  if(!Array.isArray(readiness?.rows))throw Error('readiness rows required');
  const rows=readiness.rows.map(r=>({
    player:r.player,player_id:r.player_id,gamePk:r.gamePk,matchup:r.matchup,start_time:r.start_time,
    readiness_state:r.readiness_state,locked_policy:r.locked_policy,american_odds:r.american_odds,hr_price_source:r.hr_price_source,
    lineup:r.lineup,lineup_verified:r.lineup_verified,evidence_lane_inputs:r.evidence_lane_inputs,
    eligible_for_final_cut:r.readiness_state==='ACTIONABLE_REVIEW',
    final_cut:null,cut_reason:null,exposure_state:'UNCLASSIFIED',evidence_lanes:[],zero_path_reason:null,ticket_paths:null
  }));
  const body={protocol:EXECUTION_DRAFT_TEMPLATE_PROTOCOL,date:readiness.date,generated_at:new Date().toISOString(),source_readiness_sha256:readiness.sha256??null,point_in_time:true,research_only:true,decision_state:'UNRESOLVED',instructions:'Fill final_cut, cut_reason, exposure_state, evidence_lanes, zero_path_reason, and tickets. Do not add ticket exposure outside ACTIONABLE_REVIEW. Evidence-lane inputs are frozen provenance; they do not auto-assign lanes or exposure.',rows,tickets:[]};
  const sha256=crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');return {...body,sha256};
}
if(import.meta.url===`file://${process.argv[1]}`){const input=process.argv[2];if(!input)throw Error('usage: node scripts/build-v38-execution-draft-template.mjs <lock-readiness.json>');const readiness=JSON.parse(await fs.readFile(input,'utf8')),out=buildExecutionDraftTemplate(readiness);await fs.mkdir('execution-draft-templates',{recursive:true});const outfile=path.join('execution-draft-templates',`${out.date}-${out.generated_at.replace(/[:.]/g,'-')}.json`);await fs.writeFile(outfile,JSON.stringify(out,null,2)+'\n');console.log('V38_EXECUTION_DRAFT_TEMPLATE='+JSON.stringify({outfile,date:out.date,rows:out.rows.length,actionable:out.rows.filter(r=>r.eligible_for_final_cut).length,sha256:out.sha256}));}
