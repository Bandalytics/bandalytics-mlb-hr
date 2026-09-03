import assert from'node:assert/strict';
import{teamGamesForProfile,hitterMatchupForGame,summarizeFinalGamePlays,playedGamesForProfile,V38_POSTGAME_GAME_IDENTITY}from'./v38-postgame-game-identity.mjs';

const snapshot={pregame_games:[{gamePk:101,away_team_id:1,home_team_id:2},{gamePk:102,away_team_id:1,home_team_id:2},{gamePk:103,away_team_id:3,home_team_id:4}]},profile={player_id:77,team_id:1};
const g1=summarizeFinalGamePlays([{matchup:{batter:{id:77}},result:{event:'Home Run'}},{matchup:{batter:{id:88}},result:{event:'Single'}}]);
const g2=summarizeFinalGamePlays([{matchup:{batter:{id:77}},result:{event:'Flyout'}}]);
const played=new Map([[101,g1.played],[102,g2.played],[103,new Set([77])]]);
assert.deepEqual(teamGamesForProfile(snapshot,1).map(g=>g.gamePk),[101,102]);
assert.deepEqual(playedGamesForProfile(profile,snapshot,played).map(g=>g.gamePk),[101,102]);
assert.equal(g1.homers.has(77),true);assert.equal(g2.homers.has(77),false);
assert.equal(hitterMatchupForGame(snapshot.pregame_games[0],{game:{away:'AAA',home:'BBB'}},1),'AAA @ BBB');
assert.equal(hitterMatchupForGame(snapshot.pregame_games[0],{game:{away:'AAA',home:'BBB'}},2),'BBB @ AAA');
const keys=playedGamesForProfile(profile,snapshot,played).map(g=>`${g.gamePk}:${profile.player_id}`);assert.deepEqual(keys,['101:77','102:77']);assert.equal(new Set(keys).size,2);
assert.equal(V38_POSTGAME_GAME_IDENTITY.row_identity,'GAMEPK_PLAYER_ID');assert.equal(V38_POSTGAME_GAME_IDENTITY.doubleheader_safe,true);assert.equal(V38_POSTGAME_GAME_IDENTITY.scoring_enabled,false);
console.log('V38_POSTGAME_GAME_IDENTITY_PASS');
