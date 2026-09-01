import h0 from "../api-handlers/direct-profile.js";
import h1 from "../api-handlers/feed-status.js";
import h2 from "../api-handlers/iso-savant-split-qa.js";
import h3 from "../api-handlers/market-identity.js";
import h4 from "../api-handlers/market-native.js";
import h5 from "../api-handlers/native-feed-standalone.js";
import h6 from "../api-handlers/player-bbe-native-standalone.js";
import h7 from "../api-handlers/player-bbe-native.js";
import h8 from "../api-handlers/profile-native-qa.js";
import h9 from "../api-handlers/profile-research.js";
import h10 from "../api-handlers/research-status.js";
import h11 from "../api-handlers/results-identity.js";
import h12 from "../api-handlers/sim-calibrate-range.js";
import h13 from "../api-handlers/sim-calibrate.js";
import h14 from "../api-handlers/sim-exact-parlay.js";
import h15 from "../api-handlers/sim-joint-calibration-batch.js";
import h16 from "../api-handlers/sim-joint-calibration.js";
import h17 from "../api-handlers/sim-joint-game-player.js";
import h18 from "../api-handlers/sim-joint-holdout.js";
import h19 from "../api-handlers/sim-joint-offer-eval.js";
import h20 from "../api-handlers/sim-joint-player.js";
import h21 from "../api-handlers/sim-joint-replay.js";
import h22 from "../api-handlers/sim-joint-walkforward.js";
import h23 from "../api-handlers/sim-market.js";
import h24 from "../api-handlers/sim-players.js";
import h25 from "../api-handlers/sim-research-readiness.js";
import h26 from "../api-handlers/sim-settle-joint.js";
import h27 from "../api-handlers/sim-slate-standalone.js";
import h28 from "../api-handlers/sim-slate.js";
import h29 from "../api-handlers/sim.js";

const handlers = {
  "direct-profile": h0,
  "feed-status": h1,
  "iso-savant-split-qa": h2,
  "market-identity": h3,
  "market-native": h4,
  "native-feed-standalone": h5,
  "player-bbe-native-standalone": h6,
  "player-bbe-native": h7,
  "profile-native-qa": h8,
  "profile-research": h9,
  "research-status": h10,
  "results-identity": h11,
  "sim-calibrate-range": h12,
  "sim-calibrate": h13,
  "sim-exact-parlay": h14,
  "sim-joint-calibration-batch": h15,
  "sim-joint-calibration": h16,
  "sim-joint-game-player": h17,
  "sim-joint-holdout": h18,
  "sim-joint-offer-eval": h19,
  "sim-joint-player": h20,
  "sim-joint-replay": h21,
  "sim-joint-walkforward": h22,
  "sim-market": h23,
  "sim-players": h24,
  "sim-research-readiness": h25,
  "sim-settle-joint": h26,
  "sim-slate-standalone": h27,
  "sim-slate": h28,
  "sim": h29
};

export default async function router(req, res) {
  const route = String(req.query?.route || '').trim();

  const handler = handlers[route];

  if (!handler) {
    return res.status(404).json({
      ok: false,
      error: "API_ROUTE_NOT_FOUND",
      route,
      available: Object.keys(handlers)
    });
  }

  try {
    return await handler(req, res);
  } catch (error) {
    console.error("BANDALYTICS API ROUTER", route, error);

    if (!res.headersSent) {
      return res.status(500).json({
        ok: false,
        error: "API_ROUTE_FAILED",
        route
      });
    }
  }
}
