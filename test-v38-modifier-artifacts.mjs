import assert from'node:assert/strict';
import crypto from'node:crypto';
import{validModifierArtifact,attachModifierBands,attachProspectiveModifierBands,modifierCoverage,prospectiveModifierCoverage}from'./v38-modifier-artifacts.mjs';

function signed(protocol,rows){
  const date='2026-09-04',base={protocol,date,captured_at:'2026-09-04T16:00:00.000Z',capture_mode:'AS_OF_RECONSTRUCTABLE',prospective_pregame_only:true,pregame_game_pks:[1],research_only:true,scoring_enabled:false,scoring_eligible:false,model_scoring_changed:false,as_of_verified:true,as_of_rule:'test',lineup_rows:rows.length,rows};
  const body=protocol==='V38_PITCHFIT_DISTRIBUTION_V1'?{...base,fit_rows:rows.length,true_rows:rows.length,partial_rows:0,pending_rows:0,error_rows:0,score_quantiles:{},top_true:rows}:{...base,summary_rows:rows.length,usable_rows:rows.length,full_15_bbe_rows:rows.length,trend_counts:{},quantiles:{},top_hrshape:rows};
  return{...body,sha256:crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex')};
}
const pf=signed('V38_PITCHFIT_DISTRIBUTION_V1',[{player_id:1,matchup:'A @ B',fit_status:'TRUE',fit_score:55}]);
const bb=signed('V38_RECENT_BBE_DISTRIBUTION_V1',[{player_id:1,matchup:'A @ B',tracked_bbe:15,bbe:{hrshape:10}}]);
assert.equal(validModifierArtifact(pf,{date:'2026-09-04',protocol:'V38_PITCHFIT_DISTRIBUTION_V1'}),true);
assert.equal(validModifierArtifact(bb,{date:'2026-09-04',protocol:'V38_RECENT_BBE_DISTRIBUTION_V1'}),true);
const tampered=structuredClone(pf);tampered.rows[0].fit_score=99;assert.equal(validModifierArtifact(tampered,{date:'2026-09-04'}),false);
const unhashed=structuredClone(bb);delete unhashed.sha256;assert.equal(validModifierArtifact(unhashed,{date:'2026-09-04'}),false);
const unsafe=structuredClone(pf);unsafe.scoring_enabled=true;assert.equal(validModifierArtifact(unsafe,{date:'2026-09-04'}),false);
assert.equal(validModifierArtifact(pf,{date:'2026-09-05'}),false);

const mods={pitchfit:{},bbe:{},pitchfitBands:{population:2,classify:r=>r?.fit_status==='TRUE'?'TOP_QUARTILE':'INELIGIBLE'},bbeBands:{population:1,classify:r=>r?.tracked_bbe>=15?{eligible:true,hrshape_band:'TOP_QUARTILE',contact_high:true,rising:true}:{eligible:false,hrshape_band:'INELIGIBLE',contact_high:false,rising:false}},pitchfitById:new Map([[1,{player_id:1,fit_status:'TRUE',fit_score:60}]]),bbeById:new Map([[1,{player_id:1,tracked_bbe:15,bbe:{hrshape:25}}]])};
const a=attachModifierBands({player_id:1},mods),b=attachModifierBands({player_id:2},mods);assert.equal(a.pitchfit_band,'TOP_QUARTILE');assert.equal(a.bbe_band.hrshape_band,'TOP_QUARTILE');assert.equal(b.pitchfit_band,'INELIGIBLE');assert.equal(b.bbe_band.eligible,false);const c=modifierCoverage([a,b],mods);assert.equal(c.rows_with_true_pitchfit,1);assert.equal(c.rows_with_full_bbe,1);assert.equal(c.rows_pitchfit_top_quartile,1);assert.equal(c.rows_bbe_hrshape_top_quartile,1);

const none=attachProspectiveModifierBands({player_id:1},{pitchfitArtifacts:[],bbeArtifacts:[]},{date:'2026-09-04',gamePk:1,startTime:'2026-09-04T19:00:00.000Z',matchup:'A @ B'});
assert.equal(none.modifier_evidence.cryptographically_verified,false);assert.equal(none.modifier_evidence.pitchfit_cryptographically_verified,false);assert.equal(none.modifier_evidence.bbe_cryptographically_verified,false);assert.equal(none.modifier_evidence.pitchfit_snapshot_sha256,null);assert.equal(none.modifier_evidence.bbe_snapshot_sha256,null);
const both=attachProspectiveModifierBands({player_id:1},{pitchfitArtifacts:[pf],bbeArtifacts:[bb]},{date:'2026-09-04',gamePk:1,startTime:'2026-09-04T19:00:00.000Z',matchup:'A @ B'});
assert.equal(both.modifier_evidence.cryptographically_verified,true);assert.equal(both.modifier_evidence.pitchfit_cryptographically_verified,true);assert.equal(both.modifier_evidence.bbe_cryptographically_verified,true);assert.equal(both.modifier_evidence.pitchfit_snapshot_sha256,pf.sha256);assert.equal(both.modifier_evidence.bbe_snapshot_sha256,bb.sha256);
const pc=prospectiveModifierCoverage([none,both],{pitchfitArtifacts:[pf],bbeArtifacts:[bb]});assert.equal(pc.rows_with_verified_modifier_evidence,1);assert.equal(pc.rows_with_verified_pitchfit_evidence,1);assert.equal(pc.rows_with_verified_bbe_evidence,1);
console.log('V38_MODIFIER_ARTIFACTS_PASS');
