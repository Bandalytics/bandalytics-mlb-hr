#!/usr/bin/env node
import fs from 'node:fs';

const p=process.argv[2];
if(!p){console.error('usage: node research/cfb/analyze-market-replay.mjs <json>');process.exit(2)}
const rows=JSON.parse(fs.readFileSync(p,'utf8'));
const num=x=>x===null||x===undefined||x===''?null:Number(x);
const out=[];
for(const r of rows){
  const hs=num(r.home_score), as=num(r.away_score), s=num(r.spread_home), so=num(r.spread_open_home), t=num(r.total), to=num(r.total_open);
  if([hs,as].some(x=>x===null)) continue;
  const margin=hs-as, points=hs+as;
  const ats=s===null?null:margin+s;
  const ou=t===null?null:points-t;
  out.push({...r,
    ats_home:ats===null?null:ats>0?'W':ats<0?'L':'P',
    total_over:ou===null?null:ou>0?'W':ou<0?'L':'P',
    spread_move: s===null||so===null?null:s-so,
    total_move: t===null||to===null?null:t-to,
    home_role:s===null?'UNKNOWN':s<0?'FAVORITE':s>0?'DOG':'PICKEM'
  });
}
const agg=(xs,key)=>{let W=0,L=0,P=0;for(const r of xs){const v=r[key];if(v==='W')W++;else if(v==='L')L++;else if(v==='P')P++;}return {n:W+L+P,W,L,P,hit_rate_no_push:(W+L)?W/(W+L):null}};
const group=(fn,key)=>Object.fromEntries([...new Set(out.map(fn))].sort().map(g=>[g,agg(out.filter(r=>fn(r)===g),key)]));
const mag=x=>x===null?'MISSING':Math.abs(x)<0.5?'<0.5':Math.abs(x)<1?'0.5-0.99':Math.abs(x)<2?'1-1.99':Math.abs(x)<3?'2-2.99':'3+';
const keyBand=s=>{if(s===null)return'MISSING';const a=Math.abs(s);for(const k of [3,6,7,10,14])if(Math.abs(a-k)<=0.5)return 'NEAR_'+k;return'OTHER'};
const report={
 rows:out.length,
 ats:agg(out,'ats_home'),
 over:agg(out,'total_over'),
 ats_by_home_role:group(r=>r.home_role,'ats_home'),
 ats_by_spread_movement:group(r=>mag(r.spread_move),'ats_home'),
 ats_by_key_band:group(r=>keyBand(r.spread_home),'ats_home'),
 over_by_total_movement:group(r=>mag(r.total_move),'total_over'),
 public_ticket_rows:out.filter(r=>['ticket_pct_home','ticket_pct_away','ticket_pct_over','ticket_pct_under'].some(k=>r[k]!==null&&r[k]!==undefined&&r[k]!=='' )).length
};
console.log(JSON.stringify(report,null,2));
