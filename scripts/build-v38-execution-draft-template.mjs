import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

export const EXECUTION_DRAFT_TEMPLATE_PROTOCOL='BANDALYTICS_EXECUTION_DRAFT_TEMPLATE_V2';
export function buildExecutionDraftTemplate(readiness={},compressionWatch=null){
  if(readiness?.protocol!=='BANDALYTICS_LOCK_READINESS_V2'||readiness?.point_in_time!==true||readiness?.research_only!==true)throw Error('valid lock readiness v2 required');
  if(!Array.isArray(readiness?.rows))throw Error('readiness rows required');
  if(compressionWatch!=null&&(compressionWatch?.protocol!=='BANDALYTICS_COMPRESSION_ESCAPE_WATCH_V1'||compressionWatch?.point_in_time!==true||compressionWatch?.research_only!==true||compressionWatch?.date!==readiness?.date))throw Error('valid same-date compression escape watch required');
  const rows=readiness.rows.map(r=>({
    player:r.player,player_id:r.player_id,gamePk:r.gamePk,matchup:r.matchup,start_time:r.start_time,
    readiness_state:r.readiness_state,locked_policy:r.locked_policy,american_odds:r.american_odds,hr_price_source:r.hr_price_source,
    lineup:r.lineup,lineup_verified:r.lineup_verified,evidence_lane_inputs:r.evidence_lane_inputs,
    eligible_for_final_cut:r.readiness_state==='ACTIONABLE_REVIEW',
    final_cut:null,cut_type:null,cut_reason:null,exposure_state:'UNCLASSIFIED',evidence_lanes:[],zero_path_reason:null,ticket_paths:null
  }));
  const compression_watch=(Array.isArray(compressionWatch?.rows)?compressionWatch.rows:[]).filter(r=>r?.watch_state==='MULTI_LANE_OUTSIDE_REVIEW').map(r=>({
    player:r.player,player_id:r.player_id,gamePk:r.gamePk,matchup:r.matchup,start_time:r.start_time,gate_count:r.gate_count,lineup:r.lineup,lineup_verified:r.lineup_verified,american_odds:r.american_odds,hr_price_source:r.hr_price_source,confirmed_lanes:r?.evidence?.confirmed_lanes??[],confirmed_lane_count:r?.evidence?.confirmed_lane_count??null,watch_state:r.watch_state,review_disposition:null,review_cut_type:null,review_reason:null,auto_promote:false
  }));
  const body={protocol:EXECUTION_DRAFT_TEMPLATE_PROTOCOL,date:readiness.date,generated_at:new Date().toISOString(),source_readiness_sha256:readiness.sha256??null,source_compression_watch_sha256:compressionWatch?.sha256??null,point_in_time:true,research_only:true,decision_state:'UNRESOLVED',cut_labels:['BASEBALL_CUT','COMFORT_CUT'],instructions:'Fill final_cut, cut_type/cut_reason for cuts, exposure_state, evidence_lanes, zero_path_reason, and tickets for readiness rows. Separately disposition every compression_watch hitter as REVIEWED_KEEP or REVIEWED_CUT with a review_reason; REVIEWED_CUT also requires review_cut_type BASEBALL_CUT or COMFORT_CUT. Compression watch never auto-promotes. Do not add ticket exposure outside ACTIONABLE_REVIEW unless the hitter is deliberately moved into the review/final-cut process before freeze.',rows,compression_watch,tickets:[]};
  const sha256=crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');return {...body,sha256};
}
if(import.meta.url===`file://${process.argv[1]}`){const [input,watchFile]=process.argv.slice(2);if(!input)throw Error('usage: node scripts/build-v38-execution-draft-template.mjs <lock-readiness.json> [compression-escape-watch.json]');const readiness=JSON.parse(await fs.readFile(input,'utf8')),watch=watchFile?JSON.parse(await fs.readFile(watchFile,'utf8')):null,out=buildExecutionDraftTemplate(readiness,watch);await fs.mkdir('execution-draft-templates',{recursive:true});const outfile=path.join('execution-draft-templates',`${out.date}-${out.generated_at.replace(/[:.]/g,'-')}.json`);await fs.writeFile(outfile,JSON.stringify(out,null,2)+'\n');console.log('V38_EXECUTION_DRAFT_TEMPLATE='+JSON.stringify({outfile,date:out.date,rows:out.rows.length,actionable:out.rows.filter(r=>r.eligible_for_final_cut).length,compression_watch:out.compression_watch.length,sha256:out.sha256}));}
