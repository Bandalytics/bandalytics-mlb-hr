import assert from 'node:assert/strict';
import {validateFinalCutReview,FINAL_CUT_REVIEW_PROTOCOL} from './scripts/validate-v38-final-cut-review.mjs';
const base={protocol:'BANDALYTICS_EXECUTION_DRAFT_TEMPLATE_V2',point_in_time:true,research_only:true,rows:[
 {player:'A',eligible_for_final_cut:true,final_cut:true,cut_type:null,cut_reason:null},
 {player:'B',eligible_for_final_cut:true,final_cut:false,cut_type:'BASEBALL_CUT',cut_reason:'Starter suppressive and no independent heat support.'},
 {player:'C',eligible_for_final_cut:true,final_cut:false,cut_type:'COMFORT_CUT',cut_reason:'Comparable evidence but removed for portfolio comfort.'},
 {player:'D',eligible_for_final_cut:false,final_cut:false}
],compression_watch:[
 {player:'E',review_disposition:'REVIEWED_KEEP',review_reason:'Multi-lane qualified omission deserves direct final-cut review.',review_cut_type:null},
 {player:'F',review_disposition:'REVIEWED_CUT',review_reason:'Verified matchup but weak recent contact.',review_cut_type:'BASEBALL_CUT'}
],tickets:[]};
const z=validateFinalCutReview(base);assert.equal(z.protocol,FINAL_CUT_REVIEW_PROTOCOL);assert.equal(z.valid,true);assert.equal(z.production_rule_changed,false);assert.deepEqual(z.summary,{final_cut_kept:1,baseball_cuts:1,comfort_cuts:1,compression_watch_reviewed:2,compression_watch_keep:1,compression_watch_cut:1,compression_watch_comfort_cuts:0,comfort_checkpoint_triggered:true});
assert.throws(()=>validateFinalCutReview({...base,rows:base.rows.map((r,i)=>i===0?{...r,final_cut:null}:r)}),/unresolved final_cut/);
assert.throws(()=>validateFinalCutReview({...base,rows:base.rows.map((r,i)=>i===1?{...r,cut_type:null}:r)}),/cut_type required/);
assert.throws(()=>validateFinalCutReview({...base,compression_watch:base.compression_watch.map((r,i)=>i===0?{...r,review_disposition:null}:r)}),/compression watch unresolved/);
assert.throws(()=>validateFinalCutReview({...base,rows:base.rows.map((r,i)=>i===3?{...r,final_cut:true}:r)}),/ineligible hitter cannot be FINAL CUT/);
console.log('V38 FINAL CUT REVIEW CONTRACT PASS');
