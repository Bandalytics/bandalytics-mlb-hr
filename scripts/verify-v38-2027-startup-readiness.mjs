import fs from 'node:fs';

const freezePath=process.argv[2]||'research/v38-offseason-freeze-2026.json';
const x=JSON.parse(fs.readFileSync(freezePath,'utf8'));
const req=(ok,msg)=>{if(!ok) throw Error(msg)};

req(x.protocol==='V38_OFFSEASON_FREEZE_2026_V1','wrong freeze protocol');
req(x.production_normal_volume===false,'normal volume must remain off');
req(x.profitability_status==='UNPROVEN_REQUIRES_VERIFIED_FROZEN_PRICES_STAKES_AND_FORWARD_SETTLEMENTS','profitability must remain unproven');
req(x.regular_season_forward_gate?.postseason_counts_toward_regular_season_gate===false,'postseason cannot advance regular-season gate');
req(x.regular_season_forward_gate?.carry_unmet_gate_into_2027===true,'unfinished gate must carry into 2027');
req(x.frozen_baseball_contract?.candidate_source==='STANDARD_5OF6_PLUS_ANTI_OVERCOMPRESSION','candidate source drift');
req(x.frozen_baseball_contract?.core6_standard_minimum===5,'Core6 minimum drift');
req(x.frozen_baseball_contract?.starter_hr9_lt_1_2==='SUPPRESSIVE_FILTER','starter HR/9 suppressive rule drift');
req(x.frozen_baseball_contract?.protected_4of6==='SHADOW_ONLY_NOT_MIXED_IN_REACTIVATION_CANARY','protected 4/6 drift');
req(x.frozen_baseball_contract?.lineup_position_ranking_evidence===false,'lineup position cannot rank');
req(x.frozen_baseball_contract?.lineup_membership_role==='EXECUTION_ELIGIBILITY_ONLY','lineup membership role drift');
req(x.provisional_downstream_architecture?.status?.startsWith('PROVISIONAL_'),'downstream architecture must remain provisional');
req(x.provisional_downstream_architecture?.serious_board_share_pct===40,'serious-board share drift');
req(x.provisional_downstream_architecture?.ticket_budget_share_pct===40,'ticket-budget share drift');
req(x.provisional_downstream_architecture?.large_priority_repeat_share_pct===25,'Priority-25 drift');
req(x.validation_boundaries?.postseason==='SEPARATE_RESEARCH_SAMPLE_ONLY','postseason boundary drift');
req(x.validation_boundaries?.postseason_may_change_2027_rules===false,'postseason cannot mutate 2027 rules');
req(x.validation_boundaries?.historical_holdout_may_select_new_architecture===false,'holdout cannot select new architecture');
req(x.validation_boundaries?.roi_claims_without_verified_frozen_prices===false,'ROI cannot be claimed without verified frozen prices');

const required=[
 'scripts/build-v38-canary-execution-plan.mjs',
 'scripts/freeze-v38-canary-execution.mjs',
 'scripts/verify-v38-canary-preflight.mjs',
 'scripts/settle-v38-canary-preflight.mjs',
 'scripts/update-v38-canary-ledger.mjs',
 'scripts/capture-v38-canary-outcomes.mjs',
 'scripts/capture-v38-manual-price-snapshot.mjs'
];
for(const p of required) req(fs.existsSync(p),`missing 2027 restart dependency: ${p}`);

console.log(JSON.stringify({protocol:'V38_2027_STARTUP_READINESS_V1',status:'READY_FOR_OFFSEASON_INTEGRITY_WORK_ONLY',production_normal_volume:false,forward_gate:x.regular_season_forward_gate,required_chain:'price -> plan -> freeze -> preflight -> outcome -> settlement -> append-only ledger'},null,2));
