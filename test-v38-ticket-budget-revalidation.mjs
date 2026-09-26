import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

fs.mkdirSync('snapshots',{recursive:true});
const rows=[];
for(let i=0;i<20;i++) rows.push({player_id:1000+i,player:`P${i}`,gamePk:5000+(i%10),lineup_slot:(i%9)+1,gate_count:i<10?6:5,homer:i%4===0,pitchfit_band:i%3===0?'TOP_DECILE':'TOP_QUARTILE',bbe_hrshape_band:'TOP_QUARTILE',starter_hr9_band:i%2===0?'HIGH_GE_1_5':'MID_1_2_TO_1_5',revalidation:{anti_overcompression:true}});
const base={protocol:'V38_WORKFLOW_REVALIDATION_V1',date:'2099-01-01',point_in_time:true,as_of_verified:true,forward_leakage_days:0,rows};
const run=(obj,label)=>{const p=`/tmp/v38-ticket-budget-${label}.json`;fs.writeFileSync(p,JSON.stringify(obj));const r=spawnSync(process.execPath,['scripts/evaluate-v38-ticket-budget-revalidation.mjs',p],{encoding:'utf8'});if(r.status!==0) throw Error(r.stderr||r.stdout);return JSON.parse(fs.readFileSync('snapshots/v38-ticket-budget-revalidation-2099-01-01.json','utf8'));};
const a=run(base,'a');
const flipped={...base,rows:rows.map(r=>({...r,homer:!r.homer}))};
const b=run(flipped,'b');
if(a.protocol!=='V38_TICKET_BUDGET_REVALIDATION_V1') throw Error('protocol');
if(JSON.stringify(a.budget_shares_pct)!==JSON.stringify([25,33,40,50])) throw Error('budget shares');
for(const key of Object.keys(a.results)){
  const ra=a.results[key],rb=b.results[key];
  if(ra.requested_tickets!==rb.requested_tickets) throw Error('outcome leakage into budget');
  for(const name of Object.keys(ra.variants)){
    const x=ra.variants[name],y=rb.variants[name];
    if(x.tickets>x.requested_tickets) throw Error('budget exceeded');
    for(const f of ['requested_tickets','tickets','budget_utilization_pct','unique_ticketed_hitters','serious_board_coverage_pct','max_hitter_uses','avg_hitter_uses','priority_leg_share_pct']) if(x[f]!==y[f]) throw Error(`outcome leakage ${key} ${name} ${f}`);
    if(name==='BROAD_ONE_PATH'&&x.max_hitter_uses>1) throw Error('one path cap broken');
    if(name!=='BROAD_ONE_PATH'&&x.max_hitter_uses>2) throw Error('two path cap broken');
  }
}
fs.rmSync('snapshots/v38-ticket-budget-revalidation-2099-01-01.json',{force:true});
console.log('v38 ticket budget revalidation tests passed');
