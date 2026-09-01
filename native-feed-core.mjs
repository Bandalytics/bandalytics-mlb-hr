const TEAM_ALIAS={ARI:'AZ',OAK:'ATH'};
export const teamAlias=t=>TEAM_ALIAS[String(t||'').toUpperCase()]||String(t||'').toUpperCase();

export function isoFromSeasonStats(s={}){
  const avg=Number(s.avg),slg=Number(s.slg);
  if(!Number.isFinite(avg)||!Number.isFinite(slg))return null;
  return +(slg-avg).toFixed(3);
}

function statusText(g={}){return g.status?.detailedState||g.status?.abstractGameState||'Scheduled'}
function probable(g,side){return g.teams?.[side]?.probablePitcher?.fullName||null}

export function scheduleItems(schedule={}){
  const games=(schedule.dates||[]).flatMap(d=>d.games||[]);
  return games.map(g=>({
    gamePk:+g.gamePk,
    away:teamAlias(g.teams?.away?.team?.abbreviation),
    home:teamAlias(g.teams?.home?.team?.abbreviation),
    awayStarter:probable(g,'away'),
    homeStarter:probable(g,'home'),
    status:statusText(g),
    awayLineup:0,
    homeLineup:0
  })).filter(g=>g.gamePk&&g.away&&g.home);
}

function battingOrderPlayers(sideBox={},team,matchup,oppPitcher){
  const players=sideBox.players||{},order=Array.isArray(sideBox.battingOrder)?sideBox.battingOrder:[];
  return order.slice(0,9).map((id,i)=>{
    const p=players['ID'+id]||players[String(id)]||{};
    const season=p.seasonStats?.batting||{};
    return {
      player:p.person?.fullName||null,
      player_id:+(p.person?.id||id),
      team:teamAlias(team),
      matchup,
      lineup:i+1,
      opp_pitcher:oppPitcher||null,
      iso:isoFromSeasonStats(season)
    };
  }).filter(x=>x.player&&x.player_id);
}

export function parseGameFeed(feed={},scheduleGame={}){
  const bs=feed.liveData?.boxscore?.teams||{};
  const awayAbbr=teamAlias(bs.away?.team?.abbreviation||scheduleGame.away);
  const homeAbbr=teamAlias(bs.home?.team?.abbreviation||scheduleGame.home);
  const awayStarter=scheduleGame.awayStarter||null,homeStarter=scheduleGame.homeStarter||null;
  const away=battingOrderPlayers(bs.away,awayAbbr,`${awayAbbr} @ ${homeAbbr}`,homeStarter);
  const home=battingOrderPlayers(bs.home,homeAbbr,`${homeAbbr} @ ${awayAbbr}`,awayStarter);
  return {away,home,awayLineup:away.length>=9?9:away.length,homeLineup:home.length>=9?9:home.length};
}

async function getJSON(fetcher,url,timeoutMs=12000){
  const c=new AbortController(),t=setTimeout(()=>c.abort(),timeoutMs);
  try{
    const r=await fetcher(url,{headers:{accept:'application/json','user-agent':'BANDALYTICS/95'},signal:c.signal});
    if(!r.ok)throw Error(`MLB HTTP ${r.status}`);
    return await r.json();
  }finally{clearTimeout(t)}
}

export async function buildNativeFeed({date,fetcher=fetch,timeoutMs=12000}={}){
  if(!/^20\d\d-\d\d-\d\d$/.test(String(date||'')))throw Error('date required');
  const u=`https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${encodeURIComponent(date)}&hydrate=probablePitcher,team`;
  const schedule=await getJSON(fetcher,u,timeoutMs),items=scheduleItems(schedule),lineup_players=[];
  await Promise.all(items.map(async g=>{
    try{
      const feed=await getJSON(fetcher,`https://statsapi.mlb.com/api/v1.1/game/${g.gamePk}/feed/live`,timeoutMs);
      const q=parseGameFeed(feed,g);g.awayLineup=q.awayLineup;g.homeLineup=q.homeLineup;lineup_players.push(...q.away,...q.home);
    }catch(e){g.lineup_error=e?.message||String(e)}
  }));
  const starters=items.reduce((n,g)=>n+(g.awayStarter?1:0)+(g.homeStarter?1:0),0),lineups=items.reduce((n,g)=>n+(g.awayLineup>=9?1:0)+(g.homeLineup>=9?1:0),0);
  return {ok:true,date,games:items.length,starter_slots:items.length*2,starters,lineup_slots:items.length*2,lineups,lineup_players,items,source:'MLB_STATSAPI_DIRECT',model_scoring_changed:false};
}
