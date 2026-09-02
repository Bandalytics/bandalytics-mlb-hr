import assert from 'node:assert/strict';
import { classifyLongshotQuality, LONGSHOT_QUALITY_V1 } from './v38-longshot-quality.mjs';

assert.equal(LONGSHOT_QUALITY_V1.research_only,true);
assert.equal(LONGSHOT_QUALITY_V1.scoring_enabled,false);
assert.equal(LONGSHOT_QUALITY_V1.scoring_eligible,false);

const base={barrel:9,hh:36,blast:9,pullair:19,ev:88,iso:.170};
assert.equal(classifyLongshotQuality(base,700).quality_tier,'BASE_ELIGIBLE_4OF6');
const quality={barrel:9,hh:36,blast:9,pullair:17,ev:88,iso:.190};
assert.equal(classifyLongshotQuality(quality,700).quality_tier,'QUALITY_4OF6_PLUS_ISO');
const protected5={barrel:9,hh:36,blast:9,pullair:19,ev:90,iso:.170};
assert.equal(classifyLongshotQuality(protected5,700).quality_tier,'PROTECTED_5OF6_PLUS');
assert.equal(classifyLongshotQuality(protected5,699).quality_tier,'NOT_LONGSHOT_WINDOW');
console.log('v38 longshot quality contract: PASS');
