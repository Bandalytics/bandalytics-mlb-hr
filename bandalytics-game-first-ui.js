(function(){
'use strict';
const PANEL_ID='v38ProjectedResearch';
const BOOT_CLASS='bandalytics-game-ui-booting';
const LIVE_CLASS='bandalytics-combined-live';
const qs=(s,r=document)=>r.querySelector(s);
const qsa=(s,r=document)=>[...r.querySelectorAll(s)];
function panel(){return document.getElementById(PANEL_ID)}
function loadingShell(){return `<div class="bd-shell bd-loading-shell"><div class="bd-shell-head"><div><span class="bd-kicker">TODAY'S MLB SLATE</span><h1>Research Matchups</h1><p>Projected lineups, starter damage and profile-qualified early looks are loading automatically.</p></div><div class="bd-stat-row"><span><b>—</b><small>Games</small></span><span><b>—</b><small>Projected</small></span><span><b>—</b><small>Confirmed</small></span></div></div><div class="bd-loading-workspace"><div class="bd-loading-rail"><div class="bd-section-title">Today's slate</div><div class="bd-skeleton bd-s1"></div><div class="bd-skeleton bd-s1"></div><div class="bd-skeleton bd-s1"></div></div><div class="bd-loading-main"><span class="bd-kicker">SELECTED MATCHUP</span><div class="bd-skeleton bd-s2"></div><div class="bd-loading-lineups"><div class="bd-skeleton bd-s3"></div><div class="bd-skeleton bd-s3"></div></div></div></div></div>`}
function ensureBootShell(){const p=panel();if(!p)return false;document.body.classList.add(BOOT_CLASS);if(!p.querySelector('.bd-shell')&&!p.querySelector('.pre-title'))p.innerHTML=loadingShell();return true}
function trimDiagnostics(root){for(const card of qsa('.bd-side-card',root)){const title=qs('.bd-section-title',card)?.textContent?.trim().toLowerCase()||'';if(title==='game research readiness')card.remove();}
 for(const card of qsa('.bd-side-card',root)){const title=qs('.bd-section-title',card)?.textContent?.trim().toLowerCase()||'';if(title==='lineup transition audit')card.classList.add('bd-secondary-detail');}
 const head=qs('.bd-shell-head',root);if(head){const kicker=qs('.bd-kicker',head),h=qs('h1',head),p=qs('p',head);if(kicker)kicker.textContent="TODAY'S MLB SLATE";if(h)h.textContent='Matchup Research';if(p)p.textContent='Choose a game, compare projected or confirmed lineups, then review hitter profiles and matchup context.';}
 const title=qs('.bd-section-title',root);if(title&&title.textContent.trim().toLowerCase()==="today's slate")title.textContent="TODAY'S SLATE";
}
function markReady(){const p=panel();if(!p)return;const hasWorkspace=!!p.querySelector('.bd-workspace');if(hasWorkspace){document.body.classList.remove(BOOT_CLASS);document.body.classList.add(LIVE_CLASS);trimDiagnostics(p)}}
function observe(){const p=panel();if(!p)return;const mo=new MutationObserver(()=>markReady());mo.observe(p,{childList:true,subtree:true});markReady()}
function boot(){if(!ensureBootShell()){let n=0,t=setInterval(()=>{if(ensureBootShell()||++n>80)clearInterval(t)},100)}setTimeout(observe,0)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.__BANDALYTICS_GAME_FIRST_UI={version:'V1',publicTakeover:true,hidesDiagnosticReadiness:true,modelScoringChanged:false,profileGateChanged:false,longshotRuleChanged:false};
})();
