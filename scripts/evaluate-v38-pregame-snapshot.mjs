import fs from'node:fs/promises';
import pathMod from'node:path';
import crypto from'node:crypto';
import{profileGate,candidatePowerScore,summarizeReplay}from'../v38-leakage-replay-core.mjs';
import{profileComplete}from'../v38-profile-validity.mjs';
import{evaluateV38CandidateRules,V38_CANDIDATE_RULES}from'../v38-gate-rules.mjs';
import{selectLatestPregameContext,contextForGame,validContextSnapshot}from'../v38-context-selector.mjs';
import{evaluateContextConvergence}from'../v38-context-eval.mjs';
import{loadModifierArtifactSets,attachProspectiveModifierBands,prospectiveModifierCoverage}from'../v38-modifier-artifacts.mjs';
import{evaluateBaseballConvergence}from'../v38-baseball-convergence.mjs';
import{playedGamesForProfile,hitterMatchupForGame,summarizeFinalGamePlays,V38_POSTGAME_GAME_IDENTITY}from'../v38-postgame-game-identity.mjs';

const MLB='https://statsapi.mlb.com',EVAL_PROTOCOL='V38_PREGAME_OUTCOME_EVAL_V5';
async function get(url,ms=20000){const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);try{const r=await fetch(url,{headers:{accept:'application/json','user-agent':'BANDALYTICS-v38-snapshot-eval/10'},signal:c.signal});const text=await r.text();if(!r.ok)throw Error(`${url} HTTP ${r.status}: ${text.slice(0,160)}`);return JSON.parse(text)}finally{clearTimeout(t)}}
function digestSnapshot(z){const{sha256,...body}=z;return crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex')}
async function jsonFiles(root){if(!root)return[];const out=[];async function walk(p){let entries;try{entries=await fs.readdir(p,{withFileTypes:true})}catch{return}for(const e of entries){const q=pathMod.join(p,e.name);if(e.isDirectory())await walk(q);else if(e.isFile()&&e.name.endsWith('.json'))out.push(q)}}await walk(root);return out}
async function loadContexts(root,date){const files=await jsonFiles(root),out=[];for(const f of files){try{const z=JSON.parse(await fs.readFile(f,'utf8'));if(z.date===date&&validContextSnapshot(z))out.push(z)}catch{}}return out}

const path=process.argv[2],contextDir=process.argv[3]||null,modifierDir=process.argv[4]||null;if(!path)throw Error('usage: node scripts/evaluate-v38-pregame-snapshot.mjs <snapshot.json> [context-dir] [modifier-dir]');
const snapshot=JSON.parse(await fs.readFile(path,'utf8'));if(snapshot.snapshot_protocol!=='V38_PREGAME_SNAPSHOT_V1')throw Error('unsupported snapshot protocol');if(digestSnapshot(snapshot)!==snapshot.sha256)throw Error('snapshot integrity mismatch');
const[contextSnapshots,modifierSets]=await Promise.all([loadContexts(contextDir,snapshot.date),loadModifierArtifactSets(modifierDir,snapshot.date)]),gameMeta=new Map((snapshot.pregame_games||[]).map(g=>[+g.gamePk,g]));
const eligibleGames=new Set((snapshot.pregame_games||[]).map(x=>+x.gamePk)),hrIds=new Set(),playedByGame=new Map(),hrByGame=new Map(),gameStates=[];
for(const g of snapshot.pregame_games||[]){
  const gamePk=+g.gamePk,f=await get(`${MLB}/api/v1.1/game/${gamePk}/feed/live`).catch(()=>null);
  if(!f){gameStates.push({gamePk,status:'FETCH_FAILED',final:false});continue}
  const st=String(f.gameData?.status?.abstractGameState||f.gameData?.status?.detailedState||'').toLowerCase(),isFinal=st==='final'||st.includes('game over')||st.includes('completed');
  gameStates.push({gamePk,status:f.gameData?.status?.detailedState||f.gameData?.status?.abstractGameState||null,final:isFinal});
  if(!isFinal)continue;
  const{played,homers}=summarizeFinalGamePlays(f.liveData?.plays?.allPlays||[]);for(const bid of homers)hrIds.add(bid);playedByGame.set(gamePk,played);hrByGame.set(gamePk,homers);
}
const pendingGames=gameStates.filter(x=>!x.final);
if(pendingGames.length){
  const pending={evaluation_protocol:EVAL_PROTOCOL,snapshot_protocol:snapshot.snapshot_protocol,snapshot_sha256:snapshot.sha256,date:snapshot.date,captured_at:snapshot.captured_at,row_identity:V38_POSTGAME_GAME_IDENTITY.row_identity,doubleheader_safe:V38_POSTGAME_GAME_IDENTITY.doubleheader_safe,point_in_time:true,qualifying_backtest:false,prospective_validation:false,research_only:true,scoring_enabled:false,scoring_eligible:false,model_scoring_changed:false,status:'WAITING_FOR_FINAL_GAMES',eligible_games:[...eligibleGames].length,final_games:gameStates.filter(x=>x.final).length,pending_games:pendingGames,context_snapshots_loaded:contextSnapshots.length,pitchfit_artifacts_loaded:modifierSets.pitchfitArtifacts.length,bbe_artifacts_loaded:modifierSets.bbeArtifacts.length,modifier_selection_rule:'latest valid artifact strictly before each game start and containing that exact game'};
  console.log(`V38_EVAL_PENDING=${JSON.stringify(pending)}`);process.exitCode=2;
}else{
  let rows=[];
  for(const p of snapshot.items||[]){
    const pid=+p.player_id,teamId=+p.team_id,g=profileGate(p),candidate=evaluateV38CandidateRules(p);
    for(const meta of playedGamesForProfile(p,snapshot,playedByGame)){
      const gamePk=+meta.gamePk,selected=selectLatestPregameContext(contextSnapshots,gamePk,meta.start_time),gctx=selected?contextForGame(selected,gamePk):null,market=gctx?.market_rows?.find(x=>+x.player_id===pid)||null,lineup=gctx?.lineup_rows?.find(x=>+x.player_id===pid)||null,matchup=hitterMatchupForGame(meta,gctx,teamId);
      const context=selected?{snapshot_sha256:selected.sha256||null,captured_at:selected.captured_at,age_minutes:+((Date.parse(meta.start_time)-Date.parse(selected.captured_at))/60000).toFixed(1),confirmed_lineup:!!(lineup&&Number(lineup.lineup)>=1&&Number(lineup.lineup)<=9),lineup:lineup?.lineup??null,market}:null;
      let row={row_identity:V38_POSTGAME_GAME_IDENTITY.row_identity,player_id:pid,player:p.player||null,team_id:teamId,gamePk,start_time:meta.start_time,matchup,homer:hrByGame.get(gamePk)?.has(pid)||false,profile_complete:profileComplete(p),ev:p.ev??null,hh:p.hh??p.hard_hit??null,barrel:p.barrel??null,iso:p.iso??null,pullair:p.pullair??p.pull_air??null,blast:p.blast??p.blast_swing??p.blasts_swing??null,sweet:p.sweet??p.sweet_spot??null,longshot_profile:g.longshot_profile,foundation_boost:g.foundation_boost,profile_pass:g.pass,profile_score:candidatePowerScore(p),gate_count:candidate.gate_count,gate_passes:candidate.passes,candidate_rules:candidate.rules,context};
      row=attachProspectiveModifierBands(row,modifierSets,{date:snapshot.date,gamePk,startTime:meta.start_time,matchup});rows.push(row);
    }
  }
  const completeRows=rows.filter(r=>r.profile_complete),summary=summarizeReplay(completeRows),baseHr=completeRows.filter(r=>r.homer).length,baseRate=completeRows.length?baseHr/completeRows.length:0,bands=[0,20,30,40,50,60,70,80,101].slice(0,-1).map((lo,i)=>{const hi=[20,30,40,50,60,70,80,101][i],a=completeRows.filter(r=>r.profile_score>=lo&&r.profile_score<hi),h=a.filter(r=>r.homer).length;return{band:`${lo}-${hi===101?'100':hi-0.01}`,n:a.length,hr:h,hr_rate:a.length?+(100*h/a.length).toFixed(2):null}});
  const candidateRuleResults=Object.keys(V38_CANDIDATE_RULES).map(rule=>{const qualified=completeRows.filter(r=>r.candidate_rules?.[rule]===true),hr=qualified.filter(r=>r.homer).length,nonHrQualified=qualified.length-hr,totalNonHr=completeRows.length-baseHr;return{rule,qualified:qualified.length,qualified_share:completeRows.length?+(100*qualified.length/completeRows.length).toFixed(2):null,hr,hr_rate:qualified.length?+(100*hr/qualified.length).toFixed(2):null,hr_capture:baseHr?+(100*hr/baseHr).toFixed(2):null,non_hr_qualified:nonHrQualified,non_hr_qualification_rate:totalNonHr?+(100*nonHrQualified/totalNonHr).toFixed(2):null,lift_vs_base:qualified.length&&baseRate?+((hr/qualified.length)/baseRate).toFixed(3):null}});
  const contextCoverage={snapshots_loaded:contextSnapshots.length,rows_with_context:completeRows.filter(r=>r.context).length,rows_with_confirmed_lineup:completeRows.filter(r=>r.context?.confirmed_lineup).length,rows_with_market:completeRows.filter(r=>r.context?.market).length,steam_rows:completeRows.filter(r=>r.context?.market?.signal==='STEAM').length,line_lengthened_rows:completeRows.filter(r=>r.context?.market?.signal==='LINE_LENGTHENED').length};
  const contextConvergenceResults=evaluateContextConvergence(completeRows),modifier_coverage=prospectiveModifierCoverage(completeRows,modifierSets),baseball_convergence_results=evaluateBaseballConvergence(completeRows);
  const out={evaluation_protocol:EVAL_PROTOCOL,snapshot_protocol:snapshot.snapshot_protocol,snapshot_sha256:snapshot.sha256,date:snapshot.date,captured_at:snapshot.captured_at,row_identity:V38_POSTGAME_GAME_IDENTITY.row_identity,doubleheader_safe:V38_POSTGAME_GAME_IDENTITY.doubleheader_safe,point_in_time:true,qualifying_backtest:true,prospective_validation:true,modifier_selection_rule:'latest valid artifact strictly before each game start and containing that exact game',research_only:true,scoring_enabled:false,scoring_eligible:false,model_scoring_changed:false,status:'FINAL',eligible_games:[...eligibleGames].length,final_games:gameStates.length,played_profiled_hitters:rows.length,played_profiled_player_games:rows.length,complete_profiled_hitters:completeRows.length,complete_profiled_player_games:completeRows.length,incomplete_profiled_hitters:rows.length-completeRows.length,unique_hr_hitters:hrIds.size,complete_profile_hr_hitters:baseHr,complete_profile_hr_player_games:baseHr,base_hr_rate:completeRows.length?+(100*baseRate).toFixed(2):null,summary,score_bands:bands,candidate_rule_results:candidateRuleResults,context_coverage:contextCoverage,context_convergence_results:contextConvergenceResults,modifier_coverage,baseball_convergence_results,rows};
  const outPath=path.replace(/\.json$/,'-evaluated.json');await fs.writeFile(outPath,JSON.stringify(out,null,2)+'\n');console.log(`V38_EVAL_PATH=${outPath}`);console.log(`V38_EVAL_SUMMARY=${JSON.stringify({evaluation_protocol:out.evaluation_protocol,date:out.date,row_identity:out.row_identity,doubleheader_safe:out.doubleheader_safe,eligible_games:out.eligible_games,played_profiled_hitters:out.played_profiled_hitters,complete_profiled_hitters:out.complete_profiled_hitters,incomplete_profiled_hitters:out.incomplete_profiled_hitters,unique_hr_hitters:out.unique_hr_hitters,base_hr_rate:out.base_hr_rate,context_coverage:out.context_coverage,modifier_coverage:out.modifier_coverage,candidate_rule_results:out.candidate_rule_results,context_convergence_results:out.context_convergence_results,baseball_convergence_results:out.baseball_convergence_results})}`);
}
