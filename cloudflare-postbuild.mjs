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

/bandalytics-mobile-option32.js
  Cache-Control: no-store

/bandalytics-mobile-app-v4.css
  Cache-Control: no-store

/bandalytics-mobile-app-v4.js
  Cache-Control: no-store

/assets/*
  Cache-Control: public, max-age=31536000, immutable
`;

await fs.mkdir('dist/mobile', { recursive: true });
await fs.copyFile('bandalytics-mobile-option32.css','dist/bandalytics-mobile-option32.css');
await fs.copyFile('bandalytics-mobile-option32-v3.css','dist/bandalytics-mobile-option32-v3.css');
await fs.copyFile('bandalytics-mobile-option32.js','dist/bandalytics-mobile-option32.js');
await fs.copyFile('bandalytics-mobile-app-v4.css','dist/bandalytics-mobile-app-v4.css');
await fs.copyFile('bandalytics-mobile-app-v4.js','dist/bandalytics-mobile-app-v4.js');

const mobilePath='dist/mobile/index.html';
let html=await fs.readFile(mobilePath,'utf8');
html=html.replace(/<link rel="stylesheet" href="\/bandalytics-mobile-option32\.css\?v=\d+">/g,'');
html=html.replace(/<link rel="stylesheet" href="\/bandalytics-mobile-option32-v3\.css\?v=\d+">/g,'');
html=html.replace(/<link rel="stylesheet" href="\/bandalytics-mobile-app-v4\.css\?v=\d+">/g,'');
html=html.replace(/<script src="\/bandalytics-mobile-option32\.js\?v=\d+"><\/script>/g,'');
html=html.replace(/<script src="\/bandalytics-mobile-app-v4\.js\?v=\d+"><\/script>/g,'');
const cssTag='<link rel="stylesheet" href="/bandalytics-mobile-option32.css?v=4"><link rel="stylesheet" href="/bandalytics-mobile-option32-v3.css?v=4"><link rel="stylesheet" href="/bandalytics-mobile-app-v4.css?v=4">';
const jsTag='<script src="/bandalytics-mobile-option32.js?v=4"></script><script src="/bandalytics-mobile-app-v4.js?v=4"></script>';
html=html.replace('</head>',cssTag+'</head>');
html=html.replace('</body>',jsTag+'</body>');
await fs.writeFile(mobilePath,html,'utf8');

const verify=await fs.readFile(mobilePath,'utf8');
for(const marker of ['bandalytics-mobile-option32.css?v=4','bandalytics-mobile-option32-v3.css?v=4','bandalytics-mobile-option32.js?v=4','bandalytics-mobile-app-v4.css?v=4','bandalytics-mobile-app-v4.js?v=4'])if(!verify.includes(marker))throw new Error('Mobile app visual marker missing: '+marker);

await fs.writeFile('dist/_headers', headers, 'utf8');
console.log('Cloudflare Pages consumer app v4 visual layer written; /mobile served from dist/mobile/index.html');
