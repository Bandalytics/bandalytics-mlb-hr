import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const s=await fs.readFile('.github/workflows/v38-prospective-slate-lock.yml','utf8');
for(const marker of [
  'name: v38 Prospective Slate Lock',
  'workflow_dispatch:',
  'draft_path:',
  'validate-v38-final-cut-review.mjs',
  'FINAL_CUT_REVIEW_VALIDATION_SKIPPED_LEGACY_DRAFT',
  'capture-v38-pregame-snapshot.mjs',
  'capture-v38-context-snapshot.mjs',
  'freeze-v38-execution-plan.mjs',
  'diagnose-v38-execution-plan.mjs',
  'freeze-v38-slate-decision-bundle.mjs',
  'BANDALYTICS_PROSPECTIVE_SLATE_LOCK_OK=',
  'actions/upload-artifact@v4',
  'retention-days: 90'
])assert.ok(s.includes(marker),`missing workflow marker: ${marker}`);
const validateReview=s.indexOf('- name: Validate explicit final cut review when using V2 template');
const captureProfile=s.indexOf('- name: Capture fresh point-in-time profile evidence');
const captureContext=s.indexOf('- name: Capture fresh point-in-time context evidence');
const freezePlan=s.indexOf('- name: Freeze exact execution plan');
const diagnose=s.indexOf('node scripts/diagnose-v38-execution-plan.mjs');
const bundle=s.indexOf('node scripts/freeze-v38-slate-decision-bundle.mjs');
assert.ok(validateReview>=0&&validateReview<captureProfile,'final-cut review validation must occur before fresh evidence capture/lock');
assert.ok(captureProfile<freezePlan,'profile evidence must freeze before plan');
assert.ok(captureContext<freezePlan,'context evidence must freeze before plan');
assert.ok(freezePlan<diagnose,'plan must freeze before diagnostics');
assert.ok(diagnose<bundle,'diagnostics should run before decision bundle binding');
assert.match(s,/permissions:\n\s+contents: read/,'workflow must remain read-only');
assert.doesNotMatch(s,/schedule:/,'operational slate lock must not run on a schedule');
console.log('V38 PROSPECTIVE SLATE LOCK WORKFLOW CONTRACT PASS');
