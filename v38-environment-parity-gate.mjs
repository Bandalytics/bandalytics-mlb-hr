export const V38_ENVIRONMENT_PARITY_GATE = Object.freeze({
  protocol: 'V38_ENVIRONMENT_PARITY_GATE_V1',
  purpose: 'Prevent recorded/final MLB game weather from being treated as point-in-time pregame evidence without sufficient parity.',
  minimums: Object.freeze({
    captured_games: 10,
    weather_covered_games: 10,
    venue_exact_rate_pct: 95,
    weather_condition_agreement_pct: 80,
    wind_class_agreement_pct: 80,
    temperature_mae_f_max: 5,
    wind_mph_mae_max: 3
  }),
  requires_threshold_review: true,
  requires_deliberate_approval: true,
  auto_promote: false,
  scoring_enabled: false,
  scoring_eligible: false
});

export function evaluateEnvironmentParity(e = {}) {
  const m = V38_ENVIRONMENT_PARITY_GATE.minimums;
  const checks = {
    captured_games: Number(e.captured_games) >= m.captured_games,
    weather_covered_games: Number(e.weather_covered_games) >= m.weather_covered_games,
    venue_exact_rate: Number(e.venue_exact_rate_pct) >= m.venue_exact_rate_pct,
    condition_agreement: Number(e.weather_condition_agreement_pct) >= m.weather_condition_agreement_pct,
    wind_class_agreement: Number(e.wind_class_agreement_pct) >= m.wind_class_agreement_pct,
    temperature_mae: Number.isFinite(Number(e.temperature_mae_f)) && Number(e.temperature_mae_f) <= m.temperature_mae_f_max,
    wind_mph_mae: Number.isFinite(Number(e.wind_mph_mae)) && Number(e.wind_mph_mae) <= m.wind_mph_mae_max,
    threshold_review: e.threshold_review === true,
    deliberate_approval: e.deliberate_approval === true
  };
  return {
    protocol: V38_ENVIRONMENT_PARITY_GATE.protocol,
    pass: Object.values(checks).every(Boolean),
    checks,
    qualifying_backtest: false,
    scoring_enabled: false,
    scoring_eligible: false
  };
}
