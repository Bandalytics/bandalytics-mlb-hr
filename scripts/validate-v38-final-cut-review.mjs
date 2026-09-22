import fs from 'node:fs/promises';

export const FINAL_CUT_REVIEW_PROTOCOL='BANDALYTICS_FINAL_CUT_REVIEW_VALIDATION_V1';
const CUT_TYPES=new Set(['BASEBALL_CUT','COMFORT_CUT']);
const WATCH_DISPOSITIONS=new Set(['REVIEWED_KEEP','REVIEWED_CUT']);
const nonempty=v=>typeof v==='string'&&v.trim().length>0;

export function validateFinalCutReview(draft={}){
  if(draft?.protocol!=='BANDALYTICS_EXECUTION_DRAFT_TEMPLATE_V2'||draft?.point_in_time!==true||draft?.research_only!==true)throw Error('valid execution draft template v2 required');
  if(!Array.isArray(draft?.rows)||!Array.isArray(draft?.compression_watch)||!Array.isArray(draft?.tickets))throw Error('draft rows, compression_watch, and tickets required');
  let kept=0,baseballCuts=0,comfortCuts=0;
  for(const r of draft.rows){
    if(r?.eligible_for_final_cut===true){
      if(typeof r.final_cut!=='boolean')throw Error(`unresolved final_cut for ${r.player}`);
      if(r.final_cut===true){kept++;if(r.cut_type!=null)throw Error(`kept hitter cannot have cut_type: ${r.player}`);}
      else{
        if(!CUT_TYPES.has(r.cut_type))throw Error(`cut_type required for ${r.player}`);
        if(!nonempty(r.cut_reason))throw Error(`cut_reason required for ${r.player}`);
        if(r.cut_type==='BASEBALL_CUT')baseballCuts++;else comfortCuts++;
      }
    }else if(r?.final_cut===true)throw Error(`ineligible hitter cannot be FINAL CUT: ${r.player}`);
  }
  let watchKeep=0,watchCut=0,watchComfort=0;
  for(const r of draft.compression_watch){
    if(!WATCH_DISPOSITIONS.has(r?.review_disposition))throw Error(`compression watch unresolved for ${r.player}`);
    if(!nonempty(r?.review_reason))throw Error(`compression watch review_reason required for ${r.player}`);
    if(r.review_disposition==='REVIEWED_KEEP'){watchKeep++;if(r.review_cut_type!=null)throw Error(`compression watch keep cannot have review_cut_type: ${r.player}`);}
    else{watchCut++;if(!CUT_TYPES.has(r.review_cut_type))throw Error(`compression watch review_cut_type required for ${r.player}`);if(r.review_cut_type==='COMFORT_CUT')watchComfort++;}
  }
  const summary={final_cut_kept:kept,baseball_cuts:baseballCuts,comfort_cuts:comfortCuts,compression_watch_reviewed:draft.compression_watch.length,compression_watch_keep:watchKeep,compression_watch_cut:watchCut,compression_watch_comfort_cuts:watchComfort,comfort_checkpoint_triggered:comfortCuts>0||watchComfort>0};
  return {protocol:FINAL_CUT_REVIEW_PROTOCOL,valid:true,research_only:true,production_rule_changed:false,summary,semantics:'Validation enforces explicit FINAL CUT decisions and explicit review of multi-lane compression-watch hitters. BASEBALL_CUT vs COMFORT_CUT is an audit label, not an automatic promotion or scoring rule.'};
}

if(import.meta.url===`file://${process.argv[1]}`){const input=process.argv[2];if(!input)throw Error('usage: node scripts/validate-v38-final-cut-review.mjs <completed-execution-draft-v2.json>');const draft=JSON.parse(await fs.readFile(input,'utf8')),out=validateFinalCutReview(draft);console.log('V38_FINAL_CUT_REVIEW_OK='+JSON.stringify(out));}
