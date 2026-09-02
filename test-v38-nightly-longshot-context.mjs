import assert from'node:assert/strict';
import{V38_NIGHTLY_LONGSHOT_CONTEXT_V1 as C,nightlyLongshotContextTier as tier}from'./v38-nightly-longshot-context.mjs';
assert.equal(C.research_only,true);assert.equal(C.scoring_enabled,false);assert.equal(C.scoring_eligible,false);assert.equal(C.production_rule_unchanged,true);assert.equal(C.primary_nightly_enhancer,'pitchfit_top_quartile');assert.equal(C.secondary_modifier,'recent_bbe_hrshape_top_quartile');assert.equal(C.hard_double_requirement,false);assert.equal(C.historical_market_scope,'NOT_ODDS_VERIFIED');
assert.equal(tier({quality_tier:'QUALITY_4OF6_PLUS_ISO',pitchfit_band:'TOP_QUARTILE',bbe_band:{hrshape_band:'BASE'}}),'PRIMARY_PITCHFIT_UPGRADE');
assert.equal(tier({quality_tier:'QUALITY_4OF6_PLUS_ISO',pitchfit_band:'TOP_DECILE',bbe_band:{hrshape_band:'TOP_QUARTILE'}}),'PRIMARY_PLUS_BBE_SUPPORT');
assert.equal(tier({quality_tier:'QUALITY_4OF6_PLUS_ISO',pitchfit_band:'BASE_TRUE',bbe_band:{hrshape_band:'TOP_DECILE'}}),'BBE_SUPPORT_ONLY');
assert.equal(tier({quality_tier:'BASE_ELIGIBLE_4OF6',pitchfit_band:'TOP_DECILE',bbe_band:{hrshape_band:'TOP_DECILE'}}),'BASE_PROFILE_ONLY');
console.log('V38 NIGHTLY LONGSHOT CONTEXT PASS');
