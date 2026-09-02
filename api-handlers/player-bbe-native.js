import {buildSavantBbeUrl,summarizeBbeCsv} from '../bbe-core.mjs';

const BATCH_SIZE=30;
const BATCH_CONCURRENCY=5;

async function fetchText(url,timeoutMs=12000){
  const c=new AbortController(),t=setTimeout(()=>c.abort(),timeoutMs);
  try{
    const r=await fetch(url,{headers:{'user-agent':'Mozilla/5.0','accept':'text/csv,*/*'},signal:c.signal});
    if(!r.ok)throw Error('Baseball Savant BBE HTTP '+r.status);
    return await r.text();
  }finally{clearTimeout(t)}
}

const chunks=(ids,size=BATCH_SIZE)=>Array.from({length:Math.ceil(ids.length/size)},(_,i)=>ids.slice(i*size,(i+1)*size));

async function fetchBatch(batch,date){
  const {url}=buildSavantBbeUrl({ids:batch,date});
  const csv=await fetchText(url,12000);
  return summarizeBbeCsv(csv,{ids:batch,date});
}

export default async function handler(req,res){
  try{
    const date=String(req.query?.date||'');
    const ids=[...new Set(String(req.query?.ids||'').split(',').map(Number).filter(x=>Number.isInteger(x)&&x>0))].slice(0,300);
    const meta=buildSavantBbeUrl({ids:[ids[0]],date});
    const batches=chunks(ids),byId=new Map(),batchErrors=[];
    let successfulBatches=0;

    for(let i=0;i<batches.length;i+=BATCH_CONCURRENCY){
      const wave=batches.slice(i,i+BATCH_CONCURRENCY);
      const settled=await Promise.allSettled(wave.map(batch=>fetchBatch(batch,date)));
      settled.forEach((result,j)=>{
        const batch=wave[j];
        if(result.status==='fulfilled'){
          successfulBatches++;
          for(const item of result.value)byId.set(item.player_id,item);
        }else{
          batchErrors.push({player_ids:batch,error:result.reason?.name==='AbortError'?'Baseball Savant timeout':(result.reason?.message||String(result.reason))});
        }
      });
    }

    if(!successfulBatches&&batchErrors.length)throw Error(batchErrors[0].error);

    const items=ids.map(player_id=>byId.get(player_id)||{
      player_id,date,start:meta.start,end:meta.end,tracked_bbe:0,bbe:null,batch_error:true
    });
    const partial=batchErrors.length>0;

    res.setHeader('Cache-Control','s-maxage=120, stale-while-revalidate=300');
    return res.status(200).json({
      ok:true,date,items,source:'BASEBALL_SAVANT_DIRECT',parity_candidate:true,scoring_cutover:false,
      batch_size:BATCH_SIZE,batches:batches.length,successful_batches:successfulBatches,partial,batch_errors:batchErrors
    });
  }catch(e){
    return res.status(502).json({ok:false,error:e?.name==='AbortError'?'Baseball Savant timeout':(e?.message||String(e)),source:'BASEBALL_SAVANT_DIRECT',scoring_cutover:false});
  }
}
