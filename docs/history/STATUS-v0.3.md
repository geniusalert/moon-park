# Moon Park — delivery status

Updated 11 November 2026 · Build 0.3

## Latest milestone completed

- Extended every sampled horizon ray to 180 km using a regional NASA LOLA terrain crop.
- Replaced coarser-grid observer ground with bilinear native 5 m terrain at unchanged coordinates; corrections are +0.404, +0.058 and +0.169 m for Site01/04/11.
- Refined azimuths from 1° to 0.25° and radial samples to 5 m near the observer, 20 m to 12 km and 120 m beyond.
- Computed frame-matched SPICE Sun/Earth observations at 2/5/10 m. All geometry uses DE421/MOON_ME; original Horizons data remain reference observations.
- Cross-checked 186 target/site/time samples. Maximum elevation difference is 0.00001351° (about 0.049 arcseconds); this is a cross-method residual, not absolute accuracy.
- Preserved an 18-case v0.2 benchmark and isolated regional-terrain effects against the corrected local model. Combined availability decreases in 8 cases, by up to 58.17 h; no regional-only sunlight change in these cases.
- Recomputed five scenarios at 1/5/10-minute cadence. Maximum observed aggregate difference is 4 minutes of overlap or 3 minutes of sunlight, under the fixed terrain assumptions.
- Added source-file hashes, height-specific ephemerides, coverage/blocker provenance and regional-vs-local comparisons to the application evidence path.

## Verification

- 17 JavaScript and 10 Python tests pass.
- 32 real-data integrity/sanity checks pass.
- The full cached prepare:science pipeline completes successfully in dependency order. Raw input downloads are skipped when cached.
- Default 63-combination recovery search measured 83 ms in the latest Node run; runtime varies and excludes browser rendering.
- Browser confirmed the regional/local comparison, 180 km coverage metadata, correct frame residuals, and updated obstruction explanation. Receipt download verified schema 3, selected 7 h activity, stress-test/local-comparison fields, and all 21 software-file hashes against current source. Latest preview: preview-v0.3.png.

## Evidence

Read SCIENCE_VALIDATION.md, frame-validation.json, time-convergence.json, terrain-impact.json and validation.json. BUILD_WORKFLOW.md gives reproduction commands. Original build 0.2 notes are retained under history/STATUS-v0.2.md. The interface still supports mission comparison, recovery search, continuous activities, replay, terrain elevation view and JSON receipts.

## Remaining release gates

Spatial/angular convergence and terrain-clone uncertainty are next. Terrain outside 180 km, unresolved ridges, published-ROI candidate validation, eclipse/engineering models and human usability remain open. Full feasibility stays unknown. No deployment has been made.

Run npm start for http://127.0.0.1:4173. Update this log and PROJECT_PLAN.md together at each milestone.
