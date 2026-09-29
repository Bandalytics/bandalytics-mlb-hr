import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const freeze=JSON.parse(read('research/v38-offseason-freeze-2026.json'));
const plan=JSON.parse(read('research/v38-2027-validation-plan.json'));
const live=read('.github/workflows/v38-canary-live-prep.yml');
const fail=m=>{throw Error(m)};

const required=[
  '.github/workflows/v38-offseason-freeze-contract.yml',
  '.github/workflows/v38-2027-validation-contract.yml',
  '.github/workflows/v38-canary-live-prep.yml',
  '.github/workflows/v38-canary-execution-freeze.yml',
  '.github/workflows/v38-canary-ledger-append.yml',
  '.github/workflows/v38-canary-ledger-integrity.yml',
  '.github/workflows/v38-canary-reactivation-readiness.yml',
  'scripts/build-v38-canary-execution-plan.mjs',
  'scripts/freeze-v38-canary-execution.mjs',
  'scripts/settle-v38-canary-execution.mjs',
  'scripts/update-v38-canary-ledger.mjs'
];
for(const p of required) if(!fs.existsSync(p)) fail('missing 2027 readiness component: '+p);

if(freeze.production_normal_volume!==false) fail('normal volume must remain disabled');
if(freeze.regular_season_forward_gate?.carry_unmet_gate_into_2027!==true) fail('unfinished regular-season gate must carry into 2027');
if(freeze.regular_season_forward_gate?.postseason_counts_toward_regular_season_gate!==false) fail('postseason cannot count toward gate');
if(plan.preseason_counts_toward_forward_gate!==false||plan.postseason_counts_toward_forward_gate!==false) fail('non-regular-season samples cannot count');
if(plan.normal_volume_auto_enable!==false) fail('normal volume cannot auto-enable');
if(!live.includes('[[ "$DATE" == 2027-* ]]')) fail('live prep is not quarantined outside 2027');
if(!live.includes('REGULAR_SEASON_FORWARD_CANARY_PREP_DISABLED_OUTSIDE_2027')) fail('live prep quarantine reason missing');
if(!live.includes("m.outcome_input!==false")) fail('live prep point-in-time outcome guard missing');
if(!live.includes('FULL_STANDARD_5OF6_PLUS_SLATE_BEFORE_EARLIEST_CANDIDATE_START')) fail('full-slate pregame freeze guard missing');
if(!live.includes('m.requested_ticket_budget')||!live.includes('m.actual_tickets')) fail('ticket-budget comparability evidence missing');

console.log('V38_2027_STARTUP_READINESS_PASS');
