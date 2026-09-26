#!/usr/bin/env node
import fs from 'node:fs';

const path=process.argv[2];
if(!path){console.error('usage: node research/cfb/validate-market-input.mjs <csv>');process.exit(2)}
const raw=fs.readFileSync(path,'utf8').trim().split(/\r?\n/);
const header=raw[0].split(',');
const required=['season','week','kickoff','game_id','home_team','away_team','home_score','away_score','provider','snapshot_time','spread_home','spread_open_home','total','total_open','moneyline_home','moneyline_away','ticket_pct_home','ticket_pct_away','ticket_pct_over','ticket_pct_under','ticket_source'];
const missing=required.filter(x=>!header.includes(x));
if(missing.length){console.error('missing columns:',missing.join(', '));process.exit(1)}
let bad=0;
for(let i=1;i<raw.length;i++){
  const c=raw[i].split(',');
  if(c.length!==header.length){bad++;continue}
  const row=Object.fromEntries(header.map((h,j)=>[h,c[j]]));
  if(row.kickoff && row.snapshot_time && Date.parse(row.snapshot_time)>=Date.parse(row.kickoff)) bad++;
  for(const k of ['ticket_pct_home','ticket_pct_away','ticket_pct_over','ticket_pct_under']){
    if(row[k]!=='' && (+row[k]<0 || +row[k]>100)) bad++;
  }
}
console.log(JSON.stringify({rows:Math.max(0,raw.length-1),bad_rows:bad,missing_columns:missing},null,2));
process.exit(bad?1:0);
