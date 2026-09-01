import assert from'node:assert/strict';
import{LENS_REGISTRY,promotedDirectLenses,assertDirectSafeLens}from'./lens-registry.mjs';
assert.deepEqual(promotedDirectLenses(),['Sharp Money']);
assert.equal(assertDirectSafeLens('Sharp Money').state,'PROMOTED');
for(const [name,x] of Object.entries(LENS_REGISTRY)){
  if(name==='Sharp Money')continue;
  assert.equal(x.state,'RESEARCH',name+' must remain research');
  assert.equal(x.direct_safe,false,name+' must not enter direct scoring');
  assert.throws(()=>assertDirectSafeLens(name),/RESEARCH LENS BLOCKED/);
}
console.log('lens registry PASS — promoted:',promotedDirectLenses().join(', '),'research:',Object.keys(LENS_REGISTRY).length-1);
