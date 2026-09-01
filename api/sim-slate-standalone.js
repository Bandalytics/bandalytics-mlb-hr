
/**
 * BANDALYTICS MLB Simulation Engine v2
 *
 * Adds:
 * - Expected-runs engine from offense / starter / bullpen / park / weather / lineup
 * - Optional market calibration
 * - Overdispersed scoring (Gamma-Poisson / Negative-Binomial style)
 * - Shared game-environment shock to correlate scoring
 * - Full-game ML / RL / totals / team totals / exact scores
 * - F5 ML / totals / exact scores
 * - NRFI / YRFI
 * - Fair American odds + EV helpers
 *
 * NOTE:
 * Inputs are designed so the site can plug real data into this engine later.
 * Defaults are league-neutral rather than silently inventing team quality.
 */

function clamp(x, lo, hi) {
  return Math.max(lo, Math.min(hi, x));
}

function mean(arr) {
  return arr.reduce((a,b)=>a+b,0) / Math.max(1, arr.length);
}

function americanOddsFromProb(p) {
  if (!(p > 0 && p < 1)) return null;
  return p >= 0.5
    ? Math.round(-100 * p / (1 - p))
    : Math.round(100 * (1 - p) / p);
}

function impliedProbFromAmerican(odds) {
  if (!Number.isFinite(odds) || odds === 0) return null;
  return odds > 0 ? 100/(odds+100) : Math.abs(odds)/(Math.abs(odds)+100);
}

function evPerUnit(modelProb, americanOdds) {
  if (!(modelProb >= 0 && modelProb <= 1)) return null;
  if (!Number.isFinite(americanOdds) || americanOdds === 0) return null;
  const winProfit = americanOdds > 0 ? americanOdds/100 : 100/Math.abs(americanOdds);
  return modelProb * winProfit - (1-modelProb);
}

// ---------- RNG helpers ----------

function normal01(rng=Math.random) {
  // Box-Muller
  let u = 0, v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function gammaSample(shape, scale=1, rng=Math.random) {
  // Marsaglia & Tsang
  if (shape <= 0) return 0;
  if (shape < 1) {
    const u = Math.max(rng(), 1e-12);
    return gammaSample(shape + 1, scale, rng) * Math.pow(u, 1/shape);
  }
  const d = shape - 1/3;
  const c = 1 / Math.sqrt(9*d);
  while (true) {
    let x, v;
    do {
      x = normal01(rng);
      v = 1 + c*x;
    } while (v <= 0);
    v = v*v*v;
    const u = rng();
    if (u < 1 - 0.0331 * x*x*x*x) return scale*d*v;
    if (Math.log(u) < 0.5*x*x + d*(1-v+Math.log(v))) return scale*d*v;
  }
}

function poisson(lambda, rng=Math.random) {
  if (lambda <= 0) return 0;
  // Knuth is fast enough for baseball-sized lambdas.
  const L = Math.exp(-lambda);
  let k = 0, p = 1;
  do {
    k++;
    p *= rng();
  } while (p > L);
  return k - 1;
}

/**
 * Gamma-Poisson mixture:
 * variance = mean + mean^2 / dispersion
 * Lower dispersion => more volatile scoring.
 */
function negBinLike(meanRuns, dispersion=5.5, rng=Math.random) {
  meanRuns = Math.max(0, meanRuns);
  dispersion = Math.max(0.25, dispersion);
  if (meanRuns === 0) return 0;
  const latentRate = gammaSample(dispersion, meanRuns/dispersion, rng);
  return poisson(latentRate, rng);
}

// ---------- Expected runs engine ----------

const LEAGUE = {
  runsPerTeamGame: 4.45,
  wRCplus: 100,
  xwOBA: 0.320,
  ISO: 0.160,
  barrelPct: 7.5,
  starterERA: 4.20,
  starterFIP: 4.20,
  starterHR9: 1.20,
  starterKminusBBPct: 14.0,
  bullpenERA: 4.10,
  bullpenFIP: 4.10,
};

/**
 * Convert a set of offense metrics into a bounded run multiplier.
 * All fields are optional; missing fields are neutral.
 */
function offenseMultiplier(offense={}) {
  const parts = [];

  if (Number.isFinite(offense.wRCplus))
    parts.push(Math.pow(clamp(offense.wRCplus/LEAGUE.wRCplus, 0.65, 1.45), 0.55));

  if (Number.isFinite(offense.xwOBA))
    parts.push(Math.pow(clamp(offense.xwOBA/LEAGUE.xwOBA, 0.70, 1.35), 0.45));

  if (Number.isFinite(offense.ISO))
    parts.push(Math.pow(clamp(offense.ISO/LEAGUE.ISO, 0.60, 1.60), 0.20));

  if (Number.isFinite(offense.barrelPct))
    parts.push(Math.pow(clamp(offense.barrelPct/LEAGUE.barrelPct, 0.55, 1.75), 0.18));

  if (Number.isFinite(offense.recentContactIndex))
    parts.push(clamp(1 + offense.recentContactIndex/100, 0.92, 1.08));

  return parts.length ? clamp(parts.reduce((a,b)=>a*b,1), 0.72, 1.38) : 1;
}

/**
 * Starter damage multiplier from opponent's perspective.
 * >1 = easier pitcher to score on.
 */
function starterMultiplier(sp={}) {
  const parts = [];

  if (Number.isFinite(sp.xERA))
    parts.push(Math.pow(clamp(sp.xERA/LEAGUE.starterERA, 0.60, 1.65), 0.40));
  else if (Number.isFinite(sp.ERA))
    parts.push(Math.pow(clamp(sp.ERA/LEAGUE.starterERA, 0.60, 1.65), 0.28));

  if (Number.isFinite(sp.FIP))
    parts.push(Math.pow(clamp(sp.FIP/LEAGUE.starterFIP, 0.65, 1.55), 0.28));

  if (Number.isFinite(sp.HR9))
    parts.push(Math.pow(clamp(sp.HR9/LEAGUE.starterHR9, 0.45, 1.90), 0.18));

  if (Number.isFinite(sp.KminusBBPct)) {
    // More K-BB is better for pitcher, therefore inverse effect on offense.
    const ratio = LEAGUE.starterKminusBBPct / Math.max(4, sp.KminusBBPct);
    parts.push(Math.pow(clamp(ratio, 0.65, 1.55), 0.18));
  }

  if (Number.isFinite(sp.platoonDamageIndex))
    parts.push(clamp(1 + sp.platoonDamageIndex/100, 0.88, 1.14));

  if (Number.isFinite(sp.pitchFitIndex))
    parts.push(clamp(1 + sp.pitchFitIndex/100, 0.88, 1.14));

  if (Number.isFinite(sp.workloadPenalty))
    parts.push(clamp(1 + sp.workloadPenalty/100, 0.96, 1.12));

  return parts.length ? clamp(parts.reduce((a,b)=>a*b,1), 0.72, 1.50) : 1;
}

function bullpenMultiplier(bp={}) {
  const parts = [];

  if (Number.isFinite(bp.xFIP))
    parts.push(Math.pow(clamp(bp.xFIP/LEAGUE.bullpenFIP, 0.70, 1.45), 0.35));
  else if (Number.isFinite(bp.ERA))
    parts.push(Math.pow(clamp(bp.ERA/LEAGUE.bullpenERA, 0.70, 1.45), 0.25));

  if (Number.isFinite(bp.fatigueIndex))
    parts.push(clamp(1 + bp.fatigueIndex/100, 0.96, 1.16));

  if (Number.isFinite(bp.handednessAvailabilityIndex))
    parts.push(clamp(1 + bp.handednessAvailabilityIndex/100, 0.94, 1.10));

  return parts.length ? clamp(parts.reduce((a,b)=>a*b,1), 0.78, 1.32) : 1;
}

function environmentMultiplier(env={}) {
  let m = 1;

  if (Number.isFinite(env.parkRunFactor))
    m *= clamp(env.parkRunFactor, 0.85, 1.18);

  if (Number.isFinite(env.weatherRunFactor))
    m *= clamp(env.weatherRunFactor, 0.90, 1.15);

  // Optional inputs expressed as percentage edge, e.g. +4 means +4%.
  if (Number.isFinite(env.windIndex))
    m *= clamp(1 + env.windIndex/100, 0.94, 1.08);

  if (Number.isFinite(env.umpireRunIndex))
    m *= clamp(1 + env.umpireRunIndex/100, 0.96, 1.06);

  return clamp(m, 0.78, 1.30);
}

function lineupMultiplier(lineup={}) {
  let m = 1;
  if (Number.isFinite(lineup.qualityIndex))
    m *= clamp(1 + lineup.qualityIndex/100, 0.88, 1.12);
  if (Number.isFinite(lineup.platoonIndex))
    m *= clamp(1 + lineup.platoonIndex/100, 0.90, 1.12);
  if (Number.isFinite(lineup.injuryIndex))
    m *= clamp(1 + lineup.injuryIndex/100, 0.88, 1.03);
  return clamp(m, 0.78, 1.25);
}

function defenseBaserunningMultiplier(context={}) {
  let m = 1;
  if (Number.isFinite(context.opponentDefenseIndex))
    m *= clamp(1 + context.opponentDefenseIndex/100, 0.96, 1.06);
  if (Number.isFinite(context.baserunningIndex))
    m *= clamp(1 + context.baserunningIndex/100, 0.97, 1.05);
  return clamp(m, 0.90, 1.12);
}

/**
 * Estimate one team's expected runs.
 *
 * marketTeamTotal can be supplied to calibrate model toward market.
 * marketBlend 0 = pure model, 1 = pure market.
 */
function estimateTeamRuns(input={}) {
  const {
    leagueRuns = LEAGUE.runsPerTeamGame,
    offense = {},
    opponentStarter = {},
    opponentBullpen = {},
    environment = {},
    lineup = {},
    context = {},
    starterShare = 0.60,
    bullpenShare = 0.40,
    marketTeamTotal = null,
    marketBlend = 0.18,
    floor = 2.2,
    ceiling = 7.4,
  } = input;

  const off = offenseMultiplier(offense);
  const sp = starterMultiplier(opponentStarter);
  const bp = bullpenMultiplier(opponentBullpen);
  const env = environmentMultiplier(environment);
  const lu = lineupMultiplier(lineup);
  const ctx = defenseBaserunningMultiplier(context);

  const pitch = Math.pow(sp, clamp(starterShare,0,1)) *
                Math.pow(bp, clamp(bullpenShare,0,1));

  const raw = leagueRuns * off * pitch * env * lu * ctx;
  let expected = clamp(raw, floor, ceiling);

  const mb = clamp(marketBlend, 0, 0.60);
  if (Number.isFinite(marketTeamTotal) && marketTeamTotal > 0) {
    // Blend in log space so ratios behave naturally.
    expected = Math.exp((1-mb)*Math.log(expected) + mb*Math.log(marketTeamTotal));
  }

  return {
    expectedRuns: clamp(expected, floor, ceiling),
    rawExpectedRuns: raw,
    multipliers: {
      offense: off,
      starter: sp,
      bullpen: bp,
      pitchingCombined: pitch,
      environment: env,
      lineup: lu,
      defenseBaserunning: ctx,
    },
    marketCalibration: {
      marketTeamTotal: Number.isFinite(marketTeamTotal) ? marketTeamTotal : null,
      marketBlend: Number.isFinite(marketTeamTotal) ? mb : 0,
    }
  };
}

function estimateGameRuns(game={}) {
  const commonEnv = game.environment || {};
  const away = estimateTeamRuns({
    ...(game.away || {}),
    environment: {...commonEnv, ...((game.away||{}).environment||{})},
    opponentStarter: game.homeStarter || (game.away||{}).opponentStarter || {},
    opponentBullpen: game.homeBullpen || (game.away||{}).opponentBullpen || {},
  });
  const home = estimateTeamRuns({
    ...(game.home || {}),
    environment: {...commonEnv, ...((game.home||{}).environment||{})},
    opponentStarter: game.awayStarter || (game.home||{}).opponentStarter || {},
    opponentBullpen: game.awayBullpen || (game.home||{}).opponentBullpen || {},
  });
  return {away, home, total: away.expectedRuns + home.expectedRuns};
}

// ---------- Simulation ----------

const INNING_WEIGHTS_9 = [0.105,0.105,0.108,0.111,0.113,0.115,0.116,0.114,0.113];

function allocateExpectedRuns(teamRuns, starterExpectedRunsShare=0.58) {
  // F5 tends to receive a little more than a flat 5/9 share because starters face top lineup more.
  const f5Share = clamp(starterExpectedRunsShare, 0.50, 0.66);
  const first5 = teamRuns * f5Share;
  const last4 = teamRuns - first5;
  const firstWeights = INNING_WEIGHTS_9.slice(0,5);
  const lastWeights = INNING_WEIGHTS_9.slice(5);
  const fsum = firstWeights.reduce((a,b)=>a+b,0);
  const lsum = lastWeights.reduce((a,b)=>a+b,0);
  return [
    ...firstWeights.map(w=>first5*w/fsum),
    ...lastWeights.map(w=>last4*w/lsum)
  ];
}

function simulateTeamInnings(expectedRuns, opts={}, rng=Math.random) {
  const {
    dispersion = 5.5,
    gameEnvironmentShock = 1,
    starterExpectedRunsShare = 0.58,
  } = opts;

  const inningMeans = allocateExpectedRuns(expectedRuns*gameEnvironmentShock, starterExpectedRunsShare);
  // Team-level latent offense shock causes inning clustering.
  const teamShock = gammaSample(dispersion, 1/dispersion, rng);

  return inningMeans.map(mu => poisson(mu*teamShock, rng));
}

function exactScoreTable(scoreMap, away, home, N, limit=20) {
  return [...scoreMap.entries()]
    .sort((a,b)=>b[1]-a[1])
    .slice(0, limit)
    .map(([key,count])=>{
      const [a,h] = key.split("-").map(Number);
      const p = count/N;
      return {
        awayRuns:a, homeRuns:h,
        score:`${away} ${a} – ${home} ${h}`,
        probability:p,
        pct:100*p,
        fairAmerican:americanOddsFromProb(p)
      };
    });
}

function simulateGame(config={}) {
  const {
    away="AWAY",
    home="HOME",
    awayExpectedRuns=4.2,
    homeExpectedRuns=4.6,
    sims=100000,
    dispersion=5.5,
    sharedEnvironmentSD=0.10,
    totalLines=[7.5,8.0,8.5,9.0,9.5],
    f5TotalLines=[3.5,4.0,4.5,5.0,5.5],
    runLines=[1.5,2.5],
    teamTotalLines=[3.5,4.5,5.5],
    rng=Math.random,
  } = config;

  const N = Math.max(1000, Math.min(1000000, Math.floor(sims)));

  let awayWins=0, homeWins=0, tieAfter9=0;
  let awayF5Wins=0, homeF5Wins=0, f5Ties=0, yrfi=0;
  let awayRunsSum=0, homeRunsSum=0, awayF5Sum=0, homeF5Sum=0;

  const scoreMap = new Map(), f5ScoreMap = new Map();

  const totals = Object.fromEntries(totalLines.map(x=>[x,{over:0,under:0,push:0}]));
  const f5Totals = Object.fromEntries(f5TotalLines.map(x=>[x,{over:0,under:0,push:0}]));
  const awayTT = Object.fromEntries(teamTotalLines.map(x=>[x,{over:0,under:0,push:0}]));
  const homeTT = Object.fromEntries(teamTotalLines.map(x=>[x,{over:0,under:0,push:0}]));
  const rl = {};
  for (const line of runLines) {
    rl[`${away}+${line}`]=0; rl[`${away}-${line}`]=0;
    rl[`${home}+${line}`]=0; rl[`${home}-${line}`]=0;
  }

  for (let i=0;i<N;i++) {
    // Shared environmental latent factor correlates both offenses.
    const z = normal01(rng);
    const sharedShock = Math.exp(sharedEnvironmentSD*z - 0.5*sharedEnvironmentSD*sharedEnvironmentSD);

    const ai = simulateTeamInnings(awayExpectedRuns,{dispersion,gameEnvironmentShock:sharedShock},rng);
    const hi = simulateTeamInnings(homeExpectedRuns,{dispersion,gameEnvironmentShock:sharedShock},rng);

    let ar = ai.reduce((a,b)=>a+b,0);
    let hr = hi.reduce((a,b)=>a+b,0);
    const af5 = ai.slice(0,5).reduce((a,b)=>a+b,0);
    const hf5 = hi.slice(0,5).reduce((a,b)=>a+b,0);

    awayF5Sum += af5; homeF5Sum += hf5;
    if (af5>hf5) awayF5Wins++;
    else if (hf5>af5) homeF5Wins++;
    else f5Ties++;

    const f5key = `${af5}-${hf5}`;
    f5ScoreMap.set(f5key,(f5ScoreMap.get(f5key)||0)+1);

    if (ai[0]+hi[0] > 0) yrfi++;

    if (ar===hr) {
      tieAfter9++;
      let guard=0;
      while (ar===hr && guard<8) {
        const extraBaseA = awayExpectedRuns/9 + 0.28;
        const extraBaseH = homeExpectedRuns/9 + 0.28;
        ar += poisson(extraBaseA*sharedShock,rng);
        hr += poisson(extraBaseH*sharedShock,rng);
        guard++;
      }
      if (ar===hr) {
        const hp = homeExpectedRuns/(awayExpectedRuns+homeExpectedRuns);
        if (rng()<hp) hr++; else ar++;
      }
    }

    awayRunsSum += ar; homeRunsSum += hr;
    if (ar>hr) awayWins++; else homeWins++;

    const key=`${ar}-${hr}`;
    scoreMap.set(key,(scoreMap.get(key)||0)+1);

    const tot=ar+hr, f5tot=af5+hf5;

    for (const line of totalLines) {
      if (tot>line) totals[line].over++;
      else if (tot<line) totals[line].under++;
      else totals[line].push++;
    }

    for (const line of f5TotalLines) {
      if (f5tot>line) f5Totals[line].over++;
      else if (f5tot<line) f5Totals[line].under++;
      else f5Totals[line].push++;
    }

    for (const line of runLines) {
      if (ar+line>hr) rl[`${away}+${line}`]++;
      if (ar-line>hr) rl[`${away}-${line}`]++;
      if (hr+line>ar) rl[`${home}+${line}`]++;
      if (hr-line>ar) rl[`${home}-${line}`]++;
    }

    for (const line of teamTotalLines) {
      if (ar>line) awayTT[line].over++;
      else if (ar<line) awayTT[line].under++;
      else awayTT[line].push++;
      if (hr>line) homeTT[line].over++;
      else if (hr<line) homeTT[line].under++;
      else homeTT[line].push++;
    }
  }

  const marketize = (obj) => {
    const out={};
    for (const [line,c] of Object.entries(obj)) {
      const op=c.over/N, up=c.under/N;
      out[line]={
        overPct:100*op, underPct:100*up, pushPct:100*c.push/N,
        overFairAmerican:americanOddsFromProb(op),
        underFairAmerican:americanOddsFromProb(up)
      };
    }
    return out;
  };

  const runLine={};
  for (const [k,v] of Object.entries(rl)) {
    const p=v/N;
    runLine[k]={pct:100*p,fairAmerican:americanOddsFromProb(p)};
  }

  const teamTotals={away:{},home:{}};
  for (const line of teamTotalLines) {
    for (const [side,obj] of [["away",awayTT],["home",homeTT]]) {
      const c=obj[line], op=c.over/N, up=c.under/N;
      teamTotals[side][line]={
        overPct:100*op,underPct:100*up,pushPct:100*c.push/N,
        overFairAmerican:americanOddsFromProb(op),
        underFairAmerican:americanOddsFromProb(up)
      };
    }
  }

  return {
    meta:{
      away,home,sims:N,awayExpectedRuns,homeExpectedRuns,
      totalExpectedRuns:awayExpectedRuns+homeExpectedRuns,
      dispersion,sharedEnvironmentSD
    },
    fullGame:{
      awayWinPct:100*awayWins/N,
      homeWinPct:100*homeWins/N,
      awayFairAmerican:americanOddsFromProb(awayWins/N),
      homeFairAmerican:americanOddsFromProb(homeWins/N),
      tiedAfter9Pct:100*tieAfter9/N,
      meanAwayRuns:awayRunsSum/N,
      meanHomeRuns:homeRunsSum/N
    },
    firstFive:{
      awayWinPct:100*awayF5Wins/N,
      homeWinPct:100*homeF5Wins/N,
      tiePct:100*f5Ties/N,
      meanAwayRuns:awayF5Sum/N,
      meanHomeRuns:homeF5Sum/N,
      totals:marketize(f5Totals),
      topCorrectScores:exactScoreTable(f5ScoreMap,away,home,N,12)
    },
    firstInning:{
      yrfiPct:100*yrfi/N,
      nrfiPct:100*(N-yrfi)/N,
      yrfiFairAmerican:americanOddsFromProb(yrfi/N),
      nrfiFairAmerican:americanOddsFromProb((N-yrfi)/N)
    },
    totals:marketize(totals),
    teamTotals,
    runLine,
    topCorrectScores:exactScoreTable(scoreMap,away,home,N,25)
  };
}

/**
 * One-call pipeline: raw matchup inputs -> expected runs -> simulation.
 */
function runBandalyticsSim(matchup={}) {
  const estimates = estimateGameRuns(matchup);
  const sim = simulateGame({
    away: matchup.awayCode || "AWAY",
    home: matchup.homeCode || "HOME",
    awayExpectedRuns: estimates.away.expectedRuns,
    homeExpectedRuns: estimates.home.expectedRuns,
    sims: matchup.sims || 100000,
    dispersion: matchup.dispersion || 5.5,
    sharedEnvironmentSD:
      Number.isFinite(matchup.sharedEnvironmentSD) ? matchup.sharedEnvironmentSD : 0.10,
    totalLines: matchup.totalLines,
    f5TotalLines: matchup.f5TotalLines,
    runLines: matchup.runLines,
    teamTotalLines: matchup.teamTotalLines,
  });
  return {estimates, sim};
}





const TEAM_IDS={
  AZ:109,ARI:109,ATL:144,BAL:110,BOS:111,CHC:112,CWS:145,CIN:113,CLE:114,COL:115,DET:116,HOU:117,KC:118,LAA:108,LAD:119,MIA:146,MIL:158,MIN:142,NYM:121,NYY:147,ATH:133,OAK:133,PHI:143,PIT:134,SD:135,SF:137,SEA:136,STL:138,TB:139,TEX:140,TOR:141,WSH:120
};
const LEAGUE_ISO=.160, LEAGUE_OPS=.720;
const n=x=>Number.isFinite(+x)?+x:null;
const normTeam=t=>String(t||'').toUpperCase()==='ARI'?'AZ':String(t||'').toUpperCase()==='OAK'?'ATH':String(t||'').toUpperCase();

function lineupSnapshot(players=[],team){
  const t=normTeam(team), rows=players.filter(x=>normTeam(x.team)===t&&n(x.lineup)>=1&&n(x.lineup)<=9);
  const weighted=rows.filter(x=>n(x.iso)!=null).map(x=>({iso:+x.iso,w:1.18-(Math.min(9,+x.lineup)-1)*.045}));
  const den=weighted.reduce((s,x)=>s+x.w,0), avg=den?weighted.reduce((s,x)=>s+x.iso*x.w,0)/den:null;
  return {team:t,confirmed:rows.length>=9,count:rows.length,weightedIso:avg,isoIndex:avg==null?0:clamp((avg/LEAGUE_ISO-1)*30,-12,12)};
}

function bullpenSnapshot(item={}){
  const p3=n(item.pitches_3d)||0,p5=n(item.pitches_5d)||0,a3=n(item.apps_3d)||0;
  const rel=Array.isArray(item.relievers)?item.relievers:[];
  const backToBack=rel.filter(r=>(n(r.days_used_5d)||0)>=2&&(n(r.rest_days)||0)===0).length;
  const threeOfFive=rel.filter(r=>(n(r.days_used_5d)||0)>=3).length;
  const fatigue=clamp((p3-150)/9+(p5-260)/18+(a3-9)*1.3+backToBack*1.2+threeOfFive*1.5,-8,16);
  return {team:normTeam(item.team),fatigueIndex:+fatigue.toFixed(2),raw:{pitches_3d:p3,pitches_5d:p5,apps_3d:a3,backToBack,threeOfFive}};
}

function parkSnapshot(items=[],venue){
  const row=items.find(x=>String(x.venue||'').toLowerCase()===String(venue||'').toLowerCase());
  if(!row)return {runFactor:1,source:'NEUTRAL'};
  const cur=n(row.current?.runs_factor),roll=n(row.rolling3?.runs_factor);
  let rf=100;
  if(cur!=null&&roll!=null)rf=.35*cur+.65*roll; else rf=cur??roll??100;
  return {runFactor:clamp(rf/100,.88,1.18),source:'SAVANT_BLEND',current:cur,rolling3:roll};
}

function weatherSnapshot(game={},weatherRow={}){
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

function pseudoWrcFromTeamStats(stat={}){
  const ops=n(stat.ops);
  if(ops==null)return null;
  return clamp(100*Math.pow(ops/LEAGUE_OPS,1.35),72,132);
}

function starterSnapshot(stat={}){
  const ip=n(stat.inningsPitched)||0,hr=n(stat.homeRuns)||0,k=n(stat.strikeOuts)||0,bb=n(stat.baseOnBalls)||0,bf=n(stat.battersFaced)||0;
  const hr9=ip>0?9*hr/ip:null;
  const kbb=bf>0?100*(k-bb)/bf:null;
  const era=n(stat.era);
  return {ERA:era,FIP:n(stat.fip),HR9:hr9,KminusBBPct:kbb,workloadPenalty:ip>0&&ip<20?4:0,innings:ip};
}

function extractHydratedPitcherStats(data={}){
  const out=new Map();
  for(const p of data.people||[]){
    const splits=p.stats?.flatMap(x=>x.splits||[])||[];
    const st=splits.find(x=>x.stat)?.stat||{};
    out.set(+p.id,starterSnapshot(st));
  }
  return out;
}

function extractHydratedTeamStats(data={}){
  const out=new Map();
  for(const t of data.teams||[]){
    const splits=t.stats?.flatMap(x=>x.splits||[])||[];
    const st=splits.find(x=>x.stat)?.stat||{};
    out.set(+t.id,st);
  }
  return out;
}

function buildGameMatchup({game,feed,bulpenByTeam=new Map(),parkItems=[],weatherByGame=new Map(),pitcherStats=new Map(),teamStats=new Map(),sims=50000}={}){
  const away=normTeam(game.away),home=normTeam(game.home);
  const la=lineupSnapshot(feed.lineup_players||[],away),lh=lineupSnapshot(feed.lineup_players||[],home);
  const bpa=bulpenByTeam.get(away)||{fatigueIndex:0},bph=bulpenByTeam.get(home)||{fatigueIndex:0};
  const park=parkSnapshot(parkItems,game.venue),weather=weatherSnapshot(game,weatherByGame.get(+game.gamePk)||{});
  const awayTeamStat=teamStats.get(TEAM_IDS[away])||{},homeTeamStat=teamStats.get(TEAM_IDS[home])||{};
  const awrc=pseudoWrcFromTeamStats(awayTeamStat),hwrc=pseudoWrcFromTeamStats(homeTeamStat);
  const awayStarter=pitcherStats.get(+game.awayStarterId)||{},homeStarter=pitcherStats.get(+game.homeStarterId)||{};
  const complete=Math.min(game.awayLineup||0,game.homeLineup||0)>=9;
  return {
    gamePk:+game.gamePk,awayCode:away,homeCode:home,sims,
    status:game.status,venue:game.venue,
    environment:{parkRunFactor:park.runFactor,weatherRunFactor:weather.runFactor},
    away:{
      offense:{wRCplus:awrc??100,ISO:la.weightedIso??LEAGUE_ISO},
      lineup:{qualityIndex:la.isoIndex,platoonIndex:0,injuryIndex:0},
      marketBlend:0
    },
    home:{
      offense:{wRCplus:hwrc??100,ISO:lh.weightedIso??LEAGUE_ISO},
      lineup:{qualityIndex:lh.isoIndex,platoonIndex:0,injuryIndex:0},
      marketBlend:0
    },
    awayStarter,homeStarter,
    awayBullpen:{fatigueIndex:bpa.fatigueIndex},
    homeBullpen:{fatigueIndex:bph.fatigueIndex},
    provenance:{lineups:{away:la,home:lh,complete},park,weather,bullpens:{away:bpa,home:bph},starterStats:{away:awayStarter,home:homeStarter},teamStats:{away:awayTeamStat,home:homeTeamStat}}
  };
}

function simulateSlate(input={}){
  const {feed={},bullpen={},park={},weather={},pitcherStats=new Map(),teamStats=new Map(),sims=50000,includeLive=false}=input;
  const bp=new Map((bullpen.items||[]).map(x=>[normTeam(x.team),bullpenSnapshot(x)]));
  const wx=new Map((weather.items||[]).map(x=>[+x.gamePk,x]));
  const games=[];
  for(const g of feed.items||[]){
    const st=String(g.status||'').toLowerCase();
    if(!includeLive && (st.includes('progress')||st.includes('final')))continue;
    const matchup=buildGameMatchup({game:g,feed,bulpenByTeam:bp,parkItems:park.items||[],weatherByGame:wx,pitcherStats,teamStats,sims});
    const out=runBandalyticsSim(matchup);
    games.push({gamePk:+g.gamePk,away:g.away,home:g.home,status:g.status,venue:g.venue,estimates:out.estimates,sim:out.sim,provenance:matchup.provenance});
  }
  return {ok:true,date:feed.date,games,gameCount:games.length,simsPerGame:sims,source:'BANDALYTICS_AUTO_SIM_V1',researchOnly:true};
}


const ORIGINS={feed:'https://bandalytics-native-data.vercel.app',context:'https://bandalytics-native-context.vercel.app'};
const json=async(url,timeout=15000)=>{const c=new AbortController(),t=setTimeout(()=>c.abort(),timeout);try{const r=await fetch(url,{headers:{accept:'application/json','user-agent':'BANDALYTICS-SIM/1'},signal:c.signal});if(!r.ok)throw Error(`${url} HTTP ${r.status}`);return await r.json()}finally{clearTimeout(t)}};
const ymd=()=>new Date().toISOString().slice(0,10);
const teamIds={AZ:109,ATL:144,BAL:110,BOS:111,CHC:112,CWS:145,CIN:113,CLE:114,COL:115,DET:116,HOU:117,KC:118,LAA:108,LAD:119,MIA:146,MIL:158,MIN:142,NYM:121,NYY:147,ATH:133,PHI:143,PIT:134,SD:135,SF:137,SEA:136,STL:138,TB:139,TEX:140,TOR:141,WSH:120};
export default async function handler(req,res){
  try{
    if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({ok:false,error:'GET required'})}
    const date=String(req.query?.date||ymd()),sims=Math.max(5000,Math.min(100000,Number(req.query?.sims)||30000));
    if(!/^20\d\d-\d\d-\d\d$/.test(date))return res.status(400).json({ok:false,error:'invalid date'});
    const [feed,bullpen,park,weather]=await Promise.all([
      json(`${ORIGINS.feed}/api/feed?date=${encodeURIComponent(date)}`),
      json(`${ORIGINS.context}/api/bullpen?date=${encodeURIComponent(date)}`),
      json(`${ORIGINS.context}/api/park?date=${encodeURIComponent(date)}`),
      json(`${ORIGINS.context}/api/weather?date=${encodeURIComponent(date)}`)
    ]);
    const starterIds=[...new Set((feed.items||[]).flatMap(g=>[+g.awayStarterId,+g.homeStarterId]).filter(Number.isInteger))];
    const teams=[...new Set((feed.items||[]).flatMap(g=>[g.away,g.home]))],ids=teams.map(t=>teamIds[t]).filter(Boolean);
    let pitcherStats=new Map(),teamStats=new Map(),statsWarnings=[];
    try{
      if(starterIds.length){const d=await json(`https://statsapi.mlb.com/api/v1/people?personIds=${starterIds.join(',')}&hydrate=${encodeURIComponent('stats(group=[pitching],type=[season],season=2026)')}`);pitcherStats=extractHydratedPitcherStats(d)}
    }catch(e){statsWarnings.push('pitcher_stats:'+String(e?.message||e))}
    try{
      if(ids.length){const d=await json(`https://statsapi.mlb.com/api/v1/teams?teamIds=${ids.join(',')}&hydrate=${encodeURIComponent('stats(group=[hitting],type=[season],season=2026)')}`);teamStats=extractHydratedTeamStats(d)}
    }catch(e){statsWarnings.push('team_stats:'+String(e?.message||e))}
    const out=simulateSlate({feed,bullpen,park,weather,pitcherStats,teamStats,sims,includeLive:String(req.query?.includeLive||'0')==='1'});
    return res.status(200).json({...out,statsWarnings,coverage:{feedGames:feed.games||0,lineups:feed.lineups||0,starterStats:pitcherStats.size,teamStats:teamStats.size,bullpenTeams:(bullpen.items||[]).length,parkRows:(park.items||[]).length,weatherGames:(weather.items||[]).length}});
  }catch(e){return res.status(500).json({ok:false,error:String(e?.message||e)})}
}
