import assert from'node:assert/strict';
import{profileComplete}from'./v38-profile-validity.mjs';
import{evaluateV38CandidateRules,v38GatePasses,V38_CANDIDATE_RULES}from'./v38-gate-rules.mjs';

const six={ev:92,hh:48,barrel:14,iso:.24,pullair:24,blast:13,sweet:34};
const five={...six,iso:.15};
const four={...five,pullair:10};
const three={...four,barrel:5};
const incomplete={...six,blast:null};
for(const x of[six,five,four,three])assert.equal(profileComplete(x),true);
assert.equal(profileComplete(incomplete),false);
const a=evaluateV38CandidateRules(six),b=evaluateV38CandidateRules(five),c=evaluateV38CandidateRules(four),d=evaluateV38CandidateRules(three);
assert.equal(a.gate_count,6);assert.equal(b.gate_count,5);assert.equal(c.gate_count,4);assert.equal(d.gate_count,3);
assert.equal(a.rules['6of6'],true);assert.equal(a.rules['5of6'],true);assert.equal(a.rules['4of6'],true);
assert.equal(b.rules['6of6'],false);assert.equal(b.rules['5of6'],true);assert.equal(b.rules['4of6'],true);
assert.equal(c.rules['5of6'],false);assert.equal(c.rules['4of6'],true);assert.equal(d.rules['4of6'],false);
for(const [name,fn] of Object.entries(V38_CANDIDATE_RULES)){const p=v38GatePasses(c);if(name!=='4of6'&&fn(p))assert.equal(c.rules['4of6'],true,`${name} cannot expand generic 4of6`)}
assert.equal(evaluateV38CandidateRules(incomplete).passes.blast,false);
console.log('V38 GATE RULES PASS');
