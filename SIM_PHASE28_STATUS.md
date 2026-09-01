# BANDALYTICS Full Sim — Phase 28

## Added
- Unified joint/SGP research-readiness core combining calibration, chronological holdout, and walk-forward gates.
- `/api/sim-research-readiness` returns one fail-closed readiness decision and the underlying diagnostics.
- Sim Lab Model Health now accepts a replay batch JSON and displays calibration, holdout boundary, fold count, OOS record count, and final SGP readiness state.
- Sportsbook SGP EV remains visually and programmatically blocked unless every research gate passes.

## Next
Persist calibration reports as versioned artifacts and add model/version fingerprints so replay records cannot be mixed across incompatible simulator revisions without an explicit migration.
