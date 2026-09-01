# BANDALYTICS v95 Pre-Reset QA — 2026-08-30

Status: READY FOR POST-QUOTA DEPLOY QA

## Locked invariants preserved
- v37 scoring weights/qualification unchanged.
- v74 loader/persistence architecture unchanged.
- ZIP remains production truth.
- Direct mode remains RESEARCH ONLY and has no production scoring hooks.
- Duplicate-name True Pitch Fit requires exact returned MLBAM hitter ID; no-ID/mismatch stays RESEARCH.
- Pool before tickets remains enforced.

## iPhone/Safari acceptance findings addressed locally
- Historical ZIP no longer visually mixes current live Games/Lineups.
- Historical enrichment status shows `Historical replay…` instead of misleading `Finalizing…`.
- Heavy derived tabs are deferred while enrichment is busy: Calibration, Final Pool, Snapshot, Daily Card, Results.
- Historical mode banner explicitly states current live MLB feed is isolated.
- Banner is cleared on new slate reset and also works for historical single-CSV imports.

## Regression status
- Full npm test suite PASS.
- JS syntax PASS.
- Python replay scripts compile PASS.
- Historical market movement: 759/759 exact across 8/26–8/28.
- Sharp Money: 71/71 exact, 0 false positives, 0 misses.
- 8/28 entity identity: 266 entities / 265 display names; both Max Muncys independent.
- 8/26 entity identity: 272 entities / 271 display names; duplicate names remain independent.

## Remaining gated work after Vercel quota reset
1. Build on Vercel with remote frozen v93 source available.
2. Deploy preview and require READY.
3. Run postdeploy-smoke.mjs.
4. Inspect build/runtime errors.
5. Only if all automated checks pass, request one final iPhone/Safari acceptance.
