import crypto from'node:crypto';
export const V38_EVIDENCE_MANIFEST=Object.freeze({protocol:'V38_EVIDENCE_MANIFEST_V1',immutable:true,research_only:true,scoring_enabled:false,scoring_eligible:false,model_scoring_changed:false});
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])])):x;
export const stableJson=x=>JSON.stringify(stable(x));
export const sha256=x=>crypto.createHash('sha256').update(typeof x==='string'?x:stableJson(x)).digest('hex');
const validDate=x=>/^20\d\d-\d\d-\d\d$/.test(String(x||''));
export function buildEvidenceManifest({date,evaluation_protocol,field_fingerprint,pullair_threshold_deg,rules={},artifacts=[],outcomes_digest=null,metadata={}}={}){
  if(!validDate(date))throw Error('valid date required');
  if(!evaluation_protocol)throw Error('evaluation_protocol required');
  const normalizedArtifacts=(artifacts||[]).map(a=>({name:String(a.name||''),artifact_id:String(a.artifact_id??a.id??''),protocol:String(a.protocol||''),sha256:String(a.sha256||''),captured_at:a.captured_at||null})).sort((a,b)=>stableJson(a).localeCompare(stableJson(b)));
  if(normalizedArtifacts.some(a=>!a.name||!a.artifact_id||!a.sha256))throw Error('artifact name, id and sha256 required');
  const rulePayload={evaluation_protocol,field_fingerprint:field_fingerprint||null,pullair_threshold_deg:Number.isFinite(Number(pullair_threshold_deg))?Number(pullair_threshold_deg):null,rules:stable(rules)};
  const artifactPayload=normalizedArtifacts;
  const rule_fingerprint=sha256(rulePayload),artifact_fingerprint=sha256(artifactPayload);
  const core={protocol:V38_EVIDENCE_MANIFEST.protocol,date,evaluation_protocol,field_fingerprint:field_fingerprint||null,pullair_threshold_deg:rulePayload.pullair_threshold_deg,rule_fingerprint,artifact_fingerprint,artifacts:artifactPayload,outcomes_digest:outcomes_digest||null,metadata:stable(metadata),point_in_time:true,immutable:true,research_only:true,scoring_enabled:false,scoring_eligible:false,model_scoring_changed:false};
  const manifest_digest=sha256(core);
  return Object.freeze({...core,manifest_digest,dedupe_key:`${date}:${evaluation_protocol}:${rule_fingerprint}:${artifact_fingerprint}:${outcomes_digest||'NO_OUTCOME'}`});
}
export function validateEvidenceManifest(m){
  if(!m||m.protocol!==V38_EVIDENCE_MANIFEST.protocol||m.immutable!==true||m.point_in_time!==true||m.research_only!==true||m.scoring_enabled!==false||m.scoring_eligible!==false)return false;
  const {manifest_digest,dedupe_key,...core}=m;
  if(!manifest_digest||manifest_digest!==sha256(core))return false;
  const expected=`${m.date}:${m.evaluation_protocol}:${m.rule_fingerprint}:${m.artifact_fingerprint}:${m.outcomes_digest||'NO_OUTCOME'}`;
  return dedupe_key===expected;
}
