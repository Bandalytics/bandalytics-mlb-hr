import {buildNativeFeed,isoFromSeasonStats,teamAlias} from '../native-feed-core.mjs';

export const PROJECTED_LINEUP_PROTOCOL='V38_PROJECTED_LINEUPS_V1';
const DAY=86400000;
const enc=x=>encodeURIComponent(String(x));
const ymd=d=>new Date(d).toISOString().slice(0,10);
const shift=(date,days)=>ymd(Date.parse(date+'T12:00:00Z')+days*DAY);
const slotKey=(gamePk,team)=>`${+gamePk}:${teamAlias(team)}`;

async function getJSON(fetcher,url,timeoutMs=12000){
  const c=new AbortController(),t=setTimeout(()=>c.abort(),timeoutMs);
  try{
    const r=await fetcher(url,{headers:{accept:'application/json','user-agent':'BANDALYTICS-v38-projected-research'},signal:c.signal});
    if(!r.ok)throw Error(`MLB HTTP ${r.status}`);
    return await r.json();
  } finally { clearTimeout(t); }
}

function finalGame(g={}){
  const a=String(g.status?.abstractGameState||'').toLowerCase();
  const d=String(g.status?.detailedState||'').toLowerCase();
  return a==='final'||d==='final'||d.includes('completed early');
}

function teamIdInGame(g={},teamId){
  return +g.teams?.away?.team?.id===+teamId||+g.teams?.home?.team?.id===+teamId;
}

function recentGameMap(schedule={},teamIds=[]){
  const wanted=new Set(teamIds.map(Number)),out=new Map();
  const games=(schedule.dates||[]).flatMap(d=>(d.games||[]).map(g=>({...g,__date:d.date||String(g.gameDate||'').slice(0,10)})))
    .filter(finalGame)
    .sort((a,b)=>String(b.gameDate||b.__date).localeCompare(String(a.gameDate||a.__date)));
  for(const g of games){
    for(const id of wanted){
      if(!out.has(id)&&teamIdInGame(g,id))out.set(id,{gamePk:+g.gamePk,date:g.__date});
    }
    if(out.size===wanted.size)break;
  }
  return out;
}

function previousLineup(gameFeed={},teamId){
  const box=gameFeed.liveData?.boxscore?.teams||{},players=gameFeed.gameData?.players||{};
  const side=+box.away?.team?.id===+teamId?box.away:(+box.home?.team?.id===+teamId?box.home:null);
  if(!side)return [];
  const order=Array.isArray(side.battingOrder)?side.battingOrder.slice(0,9):[];
  return order.map((id,i)=>{
    const p=side.players?.['ID'+id]||side.players?.[String(id)]||{},meta=players['ID'+id]||players[String(id)]||{};
    const season=p.seasonStats?.batting||{};
    return {player:p.person?.fullName||meta.fullName||null,player_id:+(p.person?.id||meta.id||id),lineup:i+1,bat_side:p.person?.batSide?.code||p.batSide?.code||meta.batSide?.code||null,iso:isoFromSeasonStats(season)};
  }).filter(x=>x.player&&Number.isInteger(x.player_id)&&x.player_id>0);
}

function targetTeamContexts(feed={}){
  const out=[];
  for(const g of feed.items||[]){
    out.push({slot_key:slotKey(g.gamePk,g.away),side:'away',team:teamAlias(g.away),team_id:+g.awayTeamId,gamePk:+g.gamePk,matchup:`${teamAlias(g.away)} @ ${teamAlias(g.home)}`,opp_pitcher:g.homeStarter||null,opp_pitcher_id:g.homeStarterId||null,opp_pitcher_hand:g.homeStarterHand||null,official:g.awayLineup>=9});
    out.push({slot_key:slotKey(g.gamePk,g.home),side:'home',team:teamAlias(g.home),team_id:+g.homeTeamId,gamePk:+g.gamePk,matchup:`${teamAlias(g.home)} vs ${teamAlias(g.away)}`,opp_pitcher:g.awayStarter||null,opp_pitcher_id:g.awayStarterId||null,opp_pitcher_hand:g.awayStarterHand||null,official:g.homeLineup>=9});
  }
  return out;
}

export async function buildProjectedLineups({date,fetcher=fetch,timeoutMs=12000,lookbackDays=7}={}){
  if(!/^20\d\d-\d\d-\d\d$/.test(String(date||'')))throw Error('date required');
  const feed=await buildNativeFeed({date,fetcher,timeoutMs}),contexts=targetTeamContexts(feed);
  const officialBySlot=new Map();
  for(const x of feed.lineup_players||[]){
    const k=slotKey(x.gamePk,x.team),a=officialBySlot.get(k)||[];
    a.push({...x,lineup_type:'CONFIRMED',projection_source:null,evidence_eligible:true,scoring_eligible:false});
    officialBySlot.set(k,a);
  }
  const missingTeamIds=[...new Set(contexts.filter(x=>!x.official).map(x=>x.team_id).filter(Boolean))];
  let recent=new Map(),previousFeeds=new Map();
  if(missingTeamIds.length){
    const start=shift(date,-Math.max(1,lookbackDays)),end=shift(date,-1);
    const schedule=await getJSON(fetcher,`https://statsapi.mlb.com/api/v1/schedule?sportId=1&startDate=${enc(start)}&endDate=${enc(end)}&hydrate=team`,timeoutMs);
    recent=recentGameMap(schedule,missingTeamIds);
    const gamePks=[...new Set([...recent.values()].map(x=>x.gamePk).filter(Boolean))];
    await Promise.all(gamePks.map(async gamePk=>{try{previousFeeds.set(gamePk,await getJSON(fetcher,`https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`,timeoutMs))}catch{}}));
  }
  const items=[];
  for(const ctx of contexts){
    const confirmed=officialBySlot.get(ctx.slot_key)||[];
    if(ctx.official&&confirmed.length){
      items.push(...confirmed.map(x=>({...x,team_id:ctx.team_id,slot_key:ctx.slot_key,evidence_eligible:true,scoring_eligible:false})));
      continue;
    }
    const src=recent.get(ctx.team_id),prev=src?previousFeeds.get(src.gamePk):null,lineup=prev?previousLineup(prev,ctx.team_id):[];
    for(const x of lineup)items.push({...x,team:ctx.team,team_id:ctx.team_id,gamePk:ctx.gamePk,slot_key:ctx.slot_key,matchup:ctx.matchup,opp_pitcher:ctx.opp_pitcher,opp_pitcher_id:ctx.opp_pitcher_id,opp_pitcher_hand:ctx.opp_pitcher_hand,lineup_type:'PROJECTED',projection_source:'MOST_RECENT_COMPLETED_STARTING_LINEUP',projection_source_game_pk:src?.gamePk||null,projection_source_date:src?.date||null,evidence_eligible:false,scoring_eligible:false});
  }
  const confirmedSlots=contexts.filter(x=>x.official).length;
  const projectedSlots=contexts.filter(ctx=>!ctx.official&&items.some(x=>x.slot_key===ctx.slot_key&&x.lineup_type==='PROJECTED')).length;
  const counts={lineup_slots:contexts.length,confirmed_lineup_slots:confirmedSlots,projected_lineup_slots:projectedSlots,confirmed_hitters:items.filter(x=>x.lineup_type==='CONFIRMED').length,projected_hitters:items.filter(x=>x.lineup_type==='PROJECTED').length,total_research_hitters:items.length};
  return {ok:true,protocol:PROJECTED_LINEUP_PROTOCOL,date,games:feed.games,items,counts,research_only:true,projection_is_evidence:false,projected_rows_scoring_eligible:false,confirmed_rows_scoring_eligible:false,model_scoring_changed:false,exact_game_identity:true,source:'MLB_STATSAPI_CURRENT_PLUS_MOST_RECENT_COMPLETED_LINEUP'};
}

export default async function handler(req,res){
  const date=String(req.query?.date||'');
  if(!/^20\d\d-\d\d-\d\d$/.test(date))return res.status(400).json({ok:false,error:'date required',research_only:true,scoring_enabled:false});
  try{
    const out=await buildProjectedLineups({date,timeoutMs:12000});
    res.setHeader('Cache-Control','s-maxage=120, stale-while-revalidate=180');
    return res.status(200).json(out);
  }catch(e){return res.status(502).json({ok:false,date,protocol:PROJECTED_LINEUP_PROTOCOL,error:e?.name==='AbortError'?'projected lineup timeout':(e?.message||String(e)),research_only:true,projection_is_evidence:false,scoring_enabled:false,scoring_eligible:false,model_scoring_changed:false})}
}
