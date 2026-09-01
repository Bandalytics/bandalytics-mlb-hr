import {aggregateHrEvents} from '../results-identity-core.mjs';

export default async function handler(req,res){
  try{
    const date=String(req.query?.date||'');
    if(!/^20\d\d-\d\d-\d\d$/.test(date))return res.status(400).json({error:'date required'});
    const sched=await fetch(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${date}`,{headers:{accept:'application/json'}});
    if(!sched.ok)throw Error('schedule '+sched.status);
    const sj=await sched.json(),games=sj.dates?.[0]?.games||[],events=[];
    for(const g of games){
      const r=await fetch(`https://statsapi.mlb.com/api/v1.1/game/${g.gamePk}/feed/live`,{headers:{accept:'application/json'}});
      if(!r.ok)continue;
      const z=await r.json(),away=z.gameData?.teams?.away,home=z.gameData?.teams?.home;
      for(const p of z.liveData?.plays?.allPlays||[]){
        if(String(p.result?.event||'').toLowerCase()!=='home run')continue;
        const batter=p.matchup?.batter||{},half=String(p.about?.halfInning||'').toLowerCase(),team=half==='top'?away:home;
        events.push({gamePk:g.gamePk,batter_id:batter.id??null,player:batter.fullName||null,team_id:team?.id??null,team:team?.abbreviation||team?.teamName||null,inning:p.about?.inning??null});
      }
    }
    const agg=aggregateHrEvents(events);
    return res.status(200).json({date,games:games.length,events,...agg});
  }catch(e){return res.status(500).json({error:e?.message||String(e)})}
}
