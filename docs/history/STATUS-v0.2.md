# Moon Park — delivery status

Updated 11 November 2026 · Build 0.2

## Implemented

- Real NASA LOLA terrain for Site01, Site04 and Site11. Each source GeoTIFF is approximately 41 MB; native 5 m terrain is resampled to a 20 m analysis grid.
- Reproducible research-point selection, spherical curvature-aware horizons at 2/5/10 m observer heights, blocker distances, coverage metadata, and an elevation preview from actual data.
- Six JPL Horizons observation tables, 4,321 observations each, 10-minute cadence over 14 November–14 December 2026. Source hashes and full request parameters retained.
- Arrival/date/duration/height controls, baseline-delay comparisons, explicit mission constraints, separate Sun and Earth clearance, longest darkness and continuous overlap windows.
- Recovery search across three points, seven extra delays, and up to three observer heights (63 combinations at 2 m). Inspect controls apply a tested alternative.
- Continuous activity scheduling, Sun/Earth replay with physical explanation, terrain elevation view, JSON decision receipt and printable brief action.
- Living plan, research register, seven-step presentation narrative and pilot task sheet.

## Verified

- 14 JavaScript tests and 5 Python tests pass: interval boundaries, spherical chord geometry, disc fractions, source-response parsing, missing-data rejection, separate object azimuths, continuous scheduling and bounded recovery.
- 18 real-data checks pass: terrain/ephemeris hashes, observation cadence, and observer-height horizon monotonicity for all three points.
- Default 63-combination recovery search measured approximately 517 ms on this workstation in Node.js. Browser rendering time is not included.
- Browser confirmed real data loads, arrival-date changes recalculate results, time scrubbing changes geometry, Sun/Earth toggle works, and a recovery option applies observer height.
- Receipt downloaded through the browser and inspected for three results, source provenance and explicitly unknown full feasibility.
- Desktop layout inspected. At 390 px viewport width, horizontal overflow was found and fixed; final document width was 375 px, within the viewport. No human usability study has been conducted.

## Reproducible example

For the selected Shackleton research point, a 72-hour mission beginning 21 November 2026 has 68 modeled sunlight hours at baseline and 20 after a 48-hour delay. Longest modeled darkness changes from 4 to 52 hours. Earth overlap is zero in both cases, so this example is not a transition from fully passing to fully failing. These are provisional local-terrain results, not validated operational predictions.

## Remaining release gates

- Integrate distant regional terrain and refine near-field/angular sampling; current minimum local ray coverage is approximately 7.0–7.4 km and computation stops at 12 km or the map edge.
- Independently reconcile PGDA MOON_ME/DE421 and Horizons MEAN_ME/DE441 frames and validate astronomy with a second implementation.
- Obtain finer observations around transitions, perform 5/1-minute checks and test terrain-resolution convergence.
- Replace uniform angular stress tests with documented terrain-clone ensembles for statistical uncertainty claims.
- Verify published ROI candidate locations, gather human pilot results and produce final presentation assets.

The build reports local-model pass/fail and leaves full feasibility unknown. Higher observer heights reuse 2 m ephemerides; parallax is not recomputed. Eclipse, thermal, RF and electrical power models are absent. Printed output has not been visually inspected. No deployment has been made.

## Evidence and next milestone

See validation.json, preview.png, data/sample-decision-receipt.json and the preparation scripts. Run npm start for http://127.0.0.1:4173. Raw inputs remain in ignored data/raw; prepared compact data is tracked with the app.

Next: regional horizon coverage and independent frame checks. Keep the local research build available while these scientific release gates are completed. Update this file and PROJECT_PLAN.md together at each milestone.
