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
const DASHBOARD_SRC='bandalytics-dashboard-shell.js';
const DASHBOARD_DST='dist/bandalytics-dashboard-shell.js';
const DASHBOARD_GUARD_SRC='bandalytics-dashboard-guard.js';
const DASHBOARD_GUARD_DST='dist/bandalytics-dashboard-guard.js';
const PROSPECTIVE_TRACKER_SRC='bandalytics-prospective-profile-tracker.js';
const PROSPECTIVE_TRACKER_DST='dist/bandalytics-prospective-profile-tracker.js';
const GAME_FIRST_UI_SRC='bandalytics-game-first-ui.js';
const GAME_FIRST_UI_DST='dist/bandalytics-game-first-ui.js';
const GAME_FIRST_CSS_SRC='bandalytics-game-first-ui.css';
const GAME_FIRST_CSS_DST='dist/bandalytics-game-first-ui.css';
const MOBILE_SCROLL_CSS_SRC='bandalytics-mobile-scroll-fix.css';
const MOBILE_SCROLL_CSS_DST='dist/bandalytics-mobile-scroll-fix.css';
const POLISH_CSS_SRC='bandalytics-polish.css';
const POLISH_CSS_DST='dist/bandalytics-polish.css';
const HISTORY_RECOVERY_SRC='bandalytics-history-recovery.js';
const HISTORY_RECOVERY_DST='dist/bandalytics-history-recovery.js';
const MANIFEST='dist/manifest.webmanifest';
const CLEAN_UI_VERSION='v26';
const PROSPECTIVE_TRACKER_VERSION='v3';
const GAME_FIRST_UI_VERSION='v2';
const GAME_FIRST_CSS_VERSION='v2';
const MOBILE_SCROLL_CSS_VERSION='v2';
const POLISH_VERSION='v26';

await fs.mkdir('dist/pwa',{recursive:true});
await Promise.all([
  fs.copyFile(ICON_180_SRC,ICON_180_DST),
  fs.copyFile(ICON_192_SRC,ICON_192_DST),
  fs.copyFile(POLICY_UI_SRC,POLICY_UI_DST),
  fs.copyFile(CLEAN_UI_SRC,CLEAN_UI_DST),
  fs.copyFile(DASHBOARD_SRC,DASHBOARD_DST),
  fs.copyFile(DASHBOARD_GUARD_SRC,DASHBOARD_GUARD_DST),
  fs.copyFile(PROSPECTIVE_TRACKER_SRC,PROSPECTIVE_TRACKER_DST),
  fs.copyFile(GAME_FIRST_UI_SRC,GAME_FIRST_UI_DST),
  fs.copyFile(GAME_FIRST_CSS_SRC,GAME_FIRST_CSS_DST),
  fs.copyFile(MOBILE_SCROLL_CSS_SRC,MOBILE_SCROLL_CSS_DST),
  fs.copyFile(POLISH_CSS_SRC,POLISH_CSS_DST),
  fs.copyFile(HISTORY_RECOVERY_SRC,HISTORY_RECOVERY_DST)
]);

const manifest={name:'BANDALYTICS',short_name:'BANDALYTICS',description:'BANDALYTICS multi-sport research and analytics',start_url:'/',scope:'/',display:'standalone',background_color:'#05070a',theme_color:'#05070a',icons:[{src:'/pwa/bandalytics-icon-180.png',sizes:'180x180',type:'image/png',purpose:'any'},{src:'/pwa/bandalytics-icon-192.png',sizes:'192x192',type:'image/png',purpose:'any maskable'}]};
await fs.writeFile(MANIFEST,JSON.stringify(manifest,null,2)+'\n');

let html=await fs.readFile(INDEX,'utf8');
if(!html.includes('</head>')||!html.includes('</body>'))throw new Error('PWA injection failed: document markers not found');
html=html.replace(/<title>[^<]*<\/title>/,'<title>BANDALYTICS</title>');
html=html.replace(/MODEL\s+v37\s*•\s*LOCKED/gi,'');
html=html.replace(/Tonight HR Score v37/gi,'Tonight HR Score');
const compatUpload='<div class="upload" data-legacy-import-compat hidden aria-hidden="true" style="display:none!important"><input id="file" type="file" accept=".zip,.csv" tabindex="-1"></div>';
const compatMsg='<div id="msg" class="msg" data-legacy-import-compat hidden aria-hidden="true" style="display:none!important"></div>';
html=html.replace(/<div class="upload"><input id="file"[^>]*><\/div>/,compatUpload);
html=html.replace(/<div id="msg" class="msg">Waiting for ZIP\.<\/div>/,compatMsg);
const criticalUi='<style id="bandalytics-public-critical">[data-legacy-import-compat],#v38ResearchPolicy,#bSourceRail,#bDirectBtn,#bDirectShade,#bDirectPanel{display:none!important}#tabs button[data-m="direct"],#tabs button[data-m="identity"],#tabs button[data-m="raw"],#tabs button[data-m="coverage"],#tabs button[data-m="calibration"],#tabs button[data-m="snapshot"],#tabs button[data-m="final"],#tabs button[data-m="daily"]{display:none!important}</style>';
if(!html.includes('bandalytics-public-critical'))html=html.replace('</head>',criticalUi+'</head>');
const tags=['<link rel="manifest" href="/manifest.webmanifest">',`<link rel="stylesheet" href="/bandalytics-polish.css?${POLISH_VERSION}">`,`<link rel="stylesheet" href="/bandalytics-game-first-ui.css?${GAME_FIRST_CSS_VERSION}">`,`<link rel="stylesheet" href="/bandalytics-mobile-scroll-fix.css?${MOBILE_SCROLL_CSS_VERSION}">`,'<link rel="icon" type="image/png" sizes="192x192" href="/pwa/bandalytics-icon-192.png">','<link rel="apple-touch-icon" sizes="180x180" href="/pwa/bandalytics-icon-180.png">','<meta name="apple-mobile-web-app-capable" content="yes">','<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">','<meta name="apple-mobile-web-app-title" content="BANDALYTICS">','<meta name="mobile-web-app-capable" content="yes">','<meta name="application-name" content="BANDALYTICS">','<meta name="theme-color" content="#05070a">'].join('');
if(!html.includes('apple-mobile-web-app-capable'))html=html.replace('</head>',tags+'</head>');
if(!html.includes('/v38-site-policy-ui.js'))html=html.replace('</body>','<script src="/v38-site-policy-ui.js?v=25"></script></body>');
if(!html.includes('/v38-clean-research-ui.js'))html=html.replace('</body>',`<script src="/v38-clean-research-ui.js?${CLEAN_UI_VERSION}"></script></body>`);
if(!html.includes('/bandalytics-dashboard-shell.js'))html=html.replace('</body>','<script src="/bandalytics-dashboard-shell.js?v=25"></script></body>');
if(!html.includes('/bandalytics-dashboard-guard.js'))html=html.replace('</body>','<script src="/bandalytics-dashboard-guard.js?v=1"></script></body>');
if(!html.includes('/bandalytics-prospective-profile-tracker.js'))html=html.replace('</body>',`<script src="/bandalytics-prospective-profile-tracker.js?${PROSPECTIVE_TRACKER_VERSION}"></script></body>`);
if(!html.includes('/bandalytics-game-first-ui.js'))html=html.replace('</body>',`<script src="/bandalytics-game-first-ui.js?${GAME_FIRST_UI_VERSION}"></script></body>`);
if(!html.includes('/bandalytics-history-recovery.js'))html=html.replace('</body>','<script src="/bandalytics-history-recovery.js?v=1"></script></body>');
await fs.writeFile(INDEX,html);
const verify=await fs.readFile(INDEX,'utf8');
for(const marker of ['manifest.webmanifest','bandalytics-icon-192.png','apple-touch-icon','apple-mobile-web-app-capable','apple-mobile-web-app-title','/bandalytics-polish.css?v26','/bandalytics-game-first-ui.css?v2','/bandalytics-mobile-scroll-fix.css?v2','/v38-site-policy-ui.js?v=25','/v38-clean-research-ui.js?v26','/bandalytics-dashboard-shell.js?v=25','/bandalytics-dashboard-guard.js?v=1','/bandalytics-prospective-profile-tracker.js?v3','/bandalytics-game-first-ui.js?v2','/bandalytics-history-recovery.js?v=1','bandalytics-public-critical','#bSourceRail','#bDirectBtn','#bDirectShade','#bDirectPanel','data-legacy-import-compat','id="file" type="file"','id="msg" class="msg"'])if(!verify.includes(marker))throw new Error('PWA/site marker missing: '+marker);
for(const forbidden of ['Waiting for ZIP.','Tonight HR Score v37','/bandalytics-prospective-report.js'])if(verify.includes(forbidden))throw new Error('Public UI copy/schema leak: '+forbidden);
if(/MODEL\s+v37\s*•\s*LOCKED/i.test(verify))throw new Error('Public UI copy leaked into production shell: MODEL v37 • LOCKED');
console.log('BANDALYTICS GAME-FIRST V2 + CORRECTED PROSPECTIVE TRACKER PASS');