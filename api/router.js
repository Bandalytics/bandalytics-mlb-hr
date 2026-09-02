import h0 from "../api-handlers/direct-preview.js";
import h1 from "../api-handlers/direct-profile.js";
import h2 from "../api-handlers/feed-status.js";
import h3 from "../api-handlers/iso-savant-split-qa.js";
import h4 from "../api-handlers/legacy-profile-parity-probe.js";
import h5 from "../api-handlers/market-identity.js";
import h6 from "../api-handlers/market-native.js";
import h7 from "../api-handlers/native-feed-standalone.js";
import h8 from "../api-handlers/pitchfit-native.js";
import h9 from "../api-handlers/player-bbe-native-standalone.js";
import h10 from "../api-handlers/player-bbe-native.js";
import h11 from "../api-handlers/profile-native-qa.js";
import h12 from "../api-handlers/profile-research.js";
import h13 from "../api-handlers/research-status.js";
import h14 from "../api-handlers/results-identity.js";
import h15 from "../api-handlers/sim-calibrate-range.js";
import h16 from "../api-handlers/sim-calibrate.js";
import h17 from "../api-handlers/sim-exact-parlay.js";
import h18 from "../api-handlers/sim-joint-calibration-batch.js";
import h19 from "../api-handlers/sim-joint-calibration.js";
import h20 from "../api-handlers/sim-joint-game-player.js";
import h21 from "../api-handlers/sim-joint-holdout.js";
import h22 from "../api-handlers/sim-joint-offer-eval.js";
import h23 from "../api-handlers/sim-joint-player.js";
import h24 from "../api-handlers/sim-joint-replay.js";
import h25 from "../api-handlers/sim-joint-walkforward.js";
import h26 from "../api-handlers/sim-market.js";
import h27 from "../api-handlers/sim-players.js";
import h28 from "../api-handlers/sim-research-readiness.js";
import h29 from "../api-handlers/sim-settle-joint.js";
import h30 from "../api-handlers/sim-slate-standalone.js";
import h31 from "../api-handlers/sim-slate.js";
import h32 from "../api-handlers/sim.js";

const handlers = {
  "direct-preview": h0,
  "direct-profile": h1,
  "feed-status": h2,
  "iso-savant-split-qa": h3,
  "legacy-profile-parity-probe": h4,
  "market-identity": h5,
  "market-native": h6,
  "native-feed-standalone": h7,
  "pitchfit-native": h8,
  "player-bbe-native-standalone": h9,
  "player-bbe-native": h10,
  "profile-native-qa": h11,
  "profile-research": h12,
  "research-status": h13,
  "results-identity": h14,
  "sim-calibrate-range": h15,
  "sim-calibrate": h16,
  "sim-exact-parlay": h17,
  "sim-joint-calibration-batch": h18,
  "sim-joint-calibration": h19,
  "sim-joint-game-player": h20,
  "sim-joint-holdout": h21,
  "sim-joint-offer-eval": h22,
  "sim-joint-player": h23,
  "sim-joint-replay": h24,
  "sim-joint-walkforward": h25,
  "sim-market": h26,
  "sim-players": h27,
  "sim-research-readiness": h28,
  "sim-settle-joint": h29,
  "sim-slate-standalone": h30,
  "sim-slate": h31,
  "sim": h32
};

export default async function router(req, res) {
  const route = String(req.query?.route || '').trim();
  const handler = handlers[route];
  if (!handler) return res.status(404).json({ok:false,error:"API_ROUTE_NOT_FOUND",route,available:Object.keys(handlers)});
  try{return await handler(req,res)}catch(error){console.error("BANDALYTICS API ROUTER",route,error);if(!res.headersSent)return res.status(500).json({ok:false,error:"API_ROUTE_FAILED",route})}
}
