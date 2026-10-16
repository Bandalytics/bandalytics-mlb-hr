# BANDALYTICS app forecast export handoff — MLB

This folder is the optional **output destination** for real, model-produced, immutable pregame forecast batches. It does NOT change model training, frozen production artifacts, or existing GitHub Actions pipelines.

- File location: `exports/bandalytics/ready/<unique_batch_id>.json`
- Contract: see the private app repository `Bandalytics/bandalytics-private-app/imports/model-feeds/README.md`.
- Export only independently verified player/game projections, timestamps, game/player identifiers, version and genuine source SHA-256; keep unavailable fields null. No fake examples, no forced bets, no odds substitution.
- Do not overwrite existing batch files. Duplicate or changed forecast IDs will be rejected by the receiving importer.
- Once exports exist, the app's manually authorized **BANDALYTICS sync model repository forecasts** workflow can fetch them, validate them and optionally import them to the protected app DB.
- **PUBLIC REPOSITORY WARNING:** Do not place private model data, sensitive source files, sportsbook API keys, user details, or restricted forecasts here. Use the private app repository or another private repo for nonpublic exports.

There are deliberately no invented forecast rows in this folder. Empty state is expected until real model exports are published.
