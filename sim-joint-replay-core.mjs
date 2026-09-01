import {replayRecordIdentity} from './sim-replay-id-core.mjs';
const finite=x=>Number.isFinite(+x)?+x:null;
export function jointReplayRecord({date,gamePk,simResult,settled,playerSelections=[],gameSelections=[],statsCutoffDate=null,seed=null,seedPolicy=null,protocolId=null,protocolVersion=null,metadata={}}={}){
  const p=finite(simResult?.joint?.probability),ind=finite(simResult?.independenceBenchmark?.probability);
  const settlementStatus=String(settled?.status||'unsettled');
  const invalid=(settled?.invalid||0)>0, pushes=(settled?.pushes||0)>0;
  const valid=!!simResult?.ok&&p!=null&&!invalid&&!pushes&&(settlementStatus==='win'||settlementStatus==='loss');
  const record={
    date:String(date||''),gamePk:+gamePk||null,protocolId:protocolId||null,protocolVersion:protocolVersion||null,valid,
    predictedProbability:p,modelProbability:p,independenceProbability:ind,
    outcome:valid?(settlementStatus==='win'?1:0):null,status:settlementStatus,
    settlementStatus,legCount:(playerSelections?.length||0)+(gameSelections?.length||0),
    playerSelections,gameSelections,
    model:simResult?.model||null,correlationLift:finite(simResult?.correlationLift),sims:+simResult?.sims||null,monteCarloSE:finite(simResult?.joint?.se),ci95:simResult?.joint?.ci95||null,
    strictAsOf:true,statsCutoffDate:statsCutoffDate||null,seed:seed==null?null:String(seed),seedPolicy:seedPolicy||null,
    exclusionReason:valid?null:(!simResult?.ok?'simulation_failed':invalid?'missing_or_invalid_leg':pushes?'push_present':'unsettled'),
    modelVersion:metadata.modelVersion||simResult?.model||null,replayVersion:metadata.replayVersion||null,inputSchemaVersion:metadata.inputSchemaVersion||null,modelFingerprint:metadata.modelFingerprint||null,modelConfig:metadata.modelConfig||null,
    researchOnly:true
  };record.recordId=replayRecordIdentity(record);return record;
}
export function appendReplayRecord(records=[],record){return record?.valid?[...records,record]:[...records]}
