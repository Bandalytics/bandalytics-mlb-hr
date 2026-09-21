import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const s=await fs.readFile('.github/workflows/v38-prospective-postslate-audit.yml','utf8');
for(const marker of [
  'name: v38 Prospective Post-Slate Audit',
  'workflow_dispatch:',
  'lock_run_id:',
  'actions: read',
  'gh run download',
  'evaluate-v38-pregame-snapshot.mjs',
  'evaluate-v38-execution-handoff.mjs',
  'BANDALYTICS_POSTSLATE_SOURCE_OK=',
  'BANDALYTICS_PROSPECTIVE_POSTSLATE_AUDIT_OK=',
  'actions/upload-artifact@v4',
  'retention-days: 90'
])assert.ok(s.includes(marker),`missing workflow marker: ${marker}`);
assert.doesNotMatch(s,/schedule:/,'post-slate audit must remain manually dispatched');
assert.match(s,/permissions:\n\s+contents: read\n\s+actions: read/,'post-slate workflow must be read-only');
const download=s.indexOf('gh run download');
const settle=s.indexOf('evaluate-v38-pregame-snapshot.mjs');
const handoff=s.indexOf('evaluate-v38-execution-handoff.mjs');
assert.ok(download<settle,'lock artifact must be downloaded before settlement');
assert.ok(settle<handoff,'frozen population must settle before handoff evaluation');
console.log('V38 PROSPECTIVE POSTSLATE WORKFLOW CONTRACT PASS');
