import fs from 'node:fs/promises';

const INDEX='dist/index.html';
const ICON_SRC='pwa/bandalytics-icon-180.png';
const ICON_DST='dist/pwa/bandalytics-icon-180.png';
const MANIFEST='dist/manifest.webmanifest';

await fs.mkdir('dist/pwa',{recursive:true});
await fs.copyFile(ICON_SRC,ICON_DST);

const manifest={
  name:'BANDALYTICS',
  short_name:'BANDALYTICS',
  start_url:'/',
  scope:'/',
  display:'standalone',
  background_color:'#05070a',
  theme_color:'#05070a',
  icons:[
    {src:'/pwa/bandalytics-icon-180.png',sizes:'180x180',type:'image/png',purpose:'any maskable'}
  ]
};
await fs.writeFile(MANIFEST,JSON.stringify(manifest,null,2)+'\n');

let html=await fs.readFile(INDEX,'utf8');
if(!html.includes('</head>'))throw new Error('PWA injection failed: </head> not found');
html=html.replace(/<title>[^<]*<\/title>/,'<title>BANDALYTICS</title>');
const tags=[
  '<link rel="manifest" href="/manifest.webmanifest">',
  '<link rel="apple-touch-icon" sizes="180x180" href="/pwa/bandalytics-icon-180.png">',
  '<meta name="apple-mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">',
  '<meta name="apple-mobile-web-app-title" content="BANDALYTICS">',
  '<meta name="mobile-web-app-capable" content="yes">',
  '<meta name="theme-color" content="#05070a">'
].join('');
if(!html.includes('apple-mobile-web-app-capable'))html=html.replace('</head>',tags+'</head>');
await fs.writeFile(INDEX,html);

const verify=await fs.readFile(INDEX,'utf8');
for(const marker of ['manifest.webmanifest','apple-touch-icon','apple-mobile-web-app-capable','apple-mobile-web-app-title']){
  if(!verify.includes(marker))throw new Error('PWA marker missing: '+marker);
}
console.log('BANDALYTICS PWA HOME SCREEN PASS');
