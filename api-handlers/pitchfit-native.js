import {fitOne,hitterUrl,pitcherUrl,parseCsv} from '../pitchfit-native-core.mjs';
import {fetchText} from '../starter-native-core.mjs';

const id=v=>{const n=Number(v);return Number.isInteger(n)&&n>0?n:null};

export default async function handler(req,res){
  try{
    const body=req.method==='POST'?(req.body||{}):{},q=req.query||{};
    const date=String(body.date||q.date||''),hitter_id=id(body.hitter_id??body.player_id??q.hitter_id??q.player_id),pitcher_id=id(body.pitcher_id??q.pitcher_id);
    if(!/^20\d\d-\d\d-\d\d$/.test(date))return res.status(400).json({ok:false,error:'date required',research_only:true,scoring_enabled:false});
    if(!hitter_id||!pitcher_id)return res.status(400).json({ok:false,error:'valid hitter_id and pitcher_id required',research_only:true,scoring_enabled:false});

    const [hcsv,pcsv]=await Promise.all([
      fetchText(hitterUrl([hitter_id],date),{timeoutMs:20000}),
      fetchText(pitcherUrl([pitcher_id],date),{timeoutMs:20000})
    ]);
    const hitterRows=parseCsv(hcsv),pitcherRows=parseCsv(pcsv),fit=fitOne({hitter_id,pitcher_id,hitterRows,pitcherRows});

    res.setHeader('Cache-Control','s-maxage=300, stale-while-revalidate=900');
    return res.status(200).json({
      ok:true,date,hitter_id,pitcher_id,fit,
      hitter_rows:hitterRows.filter(r=>+r.batter===hitter_id).length,
      pitcher_rows:pitcherRows.filter(r=>+r.pitcher===pitcher_id).length,
      source:'BASEBALL_SAVANT_NATIVE_PITCHFIT_RESEARCH',
      identity_verified:true,parity_verified:false,research_only:true,scoring_enabled:false,model_scoring_changed:false,scoring_cutover:false
    });
  }catch(e){
    return res.status(502).json({ok:false,error:e?.name==='AbortError'?'Baseball Savant timeout':(e?.message||String(e)),source:'BASEBALL_SAVANT_NATIVE_PITCHFIT_RESEARCH',research_only:true,scoring_enabled:false,scoring_cutover:false});
  }
}
