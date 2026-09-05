import assert from 'node:assert/strict';
import fs from 'node:fs';

const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const mobile=fs.readFileSync('bandalytics-mobile-v7.html','utf8');
const bridge=fs.readFileSync('functions/api/[[path]].js','utf8');
const post=fs.readFileSync('cloudflare-postbuild.mjs','utf8');

assert.match(pkg.scripts['build:cloudflare'],/bandalytics-mobile-v7\.html/);
assert.match(pkg.scripts['build:cloudflare'],/dist\/mobile\/index\.html/);
assert.match(pkg.scripts['build:cloudflare'],/cloudflare-postbuild\.mjs/);
assert.match(mobile,/qualificationLevelsNotFilters:true/);
assert.match(mobile,/longshotProfileVisibleWithoutMarket:true/);
assert.match(mobile,/longshotQualifiedRequires700:true/);
assert.match(mobile,/profileGateChanged:false/);
assert.match(mobile,/scoringChanged:false/);
assert.match(bridge,/bandalytics-mlb-hr\.vercel\.app/);
assert.match(bridge,/cloudflare-pages-v2/);
assert.match(post,/dist\/_headers/);
assert.ok(!post.includes('dist/_redirects'));
assert.ok(!mobile.includes('scoringChanged:true'));
assert.ok(!mobile.includes('profileGateChanged:true'));
console.log('CLOUDFLARE MIGRATION V2 CONTRACT PASS');
