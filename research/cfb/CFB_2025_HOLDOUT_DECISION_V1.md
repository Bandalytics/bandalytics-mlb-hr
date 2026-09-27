# CFB BANDALYTICS — 2025 Frozen Holdout Decision V1

Status: RESEARCH ONLY. No production enable.

The 2025 holdout was evaluated once against the exact four discovery screens frozen before the holdout workflow ran. No public-ticket percentages were used and no ROI was computed because frozen historical bet prices were not verified.

## Raw holdout results

- DOG_MOVE_3PLUS: 20-32-3, 38.46% excluding pushes, n=52 decisions. Discovery was 100-68-7 (59.52%). This screen failed holdout and is rejected for production use.
- BOOKS3PLUS_DOG_MOVE_3PLUS: 20-31-3, 39.22% excluding pushes, n=51 decisions. Discovery was 92-65-7 (58.60%). This screen failed holdout and is rejected for production use.
- CROSS6: 29-16-0, 64.44%, n=45. Wilson 95% lower bound 49.84%. Directionally survived, but the holdout sample is too small for production trust by itself.
- BOOKS3PLUS_CROSS6: 27-15-0, 64.29%, n=42. Wilson 95% lower bound 49.17%. Directionally survived, but the holdout sample is too small for production trust by itself.

## Decision

1. Reject the discovery hypothesis that large 3+ point movement toward a closing home dog is independently reliable. It failed badly in the untouched holdout.
2. Retain CROSS_6 and BOOKS3PLUS_CROSS6 only as forward-validation candidates. Do not retune their definitions after seeing 2025.
3. Require prospective 2026 observations under the same definitions before considering any production rule.
4. Continue to treat recorded open-to-market movement as a research proxy rather than timestamped intraday steam.
5. Public-ticket / RLM-vs-public / resistance hypotheses remain untested until verified historical ticket percentages exist.
6. No normal-volume production and no profitability claims.

## Forward validation contract

For 2026 prospective tracking, record every qualifying CROSS6 and BOOKS3PLUS_CROSS6 event available at the chosen pregame snapshot. Keep raw W/L/P counts. Do not drop losses, add filters, alter key definitions, or search new thresholds based on 2026 outcomes. Any later rule redesign starts a new research version and requires a new independent validation sample.
