import {buildIdentityIndex,normalizeSportsGameOdds,normTeam} from '../market-native-core.mjs';

async function getj(url,opts={},timeoutMs=12000){
  const c=new AbortController(),t=setTimeout(()=>c.abort(),timeoutMs);
  try{const r=await fetch(url,{...opts,signal:c.signal});if(!r.ok){const body=await r.text().catch(()=> '');throw Error(`HTTP ${r.status} ${body.slice(0,160)}`)}return await r.json()}finally{clearTimeout(t)}
}
async function mlbIdentityPlayers(date){
  const s=await getj(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${encodeURIComponent(date)}&hydrate=team`,{headers:{accept:'application/json','user-agent':'BANDALYTICS-NATIVE/1'}});
  const teams=new Map(),slateGames=[];
  for(const g of (s.dates||[]).flatMap(d=>d.games||[])){
    const away=normTeam(g.teams?.away?.team?.abbreviation),home=normTeam(g.teams?.home?.team?.abbreviation);
    if(away&&home&&g.gameDate)slateGames.push({matchup:`${away} @ ${home}`,start:g.gameDate,game_pk:g.gamePk??null});
    for(const side of ['away','home']){
      const t=g.teams?.[side]?.team,id=Number(t?.id),abbr=normTeam(t?.abbreviation);
      if(Number.isInteger(id)&&abbr) teams.set(id,abbr);
    }
  }
  const players=[];let queue=[...teams.entries()],idx=0;
  async function worker(){while(idx<queue.length){const [id,abbr]=queue[idx++];try{
    const j=await getj(`https://statsapi.mlb.com/api/v1/teams/${id}/roster?rosterType=40Man&hydrate=person`,{headers:{accept:'application/json','user-agent':'BANDALYTICS-NATIVE/1'}});
    for(const r of j.roster||[]){const pid=Number(r.person?.id),name=r.person?.fullName;if(Number.isInteger(pid)&&name) players.push({player_id:pid,player:name,team:abbr})}
  }catch{}}}
  await Promise.all(Array.from({length:Math.min(8,queue.length||1)},worker));
  return {players,slateGames,allowedMatchups:[...new Set(slateGames.map(g=>g.matchup))]};
}
function queryWindow(date){
  const a=new Date(date+'T08:00:00Z'),b=new Date(a);b.setUTCDate(b.getUTCDate()+1);
  return{startsAfter:a.toISOString(),startsBefore:b.toISOString()};
}
function rejectCounts(rejected=[]){
  const out={};
  for(const r of rejected){const reason=String(r?.reason||'UNKNOWN');out[reason]=(out[reason]||0)+1}
  return out;
}
export default async function handler(req,res){
  const date=String(req.query?.date||'');
  if(!/^20\d\d-\d\d-\d\d$/.test(date)) return res.status(400).json({ok:false,error:'date required'});
  const key=process.env.SPORTSGAMEODDS_API_KEY;
  if(!key) return res.status(503).json({ok:false,error:'MARKET_KEY_REQUIRED',provider:'SPORTSGAMEODDS',live_market_connected:false,ready_to_connect:true,required_env:'SPORTSGAMEODDS_API_KEY',market:'MLB batter home run yes',identity_mode:'MLBAM_EXACT_FAIL_CLOSED',slate_isolation:'MLB_GAME_TIME_MATCH',research_only:true,scoring_eligible:false,model_scoring_changed:false});
  try{
    const window=queryWindow(date),q=new URLSearchParams({leagueID:'MLB',oddsAvailable:'true',started:'false',includeOpenCloseOdds:'true',oddIDs:'batting_homeRuns-PLAYER_ID-game-yn-yes',limit:'100',...window});
    const [market,identity]=await Promise.all([
      getj(`https://api.sportsgameodds.com/v2/events?${q}`,{headers:{'x-api-key':key,accept:'application/json'}}),
      mlbIdentityPlayers(date)
    ]);
    const events=market.data||market.events||[];
    const normalized=normalizeSportsGameOdds(events,{identityIndex:buildIdentityIndex(identity.players),allowedMatchups:identity.allowedMatchups,slateGames:identity.slateGames});
    const rows=normalized.rows.filter(r=>r.identity_status==='EXACT');
    const rejected=[...normalized.rejected,...normalized.rows.filter(r=>r.identity_status!=='EXACT').map(r=>({reason:'UNRESOLVED_IDENTITY',event_id:r.event_id,provider_player_id:r.provider_player_id,player:r.player,team:r.team}))];
    const diagnostics={raw_events:events.length,slate_games:identity.slateGames.length,identity_players:identity.players.length,normalized_rows:normalized.rows.length,exact_rows:rows.length,rejected_rows:rejected.length,reject_counts:rejectCounts(rejected),rows_with_best_book:rows.filter(r=>r.best_book&&r.best_odds!==null).length,rows_with_open:rows.filter(r=>(r.books_with_open||0)>0).length,steam_rows:rows.filter(r=>r.signal==='STEAM').length,line_lengthened_rows:rows.filter(r=>r.signal==='LINE_LENGTHENED').length};
    console.log('[market-native-validation]',JSON.stringify({date,provider:'SPORTSGAMEODDS',query_window:window,...diagnostics,research_only:true,scoring_eligible:false,model_scoring_changed:false}));
    return res.status(200).json({ok:true,date,rows,rejected,provider:'SPORTSGAMEODDS',source:'SPORTSGAMEODDS_PLUS_MLB_EXACT_IDENTITY',live_market_connected:true,query_window:window,slate_games:identity.slateGames.length,identity_mode:'MLBAM_EXACT_FAIL_CLOSED',slate_isolation:'MLB_GAME_TIME_MATCH',research_only:true,scoring_eligible:false,diagnostics,model_scoring_changed:false});
  }catch(e){return res.status(502).json({ok:false,error:e?.name==='AbortError'?'market timeout':e?.message||String(e),provider:'SPORTSGAMEODDS',live_market_connected:false,research_only:true,scoring_eligible:false,model_scoring_changed:false})}
}
