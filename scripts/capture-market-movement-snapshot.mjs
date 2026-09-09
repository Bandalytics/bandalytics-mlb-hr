import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const SCHEMA='BANDALYTICS_MARKET_MOVEMENT_SNAPSHOT_V1';
const BASE=String(process.env.BANDALYTICS_API_BASE||'https://bandalytics-mlb-hr.pages.dev').replace(/\/$/,'');

function etDate(d=new Date()){
  const p=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d);
  const o=Object.fromEntries(p.map(x=>[x.type,x.value]));
  return `${o.year}-${o.month}-${o.day}`;
}
function safeStamp(iso){return iso.replace(/[:.]/g,'-')}
function impliedAmerican(v){
  const n=Number(v); if(!Number.isFinite(n)||n===0)return null;
  return n>0?100/(n+100):(-n)/((-n)+100);
}
function windowLabel(minutes,lineupType){
  if(String(lineupType||'').toUpperCase()==='CONFIRMED') return 'LINEUP_CONFIRMED';
  if(!Number.isFinite(minutes)) return 'UNKNOWN';
  if(minutes<=75) return 'PREGAME';
  if(minutes<=180) return 'LINEUP_WINDOW';
  if(minutes<=360) return 'MORNING';
  return 'EARLY';
}
async function getj(url,timeout=20000){
  const c=new AbortController(),t=setTimeout(()=>c.abort(),timeout);
  try{
    const r=await fetch(url,{cache:'no-store',signal:c.signal,headers:{accept:'application/json','user-agent':'BANDALYTICS-MARKET-SNAPSHOT/1'}});
    const text=await r.text(); let j;
    try{j=JSON.parse(text)}catch{throw Error(`NON_JSON ${r.status} ${text.slice(0,160)}`)}
    if(!r.ok||j?.ok!==true) throw Error(`${j?.error||`HTTP_${r.status}`}`);
    return j;
  } finally {clearTimeout(t)}
}
function lineupMap(feed){
  const m=new Map();
  for(const r of feed?.items||feed?.rows||[]){
    const id=Number(r?.player_id); if(!Number.isInteger(id))continue;
    m.set(id,{lineup_type:r?.lineup_type||null,lineup:Number.isFinite(+r?.lineup)?+r.lineup:null,team:r?.team||null,gamePk:r?.gamePk??null});
  }
  return m;
}
function cleanBook(b){
  return {book:b?.book||null,odds:Number.isFinite(+b?.odds)?+b.odds:null,open_odds:Number.isFinite(+b?.open_odds)?+b.open_odds:null,current_implied:Number.isFinite(+b?.current_implied)?+b.current_implied:null,open_implied:Number.isFinite(+b?.open_implied)?+b.open_implied:null,movement_pp:Number.isFinite(+b?.movement_pp)?+b.movement_pp:null,last_updated_at:b?.last_updated_at||null};
}

const now=new Date(),capturedAt=now.toISOString(),date=process.env.SNAPSHOT_DATE||etDate(now);
const [market,lineups]=await Promise.all([
  getj(`${BASE}/api/market-native?date=${encodeURIComponent(date)}`),
  getj(`${BASE}/api/projected-lineups?date=${encodeURIComponent(date)}`).catch(()=>({ok:false,items:[]}))
]);
const lm=lineupMap(lineups);
const capturedMs=now.getTime();
const rows=[];
for(const r of market.rows||[]){
  if(r?.identity_status!=='EXACT'||!Number.isInteger(Number(r?.player_id)))continue;
  const startMs=Date.parse(r?.event_starts_at||'');
  const minutesToStart=Number.isFinite(startMs)?+((startMs-capturedMs)/60000).toFixed(1):null;
  if(minutesToStart!==null&&minutesToStart<=-5) continue;
  const l=lm.get(Number(r.player_id))||{};
  const bestOdds=Number.isFinite(+r?.best_odds)?+r.best_odds:null;
  const books=(r?.books||[]).map(cleanBook).filter(b=>b.odds!==null);
  const openBooks=books.filter(b=>b.open_odds!==null);
  const medianOpen=openBooks.length?openBooks.map(b=>b.open_odds).sort((a,b)=>a-b)[Math.floor(openBooks.length/2)]:null;
  const openImp=medianOpen===null?null:impliedAmerican(medianOpen);
  const currImp=bestOdds===null?null:impliedAmerican(bestOdds);
  rows.push({
    date,player_id:Number(r.player_id),player:r.player||null,team:r.team||l.team||null,matchup:r.matchup||null,event_id:r.event_id||null,event_starts_at:r.event_starts_at||null,minutes_to_start:minutesToStart,
    checkpoint:windowLabel(minutesToStart,l.lineup_type),lineup_type:l.lineup_type||null,lineup_slot:l.lineup??null,gamePk:l.gamePk??null,
    best_odds:bestOdds,best_book:r.best_book||null,consensus_odds:Number.isFinite(+r?.consensus_odds)?+r.consensus_odds:null,fair_odds:Number.isFinite(+r?.fair_odds)?+r.fair_odds:null,
    implied_best_pct:currImp===null?null:+(currImp*100).toFixed(3),median_open_odds:medianOpen,median_open_implied_pct:openImp===null?null:+(openImp*100).toFixed(3),
    open_to_current_pp:openImp===null||currImp===null?null:+((currImp-openImp)*100).toFixed(3),provider_signal:r.signal||null,avg_book_movement_pp:Number.isFinite(+r?.avg_movement_pp)?+r.avg_movement_pp:null,
    books_with_open:Number.isFinite(+r?.books_with_open)?+r.books_with_open:0,steam_books:Array.isArray(r?.steam_books)?r.steam_books:[],lengthened_books:Array.isArray(r?.lengthened_books)?r.lengthened_books:[],books
  });
}
rows.sort((a,b)=>(a.event_starts_at||'').localeCompare(b.event_starts_at||'')||String(a.matchup).localeCompare(String(b.matchup))||String(a.player).localeCompare(String(b.player)));
const body={schema:SCHEMA,date,captured_at:capturedAt,source_url:`${BASE}/api/market-native`,provider:market.provider||'SPORTSGAMEODDS',live_market_connected:market.live_market_connected===true,lineup_feed_connected:lineups?.ok===true,point_in_time:true,append_only:true,research_only:true,scoring_enabled:false,scoring_eligible:false,model_scoring_changed:false,profile_gate_changed:false,longshot_rule_changed:false,no_forced_pool:true,row_count:rows.length,diagnostics:market.diagnostics||null,rows};
const sha256=crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
const snapshot={...body,sha256};
const dir=path.join('market-snapshots',date); await fs.mkdir(dir,{recursive:true});
const file=path.join(dir,`market-${safeStamp(capturedAt)}.json`);
try{await fs.access(file);throw Error(`IMMUTABLE_SNAPSHOT_EXISTS ${file}`)}catch(e){if(!String(e?.code).includes('ENOENT')&&!String(e?.message).startsWith('IMMUTABLE_'))throw e;if(String(e?.message).startsWith('IMMUTABLE_'))throw e}
await fs.writeFile(file,JSON.stringify(snapshot,null,2)+'\n','utf8');
console.log('MARKET_SNAPSHOT='+JSON.stringify({file,date,captured_at:capturedAt,row_count:rows.length,lineup_feed_connected:body.lineup_feed_connected,provider:body.provider,sha256}));
