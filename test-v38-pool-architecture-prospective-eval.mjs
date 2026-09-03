import assert from 'node:assert/strict';
import { V38_POOL_ARCHITECTURE_PROSPECTIVE_EVAL, classifyProspectiveArchitectureRow, evaluateProspectivePoolArchitecture } from './v38-pool-architecture-prospective-eval.mjs';

function row(overrides={}){
  return {
    profile_complete:true,player_id:1,player:'Test',gamePk:10,homer:false,
    ev:91,hh:40,barrel:10,iso:.21,pullair:20,blast:10,sweet:35,
    gate_count:5,gate_passes:{ev:true,hh:true,barrel:true,iso:true,pullair:true,blast:false},
    pitchfit_band:'TOP_QUARTILE',bbe_band:{hrshape_band:'BASE'},
    context:{lineup:3,market:{best_odds:500}},
    ...overrides
  };
}
assert.equal(V38_POOL_ARCHITECTURE_PROSPECTIVE_EVAL.first_eligible_date,'2026-09-04');
assert.equal(V38_POOL_ARCHITECTURE_PROSPECTIVE_EVAL.historical_backfill_allowed,false);
assert.equal(classifyProspectiveArchitectureRow(row(),'2026-09-03').pool_layer,'OUTSIDE_PRIMARY_POOL');
assert.equal(classifyProspectiveArchitectureRow(row(),'2026-09-04').pool_layer,'CORE');
assert.equal(classifyProspectiveArchitectureRow(row({pitchfit_band:'BASE'}),'2026-09-04').pool_layer,'PROTECTED_POOL');
assert.equal(classifyProspectiveArchitectureRow(row({gate_count:4,gate_passes:{iso:true},pitchfit_band:'BASE'}),'2026-09-04').pool_layer,'QUALITY_VALUE_POOL');
const escape=row({gate_count:4,gate_passes:{iso:false},pitchfit_band:'BASE',context:{lineup:7,market:{best_odds:900}},ev:91,hh:40,barrel:10,iso:.15,pullair:20,blast:10});
assert.equal(classifyProspectiveArchitectureRow(escape,'2026-09-04').pool_layer,'ESCAPE_WATCH');
const pre=evaluateProspectivePoolArchitecture([row({homer:true})],'2026-09-03');
assert.equal(pre.eligible,false);assert.equal(pre.auto_promote,false);
const out=evaluateProspectivePoolArchitecture([
  row({player_id:1,homer:true}),
  row({player_id:2,pitchfit_band:'BASE',homer:true}),
  row({player_id:3,gate_count:4,gate_passes:{iso:true},pitchfit_band:'BASE',homer:false}),
  {...escape,player_id:4,homer:true},
  row({player_id:5,gate_count:2,gate_passes:{iso:false},pitchfit_band:'BASE',homer:true})
],'2026-09-04');
assert.equal(out.eligible,true);
assert.equal(out.by_layer.CORE.hr,1);
assert.equal(out.by_layer.PROTECTED_POOL.hr,1);
assert.equal(out.by_layer.QUALITY_VALUE_POOL.n,1);
assert.equal(out.by_layer.ESCAPE_WATCH.hr,1);
assert.equal(out.cumulative['CORE+PROTECTED_POOL+QUALITY_VALUE_POOL+ESCAPE_WATCH'].hr,3);
assert.equal(out.outside_primary_pool_hr,1);
assert.equal(out.production_rule_changed,false);
assert.equal(out.auto_promote,false);
console.log('V38_POOL_ARCHITECTURE_PROSPECTIVE_EVAL_PASS');
