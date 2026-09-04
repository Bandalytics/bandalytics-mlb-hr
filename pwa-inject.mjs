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

// The automated V38 app must never render the legacy manual-import prompt in the public shell.
// Keep the importer code available behind the scenes for historical/admin tooling, but remove
// the visible hero upload control and its "Waiting for ZIP" message before HTML ships.
html=html.replace(/<div class="upload"><input id="file"[^>]*><\/div>/,'');
html=html.replace(/<div id="msg" class="msg">Waiting for ZIP\.<\/div>/,'');

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
if(!html.includes('/v38-site-policy-ui.js'))html=html.replace('</body>','<script src="/v38-site-policy-ui.js"></script></body>');
if(!html.includes('/v38-clean-research-ui.js'))html=html.replace('</body>','<script src="/v38-clean-research-ui.js"></script></body>');
await fs.writeFile(INDEX,html);

const verify=await fs.readFile(INDEX,'utf8');
for(const marker of ['manifest.webmanifest','bandalytics-icon-192.png','apple-touch-icon','apple-mobile-web-app-capable','apple-mobile-web-app-title','/v38-site-policy-ui.js','/v38-clean-research-ui.js']){
  if(!verify.includes(marker))throw new Error('PWA/site marker missing: '+marker);
}
for(const legacy of ['Waiting for ZIP.','id="file" type="file" accept=".zip,.csv"']){
  if(verify.includes(legacy))throw new Error('Legacy manual-import UI leaked into production shell: '+legacy);
}
console.log('BANDALYTICS MULTI-SPORT PWA + V38 CLEAN RESEARCH UI PASS');
