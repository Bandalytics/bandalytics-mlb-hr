import fs from 'node:fs';

const freeze=JSON.parse(fs.readFileSync('research/v38-offseason-freeze-2026.json','utf8'));
const plan=JSON.parse(fs.readFileSync('research/v38-2027-validation-plan.json','utf8'));
const historical=fs.readFileSync('scripts/evaluate-v38-ticket-no-lineup-revalidation.mjs','utf8');
const forward=fs.readFileSync('scripts/build-v38-canary-execution-plan.mjs','utf8');
const fail=m=>{throw Error(m)};

if(plan.protocol!=='V38_2027_VALIDATION_PLAN_V1') fail('bad 2027 validation protocol');
if(plan.baseline_commit!=='090e25a12af97ed2e3154a50c7fab880b5ef9ef8') fail('baseline commit changed');
if(plan.frozen_2026_contract_unchanged!==true) fail('2026 freeze must remain unchanged');
if(plan.historical_ticket_replay_comparability!=='RESEARCH_ONLY_NOT_FULLY_EXECUTION_COMPARABLE') fail('historical comparability classification changed');
if(plan.lineup_position_ranking_evidence!==false) fail('lineup slot cannot rank');
if(plan.lineup_membership_role!=='EXECUTION_ELIGIBILITY_ONLY_AFTER_RANKING') fail('lineup membership role changed');
if(plan.preseason_counts_toward_forward_gate!==false||plan.postseason_counts_toward_forward_gate!==false) fail('non-regular-season sample cannot advance forward gate');
if(JSON.stringify(plan.forward_review_slates)!==JSON.stringify([5,10])) fail('5/10 gate changed');
if(plan.normal_volume_auto_enable!==false) fail('normal volume cannot auto-enable');
if(!String(plan.profitability_status||'').startsWith('UNPROVEN_')) fail('profitability guard changed');

if(freeze.frozen_baseball_contract?.lineup_position_ranking_evidence!==false) fail('freeze lineup ranking guard changed');
if(freeze.regular_season_forward_gate?.completed_clean_countable_slates!==0) fail('unexpected forward slate backfill');
if(freeze.validation_boundaries?.postseason!=='SEPARATE_RESEARCH_SAMPLE_ONLY') fail('postseason boundary changed');

if(!historical.includes("const serious=ranked.slice(0,seriousN)")) fail('historical serious-board builder changed unexpectedly');
if(historical.includes("const ticketEligible=serious.filter(confirmedLineup)")) fail('historical replay now claims forward lineup execution parity; re-audit required');
if(!forward.includes("const ticketEligible=serious.filter(confirmedLineup)")) fail('forward confirmed-lineup execution guard missing');
if(!forward.includes("ranking_contract:'LINEUP_SLOT_EXCLUDED_FROM_ALL_RANKING_KEYS'")) fail('forward ranking contract missing');

console.log('V38_2027_VALIDATION_CONTRACT_PASS');
