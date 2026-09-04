import fs from 'node:fs/promises';

const INDEX='dist/index.html';
const ICON_180_SRC='pwa/bandalytics-icon-180.png';
const ICON_180_DST='dist/pwa/bandalytics-icon-180.png';
const ICON_192_SRC='pwa/bandalytics-icon-192.png';
const ICON_192_DST='dist/pwa/bandalytics-icon-192.png';
const POLICY_UI_SRC='v38-site-policy-ui.js';
const POLICY_UI_DST='dist/v38-site-policy-ui.js';
const CLEAN_UI_SRC='v38-clean-research-ui.js';
const CLEAN_UI_DST='dist/v38-clean-research-ui.js';
const MANIFEST='dist/manifest.webmanifest';
const CLEAN_UI_VERSION='v15';

await fs.mkdir('dist/pwa',{recursive:true});
await Promise.all([
  fs.copyFile(ICON_180_SRC,ICON_180_DST),
  fs.copyFile(ICON_192_SRC,ICON_192_DST),
  fs.copyFile(POLICY_UI_SRC,POLICY_UI_DST),
  fs.copyFile(CLEAN_UI_SRC,CLEAN_UI_DST)
]);

const manifest={
  name:'BANDALYTICS',
  short_name:'BANDALYTICS',
  description:'BANDALYTICS multi-sport research and analytics',
  start_url:'/',
  scope:'/',
  display:'standalone',
  background_color:'#05070a',
  theme_color:'#05070a',
  icons:[
    {src:'/pwa/bandalytics-icon-180.png',sizes:'180x180',type:'image/png',purpose:'any'},
    {src:'/pwa/bandalytics-icon-192.png',sizes:'192x192',type:'image/png',purpose:'any maskable'}
  ]
};
await fs.writeFile(MANIFEST,JSON.stringify(manifest,null,2)+'\n');

let html=await fs.readFile(INDEX,'utf8');
if(!html.includes('</head>')||!html.includes('</body>'))throw new Error('PWA injection failed: document markers not found');
html=html.replace(/<title>[^<]*<\/title>/,'<title>BANDALYTICS</title>');

// Public presentation cleanup happens in the built shell, before any runtime script executes.
// Keep engineering capabilities behind the scenes without exposing them in the normal app.
html=html.replaceAll('MODEL V37 • LOCKED','');
html=html.replaceAll('Tonight HR Score v37','Tonight HR Score');

// Keep the old shell's #file/#msg hooks alive so its bootstrap cannot throw, but make them
// permanently invisible in the automated interface. Historical/admin importer code stays
// available behind the scenes without exposing a manual ZIP requirement to normal users.
const compatUpload='<div class="upload" data-legacy-import-compat hidden aria-hidden="true" style="display:none!important"><input id="file" type="file" accept=".zip,.csv" tabindex="-1"></div>';
const compatMsg='<div id="msg" class="msg" data-legacy-import-compat hidden aria-hidden="true" style="display:none!important"></div>';
html=html.replace(/<div class="upload"><input id="file"[^>]*><\/div>/,compatUpload);
html=html.replace(/<div id="msg" class="msg">Waiting for ZIP\.<\/div>/,compatMsg);

const criticalUi='<style id="bandalytics-public-critical">[data-legacy-import-compat]{display:none!important}#v38ResearchPolicy{display:none!important}#tabs button[data-m="direct"],#tabs button[data-m="identity"],#tabs button[data-m="raw"],#tabs button[data-m="coverage"],#tabs button[data-m="calibration"],#tabs button[data-m="snapshot"],#tabs button[data-m="final"],#tabs button[data-m="daily"]{display:none!important}</style>';
if(!html.includes('bandalytics-public-critical'))html=html.replace('</head>',criticalUi+'</head>');

const tags=[
  '<link rel="manifest" href="/manifest.webmanifest">',
  '<link rel="icon" type="image/png" sizes="192x192" href="/pwa/bandalytics-icon-192.png">',
  '<link rel="apple-touch-icon" sizes="180x180" href="/pwa/bandalytics-icon-180.png">',
  '<meta name="apple-mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">',
  '<meta name="apple-mobile-web-app-title" content="BANDALYTICS">',
  '<meta name="mobile-web-app-capable" content="yes">',
  '<meta name="application-name" content="BANDALYTICS">',
  '<meta name="theme-color" content="#05070a">'
].join('');
if(!html.includes('apple-mobile-web-app-capable'))html=html.replace('</head>',tags+'</head>');
if(!html.includes('/v38-site-policy-ui.js'))html=html.replace('</body>','<script src="/v38-site-policy-ui.js?v=15"></script></body>');
if(!html.includes('/v38-clean-research-ui.js'))html=html.replace('</body>',`<script src="/v38-clean-research-ui.js?${CLEAN_UI_VERSION}"></script></body>`);
await fs.writeFile(INDEX,html);

const verify=await fs.readFile(INDEX,'utf8');
for(const marker of ['manifest.webmanifest','bandalytics-icon-192.png','apple-touch-icon','apple-mobile-web-app-capable','apple-mobile-web-app-title','/v38-site-policy-ui.js?v=15','/v38-clean-research-ui.js?v15','bandalytics-public-critical','data-legacy-import-compat','id="file" type="file"','id="msg" class="msg"']){
  if(!verify.includes(marker))throw new Error('PWA/site marker missing: '+marker);
}
for(const forbidden of ['Waiting for ZIP.','MODEL V37 • LOCKED','Tonight HR Score v37']){
  if(verify.includes(forbidden))throw new Error('Public UI copy leaked into production shell: '+forbidden);
}
console.log('BANDALYTICS MULTI-SPORT PWA + V38 CLEAN RESEARCH UI PASS');
