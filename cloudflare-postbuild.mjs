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

/bandalytics-mobile-option32.js
  Cache-Control: no-store

/assets/*
  Cache-Control: public, max-age=31536000, immutable
`;

await fs.mkdir('dist/mobile', { recursive: true });
await fs.copyFile('bandalytics-mobile-option32.css','dist/bandalytics-mobile-option32.css');
await fs.copyFile('bandalytics-mobile-option32.js','dist/bandalytics-mobile-option32.js');

const mobilePath='dist/mobile/index.html';
let html=await fs.readFile(mobilePath,'utf8');
const cssTag='<link rel="stylesheet" href="/bandalytics-mobile-option32.css?v=2">';
const jsTag='<script src="/bandalytics-mobile-option32.js?v=2"></script>';
if(!html.includes('bandalytics-mobile-option32.css')) html=html.replace('</head>',cssTag+'</head>');
if(!html.includes('bandalytics-mobile-option32.js')) html=html.replace('</body>',jsTag+'</body>');
await fs.writeFile(mobilePath,html,'utf8');

const verify=await fs.readFile(mobilePath,'utf8');
for(const marker of ['bandalytics-mobile-option32.css?v=2','bandalytics-mobile-option32.js?v=2'])if(!verify.includes(marker))throw new Error('Option 3/2 mobile visual marker missing: '+marker);

await fs.writeFile('dist/_headers', headers, 'utf8');
console.log('Cloudflare Pages headers + Option 3/2 mobile visual layer written; /mobile served from dist/mobile/index.html');
