#!/usr/bin/env node
import fs from 'node:fs/promises';import {dateRange,replayBatchSummary,calibrationRecordsFromReplayResponses} from './sim-replay-batch-core.mjs';import {fixedReplayProtocols} from './sim-replay-protocol.mjs';import {replayModelMetadata} from './sim-model-meta.mjs';
const arg=(k,d=null)=>{const i=process.argv.indexOf(k);return i>=0?process.argv[i+1]:d};
const base=arg('--base-url','http://localhost:3000').replace(/\/$/,''),start=arg('--start'),end=arg('--end',start),sims=Math.max(5000,Math.min(100000,+arg('--sims','10000'))),outFile=arg('--out','joint-replay-batch.json');if(!start||!end){console.error('usage: node joint-replay-batch.mjs --base-url URL --start YYYY-MM-DD [--end YYYY-MM-DD] [--sims 10000] [--out file.json]');process.exit(2)}
const j=async(url,opt={})=>{const r=await fetch(url,opt);let body={};try{body=await r.json()}catch{}if(!r.ok)throw Error(`${r.status} ${url} ${body.error||''}`);return body};
const modelMetadata=replayModelMetadata(),responses=[];for(const date of dateRange(start,end)){
 let feed;try{feed=await j(`https://bandalytics-native-data.vercel.app/api/feed?date=${date}`)}catch(e){responses.push({date,error:'feed:'+e.message});continue}
 for(const game of feed.items||[]){const status=String(game.status||'').toLowerCase();if(!status.includes('final'))continue;for(const protocol of fixedReplayProtocols({game,lineupPlayers:feed.lineup_players||[]})){
  const body={date,gamePk:+game.gamePk,protocolId:protocol.protocolId,protocolVersion:protocol.version,mode:'calibration',playerSelections:protocol.playerSelections,gameSelections:protocol.gameSelections,sims};
  try{const x=await j(`${base}/api/sim-joint-replay`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});if(x.record)x.record={...x.record,protocolId:protocol.protocolId,protocolVersion:protocol.version};responses.push({date,gamePk:+game.gamePk,away:game.away,home:game.home,protocolId:protocol.protocolId,protocolVersion:protocol.version,...x})}catch(e){responses.push({date,gamePk:+game.gamePk,protocolId:protocol.protocolId,error:e.message})}
 }}
}
const validRecords=calibrationRecordsFromReplayResponses(responses),summary=replayBatchSummary(responses),payload={generatedAt:new Date().toISOString(),base,start,end,sims,protocol:'FIXED_LINEUP_POSITION_V1',modelMetadata,summary,records:validRecords,responses};await fs.writeFile(outFile,JSON.stringify(payload,null,2));console.log(JSON.stringify({outFile,summary},null,2));
