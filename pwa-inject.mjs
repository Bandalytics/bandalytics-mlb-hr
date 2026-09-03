import fs from 'node:fs/promises';

const INDEX='dist/index.html';
const ICON_180_SRC='pwa/bandalytics-icon-180.png';
const ICON_180_DST='dist/pwa/bandalytics-icon-180.png';
const ICON_192_SRC='pwa/bandalytics-icon-192.png';
const ICON_192_DST='dist/pwa/bandalytics-icon-192.png';
const MANIFEST='dist/manifest.webmanifest';

await fs.mkdir('dist/pwa',{recursive:true});
await Promise.all([
  fs.copyFile(ICON_180_SRC,ICON_180_DST),
  fs.copyFile(ICON_192_SRC,ICON_192_DST)
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
if(!html.includes('</head>'))throw new Error('PWA injection failed: </head> not found');
html=html.replace(/<title>[^<]*<\/title>/,'<title>BANDALYTICS</title>');
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
await fs.writeFile(INDEX,html);

const verify=await fs.readFile(INDEX,'utf8');
for(const marker of ['manifest.webmanifest','bandalytics-icon-192.png','apple-touch-icon','apple-mobile-web-app-capable','apple-mobile-web-app-title']){
  if(!verify.includes(marker))throw new Error('PWA marker missing: '+marker);
}
console.log('BANDALYTICS MULTI-SPORT PWA HOME SCREEN PASS');
