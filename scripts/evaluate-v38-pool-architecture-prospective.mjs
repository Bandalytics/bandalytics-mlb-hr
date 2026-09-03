import fs from 'node:fs/promises';
import path from 'node:path';
import { V38_POOL_ARCHITECTURE_PROSPECTIVE_EVAL, evaluateProspectivePoolArchitecture } from '../v38-pool-architecture-prospective-eval.mjs';

const input=process.argv[2];
if(!input)throw Error('usage: node scripts/evaluate-v38-pool-architecture-prospective.mjs <v38-postgame-evaluated.json>');
const z=JSON.parse(await fs.readFile(input,'utf8'));
if(z?.evaluation_protocol!=='V38_PREGAME_OUTCOME_EVAL_V5')throw Error('requires V38_PREGAME_OUTCOME_EVAL_V5');
if(z?.status!=='FINAL'||z?.point_in_time!==true||z?.prospective_validation!==true)throw Error('requires finalized point-in-time prospective V5 evidence');
if(z?.research_only!==true||z?.scoring_enabled!==false||z?.scoring_eligible!==false||z?.model_scoring_changed!==false)throw Error('unsafe V5 research flags');
if(!Array.isArray(z?.rows))throw Error('missing V5 rows');
const evaluation=evaluateProspectivePoolArchitecture(z.rows,z.date);
if(!evaluation.eligible){
  console.log(`V38_POOL_ARCHITECTURE_PROSPECTIVE_SKIPPED=${JSON.stringify(evaluation)}`);
  process.exit(0);
}
const out={
  ...evaluation,
  generated_at:new Date().toISOString(),
  source_evaluation_protocol:z.evaluation_protocol,
  source_date:z.date,
  source_profile_snapshot_sha256:z.snapshot_sha256,
  source_profile_snapshot_captured_at:z.source_profile_snapshot_captured_at,
  source_row_identity:z.row_identity,
  source_doubleheader_safe:z.doubleheader_safe,
  source_status:z.status,
  source_point_in_time:z.point_in_time,
  source_prospective_validation:z.prospective_validation,
  source_research_only:z.research_only,
  source_scoring_enabled:z.scoring_enabled,
  interpretation_ready:false,
  interpretation_note:`A single slate is observational only. Do not interpret architecture performance until at least ${V38_POOL_ARCHITECTURE_PROSPECTIVE_EVAL.minimum_final_slates_before_interpretation} future finalized slates are accumulated.`,
  promotion_effect:'NONE',
  production_effect:'NONE'
};
const outPath=input.replace(/-evaluated\.json$/,`-pool-architecture-prospective-${z.date}.json`);
if(outPath===input)throw Error('unexpected evaluated artifact filename');
await fs.mkdir(path.dirname(outPath),{recursive:true});
await fs.writeFile(outPath,JSON.stringify(out,null,2)+'\n');
console.log(`V38_POOL_ARCHITECTURE_PROSPECTIVE_PATH=${outPath}`);
console.log(`V38_POOL_ARCHITECTURE_PROSPECTIVE=${JSON.stringify({protocol:out.protocol,date:out.date,eligible:out.eligible,minimum_final_slates_before_interpretation:out.minimum_final_slates_before_interpretation,interpretation_ready:out.interpretation_ready,full_complete_population:out.full_complete_population,full_population_hr:out.full_population_hr,structured_pool_rows:out.structured_pool_rows,structured_pool_hr:out.structured_pool_hr,by_layer:out.by_layer,cumulative:out.cumulative,outside_primary_pool_hr:out.outside_primary_pool_hr,production_effect:out.production_effect})}`);
