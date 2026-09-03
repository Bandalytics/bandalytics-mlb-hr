import fs from'node:fs/promises';
import path from'node:path';
import{selectCanonicalPostgameProfileSnapshot,V38_POSTGAME_PROFILE_SELECTION}from'../v38-profile-snapshot-selector.mjs';
const root=process.argv[2],date=process.argv[3];if(!root||!/^2026-\d\d-\d\d$/.test(String(date||'')))throw Error('usage: node scripts/select-v38-postgame-profile-snapshot.mjs <snapshot-dir> <2026-date>');
async function files(p){const out=[];async function walk(q){let es;try{es=await fs.readdir(q,{withFileTypes:true})}catch{return}for(const e of es){const z=path.join(q,e.name);if(e.isDirectory())await walk(z);else if(e.isFile()&&e.name.startsWith('v38-pregame-')&&e.name.endsWith('.json'))out.push(z)}}await walk(p);return out}
const candidates=[];for(const f of await files(root)){try{const z=JSON.parse(await fs.readFile(f,'utf8'));candidates.push({...z,__path:f})}catch{}}
const selected=selectCanonicalPostgameProfileSnapshot(candidates,{date});if(!selected)throw Error(`no valid canonical pregame snapshot for ${date}`);
const result={protocol:V38_POSTGAME_PROFILE_SELECTION.protocol,date,selection_rule:V38_POSTGAME_PROFILE_SELECTION.selection_rule,path:selected.__path,sha256:selected.sha256,captured_at:selected.captured_at,pregame_games:selected.pregame_games.length,excluded_started_games:selected.excluded_started_games.length,profile_complete:+selected.profile_complete||0,candidates_seen:candidates.length};
console.log(`V38_POSTGAME_PROFILE_SELECTION=${JSON.stringify(result)}`);console.log(selected.__path);
