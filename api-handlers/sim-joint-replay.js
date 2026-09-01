import {simulateSlate} from '../sim-auto-core.mjs';
import {loadBaseContext,hydrateGameStatsAsOf,hydrateHittersAsOf,json} from '../sim-data-core.mjs';
import {simulateJointGamePlayer} from '../sim-joint-game-player-core.mjs';
import {boxscoreSettlement,settleJoint} from '../sim-settlement-core.mjs';
import {jointReplayRecord} from '../sim-joint-replay-core.mjs';
import {rngFromSeed} from '../seeded-rng.mjs';
import {replayModelMetadata} from '../sim-model-meta.mjs';
import {resolveReplaySeed} from '../sim-replay-seed-core.mjs';
const norm=t=>String(t||'').toUpperCase()==='ARI'?'AZ':String(t||'').toUpperCase()==='OAK'?'ATH':String(t||'').toUpperCase();
export default async function handler(req,res){try{
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({ok:false,error:'POST required'})}
 const b=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{}),date=String(b.date||''),gamePk=+b.gamePk,protocolId=b.protocolId||null,protocolVersion=b.protocolVersion||null,mode=String(b.mode||'calibration').toLowerCase(),playerSelections=Array.isArray(b.playerSelections)?b.playerSelections:[],gameSelections=Array.isArray(b.gameSelections)?b.gameSelections:[],sims=Math.max(5000,Math.min(100000,+b.sims||30000));
 if(!/^20\d\d-\d\d-\d\d$/.test(date)||!Number.isInteger(gamePk)||(!playerSelections.length&&!gameSelections.length))return res.status(400).json({ok:false,error:'date, gamePk and selections required'});
 const pushable=new Set(['game_over','game_under','home_tt_over','home_tt_under','away_tt_over','away_tt_under']);for(const x of gameSelections)if(pushable.has(String(x.market||''))&&Number.isInteger(+x.line))return res.status(400).json({ok:false,error:'Replay total/team-total legs require half-run lines (.5).'});
 const warnings=[],{feed,bullpen,park,weather}=await loadBaseContext(date),raw=(feed.items||[]).find(g=>+g.gamePk===gamePk);if(!raw)return res.status(404).json({ok:false,error:'game not found'});
 const gameStats=await hydrateGameStatsAsOf(feed,date,warnings),hitterHydration=await hydrateHittersAsOf(feed,date,warnings),{pitcherStats,teamStats}=gameStats,{hitterStats,bbeStats}=hitterHydration;
 // historicalSafe disables full-season park/weather and feed-derived ISO fields that could leak future information.
 const slate=simulateSlate({feed,bullpen,park,weather,pitcherStats,teamStats,sims:5000,includeLive:true,historicalSafe:true}),sg=slate.games.find(g=>+g.gamePk===gamePk);if(!sg)return res.status(404).json({ok:false,error:'sim game unavailable'});
 const contexts=new Map();for(const p of (feed.lineup_players||[]).filter(p=>norm(p.team)===norm(sg.away)||norm(p.team)===norm(sg.home))){const isAway=norm(p.team)===norm(sg.away);contexts.set(+p.player_id,{player:p,stats:hitterStats.get(+p.player_id),bbe:bbeStats.get(+p.player_id)||null,teamExpectedRuns:isAway?sg.estimates.away.expectedRuns:sg.estimates.home.expectedRuns,starter:pitcherStats.get(+(isAway?raw.homeStarterId:raw.awayStarterId))||{},parkHrFactor:1})}
 const metadata=replayModelMetadata(),seedResolution=resolveReplaySeed({date,gamePk,protocolId:protocolId||'CUSTOM',protocolVersion:protocolVersion||'UNVERSIONED',modelFingerprint:metadata.modelFingerprint,playerSelections,gameSelections,seed:b.seed},mode),seed=seedResolution.seed;
 const simResult=simulateJointGamePlayer({away:sg.away,home:sg.home,awayExpectedRuns:sg.estimates.away.expectedRuns,homeExpectedRuns:sg.estimates.home.expectedRuns,playerSelections,gameSelections,playerContexts:contexts,sims,rng:rngFromSeed(seed)});
 if(!simResult.ok)return res.status(400).json(simResult);
 const box=await json(`https://statsapi.mlb.com/api/v1/game/${gamePk}/boxscore`,15000),settlement=boxscoreSettlement(box),settled=settleJoint({playerSelections,gameSelections,settlement});
 const cutoff=gameStats.statsCutoffDate||hitterHydration.statsCutoffDate||null,record=jointReplayRecord({date,gamePk,simResult,settled,playerSelections,gameSelections,statsCutoffDate:cutoff,seed,seedPolicy:seedResolution.policy,protocolId,protocolVersion,metadata});
 return res.status(200).json({ok:true,record,simulation:simResult,settlement:{status:settled.status,wins:settled.wins,losses:settled.losses,pushes:settled.pushes,invalid:settled.invalid,awayRuns:settlement.away.runs,homeRuns:settlement.home.runs},warnings,researchOnly:true,warning:'Historical replay uses prior-day cumulative MLB stats and fail-closed settlement. Valid records only should enter calibration.'});
 }catch(e){return res.status(500).json({ok:false,error:String(e?.message||e)})}}
