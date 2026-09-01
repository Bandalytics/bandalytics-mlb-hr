import {buildNativeFeed} from '../native-feed-core.mjs';
export default async function handler(req,res){
  const date=String(req.query?.date||'');
  try{
    const out=await buildNativeFeed({date,timeoutMs:10000});
    res.setHeader('Cache-Control','s-maxage=45, stale-while-revalidate=120');
    return res.status(200).json(out);
  }catch(e){return res.status(502).json({ok:false,date,source:'MLB_STATSAPI_DIRECT',error:e?.name==='AbortError'?'MLB timeout':(e?.message||String(e)),model_scoring_changed:false})}
}
