import handler from './api/market-native.js';
const old=process.env.SPORTSGAMEODDS_API_KEY; delete process.env.SPORTSGAMEODDS_API_KEY;
let statusCode=200,body=null;
const res={status(n){statusCode=n;return this},json(x){body=x;return x}};
await handler({query:{date:'2026-08-31'}},res);
if(statusCode!==503||body?.error!=='MARKET_KEY_REQUIRED'||body?.model_scoring_changed!==false) throw Error('market route must fail closed without key');
if(old!==undefined)process.env.SPORTSGAMEODDS_API_KEY=old;
console.log('NATIVE MARKET ROUTE FAIL-CLOSED PASS');
