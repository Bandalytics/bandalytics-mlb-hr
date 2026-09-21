import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const s=await fs.readFile('.github/workflows/v38-prospective-slate-lock.yml','utf8');
for(const marker of [
  'name: v38 Prospective Slate Lock',
  'workflow_dispatch:',
  'draft_path:',
  'capture-v38-pregame-snapshot.mjs',
  'capture-v38-context-snapshot.mjs',
  'freeze-v38-execution-plan.mjs',
  'diagnose-v38-execution-plan.mjs',
  'freeze-v38-slate-decision-bundle.mjs',
  'BANDALYTICS_PROSPECTIVE_SLATE_LOCK_OK=',
  'actions/upload-artifact@v4',
  'retention-days: 90'
])assert.ok(s.includes(marker),`missing workflow marker: ${marker}`);
const captureProfile=s.indexOf('capture-v38-pregame-snapshot.mjs');
const captureContext=s.indexOf('capture-v38-context-snapshot.mjs');
const freezePlan=s.indexOf('freeze-v38-execution-plan.mjs');
const diagnose=s.indexOf('diagnose-v38-execution-plan.mjs');
const bundle=s.indexOf('freeze-v38-slate-decision-bundle.mjs');
assert.ok(captureProfile<freezePlan,'profile evidence must freeze before plan');
assert.ok(captureContext<freezePlan,'context evidence must freeze before plan');
assert.ok(freezePlan<diagnose,'plan must freeze before diagnostics');
assert.ok(diagnose<bundle,'diagnostics should run before decision bundle binding');
assert.match(s,/permissions:\n\s+contents: read/,'workflow must remain read-only');
assert.doesNotMatch(s,/schedule:/,'operational slate lock must not run on a schedule');
console.log('V38 PROSPECTIVE SLATE LOCK WORKFLOW CONTRACT PASS');
