import fs from 'node:fs/promises';
import {summarizeLockedPolicy} from '../v38-locked-policy-core.mjs';

const input=process.argv[2];
if(!input)throw Error('usage: node scripts/evaluate-v38-locked-policy.mjs <v38-evaluated-or-replay.json>');
const data=JSON.parse(await fs.readFile(input,'utf8'));
const rows=Array.isArray(data.rows)?data.rows:[];
if(!rows.length)throw Error('input has no rows');
const summary=summarizeLockedPolicy(rows);
const output={
  protocol:'BANDALYTICS_LOCKED_POLICY_REPLAY_V1',
  source_protocol:data.evaluation_protocol||data.protocol||null,
  date:data.date||null,
  point_in_time:data.point_in_time===true,
  research_only:true,
  scoring_enabled:false,
  locked_rules:{
    six_of_six:'qualified',
    five_of_six:'qualified',
    four_of_six:'qualified only with pregame HR American odds >= +700',
    below_four_of_six:'not qualified',
    missing_four_of_six_price:'PRICE_UNKNOWN_4OF6; never promoted retrospectively'
  },
  summary:{
    policy_version:summary.policy_version,
    rows:summary.rows,
    qualified_rows:summary.qualified_rows,
    qualified_hr:summary.qualified_hr,
    qualified_hr_rate:summary.qualified_hr_rate,
    price_unknown_4of6:summary.price_unknown_4of6,
    by_label:summary.by_label
  },
  rows:summary.rows_classified
};
const outPath=input.replace(/\.json$/,'-locked-policy.json');
await fs.writeFile(outPath,JSON.stringify(output,null,2)+'\n');
console.log(`LOCKED_POLICY_PATH=${outPath}`);
console.log(`LOCKED_POLICY_SUMMARY=${JSON.stringify(output.summary)}`);
