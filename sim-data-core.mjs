import {extractHydratedPitcherStats,extractHydratedTeamStats} from './sim-auto-core.mjs';
import {extractHydratedHitterStats,hitterSnapshot} from './sim-player-core.mjs';
export const ORIGINS={feed:'https://bandalytics-native-data.vercel.app',context:'https://bandalytics-native-context.vercel.app'};
export const TEAM_IDS={AZ:109,ATL:144,BAL:110,BOS:111,CHC:112,CWS:145,CIN:113,CLE:114,COL:115,DET:116,HOU:117,KC:118,LAA:108,LAD:119,MIA:146,MIL:158,MIN:142,NYM:121,NYY:147,ATH:133,PHI:143,PIT:134,SD:135,SF:137,SEA:136,STL:138,TB:139,TEX:140,TOR:141,WSH:120};
export const json=async(url,timeout=15000)=>{const c=new AbortController(),t=setTimeout(()=>c.abort(),timeout);try{const r=await fetch(url,{headers:{accept:'application/json','user-agent':'BANDALYTICS-SIM/1'},signal:c.signal});if(!r.ok)throw Error(`${url} HTTP ${r.status}`);return await r.json()}finally{clearTimeout(t)}};
const chunks=(a,n)=>Array.from({length:Math.ceil(a.length/n)},(_,i)=>a.slice(i*n,(i+1)*n));
export async function loadBaseContext(date){const [feed,bullpen,park,weather]=await Promise.all([json(`${ORIGINS.feed}/api/feed?date=${encodeURIComponent(date)}`),json(`${ORIGINS.context}/api/bullpen?date=${encodeURIComponent(date)}`),json(`${ORIGINS.context}/api/park?date=${encodeURIComponent(date)}`),json(`${ORIGINS.context}/api/weather?date=${encodeURIComponent(date)}`)]);return{feed,bullpen,park,weather}}
export async function hydrateGameStats(feed,warnings=[]){
 const starterIds=[...new Set((feed.items||[]).flatMap(g=>[+g.awayStarterId,+g.homeStarterId]).filter(Number.isInteger))],teamIds=[...new Set((feed.items||[]).flatMap(g=>[TEAM_IDS[g.away],TEAM_IDS[g.home]]).filter(Boolean))];let pitcherStats=new Map(),teamStats=new Map();
 try{if(starterIds.length)pitcherStats=extractHydratedPitcherStats(await json(`https://statsapi.mlb.com/api/v1/people?personIds=${starterIds.join(',')}&hydrate=${encodeURIComponent('stats(group=[pitching],type=[season],season=2026)')}`))}catch(e){warnings.push('pitcher_stats:'+String(e?.message||e))}
 try{if(teamIds.length)teamStats=extractHydratedTeamStats(await json(`https://statsapi.mlb.com/api/v1/teams?teamIds=${teamIds.join(',')}&hydrate=${encodeURIComponent('stats(group=[hitting],type=[season],season=2026)')}`))}catch(e){warnings.push('team_stats:'+String(e?.message||e))}
 return{pitcherStats,teamStats,starterIds,teamIds};
}

export function seasonStartForDate(date){
 const y=String(date||'').slice(0,4);
 return /^20\d\d$/.test(y)?`${y}-03-20`:null;
}
export function previousCalendarDate(date){
 if(!/^20\d\d-\d\d-\d\d$/.test(String(date||'')))return null;
 const d=new Date(`${date}T12:00:00Z`);if(Number.isNaN(d.getTime()))return null;d.setUTCDate(d.getUTCDate()-1);return d.toISOString().slice(0,10);
}

async function fetchAsOfPersonStat(personId,group,date,warnings=[]){
 const start=seasonStartForDate(date); if(!start)return null;
 try{
  const d=await json(`https://statsapi.mlb.com/api/v1/people/${personId}/stats?stats=byDateRange&group=${group}&startDate=${start}&endDate=${date}`,15000);
  return d?.stats?.flatMap(x=>x.splits||[]).find(x=>x.stat)?.stat||null;
 }catch(e){warnings.push(`asof_${group}_${personId}:`+String(e?.message||e));return null}
}
async function fetchAsOfTeamStat(teamId,group,date,warnings=[]){
 const start=seasonStartForDate(date); if(!start)return null;
 try{
  const d=await json(`https://statsapi.mlb.com/api/v1/teams/${teamId}/stats?stats=byDateRange&group=${group}&startDate=${start}&endDate=${date}`,15000);
  return d?.stats?.flatMap(x=>x.splits||[]).find(x=>x.stat)?.stat||null;
 }catch(e){warnings.push(`asof_team_${group}_${teamId}:`+String(e?.message||e));return null}
}

export async function hydrateGameStatsAsOf(feed,date,warnings=[]){
 const cutoff=previousCalendarDate(date)||date;
 const starterIds=[...new Set((feed.items||[]).flatMap(g=>[+g.awayStarterId,+g.homeStarterId]).filter(Number.isInteger))];
 const teamIds=[...new Set((feed.items||[]).flatMap(g=>[TEAM_IDS[g.away],TEAM_IDS[g.home]]).filter(Boolean))];
 const pitcherStats=new Map(),teamStats=new Map();
 const worker=async(items,fn,put,concurrency=8)=>{
  let i=0; const runners=Array.from({length:Math.min(concurrency,items.length)},async()=>{while(i<items.length){const id=items[i++],v=await fn(id);if(v)put(id,v)}}); await Promise.all(runners);
 };
 await worker(starterIds,id=>fetchAsOfPersonStat(id,'pitching',cutoff,warnings),(id,stat)=>pitcherStats.set(id,extractHydratedPitcherStats({people:[{id,stats:[{splits:[{stat}]}]}]}).get(id)));
 await worker(teamIds,id=>fetchAsOfTeamStat(id,'hitting',cutoff,warnings),(id,stat)=>teamStats.set(id,stat));
 return {pitcherStats,teamStats,starterIds,teamIds,asOfDate:date,statsCutoffDate:cutoff,strict:true};
}

export async function hydrateHitters(feed,date,warnings=[]){
 const hitterIds=[...new Set((feed.lineup_players||[]).map(p=>+p.player_id).filter(Number.isInteger))];let hitterStats=new Map(),bbeStats=new Map();
 for(const ids of chunks(hitterIds,60))try{const m=extractHydratedHitterStats(await json(`https://statsapi.mlb.com/api/v1/people?personIds=${ids.join(',')}&hydrate=${encodeURIComponent('stats(group=[hitting],type=[season],season=2026)')}`));for(const [k,v]of m)hitterStats.set(k,v)}catch(e){warnings.push('hitter_stats:'+String(e?.message||e))}
 for(const ids of chunks(hitterIds,40))try{const d=await json(`${ORIGINS.feed}/api/player-bbe?date=${date}&ids=${ids.join(',')}`,20000);for(const x of d.items||[])if(x?.bbe)bbeStats.set(+x.player_id,x.bbe)}catch(e){warnings.push('bbe:'+String(e?.message||e))}
 return{hitterIds,hitterStats,bbeStats};
}

export async function hydrateHittersAsOf(feed,date,warnings=[]){
 const cutoff=previousCalendarDate(date)||date;
 const hitterIds=[...new Set((feed.lineup_players||[]).map(p=>+p.player_id).filter(Number.isInteger))];
 const hitterStats=new Map(),bbeStats=new Map();
 const worker=async(items,fn,put,concurrency=10)=>{
  let i=0; const runners=Array.from({length:Math.min(concurrency,items.length)},async()=>{while(i<items.length){const id=items[i++],v=await fn(id);if(v)put(id,v)}}); await Promise.all(runners);
 };
 await worker(hitterIds,id=>fetchAsOfPersonStat(id,'hitting',cutoff,warnings),(id,stat)=>hitterStats.set(id,hitterSnapshot(stat)));
 // Native BBE endpoint is date-addressed. If it cannot serve the historical date, fail soft and leave BBE neutral.
 for(const ids of chunks(hitterIds,40))try{
  const d=await json(`${ORIGINS.feed}/api/player-bbe?date=${date}&ids=${ids.join(',')}`,20000);
  for(const x of d.items||[])if(x?.bbe)bbeStats.set(+x.player_id,x.bbe);
 }catch(e){warnings.push('bbe_asof:'+String(e?.message||e))}
 return{hitterIds,hitterStats,bbeStats,asOfDate:date,statsCutoffDate:cutoff,strict:true};
}

export async function loadScheduleResults(date){
 const d=await json(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${date}&hydrate=linescore`,15000),out=[];
 for(const day of d.dates||[])for(const g of day.games||[]){const ar=+g.teams?.away?.score,hr=+g.teams?.home?.score;if(Number.isFinite(ar)&&Number.isFinite(hr))out.push({gamePk:+g.gamePk,awayRuns:ar,homeRuns:hr,status:g.status?.detailedState})}
 return out;
}
