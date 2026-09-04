(function(){
'use strict';
const KEY='bandalytics:prospective-profile-ledger:v1';
const VERSION='V1';
const VALID=new Set(['HR','NO_HR']);
const LABELS=[
 ['FOUNDATION','Foundation'],
 ['LONGSHOT','Longshot'],
 ['PULL POWER','Pull Power'],
 ['BARREL MONSTER','Barrel Monster'],
 ['ELITE CONTACT WATCH','Elite Contact Watch'],
 ['FORMAL_ARCHETYPE_OVERLAP_2PLUS','2+ Archetype Overlap'],
 ['FORMAL_ARCHETYPE_OVERLAP_3PLUS','3+ Archetype Overlap'],
 ['LONGSHOT_700_4OF6','+700 4/6 Longshot'],
 ['LONGSHOT_PLUS_ISO_200','Longshot + ISO > .200'],
 ['LONGSHOT_PLUS_BARREL_12','Longshot + Barrel ≥12'],
 ['LONGSHOT_EXTREME_CONTACT','Longshot + Extreme Contact']
];
function load(){try{const x=JSON.parse(localStorage.getItem(KEY)||'{}');return x&&typeof x==='object'?x:{}}catch{return{}}}
function tagsFor(s){return new Set([...(s.archetype_tags||[]),...(s.longshot_research_tags||[])])}
function rowFor(tag,label,snaps,outcomes){let hr=0,nohr=0,voids=0,pending=0;for(const s of snaps){if(!tagsFor(s).has(tag))continue;const o=outcomes[s.snapshot_id];if(!o){pending++;continue}if(o.status==='HR')hr++;else if(o.status==='NO_HR')nohr++;else if(o.status==='VOID_NOT_APPEARED')voids++;else pending++}const completed=hr+nohr;return{tag,label,hr,no_hr:nohr,completed,observed_hr_rate:completed?hr/completed:null,void_not_appeared:voids,pending}}
function report(opts={}){const ledger=load(),dates=Array.isArray(opts.dates)&&opts.dates.length?new Set(opts.dates):null,snaps=Object.values(ledger.snapshots||{}).filter(s=>!dates||dates.has(s.date)),outcomes=ledger.outcomes||{},rows=LABELS.map(([tag,label])=>rowFor(tag,label,snaps,outcomes));const total=snaps.length,settled=Object.values(outcomes).filter(o=>snaps.some(s=>s.snapshot_id===o.snapshot_id)&&VALID.has(o.status)).length,hr=Object.values(outcomes).filter(o=>snaps.some(s=>s.snapshot_id===o.snapshot_id)&&o.status==='HR').length,voids=Object.values(outcomes).filter(o=>snaps.some(s=>s.snapshot_id===o.snapshot_id)&&o.status==='VOID_NOT_APPEARED').length;return{version:VERSION,protocol:'BANDALYTICS_PROSPECTIVE_ARCHETYPE_REPORT_V1',descriptive_only:true,unbiased_only_if_snapshot_freeze_was_complete:true,ranking_withheld:true,denominator_policy:'HR + NO_HR only; VOID_NOT_APPEARED excluded',snapshot_count:total,settled_count:settled,hr_count:hr,void_count:voids,pending_count:Math.max(0,total-settled-voids),rows}}
function pct(x){return x==null?'—':(x*100).toFixed(1)+'%'}
function render(){const host=document.querySelector('.bd-shell')||document.getElementById('v38ProjectedResearch');if(!host)return;const r=report(),existing=document.getElementById('bdProspectiveReport');if(!r.settled_count){if(existing)existing.remove();return}const rows=r.rows.filter(x=>x.completed||x.void_not_appeared||x.pending).sort((a,b)=>b.completed-a.completed||a.label.localeCompare(b.label));let el=existing;if(!el){el=document.createElement('details');el.id='bdProspectiveReport';el.className='bd-side-card';host.appendChild(el)}el.innerHTML=`<summary style="cursor:pointer;font-weight:900">Prospective archetype tracking • ${r.settled_count} settled</summary><div style="margin-top:10px;overflow:auto"><table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr><th style="text-align:left;padding:6px">Profile</th><th style="padding:6px">HR</th><th style="padding:6px">N</th><th style="padding:6px">Observed</th><th style="padding:6px">Void</th><th style="padding:6px">Pending</th></tr></thead><tbody>${rows.map(x=>`<tr><td style="padding:6px">${x.label}</td><td style="text-align:center;padding:6px">${x.hr}</td><td style="text-align:center;padding:6px">${x.completed}</td><td style="text-align:center;padding:6px">${pct(x.observed_hr_rate)}</td><td style="text-align:center;padding:6px">${x.void_not_appeared}</td><td style="text-align:center;padding:6px">${x.pending}</td></tr>`).join('')}</tbody></table></div><p class="bd-note">Prospective descriptive rates only. Denominator = HR + No HR after final-game participation confirmation; scratches/nonparticipants are excluded. No archetype ranking is activated from small samples.</p>`}
function csv(){const r=report(),head=['Tag','Label','HR','No HR','Completed','Observed HR Rate','Void Not Appeared','Pending'],lines=[head.join(',')];for(const x of r.rows)lines.push([x.tag,x.label,x.hr,x.no_hr,x.completed,x.observed_hr_rate==null?'':x.observed_hr_rate,x.void_not_appeared,x.pending].map(v=>'"'+String(v).replaceAll('"','""')+'"').join(','));const a=document.createElement('a'),blob=new Blob([lines.join('\n')],{type:'text/csv'});a.href=URL.createObjectURL(blob);a.download='bandalytics-prospective-archetype-report.csv';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},0)}
function boot(){render();window.addEventListener('bandalytics:projected-research-ready',()=>setTimeout(render,1200));setInterval(()=>{if(document.visibilityState==='visible')render()},60000);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')render()})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.BANDALYTICS_PROSPECTIVE_REPORT={report,render,exportCsv:csv,version:VERSION};
window.__BANDALYTICS_PROSPECTIVE_REPORT={version:VERSION,descriptiveOnly:true,rankingWithheld:true,noScoringHooks:true,noModelPromotion:true,voidExcludedFromDenominator:true};
})();
