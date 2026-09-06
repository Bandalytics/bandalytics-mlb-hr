(()=>{'use strict';
let queued=false;
const qa=(s,r=document)=>[...r.querySelectorAll(s)];
const q=(s,r=document)=>r.querySelector(s);
const initials=name=>String(name||'').trim().split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase()||'•';
function markPlayerCards(){
  qa('.o32-feature-card').forEach(card=>{if(card.dataset.appV4)return;card.dataset.appV4='1';const name=(q('strong',card)?.textContent||'').trim();card.dataset.playerInitials=initials(name)});
  qa('.o32-top-card').forEach(card=>{if(card.dataset.appV4)return;card.dataset.appV4='1';const raw=(q('strong',card)?.textContent||'').trim();const name=raw.split('•')[0].trim();card.dataset.playerInitials=initials(name)});
}
function trimDashboardCopy(){
  const screen=q('#screen'); if(!screen)return;
  qa('.sectionbar span',screen).forEach(el=>{const t=(el.textContent||'').trim();if(/Profile qualification/i.test(t))el.textContent='Explore';if(/Tap a game/i.test(t))el.textContent='All matchups'});
}
function fullLineupNotice(){
  qa('.team').forEach(team=>{if(team.dataset.appV4Integrity)return;team.dataset.appV4Integrity='1';const rows=qa(':scope > .row',team);const head=q('.th',team);if(head&&rows.length){const count=document.createElement('span');count.className='app-v4-lineup-count';count.textContent=`${rows.length} hitters`;head.appendChild(count)}})
}
function expandableProfileBadges(){
  qa('.row .tags').forEach(box=>{
    const more=q('.o32-badge-more',box);if(!more||more.dataset.expandReady)return;
    const hiddenCount=Math.max(0,qa('.tag',box).length-2);if(!hiddenCount){more.remove();return}
    const button=document.createElement('button');
    button.type='button';button.className='o32-badge-more app-v4-profile-expand';button.dataset.expandReady='1';
    button.setAttribute('aria-expanded','false');button.textContent=`+${hiddenCount} MORE`;
    button.onclick=e=>{e.preventDefault();e.stopPropagation();const expanded=box.classList.toggle('app-v4-tags-expanded');button.setAttribute('aria-expanded',String(expanded));button.textContent=expanded?'SHOW LESS':`+${hiddenCount} MORE`;};
    more.replaceWith(button);
  });
}
function apply(){queued=false;markPlayerCards();trimDashboardCopy();fullLineupNotice();expandableProfileBadges()}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(apply)}
new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true,characterData:true});
window.addEventListener('DOMContentLoaded',schedule,{once:true});schedule();
window.__BANDALYTICS_CONSUMER_APP_V4={consumerApp:true,dashboardReduction:true,fullLineupExpected:true,expandableProfileBadges:true,logicChanged:false,profileGateChanged:false,scoringChanged:false};
})();
