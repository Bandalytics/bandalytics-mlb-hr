import fs from 'node:fs/promises';
import vm from 'node:vm';
const s=await fs.readFile('direct-research-ui.js','utf8');
new vm.Script(s,{filename:'direct-research-ui.js'});
const required=[
  'RESEARCH FLAG • ZERO v37 WRITE ACCESS',
  'scoring_enabled:false','model_scoring_changed:false',
  '/api/direct-preview?date=','/api/feed-status?date=','/api/research-status','/api/research-board?date=','/api/profile-native-qa?date=',
  'Progressive Profile Hydration','hydrateProfiles','hydrateIds','mergeProfiles',
  'generation:0','const generation=++state.generation','generation!==state.generation',
  'Automated Research Board','Vig','OPTIONAL_CROSS_CHECK_ONLY','longshot_700_required_passes','longshot_700_min_odds','pool_target_forced',
  '+700 rule applies only at +700 or longer','profile quality → pitch-fit primary → BBE support',
  'v37 remains frozen','Use ZIP Production','Research / Promotion Gates','Duplicate identity audit',
  'Loaded ZIP vs Direct Field Replay','BANDALYTICS_DIRECT_PARITY','ZIP parity replay:','different-date ZIP is never compared',
  'Preview date mismatch','Feed date mismatch','Board date mismatch','Board safety contract rejected','safeJSON(','aria-expanded',"e.key==='Escape'","document.body.style.overflow='hidden'"
];
for(const x of required)if(!s.includes(x))throw new Error('missing direct research marker '+x);
const forbidden=['buildFinalPool(','qualificationLane(','tonightScore(','confidenceScore(','P[','P =','P=','window.P','lockPool(','buildStructuredTickets('];
for(const x of forbidden)if(s.includes(x))throw new Error('research UI contains scoring/state hook '+x);
if(s.includes("toISOString().slice(0,10)"))throw new Error('Direct Lab must use browser-local slate date, not UTC date');
if(!s.includes('const localYmd='))throw new Error('Direct Lab local date helper missing');
for(const marker of ['env(safe-area-inset-bottom)','bottom:max(8px,env(safe-area-inset-bottom))'])if(!s.includes(marker))throw new Error('Direct Lab iPhone safe-area handling missing: '+marker);
if(!s.includes('MODEL v37 • LOCKED'))throw new Error('Frozen v37 model badge missing');
if(!s.includes('AUTO BOARD • RESEARCH ONLY'))throw new Error('Automated research-board badge missing');
console.log('DIRECT RESEARCH UI PASS');
