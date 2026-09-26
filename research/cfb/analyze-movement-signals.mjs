#!/usr/bin/env node
import fs from 'node:fs';

const p=process.argv[2];
if(!p){console.error('usage: node research/cfb/analyze-movement-signals.mjs <canonical.json>');process.exit(2)}
const rows=JSON.parse(fs.readFileSync(p,'utf8'));
if(!Array.isArray(rows)){console.error('input must be a JSON array');process.exit(2)}
const num=x=>x===null||x===undefined||x===''?null:Number(x);
const pct=(w,l)=>w+l? w/(w+l):null;
const settle=(v)=>v>0?'W':v<0?'L':'P';
const tally=(vals)=>{let W=0,L=0,P=0;for(const v of vals){if(v==='W')W++;else if(v==='L')L++;else if(v==='P')P++;}return{n:W+L+P,W,L,P,hit_rate_no_push:pct(W,L)}};
const keys=[3,6,7,10,14];
const crosses=(a,b,k)=>a!==null&&b!==null&&((Math.abs(a)<k&&Math.abs(b)>k)||(Math.abs(a)>k&&Math.abs(b)<k)||Math.abs(a)===k||Math.abs(b)===k);
const mag=x=>x===null?'MISSING':Math.abs(x)<0.5?'<0.5':Math.abs(x)<1?'0.5-0.99':Math.abs(x)<2?'1-1.99':Math.abs(x)<3?'2-2.99':'3+';

const enriched=[];
for(const r of rows){
  const hs=num(r.home_score),as=num(r.away_score),close=num(r.spread_home),open=num(r.spread_open_home),total=num(r.total),totalOpen=num(r.total_open);
  if(hs===null||as===null) continue;
  const margin=hs-as, points=hs+as;
  const homeATS=close===null?null:settle(margin+close);
  const awayATS=homeATS===null?null:homeATS==='W'?'L':homeATS==='L'?'W':'P';
  const move=close===null||open===null?null:close-open;
  // Home spread becoming more negative = market moved toward home. More positive = toward away.
  const sideMove=move===null||move===0?'NONE':move<0?'HOME':'AWAY';
  const followSide=sideMove==='HOME'?homeATS:sideMove==='AWAY'?awayATS:null;
  const fadeSide=followSide===null?null:followSide==='W'?'L':followSide==='L'?'W':'P';
  const totalMove=total===null||totalOpen===null?null:total-totalOpen;
  const overResult=total===null?null:settle(points-total);
  const underResult=overResult===null?null:overResult==='W'?'L':overResult==='L'?'W':'P';
  const followTotal=totalMove===null||totalMove===0?null:totalMove>0?overResult:underResult;
  const fadeTotal=followTotal===null?null:followTotal==='W'?'L':followTotal==='L'?'W':'P';
  enriched.push({...r,homeATS,awayATS,spread_move:move,side_move:sideMove,follow_side:followSide,fade_side:fadeSide,total_move:totalMove,follow_total:followTotal,fade_total:fadeTotal});
}

const by=(fn,key)=>Object.fromEntries([...new Set(enriched.map(fn))].sort().map(g=>[g,tally(enriched.filter(r=>fn(r)===g).map(r=>r[key]))]));
const gameMap=new Map();
for(const r of enriched){
  const id=String(r.game_id??`${r.season}|${r.week}|${r.away_team}|${r.home_team}`);
  if(!gameMap.has(id))gameMap.set(id,[]); gameMap.get(id).push(r);
}
const agreement=[];
for(const [game_id,rs] of gameMap){
  const dirs=rs.filter(r=>r.side_move!=='NONE').map(r=>r.side_move);
  if(!dirs.length)continue;
  const home=dirs.filter(x=>x==='HOME').length,away=dirs.filter(x=>x==='AWAY').length;
  const agreed=home===dirs.length||away===dirs.length;
  const majority=home===away?'TIE':home>away?'HOME':'AWAY';
  // Settle against each provider's own recorded closing line, then report only rows aligned with majority direction.
  const aligned=rs.filter(r=>r.side_move===majority).map(r=>r.follow_side).filter(Boolean);
  agreement.push({game_id,providers:rs.length,moving_providers:dirs.length,agreed,majority,results:aligned});
}
const flatten=x=>x.flatMap(r=>r.results);
const keyCross={};
for(const k of keys){
  const rs=enriched.filter(r=>crosses(num(r.spread_open_home),num(r.spread_home),k));
  keyCross[String(k)]={rows:rs.length,follow_move:tally(rs.map(r=>r.follow_side)),fade_move:tally(rs.map(r=>r.fade_side))};
}
const report={
  rows:enriched.length,
  caveat:'Research-only. Recorded open-to-final-provider movement is not timestamped intraday steam and public-ticket hypotheses remain untested.',
  follow_spread_move:tally(enriched.map(r=>r.follow_side)),
  fade_spread_move:tally(enriched.map(r=>r.fade_side)),
  follow_spread_by_magnitude:by(r=>mag(r.spread_move),'follow_side'),
  follow_spread_by_closing_role:by(r=>{const s=num(r.spread_home);if(s===null)return'MISSING';return s<0?'HOME_FAVORITE':s>0?'HOME_DOG':'PICKEM'},'follow_side'),
  key_crossings:keyCross,
  follow_total_move:tally(enriched.map(r=>r.follow_total)),
  fade_total_move:tally(enriched.map(r=>r.fade_total)),
  follow_total_by_magnitude:by(r=>mag(r.total_move),'follow_total'),
  provider_direction:{
    unanimous:tally(flatten(agreement.filter(x=>x.agreed))),
    non_unanimous_majority:tally(flatten(agreement.filter(x=>!x.agreed&&x.majority!=='TIE'))),
    games_with_2plus_providers:agreement.filter(x=>x.providers>=2).length
  },
  verified_public_ticket_rows:enriched.filter(r=>['ticket_pct_home','ticket_pct_away','ticket_pct_over','ticket_pct_under'].some(k=>r[k]!==null&&r[k]!==undefined&&r[k]!=='' )).length
};
console.log(JSON.stringify(report,null,2));
