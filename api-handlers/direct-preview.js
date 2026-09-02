import {buildNativeFeed} from '../native-feed-core.mjs';
import {buildSavantProfileUrl,summarizeSavantCsv,profileBatchPlan} from '../profile-api.mjs';

async function fetchText(url,timeoutMs=15000){
  const c=new AbortController(),t=setTimeout(()=>c.abort(),timeoutMs);
  try{
    const r=await fetch(url,{headers:{'user-agent':'Mozilla/5.0','accept':'text/csv,*/*'},signal:c.signal});
    if(!r.ok)throw Error('Baseball Savant profile HTTP '+r.status);
    return await r.text();
  }finally{clearTimeout(t)}
}

const sampleGrade=x=>{
  const b=Number(x?.bbe_sample)||0,a=Number(x?.ab_sample)||0;
  if(b>=100&&a>=150)return'STABLE';
  if(b>=40&&a>=60)return'USABLE';
  if(b||a)return'THIN';
  return'NONE';
};

export default async function handler(req,res){
  try{
    const date=String(req.query?.date||'');
    if(!/^20\d\d-\d\d-\d\d$/.test(date))return res.status(400).json({ok:false,error:'date required',research_only:true,scoring_enabled:false});
    const feed=await buildNativeFeed({date,timeoutMs:12000}),lineup=Array.isArray(feed.lineup_players)?feed.lineup_players:[];
    const entities=lineup.map(x=>({player:x.player,team:x.team,player_id:+x.player_id})).filter(x=>x.player&&x.team&&Number.isInteger(x.player_id)&&x.player_id>0);
    const profileById=new Map(),batchErrors=[];
    for(const batch of profileBatchPlan(entities,20)){
      try{
        const csv=await fetchText(buildSavantProfileUrl({playerIds:batch.map(x=>x.player_id),start:`${date.slice(0,4)}-03-01`,end:date,season:+date.slice(0,4)}));
        for(const p of summarizeSavantCsv(csv,batch))profileById.set(+p.player_id,p);
      }catch(e){batchErrors.push(e?.name==='AbortError'?'Baseball Savant timeout':(e?.message||String(e)))}
    }
    const items=lineup.map(x=>{
      const p=profileById.get(+x.player_id)||{};
      return {...x,...p,player:x.player,team:x.team,player_id:+x.player_id,sample_grade:sampleGrade(p),profile_source:p.profile_source||'PENDING_DIRECT_PROFILE',scoring_eligible:false};
    });
    const stable_samples=items.filter(x=>x.sample_grade==='STABLE').length,usable_samples=items.filter(x=>x.sample_grade==='USABLE').length;
    res.setHeader('Cache-Control','s-maxage=60, stale-while-revalidate=120');
    return res.status(200).json({ok:true,date,items,posted_hitters:lineup.length,savant_matched:profileById.size,stable_samples,usable_samples,feed:{games:feed.games,starters:feed.starters,lineups:feed.lineups},partial:batchErrors.length>0,batch_errors:batchErrors,source:'MLB_STATSAPI_PLUS_BASEBALL_SAVANT_DIRECT_RESEARCH',research_only:true,scoring_enabled:false,model_scoring_changed:false,scoring_cutover:false});
  }catch(e){return res.status(502).json({ok:false,date:String(req.query?.date||''),error:e?.name==='AbortError'?'Direct preview timeout':(e?.message||String(e)),research_only:true,scoring_enabled:false,model_scoring_changed:false,scoring_cutover:false})}
}
