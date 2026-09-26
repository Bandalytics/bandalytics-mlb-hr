import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {attachProspectiveModifierBands} from './v38-modifier-artifacts.mjs';

function signed(capturedAt,rows){
  const base={protocol:'V38_PITCHFIT_DISTRIBUTION_V1',date:'2026-09-26',captured_at:capturedAt,capture_mode:'LIVE_PREGAME',prospective_pregame_only:true,pregame_game_pks:[100],row_identity:'GAMEPK_PLAYER_ID',research_only:true,scoring_enabled:false,scoring_eligible:false,model_scoring_changed:false,as_of_verified:true,as_of_rule:'test',lineup_rows:rows.length,fit_rows:rows.length,true_rows:rows.length,partial_rows:0,pending_rows:0,error_rows:0,score_quantiles:{p75:55,p90:60},top_true:rows,rows};
  return {...base,sha256:crypto.createHash('sha256').update(JSON.stringify(base)).digest('hex')};
}
const older=signed('2026-09-26T19:30:00.000Z',[{gamePk:100,player_id:7,matchup:'A @ B',fit_status:'TRUE',fit_score:61,sample:100}]);
const newerSparse=signed('2026-09-26T19:45:00.000Z',[{gamePk:100,player_id:8,matchup:'A @ B',fit_status:'TRUE',fit_score:58,sample:100}]);
const out=attachProspectiveModifierBands({player_id:7},{pitchfitArtifacts:[older,newerSparse],bbeArtifacts:[]},{date:'2026-09-26',gamePk:100,startTime:'2026-09-26T23:00:00.000Z',matchup:'A @ B'});
assert.equal(out.pitchfit?.player_id,7);
assert.equal(out.pitchfit?.fit_score,61);
assert.equal(out.modifier_evidence.pitchfit_captured_at,older.captured_at);
assert.equal(out.modifier_evidence.pitchfit_snapshot_sha256,older.sha256);
assert.equal(out.modifier_evidence.pitchfit_cryptographically_verified,true);
assert.equal(out.modifier_evidence.row_specific_snapshot_fallback,true);
console.log('V38_MODIFIER_ROW_FALLBACK_PASS');
