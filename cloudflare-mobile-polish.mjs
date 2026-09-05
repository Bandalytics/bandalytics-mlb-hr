import fs from 'node:fs/promises';

const targets=['dist/mobile/index.html','dist/bandalytics-mobile-v7.html'];
const cssHref='/bandalytics-mobile-polish.css?v=1';
await fs.copyFile('bandalytics-mobile-polish.css','dist/bandalytics-mobile-polish.css');
for(const target of targets){
  let html=await fs.readFile(target,'utf8');
  if(!html.includes(cssHref)) html=html.replace('</head>',`<link rel="stylesheet" href="${cssHref}"></head>`);
  await fs.writeFile(target,html,'utf8');
}
console.log('Cloudflare mobile polish injected');
