# Moon Park — delivery status

Updated 11 November 2026 · Build 0.4

## Latest milestone completed

- Added four selected published terrain realizations per point, derived from co-registered absolute clone surfaces. Perturbations are full within 1.8 km and taper to zero by 2 km; outer terrain remains nominal.
- Added four separate resolution checks per point: coarser/finer azimuth rays, a finer nested radial grid, and 20 m local terrain. There are 24 total variants, each evaluated at supported observer heights.
- Added per-family support counts and sunlight/overlap ranges, conservative rank spans, near-timing-limit flags and recovery ordering by support across tested cases.
- Added activity intervals common to the nominal and all eight tested variants, plus shaded clone-horizon ranges in replay.
- Added a separate direct one-minute study and an explicitly constructed threshold probe. Terrain counts are not interpreted as probabilities.
- Added resumable bounded source downloads, immutable versioned terrain-variant artifacts, browser checksum/context validation and complete evidence export.

## Measured evidence

- The fixed 10-minute benchmark covers 12 scenarios / 36 per-point cases. Requirement pass/fail outcomes remain unchanged relative to nominal.
- Six scenarios have one preferred point, four have no unique preference, and two have no passing choice under the chosen requirements.
- Clone overlap spread reaches 90 minutes in the tested sample; numerical overlap spread reaches 10 minutes.
- The separate one-minute Shackleton case has a four-minute sunlight spread across clones and a three-minute spread across numerical cases. A hypothetical 51 h 45 min darkness limit with zero required Earth overlap passes in 2/4 clones.
- The default recovery search has 42 nominal passes in 63 attempted combinations; all 42 pass the selected clone and numerical cases.
- A default shared activity window starts at 12:50 UTC on 16 November 2026, ten minutes later than the nominal window. A 2 h activity fits every tested case.

## Verification

- 28 JavaScript and 14 Python tests pass (42 total).
- 32 nominal and 38 uncertainty data checks pass (70 total).
- The cached uncertainty pipeline completes successfully, including direct SPICE checks of observer-height corrections and source/variant integrity checks.
- Browser verified live numeric recalculation, keyboard slider labels, rank/support ranges, the one-minute study, the near-limit warning, the horizon band and shared scheduling.
- At 390 px viewport width, document width was 375 px: no horizontal page overflow.
- The browser-downloaded receipt was inspected for eight variants per point, three rank records, shared activity intervals and all 30 recorded source-file hashes matching the current workspace.

## Artifacts

Read UNCERTAINTY.md and uncertainty-validation.json for methods and empirical limits. The prepared terrain artifact is referenced by its content hash from mission-data.json. sample-decision-receipt.json retains a verified browser export. preview-v0.4.png shows the tested stability interface. Prior build notes are under history/.

## Remaining release gates

These are conditional near-field experiments, not full terrain uncertainty or a safety guarantee. Expand ensemble/field coverage, assess unresolved regional relief and spatial convergence more broadly, validate published candidate locations, and gather human usability evidence. Terrain outside 180 km and eclipse/power/thermal/RF engineering remain unmodeled. No deployment has been made.

Run npm start for http://127.0.0.1:4173. Reproduce this milestone with npm run prepare:uncertainty. Update this file and PROJECT_PLAN.md together at each milestone.
