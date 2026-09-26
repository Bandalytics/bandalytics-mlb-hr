#!/usr/bin/env node
// Adapter for the public jackschooley/cfb-betting closing-line CSVs (2014-2019).
// RESEARCH BASELINE ONLY: this source has one spread/total snapshot and cannot test movement.
import fs from 'node:fs';

const p=process.argv[2], season=Number(process.argv[3]);
if(!p||!season){console.error('usage: node research/cfb/adapt-jackschooley-closing.mjs <csv> <season>');process.exit(2)}
const lines=fs.readFileSync(p,'utf8').trim().split(/\r?\n/);
const h=lines[0].split(',');
const rows=lines.slice(1).map(s=>{const c=s.split(',');return Object.fromEntries(h.map((k,i)=>[k,c[i]]))});
const num=x=>x===''||x==null?null:Number(x);
const out=rows.map((r,i)=>{
  // Source spread is the AWAY team's spread. Normalize to home spread.
  const awaySpread=num(r.spread);
  return {
    season,week:null,kickoff:null,game_id:`legacy-${season}-${i+1}`,
    home_team:r.home,away_team:r.away,home_score:num(r.home_score),away_score:num(r.away_score),
    provider:'sportsbookreviewsonline-via-jackschooley',snapshot_time:null,
    spread_home:awaySpread===null?null:-awaySpread,spread_open_home:null,
    total:num(r['o/u']),total_open:null,moneyline_home:num(r.home_ml),moneyline_away:num(r.away_ml),
    ticket_pct_home:null,ticket_pct_away:null,ticket_pct_over:null,ticket_pct_under:null,ticket_source:null,
    source_scope:'CLOSING_ONLY_BASELINE'
  };
});
console.log(JSON.stringify(out,null,2));
