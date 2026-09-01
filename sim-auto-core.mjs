import {runBandalyticsSim} from './sim-core.mjs';

const TEAM_IDS={
  AZ:109,ARI:109,ATL:144,BAL:110,BOS:111,CHC:112,CWS:145,CIN:113,CLE:114,COL:115,DET:116,HOU:117,KC:118,LAA:108,LAD:119,MIA:146,MIL:158,MIN:142,NYM:121,NYY:147,ATH:133,OAK:133,PHI:143,PIT:134,SD:135,SF:137,SEA:136,STL:138,TB:139,TEX:140,TOR:141,WSH:120
};
const LEAGUE_ISO=.160, LEAGUE_OPS=.720;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const n=x=>Number.isFinite(+x)?+x:null;
const normTeam=t=>String(t||'').toUpperCase()==='ARI'?'AZ':String(t||'').toUpperCase()==='OAK'?'ATH':String(t||'').toUpperCase();

export function lineupSnapshot(players=[],team){
  const t=normTeam(team), rows=players.filter(x=>normTeam(x.team)===t&&n(x.lineup)>=1&&n(x.lineup)<=9);
  const weighted=rows.filter(x=>n(x.iso)!=null).map(x=>({iso:+x.iso,w:1.18-(Math.min(9,+x.lineup)-1)*.045}));
  const den=weighted.reduce((s,x)=>s+x.w,0), avg=den?weighted.reduce((s,x)=>s+x.iso*x.w,0)/den:null;
  return {team:t,confirmed:rows.length>=9,count:rows.length,weightedIso:avg,isoIndex:avg==null?0:clamp((avg/LEAGUE_ISO-1)*30,-12,12)};
}

export function bullpenSnapshot(item={}){
  const p3=n(item.pitches_3d)||0,p5=n(item.pitches_5d)||0,a3=n(item.apps_3d)||0;
  const rel=Array.isArray(item.relievers)?item.relievers:[];
  const backToBack=rel.filter(r=>(n(r.days_used_5d)||0)>=2&&(n(r.rest_days)||0)===0).length;
  const threeOfFive=rel.filter(r=>(n(r.days_used_5d)||0)>=3).length;
  const fatigue=clamp((p3-150)/9+(p5-260)/18+(a3-9)*1.3+backToBack*1.2+threeOfFive*1.5,-8,16);
  return {team:normTeam(item.team),fatigueIndex:+fatigue.toFixed(2),raw:{pitches_3d:p3,pitches_5d:p5,apps_3d:a3,backToBack,threeOfFive}};
}

export function parkSnapshot(items=[],venue){
  const row=items.find(x=>String(x.venue||'').toLowerCase()===String(venue||'').toLowerCase());
  if(!row)return {runFactor:1,source:'NEUTRAL'};
  const cur=n(row.current?.runs_factor),roll=n(row.rolling3?.runs_factor);
  let rf=100;
  if(cur!=null&&roll!=null)rf=.35*cur+.65*roll; else rf=cur??roll??100;
  return {runFactor:clamp(rf/100,.88,1.18),source:'SAVANT_BLEND',current:cur,rolling3:roll};
}

export function weatherSnapshot(game={},weatherRow={}){
  const text=String(game.weather?.condition||'').toLowerCase();
  if(text.includes('dome')||text.includes('roof closed'))return {runFactor:1,source:'ROOF_NEUTRAL'};
  const temp=n(weatherRow.temp_f)??n(game.weather?.temp_f)??72;
  const wind=n(weatherRow.wind_mph)??0;
  let factor=1;
  factor*=clamp(1+(temp-72)*.0015,.965,1.04);
  const desc=String(game.weather?.wind||'').toLowerCase();
  if(desc.includes('out to'))factor*=1+Math.min(.05,wind*.004);
  else if(desc.includes('in from'))factor*=1-Math.min(.045,wind*.0035);
  if((n(weatherRow.precip_pct)||0)>=60)factor*=.985;
  return {runFactor:clamp(factor,.94,1.08),source:'OPEN_AIR',temp,wind,desc};
}

export function pseudoWrcFromTeamStats(stat={}){
  const ops=n(stat.ops);
  if(ops==null)return null;
  return clamp(100*Math.pow(ops/LEAGUE_OPS,1.35),72,132);
}

export function starterSnapshot(stat={}){
  const ip=n(stat.inningsPitched)||0,hr=n(stat.homeRuns)||0,k=n(stat.strikeOuts)||0,bb=n(stat.baseOnBalls)||0,bf=n(stat.battersFaced)||0;
  const rawHr9=ip>0?9*hr/ip:null,rawKbb=bf>0?100*(k-bb)/bf:null,rawEra=n(stat.era),rawFip=n(stat.fip);
  // Small samples are regressed toward league average instead of being treated as fully reliable.
  const reliability=ip<=0?0:ip<20?.25:ip<50?.60:ip<90?.82:1;
  const blend=(x,league)=>x==null?null:league+(x-league)*reliability;
  return {
    ERA:blend(rawEra,4.20),FIP:blend(rawFip,4.20),HR9:blend(rawHr9,1.20),KminusBBPct:blend(rawKbb,14.0),
    workloadPenalty:0,innings:ip,sampleReliability:reliability,
    raw:{ERA:rawEra,FIP:rawFip,HR9:rawHr9,KminusBBPct:rawKbb}
  };
}

export function extractHydratedPitcherStats(data={}){
  const out=new Map();
  for(const p of data.people||[]){
    const splits=p.stats?.flatMap(x=>x.splits||[])||[];
    const st=splits.find(x=>x.stat)?.stat||{};
    out.set(+p.id,starterSnapshot(st));
  }
  return out;
}

export function extractHydratedTeamStats(data={}){
  const out=new Map();
  for(const t of data.teams||[]){
    const splits=t.stats?.flatMap(x=>x.splits||[])||[];
    const st=splits.find(x=>x.stat)?.stat||{};
    out.set(+t.id,st);
  }
  return out;
}

export function buildGameMatchup({game,feed,bulpenByTeam=new Map(),parkItems=[],weatherByGame=new Map(),pitcherStats=new Map(),teamStats=new Map(),sims=50000,historicalSafe=false,includeScoreGrid=false}={}){
  const away=normTeam(game.away),home=normTeam(game.home);
  const la=lineupSnapshot(feed.lineup_players||[],away),lh=lineupSnapshot(feed.lineup_players||[],home);
  const bpa=bulpenByTeam.get(away)||{fatigueIndex:0},bph=bulpenByTeam.get(home)||{fatigueIndex:0};
  const park=historicalSafe?{runFactor:1,source:'HISTORICAL_SAFE_NEUTRAL'}:parkSnapshot(parkItems,game.venue),weather=weatherSnapshot(game,weatherByGame.get(+game.gamePk)||{});
  const awayTeamStat=teamStats.get(TEAM_IDS[away])||{},homeTeamStat=teamStats.get(TEAM_IDS[home])||{};
  const awrc=pseudoWrcFromTeamStats(awayTeamStat),hwrc=pseudoWrcFromTeamStats(homeTeamStat);
  const awayStarter=pitcherStats.get(+game.awayStarterId)||{},homeStarter=pitcherStats.get(+game.homeStarterId)||{};
  const complete=Math.min(game.awayLineup||0,game.homeLineup||0)>=9;
  return {
    gamePk:+game.gamePk,awayCode:away,homeCode:home,sims,includeScoreGrid,scoreGridMax:15,
    status:game.status,venue:game.venue,
    environment:{parkRunFactor:park.runFactor,weatherRunFactor:weather.runFactor},
    away:{
      offense:{wRCplus:awrc??100,ISO:historicalSafe?LEAGUE_ISO:(la.weightedIso??LEAGUE_ISO)},
      lineup:{qualityIndex:historicalSafe?0:la.isoIndex,platoonIndex:0,injuryIndex:0},
      marketBlend:0
    },
    home:{
      offense:{wRCplus:hwrc??100,ISO:historicalSafe?LEAGUE_ISO:(lh.weightedIso??LEAGUE_ISO)},
      lineup:{qualityIndex:historicalSafe?0:lh.isoIndex,platoonIndex:0,injuryIndex:0},
      marketBlend:0
    },
    awayStarter,homeStarter,
    awayBullpen:{fatigueIndex:bpa.fatigueIndex},
    homeBullpen:{fatigueIndex:bph.fatigueIndex},
    provenance:{historicalSafe,lineups:{away:la,home:lh,complete,scoringActive:!historicalSafe},park,weather,bullpens:{away:bpa,home:bph},starterStats:{away:awayStarter,home:homeStarter},teamStats:{away:awayTeamStat,home:homeTeamStat}}
  };
}

export function simulateSlate(input={}){
  const {feed={},bullpen={},park={},weather={},pitcherStats=new Map(),teamStats=new Map(),sims=50000,includeLive=false,historicalSafe=false,includeScoreGrid=false}=input;
  const bp=new Map((bullpen.items||[]).map(x=>[normTeam(x.team),bullpenSnapshot(x)]));
  const wx=new Map((weather.items||[]).map(x=>[+x.gamePk,x]));
  const games=[];
  for(const g of feed.items||[]){
    const st=String(g.status||'').toLowerCase();
    if(!includeLive && (st.includes('progress')||st.includes('final')))continue;
    const matchup=buildGameMatchup({game:g,feed,bulpenByTeam:bp,parkItems:park.items||[],weatherByGame:wx,pitcherStats,teamStats,sims,historicalSafe,includeScoreGrid});
    const out=runBandalyticsSim(matchup);
    games.push({gamePk:+g.gamePk,away:g.away,home:g.home,status:g.status,venue:g.venue,estimates:out.estimates,sim:out.sim,provenance:matchup.provenance});
  }
  return {ok:true,date:feed.date,games,gameCount:games.length,simsPerGame:sims,source:'BANDALYTICS_AUTO_SIM_V1',researchOnly:true};
}
