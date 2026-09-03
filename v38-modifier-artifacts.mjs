import fs from'node:fs/promises';
import path from'node:path';
import crypto from'node:crypto';
import{buildPitchfitBands}from'./v38-pitchfit-bands.mjs';
import{buildBbeBands}from'./v38-bbe-bands.mjs';
import{selectLatestProspectiveModifier,rowForGamePlayer}from'./v38-prospective-modifier-selector.mjs';

const EXACT_GAME_IDENTITY_FROM='2026-09-03';
async function jsonFiles(root){if(!root)return[];const out=[];async function walk(p){let es;try{es=await fs.readdir(p,{withFileTypes:true})}catch{return}for(const e of es){const q=path.join(p,e.name);if(e.isDirectory())await walk(q);else if(e.isFile()&&e.name.endsWith('.json'))out.push(q)}}await walk(root);return out}
function validSha(s){return typeof s==='string'&&/^[a-f0-9]{64}$/.test(s)}
function requiresExactGameIdentity(z){return typeof z?.date==='string'&&z.date>=EXACT_GAME_IDENTITY_FROM}
function exactGameIdentityValid(z){if(z.row_identity!=='GAMEPK_PLAYER_ID')return false;const games=new Set((z.pregame_game_pks||[]).map(Number));return z.rows.every(r=>Number.isInteger(+r.gamePk)&&Number.isInteger(+r.player_id)&&(!z.prospective_pregame_only||games.has(+r.gamePk)))}
export function validModifierArtifact(z,{date=null,protocol=null}={}){
  if(!z||typeof z!=='object')return false;
  if(date&&z.date!==date)return false;
  if(protocol&&z.protocol!==protocol)return false;
  if(!['V38_PITCHFIT_DISTRIBUTION_V1','V38_RECENT_BBE_DISTRIBUTION_V1'].includes(z.protocol))return false;
  if(z.research_only!==true||z.scoring_enabled!==false||z.scoring_eligible!==false||z.model_scoring_changed!==false||z.as_of_verified!==true)return false;
  if(!Array.isArray(z.pregame_game_pks)||!Array.isArray(z.rows))return false;
  const captured=Date.parse(z.captured_at);if(!Number.isFinite(captured))return false;
  if(z.prospective_pregame_only===true&&!z.pregame_game_pks.every(Number.isInteger))return false;
  if(requiresExactGameIdentity(z)&&!exactGameIdentityValid(z))return false;
  if(z.protocol==='V38_PITCHFIT_DISTRIBUTION_V1'&&Number(z.fit_rows)!==z.rows.length)return false;
  if(z.protocol==='V38_RECENT_BBE_DISTRIBUTION_V1'&&Number(z.summary_rows)!==z.rows.length)return false;
  if(!validSha(z.sha256))return false;
  const expected=z.sha256,{sha256,...body}=z,calc=crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
  return calc===expected;
}
async function loadMany(root,date,protocol){const files=await jsonFiles(root),out=[];for(const f of files){try{const z=JSON.parse(await fs.readFile(f,'utf8'));if(validModifierArtifact(z,{date,protocol}))out.push(z)}catch{}}return out.sort((a,b)=>Date.parse(a.captured_at||0)-Date.parse(b.captured_at||0));}
async function loadOne(root,date,protocol){const a=await loadMany(root,date,protocol);return a[a.length-1]||null}
export async function loadModifierArtifactSets(root,date){const[pitchfitArtifacts,bbeArtifacts]=await Promise.all([loadMany(root,date,'V38_PITCHFIT_DISTRIBUTION_V1'),loadMany(root,date,'V38_RECENT_BBE_DISTRIBUTION_V1')]);return{pitchfitArtifacts,bbeArtifacts};}
export async function loadModifierArtifacts(root,date){const[pitchfit,bbe]=await Promise.all([loadOne(root,date,'V38_PITCHFIT_DISTRIBUTION_V1'),loadOne(root,date,'V38_RECENT_BBE_DISTRIBUTION_V1')]);const pitchfitBands=buildPitchfitBands(pitchfit?.rows||[]),bbeBands=buildBbeBands(bbe?.rows||[]),pitchfitById=new Map((pitchfit?.rows||[]).map(r=>[+r.player_id,r])),bbeById=new Map((bbe?.rows||[]).map(r=>[+r.player_id,r]));return{pitchfit,bbe,pitchfitBands,bbeBands,pitchfitById,bbeById};}
export function attachModifierBands(row,mods){const pid=+row.player_id,p=mods?.pitchfitById?.get(pid)||null,b=mods?.bbeById?.get(pid)||null;return{...row,pitchfit:p,pitchfit_band:mods?.pitchfitBands?.classify(p)||'INELIGIBLE',bbe:b,bbe_band:mods?.bbeBands?.classify(b)||{eligible:false,hrshape_band:'INELIGIBLE',contact_high:false,rising:false}};}
export function attachProspectiveModifierBands(row,sets,{date,gamePk,startTime,matchup}={}){const pArt=selectLatestProspectiveModifier(sets?.pitchfitArtifacts||[],{date,gamePk,startTime,type:'pitchfit'}),bArt=selectLatestProspectiveModifier(sets?.bbeArtifacts||[],{date,gamePk,startTime,type:'bbe'}),p=rowForGamePlayer(pArt,{gamePk,playerId:row.player_id,matchup}),b=rowForGamePlayer(bArt,{gamePk,playerId:row.player_id,matchup}),pBands=buildPitchfitBands(pArt?.rows||[]),bBands=buildBbeBands(bArt?.rows||[]),pitchfitVerified=!!pArt&&!!p,bbeVerified=!!bArt&&!!b,anyVerified=pitchfitVerified||bbeVerified;return{...row,pitchfit:p,pitchfit_band:pBands.classify(p),bbe:b,bbe_band:bBands.classify(b),modifier_evidence:{pitchfit_captured_at:pArt?.captured_at||null,pitchfit_snapshot_sha256:pArt?.sha256||null,pitchfit_cryptographically_verified:pitchfitVerified,bbe_captured_at:bArt?.captured_at||null,bbe_snapshot_sha256:bArt?.sha256||null,bbe_cryptographically_verified:bbeVerified,pitchfit_population:pBands.population||0,bbe_population:bBands.population||0,cryptographically_verified:anyVerified,per_game_strictly_pregame:true,exact_game_identity_required:date>=EXACT_GAME_IDENTITY_FROM}};}
export function modifierCoverage(rows=[],mods){return{pitchfit_artifact_loaded:!!mods?.pitchfit,bbe_artifact_loaded:!!mods?.bbe,pitchfit_captured_at:mods?.pitchfit?.captured_at||null,bbe_captured_at:mods?.bbe?.captured_at||null,pitchfit_capture_mode:mods?.pitchfit?.capture_mode||null,bbe_capture_mode:mods?.bbe?.capture_mode||null,pitchfit_band_population:mods?.pitchfitBands?.population||0,bbe_band_population:mods?.bbeBands?.population||0,rows_with_true_pitchfit:rows.filter(r=>r.pitchfit?.fit_status==='TRUE').length,rows_with_full_bbe:rows.filter(r=>+r.bbe?.tracked_bbe>=15).length,rows_pitchfit_top_quartile:rows.filter(r=>['TOP_QUARTILE','TOP_DECILE'].includes(r.pitchfit_band)).length,rows_bbe_hrshape_top_quartile:rows.filter(r=>['TOP_QUARTILE','TOP_DECILE'].includes(r.bbe_band?.hrshape_band)).length};}
export function prospectiveModifierCoverage(rows=[],sets={}){return{pitchfit_artifacts_loaded:(sets.pitchfitArtifacts||[]).length,bbe_artifacts_loaded:(sets.bbeArtifacts||[]).length,rows_with_true_pitchfit:rows.filter(r=>r.pitchfit?.fit_status==='TRUE').length,rows_with_full_bbe:rows.filter(r=>+r.bbe?.tracked_bbe>=15).length,rows_pitchfit_top_quartile:rows.filter(r=>['TOP_QUARTILE','TOP_DECILE'].includes(r.pitchfit_band)).length,rows_bbe_hrshape_top_quartile:rows.filter(r=>['TOP_QUARTILE','TOP_DECILE'].includes(r.bbe_band?.hrshape_band)).length,rows_with_verified_pitchfit_evidence:rows.filter(r=>r.modifier_evidence?.pitchfit_cryptographically_verified===true).length,rows_with_verified_bbe_evidence:rows.filter(r=>r.modifier_evidence?.bbe_cryptographically_verified===true).length,rows_with_verified_modifier_evidence:rows.filter(r=>r.modifier_evidence?.cryptographically_verified===true).length,rows_with_per_game_modifier_evidence:rows.filter(r=>r.modifier_evidence?.per_game_strictly_pregame===true).length};}
export const V38_MODIFIER_ARTIFACT_POLICY=Object.freeze({protocol:'V38_MODIFIER_ARTIFACT_POLICY_V1',exact_game_identity_from:EXACT_GAME_IDENTITY_FROM,row_identity:'GAMEPK_PLAYER_ID',research_only:true,scoring_enabled:false});
