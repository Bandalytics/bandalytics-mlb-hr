const TEAM_ALIAS = {
  ARI:'AZ', OAK:'ATH',
  ARIZONA_DIAMONDBACKS_MLB:'AZ', ATLANTA_BRAVES_MLB:'ATL', BALTIMORE_ORIOLES_MLB:'BAL', BOSTON_RED_SOX_MLB:'BOS',
  CHICAGO_CUBS_MLB:'CHC', CHICAGO_WHITE_SOX_MLB:'CWS', CINCINNATI_REDS_MLB:'CIN', CLEVELAND_GUARDIANS_MLB:'CLE',
  COLORADO_ROCKIES_MLB:'COL', DETROIT_TIGERS_MLB:'DET', HOUSTON_ASTROS_MLB:'HOU', KANSAS_CITY_ROYALS_MLB:'KC',
  LOS_ANGELES_ANGELS_MLB:'LAA', LOS_ANGELES_DODGERS_MLB:'LAD', MIAMI_MARLINS_MLB:'MIA', MILWAUKEE_BREWERS_MLB:'MIL',
  MINNESOTA_TWINS_MLB:'MIN', NEW_YORK_METS_MLB:'NYM', NEW_YORK_YANKEES_MLB:'NYY', ATHLETICS_MLB:'ATH', OAKLAND_ATHLETICS_MLB:'ATH',
  PHILADELPHIA_PHILLIES_MLB:'PHI', PITTSBURGH_PIRATES_MLB:'PIT', SAN_DIEGO_PADRES_MLB:'SD', SAN_FRANCISCO_GIANTS_MLB:'SF',
  SEATTLE_MARINERS_MLB:'SEA', ST_LOUIS_CARDINALS_MLB:'STL', TAMPA_BAY_RAYS_MLB:'TB', TEXAS_RANGERS_MLB:'TEX',
  TORONTO_BLUE_JAYS_MLB:'TOR', WASHINGTON_NATIONALS_MLB:'WSH'
};
export const normTeam = t => {
  const raw=String(t||'').toUpperCase().trim().replace(/[^A-Z0-9]+/g,'_').replace(/^_|_$/g,'');
  return TEAM_ALIAS[raw] || raw;
};
export const normName = s => String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
export function americanNumber(v){
  if(v===null||v===undefined||v==='') return null;
  const n=Number(String(v).replace(/^\+/,'').trim());
  return Number.isFinite(n) && n!==0 ? n : null;
}
export function impliedFromAmerican(v){
  const n=americanNumber(v); if(n===null) return null;
  return n>0 ? 100/(n+100) : (-n)/((-n)+100);
}
export function americanString(v){
  const n=americanNumber(v); return n===null?null:(n>0?`+${Math.round(n)}`:`${Math.round(n)}`);
}
export function matchupKey(a,h){ return `${normTeam(a)} @ ${normTeam(h)}`; }

export function buildIdentityIndex(players=[]){
  const byKey=new Map();
  for(const p of players){
    const id=Number(p.player_id ?? p.mlbam_id ?? p.id);
    if(!Number.isInteger(id)) continue;
    const team=normTeam(p.team);
    const name=normName(p.player ?? p.name ?? p.fullName);
    if(!team||!name) continue;
    const k=`${team}|${name}`;
    if(!byKey.has(k)) byKey.set(k,[]);
    byKey.get(k).push(id);
  }
  return byKey;
}
export function resolveExactPlayer(providerPlayer, identityIndex){
  const team=normTeam(providerPlayer?.teamID || providerPlayer?.team || '');
  const name=normName(providerPlayer?.name || providerPlayer?.names?.display || [providerPlayer?.firstName,providerPlayer?.lastName].filter(Boolean).join(' '));
  const ids=identityIndex?.get(`${team}|${name}`) || [];
  return ids.length===1 ? ids[0] : null;
}

function eventTeams(event){
  const t=event?.teams || {};
  const away=normTeam(t?.away?.names?.short || t?.away?.names?.medium || t?.away?.abbreviation || t?.away?.teamID || event?.awayTeam?.abbreviation || event?.awayTeamID || '');
  const home=normTeam(t?.home?.names?.short || t?.home?.names?.medium || t?.home?.abbreviation || t?.home?.teamID || event?.homeTeam?.abbreviation || event?.homeTeamID || '');
  return {away,home};
}
function playerFromEvent(event, providerID){
  const p=event?.players?.[providerID];
  if(!p) return {playerID:providerID,name:null,teamID:null};
  return {playerID:providerID,name:p.name || p.names?.display || [p.firstName,p.lastName].filter(Boolean).join(' '),teamID:p.teamID || p.team?.teamID || null};
}
function activeBookRows(odd){
  const out=[];
  for(const [book,raw] of Object.entries(odd?.byBookmaker||{})){
    if(raw?.available===false) continue;
    const current=americanNumber(raw?.odds), open=americanNumber(raw?.openOdds);
    if(current===null) continue;
    const currImp=impliedFromAmerican(current), openImp=impliedFromAmerican(open);
    out.push({
      book,
      odds:current,
      odds_text:americanString(current),
      open_odds:open,
      open_odds_text:americanString(open),
      current_implied:currImp,
      open_implied:openImp,
      movement_pp: openImp===null||currImp===null ? null : +(100*(currImp-openImp)).toFixed(3),
      last_updated_at:raw?.lastUpdatedAt||null,
      deeplink:raw?.deeplink||null,
    });
  }
  return out;
}
function summarizeMovement(books){
  const moved=books.filter(x=>x.movement_pp!==null);
  const steam=moved.filter(x=>x.movement_pp>=0.5);
  const lengthened=moved.filter(x=>x.movement_pp<=-0.5);
  const avg=moved.length ? moved.reduce((s,x)=>s+x.movement_pp,0)/moved.length : null;
  return {
    books_with_open:moved.length,
    steam_books:steam.map(x=>x.book),
    lengthened_books:lengthened.map(x=>x.book),
    avg_movement_pp:avg===null?null:+avg.toFixed(3),
    signal: steam.length>=2 && steam.length>lengthened.length ? 'STEAM' : lengthened.length>=2 && lengthened.length>steam.length ? 'LINE_LENGTHENED' : 'MIXED_NEUTRAL'
  };
}

export function normalizeSportsGameOdds(events=[], opts={}){
  const identityIndex=opts.identityIndex || buildIdentityIndex(opts.identityPlayers||[]);
  const allowedMatchups=new Set((opts.allowedMatchups||[]).map(String));
  const rows=[], rejected=[];
  for(const event of events||[]){
    const {away,home}=eventTeams(event); const matchup=matchupKey(away,home);
    if(allowedMatchups.size && !allowedMatchups.has(matchup)){
      rejected.push({reason:'STALE_MATCHUP',eventID:event?.eventID||null,matchup}); continue;
    }
    for(const [oddID,odd] of Object.entries(event?.odds||{})){
      if(odd?.statID!=='batting_homeRuns' || odd?.periodID!=='game' || odd?.betTypeID!=='yn' || odd?.sideID!=='yes') continue;
      const providerID=odd?.playerID || odd?.statEntityID;
      if(!providerID || providerID==='all'||providerID==='home'||providerID==='away') continue;
      const pp=playerFromEvent(event,providerID);
      const mlbam=resolveExactPlayer(pp,identityIndex);
      const books=activeBookRows(odd);
      if(!books.length) continue;
      const best=books.reduce((a,b)=>b.odds>a.odds?b:a,books[0]);
      const movement=summarizeMovement(books);
      const row={
        event_id:event?.eventID||null,
        odd_id:oddID,
        matchup,
        away,home,
        provider_player_id:providerID,
        player:pp.name,
        team:normTeam(pp.teamID),
        player_id:mlbam,
        identity_status:mlbam?'EXACT':'UNRESOLVED',
        best_odds:best.odds,
        best_odds_text:best.odds_text,
        best_book:best.book,
        consensus_odds:americanNumber(odd?.bookOdds),
        consensus_odds_text:americanString(odd?.bookOdds),
        fair_odds:americanNumber(odd?.fairOdds),
        fair_odds_text:americanString(odd?.fairOdds),
        implied_best:+(100*impliedFromAmerican(best.odds)).toFixed(3),
        books,
        ...movement,
        source:'SPORTSGAMEODDS',
      };
      rows.push(row);
    }
  }
  return {rows,rejected};
}
