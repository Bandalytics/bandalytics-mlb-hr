const norm=t=>String(t||'').toUpperCase()==='ARI'?'AZ':String(t||'').toUpperCase()==='OAK'?'ATH':String(t||'').toUpperCase();
const pick=(players,team,spot)=>players.find(p=>norm(p.team)===norm(team)&&+p.lineup===+spot)||null;
const P=(p,market)=>p?{playerId:+p.player_id,player:p.player||p.name||null,team:norm(p.team),lineup:+p.lineup,market}:null;
export const REPLAY_PROTOCOL_VERSION='FIXED_LINEUP_POSITION_V1';
export function fixedReplayProtocols({game={},lineupPlayers=[]}={}){
 const a=norm(game.away),h=norm(game.home),a1=pick(lineupPlayers,a,1),a3=pick(lineupPlayers,a,3),a4=pick(lineupPlayers,a,4),h1=pick(lineupPlayers,h,1),h3=pick(lineupPlayers,h,3),h4=pick(lineupPlayers,h,4);
 const defs=[
  ['A_LEADOFF_HIT_ML',[P(a1,'hit1')],[{market:'away_ml'}]],
  ['H_LEADOFF_HIT_ML',[P(h1,'hit1')],[{market:'home_ml'}]],
  ['A_3HOLE_TB_TT',[P(a3,'tb2')],[{market:'away_tt_over',line:3.5}]],
  ['H_3HOLE_TB_TT',[P(h3,'tb2')],[{market:'home_tt_over',line:3.5}]],
  ['A_CLEANUP_HR_OVER',[P(a4,'hr')],[{market:'game_over',line:8.5}]],
  ['H_CLEANUP_HR_OVER',[P(h4,'hr')],[{market:'game_over',line:8.5}]],
  ['BOTH_LEADOFF_HIT',[P(a1,'hit1'),P(h1,'hit1')],[]],
  ['BOTH_3HOLE_TB',[P(a3,'tb2'),P(h3,'tb2')],[]],
  ['BOTH_CLEANUP_HR',[P(a4,'hr'),P(h4,'hr')],[]],
  ['A_TOP_CORE_ML',[P(a1,'hit1'),P(a3,'tb2')],[{market:'away_ml'}]],
  ['H_TOP_CORE_ML',[P(h1,'hit1'),P(h3,'tb2')],[{market:'home_ml'}]],
  ['BOTH_LEADOFF_OVER',[P(a1,'hit1'),P(h1,'hit1')],[{market:'game_over',line:8.5}]]
 ];
 return defs.map(([protocolId,ps,gs])=>({protocolId,version:REPLAY_PROTOCOL_VERSION,playerSelections:ps.filter(Boolean),gameSelections:gs})).filter(x=>x.playerSelections.length+x.gameSelections.length>=2&&x.playerSelections.every(s=>Number.isInteger(s.playerId)));
}
