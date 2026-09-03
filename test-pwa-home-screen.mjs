import fs from 'node:fs';

function pngSize(path){
  const b=fs.readFileSync(path);
  if(b.length<24||b.toString('hex',0,8)!=='89504e470d0a1a0a')throw Error(`${path} is not PNG`);
  return {width:b.readUInt32BE(16),height:b.readUInt32BE(20)};
}

const injector=fs.readFileSync('pwa-inject.mjs','utf8');
const policyUi=fs.readFileSync('v38-site-policy-ui.js','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const i180=pngSize('pwa/bandalytics-icon-180.png');
const i192=pngSize('pwa/bandalytics-icon-192.png');

if(pkg.scripts?.build!=='node build.mjs && node pwa-inject.mjs')throw Error('PWA injector is not bound to production build');
for(const marker of [
  "name:'BANDALYTICS'",
  "short_name:'BANDALYTICS'",
  "display:'standalone'",
  'apple-mobile-web-app-capable',
  'apple-mobile-web-app-title',
  'apple-touch-icon',
  'bandalytics-icon-180.png',
  'bandalytics-icon-192.png',
  'BANDALYTICS multi-sport research and analytics',
  '/v38-site-policy-ui.js'
])if(!injector.includes(marker))throw Error(`PWA contract marker missing: ${marker}`);
for(const marker of ['V38 RESEARCH POOL','V38_POOL_SHORTLIST_V3','Legacy pool blocked','legacyFinalPoolDisabled:true','productionScoringChanged:false'])if(!policyUi.includes(marker))throw Error(`V38 site policy marker missing: ${marker}`);
if(i180.width!==180||i180.height!==180)throw Error(`Apple icon dimensions drifted: ${JSON.stringify(i180)}`);
if(i192.width!==192||i192.height!==192)throw Error(`PWA icon dimensions drifted: ${JSON.stringify(i192)}`);
console.log('BANDALYTICS_PWA_HOME_SCREEN_CONTRACT_PASS');
