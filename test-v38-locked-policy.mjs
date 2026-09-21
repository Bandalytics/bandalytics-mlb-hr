import assert from 'node:assert/strict';
import {classifyLockedPolicy,extractPregameHrAmericanOdds,LOCKED_POLICY_LABELS} from './v38-locked-policy-core.mjs';

const base={ev:91,hh:42,barrel:12,iso:.22,pullair:24,blast:10};
assert.equal(classifyLockedPolicy(base).label,LOCKED_POLICY_LABELS.QUALIFIED_6OF6);
assert.equal(classifyLockedPolicy({...base,blast:7}).label,LOCKED_POLICY_LABELS.QUALIFIED_5OF6);
const four={...base,blast:7,pullair:17};
assert.equal(classifyLockedPolicy({...four,context:{market:{best_odds:'+700'}}}).label,LOCKED_POLICY_LABELS.PROTECTED_4OF6_700PLUS);
assert.equal(classifyLockedPolicy({...four,context:{market:{current_odds:650}}}).label,LOCKED_POLICY_LABELS.NOT_QUALIFIED_4OF6_PRICE_SHORT);
assert.equal(classifyLockedPolicy(four).label,LOCKED_POLICY_LABELS.PRICE_UNKNOWN_4OF6);
assert.equal(classifyLockedPolicy({...four,barrel:7}).label,LOCKED_POLICY_LABELS.NOT_QUALIFIED_PROFILE);
assert.equal(extractPregameHrAmericanOdds({context:{market:{books:[{hr_odds:'+925'}]}}}),925);
console.log('v38 locked policy tests passed');
