import isoSavantSplitQa from '../api-handlers/iso-savant-split-qa.js';
import profileNativeQa from '../api-handlers/profile-native-qa.js';
import nativeFeedStandalone from '../api-handlers/native-feed-standalone.js';
import playerBbeNativeStandalone from '../api-handlers/player-bbe-native-standalone.js';

const HANDLERS = Object.freeze({
  'iso-savant-split-qa': isoSavantSplitQa,
  'profile-native-qa': profileNativeQa,
  'native-feed-standalone': nativeFeedStandalone,
  'player-bbe-native-standalone': playerBbeNativeStandalone,
});

export default async function handler(req,res){
  const route=String(req.query?.route||'').trim();
  const fn=HANDLERS[route];
  if(!fn) return res.status(404).json({ok:false,error:'unknown auxiliary route'});
  return fn(req,res);
}
