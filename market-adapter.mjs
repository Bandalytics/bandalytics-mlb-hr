// BANDALYTICS direct HR market adapter — research-only until provider parity is proven.
// Identity is canonical player + team (+ matchup when supplied). v37 is not touched.
const TEAM_ALIAS={ARI:'AZ',OAK:'ATH'};
export const teamAlias=t=>TEAM_ALIAS[String(t||'').toUpperCase()]||String(t||'').toUpperCase();
export const canon=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[.'’\-]/g,' ').replace(/\s+/g,' ').trim();
export const marketKey=q=>[canon(q.player||q.name),teamAlias(q.team),canon(q.matchup)].join('::');
export function impliedAmerican(odds){let o=Number(odds);if(!Number.isFinite(o)||o===0)return null;return o>0?100/(o+100):(-o)/((-o)+100)}
export function deltaImpliedPct(open,current){let a=impliedAmerican(open),b=impliedAmerican(current);return a==null||b==null?null:(b-a)*100}
export const sharpMoney=(open,current)=>{let d=deltaImpliedPct(open,current);return d!=null&&d>=2.00};
function n(v){let x=Number(String(v??'').replace(/^\+/,'').trim());return Number.isFinite(x)?x:null}
function ts(v){if(v==null||v==='')return null;let x=typeof v==='number'?v:Date.parse(v);return Number.isFinite(x)?x:null}
export function normalizeQuote(raw,{provider='unknown',seenAt=Date.now()}={}){
 let player=raw.player??raw.player_name??raw.name??raw.participant,team=raw.team??raw.player_team??raw.team_abbr,matchup=raw.matchup??raw.event??raw.game,book=raw.book??raw.sportsbook??raw.bookmaker,odds=n(raw.odds??raw.price??raw.american_odds??raw.best_odds),updatedAt=ts(raw.updated_at??raw.last_update??raw.timestamp??raw.commence_time)??seenAt,playerId=n(raw.player_id??raw.mlbam_id??raw.batter_id);
 if(!player||!team||odds==null)return null;
 let q={player:String(player).trim(),team:teamAlias(team),matchup:matchup?String(matchup).trim():'',player_id:playerId,book:book?String(book):provider,odds,updated_at:updatedAt,provider};q.identity_key=marketKey(q);return q;
}
export function selectCurrent(quotes,{now=Date.now(),maxAgeMs=10*60*1000}={}){
 let live=(quotes||[]).filter(q=>q&&Number.isFinite(q.odds)&&q.updated_at!=null&&now-q.updated_at<=maxAgeMs&&q.updated_at<=now+60_000);
 if(!live.length)return null;
 // For positive HR prices, larger American odds are better. This also works across negatives.
 return live.reduce((a,b)=>b.odds>a.odds?b:a);
}
export function buildMarketState(rawQuotes,{provider='unknown',now=Date.now(),maxAgeMs=10*60*1000,openState=new Map()}={}){
 let normalized=(rawQuotes||[]).map(x=>normalizeQuote(x,{provider,seenAt:now})).filter(Boolean),groups=new Map();for(const q of normalized){let a=groups.get(q.identity_key)||[];a.push(q);groups.set(q.identity_key,a)}
 let items=[];for(const [identity_key,qs]of groups){let cur=selectCurrent(qs,{now,maxAgeMs});if(!cur)continue;let first=openState.get(identity_key);if(!first){first={odds:cur.odds,seen_at:now,book:cur.book};openState.set(identity_key,first)}let delta=deltaImpliedPct(first.odds,cur.odds);items.push({...cur,open:first.odds,now:cur.odds,open_book:first.book,open_seen_at:first.seen_at,delta_implied_pct:delta,implied_probability:impliedAmerican(cur.odds),sharp_money:delta!=null&&delta>=2.00})}
 return{items,openState,rejected:normalized.length-items.reduce((n,x)=>n+1,0)};
}
