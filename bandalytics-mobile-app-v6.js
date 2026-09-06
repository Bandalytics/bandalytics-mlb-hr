(()=>{'use strict';
let queued=false;
const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
function markHome(){const screen=q('#screen');if(!screen)return;const hero=q('.app-v5-home-hero',screen);if(hero){hero.classList.add('app-v6-home-hero');const bar=qa('.sectionbar',screen).find(x=>/Top Profiles|Your Matches/i.test(q('h2',x)?.textContent||''));if(bar)bar.classList.add('app-v6-topprofiles-bar');const slate=qa('.sectionbar',screen).find(x=>/Slate Board|Today.?s Slate|Matchups/i.test(q('h2',x)?.textContent||''));if(slate){slate.classList.add('app-v6-slate-bar');const h=q('h2',slate);if(h)h.textContent="Today's Slate";}}}
function markFeatured(){qa('.app-v5-featured-primary').forEach(x=>x.classList.add('app-v6-feature-hero'));qa('.app-v5-featured-secondary').forEach((x,i)=>{x.classList.add('app-v6-feature-secondary');x.dataset.v6Rank=String(i+2)})}
function markGame(){const hero=q('.app-v5-game-hero');if(hero)hero.classList.add('app-v6-game-hero');qa('.app-v5-lineup-row').forEach(x=>x.classList.add('app-v6-lineup-row'));qa('.app-v5-top-look').forEach(x=>x.classList.add('app-v6-top-look'))}
function relabel(){qa('.nav button').forEach(btn=>{const t=(btn.textContent||'').trim().toUpperCase();if(t.includes('BOARD'))btn.childNodes[btn.childNodes.length-1].textContent='HOME';});const detailTabs=qa('.tab');detailTabs.forEach(t=>{if(/INSIGHTS/i.test(t.textContent||''))t.textContent='CONTEXT';});}
function apply(){queued=false;markHome();markFeatured();markGame();relabel()}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(apply)}
new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true,characterData:true});window.addEventListener('DOMContentLoaded',schedule,{once:true});schedule();
window.__BANDALYTICS_CONSUMER_APP_V6={mockupFaithful:true,homeComposition:'approved-refined-home',gameComposition:'approved-option2',realDataOnly:true,logicChanged:false,profileGateChanged:false,longshotRuleChanged:false,scoringChanged:false};
})();
