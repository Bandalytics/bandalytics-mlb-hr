import assert from 'node:assert/strict';
import fs from 'node:fs';

const src=fs.readFileSync('scripts/evaluate-v38-exposure-revalidation.mjs','utf8');
assert.match(src,/ranking_contract:'LEXICOGRAPHIC_PREDECLARED_NO_OUTCOME_INPUT'/);
assert.match(src,/candidate_source:'ANTI_OVERCOMPRESSION'/);
assert.match(src,/roi_status:'UNAVAILABLE_NOT_FABRICATED'/);
assert.ok(!/sort\([^\n]*homer/.test(src),'Ranking must not sort on outcomes');
console.log('V38 exposure revalidation contract passed');
