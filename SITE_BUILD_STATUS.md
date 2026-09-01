# BANDALYTICS v95 Site Build Status

## Current site branch
v94 identity-safe production shell + v95 Direct Feed Lab.

## Site work completed in this checkpoint
- Direct Research upgraded from a small preview inspector into a mobile Direct Feed Lab.
- The hero now exposes the source contract clearly: `ZIP • PRODUCTION TRUTH` and `DIRECT • RESEARCH ONLY`.
- Direct Lab fetches both `/api/direct-preview` and `/api/feed-status` concurrently.
- Added explicit ZIP-optional parity gate cards for Identity, Market, Sharp Money, Profile, Recent BBE, Lineup, Starter, True Pitch Fit, Environment, v37 Scoring, Final Pool and Tickets.
- Added duplicate-name identity audit in the Direct Lab using MLBAM IDs/team display.
- Added direct coverage cards for MLBAM IDs, four-field profile coverage, posted lineups, starter names and Savant sample grades.
- Added `Use ZIP Production` action that returns the user to the production uploader without copying direct research data into model state.
- Direct Lab remains read-only and exposes `scoring_enabled=false` / `model_scoring_changed=false`.
- Static guard now rejects qualification, Tonight HR, Final Pool, pool lock and ticket-builder hooks from the direct research module.

## Automated regression
- Identity Pitch Fit guard: PASS 7/7
- Pitch Fit adapter unit: PASS 7/7
- Market adapter: PASS
- Historical identity resolver: PASS
- Direct normalizer: PASS
- Lens registry: PASS (Sharp Money promoted; 23 research)
- Direct profile adapter: PASS
- Profile API contract: PASS
- Direct state research gate: PASS
- Direct site UI safety: PASS

## Deployment state
- A protected Vercel preview from the prior site checkpoint built successfully.
- A public production deploy is currently blocked only by the Vercel account's 100 API deployments/day quota.
- Quota reset reported by Vercel: 2026-08-30 23:32:43 America/New_York.
- Do not burn additional deploy calls before reset.

## Frozen invariants
- v37 weights and qualification unchanged.
- Pool before tickets unchanged.
- v74 loader/persistence architecture unchanged.
- ZIP remains production scoring truth.
- Direct data remains research-only.
- Missing profile fields remain missing.
- Duplicate True Pitch Fit remains fail-closed unless exact MLBAM identity is proven.

## 2026-08-30 site hardening
- Added a frozen v74 infrastructure regression test. It verifies retries=3, 12s AbortController timeout, CORE batch 24/concurrency 2, Pitch Fit batch 5/concurrency 2, split fallback, and recovery telemetry before and after the identity patch.
- Full site regression suite passes, including exact-ID Pitch Fit guard, direct research UI/API fail-closed tests, direct ZIP parity comparator, and v74 infrastructure invariants.
- Direct mode remains RESEARCH ONLY and cannot create v37 scores, qualifiers, Final Pool entries, or tickets.
- Local rebuild currently depends on fetching the frozen v93 base during build; offline container DNS failure is treated as a build-environment issue, not a site regression. Source/unit/preflight tests remain green.

## Automated post-deploy acceptance gate
- Added `postdeploy-smoke.mjs` so the next preview deployment can be verified without handing basic debugging to the user.
- Smoke gate checks: root HTTP + no-store, immutable hashed direct assets, research-status fail-closed contract, Direct Preview/date, feed-status/date, duplicate Max Muncy ID separation when present, and the locked 8/27 Results regression (7 games / 16 HR / 15 unique batters).
- The smoke contract itself is covered by the local regression suite.
