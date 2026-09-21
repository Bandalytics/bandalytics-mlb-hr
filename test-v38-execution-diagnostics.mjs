import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';

const body={
  protocol:'BANDALYTICS_EXECUTION_PLAN_PROSPECTIVE_V2',date:'2026-09-21',captured_at:'2026-09-21T18:00:00.000Z',point_in_time:true,prospective:true,research_only:true,scoring_enabled:false,production_rule_changed:false,
  rows:[
    {player:'Short Repeat',final_cut:true,exposure_state:'PRIORITY',ticket_paths:2,evidence_lanes:['PROFILE'],hr_odds:350,zero_path_reason:null},
    {player:'Value Repeat',final_cut:true,exposure_state:'PRIORITY',ticket_paths:2,evidence_lanes:['PROFILE','MATCHUP'],hr_odds:800,zero_path_reason:null},
    {player:'Zero Strong',final_cut:true,exposure_state:'INTENTIONAL_ZERO',ticket_paths:0,evidence_lanes:['PROFILE','HEAT','VALUE'],hr_odds:900,zero_path_reason:'Portfolio choice'}
  ],
  tickets:[['Short Repeat','Value Repeat'],['Short Repeat','Value Repeat']],
  semantics:{},summary:{}
};
const sha256=crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
await fs.writeFile('/tmp/diag-plan.json',JSON.stringify({...body,sha256}));
let r=spawnSync(process.execPath,['scripts/diagnose-v38-execution-plan.mjs','/tmp/diag-plan.json'],{encoding:'utf8'});
assert.equal(r.status,0,r.stderr);
const line=r.stdout.trim().split('\n').find(x=>x.startsWith('V38_EXECUTION_DIAGNOSTICS='));
assert.ok(line);
const z=JSON.parse(line.slice('V38_EXECUTION_DIAGNOSTICS='.length));
assert.equal(z.summary.final_pool_n,3);
assert.equal(z.summary.total_ticket_legs,4);
assert.equal(z.summary.short_price_leg_share_pct,50);
assert.equal(z.summary.preferred_500_1500_leg_share_pct,50);
assert.equal(z.summary.evidence_inversion_count,2);
assert.equal(z.by_price_bucket.SUB_400.ticket_legs,2);
assert.equal(z.by_price_bucket['700_1500'].ticket_legs,2);
assert.equal(z.by_price_bucket['700_1500'].zero_path_players,1);

const tampered={...body,rows:[...body.rows,{player:'Tampered',final_cut:true,ticket_paths:0,evidence_lanes:[]}],sha256};
await fs.writeFile('/tmp/diag-tampered.json',JSON.stringify(tampered));
r=spawnSync(process.execPath,['scripts/diagnose-v38-execution-plan.mjs','/tmp/diag-tampered.json'],{encoding:'utf8'});
assert.notEqual(r.status,0);
assert.match(r.stderr,/sha256 mismatch/);
console.log('V38 EXECUTION DIAGNOSTICS CONTRACT PASS');
