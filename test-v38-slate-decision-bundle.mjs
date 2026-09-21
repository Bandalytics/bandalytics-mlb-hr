import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';

const seal=body=>({...body,sha256:crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex')});
const reseal=(obj,patch={})=>{const {sha256,...body}=obj;return seal({...body,...patch})};
const date='2026-09-21';
const profile=seal({snapshot_protocol:'V38_PREGAME_SNAPSHOT_V1',date,captured_at:'2026-09-21T17:00:00.000Z',point_in_time:true,research_only:true,pregame_games:[{gamePk:1,start_time:'2026-09-21T23:00:00.000Z'}],profile_complete:10});
const context=seal({context_protocol:'V38_CONTEXT_SNAPSHOT_V1',date,captured_at:'2026-09-21T17:30:00.000Z',point_in_time:true,research_only:true,pregame_games:[{gamePk:1,start_time:'2026-09-21T23:00:00.000Z'}],confirmed_lineups:2,market_ok:false});
const plan=seal({protocol:'BANDALYTICS_EXECUTION_PLAN_PROSPECTIVE_V2',date,captured_at:'2026-09-21T18:00:00.000Z',point_in_time:true,prospective:true,research_only:true,rows:[{player:'A'}],tickets:[],summary:{final_pool_n:1,ticket_count:0,total_ticket_paths:0}});
for(const [name,obj] of Object.entries({profile,context,plan}))await fs.writeFile(`/tmp/${name}.json`,JSON.stringify(obj));
let r=spawnSync(process.execPath,['scripts/freeze-v38-slate-decision-bundle.mjs','/tmp/profile.json','/tmp/context.json','/tmp/plan.json'],{encoding:'utf8'});
assert.equal(r.status,0,r.stderr);
assert.match(r.stdout,/V38_SLATE_DECISION_BUNDLE=/);

const badPlan=reseal(plan,{captured_at:'2026-09-21T16:00:00.000Z'});
await fs.writeFile('/tmp/bad-plan.json',JSON.stringify(badPlan));
r=spawnSync(process.execPath,['scripts/freeze-v38-slate-decision-bundle.mjs','/tmp/profile.json','/tmp/context.json','/tmp/bad-plan.json'],{encoding:'utf8'});
assert.notEqual(r.status,0);assert.match(r.stderr,/cannot predate its evidence snapshots/);

const latePlan=reseal(plan,{captured_at:'2026-09-21T23:00:00.000Z'});
await fs.writeFile('/tmp/late-plan.json',JSON.stringify(latePlan));
r=spawnSync(process.execPath,['scripts/freeze-v38-slate-decision-bundle.mjs','/tmp/profile.json','/tmp/context.json','/tmp/late-plan.json'],{encoding:'utf8'});
assert.notEqual(r.status,0);assert.match(r.stderr,/before earliest included game start/);

const mismatchContext=reseal(context,{pregame_games:[{gamePk:2,start_time:'2026-09-21T23:00:00.000Z'}]});
await fs.writeFile('/tmp/mismatch-context.json',JSON.stringify(mismatchContext));
r=spawnSync(process.execPath,['scripts/freeze-v38-slate-decision-bundle.mjs','/tmp/profile.json','/tmp/mismatch-context.json','/tmp/plan.json'],{encoding:'utf8'});
assert.notEqual(r.status,0);assert.match(r.stderr,/game universe mismatch/);

const tampered={...profile,profile_complete:11};
await fs.writeFile('/tmp/tampered-profile.json',JSON.stringify(tampered));
r=spawnSync(process.execPath,['scripts/freeze-v38-slate-decision-bundle.mjs','/tmp/tampered-profile.json','/tmp/context.json','/tmp/plan.json'],{encoding:'utf8'});
assert.notEqual(r.status,0);assert.match(r.stderr,/profile snapshot sha256 mismatch/);
console.log('V38 SLATE DECISION BUNDLE CONTRACT PASS');
