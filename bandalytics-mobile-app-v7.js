(()=>{'use strict';
let queued=false;
const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
function cls(el,...c){if(el)el.classList.add(...c)}
function markHome(){
 const screen=q('#screen'); if(!screen)return;
 const hero=q('.o32-home-hero',screen); if(hero&&!hero.dataset.b7){
  hero.dataset.b7='1';cls(hero,'b7-home-hero');
  const h=q('h1',hero),sub=q('.sub',hero),ey=q('.eyebrow',hero),stats=q('.stats',hero),art=q('.app-v5-hero-art',hero);
  let copy=q('.b7-home-copy',hero); if(!copy){copy=document.createElement('div');copy.className='b7-home-copy';if(ey)copy.appendChild(ey);if(h)copy.appendChild(h);if(sub)copy.appendChild(sub);hero.prepend(copy)}
  if(ey){ey.className='b7-kicker';ey.textContent='BANDALYTICS'}
  if(h){h.className='b7-home-title';h.innerHTML='REAL DATA.<span class="red">REAL PROFILES.</span>'}
  if(sub){sub.className='b7-home-sub';sub.textContent='Advanced baseball research, cleaner profile discovery, and your own filters.'}
  if(art)cls(art,'b7-hero-art');
  if(stats){stats.className='b7-home-stats';qa('.stat',stats).forEach(x=>{const raw=(x.textContent||'').trim(),m=raw.match(/^([^ ]+)\s+(.*)$/);x.className='b7-home-stat';x.innerHTML=`<b>${m?m[1]:raw}</b><span>${m?m[2]:''}</span>`})}
 }
 const bars=qa('.sectionbar',screen);
 const pbar=bars.find(x=>/Top Profiles|Your Matches/i.test(q('h2',x)?.textContent||''));
 if(pbar&&!pbar.dataset.b7){pbar.dataset.b7='1';pbar.className='b7-section-head';const s=q('span',pbar);if(s){const b=document.createElement('button');b.type='button';b.textContent='See all ›';s.replaceWith(b)}}
 const strip=pbar?.nextElementSibling;
 if(strip?.classList.contains('o32-featured')&&!strip.dataset.b7){strip.dataset.b7='1';cls(strip,'b7-top-grid');qa('.o32-feature-card',strip).forEach((card,i)=>{
   cls(card,'b7-profile');if(i===0)cls(card,'primary');
   const media=q('.app-v5-media',card);if(media){const pi=q('.app-v5-player-photo',media),li=q('.app-v5-team-logo',media);if(pi)pi.className='b7-player';if(li)li.className='b7-logo'}
   let content=q('.b7-profile-content',card);if(!content){content=document.createElement('div');content.className='b7-profile-content';[...card.children].filter(x=>x!==media).forEach(x=>content.appendChild(x));card.appendChild(content)}
   const label=q('.o32-feature-label',content);if(label){label.className='b7-rank';label.textContent=i===0?'FEATURED PROFILE':`PROFILE ${i+1}`}
   const strong=q('strong',content);if(strong)strong.className='b7-name';const pm=q('.pm',content);if(pm)pm.className='b7-pm';const tags=q('.tags',content);if(tags){tags.className='b7-tags';qa('.tag',tags).forEach(t=>{const gold=t.classList.contains('gold'),blue=t.classList.contains('blue');t.className='b7-tag'+(gold?' gold':'')+(blue?' blue':'')})}
   const save=q('.save',content);if(save){save.classList.add('b7-save');}
   const metrics=q('.metricstrip',content);if(metrics){metrics.className='b7-metrics';qa('.metric',metrics).slice(0,3).forEach(m=>{m.className='b7-metric';const txt=(m.textContent||'').trim().split(/\s+/);const val=txt.shift()||'—';m.innerHTML=`<b>${val}</b><span>${txt.join(' ')}</span>`});qa('.metric',metrics).slice(3).forEach(x=>x.remove())}
  })}
 const sbar=bars.find(x=>/Slate Board|Today.?s Slate|Matchups/i.test(q('h2',x)?.textContent||''));
 if(sbar&&!sbar.dataset.b7){sbar.dataset.b7='1';sbar.className='b7-section-head';const h=q('h2',sbar);if(h)h.textContent="Today's Slate";const s=q('span',sbar);if(s){const b=document.createElement('button');b.type='button';b.textContent='View all ›';s.replaceWith(b)}}
 const board=sbar?.nextElementSibling;
 if(board?.classList.contains('gameboard')&&!board.dataset.b7){board.dataset.b7='1';cls(board,'b7-slate');qa('.o32-matchup-card',board).forEach(card=>{cls(card,'b7-game-card');const match=q('.matchup',card);if(match){cls(match,'b7-game-logos');qa('.o32-teamblock',match).forEach(t=>cls(t,'b7-game-team'));const at=q('.o32-vs',match);if(at)cls(at,'b7-at')}const st=q('.status',card);if(st)st.className='b7-game-status';const meta=q('.meta',card);if(meta)meta.className='b7-game-meta'})}
}
function markGame(){
 const detail=q('.detail');if(!detail)return;cls(detail,'b7-detail');
 const hero=q('.o32-game-hero',detail);if(hero&&!hero.dataset.b7){hero.dataset.b7='1';cls(hero,'b7-game-hero');const back=q('.back',document);if(back)cls(back,'b7-back');const title=q('h1',hero);if(title){title.className='b7-game-title';qa('.o32-game-team',title).forEach(t=>{cls(t,'b7-game-team-big');const img=q('.app-v5-game-logo',t);if(img){} });const at=q('.o32-game-at',title);if(at)cls(at,'b7-vs')}const sub=q('.sub',hero);if(sub)sub.className='b7-game-context';const chips=q('.chips',hero);if(chips){chips.className='b7-context-strip';qa('.chip',chips).forEach(c=>c.className='b7-context-box')}}
 const tabs=q('.tabs',detail);if(tabs)cls(tabs,'b7-tabs');
 const sw=q('.o32-team-switch',detail);if(sw)cls(sw,'b7-team-switch');
 qa('.team',detail).forEach(team=>{if(team.dataset.b7)return;team.dataset.b7='1';cls(team,'b7-lineup-card');const th=q('.th',team);if(th)th.className='b7-lineup-head';qa('.o32-player-row',team).forEach(row=>{
   cls(row,'b7-line-row');if(row.classList.contains('qual'))cls(row,'qual');const ord=q('.ord',row);if(ord)ord.className='b7-ord';const img=q('.app-v5-lineup-photo',row);const pn=q('.pn',row);if(pn)pn.className='b7-line-name';const kicker=q('.o32-player-kicker',row);if(kicker)kicker.className='b7-line-meta';const tags=q('.tags',row);if(tags){tags.className='b7-line-tags';qa('.tag',tags).forEach(t=>{const gold=t.classList.contains('gold'),blue=t.classList.contains('blue');t.className='b7-tag'+(gold?' gold':'')+(blue?' blue':'')})}const save=q('.save',row);if(save){save.classList.add('b7-star');save.textContent=save.classList.contains('on')?'★':'☆'}
  })})
 qa('.o32-top-card',detail).forEach(card=>{if(card.dataset.b7)return;card.dataset.b7='1';cls(card,'b7-toplook');const media=q('.app-v5-media',card);if(media){const img=q('.app-v5-player-photo',media);if(img)card.prepend(img);media.remove()}const strong=q('strong',card);if(strong){const h=document.createElement('h3');h.innerHTML=strong.innerHTML;strong.replaceWith(h)}const pm=q('.pm',card);if(pm)pm.className='b7-pm';const metrics=q('.metricstrip',card);if(metrics){metrics.className='b7-metrics';qa('.metric',metrics).slice(0,3).forEach(m=>{m.className='b7-metric';const txt=(m.textContent||'').trim().split(/\s+/);const val=txt.shift()||'—';m.innerHTML=`<b>${val}</b><span>${txt.join(' ')}</span>`});qa('.metric',metrics).slice(3).forEach(x=>x.remove())}})
 const empty=q('.empty',detail);if(empty)cls(empty,'b7-empty')
}
function relabelNav(){qa('.nav button').forEach(btn=>{const t=(btn.textContent||'').toUpperCase();if(t.includes('BOARD')||t.includes('HOME')){const nodes=[...btn.childNodes].filter(n=>n.nodeType===3);nodes.forEach(n=>n.textContent='HOME')}})}
function apply(){queued=false;markHome();markGame();relabelNav()}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(apply)}
new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true,characterData:true});window.addEventListener('DOMContentLoaded',schedule,{once:true});schedule();
window.__BANDALYTICS_CONSUMER_APP_V7={exactMockupShell:true,homeReference:'approved-home-image',gameReference:'approved-option2-image',realDataOnly:true,noFictionalOdds:true,logicChanged:false,profileGateChanged:false,longshotRuleChanged:false,scoringChanged:false};
})();
