import fs from 'node:fs';
import crypto from 'node:crypto';

const [date, settledAt, rowsPath, source, outPathArg] = process.argv.slice(2);
if(!date||!settledAt||!rowsPath||!source) throw Error('Usage: node scripts/capture-v38-canary-outcomes.mjs <YYYY-MM-DD> <settled_at_iso> <rows.json> <source> [output.json]');
if(!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw Error('invalid date');
if(!Number.isFinite(Date.parse(settledAt))) throw Error('invalid settled_at');
const sourceValue=String(source).trim();
if(!sourceValue||sourceValue.length<8||/^manual$|^unknown$|^source$/i.test(sourceValue)) throw Error('outcome source must be a specific verifiable reference');
const raw=JSON.parse(fs.readFileSync(rowsPath,'utf8'));
const rows=Array.isArray(raw)?raw:raw.rows;
if(!Array.isArray(rows)||!rows.length) throw Error('outcome rows missing');
const seen=new Set();
const normalized=rows.map(r=>{
  const player_id=Number(r.player_id), hr=Number(r.hr);
  if(!Number.isInteger(player_id)) throw Error('bad outcome player_id');
  if(hr!==0&&hr!==1) throw Error(`bad hr outcome for ${player_id}`);
  if(seen.has(player_id)) throw Error(`duplicate outcome ${player_id}`);
  seen.add(player_id);
  return {player_id,hr};
}).sort((a,b)=>a.player_id-b.player_id);
const body={protocol:'V38_CANARY_OUTCOMES_V1',date,settled_at:new Date(settledAt).toISOString(),source:sourceValue,rows:normalized};
const output={...body,sha256:crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex')};
const outPath=outPathArg||`snapshots/v38-canary-outcomes-${date}.json`;
fs.mkdirSync(outPath.split('/').slice(0,-1).join('/')||'.',{recursive:true});
fs.writeFileSync(outPath,JSON.stringify(output,null,2)+'\n');
console.log(`V38_CANARY_OUTCOMES_PATH=${outPath}`);
console.log(`V38_CANARY_OUTCOMES=${JSON.stringify({date:output.date,rows:output.rows.length,source:output.source,sha256:output.sha256})}`);
