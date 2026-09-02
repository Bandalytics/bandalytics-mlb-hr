import assert from 'node:assert/strict';
import {V38_CONTEXT_MODIFIER_POLICY,validateContextModifierPolicy} from './v38-context-modifier-policy.mjs';
const v=validateContextModifierPolicy();
assert.equal(v.pass,true);
assert.equal(V38_CONTEXT_MODIFIER_POLICY.lineup_position.hard_gate,false);
assert.equal(V38_CONTEXT_MODIFIER_POLICY.lineup_position.lower_order_auto_downgrade,false);
assert.equal(V38_CONTEXT_MODIFIER_POLICY.bullpen_workload.standalone_hr_boost,false);
assert.equal(V38_CONTEXT_MODIFIER_POLICY.scoring_enabled,false);
console.log('v38 context modifier policy PASS');
