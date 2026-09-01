export function hashSeed(input=''){
  let h=2166136261>>>0;for(const ch of String(input)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)>>>0}return h>>>0;
}
export function mulberry32(seed=1){let a=(seed>>>0)||1;return function(){a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^a>>>15,1|a);t=(t+Math.imul(t^t>>>7,61|t))^t;return((t^t>>>14)>>>0)/4294967296}}
export function rngFromSeed(seed){return mulberry32(typeof seed==='number'?seed:hashSeed(seed))}
