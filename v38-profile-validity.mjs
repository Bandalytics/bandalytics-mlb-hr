export const finiteMetric=v=>v!==null&&v!==''&&Number.isFinite(+v);
export const V38_REQUIRED_PROFILE_FIELDS=Object.freeze(['ev','hh','barrel','iso','sweet','pullair','blast']);
export function profileComplete(x={}){return V38_REQUIRED_PROFILE_FIELDS.every(k=>finiteMetric(x[k]))}
export function missingProfileFields(x={}){return V38_REQUIRED_PROFILE_FIELDS.filter(k=>!finiteMetric(x[k]))}
