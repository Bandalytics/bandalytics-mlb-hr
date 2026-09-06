(()=>{'use strict';
let queued=false;
function arrange(){queued=false;const grid=document.querySelector('.bx-home .bx-feature-grid');if(!grid||grid.dataset.b14==='1')return;const cards=[...grid.children].filter(x=>x.classList.contains('bx-player-card'));if(cards.length<2){grid.dataset.b14='1';return}const rail=document.createElement('div');rail.className='bx-secondary-rail';cards.slice(1).forEach(card=>rail.appendChild(card));grid.appendChild(rail);grid.dataset.b14='1'}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(arrange)}
new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true});window.addEventListener('DOMContentLoaded',schedule,{once:true});schedule();
window.__BANDALYTICS_MOBILE_SHELL_V14={homeCompositionChanged:true,featuredFullWidth:true,secondaryProfilesSwipeRail:true,homeBadgeCountReduced:true,logicChanged:false,profileGateChanged:false,longshotRuleChanged:false,scoringChanged:false};
})();
