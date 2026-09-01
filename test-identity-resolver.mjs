import assert from'node:assert/strict';import{resolveMarketIdentities}from'./identity-resolver.mjs';
const fixtures={
 'LAD:40Man':[{person:{id:571970,fullName:'Max Muncy'}}],
 'LAD:fullRoster':[{person:{id:571970,fullName:'Max Muncy'}}],
 'ATH:40Man':[{person:{id:691777,fullName:'Max Muncy'}}],
 'ATH:fullRoster':[{person:{id:691777,fullName:'Max Muncy'}}],
 'TOR:40Man':[{person:{id:660821,fullName:'Jesús Sánchez'}}],
 'TOR:fullRoster':[{person:{id:660821,fullName:'Jesús Sánchez'}}]
};
const fetcher=async url=>{const m=url.match(/teams\/(\d+)\/roster\?rosterType=([^&]+)/),ids={119:'LAD',133:'ATH',141:'TOR'},team=ids[m?.[1]],type=decodeURIComponent(m?.[2]||'');return{ok:true,json:async()=>({roster:fixtures[team+':'+type]||[]})}};
const rows=[{player:'Max Muncy',team:'LAD'},{player:'Max Muncy',team:'OAK'},{player:'Jesus Sanchez',team:'TOR'}];const r=await resolveMarketIdentities(rows,{date:'2026-08-28',fetcher});
assert.equal(r.unresolved.length,0);assert.equal(r.resolved[0].player_id,571970);assert.equal(r.resolved[1].player_id,691777);assert.equal(r.resolved[1].team,'ATH');assert.equal(r.resolved[2].player_id,660821);console.log('identity resolver PASS');
