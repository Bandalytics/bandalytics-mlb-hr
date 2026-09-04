import {aggregateHrEvents} from '../results-identity-core.mjs';

export default async function handler(req,res){
  try{
    const date=String(req.query?.date||'');
    if(!/^20\d\d-\d\d-\d\d$/.test(date))return res.status(400).json({ok:false,error:'date required'});
    const sched=await fetch(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${date}`,{headers:{accept:'application/json'}});
    if(!sched.ok)throw Error('schedule '+sched.status);
    const sj=await sched.json(),games=sj.dates?.[0]?.games||[],events=[],settlement_games=[];
    for(const g of games){
      const status=String(g.status?.abstractGameState||''),final=status==='Final';
      if(!final){settlement_games.push({gamePk:g.gamePk,final:false,status:g.status?.detailedState||status||null,participants:[]});continue}
      const r=await fetch(`https://statsapi.mlb.com/api/v1.1/game/${g.gamePk}/feed/live`,{headers:{accept:'application/json'}});
      if(!r.ok){settlement_games.push({gamePk:g.gamePk,final:true,status:g.status?.detailedState||status,participants:[],participation_complete:false});continue}
      const z=await r.json(),away=z.gameData?.teams?.away,home=z.gameData?.teams?.home,participants=[];
      for(const side of['away','home']){
        const box=z.liveData?.boxscore?.teams?.[side]||{},team=side==='away'?away:home;
        for(const pid of box.batters||[]){
          const p=box.players?.['ID'+pid]||{},person=z.gameData?.players?.['ID'+pid]||{},bat=p.stats?.batting||{};
          const pa=Number(bat.plateAppearances),ab=Number(bat.atBats),bb=Number(bat.baseOnBalls),hbp=Number(bat.hitByPitch),sf=Number(bat.sacFlies),sh=Number(bat.sacBunts);
          const appeared=[pa,ab,bb,hbp,sf,sh].some(v=>Number.isFinite(v)&&v>0);
          if(appeared)participants.push({player_id:+pid,player:person.fullName||p.person?.fullName||null,team_id:team?.id??null,team:team?.abbreviation||team?.teamName||null});
        }
      }
      for(const p of z.liveData?.plays?.allPlays||[]){
        if(String(p.result?.event||'').toLowerCase()!=='home run')continue;
        const batter=p.matchup?.batter||{},half=String(p.about?.halfInning||'').toLowerCase(),team=half==='top'?away:home;
        events.push({gamePk:g.gamePk,batter_id:batter.id??null,player:batter.fullName||null,team_id:team?.id??null,team:team?.abbreviation||team?.teamName||null,inning:p.about?.inning??null});
      }
      settlement_games.push({gamePk:g.gamePk,final:true,status:g.status?.detailedState||status,participants,participation_complete:true});
    }
    const agg=aggregateHrEvents(events);
    return res.status(200).json({ok:true,date,games:games.length,events,settlement_games,settlement_protocol:'BANDALYTICS_RESULTS_SETTLEMENT_V1',...agg});
  }catch(e){return res.status(500).json({ok:false,error:e?.message||String(e)})}
}
