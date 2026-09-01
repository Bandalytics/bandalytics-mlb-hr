# BANDALYTICS Full Sim — Phase 26

## Added
- Untouched chronological holdout evaluation for joint/SGP calibration.
- A single date boundary prevents the same date from being split across training and holdout data.
- Protocol coverage report verifies every fixed replay protocol appears on both sides of the split.
- Training calibration is diagnostic only; production eligibility is determined exclusively by the chronological holdout gate.
- CLI (`replay:joint-holdout`) and `/api/sim-joint-holdout` endpoint.

## Guardrails
A model cannot be promoted from strong in-sample calibration alone. Temporal separation and protocol representation must pass, and the existing joint calibration gate must pass on the holdout sample itself.

## Next
Add rolling walk-forward evaluation across multiple chronological folds to detect calibration decay/regime changes instead of trusting one holdout boundary.
