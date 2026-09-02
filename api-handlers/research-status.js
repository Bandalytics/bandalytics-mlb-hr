const gates=Object.freeze({
  identity:{status:'PASS',detail:'Market universe historical MLBAM resolver validated 266/266 on 8/28 fixture; live SportsGameOdds rows continue to fail closed when exact identity cannot be established.'},
  market:{status:'RESEARCH_VALIDATED',detail:'SportsGameOdds MLB batter HR YES is connected in Production. Sep 2 live validation: 15 provider events matched 15 MLB slate games; 253 exact MLBAM rows with best-book and open-price coverage; 14 unresolved identities rejected fail-closed. Research-only; no scoring write access.'},
  sharp_money:{status:'LOCKED',detail:'71/71 historical legacy membership; trigger = +2.00 implied probability points.'},
  profile:{status:'PARTIAL',detail:'Direct Savant EV/Hard-Hit%/Barrel%/ISO are available by MLBAM ID. Historical ZIPs do not export exact PullAir% or Blast% values, so those fields remain PENDING and profile scoring parity is blocked.'},
  bbe:{status:'PASS',detail:'Player-ID Recent BBE route + recovered latest-15 HRQ/near-HR classifier; live multi-batch path validated.'},
  lineup:{status:'PASS',detail:'Official MLB posted lineup feed available.'},
  starter:{status:'RESEARCH_READY',detail:'MLB overall + handedness HR/9/SLG/ISO and Savant contact damage implemented with small-IP guard; no scoring cutover.'},
  pitchfit:{status:'RESEARCH_READY',detail:'Native Baseball Savant Pitch Fit runs on exact hitter MLBAM ID + exact pitcher MLBAM ID. Duplicate-name identity ambiguity is removed; legacy score parity remains unproven and scoring cutover stays off.'},
  environment:{status:'RESEARCH_READY',detail:'Native bullpen workload/handedness, Statcast park HR factor, and game-time weather implemented; thresholds remain non-scoring.'},
  v37:{status:'BLOCKED',detail:'Direct data has zero scoring write access. PullAir/Blast legacy parity remains a mandatory cutover gate.'},
  final_pool:{status:'BLOCKED',detail:'ZIP production workflow only until deliberate v37 native cutover is regression validated.'},
  tickets:{status:'BLOCKED',detail:'Pool-before-tickets remains enforced; native ticket construction cannot precede final-pool promotion.'}
});
const legacy_lenses=Object.freeze({
  sharp_money:{status:'LOCKED',detail:'71/71 exact across 8/26–8/28; delta implied probability >= +2.00 points.'},
  steam:{status:'RESEARCH',detail:'Live SportsGameOdds open/current movement is now observable, but exact legacy quote-path/history semantics are not yet proven.'},
  sweet_spot:{status:'RESEARCH',detail:'Displayed +200 to +600 concept is not sufficient to recreate exact historical membership.'},
  tired_pen:{status:'RESEARCH',detail:'Cohort-level structure recovered; exact bullpen workload/freshness threshold not proven.'},
  double_edge:{status:'RESEARCH',detail:'Cross-layer recent hitter form + fading starter interaction.'},
  remaining:{status:'RESEARCH',detail:'Barrel Match, Mispriced, Hidden Edge, Sleeper Edge and other legacy tags remain blocked.'}
});
export default function handler(req,res){
  return res.status(200).json({release:'v95-direct-research-site',production_source:'ZIP',direct_mode:'RESEARCH_ONLY',scoring_enabled:false,model_scoring_changed:false,pool_before_tickets:true,gates,legacy_lenses});
}
