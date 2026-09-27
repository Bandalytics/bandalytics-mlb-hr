import fs from 'node:fs';
import crypto from 'node:crypto';

const [ledgerPath,settlementPath,outPathArg]=process.argv.slice(2);
if(!settlementPath) throw Error('Usage: node scripts/update-v38-canary-ledger.mjs <existing-ledger.json|NONE> <settlement.json> [output.json]');
const round4=n=>+Number(n).toFixed(4);
const settlement=JSON.parse(fs.readFileSync(settlementPath,'utf8'));
if(settlement.protocol!=='V38_CANARY_SETTLEMENT_V1'||settlement.canary_only!==true||settlement.production_normal_volume!==false) throw Error('invalid canary settlement');
if(settlement.roi_status!=='REALIZED_FROM_VERIFIED_FROZEN_PRICE_STAKE_AND_OUTCOMES') throw Error('settlement not verified');
if(settlement.source_architecture_contract!=='HOLDOUT_ALIGNED_40PCT_SERIOUS_BOARD_V1') throw Error('settlement not holdout aligned');
if(!settlement.source_freeze_sha256||!settlement.source_preflight_sha256||settlement.source_preflight_status!=='READY_FOR_CONTROLLED_FORWARD_CANARY'||!settlement.source_outcomes_sha256||!settlement.source_outcomes_source) throw Error('settlement provenance incomplete');
if(!settlement.sha256) throw Error('settlement sha256 missing');
const {sha256:claimedSettlementSha,...settlementBody}=settlement;
const computedSettlementSha=crypto.createHash('sha256').update(JSON.stringify(settlementBody)).digest('hex');
if(claimedSettlementSha!==computedSettlementSha) throw Error('settlement sha256 mismatch');
if(!settlement.date||!/^\d{4}-\d{2}-\d{2}$/.test(settlement.date)) throw Error('invalid settlement date');
if(!Number.isFinite(Number(settlement.total_stake_units))||Number(settlement.total_stake_units)<=0||!Number.isFinite(Number(settlement.net_units))) throw Error('invalid settlement financials');

let prior={protocol:'V38_CANARY_LEDGER_V1',canary_only:true,production_normal_volume:false,rows:[]};
if(ledgerPath&&ledgerPath!=='NONE'){
  prior=JSON.parse(fs.readFileSync(ledgerPath,'utf8'));
  if(prior.protocol!=='V38_CANARY_LEDGER_V1'||prior.canary_only!==true||prior.production_normal_volume!==false||prior.architecture_contract!=='HOLDOUT_ALIGNED_40PCT_SERIOUS_BOARD_V1'||prior.automatic_production_enable!==false||!Array.isArray(prior.rows)||!prior.sha256) throw Error('invalid existing ledger');
  const {sha256:claimedLedgerSha,...ledgerBody}=prior;
  const computedLedgerSha=crypto.createHash('sha256').update(JSON.stringify(ledgerBody)).digest('hex');
  if(claimedLedgerSha!==computedLedgerSha) throw Error('existing ledger sha256 mismatch');
  const priorStake=round4(prior.rows.reduce((s,r)=>s+Number(r.total_stake_units),0));
  const priorNet=round4(prior.rows.reduce((s,r)=>s+Number(r.net_units),0));
  const priorTickets=prior.rows.reduce((s,r)=>s+Number(r.tickets||0),0);
  const priorWins=prior.rows.reduce((s,r)=>s+Number(r.winning_tickets||0),0);
  const priorRoi=priorStake?+(100*priorNet/priorStake).toFixed(2):null;
  if(prior.total_slates!==prior.rows.length||Number(prior.total_tickets)!==priorTickets||Number(prior.winning_tickets)!==priorWins||Number(prior.total_stake_units)!==priorStake||Number(prior.net_units)!==priorNet||prior.realized_roi_pct!==priorRoi) throw Error('existing ledger aggregate mismatch');
}
const rows=[...(prior.rows||[])];
const existing=rows.find(r=>r.date===settlement.date);
if(existing){
  if(existing.settlement_sha256!==computedSettlementSha) throw Error(`conflicting settlement for ${settlement.date}`);
  throw Error(`duplicate settlement date ${settlement.date}`);
}
const row={date:settlement.date,settled_at:settlement.settled_at,settlement_sha256:computedSettlementSha,freeze_sha256:settlement.source_freeze_sha256,preflight_sha256:settlement.source_preflight_sha256,outcomes_sha256:settlement.source_outcomes_sha256,outcomes_source:settlement.source_outcomes_source,slate_band:settlement.source_slate_band,candidate_pool_rows:settlement.source_candidate_pool_rows,tickets:settlement.tickets,winning_tickets:settlement.winning_tickets,total_stake_units:round4(settlement.total_stake_units),net_units:round4(settlement.net_units)};
rows.push(row); rows.sort((a,b)=>a.date.localeCompare(b.date));
const totalStake=round4(rows.reduce((s,r)=>s+Number(r.total_stake_units),0));
const net=round4(rows.reduce((s,r)=>s+Number(r.net_units),0));
const output={protocol:'V38_CANARY_LEDGER_V1',generated_at:new Date().toISOString(),canary_only:true,production_normal_volume:false,architecture_contract:'HOLDOUT_ALIGNED_40PCT_SERIOUS_BOARD_V1',rows,total_slates:rows.length,total_tickets:rows.reduce((s,r)=>s+Number(r.tickets||0),0),winning_tickets:rows.reduce((s,r)=>s+Number(r.winning_tickets||0),0),total_stake_units:totalStake,net_units:net,realized_roi_pct:totalStake?+(100*net/totalStake).toFixed(2):null,automatic_production_enable:false,notes:['Append-only forward-canary ledger. Duplicate dates are rejected, including same-hash replays.','Every row must originate from a verified, holdout-aligned settlement chained to freeze, preflight, and outcome hashes.','Portfolio ROI is recomputed from raw frozen stake/net totals, never averaged across slates.','This ledger cannot enable normal-volume production.']};
const {sha256:_,...body}=output; output.sha256=crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
const outPath=outPathArg||'snapshots/v38-canary-ledger.json';
fs.mkdirSync(outPath.split('/').slice(0,-1).join('/')||'.',{recursive:true});
fs.writeFileSync(outPath,JSON.stringify(output,null,2)+'\n');
console.log(`V38_CANARY_LEDGER_PATH=${outPath}`);
console.log(`V38_CANARY_LEDGER=${JSON.stringify({total_slates:output.total_slates,total_tickets:output.total_tickets,total_stake_units:output.total_stake_units,net_units:output.net_units,realized_roi_pct:output.realized_roi_pct})}`);
