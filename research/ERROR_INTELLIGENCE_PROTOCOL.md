# BANDALYTICS — Reverse Engineering & Error Intelligence Protocol
Version: 2026-10-23 (cross-sport directive; research process, not a model release)
Scope: All existing BANDALYTICS sports models, forecasts, simulations, and sportsbook evaluation. CONTINUATION, NOT RESTART.

## Permanent invariants
- Preserve every original production model, frozen pregame prediction, original timestamp, sealed holdout, prior bet, result, and research challenger. Do not overwrite, backfill, retroactively re-freeze or relabel postgame estimates as original predictions.
- Hindsight is permissible to identify hypotheses or failure modes, NEVER to manufacture prediction evidence.
- Use only data known and independently available at the relevant pregame cutoff when forming or retrospectively replaying forecasts. Document availability time, source and version; quarantine ambiguous lineage.
- Keep research challengers shadow-only until independently verified prospective results warrant promotion. No automatic model writes, odds scraping, paid runs or scheduled jobs.
- A correction failing the comparable evidence gate is rejected/retained as research, never silently adopted.

## Daily single meaningful cycle
1. **Actionable board FIRST** (only when a genuine pregame board with verified user-supplied book lines, odds, timestamps, eligible players/teams, and calibrated same-threshold probabilities exists). Rank by model-implied value net of uncertainty, not win rate or juice. Label QUALIFIED / WATCHLIST / NO BET / UNAVAILABLE; never invent EV or force parlays. Record *only user-confirmed placed bets*, separately from hypothetical tickets, cash P/L separately from bonus credits.
2. **Grade completed games** against unchanged original frozen forecasts, with official outcome/participation evidence and game-cutoff match. Match the same eligible player-games/team-games for every challenger and baseline.
3. **Error attribution:** record signed and absolute error, forecast market, team/player/game, and plausible contributing fractions or qualitative confidence from (a) availability and roster eligibility (b) minutes/snaps/TOI/PA (c) opportunities/routes/targets/carries/shots/possessions (d) efficiency/finishing (e) matchup/pace/scheme (f) variance/luck. Distinguish demonstrably pregame-predictable signals, possibly knowable signals, and genuinely unknowable events. Never force hindsight attribution to sum to 100% when evidence is missing.
4. **Recurring weakness ranking:** aggregate by player role, team, market, environment and time; require repeated independent observations. Rank by error magnitude × frequency × pregame detectability × plausible expected forecast improvement; show sample sizes and uncertainty. Flag same-player/same-game correlation.
5. **Top THREE actionable error patterns** in a concise status. Select at most ONE targeted fix with best expected payoff. If no credible pregame signals remain, STOP.
6. **Build one shadow challenger** with immutable as-of feature lineage and only chronological development data. Preserve simple baseline, production baseline and previous challenger. Keep thresholds and decision rules fixed before validation. No peeking at locked prospective games or sealed holdouts.
7. **Evaluation gates:** identical cohorts, identical cutoffs. Continuous forecasts: MAE, RMSE, signed bias by market. Binary/exact thresholds: Brier, log loss and reliability with enough events. Decision quality: verified pregame sportsbook prices, vig-aware fair odds, uncertainty and paper ROI; actual cash betting P/L graded separately. Report missing probability/price fields explicitly. Compare per-game and player-cluster uncertainty, not multiple highly correlated thresholds as independent observations.
8. **Promotion only after convincing untouched future evidence:** improvements must repeat across dates, roles and markets without unacceptable regressions; document sample size, uncertainty, rationale and rollback. Otherwise KEEP existing production.
9. **Stop rule:** once the board is assessed, completed games graded, top weaknesses ranked and one credible research test/forecast lock made, stop when the next decision requires unseen outcomes or verified missing inputs. Do not create redundant ZIPs, repeated audits, model-parameter loops or new bets solely to generate activity.

## Required one-row error ledger
sport,game_id,kickoff_utc,forecast_asof_utc,player_or_team_id,market,threshold_if_binary,source_production_version,pregame_forecast,actual,eligible_status,postgame_error,error_component,causal_confidence,pregame_identifiable,source_evidence,original_forecast_sha,challenger_id,review_status

## Required cycle report
- **Board first:** candidates or NO BET with missing reasons.
- **Completed-game grade:** frozen baseline vs shadow, sample size and paired metrics.
- **Top 3 recurrent pregame-fixable errors:** size, frequency, detectable signal, expected impact.
- **One correction:** exact hypothesis, data available as-of, test partition and outcome.
- **Decision:** PROMOTE only if independently validated; else SHADOW/REJECT/STOP.

## Sport-specific application — bandalytics-mlb-hr
MLB (offseason/paused until resumed): lineup/batting order, projected plate appearances, pitcher/bullpen usage, contact quality, venue, and opponent effects. HR, hits, total bases, walks, hitter strikeouts, RBI, HRR and stolen bases; exclude runs-scored props.
