# index.html in v94

v94 did **not** deploy a handwritten `source/index.html` file.

The deploy input used `build.mjs`, which fetched the v93 flat-routes frontend, copied its hashed assets, patched the page for the v94 identity-safe changes, and wrote the final production file as:

`dist/index.html`

Because that page is a generated build artifact rather than a source input, this handoff includes the exact `build.mjs` used for that generation plus the recovered first-party v94 asset bundle and live `assets-manifest.json` / `integrity.json`.

Do not substitute the daily slate ZIP for this build input.

## v95 direct research UI injection
`build.mjs` now hashes and injects `direct-research-ui.js` after `identity-hardening.js`. The module is intentionally independent of `P`, v37 scoring, qualification, Final Pool, and ticket code.
