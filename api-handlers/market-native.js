import {buildIdentityIndex,normalizeSportsGameOdds,normTeam} from '../market-native-core.mjs';

async function getj(url,opts={},timeoutMs=12000){
  const c=new AbortController(),t=setTimeout(()=>c.abort(),timeoutMs);
  try{const r=await fetch(url,{...opts,signal:c.signal});if(!r.ok){const body=await r.text().catch(()=> '');throw Error(`HTTP ${r.status} ${body.slice(0,160)}`)}return await r.json()}finally{clearTimeout(t)}
}
async function mlbIdentityPlayers(date){
  const s=await getj(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${encodeURIComponent(date)}&hydrate=team`,{headers:{accept:'application/json','user-agent':'BANDALYTICS-NATIVE/1'}});
  const teams=new Map();
  for(const g of (s.dates||[]).flatMap(d=>d.games||[])) for(const side of ['away','home']){
    const t=g.teams?.[side]?.team,id=Number(t?.id),abbr=normTeam(t?.abbreviation);
    if(Number.isInteger(id)&&abbr) teams.set(id,abbr);
  }
  const players=[];
  let queue=[...teams.entries()],idx=0;
  async function worker(){while(idx<queue.length){const [id,abbr]=queue[idx++];try{
    const j=await getj(`https://statsapi.mlb.com/api/v1/teams/${id}/roster?rosterType=40Man&hydrate=person`,{headers:{accept:'application/json','user-agent':'BANDALYTICS-NATIVE/1'}});
    for(const r of j.roster||[]){const pid=Number(r.person?.id),name=r.person?.fullName;if(Number.isInteger(pid)&&name) players.push({player_id:pid,player:name,team:abbr})}
  }catch{}}}
  await Promise.all(Array.from({length:Math.min(8,queue.length||1)},worker));
  return {players,allowedMatchups:(s.dates||[]).flatMap(d=>d.games||[]).map(g=>`${normTeam(g.teams?.away?.team?.abbreviation)} @ ${normTeam(g.teams?.home?.team?.abbreviation)}`)};
}
export default async function handler(req,res){
  const date=String(req.query?.date||'');
  if(!/^20\d\d-\d\d-\d\d$/.test(date)) return res.status(400).json({ok:false,error:'date required'});
  const key=process.env.SPORTSGAMEODDS_API_KEY;
  if(!key) return res.status(503).json({ok:false,error:'MARKET_KEY_REQUIRED',provider:'SPORTSGAMEODDS',live_market_connected:false,model_scoring_changed:false});
  try{
    const q=new URLSearchParams({leagueID:'MLB',oddsAvailable:'true',started:'false',includeOpenCloseOdds:'true',oddIDs:'batting_homeRuns-PLAYER_ID-game-yn-yes',limit:'100'});
    const [market,identity]=await Promise.all([
      getj(`https://api.sportsgameodds.com/v2/events?${q}`,{headers:{'x-api-key':key,accept:'application/json'}}),
      mlbIdentityPlayers(date)
    ]);
    const events=market.data||market.events||[];
    const normalized=normalizeSportsGameOdds(events,{identityIndex:buildIdentityIndex(identity.players),allowedMatchups:identity.allowedMatchups});
    const rows=normalized.rows.filter(r=>r.identity_status==='EXACT');
    return res.status(200).json({ok:true,date,rows,rejected:[...normalized.rejected,...normalized.rows.filter(r=>r.identity_status!=='EXACT').map(r=>({reason:'UNRESOLVED_IDENTITY',event_id:r.event_id,provider_player_id:r.provider_player_id,player:r.player,team:r.team}))],provider:'SPORTSGAMEODDS',source:'SPORTSGAMEODDS_PLUS_MLB_EXACT_IDENTITY',live_market_connected:true,model_scoring_changed:false});
  }catch(e){return res.status(502).json({ok:false,error:e?.name==='AbortError'?'market timeout':e?.message||String(e),provider:'SPORTSGAMEODDS',live_market_connected:false,model_scoring_changed:false})}
}
