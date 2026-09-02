import{fetchText}from'../starter-native-core.mjs';
import{parseCsv}from'../profile-api.mjs';
const ids=[592450,660271,656941,683002],date=process.argv[2]||'2026-09-02';
function url(lt){const p=new URLSearchParams({all:'true',hfGT:'R|PO|S|',hfSea:date.slice(0,4)+'|',player_type:'batter',game_date_gt:'2026-08-20',game_date_lt:lt,hfFlag:'is..hit..into..play|',min_pitches:'0',min_results:'0',group_by:'name',sort_col:'pitches',player_event_sort:'h_launch_speed',sort_order:'desc',min_abs:'0',type:'details'});for(const id of ids)p.append('batters_lookup[]',String(id));return'https://baseballsavant.mlb.com/statcast_search/csv?'+p.toString()}
const prior=new Date(date+'T12:00:00Z');prior.setUTCDate(prior.getUTCDate()-1);const priorDate=prior.toISOString().slice(0,10);
const [a,b]=await Promise.all([fetchText(url(priorDate),{timeoutMs:25000}),fetchText(url(date),{timeoutMs:25000})]),ra=parseCsv(a),rb=parseCsv(b);
const summarize=rows=>({rows:rows.length,dates:[...new Set(rows.map(r=>r.game_date).filter(Boolean))].sort(),prior_date_rows:rows.filter(r=>r.game_date===priorDate).length,max_date:[...new Set(rows.map(r=>r.game_date).filter(Boolean))].sort().at(-1)||null});
console.log('BBE_DATE_BOUNDARY='+JSON.stringify({date,prior_date:priorDate,lt_prior:summarize(ra),lt_slate:summarize(rb),diagnostic_only:true,scoring_changed:false}));
