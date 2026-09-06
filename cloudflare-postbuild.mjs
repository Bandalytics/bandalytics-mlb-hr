import fs from 'node:fs/promises';

const headers = `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin

/
  Cache-Control: no-store

/mobile
  Cache-Control: no-store

/mobile/*
  Cache-Control: no-store

/bandalytics-mobile-v7.html
  Cache-Control: no-store

/bandalytics-mobile-option32.css
  Cache-Control: no-store

/bandalytics-mobile-option32-v3.css
  Cache-Control: no-store

/bandalytics-mobile-app-v4.css
  Cache-Control: no-store

/bandalytics-mobile-app-v5.css
  Cache-Control: no-store

/bandalytics-mobile-option32.js
  Cache-Control: no-store

/bandalytics-mobile-app-v4.js
  Cache-Control: no-store

/bandalytics-mobile-app-v5.js
  Cache-Control: no-store

/bandalytics-mobile-app-v7.js
  Cache-Control: no-store

/bandalytics-mobile-app-v9.css
  Cache-Control: no-store

/bandalytics-mobile-shell-v10.css
  Cache-Control: no-store

/bandalytics-mobile-shell-v10.js
  Cache-Control: no-store

/bandalytics-mobile-shell-v11.css
  Cache-Control: no-store

/bandalytics-mobile-shell-v12.css
  Cache-Control: no-store

/bandalytics-mobile-shell-v13.css
  Cache-Control: no-store

/bandalytics-mobile-shell-v14.css
  Cache-Control: no-store

/bandalytics-mobile-shell-v14.js
  Cache-Control: no-store

/bandalytics-mobile-shell-v15.css
  Cache-Control: no-store

/bandalytics-mobile-reference-v15.css
  Cache-Control: no-store

/bandalytics-mobile-reference-v15.js
  Cache-Control: no-store

/assets/*
  Cache-Control: public, max-age=31536000, immutable
`;

await fs.mkdir('dist/mobile', { recursive: true });
for (const file of [
  'bandalytics-mobile-option32.css',
  'bandalytics-mobile-option32-v3.css',
  'bandalytics-mobile-app-v4.css',
  'bandalytics-mobile-app-v5.css',
  'bandalytics-mobile-option32.js',
  'bandalytics-mobile-app-v4.js',
  'bandalytics-mobile-app-v5.js',
  'bandalytics-mobile-app-v7.js',
  'bandalytics-mobile-app-v9.css',
  'bandalytics-mobile-shell-v10.css',
  'bandalytics-mobile-shell-v10.js',
  'bandalytics-mobile-shell-v11.css',
  'bandalytics-mobile-shell-v12.css',
  'bandalytics-mobile-shell-v13.css',
  'bandalytics-mobile-shell-v14.css',
  'bandalytics-mobile-shell-v14.js',
  'bandalytics-mobile-shell-v15.css',
  'bandalytics-mobile-reference-v15.css',
  'bandalytics-mobile-reference-v15.js'
]) await fs.copyFile(file,`dist/${file}`);

const mobilePath='dist/mobile/index.html';
let html=await fs.readFile(mobilePath,'utf8');
const knownCss=['bandalytics-mobile-option32.css','bandalytics-mobile-option32-v3.css','bandalytics-mobile-app-v4.css','bandalytics-mobile-app-v5.css','bandalytics-mobile-app-v6.css','bandalytics-mobile-app-v7.css','bandalytics-mobile-app-v8.css','bandalytics-mobile-app-v9.css','bandalytics-mobile-shell-v10.css','bandalytics-mobile-shell-v11.css','bandalytics-mobile-shell-v12.css','bandalytics-mobile-shell-v13.css','bandalytics-mobile-shell-v14.css','bandalytics-mobile-shell-v15.css','bandalytics-mobile-reference-v15.css'];
const knownJs=['bandalytics-mobile-option32.js','bandalytics-mobile-app-v4.js','bandalytics-mobile-app-v5.js','bandalytics-mobile-app-v6.js','bandalytics-mobile-app-v7.js','bandalytics-mobile-shell-v10.js','bandalytics-mobile-shell-v14.js','bandalytics-mobile-reference-v15.js'];
for (const file of knownCss) {
  const re=new RegExp(`<link rel="stylesheet" href="/${file.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\?v=\\d+">`,'g');
  html=html.replace(re,'');
}
for (const file of knownJs) {
  const re=new RegExp(`<script src="/${file.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\?v=\\d+"><\\/script>`,'g');
  html=html.replace(re,'');
}
const version=24;
const cssTag=`<link rel="stylesheet" href="/bandalytics-mobile-option32.css?v=${version}"><link rel="stylesheet" href="/bandalytics-mobile-option32-v3.css?v=${version}"><link rel="stylesheet" href="/bandalytics-mobile-app-v4.css?v=${version}"><link rel="stylesheet" href="/bandalytics-mobile-app-v5.css?v=${version}"><link rel="stylesheet" href="/bandalytics-mobile-app-v9.css?v=${version}"><link rel="stylesheet" href="/bandalytics-mobile-shell-v10.css?v=${version}"><link rel="stylesheet" href="/bandalytics-mobile-shell-v11.css?v=${version}"><link rel="stylesheet" href="/bandalytics-mobile-shell-v12.css?v=${version}"><link rel="stylesheet" href="/bandalytics-mobile-shell-v13.css?v=${version}"><link rel="stylesheet" href="/bandalytics-mobile-shell-v14.css?v=${version}"><link rel="stylesheet" href="/bandalytics-mobile-shell-v15.css?v=${version}"><link rel="stylesheet" href="/bandalytics-mobile-reference-v15.css?v=${version}">`;
const jsTag=`<script src="/bandalytics-mobile-option32.js?v=${version}"></script><script src="/bandalytics-mobile-app-v4.js?v=${version}"></script><script src="/bandalytics-mobile-app-v5.js?v=${version}"></script><script src="/bandalytics-mobile-app-v7.js?v=${version}"></script><script src="/bandalytics-mobile-shell-v10.js?v=${version}"></script><script src="/bandalytics-mobile-shell-v14.js?v=${version}"></script><script src="/bandalytics-mobile-reference-v15.js?v=${version}"></script>`;
html=html.replace('</head>',cssTag+'</head>');
html=html.replace('</body>',jsTag+'</body>');
await fs.writeFile(mobilePath,html,'utf8');

const verify=await fs.readFile(mobilePath,'utf8');
for(const marker of [
  `bandalytics-mobile-option32.css?v=${version}`,
  `bandalytics-mobile-option32-v3.css?v=${version}`,
  `bandalytics-mobile-app-v4.css?v=${version}`,
  `bandalytics-mobile-app-v5.css?v=${version}`,
  `bandalytics-mobile-app-v9.css?v=${version}`,
  `bandalytics-mobile-shell-v10.css?v=${version}`,
  `bandalytics-mobile-shell-v11.css?v=${version}`,
  `bandalytics-mobile-shell-v12.css?v=${version}`,
  `bandalytics-mobile-shell-v13.css?v=${version}`,
  `bandalytics-mobile-shell-v14.css?v=${version}`,
  `bandalytics-mobile-shell-v15.css?v=${version}`,
  `bandalytics-mobile-reference-v15.css?v=${version}`,
  `bandalytics-mobile-option32.js?v=${version}`,
  `bandalytics-mobile-app-v4.js?v=${version}`,
  `bandalytics-mobile-app-v5.js?v=${version}`,
  `bandalytics-mobile-app-v7.js?v=${version}`,
  `bandalytics-mobile-shell-v10.js?v=${version}`,
  `bandalytics-mobile-shell-v14.js?v=${version}`,
  `bandalytics-mobile-reference-v15.js?v=${version}`
]) if(!verify.includes(marker)) throw new Error('Mobile app visual marker missing: '+marker);
for(const oldCss of ['bandalytics-mobile-app-v6.css','bandalytics-mobile-app-v7.css','bandalytics-mobile-app-v8.css']) {
  if(verify.includes(`<link rel="stylesheet" href="/${oldCss}`)) throw new Error('Deprecated mobile CSS still injected: '+oldCss);
}
await fs.writeFile('dist/_headers', headers, 'utf8');
console.log('Cloudflare Pages BANDALYTICS reference-locked UI v24 written; research logic unchanged');
