import fs from'node:fs/promises';
const cfg=JSON.parse(await fs.readFile('vercel.json','utf8'));
const root=cfg.headers?.find(x=>x.source==='/')?.headers||[];
const assets=cfg.headers?.find(x=>x.source==='/assets/(.*)')?.headers||[];
if(!root.some(x=>x.key==='Cache-Control'&&x.value==='no-store'))throw Error('root no-store missing');
if(!assets.some(x=>x.key==='Cache-Control'&&/immutable/.test(x.value)))throw Error('immutable asset cache missing');
const rewrites=new Map((cfg.rewrites||[]).map(x=>[x.source,x.destination]));
const apiFns=(await fs.readdir('api')).filter(x=>x.endsWith('.js'));
if(apiFns.length>12)throw Error('Vercel Hobby function cap exceeded: '+apiFns.length+' > 12');
const auxRoutes=new Map([
 ['/api/iso-savant-split-qa','/api/aux?route=iso-savant-split-qa'],
 ['/api/profile-native-qa','/api/aux?route=profile-native-qa'],
 ['/api/native-feed-standalone','/api/aux?route=native-feed-standalone'],
 ['/api/player-bbe-native-standalone','/api/aux?route=player-bbe-native-standalone'],
]);
for(const [source,destination] of auxRoutes)if(rewrites.get(source)!==destination)throw Error('auxiliary route consolidation missing '+source);
for(const f of ['api/aux.js','api-handlers/iso-savant-split-qa.js','api-handlers/profile-native-qa.js','api-handlers/native-feed-standalone.js','api-handlers/player-bbe-native-standalone.js']){try{await fs.access(f)}catch{throw Error('auxiliary handler source missing '+f)}}
for(const r of ['/api/core','/api/context','/api/environment','/api/pitchfit','/api/direct-preview','/api/player-bbe','/slate-cache'])if(!rewrites.has(r))throw Error('rewrite missing '+r);
if(rewrites.has('/api/feed-status'))throw Error('native feed-status must not be shadowed by rewrite');
for(const r of ['/api/results-identity','/api/direct-profile','/api/market-identity','/api/research-status','/api/feed-status'])if(rewrites.has(r))throw Error('local API shadowed by rewrite '+r);
for(const f of ['api/results-identity.js','api/direct-profile.js','api/profile-research.js','api/market-identity.js','api/research-status.js','api/feed-status.js','native-feed-core.mjs','direct-research-ui.js','identity-hardening.js','patch-identity-loader.mjs']){try{await fs.access(f)}catch{throw Error('site source missing '+f)}}
const build=await fs.readFile('build.mjs','utf8');
for(const x of ["direct-research-ui",'direct-parity-compare','identity-hardening','bandalytics-slate-v95-identity-pf','Direct Lab','duplicate name','direct tab block not found','v95 BUILD PASS'])if(!build.includes(x))throw Error('build marker missing '+x);
console.log('SITE PREFLIGHT PASS');

if(!build.includes('Tonight HR Score v37'))throw new Error('Site build must label frozen score model as v37');
