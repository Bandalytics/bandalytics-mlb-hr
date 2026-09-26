import fs from 'node:fs';
import crypto from 'node:crypto';

const args=process.argv.slice(2);
if(!args.length) throw Error('Usage: node scripts/summarize-v38-canary-reactivation.mjs <settlement.json> [...] [--out path]');
let outPath='snapshots/v38-canary-reactivation-readiness.json';
const files=[];
for(let i=0;i<args.length;i++){
  if(args[i]==='--out'){outPath=args[++i]; if(!outPath) throw Error('missing --out path');}
  else files.push(args[i]);
}
if(!files.length) throw Error('no settlement files');
const seenDates=new Set();
const settlements=files.map(f=>{
  const z=JSON.parse(fs.readFileSync(f,'utf8'));
  if(z.protocol!=='V38_CANARY_SETTLEMENT_V1'||z.canary_only!==true||z.production_normal_volume!==false) throw Error(`invalid settlement ${f}`);
  if(z.roi_status!=='REALIZED_FROM_VERIFIED_FROZEN_PRICE_AND_STAKE') throw Error(`unverified ROI ${f}`);
  if(!z.date||seenDates.has(z.date)) throw Error(`duplicate/missing date ${z.date||f}`);
  seenDates.add(z.date);
  if(!z.sha256) throw Error(`missing sha256 ${f}`);
  const {sha256,...body}=z;
  const calc=crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
  if(calc!==sha256) throw Error(`settlement sha256 mismatch ${f}`);
  return z;
}).sort((a,b)=>a.date.localeCompare(b.date));
const slates=settlements.length;
const tickets=settlements.reduce((s,z)=>s+Number(z.tickets||0),0);
const wins=settlements.reduce((s,z)=>s+Number(z.winning_tickets||0),0);
const stake=+settlements.reduce((s,z)=>s+Number(z.total_stake_units||0),0).toFixed(4);
const net=+settlements.reduce((s,z)=>s+Number(z.net_units||0),0).toFixed(4);
const uniqueHitters=settlements.reduce((s,z)=>s+Number(z.unique_ticketed_hitters||0),0);
const ticketedHr=settlements.reduce((s,z)=>s+Number(z.ticketed_hr||0),0);
const realizedRoi=stake?+(100*net/stake).toFixed(2):null;
const status=slates<5?'NEED_MORE_FORWARD_SLATES':slates<10?'INITIAL_REACTIVATION_REVIEW':'FULL_REACTIVATION_REVIEW_READY';
const output={
  protocol:'V38_CANARY_REACTIVATION_READINESS_V1',generated_at:new Date().toISOString(),canary_only:true,production_normal_volume:false,
  forward_slates:slates,first_date:settlements[0].date,last_date:settlements.at(-1).date,
  total_tickets:tickets,winning_tickets:wins,ticket_win_rate_pct:tickets?+(100*wins/tickets).toFixed(2):0,
  total_stake_units:stake,net_units:net,realized_roi_pct:realizedRoi,
  ticketed_hitter_opportunities:uniqueHitters,ticketed_hr:ticketedHr,ticketed_hr_rate_pct:uniqueHitters?+(100*ticketedHr/uniqueHitters).toFixed(2):0,
  readiness_status:status,
  evidence_gate:{minimum_initial_review_slates:5,preferred_full_review_slates:10,all_settlements_verified:true,automatic_production_enable:false},
  slate_rows:settlements.map(z=>({date:z.date,tickets:z.tickets,winning_tickets:z.winning_tickets,total_stake_units:z.total_stake_units,net_units:z.net_units,realized_roi_pct:z.realized_roi_pct,settlement_sha256:z.sha256})),
  notes:['This is a forward canary evidence summary, not an automatic production switch.','Portfolio ROI is recomputed from raw frozen-stake totals across slates, never by averaging per-slate ROI percentages.','Five slates permits an initial review; ten slates is the preferred full reactivation review point.','No Core/profile or ticket rule is changed by this summary.']
};
const {sha256:_,...body}=output; output.sha256=crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
fs.mkdirSync(outPath.split('/').slice(0,-1).join('/')||'.',{recursive:true});
fs.writeFileSync(outPath,JSON.stringify(output,null,2)+'\n');
console.log(`V38_CANARY_REACTIVATION_READINESS_PATH=${outPath}`);
console.log(`V38_CANARY_REACTIVATION_READINESS=${JSON.stringify({forward_slates:slates,total_tickets:tickets,winning_tickets:wins,total_stake_units:stake,net_units:net,realized_roi_pct:realizedRoi,readiness_status:status})}`);
