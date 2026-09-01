# BANDALYTICS Full Sim — Phase 32

## Added
- Locked deterministic calibration seed policy (`LOCKED_CALIBRATION_V1`).
- Historical calibration replay now ignores caller-supplied seeds and derives the RNG seed from game, protocol, model fingerprint, and selections.
- Ad-hoc research can still opt into caller seeds with `mode: "adhoc"`, but those runs are explicitly labeled with a different seed policy.
- Protocol ID/version are persisted by the replay endpoint itself, not added only by the batch wrapper.
- Replay model fingerprint advanced to strict replay V3 because seed policy is part of the model/replay contract.

## Guardrail
Calibration probabilities are reproducible across reruns and cannot be opportunistically changed by trying different random seeds.

## Next
Add Monte Carlo uncertainty intervals to every joint probability and require calibration edges/EV claims to exceed simulation sampling error before any future market comparison is surfaced.
