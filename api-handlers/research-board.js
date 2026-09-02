import {buildNativeFeed} from '../native-feed-core.mjs';

const chunk=(a,n)=>Array.from({length:Math.ceil(a.length/n)},(_,i)=>a.slice(i*n,(i+1)*n));
const enc=x=>encodeURIComponent(String(x));

export function buildResearchBoardPlan(feed={}){
  const date=String(feed.date||'');
  const hitters=(feed.lineup_players||[]).map(x=>({
    player:x.player,
    player_id:+x.player_id,
    team:x.team,
    matchup:x.matchup,
    lineup:x.lineup,
    bat_side:x.bat_side||null,
    opp_pitcher:x.opp_pitcher||null,
    opp_pitcher_id:+x.opp_pitcher_id||null,
    opp_pitcher_hand:x.opp_pitcher_hand||null,
    iso:x.iso??null,
    profile_status:'PENDING',
    pitchfit_status:x.opp_pitcher_id?'PENDING':'BLOCKED_NO_STARTER',
    bbe_status:'PENDING',
    market_status:'PENDING',
    scoring_eligible:false
  })).filter(x=>x.player&&Number.isInteger(x.player_id)&&x.player_id>0);
  const ids=[...new Set(hitters.map(x=>x.player_id))];
  const profile_batches=chunk(ids,40).map(batch=>({ids:batch,url:`/api/profile-v38-candidate?ids=${batch.join(',')}&year=2026`}));
  const pitchfit_requests=hitters.filter(x=>x.opp_pitcher_id).map(x=>({player_id:x.player_id,pitcher_id:x.opp_pitcher_id,url:`/api/pitchfit-native?date=${enc(date)}&hitter_id=${x.player_id}&pitcher_id=${x.opp_pitcher_id}`}));
  const bbe_batches=chunk(ids,300).map(batch=>({ids:batch,url:`/api/player-bbe-native?date=${enc(date)}&ids=${batch.join(',')}`}));
  return {
    protocol:'V38_RESEARCH_BOARD_PLAN_V1',date,
    games:feed.items||[],hitters,
    hydration:{
      profile:{mode:'BATCH',endpoint:'/api/profile-v38-candidate',batches:profile_batches},
      pitchfit:{mode:'PLAYER_STARTER_PAIR',endpoint:'/api/pitchfit-native',requests:pitchfit_requests},
      recent_bbe:{mode:'BATCH',endpoint:'/api/player-bbe-native',batches:bbe_batches},
      market:{mode:'SLATE',endpoint:'/api/market-native',url:`/api/market-native?date=${enc(date)}`},
      research_status:{mode:'STATIC',endpoint:'/api/research-status',url:'/api/research-status'}
    },
    counts:{games:+feed.games||0,hitters:hitters.length,confirmed_lineups:+feed.lineups||0,starter_slots:+feed.starters||0,profile_batches:profile_batches.length,pitchfit_requests:pitchfit_requests.length,bbe_batches:bbe_batches.length},
    flow:['IDENTITY_LINEUP_STARTER','PROFILE_V38','PITCHFIT','RECENT_BBE','MARKET','RESEARCH_POOL_HIERARCHY'],
    pool_target_role:'TARGET_ONLY_NOT_FORCED',research_only:true,scoring_enabled:false,scoring_eligible:false,model_scoring_changed:false
  };
}

export default async function handler(req,res){
  const date=String(req.query?.date||'');
  if(!/^20\d\d-\d\d-\d\d$/.test(date))return res.status(400).json({ok:false,error:'date required',research_only:true,scoring_enabled:false});
  try{
    const feed=await buildNativeFeed({date,timeoutMs:12000});
    const board=buildResearchBoardPlan(feed);
    res.setHeader('Cache-Control','s-maxage=30, stale-while-revalidate=60');
    return res.status(200).json({ok:true,...board,source:'MLB_STATSAPI_EXACT_IDENTITY_PROGRESSIVE_RESEARCH_BOARD'});
  }catch(e){return res.status(502).json({ok:false,date,error:e?.name==='AbortError'?'research board timeout':(e?.message||String(e)),protocol:'V38_RESEARCH_BOARD_PLAN_V1',research_only:true,scoring_enabled:false,scoring_eligible:false,model_scoring_changed:false})}
}
