import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const [profileFile,contextFile,planFile]=process.argv.slice(2);
if(!profileFile||!contextFile||!planFile)throw Error('usage: node scripts/freeze-v38-slate-decision-bundle.mjs <pregame-profile.json> <context-snapshot.json> <execution-plan.json>');
const [profile,context,plan]=await Promise.all([profileFile,contextFile,planFile].map(async f=>JSON.parse(await fs.readFile(f,'utf8'))));

function verifySha(obj,label){
  if(typeof obj?.sha256!=='string'||!obj.sha256)throw Error(`${label} sha256 required`);
  const {sha256,...body}=obj;
  const calc=crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
  if(calc!==sha256)throw Error(`${label} sha256 mismatch`);
  return sha256;
}
function ms(v){const x=Date.parse(v||'');return Number.isFinite(x)?x:null}
function requireFlags(obj,label){if(obj?.point_in_time!==true||obj?.research_only!==true)throw Error(`${label} unsafe flags`)}

const psha=verifySha(profile,'profile snapshot');
const csha=verifySha(context,'context snapshot');
const esha=verifySha(plan,'execution plan');
requireFlags(profile,'profile snapshot');
requireFlags(context,'context snapshot');
const allowedPlanProtocols=new Set(['BANDALYTICS_EXECUTION_PLAN_PROSPECTIVE_V2','BANDALYTICS_EXECUTION_PLAN_PROSPECTIVE_V3']);
if(!allowedPlanProtocols.has(plan?.protocol)||plan?.prospective!==true||plan?.point_in_time!==true||plan?.research_only!==true)throw Error('prospective V2/V3 execution plan required');
if(profile?.snapshot_protocol!=='V38_PREGAME_SNAPSHOT_V1')throw Error('unexpected profile snapshot protocol');
if(context?.context_protocol!=='V38_CONTEXT_SNAPSHOT_V1')throw Error('unexpected context snapshot protocol');
const date=String(plan.date||'');
if(!date||profile.date!==date||context.date!==date)throw Error('date mismatch across decision inputs');
const pt=ms(profile.captured_at),ct=ms(context.captured_at),et=ms(plan.captured_at);
if(pt==null||ct==null||et==null)throw Error('all decision inputs require captured_at');
if(pt>et||ct>et)throw Error('execution plan cannot predate its evidence snapshots');
const gameStarts=[...(Array.isArray(profile?.pregame_games)?profile.pregame_games:[]),(Array.isArray(context?.pregame_games)?context.pregame_games:[])].map(g=>ms(g?.start_time)).filter(x=>x!=null);
if(!gameStarts.length)throw Error('pregame game start times required');
const earliest=Math.min(...gameStarts);
if(et>=earliest)throw Error('execution plan must freeze before earliest included game start');
if(pt>=earliest||ct>=earliest)throw Error('evidence snapshots must be pregame');
const profileGames=new Set((profile.pregame_games||[]).map(g=>Number(g.gamePk)).filter(Number.isInteger));
const contextGames=new Set((context.pregame_games||[]).map(g=>Number(g.gamePk)).filter(Number.isInteger));
const missingContext=[...profileGames].filter(g=>!contextGames.has(g));
const missingProfile=[...contextGames].filter(g=>!profileGames.has(g));
const body={
  protocol:'BANDALYTICS_SLATE_DECISION_BUNDLE_V1',date,frozen_at:new Date().toISOString(),point_in_time:true,prospective:true,research_only:true,scoring_enabled:false,production_rule_changed:false,
  source_artifacts:{
    profile:{protocol:profile.snapshot_protocol,captured_at:profile.captured_at,sha256:psha,file:path.basename(profileFile),pregame_games:profileGames.size,profile_complete:profile.profile_complete??null},
    context:{protocol:context.context_protocol,captured_at:context.captured_at,sha256:csha,file:path.basename(contextFile),pregame_games:contextGames.size,confirmed_lineups:context.confirmed_lineups??null,market_ok:context.market_ok===true},
    execution_plan:{protocol:plan.protocol,captured_at:plan.captured_at,sha256:esha,file:path.basename(planFile),final_pool_n:plan.summary?.final_pool_n??null,ticket_count:plan.summary?.ticket_count??null,total_ticket_paths:plan.summary?.total_ticket_paths??null,baseball_cut_n:plan.summary?.baseball_cut_n??null,comfort_cut_n:plan.summary?.comfort_cut_n??null,compression_watch_n:plan.summary?.compression_watch_n??null}
  },
  chronology:{profile_before_execution:pt<=et,context_before_execution:ct<=et,execution_before_earliest_game:et<earliest,earliest_included_game_start:new Date(earliest).toISOString()},
  coverage:{profile_game_count:profileGames.size,context_game_count:contextGames.size,missing_context_gamePks:missingContext,missing_profile_gamePks:missingProfile,exact_game_set_match:missingContext.length===0&&missingProfile.length===0},
  semantics:{purpose:'Immutable provenance binding for prospective BANDALYTICS slate decisions.',no_outcome_data:true,no_rule_change:true}
};
if(!body.coverage.exact_game_set_match)throw Error(`profile/context game universe mismatch: missing_context=${missingContext.join(',')} missing_profile=${missingProfile.join(',')}`);
const sha256=crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
const out={...body,sha256};
await fs.mkdir('prospective-decision-bundles',{recursive:true});
const outfile=path.join('prospective-decision-bundles',`${date}-${plan.captured_at.replace(/[:.]/g,'-')}.json`);
await fs.writeFile(outfile,JSON.stringify(out,null,2)+'\n','utf8');
console.log('V38_SLATE_DECISION_BUNDLE='+JSON.stringify({outfile,date,sha256,chronology:body.chronology,coverage:body.coverage,source_artifacts:body.source_artifacts}));
