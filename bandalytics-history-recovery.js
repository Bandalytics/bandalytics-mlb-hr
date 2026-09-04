(()=>{
  'use strict';
  const KEY='bandalytics_history_v1';
  const PARAM='recover';
  const enabled=new URLSearchParams(location.search).get(PARAM)==='1';
  window.__BANDALYTICS_HISTORY_RECOVERY={version:'V1',storageKey:KEY,localOnly:true,sameOriginOnly:true,enabled};
  if(!enabled)return;

  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const read=()=>{
    let raw=null,error=null,rows=null;
    try{raw=localStorage.getItem(KEY);}catch(e){error=String(e?.message||e)}
    if(raw){try{const parsed=JSON.parse(raw);rows=Array.isArray(parsed)?parsed:null;if(!rows)error='Stored value exists but is not a player-slate array.'}catch(e){error='Stored value exists but JSON parsing failed.'}}
    return{raw,rows,error};
  };
  const summarize=rows=>{
    if(!Array.isArray(rows))return{rows:0,dates:0,players:0,hr:0,near:0};
    const dates=new Set(),players=new Set();let hr=0,near=0;
    for(const r of rows){if(r?.date)dates.add(String(r.date));if(r?.player)players.add(String(r.player));const o=String(r?.outcome||'').toUpperCase();if(o==='HR')hr++;if(o==='NEAR_HR')near++;}
    return{rows:rows.length,dates:dates.size,players:players.size,hr,near};
  };
  const download=(text,name,type='application/json')=>{
    const blob=new Blob([text],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
  };
  const mount=()=>{
    if(document.getElementById('bandalytics-history-recovery'))return;
    const state=read(),sum=summarize(state.rows);
    const wrap=document.createElement('div');wrap.id='bandalytics-history-recovery';wrap.innerHTML=`
      <style>
        #bandalytics-history-recovery{position:fixed;inset:0;z-index:2147483647;background:#05070af2;color:#f7f9fc;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;overflow:auto;padding:22px;box-sizing:border-box}
        #bandalytics-history-recovery .hr-card{max-width:760px;margin:28px auto;background:#0c1118;border:1px solid #263140;border-radius:18px;padding:20px;box-shadow:0 20px 60px #0009}
        #bandalytics-history-recovery h1{font-size:24px;margin:0 0 6px}#bandalytics-history-recovery p{color:#aab5c2;line-height:1.5}
        #bandalytics-history-recovery .hr-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin:18px 0}
        #bandalytics-history-recovery .hr-stat{background:#111923;border:1px solid #223042;border-radius:12px;padding:12px;text-align:center}#bandalytics-history-recovery .hr-stat b{display:block;font-size:20px}#bandalytics-history-recovery .hr-stat span{font-size:11px;color:#94a3b8}
        #bandalytics-history-recovery .ok{color:#6ee7a8}.bad{color:#fca5a5}.warn{color:#fcd34d}
        #bandalytics-history-recovery .hr-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}
        #bandalytics-history-recovery button,#bandalytics-history-recovery a.hr-close{appearance:none;border:1px solid #314156;background:#182231;color:#fff;border-radius:11px;padding:11px 14px;font-weight:700;text-decoration:none;font-size:14px}
        #bandalytics-history-recovery button.primary{background:#7f1d1d;border-color:#b91c1c}#bandalytics-history-recovery pre{white-space:pre-wrap;word-break:break-word;max-height:240px;overflow:auto;background:#070a0f;border:1px solid #202b38;padding:12px;border-radius:10px;color:#cbd5e1;font-size:11px}
        @media(max-width:650px){#bandalytics-history-recovery{padding:10px}#bandalytics-history-recovery .hr-card{margin:8px auto;padding:16px}#bandalytics-history-recovery .hr-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
      </style>
      <div class="hr-card">
        <h1>BANDALYTICS Legacy History Recovery</h1>
        <p>This tool reads <code>${KEY}</code> from this exact website origin only. Nothing is uploaded or changed.</p>
        ${state.error?`<p class="bad"><b>Storage read:</b> ${esc(state.error)}</p>`:state.rows?`<p class="ok"><b>Found recoverable history.</b></p>`:`<p class="warn"><b>No history found under this origin.</b></p>`}
        <div class="hr-grid">
          <div class="hr-stat"><b>${sum.rows}</b><span>PLAYER-SLATE ROWS</span></div>
          <div class="hr-stat"><b>${sum.dates}</b><span>SLATE DATES</span></div>
          <div class="hr-stat"><b>${sum.players}</b><span>UNIQUE PLAYERS</span></div>
          <div class="hr-stat"><b>${sum.hr}</b><span>HR OUTCOMES</span></div>
          <div class="hr-stat"><b>${sum.near}</b><span>NEAR-HR</span></div>
        </div>
        <div class="hr-actions">
          <button class="primary" id="bhrExport" ${state.raw?'':'disabled'}>Export JSON</button>
          <button id="bhrCopy" ${state.raw?'':'disabled'}>Copy JSON</button>
          <button id="bhrInspect" ${state.raw?'':'disabled'}>Show preview</button>
          <a class="hr-close" href="/">Back to BANDALYTICS</a>
        </div>
        <div id="bhrStatus" style="margin-top:12px;color:#aab5c2;font-size:13px"></div>
        <pre id="bhrPreview" hidden></pre>
        <p style="font-size:12px">If this shows zero rows, it only proves this current site origin does not contain the old key. History from a different domain, a local <code>file://</code> copy, or cleared Safari website data cannot be read from here.</p>
      </div>`;
    document.body.appendChild(wrap);
    const status=wrap.querySelector('#bhrStatus'),preview=wrap.querySelector('#bhrPreview');
    wrap.querySelector('#bhrExport')?.addEventListener('click',()=>{download(state.raw,`bandalytics_history_recovered_${new Date().toISOString().slice(0,10)}.json`);status.textContent='Export created locally.'});
    wrap.querySelector('#bhrCopy')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(state.raw);status.textContent='History JSON copied.'}catch{status.textContent='Clipboard access was blocked. Use Export JSON instead.'}});
    wrap.querySelector('#bhrInspect')?.addEventListener('click',()=>{preview.hidden=!preview.hidden;if(!preview.hidden)preview.textContent=JSON.stringify((state.rows||[]).slice(0,5),null,2)});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
