import fs from 'node:fs';
import {evaluateLongshot700} from '../mlb-hr-locked-policy.mjs';
import {buildPitchfitBands} from '../v38-pitchfit-bands.mjs';
import {buildBbeBands} from '../v38-bbe-bands.mjs';

const [profilePath,contextPath,pitchfitPath,bbePath]=process.argv.slice(2);
if(!profilePath||!contextPath||!pitchfitPath||!bbePath) throw new Error('Usage: node scripts/evaluate-v38-longshot-market-funnel.mjs <profile.json> <context.json> <pitchfit.json> <bbe.json>');
const profile=JSON.parse(fs.readFileSync(profilePath,'utf8'));
const context=JSON.parse(fs.readFileSync(contextPath,'utf8'));
const pitchfit=JSON.parse(fs.readFileSync(pitchfitPath,'utf8'));
const bbe=JSON.parse(fs.readFileSync(bbePath,'utf8'));
if(profile.snapshot_protocol!=='V38_PREGAME_SNAPSHOT_V1'||profile.research_only!==true||profile.scoring_enabled!==false) throw new Error('Invalid profile snapshot');
if(context.context_protocol!=='V38_CONTEXT_SNAPSHOT_V1'||context.point_in_time!==true||context.research_only!==true||context.scoring_enabled!==false) throw new Error('Invalid context snapshot');
if(pitchfit.protocol!=='V38_PITCHFIT_DISTRIBUTION_V1'||pitchfit.as_of_verified!==true||pitchfit.research_only!==true) throw new Error('Invalid pitchfit artifact');
if(bbe.protocol!=='V38_RECENT_BBE_DISTRIBUTION_V1'||bbe.as_of_verified!==true||bbe.research_only!==true) throw new Error('Invalid BBE artifact');
if(new Set([profile.date,context.date,pitchfit.date,bbe.date]).size!==1) throw new Error('Artifact dates do not match');

const pById=new Map((profile.items||[]).map(x=>[Number(x.player_id),x]));
const pfById=new Map((pitchfit.rows||[]).map(x=>[Number(x.player_id),x]));
const bById=new Map((bbe.rows||[]).map(x=>[Number(x.player_id),x]));
const pfBands=buildPitchfitBands(pitchfit.rows||[]), bBands=buildBbeBands(bbe.rows||[]);
const rows=[];
for(const m of context.market_rows||[]){
  const id=Number(m.player_id),p=pById.get(id); if(!p) continue;
  const policy=evaluateLongshot700(p,m.best_odds);
  if(!policy.applicable) continue;
  const pf=pfById.get(id), br=bById.get(id), pfb=pfBands.classify(pf), bbb=bBands.classify(br);
  rows.push({player_id:id,player:m.player,team:m.team,odds:m.best_odds,signal:m.signal,pass_count:policy.pass_count,eligible_4of6:policy.qualifies,iso_pass:!!policy.passes.iso,quality_4of6_iso:policy.qualifies&&policy.passes.iso,protected_5of6:policy.stronger_5of6,pitchfit_band:pfb,pitchfit_score:pf?.fit_score??null,bbe_eligible:bbb.eligible,bbe_hrshape_band:bbb.hrshape_band,bbe_hrshape:br?.bbe?.hrshape??null});
}
const stage=(name,fn)=>{const a=rows.filter(fn);return{name,n:a.length,steam:a.filter(x=>x.signal==='STEAM').length,line_lengthened:a.filter(x=>x.signal==='LINE_LENGTHENED').length,players:a.map(x=>({player_id:x.player_id,player:x.player,team:x.team,odds:x.odds,signal:x.signal,pass_count:x.pass_count,pitchfit_band:x.pitchfit_band,bbe_hrshape_band:x.bbe_hrshape_band}))}};
const stages=[
 stage('market_700_plus',()=>true),
 stage('locked_4of6',x=>x.eligible_4of6),
 stage('quality_4of6_iso',x=>x.quality_4of6_iso),
 stage('protected_5of6',x=>x.protected_5of6),
 stage('quality_iso_plus_pitchfit_top_quartile',x=>x.quality_4of6_iso&&(x.pitchfit_band==='TOP_QUARTILE'||x.pitchfit_band==='TOP_DECILE')),
 stage('quality_iso_plus_bbe_top_quartile',x=>x.quality_4of6_iso&&x.bbe_eligible&&(x.bbe_hrshape_band==='TOP_QUARTILE'||x.bbe_hrshape_band==='TOP_DECILE'))
];
const out={protocol:'V38_LONGSHOT_MARKET_FUNNEL_V1',date:profile.date,profile_captured_at:profile.captured_at,context_captured_at:context.captured_at,research_only:true,scoring_enabled:false,scoring_eligible:false,model_scoring_changed:false,actual_market_odds_linked:true,outcome_evaluated:false,warning:'This is a prospective candidate funnel, not an outcome or ROI backtest. Empty premium tiers must remain empty; do not weaken gates to force candidates.',pitchfit_p75:pfBands.p75,bbe_hrshape_p75:bBands.hrshape_p75,stages};
console.log(JSON.stringify(out,null,2));
