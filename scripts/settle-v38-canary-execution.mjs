import fs from 'node:fs';
import crypto from 'node:crypto';

const [freezePath,outcomesPath,outPathArg]=process.argv.slice(2);
if(!freezePath||!outcomesPath) throw Error('Usage: node scripts/settle-v38-canary-execution.mjs <freeze.json> <outcomes.json> [output.json]');
const freeze=JSON.parse(fs.readFileSync(freezePath,'utf8'));
const outcomes=JSON.parse(fs.readFileSync(outcomesPath,'utf8'));
if(freeze.protocol!=='V38_CANARY_EXECUTION_FREEZE_V2') throw Error('invalid canary freeze');
if(freeze.roi_status!=='READY_FOR_POST_SLATE_SETTLEMENT') throw Error('freeze not ROI ready');
if(outcomes.protocol!=='V38_CANARY_OUTCOMES_V1'||outcomes.date!==freeze.date) throw Error('invalid outcomes');
if(!outcomes.settled_at||!Number.isFinite(Date.parse(outcomes.settled_at))) throw Error('missing settled_at');
if(!Array.isArray(outcomes.rows)) throw Error('outcome rows missing');
const resultMap=new Map();
for(const r of outcomes.rows){
  const id=Number(r.player_id); if(!Number.isInteger(id)) throw Error('bad outcome player_id');
  const hr=Number(r.hr); if(hr!==0&&hr!==1) throw Error(`bad hr outcome for ${id}`);
  if(resultMap.has(id)) throw Error(`duplicate outcome ${id}`);
  resultMap.set(id,hr);
}
const required=new Set((freeze.tickets_detail||[]).flatMap(t=>t.player_ids.map(Number)));
for(const id of required) if(!resultMap.has(id)) throw Error(`missing ticketed outcome ${id}`);
const tickets=(freeze.tickets_detail||[]).map(t=>{
  const hrs=t.player_ids.map(id=>resultMap.get(Number(id)));
  const win=hrs.every(x=>x===1);
  const stake=Number(t.stake_units);
  if(!Number.isFinite(stake)||stake<=0) throw Error(`invalid frozen stake ticket ${t.ticket_index}`);
  if(!Number.isFinite(Number(t.combined_decimal))||Number(t.combined_decimal)<=1) throw Error(`invalid frozen price ticket ${t.ticket_index}`);
  const gross=win?stake*Number(t.combined_decimal):0;
  const net=gross-stake;
  return {ticket_index:t.ticket_index,player_ids:t.player_ids,players:t.players,hrs,win,stake_units:+stake.toFixed(4),combined_decimal:Number(t.combined_decimal),gross_return_units:+gross.toFixed(4),net_units:+net.toFixed(4)};
});
const totalStake=+tickets.reduce((s,t)=>s+t.stake_units,0).toFixed(4);
const gross=+tickets.reduce((s,t)=>s+t.gross_return_units,0).toFixed(4);
const net=+tickets.reduce((s,t)=>s+t.net_units,0).toFixed(4);
const wins=tickets.filter(t=>t.win).length;
const roi=totalStake?+(100*net/totalStake).toFixed(2):null;
const ticketedIds=[...required];
const ticketedHr=ticketedIds.reduce((s,id)=>s+(resultMap.get(id)||0),0);
const output={protocol:'V38_CANARY_SETTLEMENT_V1',date:freeze.date,settled_at:outcomes.settled_at,canary_only:true,production_normal_volume:false,source_freeze_sha256:freeze.sha256||crypto.createHash('sha256').update(JSON.stringify(freeze)).digest('hex'),tickets:tickets.length,winning_tickets:wins,ticket_win_rate_pct:tickets.length?+(100*wins/tickets.length).toFixed(2):0,total_stake_units:totalStake,gross_return_units:gross,net_units:net,realized_roi_pct:roi,unique_ticketed_hitters:ticketedIds.length,ticketed_hr:ticketedHr,ticketed_hr_rate_pct:ticketedIds.length?+(100*ticketedHr/ticketedIds.length).toFixed(2):0,tickets_detail:tickets,roi_status:'REALIZED_FROM_FROZEN_PRICE_AND_STAKE',notes:['ROI uses only pregame frozen prices and pregame frozen stake_units from the canary execution freeze.','Outcome rows only determine win/loss; they cannot alter ticket membership, price, or stake.','This settlement remains canary evidence and does not independently enable normal-volume production.']};
const {sha256:_,...body}=output; output.sha256=crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
const outPath=outPathArg||`snapshots/v38-canary-settlement-${freeze.date}.json`;
fs.mkdirSync(outPath.split('/').slice(0,-1).join('/')||'.',{recursive:true}); fs.writeFileSync(outPath,JSON.stringify(output,null,2)+'\n');
console.log(`V38_CANARY_SETTLEMENT_PATH=${outPath}`);
console.log(`V38_CANARY_SETTLEMENT=${JSON.stringify({date:output.date,tickets:output.tickets,winning_tickets:wins,total_stake_units:totalStake,net_units:net,realized_roi_pct:roi})}`);
