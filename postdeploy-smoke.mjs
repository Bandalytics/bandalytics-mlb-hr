const ORIGIN=(process.env.ORIGIN||process.argv[2]||'').replace(/\/$/,'');
if(!/^https?:\/\//.test(ORIGIN)) throw new Error('Usage: ORIGIN=https://... node postdeploy-smoke.mjs');
const date=process.env.SLATE_DATE||'2026-08-28';
async function req(path,opt={}){
  const ctl=new AbortController();const timer=setTimeout(()=>ctl.abort(),15000);
  try{const r=await fetch(ORIGIN+path,{cache:'no-store',signal:ctl.signal,...opt});const text=await r.text();let json=null;try{json=JSON.parse(text)}catch{};return{status:r.status,ok:r.ok,text,json,headers:r.headers}}finally{clearTimeout(timer)}
}
function pass(cond,msg){if(!cond)throw new Error('POSTDEPLOY FAIL — '+msg)}

const home=await req('/');
pass(home.ok,'root HTTP '+home.status);
pass(home.text.includes('BANDALYTICS'),'root missing BANDALYTICS');
pass(home.text.includes('Direct Lab'),'Direct Lab tab missing');
pass(home.text.includes('direct-research-ui.'),'Direct Research UI asset missing');
pass(home.text.includes('direct-parity-compare.'),'Direct parity comparator asset missing');
pass(home.text.includes('HISTORICAL ZIP ISOLATED'),'mixed-date isolation guard missing');
pass(home.text.includes('Historical replay…'),'historical replay status guard missing');
const cc=home.headers.get('cache-control')||'';
pass(/no-store/i.test(cc),'root cache-control is not no-store: '+cc);

const manifest=await req('/assets-manifest.json');
pass(manifest.ok&&manifest.json,'assets manifest unavailable');
for(const k of ['safe-enrich','identity-hardening','direct-research-ui','direct-parity-compare'])pass(manifest.json[k],`manifest missing ${k}`);
for(const k of ['direct-research-ui','direct-parity-compare']){
  const a=await req('/assets/'+manifest.json[k]);pass(a.ok,`${k} asset HTTP ${a.status}`);
  const ac=a.headers.get('cache-control')||'';pass(/immutable/i.test(ac),`${k} asset not immutable: ${ac}`);
}

const contract=await req('/api/research-status');
pass(contract.ok&&contract.json,'research-status unavailable');
pass(contract.json.direct_mode==='RESEARCH_ONLY','direct_mode not RESEARCH_ONLY');
pass(contract.json.scoring_enabled===false,'research contract scoring enabled');
pass(contract.json.model_scoring_changed===false,'research contract changed scoring');
pass(contract.json.pool_before_tickets===true,'pool-before-tickets invariant missing');
pass(contract.json.gates?.sharp_money?.status==='LOCKED','Sharp Money not LOCKED');
pass(contract.json.gates?.v37?.status==='BLOCKED','v37 direct gate not BLOCKED');
pass(contract.json.gates?.final_pool?.status==='BLOCKED','Final Pool direct gate not BLOCKED');
pass(contract.json.gates?.tickets?.status==='BLOCKED','Tickets direct gate not BLOCKED');

const direct=await req('/api/direct-preview?date='+encodeURIComponent(date));
pass(direct.ok&&direct.json?.date===date,'direct-preview unavailable/date mismatch');
pass(Array.isArray(direct.json.items)&&direct.json.items.length>0,'direct-preview empty');
const max=direct.json.items.filter(x=>String(x.player).toLowerCase()==='max muncy');
if(max.length>1){const ids=new Set(max.map(x=>+x.player_id));pass(ids.size===max.length,'duplicate Max Muncy IDs collapsed in direct preview')}

const feed=await req('/api/feed-status?date='+encodeURIComponent(date));
pass(feed.ok&&feed.json?.date===date,'feed-status unavailable/date mismatch');

const results=await req('/api/results-identity?date=2026-08-27');
pass(results.ok&&results.json,'results-identity unavailable');
pass(results.json.games===7,'8/27 results games regression '+results.json.games);
pass(results.json.hr_events===16,'8/27 HR events regression '+results.json.hr_events);
pass(results.json.unique_batters===15,'8/27 unique batters regression '+results.json.unique_batters);

console.log(JSON.stringify({ok:true,origin:ORIGIN,date,root:'PASS',cache:'PASS',assets:'PASS',research_contract:'PASS',direct_preview:direct.json.items.length,feed_lineups:feed.json.lineup_players?.length??null,results_827:{games:results.json.games,hr_events:results.json.hr_events,unique_batters:results.json.unique_batters}},null,2));
