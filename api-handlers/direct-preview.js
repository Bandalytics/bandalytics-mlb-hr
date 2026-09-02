import {buildNativeFeed} from '../native-feed-core.mjs';
import {profileBatchPlan} from '../profile-api.mjs';

const PROFILE_BATCH_SIZE=20;

export default async function handler(req,res){
  try{
    const date=String(req.query?.date||'');
    if(!/^20\d\d-\d\d-\d\d$/.test(date))return res.status(400).json({ok:false,error:'date required',research_only:true,scoring_enabled:false});
    const feed=await buildNativeFeed({date,timeoutMs:12000}),lineup=Array.isArray(feed.lineup_players)?feed.lineup_players:[];
    const entities=lineup.map(x=>({player:x.player,team:x.team,player_id:+x.player_id})).filter(x=>x.player&&x.team&&Number.isInteger(x.player_id)&&x.player_id>0);
    const batches=profileBatchPlan(entities,PROFILE_BATCH_SIZE).map(batch=>batch.map(x=>+x.player_id));
    const items=lineup.map(x=>({...x,player:x.player,team:x.team,player_id:+x.player_id,sample_grade:'PENDING',profile_source:'PENDING_DIRECT_PROFILE',scoring_eligible:false}));
    res.setHeader('Cache-Control','s-maxage=30, stale-while-revalidate=60');
    return res.status(200).json({
      ok:true,date,items,posted_hitters:lineup.length,savant_matched:0,stable_samples:0,usable_samples:0,
      feed:{games:feed.games,starters:feed.starters,lineups:feed.lineups},
      profile_hydration:{mode:'CLIENT_PROGRESSIVE',endpoint:'/api/profile-native-qa',batch_size:PROFILE_BATCH_SIZE,batches,total_batches:batches.length},
      partial:items.length>0,source:'MLB_STATSAPI_DIRECT_IDENTITY_FIRST',research_only:true,scoring_enabled:false,model_scoring_changed:false,scoring_cutover:false
    });
  }catch(e){return res.status(502).json({ok:false,date:String(req.query?.date||''),error:e?.name==='AbortError'?'Direct preview timeout':(e?.message||String(e)),research_only:true,scoring_enabled:false,model_scoring_changed:false,scoring_cutover:false})}
}
