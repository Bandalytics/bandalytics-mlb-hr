(function(){
'use strict';
const PANEL_ID='v38ProjectedResearch';
const BOOT_CLASS='bandalytics-game-ui-booting';
const LIVE_CLASS='bandalytics-combined-live';
const qs=(s,r=document)=>r.querySelector(s);
const qsa=(s,r=document)=>[...r.querySelectorAll(s)];
let observerStarted=false;
let extentObserver=null;
function panel(){return document.getElementById(PANEL_ID)}
function loadingShell(){return `<div class="bd-shell bd-loading-shell"><div class="bd-shell-head"><div><span class="bd-kicker">TODAY'S MLB SLATE</span><h1>Research Matchups</h1><p>Projected lineups, starter damage and profile-qualified early looks are loading automatically.</p></div><div class="bd-stat-row"><span><b>—</b><small>Games</small></span><span><b>—</b><small>Projected</small></span><span><b>—</b><small>Confirmed</small></span></div></div><div class="bd-loading-workspace"><div class="bd-loading-rail"><div class="bd-section-title">Today's slate</div><div class="bd-skeleton bd-s1"></div><div class="bd-skeleton bd-s1"></div><div class="bd-skeleton bd-s1"></div></div><div class="bd-loading-main"><span class="bd-kicker">SELECTED MATCHUP</span><div class="bd-skeleton bd-s2"></div><div class="bd-loading-lineups"><div class="bd-skeleton bd-s3"></div><div class="bd-skeleton bd-s3"></div></div></div></div></div>`}
function ensureBootShell(){const p=panel();if(!p)return false;document.body.classList.add(BOOT_CLASS);if(!p.querySelector('.bd-shell')&&!p.querySelector('.pre-title'))p.innerHTML=loadingShell();return true}
function refinePublicCopy(root){
 for(const el of qsa('small,.pre-chip,.pre-badge,.bd-stat-row small',root)){
  if(el.children.length)continue;
  const t=(el.textContent||'').replace(/\s+/g,' ').trim();
  if(/^profile looks$/i.test(t))el.textContent='Pregame screens';
  else if(/^\d+\s+profile-qualified looks$/i.test(t))el.textContent=t.replace(/profile-qualified looks/i,'pregame screen looks');
  else if(/^profile\s+6\s*\/\s*6$/i.test(t))el.textContent='ELITE PROFILE 6/6';
  else if(/^profile\s+5\s*\/\s*6$/i.test(t))el.textContent='PROFILE MATCH 5/6';
 }
}
function trimDiagnostics(root){for(const card of qsa('.bd-side-card',root)){const title=qs('.bd-section-title',card)?.textContent?.trim().toLowerCase()||'';if(title==='game research readiness')card.remove();}
 for(const card of qsa('.bd-side-card',root)){const title=qs('.bd-section-title',card)?.textContent?.trim().toLowerCase()||'';if(title==='lineup transition audit')card.classList.add('bd-secondary-detail');}
 const head=qs('.bd-shell-head',root);if(head){const kicker=qs('.bd-kicker',head),h=qs('h1',head),p=qs('p',head);if(kicker)kicker.textContent="TODAY'S MLB SLATE";if(h)h.textContent='Matchup Research';if(p)p.textContent='Choose a game, compare projected or confirmed lineups, then review hitter profiles and matchup context.';}
 const title=qs('.bd-section-title',root);if(title&&title.textContent.trim().toLowerCase()==="today's slate")title.textContent="TODAY'S SLATE";
 refinePublicCopy(root);
}
function decorateProfiles(root){for(const row of qsa('.bd-line,.bd-look',root)){
 const text=(row.textContent||'').replace(/\s+/g,' ').trim();
 row.classList.remove('bd-profile-qualified','bd-profile-longshot');row.removeAttribute('data-bd-profile');
 qsa('.bd-research-badge',row).forEach(x=>x.remove());
 let badge='';
 if(/\b6\s*\/\s*6\b/i.test(text))badge='6/6';
 else if(/\b5\s*\/\s*6\b/i.test(text))badge='5/6';
 else if((/\b4\s*\/\s*6\b/i.test(text)&&/(longshot|\+700|ls\b)/i.test(text))||/ls\s*4\s*\/\s*6/i.test(text))badge='LS 4/6';
 if(!badge)continue;
 const longshot=badge==='LS 4/6'||/(longshot|\+700|ls\b)/i.test(text);
 row.classList.add(longshot?'bd-profile-longshot':'bd-profile-qualified');row.setAttribute('data-bd-profile',badge);
 const old=qs('em,strong',row);if(old)old.classList.add('bd-legacy-pass');
 const chip=document.createElement('span');chip.className='bd-research-badge';
 chip.textContent=longshot?'LONGSHOT CHECK • LS 4/6':badge==='6/6'?'ELITE PROFILE • 6/6':'PROFILE MATCH • 5/6';
 chip.setAttribute('aria-label',chip.textContent);
 row.appendChild(chip);
 const evidence=qs('small',row);if(evidence)evidence.classList.add('bd-evidence-strip');
 }}
function enforceDocumentExtent(){
 if(!matchMedia('(max-width:760px)').matches)return;
 const p=panel(),app=qs('.app');if(!p||!app)return;
 const shell=qs('.bd-shell',p)||p;
 for(const el of [document.documentElement,document.body,app,p,shell]){
  el.style.setProperty('height','auto','important');
  el.style.setProperty('max-height','none','important');
  el.style.setProperty('overflow-y','visible','important');
 }
 document.documentElement.style.setProperty('overflow-y','auto','important');
 document.body.style.setProperty('overflow-y','auto','important');
 const contentHeight=Math.ceil(Math.max(shell.scrollHeight,shell.getBoundingClientRect().height,p.scrollHeight));
 if(contentHeight>0){
  p.style.setProperty('min-height',contentHeight+'px','important');
  app.style.setProperty('min-height',(p.offsetTop+contentHeight+96)+'px','important');
  document.body.style.setProperty('min-height',(app.offsetTop+p.offsetTop+contentHeight+160)+'px','important');
 }
}
function startExtentGuard(){
 if(extentObserver)return;
 const p=panel();if(!p)return;
 const run=()=>requestAnimationFrame(()=>requestAnimationFrame(enforceDocumentExtent));
 extentObserver=new ResizeObserver(run);extentObserver.observe(p);const shell=qs('.bd-shell',p);if(shell)extentObserver.observe(shell);
 window.addEventListener('resize',run,{passive:true});window.visualViewport?.addEventListener('resize',run,{passive:true});
 setTimeout(run,0);setTimeout(run,250);setTimeout(run,1000);
}
function markReady(){const p=panel();if(!p)return;const hasWorkspace=!!p.querySelector('.bd-workspace');if(hasWorkspace){document.body.classList.remove(BOOT_CLASS);document.body.classList.add(LIVE_CLASS);trimDiagnostics(p);decorateProfiles(p);startExtentGuard();enforceDocumentExtent()}}
function observe(){if(observerStarted)return true;const p=panel();if(!p)return false;observerStarted=true;let queued=false;const mo=new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;markReady()})});mo.observe(p,{childList:true,subtree:true,characterData:true});markReady();return true}
function attach(){if(!ensureBootShell())return false;observe();return true}
function boot(){if(attach())return;let n=0;const t=setInterval(()=>{if(attach()||++n>240)clearInterval(t)},100)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.__BANDALYTICS_GAME_FIRST_UI={version:'V1.4',publicTakeover:true,hidesDiagnosticReadiness:true,profileHighlighting:'presentation-only',qualificationMarkerSystem:'gold-profile-blue-longshot',pregameScreenCopy:true,hydrationObserverHandoff:true,mobileDocumentExtentGuard:true,modelScoringChanged:false,profileGateChanged:false,longshotRuleChanged:false,fullLineupVisible:true};
})();
