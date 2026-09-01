const liveMarketKey=!!(process.env.SPORTSGAMEODDS_API_KEY||process.env.SGO_API_KEY||process.env.SPORTS_GAME_ODDS_KEY);
const gates=Object.freeze({
  identity:{status:'PASS',detail:'Market universe historical MLBAM resolver validated 266/266 on 8/28 fixture.'},
  market:liveMarketKey?{status:'LIVE_RESEARCH',detail:'SportsGameOdds live HR market credential connected; exact-ID native market feed is available to Direct Lab only and remains outside v37 scoring.'}:{status:'BLOCKED',detail:'Native SportsGameOdds HR adapter is built and tested; live provider API key not connected.'},
  sharp_money:{status:'LOCKED',detail:'71/71 historical legacy membership; trigger = +2.00 implied probability points.'},
  profile:{status:'RESEARCH_READY',detail:'Direct Savant ISO/EV/Sweet Spot/Barrel/HH/Pull/Blast plus exact Pull AIR source implemented; no scoring cutover.'},
  bbe:{status:'PASS',detail:'Player-ID Recent BBE route + recovered latest-15 HRQ/near-HR classifier.'},
  lineup:{status:'PASS',detail:'Official MLB posted lineup feed available.'},
  starter:{status:'RESEARCH_READY',detail:'MLB overall + handedness HR/9/SLG/ISO and Savant contact damage implemented with small-IP guard; no scoring cutover.'},
  pitchfit:{status:'RESEARCH_READY',detail:'Native exact-MLBAM pitch-type fit is implemented with coverage/sample detail; legacy score parity remains unproven so v37 write access stays blocked.'},
  environment:{status:'RESEARCH_READY',detail:'Native bullpen workload/handedness, Statcast park HR factor, and game-time weather implemented; thresholds remain non-scoring.'},
  v37:{status:'BLOCKED',detail:'Direct data has zero scoring write access.'},
  final_pool:{status:'BLOCKED',detail:'ZIP production workflow only.'},
  tickets:{status:'BLOCKED',detail:'Pool-before-tickets remains enforced.'}
});
const legacy_lenses=Object.freeze({
  sharp_money:{status:'LOCKED',detail:'71/71 exact across 8/26–8/28; delta implied probability >= +2.00 points.'},
  steam:{status:'RESEARCH',detail:'Quote-path/history dependent; final open→current snapshot is insufficient.'},
  sweet_spot:{status:'RESEARCH',detail:'Displayed +200 to +600 concept is not sufficient to recreate exact historical membership.'},
  tired_pen:{status:'RESEARCH',detail:'Cohort-level structure recovered; exact bullpen workload/freshness threshold not proven.'},
  double_edge:{status:'RESEARCH',detail:'Cross-layer recent hitter form + fading starter interaction.'},
  remaining:{status:'RESEARCH',detail:'Barrel Match, Mispriced, Hidden Edge, Sleeper Edge and other legacy tags remain blocked.'}
});
export default function handler(req,res){
  return res.status(200).json({release:'v95-direct-research-site',production_source:'ZIP',direct_mode:'RESEARCH_ONLY',scoring_enabled:false,model_scoring_changed:false,pool_before_tickets:true,gates,legacy_lenses});
}
