import assert from'node:assert/strict';
import{selectedPoolReport}from'./v38-selected-pool-report.mjs';

const profile={profile_complete:true,gate_count:6,gate_passes:{barrel:true,hh:true,blast:true,pullair:true,ev:true,iso:true},barrel:12,hh:45,blast:12,pullair:22,ev:91,iso:.24,pitchfit_band:'TOP_QUARTILE',bbe_band:{hrshape_band:'TOP_QUARTILE'}};
const rows=[
 {...profile,player_id:1,homer:true,context:{market:{best_odds:800,current_odds:null,american_odds:null}}},
 {...profile,player_id:2,homer:false,context:{market:{best_odds:475}}},
 {...profile,player_id:3,homer:false,context:{market:{best_odds:650}}},
 {...profile,player_id:4,homer:false,context:{market:{best_odds:1100}}},
 {...profile,player_id:5,homer:false,context:{market:{best_odds:null,current_odds:null,american_odds:null}}},
 {...profile,player_id:6,homer:false,context:null}
];
const z=selectedPoolReport(rows);
assert.equal(z.protocol,'V38_SELECTED_POOL_REPORT_V1');
assert.equal(z.groups.base_population.market_priced_n,4,'only finite captured prices count');
assert.equal(z.market_bands['400_499'].n,1);
assert.equal(z.market_bands['500_699'].n,1);
assert.equal(z.market_bands['700_999'].n,1);
assert.equal(z.market_bands['1000_PLUS'].n,1);
assert.equal(z.market_bands.NO_MARKET.n,2,'null/absent market must fail closed, never coerce to zero');
assert.equal(z.market_bands.LT_400.n,0,'null market must not be classified as <+400');
assert.equal(z.groups.longshot_700_plus_locked_4of6.n,2,'locked +700 rule must see current best-book price');
assert.equal(z.groups.preferred_500_1500.n,3,'preferred odds uses captured best-book current price');
assert.equal(z.groups.longshot_700_plus_locked_4of6.flat_unit_profit,7,'+800 HR win plus one +1100 loss');
assert.equal(z.market_return_method,'FLAT_1_UNIT_PER_PRICED_HITTER_AT_CAPTURED_CURRENT_ODDS');
assert.equal(z.scoring_enabled,false);
assert.equal(z.pool_target_role,'TARGET_ONLY_NOT_FORCED');
console.log('V38_SELECTED_POOL_REPORT_MARKET_OK');
