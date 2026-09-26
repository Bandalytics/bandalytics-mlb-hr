#!/usr/bin/env node
import fs from 'node:fs';

const p=process.argv[2];
if(!p){console.error('usage: node research/cfb/analyze-market-baseline.mjs <json>');process.exit(2)}
const rows=JSON.parse(fs.readFileSync(p,'utf8'));
const finite=x=>x!==null&&x!==''&&Number.isFinite(Number(x));
const n=x=>Number(x);
const wilson=(w,t,z=1.96)=>{if(!t)return null;const ph=w/t,d=1+z*z/t,c=(ph+z*z/(2*t))/d,h=z*Math.sqrt(ph*(1-ph)/t+z*z/(4*t*t))/d;return [c-h,c+h]};
const agg=new Map();
function add(key,outcome){if(!outcome)return;let a=agg.get(key)||{w:0,l:0,p:0};a[outcome]++;agg.set(key,a)}
function sideResult(r,side){
 if(!finite(r.spread_home)||!finite(r.home_score)||!finite(r.away_score))return null;
 const margin=n(r.home_score)-n(r.away_score)+n(r.spread_home);
 const v=side==='HOME'?margin:-margin; return v>0?'w':v<0?'l':'p';
}
function totalResult(r,side){
 if(!finite(r.total)||!finite(r.home_score)||!finite(r.away_score))return null;
 const d=n(r.home_score)+n(r.away_score)-n(r.total);
 const v=side==='OVER'?d:-d;return v>0?'w':v<0?'l':'p';
}
for(const r of rows){
 const hs=sideResult(r,'HOME'),as=sideResult(r,'AWAY');
 add('SIDE|ALL',hs);add('SIDE|ALL',as);
 if(finite(r.spread_home)){
   const homeRole=n(r.spread_home)<0?'FAVORITE':n(r.spread_home)>0?'DOG':'PICKEM';
   const awayRole=homeRole==='FAVORITE'?'DOG':homeRole==='DOG'?'FAVORITE':'PICKEM';
   add('SIDE|'+homeRole,hs);add('SIDE|'+awayRole,as);
 }
 add('TOTAL|OVER',totalResult(r,'OVER'));add('TOTAL|UNDER',totalResult(r,'UNDER'));
 if(finite(r.spread_home)&&finite(r.spread_open_home)){
   const mv=n(r.spread_home)-n(r.spread_open_home),mag=Math.abs(mv);
   const band=mag===0?'0':mag<1?'<1':mag<2?'1-1.5':mag<3?'2-2.5':'3+';
   add('MOVE|'+band+'|HOME',hs);add('MOVE|'+band+'|AWAY',as);
 }
}
const out=[...agg].map(([key,a])=>{const dec=a.w+a.l,ci=wilson(a.w,dec);return {key,...a,decisions:dec,hit_rate:dec?a.w/dec:null,wilson95:ci}});
console.log(JSON.stringify({rows:rows.length,notes:['Raw counts; pushes excluded from hit-rate denominator.','No ROI without verified decision-time prices/juice.','Public-ticket signals absent unless verified ticket data exists.'],results:out},null,2));
