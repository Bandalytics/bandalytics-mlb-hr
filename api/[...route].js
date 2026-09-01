import handler0 from "../../api-handlers/direct-profile.js";
import handler1 from "../../api-handlers/feed-status.js";
import handler2 from "../../api-handlers/iso-savant-split-qa.js";
import handler3 from "../../api-handlers/market-identity.js";
import handler4 from "../../api-handlers/market-native.js";
import handler5 from "../../api-handlers/native-feed-standalone.js";
import handler6 from "../../api-handlers/player-bbe-native-standalone.js";
import handler7 from "../../api-handlers/player-bbe-native.js";
import handler8 from "../../api-handlers/profile-native-qa.js";
import handler9 from "../../api-handlers/profile-research.js";
import handler10 from "../../api-handlers/research-status.js";
import handler11 from "../../api-handlers/results-identity.js";
import handler12 from "../../api-handlers/sim-calibrate-range.js";
import handler13 from "../../api-handlers/sim-calibrate.js";
import handler14 from "../../api-handlers/sim-exact-parlay.js";
import handler15 from "../../api-handlers/sim-joint-calibration-batch.js";
import handler16 from "../../api-handlers/sim-joint-calibration.js";
import handler17 from "../../api-handlers/sim-joint-game-player.js";
import handler18 from "../../api-handlers/sim-joint-holdout.js";
import handler19 from "../../api-handlers/sim-joint-offer-eval.js";
import handler20 from "../../api-handlers/sim-joint-player.js";
import handler21 from "../../api-handlers/sim-joint-replay.js";
import handler22 from "../../api-handlers/sim-joint-walkforward.js";
import handler23 from "../../api-handlers/sim-market.js";
import handler24 from "../../api-handlers/sim-players.js";
import handler25 from "../../api-handlers/sim-research-readiness.js";
import handler26 from "../../api-handlers/sim-settle-joint.js";
import handler27 from "../../api-handlers/sim-slate-standalone.js";
import handler28 from "../../api-handlers/sim-slate.js";
import handler29 from "../../api-handlers/sim.js";

const handlers = {
  "direct-profile": handler0,
  "feed-status": handler1,
  "iso-savant-split-qa": handler2,
  "market-identity": handler3,
  "market-native": handler4,
  "native-feed-standalone": handler5,
  "player-bbe-native-standalone": handler6,
  "player-bbe-native": handler7,
  "profile-native-qa": handler8,
  "profile-research": handler9,
  "research-status": handler10,
  "results-identity": handler11,
  "sim-calibrate-range": handler12,
  "sim-calibrate": handler13,
  "sim-exact-parlay": handler14,
  "sim-joint-calibration-batch": handler15,
  "sim-joint-calibration": handler16,
  "sim-joint-game-player": handler17,
  "sim-joint-holdout": handler18,
  "sim-joint-offer-eval": handler19,
  "sim-joint-player": handler20,
  "sim-joint-replay": handler21,
  "sim-joint-walkforward": handler22,
  "sim-market": handler23,
  "sim-players": handler24,
  "sim-research-readiness": handler25,
  "sim-settle-joint": handler26,
  "sim-slate-standalone": handler27,
  "sim-slate": handler28,
  "sim": handler29
};

export default async function handler(req, res) {
  const raw = req.query?.route;
  const parts = Array.isArray(raw) ? raw : [raw];
  const route = parts.filter(Boolean).join("/");

  if (!route || !handlers[route]) {
    return res.status(404).json({
      ok: false,
      error: "API_ROUTE_NOT_FOUND",
      route,
      available: Object.keys(handlers)
    });
  }

  try {
    return await handlers[route](req, res);
  } catch (error) {
    console.error("Bandalytics API router error:", route, error);
    if (!res.headersSent) {
      return res.status(500).json({
        ok: false,
        error: "API_ROUTE_FAILED",
        route
      });
    }
  }
}
