import fs from 'node:fs';

const p='research/v38-offseason-freeze-2026.json';
const z=JSON.parse(fs.readFileSync(p,'utf8'));
const fail=m=>{throw Error(m)};

if(z.protocol!=='V38_OFFSEASON_FREEZE_2026_V1') fail('bad protocol');
if(z.season!==2026) fail('bad season');
if(z.status!=='REGULAR_SEASON_ENDED_FORWARD_REACTIVATION_INCOMPLETE') fail('bad status');
if(z.production_normal_volume!==false) fail('normal volume must remain off');
if(!String(z.profitability_status||'').startsWith('UNPROVEN_')) fail('profitability must remain unproven');
if(z.regular_season_forward_gate?.completed_clean_countable_slates!==0) fail('unexpected countable slate backfill');
if(z.regular_season_forward_gate?.carry_unmet_gate_into_2027!==true) fail('2027 gate carry required');
if(z.regular_season_forward_gate?.postseason_counts_toward_regular_season_gate!==false) fail('postseason cannot complete regular-season gate');

const b=z.frozen_baseball_contract||{};
if(b.candidate_source!=='STANDARD_5OF6_PLUS_ANTI_OVERCOMPRESSION') fail('candidate source changed');
if(b.core6_standard_minimum!==5) fail('core6 standard changed');
if(b.starter_hr9_lt_1_2!=='SUPPRESSIVE_FILTER') fail('starter suppressive rule changed');
if(b.protected_4of6!=='SHADOW_ONLY_NOT_MIXED_IN_REACTIVATION_CANARY') fail('protected 4of6 changed');
if(b.lineup_position_ranking_evidence!==false) fail('lineup position must not rank');
if(b.lineup_membership_role!=='EXECUTION_ELIGIBILITY_ONLY') fail('lineup membership role changed');
if(b.ranking_contract!=='LINEUP_SLOT_EXCLUDED_FROM_ALL_RANKING_KEYS') fail('ranking contract changed');

const d=z.provisional_downstream_architecture||{};
if(d.status!=='PROVISIONAL_FORWARD_REVALIDATION_AFTER_LINEUP_CONTAMINATION_CLEANUP') fail('architecture must remain provisional');
if(d.small_slate_ranking!=='PROFILE_FIRST'||d.medium_large_ranking!=='PITCHFIT_FIRST') fail('routing changed');
if(d.serious_board_share_pct!==40||d.ticket_budget_share_pct!==40||d.large_priority_repeat_share_pct!==25) fail('share architecture changed');
if(d.pairing!=='CROSS_GAME') fail('pairing changed');

const v=z.validation_boundaries||{};
if(v.postseason!=='SEPARATE_RESEARCH_SAMPLE_ONLY') fail('postseason boundary changed');
if(v.postseason_may_change_2027_rules!==false) fail('postseason cannot directly mutate 2027 rules');
if(v.historical_holdout_may_select_new_architecture!==false) fail('holdout cannot select architecture');
if(v.roi_claims_without_verified_frozen_prices!==false) fail('ROI guard changed');

const r=z['2027_restart_contract']||{};
if(r.resume_from_this_frozen_contract!==true||r.rebuild_from_scratch!==false) fail('restart contract changed');
if(JSON.stringify(r.review_after_countable_slates)!==JSON.stringify([5,10])) fail('review gate changed');
if(r.normal_volume_requires_separate_promotion_decision!==true) fail('promotion guard changed');

console.log('V38_OFFSEASON_FREEZE_CONTRACT_PASS');
