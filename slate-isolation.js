(function(root){
  const aliases={AZ:'ARI',ARI:'ARI',WSN:'WSH',WAS:'WSH',WSH:'WSH',CHW:'CWS',CWS:'CWS',OAK:'ATH',ATH:'ATH',KCR:'KC',TBR:'TB',SFG:'SF',SDP:'SD'};
  const team=v=>{v=String(v||'').trim().toUpperCase();return aliases[v]||v};
  const matchup=v=>{
    const s=String(v||'').trim().toUpperCase();
    if(!s)return null;
    const p=s.split('@').map(x=>team(x));
    return p.length===2&&p[0]&&p[1]?p[0]+' @ '+p[1]:null;
  };
  let allowed=null,state={prepared:false,applied:false,date:null,mode:null,filtered_rows:0,stale_matchups:[],schedule_games:0,reason:'not prepared'};
  async function prepare(date,mode){
    allowed=null;state={prepared:false,applied:false,date:date||null,mode:mode||null,filtered_rows:0,stale_matchups:[],schedule_games:0,reason:'not prepared'};
    if(mode!=='LIVE'||!date){state.reason='non-live slate';root.__BANDALYTICS_SLATE_ISOLATION_STATE=state;return state}
    try{
      const r=await fetch('/api/feed-status?date='+encodeURIComponent(date),{cache:'no-store'}),z=await r.json();
      if(!r.ok||!z?.ok||z.date!==date||!Array.isArray(z.items)||!z.items.length){state.reason='schedule unavailable';root.__BANDALYTICS_SLATE_ISOLATION_STATE=state;return state}
      const set=new Set(z.items.map(g=>matchup(team(g.away)+' @ '+team(g.home))).filter(Boolean));
      if(!set.size){state.reason='empty official schedule';root.__BANDALYTICS_SLATE_ISOLATION_STATE=state;return state}
      allowed=set;state.prepared=true;state.applied=true;state.schedule_games=set.size;state.reason='official date schedule';root.__BANDALYTICS_SLATE_ISOLATION_STATE=state;return state;
    }catch(e){state.reason='schedule fetch failed: '+(e?.message||e);root.__BANDALYTICS_SLATE_ISOLATION_STATE=state;return state}
  }
  function filterRows(rows){
    if(!allowed||!Array.isArray(rows))return rows;
    const kept=[],stale=new Set(state.stale_matchups||[]);let cut=0;
    for(const row of rows){
      const m=matchup(row?.Matchup??row?.matchup??row?.Game??row?.game);
      if(m&&!allowed.has(m)){cut++;stale.add(m);continue}
      kept.push(row);
    }
    state.filtered_rows+=cut;state.stale_matchups=[...stale].sort();root.__BANDALYTICS_SLATE_ISOLATION_STATE=state;return kept;
  }
  function summary(){return {...state,stale_matchups:[...(state.stale_matchups||[])]}}
  root.BANDALYTICS_SLATE_ISOLATION={prepare,filterRows,summary,teamAlias:team,canonicalMatchup:matchup,modelScoringChanged:false,stage:'PRE_MERGE'};
})(typeof window!=='undefined'?window:globalThis);
