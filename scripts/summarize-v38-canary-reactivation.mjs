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
const round4=n=>+Number(n).toFixed(4);
const bandFor=n=>n<=50?'SMALL_LE_50':n<=75?'MEDIUM_51_75':'LARGE_GE_76';
const expectedBudgetFor=n=>Math.max(1,Math.ceil(Math.max(1,Math.ceil(n*0.40))*0.40));
const seenDates=new Set();
const settlements=files.map(f=>{
  const z=JSON.parse(fs.readFileSync(f,'utf8'));
  if(z.protocol!=='V38_CANARY_SETTLEMENT_V1'||z.canary_only!==true||z.production_normal_volume!==false) throw Error(`invalid settlement ${f}`);
  if(z.source_architecture_contract!=='HOLDOUT_ALIGNED_40PCT_SERIOUS_BOARD_V1') throw Error(`non-holdout-aligned settlement ${f}`);
  if(z.roi_status!=='REALIZED_FROM_VERIFIED_FROZEN_PRICE_STAKE_AND_OUTCOMES') throw Error(`unverified ROI/outcomes ${f}`);
  if(!z.source_outcomes_sha256||!z.source_outcomes_source) throw Error(`missing outcome provenance ${f}`);
  const candidateN=Number(z.source_candidate_pool_rows);
  if(!Number.isInteger(candidateN)||candidateN<1) throw Error(`invalid candidate pool size ${f}`);
  const expectedBand=bandFor(candidateN);
  if(z.source_slate_band!==expectedBand) throw Error(`slate-band mismatch ${f}: expected ${expectedBand}`);
  const expectedTickets=expectedBudgetFor(candidateN);
  if(Number(z.tickets)!==expectedTickets) throw Error(`budget-underfilled canary settlement ${f}: ${z.tickets} != ${expectedTickets}`);
  if(!z.date||seenDates.has(z.date)) throw Error(`duplicate/missing date ${z.date||f}`);
  seenDates.add(z.date);
  if(!z.sha256) throw Error(`missing sha256 ${f}`);
  const {sha256,...body}=z;
  const calc=crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
  if(calc!==sha256) throw Error(`settlement sha256 mismatch ${f}`);
  if(!Array.isArray(z.tickets_detail)||z.tickets_detail.length!==Number(z.tickets)) throw Error(`ticket detail mismatch ${f}`);
  const playerResults=new Map();
  let detailStake=0, detailNet=0, detailWins=0;
  for(const t of z.tickets_detail){
    if(!Array.isArray(t.player_ids)||t.player_ids.length!==2||!Array.isArray(t.hrs)||t.hrs.length!==2) throw Error(`bad ticket detail ${f}`);
    const stake=Number(t.stake_units), net=Number(t.net_units);
    if(!Number.isFinite(stake)||stake<=0||!Number.isFinite(net)) throw Error(`bad ticket financials ${f}`);
    const computedWin=t.hrs.every(x=>Number(x)===1);
    if(Boolean(t.win)!==computedWin) throw Error(`ticket win mismatch ${f}`);
    detailStake+=stake; detailNet+=net; if(computedWin) detailWins++;
    for(let i=0;i<2;i++){
      const id=Number(t.player_ids[i]), hr=Number(t.hrs[i]);
      if(!Number.isInteger(id)||(hr!==0&&hr!==1)) throw Error(`bad ticket outcome detail ${f}`);
      if(playerResults.has(id)&&playerResults.get(id)!==hr) throw Error(`conflicting repeated hitter outcome ${f}`);
      playerResults.set(id,hr);
    }
  }
  const detailHr=[...playerResults.values()].reduce((s,x)=>s+x,0);
  if(detailWins!==Number(z.winning_tickets)) throw Error(`winning ticket total mismatch ${f}`);
  if(round4(detailStake)!==round4(z.total_stake_units)||round4(detailNet)!==round4(z.net_units)) throw Error(`financial total mismatch ${f}`);
  if(playerResults.size!==Number(z.unique_ticketed_hitters)||detailHr!==Number(z.ticketed_hr)) throw Error(`ticketed hitter total mismatch ${f}`);
  const expectedRoi=detailStake?+(100*detailNet/detailStake).toFixed(2):null;
  if(expectedRoi!==z.realized_roi_pct) throw Error(`settlement ROI mismatch ${f}`);
  return {...z,expected_ticket_budget:expectedTickets};
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
const bandCounts=Object.fromEntries(['SMALL_LE_50','MEDIUM_51_75','LARGE_GE_76'].map(b=>[b,settlements.filter(z=>z.source_slate_band===b).length]));
const output={
  protocol:'V38_CANARY_REACTIVATION_READINESS_V1',generated_at:new Date().toISOString(),canary_only:true,production_normal_volume:false,architecture_contract:'HOLDOUT_ALIGNED_40PCT_SERIOUS_BOARD_V1',
  forward_slates:slates,first_date:settlements[0].date,last_date:settlements.at(-1).date,slate_band_counts:bandCounts,
  total_tickets:tickets,winning_tickets:wins,ticket_win_rate_pct:tickets?+(100*wins/tickets).toFixed(2):0,
  total_stake_units:stake,net_units:net,realized_roi_pct:realizedRoi,
  ticketed_hitter_opportunities:uniqueHitters,ticketed_hr:ticketedHr,ticketed_hr_rate_pct:uniqueHitters?+(100*ticketedHr/uniqueHitters).toFixed(2):0,
  readiness_status:status,
  evidence_gate:{minimum_initial_review_slates:5,preferred_full_review_slates:10,all_settlements_verified:true,all_settlements_holdout_aligned:true,all_settlements_full_ticket_budget:true,all_outcomes_hashed_and_sourced:true,internal_settlement_totals_verified:true,automatic_production_enable:false},
  slate_rows:settlements.map(z=>({date:z.date,slate_band:z.source_slate_band,candidate_pool_rows:z.source_candidate_pool_rows,expected_ticket_budget:z.expected_ticket_budget,tickets:z.tickets,winning_tickets:z.winning_tickets,total_stake_units:z.total_stake_units,net_units:z.net_units,realized_roi_pct:z.realized_roi_pct,outcomes_source:z.source_outcomes_source,outcomes_sha256:z.source_outcomes_sha256,settlement_sha256:z.sha256})),
  notes:['This is a forward canary evidence summary, not an automatic production switch.','Only settlements sourced from the holdout-aligned candidate-pool slate bands and top-40% serious-board contract are accepted.','Every accepted settlement must also trace to a hashed outcome artifact with explicit source provenance.','A forward slate counts toward reactivation only when it fills the same 40% requested ticket budget used by the holdout; opportunity-driven underfilled slates remain research observations but cannot advance the 5/10-slate readiness gate.','Portfolio ROI is recomputed from raw frozen-stake totals across slates, never by averaging per-slate ROI percentages.','Each settlement hash and its ticket-level financial/outcome totals are revalidated before aggregation.','Five comparable slates permits an initial review; ten comparable slates is the preferred full reactivation review point.','No Core/profile or ticket rule is changed by this summary.']
};
const {sha256:_,...body}=output; output.sha256=crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
fs.mkdirSync(outPath.split('/').slice(0,-1).join('/')||'.',{recursive:true});
fs.writeFileSync(outPath,JSON.stringify(output,null,2)+'\n');
console.log(`V38_CANARY_REACTIVATION_READINESS_PATH=${outPath}`);
console.log(`V38_CANARY_REACTIVATION_READINESS=${JSON.stringify({forward_slates:slates,total_tickets:tickets,winning_tickets:wins,total_stake_units:stake,net_units:net,realized_roi_pct:realizedRoi,readiness_status:status,slate_band_counts:bandCounts})}`);
