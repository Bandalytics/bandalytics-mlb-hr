// Historical MLBAM identity resolver for direct-mode market universe.
// Safe rule: resolve by canonical player name inside the requested team's historical roster.
const TEAM_IDS={AZ:109,BAL:110,BOS:111,CHC:112,CIN:113,CLE:114,COL:115,DET:116,HOU:117,KC:118,LAD:119,WSH:120,NYM:121,ATH:133,PIT:134,SD:135,SEA:136,SF:137,STL:138,TB:139,TEX:140,TOR:141,MIN:142,PHI:143,ATL:144,CWS:145,MIA:146,NYY:147,MIL:158,LAA:108};
const TEAM_ALIAS={ARI:'AZ',OAK:'ATH'};
export const teamAlias=t=>TEAM_ALIAS[String(t||'').toUpperCase()]||String(t||'').toUpperCase();
export const canon=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[.'’\-]/g,' ').replace(/\s+/g,' ').trim();
export const identityKey=(player,team)=>canon(player)+'::'+teamAlias(team);

async function getJSON(fetcher,url){const r=await fetcher(url,{headers:{accept:'application/json'}});if(!r.ok)throw Error('MLB roster HTTP '+r.status);return r.json()}
async function roster(fetcher,team,date,type){const id=TEAM_IDS[teamAlias(team)];if(!id)throw Error('Unknown MLB team '+team);const z=await getJSON(fetcher,`https://statsapi.mlb.com/api/v1/teams/${id}/roster?rosterType=${encodeURIComponent(type)}&date=${encodeURIComponent(date)}&hydrate=person`);return z.roster||[]}
export async function buildHistoricalRosterIndex({date,teams,fetcher=fetch}={}){
 if(!/^20\d\d-\d\d-\d\d$/.test(String(date||'')))throw Error('historical roster date required');
 const index=new Map(),unavailable=[];
 for(const raw of [...new Set((teams||[]).map(teamAlias).filter(Boolean))]){
  let map=new Map();
  for(const type of ['40Man','fullRoster']){
   try{for(const x of await roster(fetcher,raw,date,type)){const p=x.person||{};if(p.id&&p.fullName&&!map.has(canon(p.fullName)))map.set(canon(p.fullName),{player_id:+p.id,official_name:p.fullName,team:raw,source:'MLB_HISTORICAL_ROSTER'})}}catch(e){if(type==='40Man'&&map.size===0)unavailable.push({team:raw,error:e.message||String(e)})}
  }
  index.set(raw,map);
 }
 return{date,index,unavailable};
}
export function resolveFromRosterIndex(row,rosterIndex){const team=teamAlias(row.team),m=rosterIndex.index.get(team),p=m?.get(canon(row.player||row.name));return p?{...p,identity_key:identityKey(row.player||row.name,team)}:null}
export async function resolveMarketIdentities(rows,{date,fetcher=fetch}={}){
 const base=await buildHistoricalRosterIndex({date,teams:(rows||[]).map(x=>x.team),fetcher}),resolved=[],unresolved=[];
 for(const row of rows||[]){if(row.player_id!=null){resolved.push({...row,player_id:+row.player_id,identity_key:identityKey(row.player,row.team),identity_source:row.identity_source||'MARKET_PROVIDER_ID'});continue}const id=resolveFromRosterIndex(row,base);if(id)resolved.push({...row,...id,identity_source:id.source});else unresolved.push({...row,identity_key:identityKey(row.player,row.team),identity_source:'UNRESOLVED'})}
 return{date,resolved,unresolved,roster_unavailable:base.unavailable};
}
