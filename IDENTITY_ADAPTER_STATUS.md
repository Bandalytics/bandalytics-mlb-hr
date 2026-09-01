# BANDALYTICS v95 identity adapter status

## Completed
- Duplicate Pitch Fit client requests are isolated one hitter at a time.
- Duplicate request carries player name, team, MLBAM player_id/hitter_id, starter id and starter name.
- Client accepts Pitch Fit only when returned hitter MLBAM matches expected player_id.
- Persistence schema is `bandalytics-slate-v95-identity-pf` and retains PF identity fields.
- Local `/api/pitchfit` adapter validates MLBAM id + official MLB name + official current team before forwarding an ID-bearing request.
- ID-bearing requests are rejected unless exactly one hitter is supplied.
- Upstream mismatch, multi-player response, or response-name mismatch is rejected.
- Unique-name non-ID requests remain pass-through so frozen Pitch Fit math is untouched.

## Regression
- identity client guard: 7/7 PASS
- adapter unit guard: 7/7 PASS
- direct market adapter: PASS
- 8/28 entity oracle: 266 name+team entities / 265 display names
- historical movement parity: 759/759 calculable rows reproduce legacy implied-probability delta to 2 decimals
- Sharp Money: 71/71 across 8/26-8/28, 0 false positives, 0 misses

## Current infrastructure finding
Vercel function-to-function calls from a new probe to `bandalytics-v42-history.vercel.app` return `508 INFINITE_LOOP_DETECTED`. Browser/external rewrites remain the proven production transport. Because this prevents a trustworthy black-box POST probe from server-side Vercel code, duplicate PF must remain PENDING unless the upstream response is observed to return the exact MLBAM id through a browser/rewrite path or the original v42 `pitchfit.js` source is recovered.

No v37 weights or qualification rules changed.

## Deployment-safety correction
The experimental server-side Pitch Fit adapter is **not an active Vercel API route**. Vercel-to-Vercel function forwarding to the legacy v42 Pitch Fit backend was proven to return `508 INFINITE_LOOP_DETECTED`. The adapter source now lives under `research/pitchfit-adapter.mjs` for unit testing only.

Production/preview routing keeps `/api/pitchfit` as the proven external rewrite to `bandalytics-v42-history.vercel.app/api/pitchfit`. Unique-name batches therefore retain the v74/v94 transport. Duplicate-name requests still include MLBAM ID from the hardened loader, but the frontend accepts a duplicate PF result only if the response explicitly echoes the exact hitter MLBAM ID. If the legacy backend does not prove the ID, that duplicate remains PENDING/RESEARCH. This is intentionally fail-closed.
