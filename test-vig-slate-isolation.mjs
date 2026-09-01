import fs from 'node:fs';import vm from 'node:vm';
const src=fs.readFileSync(new URL('./slate-isolation.js',import.meta.url),'utf8');
const schedule={ok:true,date:'2026-08-31',items:[{away:'PHI',home:'AZ'},{away:'CWS',home:'HOU'},{away:'SEA',home:'BOS'}]};
let fetches=0;
const ctx={window:{},globalThis:null,fetch:async()=>{fetches++;return{ok:true,json:async()=>schedule}},encodeURIComponent};ctx.globalThis=ctx.window;vm.createContext(ctx);vm.runInContext(src,ctx);
const g=ctx.window.BANDALYTICS_SLATE_ISOLATION;if(!g)throw Error('guard missing');
let st=await g.prepare('2026-08-31','LIVE');if(!st.prepared||st.schedule_games!==3)throw Error('live schedule prepare failed');
const rows=[{Player:'A',Matchup:'PHI @ ARI'},{Player:'B',matchup:'CWS @ HOU'},{Player:'C',Matchup:'PIT @ STL'},{Player:'D',Matchup:'SEA @ TOR'},{Player:'E'}];
const kept=g.filterRows(rows);if(kept.length!==3||kept.some(x=>x.Player==='C'||x.Player==='D'))throw Error('stale rows not isolated');
st=g.summary();if(st.filtered_rows!==2||st.stale_matchups.join(',')!=='PIT @ STL,SEA @ TOR')throw Error('isolation audit state wrong');
if(g.canonicalMatchup('PHI @ AZ')!=='PHI @ ARI'||g.canonicalMatchup('OAK @ TEX')!=='ATH @ TEX')throw Error('team aliases wrong');
const before=fetches;st=await g.prepare('2026-08-30','HISTORICAL');if(st.prepared||fetches!==before)throw Error('historical replay must not schedule-filter');
const hist=g.filterRows([{Matchup:'PIT @ STL'}]);if(hist.length!==1)throw Error('historical row altered');

const build=fs.readFileSync(new URL('./build.mjs',import.meta.url),'utf8');
for(const marker of ['BANDALYTICS_SLATE_ISOLATION?.prepare','BANDALYTICS_SLATE_ISOLATION?.filterRows','stale VIG rows isolated','slate-isolation.js'])if(!build.includes(marker))throw Error('build hook missing: '+marker);

console.log('VIG SLATE ISOLATION PASS');
