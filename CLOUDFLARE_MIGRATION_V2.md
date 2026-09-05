# BANDALYTICS Cloudflare Migration V2

Status: PREVIEW-ONLY. Do not switch production DNS yet.

## Branch
`cloudflare-migration-v2`

This branch is based on the current `game-first-ui-v2` work so it includes the latest mobile app changes, including the corrected archetype/qualification separation and Longshot Profile behavior.

## Cloudflare Pages settings
- Repository: `Bandalytics/bandalytics-mlb-hr`
- Branch for first preview: `cloudflare-migration-v2`
- Build command: `npm run build:cloudflare`
- Build output directory: `dist`
- Root directory: repository root
- Production branch: do not change yet
- Custom production domain: do not attach yet

## Transitional architecture
`Browser -> Cloudflare Pages -> /api/* Pages Function -> current BANDALYTICS Vercel production API`

The frontend build/deploy loop moves to Cloudflare first. Existing API behavior remains behind the transition bridge until route-by-route parity is proven.

## Mobile preview behavior
The Cloudflare build publishes `bandalytics-mobile-v7.html` as `/mobile`.

Locked presentation/logic contracts:
- 5/6 and 6/6 are qualification levels, not user filters.
- Foundation, Pull Power, Barrel Monster, Elite Contact Watch, Longshot Profile, and lineup status remain separate filter concepts.
- Longshot Profile may surface 4/6 profile hitters without market data.
- A qualified longshot still requires verified +700-or-longer HR odds.
- Missing price data must show a price-needed state rather than silently returning no longshot-profile hitters.
- Filters do not make picks.
- My Picks remains user-selected only.
- Profile gates and scoring/ticket locks remain unchanged.

## Cloudflare files
- `cloudflare-postbuild.mjs` writes `_headers` and `/mobile` routing.
- `functions/api/[[path]].js` forwards API calls during transition.
- `functions/slate-cache.js` preserves the existing slate-cache bridge.
- `wrangler.toml` points Pages output to `dist`.
- `test-cloudflare-migration.mjs` guards the migration-specific safety contract.

## First preview acceptance
Before any production cutover verify on a real iPhone:
1. `/mobile` loads with the black/red mobile app.
2. Fixed bottom navigation remains usable through scroll.
3. Slate cards appear immediately enough for app-like use.
4. Profile hydration fills progressively without blanking the board.
5. Filters show archetypes, not standalone 5/6 and 6/6 toggles.
6. Longshot Profile returns 4/6 profile hitters even if price is unavailable.
7. +700 remains mandatory before a longshot is marked qualified.
8. `/api/projected-lineups`, `/api/profile-v38-candidate`, `/api/starter-damage-native`, `/api/environment-native`, `/api/results-identity`, and other required research routes respond through the Cloudflare preview.
9. No old prospective report asset is introduced.
10. Corrected prospective tracker remains v3 architecture.
11. No scoring/ticket promotion is enabled.
12. No production DNS changes.

## Phase 2 after preview acceptance
Port API groups to Cloudflare-native runtime one group at a time. Run response/parity checks against the current production API before moving each route. Do not rewrite all research routes at once.
