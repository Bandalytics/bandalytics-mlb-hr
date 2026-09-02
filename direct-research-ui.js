// BANDALYTICS v95 — research-only direct-feed control center.
// HARD RULE: this module is read-only. It must never mutate P, qualification,
// Tonight HR, Final Pool, Daily Card, tickets, or any frozen v37/v39-v44/v69 layer.
(function(){
  'use strict';
  const RELEASE='v95-direct-research-site';
  const state={open:false,loading:false,date:null,preview:null,feed:null,contract:null,parity:null,error:null,lastLoadedAt:null,bodyOverflow:null};
  const $=(s,r=document)=>r.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
  const localYmd=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
  const ymd=()=>{try{return (window.ZIPDATE&&/^20\d\d-\d\d-\d\d$/.test(window.ZIPDATE))?window.ZIPDATE:localYmd()}catch{return localYmd()}};
  const n=(v,d=0)=>v==null?'—':Number(v).toFixed(d);
  const count=(a,fn)=>Array.isArray(a)?a.filter(fn).length:0;
  function injectCSS(){
    if($('#b-direct-css'))return;
    const s=document.createElement('style');s.id='b-direct-css';s.textContent=`
      #bSourceRail{display:flex;gap:7px;flex-wrap:wrap;margin:10px 0 0}.bSrc{display:inline-flex;align-items:center;gap:6px;border:1px solid rgba(255,255,255,.1);border-radius:999px;padding:6px 9px;background:rgba(255,255,255,.035);font-size:10px;font-weight:850;letter-spacing:.055em}.bSrcProd{border-color:rgba(70,213,139,.28);color:#83e5ad}.bSrcResearch{border-color:rgba(255,200,87,.28);color:#ffd675}.bSrcModel{border-color:rgba(112,167,255,.28);color:#a9c9ff}.bDot{width:6px;height:6px;border-radius:50%;background:currentColor;box-shadow:0 0 10px currentColor}
      #bDirectBtn{position:fixed;right:14px;bottom:calc(86px + env(safe-area-inset-bottom));z-index:9998;border:1px solid rgba(255,73,73,.45);background:rgba(20,20,23,.97);color:#fff;border-radius:999px;padding:11px 13px;font:800 11px/1 -apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif;letter-spacing:.075em;box-shadow:0 14px 36px rgba(0,0,0,.42)}#bDirectBtn b{color:#ff4d4d}#bDirectBtn[data-ready="1"] b{color:#46d58b}
      #bDirectShade{display:none;position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px);z-index:9998}
      #bDirectPanel{display:none;position:fixed;z-index:9999;left:8px;right:8px;bottom:max(8px,env(safe-area-inset-bottom));max-height:88vh;overflow:auto;background:linear-gradient(180deg,#121318,#0c0d10);border:1px solid #2b2e35;border-radius:22px;color:#f5f5f7;box-shadow:0 28px 90px rgba(0,0,0,.67);padding:16px;padding-bottom:max(16px,env(safe-area-inset-bottom));font:13px/1.42 -apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif}
      #bDirectPanel .bdTop{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.bdEyebrow{font-size:9px;font-weight:900;letter-spacing:.16em;color:#ff4d4d}.bdTitle{font-size:21px;font-weight:900;margin-top:3px}.bdMuted{color:#92969f}.bdClose{border:1px solid #343840;background:#1a1c21;color:#fff;border-radius:12px;padding:8px 10px;font-weight:800}.bdNotice{margin:12px 0;padding:10px 11px;border:1px solid #3a2a2a;border-radius:12px;background:#1b1415;color:#ffb2b2}.bdInfo{border-color:#273342;background:#111820;color:#b8cee8}.bdControls{display:flex;gap:8px;flex-wrap:wrap;margin:11px 0}.bdControls input,.bdControls button{border:1px solid #34373e;background:#18191d;color:#fff;border-radius:11px;padding:9px 10px;min-height:40px}.bdControls button{font-weight:800}.bdControls .bdPrimary{background:linear-gradient(180deg,#711a22,#3b1015);border-color:#8d2730}.bdGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.bdCard{border:1px solid #292c32;background:#16171a;border-radius:13px;padding:10px;min-width:0}.bdCard span{display:block}.bdCard strong{display:block;font-size:17px;margin-top:2px;overflow-wrap:anywhere}.bdGood{color:#46d58b}.bdWarn{color:#ffc857}.bdBad{color:#ff6464}.bdSection{font-weight:900;margin:15px 0 7px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#d8dbe1}.bdGateGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.bdGate{border:1px solid #292c32;border-radius:12px;padding:9px;background:#14161a}.bdGate b{display:block;margin-top:2px}.bdGate small{color:#858993}.bdTable{width:100%;border-collapse:collapse;margin-top:10px;font-size:11px}.bdTable th,.bdTable td{border-bottom:1px solid #25272c;padding:8px 5px;text-align:left;vertical-align:top}.bdTable th{position:sticky;top:0;background:#111215;color:#9da0a7;z-index:1}.bdPill{display:inline-block;border:1px solid #34373e;border-radius:999px;padding:2px 6px;margin:1px;color:#b8bbc2}.bdFoot{margin-top:10px;font-size:10px;color:#73767d}.bdEmpty{padding:14px 0;color:#858993}.bdDup{color:#ffc857;font-weight:850}
      @media(min-width:760px){#bDirectPanel{left:auto;width:720px;right:18px;bottom:18px}.bdGrid{grid-template-columns:repeat(4,minmax(0,1fr))}.bdGateGrid{grid-template-columns:repeat(4,minmax(0,1fr))}}
    `;document.head.appendChild(s);
  }
  function mountSourceRail(){
    if($('#bSourceRail'))return;
    const hero=document.querySelector('.hero');if(!hero)return;
    const rail=document.createElement('div');rail.id='bSourceRail';rail.innerHTML='<span class="bSrc bSrcProd"><i class="bDot"></i>ZIP • PRODUCTION TRUTH</span><span class="bSrc bSrcModel"><i class="bDot"></i>MODEL v37 • LOCKED</span><span class="bSrc bSrcResearch"><i class="bDot"></i>DIRECT • RESEARCH ONLY</span>';hero.appendChild(rail);
  }
  function mount(){
    if($('#bDirectBtn'))return;
    injectCSS();mountSourceRail();
    const btn=document.createElement('button');btn.id='bDirectBtn';btn.type='button';btn.setAttribute('aria-controls','bDirectPanel');btn.setAttribute('aria-expanded','false');btn.innerHTML='<b>●</b> DIRECT LAB';btn.onclick=open;
    const sh=document.createElement('div');sh.id='bDirectShade';sh.onclick=close;
    const p=document.createElement('section');p.id='bDirectPanel';p.setAttribute('role','dialog');p.setAttribute('aria-modal','true');p.setAttribute('aria-label','BANDALYTICS Direct Research Lab');
    document.body.append(btn,sh,p);render();
  }
  function open(){if(!state.open){state.bodyOverflow=document.body.style.overflow;document.body.style.overflow='hidden'}state.open=true;render();setTimeout(()=>$('#bDirectClose')?.focus(),0);if(!state.preview&&!state.loading)refresh()}
  function close(){state.open=false;if(state.bodyOverflow!=null){document.body.style.overflow=state.bodyOverflow;state.bodyOverflow=null}render();$('#bDirectBtn')?.focus()}
  function card(label,value,klass=''){return `<div class="bdCard"><span class="bdMuted">${esc(label)}</span><strong class="${klass}">${esc(value)}</strong></div>`}
  function previewItems(){return Array.isArray(state.preview?.items)?state.preview.items:[]}
  function feedItems(){return Array.isArray(state.feed?.lineup_players)?state.feed.lineup_players:[]}
  function summary(){
    const items=previewItems(), feed=feedItems();
    const names=new Map();for(const x of items){const k=String(x.player||'').trim().toLowerCase();if(!k)continue;(names.get(k)||names.set(k,[]).get(k)).push(x)}
    const dups=[...names.values()].filter(a=>a.length>1);
    return {
      items,feed,total:items.length,ids:count(items,x=>x.player_id!=null),profile4:count(items,x=>x.ev!=null&&x.hard_hit!=null&&x.barrel!=null&&x.iso!=null),stable:state.preview?.stable_samples??count(items,x=>x.sample_grade==='STABLE'),usable:state.preview?.usable_samples??count(items,x=>x.sample_grade==='USABLE'),posted:feed.length||count(items,x=>x.lineup!=null),starters:count(items,x=>x.opp_pitcher),duplicates:dups
    };
  }
  function gate(name,status,detail){const c=(status==='PASS'||status==='LOCKED')?'bdGood':(status==='PARTIAL'||status==='RESEARCH_READY'||status==='RESEARCH')?'bdWarn':'bdBad';return `<div class="bdGate"><span class="bdMuted">${esc(name)}</span><b class="${c}">${esc(status)}</b><small>${esc(detail)}</small></div>`}
  function gates(c){
    const cg=state.contract?.gates||{},pick=(key,fallbackStatus,fallbackDetail)=>[cg[key]?.status||fallbackStatus,cg[key]?.detail||fallbackDetail];
    const rows=[
      ['Identity',...pick('identity',c.total>0&&c.ids===c.total?'PASS':'PARTIAL',c.total?`${c.ids}/${c.total} direct-preview IDs`:'No preview loaded')],
      ['Market',...pick('market','PARTIAL','Adapter built; live provider credential not connected')],
      ['Sharp Money',...pick('sharp_money','LOCKED','71/71 legacy parity • ≥ +2.00 implied points')],
      ['Profile',...pick('profile','PARTIAL',`${c.profile4}/${c.total} EV/HH/BRL/ISO • PullAir/Blast pending`)],
      ['Recent BBE',...pick('bbe','PASS','Player-ID route + recovered latest-15 classifier')],
      ['Lineup',...pick('lineup',c.posted?'PASS':'PARTIAL',`${c.posted} posted lineup hitters returned`)],
      ['Starter',...pick('starter',c.starters?'PARTIAL':'BLOCKED',`${c.starters}/${c.total} starter names in preview`)],
      ['True Pitch Fit',...pick('pitchfit','RESEARCH_READY','Native exact hitter MLBAM ID + exact pitcher MLBAM ID route is live; legacy score parity remains unproven')],
      ['Environment',...pick('environment','PARTIAL','Existing backend feed; direct normalized parity not promoted')],
      ['v37 Scoring',...pick('v37','BLOCKED','Direct data cannot enter scoring')],
      ['Final Pool',...pick('final_pool','BLOCKED','ZIP workflow only')],
      ['Tickets',...pick('tickets','BLOCKED','Pool-before-tickets remains enforced')]
    ];return rows.map(([name,status,detail])=>gate(name,status,detail)).join('');
  }
  function render(){
    const b=$('#bDirectBtn'),sh=$('#bDirectShade'),p=$('#bDirectPanel');if(!b||!p)return;
    sh.style.display=state.open?'block':'none';p.style.display=state.open?'block':'none';
    const c=summary();b.dataset.ready=(c.total>0?'1':'0');b.setAttribute('aria-expanded',state.open?'true':'false');
    if(!state.open)return;
    const err=state.error?`<div class="bdNotice">${esc(state.error)}</div>`:'';
    const dupKeys=new Set(c.duplicates.flat().map(x=>(x.player||'')+'::'+(x.team||'')));
    const rows=c.items.slice(0,120).map(x=>{const dup=dupKeys.has((x.player||'')+'::'+(x.team||''));return `<tr><td class="${dup?'bdDup':''}">${esc(x.player)}${dup?' • DUP':''}</td><td>${esc(x.team||'—')}</td><td>${esc(x.player_id??'—')}</td><td>${x.ev!=null?'PROFILE':'PENDING'}</td><td>${esc(x.sample_grade||'—')}</td><td>${x.lineup!=null?esc('#'+x.lineup):'—'}</td><td>${esc(x.opp_pitcher||'TBD')}</td></tr>`}).join('');
    const dupText=c.duplicates.length?c.duplicates.map(a=>a.map(x=>`${x.player} ${x.team||'—'} #${x.player_id??'—'}`).join(' / ')).join(' • '):'None detected in direct preview';
    const q=state.parity,parityCards=q?`${card('ZIP ↔ Direct overlap',q.overlap+'/'+q.direct_entities,q.overlap?'bdGood':'bdWarn')}${card('Identity parity',q.identity.match+'/'+q.identity.known,q.identity.known&&q.identity.match===q.identity.known?'bdGood':'bdWarn')}${card('Lineup parity',q.lineup.match+'/'+q.lineup.known,q.lineup.known&&q.lineup.match===q.lineup.known?'bdGood':'bdWarn')}${card('Starter parity',q.starter.match+'/'+q.starter.known,q.starter.known&&q.starter.match===q.starter.known?'bdGood':'bdWarn')}${card('EV parity',q.profile.ev_match+'/'+q.profile.compared,q.profile.compared&&q.profile.ev_match===q.profile.compared?'bdGood':'bdWarn')}${card('HH parity',q.profile.hh_match+'/'+q.profile.compared,q.profile.compared&&q.profile.hh_match===q.profile.compared?'bdGood':'bdWarn')}${card('Barrel parity',q.profile.barrel_match+'/'+q.profile.compared,q.profile.compared&&q.profile.barrel_match===q.profile.compared?'bdGood':'bdWarn')}${card('ISO parity',q.profile.iso_match+'/'+q.profile.compared,q.profile.compared&&q.profile.iso_match===q.profile.compared?'bdGood':'bdWarn')}`:'';
    p.innerHTML=`
      <div class="bdTop"><div><div class="bdEyebrow">RESEARCH FLAG • ZERO v37 WRITE ACCESS</div><div class="bdTitle">Direct Feed Lab</div><div class="bdMuted">Build and verify ZIP-optional inputs without touching today’s production model state.</div></div><button class="bdClose" id="bDirectClose">Close</button></div>
      ${err}
      <div class="bdControls"><input id="bDirectDate" type="date" value="${esc(state.date||ymd())}"><button class="bdPrimary" id="bDirectRefresh">${state.loading?'Loading direct feeds…':'Refresh direct feeds'}</button><button id="bDirectZip">Use ZIP Production</button></div>
      <div class="bdGrid">${card('Direct hitters',c.total,c.total?'bdGood':'bdWarn')}${card('MLBAM IDs',c.ids+'/'+c.total,c.ids===c.total&&c.total?'bdGood':'bdWarn')}${card('4-field profiles',c.profile4+'/'+c.total,c.profile4===c.total&&c.total?'bdGood':'bdWarn')}${card('Posted lineup',c.posted,c.posted?'bdGood':'bdWarn')}${card('Starter names',c.starters+'/'+c.total,c.starters?'bdGood':'bdWarn')}${card('Stable samples',c.stable)}${card('Usable samples',c.usable)}${card('Direct scoring','DISABLED','bdWarn')}</div>
      <div class="bdSection">ZIP-Optional Parity Gates</div><div class="bdGateGrid">${gates(c)}</div>
      ${q?`<div class="bdSection">Loaded ZIP vs Direct Field Replay</div><div class="bdGrid">${parityCards}</div>`:`<div class="bdNotice bdInfo"><b>ZIP parity replay:</b> load the matching ${esc(state.date||ymd())} ZIP to compare direct identity, lineup, starter and profile fields. A different-date ZIP is never compared.</div>`}
      <div class="bdSection">Legacy Lens Parity</div>
      <div class="bdGateGrid">${Object.entries(state.contract?.legacy_lenses||{}).map(([k,v])=>gate(k.replaceAll('_',' '),v.status||'RESEARCH',v.detail||'')).join('')||gate('Sharp Money','LOCKED','71/71 exact; other recreated lenses remain research-only')}</div>
      <div class="bdNotice"><b>Production invariant:</b> ZIP remains the scoring source of truth. Direct mode cannot create a qualification, Tonight HR score, Final Pool player, Daily Card entry, or ticket until every parity gate is independently proven.</div>
      <div class="bdNotice bdInfo"><b>Exact-ID Pitch Fit:</b> native hitter MLBAM ID + pitcher MLBAM ID research path is available at /api/pitchfit-native. Identity ambiguity is removed, but parity_verified remains false and scoring cutover remains disabled.</div>
      <div class="bdNotice bdInfo"><b>Duplicate identity audit:</b> ${esc(dupText)}</div>
      <div class="bdSection">Direct Preview Rows</div>
      ${rows?`<div style="overflow:auto;max-height:330px"><table class="bdTable"><thead><tr><th>Player</th><th>Team</th><th>MLB ID</th><th>Profile</th><th>Sample</th><th>Order</th><th>Starter</th></tr></thead><tbody>${rows}</tbody></table></div>`:'<div class="bdEmpty">No direct preview loaded.</div>'}
      <div class="bdFoot">${RELEASE} • last load ${state.lastLoadedAt?new Date(state.lastLoadedAt).toLocaleTimeString():'—'} • modelScoringChanged=false • scoring_enabled=false</div>`;
    $('#bDirectClose').onclick=close;$('#bDirectRefresh').onclick=refresh;$('#bDirectZip').onclick=()=>{close();document.querySelector('#file')?.click()};
  }
  async function getJSON(url){const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw Error(url+' HTTP '+r.status);return r.json()}
  async function safeJSON(url){try{return{ok:true,data:await getJSON(url),error:null}}catch(e){return{ok:false,data:null,error:e?.message||String(e)}}}
  async function refresh(){
    const input=$('#bDirectDate');state.date=(input?.value&&/^20\d\d-\d\d-\d\d$/.test(input.value))?input.value:ymd();state.loading=true;state.error=null;render();
    const [pv,fd,ct]=await Promise.all([safeJSON('/api/direct-preview?date='+encodeURIComponent(state.date)),safeJSON('/api/feed-status?date='+encodeURIComponent(state.date)),safeJSON('/api/research-status')]);
    const previewDateOk=!pv.data?.date||pv.data.date===state.date,feedDateOk=!fd.data?.date||fd.data.date===state.date;
    state.preview=(pv.ok&&previewDateOk)?pv.data:null;state.feed=(fd.ok&&feedDateOk)?fd.data:null;state.contract=ct.data;const zipDate=(typeof window.ZIPDATE==='string'?window.ZIPDATE:null);state.parity=(state.preview&&zipDate===state.date)?(window.BANDALYTICS_DIRECT_PARITY?.compare?.(state.preview)||null):null;state.lastLoadedAt=Date.now();
    const errors=[!pv.ok&&('Preview: '+pv.error),pv.ok&&!previewDateOk&&('Preview date mismatch: '+pv.data?.date),!fd.ok&&('Feed: '+fd.error),fd.ok&&!feedDateOk&&('Feed date mismatch: '+fd.data?.date),!ct.ok&&('Contract: '+ct.error)].filter(Boolean);state.error=errors.length?errors.join(' • '):null;
    state.loading=false;render();
  }
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.open)close()});
  window.BANDALYTICS_DIRECT_RESEARCH={open,close,refresh,getState:()=>JSON.parse(JSON.stringify(state)),scoring_enabled:false,model_scoring_changed:false,release:RELEASE};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();