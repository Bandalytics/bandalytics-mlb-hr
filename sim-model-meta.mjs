import {hashSeed} from './seeded-rng.mjs';
export const SIM_INPUT_SCHEMA_VERSION='BANDALYTICS_SIM_INPUT_V2';
export const JOINT_MODEL_VERSION='COUPLED_GAME_PLAYER_SHOCK_V1';
export const JOINT_REPLAY_VERSION='STRICT_ASOF_REPLAY_V3';
export const JOINT_MODEL_CONFIG=Object.freeze({teamShockSD:.16,gameShockSD:.08,scoreNoiseSD:.10,playerEventCap:.74,parkHistoricalMode:'NEUTRAL',cumulativeStatsCutoff:'PRIOR_CALENDAR_DAY',seedPolicy:'LOCKED_CALIBRATION_V1'});
const stable=o=>JSON.stringify(o,Object.keys(o).sort());
export function jointModelFingerprint(){return `jfp_${hashSeed(`${JOINT_MODEL_VERSION}|${JOINT_REPLAY_VERSION}|${SIM_INPUT_SCHEMA_VERSION}|${stable(JOINT_MODEL_CONFIG)}`).toString(16).padStart(8,'0')}`}
export function replayModelMetadata(){return{modelVersion:JOINT_MODEL_VERSION,replayVersion:JOINT_REPLAY_VERSION,inputSchemaVersion:SIM_INPUT_SCHEMA_VERSION,modelFingerprint:jointModelFingerprint(),modelConfig:JOINT_MODEL_CONFIG}}
