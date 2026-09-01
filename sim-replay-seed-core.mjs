import {replayRecordIdentity} from './sim-replay-id-core.mjs';
export const CALIBRATION_SEED_POLICY='LOCKED_CALIBRATION_V1';
export function deterministicReplaySeed({date,gamePk,protocolId='CUSTOM',protocolVersion='UNVERSIONED',modelFingerprint='UNKNOWN',playerSelections=[],gameSelections=[]}={}){const id=replayRecordIdentity({date,gamePk,protocolId,protocolVersion,modelFingerprint,seed:'LOCKED',playerSelections,gameSelections});return`${CALIBRATION_SEED_POLICY}:${id}`}
export function resolveReplaySeed(input={},mode='calibration'){if(String(mode).toLowerCase()==='adhoc')return{seed:input.seed??`ADHOC:${Date.now()}`,policy:'ADHOC_CALLER_SEED',locked:false};return{seed:deterministicReplaySeed(input),policy:CALIBRATION_SEED_POLICY,locked:true}}
