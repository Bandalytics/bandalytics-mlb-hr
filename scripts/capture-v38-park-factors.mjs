import fs from'node:fs/promises';
import crypto from'node:crypto';
import{V38_PARK_FACTOR_POLICY}from'../v38-park-factor-policy.mjs';

const BASE='https://baseballsavant.mlb.com/leaderboard/statcast-park-factors';
const now=new Date(),year=Number(new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric'}).format(now));
const stamp=now.toISOString().replace(/[:.]/g,'-'),captured_at=now.toISOString();
async function get(url){const r=await fetch(url,{headers:{accept:'text/html','user-agent':'BANDALYTICS-v38-park-factor-research/1'}});const text=await r.text();if(!r.ok)throw Error(`park factor HTTP ${r.status}`);return text}
function embeddedData(html){for(const m of html.matchAll(/\bdata\s*=\s*(\[[\s\S]*?\])\s*;/g)){try{const x=JSON.parse(m[1]);if(Array.isArray(x)&&x.some(r=>r&&r.venue_name))return x}catch{}}throw Error('Statcast park-factor embedded data not found')}
function num(x){return x==null||x===''?null:(Number.isFinite(Number(x))?Number(x):null)}
function normalize(rows,bat_side){return rows.map(r=>({venue:String(r.venue_name||'').trim(),team:r.team_name||r.team||null,bat_side,year_label:r.year||r.year_range||null,hr_factor:num(r.index_hr??r.hr??r.HR),overall_factor:num(r.index_woba??r.index_wOBA),pa:num(r.pa)})).filter(r=>r.venue&&Number.isFinite(r.hr_factor))}
const configs=[['ALL',''],['L','L'],['R','R']],factors=[],sources=[];
for(const[bat_side,param]of configs){const u=new URL(BASE);u.searchParams.set('type','year');u.searchParams.set('year',String(year));u.searchParams.set('batSide',param);u.searchParams.set('stat','index_wOBA');u.searchParams.set('condition','All');u.searchParams.set('parks','mlb');u.searchParams.set('rolling','3');const url=u.toString(),html=await get(url),rows=normalize(embeddedData(html),bat_side);if(rows.length<20)throw Error(`insufficient ${bat_side} park rows: ${rows.length}`);factors.push(...rows);sources.push({bat_side,url,rows:rows.length,html_sha256:crypto.createHash('sha256').update(html).digest('hex')})}
const body={protocol:V38_PARK_FACTOR_POLICY.protocol,date:new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(now),captured_at,point_in_time:true,provider:V38_PARK_FACTOR_POLICY.provider,source:V38_PARK_FACTOR_POLICY.source,metric:V38_PARK_FACTOR_POLICY.metric,window:V38_PARK_FACTOR_POLICY.preferred_window,handedness_specific:true,factors,sources,prospective_only:true,historical_backfill_allowed:false,research_only:true,scoring_enabled:false,scoring_eligible:false,model_scoring_changed:false};
const sha256=crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex'),out={...body,sha256};
await fs.mkdir('snapshots',{recursive:true});const p=`snapshots/v38-park-factors-${body.date}-${stamp}.json`;await fs.writeFile(p,JSON.stringify(out,null,2)+'\n');console.log('V38_PARK_FACTOR_SNAPSHOT='+JSON.stringify({path:p,date:body.date,captured_at,factors:factors.length,venues:new Set(factors.map(x=>x.venue)).size,sha256}));
