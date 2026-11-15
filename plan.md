# Moon Park navigator implementation plan



Authoritative transition checklist. Existing research history is in docs/PROJECT_PLAN.md.



## End goal

Select locations → set arrival and requirements → compare → inspect terrain/time evidence → explore alternatives → save the decision.



Mixed audience; local browser and calculation service; custom coordinates 85°S–90°S; mixed terrain detail; arrivals throughout 2027. Preserve the November 2026 demonstration separately. Evaluate modeled Sun/direct-Earth visibility, not complete landing feasibility. Whole-Moon measured terrain coverage, public hosting, accepted photo registration, hazards, thermal/RF/electrical engineering and operational certification are deferred.



## Challenge mapping

| Capability | Implementation |

|---|---|

| Site selection/comparison | N1 prepared catalogue, N2–N3 custom polar coordinates |

| Date/time flexibility | N4 UTC and 2027 computation |

| Sun/Earth positions and events | Existing engine, N4 and N6 |

| Power and communication assessment | N10 solar-elevation and ideal horizontal-surface geometric projection; separate direct Earth windows and set countdowns. No watt or RF prediction |

| Maps/terrain/replay | Existing assets, N6 unified selection state |

| Alternatives after delay | N5 bounded search |

| Accessible interpretation | N1, N6, N10 plain-language operational summary and actual-user N9 |

| Evidence/reproduction | N0, N7 and N8; N10 metrics also appear in the brief |



## Milestones



### [x] N0 — Establish the navigator baseline



Status: Complete



Deliverable and acceptance: Challenge mapping, preserved 0.12 reference and clean status documents.



Acceptance checklist:

- [x] Preserve 0.12 archive, source identities and recorded outputs.

- [x] Map challenge capabilities to features, milestones or deferrals.

- [x] Clean status encoding and make this checklist primary.



Completion date: 12 November 2026

Evidence: [baseline](docs/navigator-baseline.json), challenge mapping above, preserved 0.12 archive.

Dependencies/limits: Follow milestone order; preserve source identities and scientific limits.



### [x] N1 — Unified selection and comparison



Status: Complete



Deliverable and acceptance: Pin up to three of 30 prepared points, compare scenarios and inspect results in one screen.



Acceptance checklist:

- [x] One map/catalogue flow for benchmarks and interior samples, maximum three pins.

- [x] Baseline/revised sunlight, Earth, combined hours, longest darkness and continuous overlap.

- [x] Optional evidence area and explicit loading/error/unavailable states.



Completion date: 12 November 2026

Evidence: [verification log](docs/navigator-verification.md), [navigator tests](tests/navigator.test.js).

Dependencies/limits: Follow milestone order; preserve source identities and scientific limits.



### [x] N2 — South-pole terrain coverage



Status: Complete



Deliverable and acceptance: Verified 5/20/240 m coverage for 85–90 S and complete 180 km rays; missing data rejected.



Acceptance checklist:

- [x] Acquire adjusted LOLA 20 m and 240 m native crops covering the cap plus horizon buffer.

- [x] Catalogue projection, frame, vertical reference, source hashes and missing masks.

- [x] Use verified 5 m sources where available; 20 m near-field and 240 m distant terrain.

- [x] Verify multiple longitudes, exact pole, cap boundary and a 5/20 m seam; reject unsupported coverage.



Completion date: 12 November 2026

Evidence: [terrain catalogue](docs/navigator-terrain-catalogue.json), [cap checks](docs/navigator-custom-verification.json), [5/20 m seam checks](docs/navigator-seam-verification.json)

Dependencies/limits: Follow milestone order; preserve source identities and scientific limits.



### [x] N3 — Custom coordinate calculations



Status: Complete



Deliverable and acceptance: Local queued Python worker, cancellation, cache identity, two verified points outside fine terrain.



Acceptance checklist:

- [x] Exact coordinates and 2/5/10 m nominal worker results; no snapping or inherited clone claims.

- [x] One active job, queue position, progress, cancellation and retry.

- [x] Separate source-aware horizon/observation caches outside static files.

- [x] Two outside-local-terrain points verified through UI; cache reuse and missing/changed-source failures.



Completion date: 12 November 2026

Evidence: [real job/cancellation/cache checks](docs/navigator-custom-verification.json), [worker negative tests](tests/test_navigator.py), [browser log](docs/navigator-verification.md)

Dependencies/limits: Follow milestone order; preserve source identities and scientific limits.



### [x] N4 — 2027 dates and visibility events



Status: Complete



Deliverable and acceptance: UTC 10-minute inputs; 1–168 h duration; 2027 seasons and year boundary; bracketed events.



Acceptance checklist:

- [x] UTC ten-minute grid without rounding; duration 1–168 h and initial delay 0–72 h.

- [x] On-demand observations include full mission and 72 h recovery search.

- [x] January, June and latest December arrival verified through 14 January 2028 endpoint.

- [x] Current elevations, clearance, visibility and next-event brackets distinguish hidden/no-event states.



Completion date: 12 November 2026

Evidence: [season and latest-endpoint checks](docs/navigator-custom-verification.json), [sampled event tests](tests/navigator.test.js)

Dependencies/limits: Follow milestone order; preserve source identities and scientific limits.



### [x] N5 — Understandable alternatives



Status: Complete



Deliverable and acceptance: Requirement explanations, continuous activities and ranked bounded recovery with ties.



Acceptance checklist:

- [x] Explain each failed visibility and separate continuous-activity requirement.

- [x] Search pinned locations over extra 0–72 h in 12 h steps; opt-in other heights.

- [x] Rank passing choices by delay, continuous window and overlap; preserve ties.

- [x] A failing requirement leads to a passing tested choice that can become a new arrival.



Completion date: 12 November 2026

Evidence: [recovery tests](tests/navigator.test.js), [browser recovery check](docs/navigator-verification.md)

Dependencies/limits: Follow milestone order; preserve source identities and scientific limits.



### [x] N6 — Synchronized visual explanation



Status: Complete



Deliverable and acceptance: Map, terrain, horizon, trace and replay remain consistent; desktop and 390 px checks.



Acceptance checklist:

- [x] Map marker, terrain, horizon, timeline and sampled witnesses update together.

- [x] Custom display terrain and calculation resolution are distinguished.

- [x] Historical imagery availability/alignment labels; guided recorded example.

- [x] Keyboard replay and complete 390 px comparison flow, with textual equivalents.



Completion date: 12 November 2026

Evidence: [browser verification](docs/navigator-verification.md), [390 px screenshot](docs/navigator-mobile.png).

Dependencies/limits: Follow milestone order; preserve source identities and scientific limits.



### [x] N7 — Reproducible workspace



Status: Complete



Deliverable and acceptance: Versioned save/restore, source checks, readable brief and machine-readable evidence.



Acceptance checklist:

- [x] Readable brief and source-identified machine-readable comparison.

- [x] Local persistence/reset and explicitly versioned workspace format.

- [x] Restore matching settings by recomputation; reject changed identities.

- [x] Retain historical research receipts without rewriting their schema.



Completion date: 12 November 2026

Evidence: [release verification](docs/navigator-package-verification.json), [browser and regression log](docs/navigator-verification.md).

Dependencies/limits: Follow milestone order; preserve source identities and scientific limits.



### [x] N8 — Integrated release



Status: Complete



Deliverable and acceptance: Regression/data checks, measured resource use, fresh installation and custom calculation.



Acceptance checklist:

- [x] Regressions, custom locations, boundaries, recovery and cache/cancellation checks.

- [x] Measure new/cached computation time and peak memory on this machine.

- [x] Package code/prepared assets; document optional large downloads and setup.

- [x] Fresh extraction opens demo, provisions custom sources, calculates, compares and exports.



Completion date: 12 November 2026

Evidence: [release verification](docs/navigator-package-verification.json), [browser and regression log](docs/navigator-verification.md).

Dependencies/limits: Follow milestone order; preserve source identities and scientific limits.



### [ ] N9 — Actual-user evaluation



Status: Blocked



Deliverable and acceptance: Five participants, five unaided interpretation tasks; target four of five successful.



Acceptance checklist:

- [ ] Five actual participants attempt all five interpretation tasks without coaching.

- [ ] Record correctness, assistance, time and misconceptions; target four of five fully successful.

- [ ] Retain failures and document fixes/retests without fabricated records.



Completion date: —

Evidence: —

Dependencies/limits: Actual participants unavailable; zero human sessions. Does not block N8.



### [x] N10 — Operational lighting and communication cues



Status: Complete



Deliverable and acceptance: Make the challenge’s power-generation and direct-to-Earth questions understandable at the point and time being inspected, while preserving the geometry-only limits.



Acceptance checklist:

- [x] Comparison shows total and longest continuous Sun windows separately from Earth windows and simultaneous overlap.

- [x] Each pinned point shows signed Sun, direct-Earth, shared-window and peak-elevation changes caused by the schedule shift.

- [x] Add a plain-language trade-off readout and make clear that revised status includes the continuous-activity requirement; label hours and degrees separately.

- [x] Explain that entered limits and example defaults are user-selected geometric filters, not official mission requirements or a landing go/no-go.

- [x] Peak solar elevation is compared between original and revised arrivals.

- [x] Replay shows terrain-screened solar visibility and an ideal horizontal-surface direct-beam projection, explicitly not electrical output.

- [x] Replay shows a countdown range and UTC bracket for the next sunset/sunrise and Earthset/return of Earth visibility.

- [x] Direct Earth visibility is described as geometric line of sight, not an RF link.

- [x] Keyboard replay exposes the selected UTC sample and Sun/Earth visibility state to assistive technology.

- [x] Exported brief and onboarding explain those metrics in accessible language.



Completion date: 13 November 2026

Evidence: [requirements mapping](docs/MISSION_PLANNING_REQUIREMENTS.md); [objective verification](docs/navigator-objective-verification.md).

Dependencies/limits: Finite-resolution terrain and ten-minute samples. Panel pointing, slope, hardware, thermal effects, eclipses and RF performance remain outside the model.



## Objective completion extension — 13 November 2026



Detailed gap audit, resource roles, implementation approach and acceptance gates: [Objective completion plan](docs/OBJECTIVE_COMPLETION_PLAN.md).



Execute N10 → N11 → N12 → N13 → N14, then complete N9 with real participants when available. Existing N0–N8 completion records refer to the retained 0.13 scope.



### [x] N11 — Geographic context and resource provenance

Status: Complete

Deliverable: oriented polar map, source-linked location descriptions, verified mission-context entries and external exploration links.

Complete when: coordinate/map agreement, traceable entries and unsupported-coverage explanations meet the detailed acceptance gate.

Completion date: 13 November 2026

Evidence: [objective verification](docs/navigator-objective-verification.md)

Dependencies/limits: N10; no inherited results for named or out-of-cap sites.



### [x] N12 — Visual trade-offs and bounded date exploration

Status: Complete

Deliverable: comparison bars, explicit requirement margins and inspectable date/point sweep using existing bounded recovery calculations.

Complete when: displayed cells reproduce scenario calculations, unavailable cases are explicit and applying an arrival preserves synchronized state.

Completion date: 13 November 2026

Evidence: [objective verification](docs/navigator-objective-verification.md)

Dependencies/limits: N10/N11; tested choices only, no global-best claim.



### [x] N13 — Guided temporal explanation

Status: Complete

Deliverable: playback/event navigation, labeled axes/time bounds, progressive explanations and keyboard/mobile equivalents.

Complete when: all views stay synchronized, sampled event navigation is correct and accessible workflows pass.

Completion date: 13 November 2026

Evidence: [objective verification](docs/navigator-objective-verification.md)

Dependencies/limits: N12; reduced motion and ten-minute event brackets.



### [x] N14 — Scientific and integrated release evidence

Status: Complete

Deliverable: representative custom-point reference checks, sampling evidence and a freshly extracted versioned release with objective traceability.

Complete when: detailed scientific/software checks and full installation-to-export workflow pass with dated evidence.

Completion date: 13 November 2026

Evidence: [objective verification](docs/navigator-objective-verification.md)

Dependencies/limits: N10–N13; independent review and actual users remain separate.



### [x] N15 — Integrated Moon and scenario inspection



Status: Complete

Deliverable: NASA-textured Moon globe with coordinate selection and historical Apollo context, curated supported polar destinations, original/revised inspection, seasonal and alternative previews in the shared globe/terrain/horizon/timeline, live elevation/clearance metrics and observer-direction terrain rays.



Acceptance checklist:

- [x] Globe coordinates round-trip correctly; context sites cannot request unsupported calculations.

- [x] Supported curated points calculate their own coordinates and retain source descriptions.

- [x] Original/revised selection changes every inspection panel and the sampled UTC interval together.

- [x] Seasonal/alternative previews use their own result, terrain and settings without applying their arrival to pinned comparisons.

- [x] Return, cancellation, configuration changes and workspace restoration leave no stale inspection state.

- [x] Desktop/mobile layouts, source identities, asset packaging and regression checks pass with retained evidence.



Completion date: 13 November 2026

Evidence: [integrated navigator report](docs/INTEGRATED_NAVIGATOR.md), [browser and test checks](docs/navigator-integration-verification.json), [exact coordinate calculations](docs/navigator-integration-calculations.json)

Dependencies/limits: Global visual texture is contextual, with coarse polar albedo fill. Calculations remain 85–90°S; historical Apollo entries are context only. Seasonal previews remain temporary. Real-human N9 remains blocked.



### [x] N16 — Mission catalogue and global comparison



Status: Complete

Deliverable: sourced Apollo/CLPS/commercial/international catalogue, published-coordinate and region-reference distinctions, global custom coordinates, explicitly separate reference-sphere calculations, and side-by-side/sequential site comparison.



Acceptance checklist:

- [x] Requested mission groups are searchable with sources, operators, status and coordinate meaning.

- [x] Unpublished coordinates never become zero-valued points; regional references are not presented as exact targets.

- [x] Real global Sun/Earth jobs preserve coordinates and identify the reference-sphere model; measured polar terrain remains a separate model without silent fallback.

- [x] Side-by-side and sequential comparisons agree with underlying results, including unavailable columns and continuous-activity failures.

- [x] Mixed model differences remain visible and alternatives require a common model.

- [x] Global custom entry, source-aware caching, cancellation, replay, exports and restore work in the local app.

- [x] Reference checks, desktop/mobile workflows, fresh-package tests and source identities pass with evidence.



Completion date: 13 November 2026

Evidence: [catalogue guide](docs/MISSION_CATALOGUE.md), [browser/package verification](docs/mission-catalogue-verification.json), [global calculations](docs/mission-global-verification.json), [polar integration](docs/mission-polar-integration.json).

Dependencies/limits: Global screening assumes a 1737.4 km smooth sphere, zero reference elevation and observer height above that radius. No mountains, craters or actual surface elevation outside the measured polar mode. Arrival year remains 2027. No landing-safety, electrical-power or RF certification; N9 still requires real participants.



### [x] N17 — Airless horizon and solar elevation integration



Status: Complete

Completion date: 13 November 2026

Deliverable: connected airless geometry panel, dashed local-horizontal reference on the horizon view, prominent elevation/disc/projection metrics synchronized with replay, and shared projection summaries in comparisons and exports.



Acceptance evidence: [integration report](docs/AIRLESS_SOLAR.md), [83 passing JavaScript tests](docs/airless-integration-tests.tap), 51 passing Python tests including curved horizon/refraction rejection, and [live view](docs/airless-solar-integration.jpg).

Limitations: centre-ray horizontal projection is a geometric reference, not disc-integrated irradiance or electrical output. Global sphere mode omits actual terrain. Prepared examples retain their original sampling; no new scientific accuracy claim. This is a source update after the preserved 0.16 archive; no replacement release is asserted.



### [x] N18 — Rapid operational comparison and lunar explanation



Status: Complete

Completion date: 13 November 2026

Deliverable: linked schedule-impact cards; arrival-based Sun/Earth change brackets in each comparison column; signed total/continuous deltas, changed samples and skyline/elevation pair explanations; replay-linked low-Sun shadow illustration and atmospheric context; saved schedule-impact evidence.



Acceptance: 86 JavaScript tests pass. Browser verified three prepared sites, fail/pass differences, arrival countdowns, relative-time change witnesses, live shadow updates, no console errors and a 390 px viewport without page overflow. Evidence: [report](docs/SCENARIO_INSIGHTS.md), [tests](docs/scenario-insights-tests.tap), [screen](docs/rapid-scenario-insights.jpg).

Limitations: pair comparisons do not establish spatial uncertainty or causal attribution. Shadow graphic is an ideal flat plane, not terrain ray tracing or an Earth forecast. Missing data remains unavailable; no operational feasibility claim. Preserved release archives are unchanged.



### [x] N19 — Topography and orbital-dynamics inspection



Status: Complete

Completion date: 13 November 2026

Deliverable: measured display relief/slope summaries; switchable true-scale shaded relief, fixed-band display slopes and patch-relative elevation colors; replay-linked Earth elevation, clearance, range and unwrapped azimuth changes with explicit ephemeris/orientation explanation. Original measured terrain horizon worker remains authoritative.

Acceptance: 88 JavaScript tests pass; browser verified all three appearance modes, live Earth hidden/visible changes, no console errors and 390 px layout without overflow. [Evidence](docs/TERRAIN_DYNAMICS.md), [tests](docs/terrain-dynamics-tests.tap), [screen](docs/terrain-dynamics.jpg).

Limitations: slopes are projected display-grid diagnostics, not native-resolution hazard slopes. Patch relief is not crater depth. Surface shading is not a terrain shadow map or permanent-shadow assessment. Global reference sphere omits terrain. No new source acquisition, independent scientific validation or packaged release is claimed.



### [x] N20 — Consistent palette and terrain presentation



Status: Complete

Completion date: 14 November 2026

Deliverable: restored original charcoal/sage/gold UI palette, sage Earth directions across the main navigator, coherent terrain elevation scale, slope legend generated from the rendering palette, unlit quantitative overlays, improved terrain framing, expandable methods and sticky location controls.

Acceptance: 90 JavaScript tests pass; browser verified slope legend, all controls, no console errors and 390 px viewport without overflow. [Visual evidence](docs/terrain-visual-polish.jpg). Scientific calculations unchanged. This is a local source update, not a new packaged release or production-readiness certification.



### [x] N21 — High-resolution lunar atlas and visual observatory



Status: Complete

Completion date: 14 November 2026

Deliverable: offline-bundled NASA 8K imagery with progressive 2K fallback, anisotropic texture filtering, coordinate graticule, zoom controls, marker toggle, numbered pinned-site labels, cursor coordinates and texture-resolution status. Synchronized azimuth compass with mission arcs, availability dials and replay countdown cards.

Acceptance: 92 JavaScript tests pass. Browser confirms 8K texture loaded, controls, replay bearings/countdowns, no console errors, and 390 px layout without overflow. [Report](docs/VISUAL_ATLAS.md), [atlas](docs/visual-atlas-desktop.jpg), [observatory](docs/visual-observatory-desktop.jpg).

Limits: imagery is visual context with coarse polar fill, not calculation terrain; 8K is image dimensions, not metre-scale terrain accuracy. Compass shows azimuth only; dials show total availability, not continuous duration. Existing scientific calculations, participant status and archives remain unchanged.



### [x] N22 — Additional 3D scenario modes



Status: Complete

Completion date: 14 November 2026

Deliverable: sky-dome skyline view, observer-facing Sun, observer-facing Earth and full-mission celestial tracks. Modeled angles, height-specific horizon, selected scenario, replay time and visibility status share the existing results. Cardinal/body labels, manual orbit/pause, reset, reduced-motion stepping and missing-WebGL fallback included.

Acceptance: 92 existing JavaScript tests remain passing. Browser exercised all modes, orbit/pause/reset, last-sample synchronization, no console errors and 390 px layout without overflow. [Screenshot](docs/sky-simulator.jpg). UI verification does not constitute independent scientific validation.

Limitations: sky diagram uses common illustrative radial distances and enlarged markers; no photorealistic landscape, true body angular sizes or terrain shadow map. Curtain denotes sky below the horizon to -40°, not a terrain surface. Changed scenario/time stops camera orbit. Preserved archives unchanged.



## Architecture and defaults

Retain JavaScript mission engine and Python scientific routines. Shared location/scenario/selection state. Up to three pinned locations; baseline/revised scenarios; heights 2/5/10 m; delay 0–72 h; activity duration separate from total overlap. Custom coordinates are not silently snapped. No clone evidence transferred to custom/interior points.



Loopback Node service with coverage, analysis-job creation/status/cancellation/results. Fixed Python worker invocation with structured input; one active job. Generated data outside static tree. Source-aware horizon cache separate from observations. Record data/software identities and invalidate changed sources. UTC inputs on 10-minute grid without silent rounding. Complete observations through mission/recovery endpoint. Pole uses documented reference meridian. Bracket visibility transitions; never extrapolate beyond data.



Recovery: pinned points, extra delays 0–72 h in 12 h steps, current height unless explicitly expanded; passing scenarios ordered by least extra delay, longest continuous combined window, then total overlap. Preserve ties; no global-best claim.



## Required checks

- Retained November 2026 outputs and 0.12 archive.

- Fine/regional terrain, seams, missing support and complete ray coverage.

- Map/input coordinate agreement, longitude wrap and exact pole.

- 2027 seasons/year boundary and full delayed mission coverage.

- Always-visible/hidden, multiple/no transition and half-open bins.

- Continuous activity versus scattered total overlap.

- Cancelled/stale jobs, changed sources and cache reuse.

- Export/restore source identities; desktop and 390 px interpretation.



## Completion policy

Only tick a milestone after its acceptance criteria pass, with date and evidence link. Record partial work and external blockers explicitly. N8 completes the local software scope; N9 requires actual users. Independent scientific review remains separate. After each milestone update this file and docs/STATUS.md; keep historical records. N10 extends the completed N8 software scope and does not change N9’s human-participant requirement.



- 14 November 2026 — F10 and F60 implemented for the supported visibility models. See the [functional audit and year-boundary calculation](docs/FUNCTIONAL_AUDIT.md#extended-duration-and-visibility-acceptance-14-november-2026).



- Engineering assumptions connected to scenario inspection and workspace persistence. Numerical unit checks and repeatable frame/cadence verification added. See docs/SCIENTIFIC_ACCURACY_AUDIT.md for remaining acceptance gaps.



- Added experimental spherical Earth eclipse option and nine benchmark/date horizon sensitivity cases. Independent eclipse validation, geographic uncertainty propagation and interactive acceptance remain open in docs/SCIENTIFIC_ACCURACY_AUDIT.md.



- 14 November 2026 — Scientific implementation expanded with selectable real one-minute observations, position/elevation sensitivity jobs, seasonal SPICE/Horizons and cadence reports, historical eclipse occurrence check, storage/load dynamics and transient lumped thermal calculation. Scientific assumptions and engineering results export with the workspace. Authoritative unknown-frame metadata, Diviner/regolith validation, broader terrain-domain coverage, battery temperature derating and independent review remain open. See docs/SCIENTIFIC_ACCURACY_AUDIT.md.



### [x] N23 — Scientific source and workflow acceptance

Status — Complete within the acceptance scope below.
Completion date — 14 November 2026.

- [x] Attach authoritative frame evidence to 20 NASA catalogue coordinates and two USGS LOLA 2011 regional references.
- [x] Verify source support at 76 coordinates with sampled 180 km rays and four-neighbour validity checks.
- [x] Acquire measured Diviner bins and publish a bounded comparison with the pinned regolith reference model, including residuals and mismatched physical assumptions.
- [x] Complete all six real terrain uncertainty jobs through the browser, cancellation/retry, export, restoration and re-export parity.
- [x] Reject a receipt with altered source identities.
- [x] Run 103 JavaScript and 51 Python regression tests.

Evidence — [Scientific acceptance report](docs/SCIENTIFIC_ACCEPTANCE.md).

Remaining scientific dependencies — measured spacecraft material/hardware calibration, pixel-specific regolith validation, broader terrain accuracy measurements and independent scientific review. N23 completes the stated source checks and tested software workflow. N9 retains its actual-human-participant requirement.

### [x] N24 — Hardware thermal calibration workflow

Status — Complete for the software workflow.
Completion date — 14 November 2026.

- [x] Share the thermal integrator between mission estimates and component-test comparisons.
- [x] Import identified component/sensor measurements with boundary conditions and explicit units.
- [x] Fit uncertain properties using calibration runs and evaluate reserved validation runs separately.
- [x] Report errors, sensor uncertainty, numerical refinement, candidate-grid boundaries and mission extrapolation.
- [x] Apply fitted properties deliberately and export/recompute identified studies on restoration.
- [x] Reject altered measurement inputs and discard forged imported pass flags.
- [x] Verify analytical synthetic fixtures and browser cancellation/retry, application, export and restoration.

Evidence — [Hardware thermal validation](docs/HARDWARE_THERMAL_VALIDATION.md) and [verification receipt](docs/hardware-thermal-verification.json). 108 JavaScript and 51 Python tests passed. Synthetic test data were cleared after verification.

### [ ] N25 — Physical hardware temperature validation

Status — Blocked pending actual component measurements.
Dependency confirmed by the user — No hardware measurements are available.

Acceptance requires real identified component/sensor test records, independently reserved validation runs, agreed error limits and assessment of test-to-mission applicability. Synthetic cooling results and Diviner surface comparisons do not satisfy this gate. Spacecraft temperature accuracy remains unvalidated.


### Visual workflow refinement — 2026-11-14

- Added three progressive setup menus: location → arrival/stay → review and explicit Write action.
- Preserved the scientific timeline, metrics, event brackets, source evidence, exports and detailed views; added shared replay across five visual tabs.
- Replaced the fixed south-polar locator with a geographic azimuthal-equidistant map centered on the selected point, using the 1737.4 km reference sphere and 100/250/500 km distance rings. At a pole the selected longitude sets the tangent orientation. This display adds no terrain coverage or scientific accuracy claim.
- Added a calculated horizon scene and per-scenario maps/visibility strips to site and two-date comparison cards. Elevation scaling and illustrative object sizes are labeled.
- Moved optional external resources and imagery legend to the end of setup. Removed duplicated cadence/eclipse inputs so the displayed controls configure the calculation.
- Browser acceptance and evidence are recorded in `docs/VISUAL_WORKFLOW.md`. Human interpretation study remains outstanding.


### Capability preservation correction — 2026-11-14

- Custom coordinate fields made directly visible in location setup, with persistent location-entry shortcuts; progressing opens the next step without automatically closing earlier steps.
- Restored Whole Moon, South pole and Focus selected location camera actions.
- Made workspace import/restoration accessible with an empty selection; export remains dependent on a selection.
- Compared the current control IDs with the preserved 0.16 interface. All former non-demonstration controls are present; the explicitly retired Recorded example entry remains historical rather than a new default scenario.
- Timeline, replay, custom calculations, mission catalogue, comparison modes, seasonal comparison, uncertainty, engineering, evidence and export capabilities are retained. This correction concerns discoverability and access.


### Terrain loading repair — 2026-11-14

- Reproduced the reported Site01 grid-west terrain calculation and confirmed real result/3D rendering.
- Added job-stage progress, cancel/retry, honest waiting/failure text and result-dependent inspection panels.
- Corrected stale pending/completion cleanup for superseded custom jobs; retained all visual/scientific options.
- Nine targeted checks passed; cold nearby-coordinate cancel/retry completed in browser. Evidence: `docs/VISUAL_WORKFLOW.md`.


### AI planning integration — 2026-11-14

- [x] Added a text/image planning box while retaining all manual controls.
- [x] Added server-only Meta Model API configuration and legacy Meta Llama compatibility, bounded multimodal input, same-origin routes and credential file protection.
- [x] Added schema validation and allowed actions for calculation, comparison, bounded site/arrival search, inspection, explanation and clarification.
- [x] Connected execution to the existing engine, queue, comparisons, alternative grid and synchronized visual views; added cancellation and undo of AI settings.
- [x] Passed 22 targeted checks, including mocked provider/image requests and retained navigator regression. The browser fixture uses scripted interpretation with real scientific jobs.
- [ ] Live Meta text/image acceptance with the user's key. The key is not configured; no live provider or vision accuracy claim is made.
- Evidence and setup: `docs/AI_PLANNER.md`. Existing scientific/human validation limitations remain open.


### Simulate: supplied-model landing visualization — 2026-11-14

- [x] Preserved and catalogued the user-supplied Moon and Apollo GLB assets; bundled local glTF and Draco dependencies.
- [x] Added a separate Simulate visual tab/header entry with deterministic approach-to-touchdown playback, pause/reset/seek, speed, camera modes and full screen.
- [x] Connected selected-site context and optional calculated Sun lighting; retained independent scientific mission replay and all existing planning controls.
- [x] Labeled compressed scale, unregistered model terrain, illustrative telemetry/effects and omitted flight dynamics.
- [x] Passed 21 targeted checks and inspected actual imported models, touchdown, final-descent seeking and hidden-view pause behavior in the browser.
- Evidence, asset identities and scientific limits: `docs/LANDING_SIMULATION.md`, `data/models/manifest.json`.


### Simulate: live selected-site environment — 2026-11-15

- [x] Connected the calculated site, observer height and sampled mission UTC to the landing view, retaining all existing planning and supplied-model controls.
- [x] Added a separate native-detail NASA LOLA landing display patch (5/20 m where valid), curved local transforms, actual mesh height placement and source/resolution disclosures. Global reference-sphere results stay smooth and explicitly omit terrain.
- [x] Added Sun/Earth symbols, solid/dashed fixed-observer visibility guides, calculated angular-horizon outline, compass, numerical sky state and context/facing cameras.
- [x] Added mission-condition replay synchronized with the existing timeline while preserving the independent illustrative descent clock.
- [x] Passed 133 JavaScript and 12 Python checks; exercised a real terrain calculation and desktop/390 px renderer flow. Evidence: `docs/LANDING_SIMULATION.md`.
- Limits retained: no solved spacecraft trajectory, altitude-dependent visibility, registered photographic surface, hazard assessment or landing certification. Existing scientific/hardware/human validation gates remain unchanged.


### Unified Moon environment — 2026-11-15

Status — Complete on 2026-11-15 for this visual integration; scientific, hardware and human-validation gates remain unchanged.

- [x] Moved globe / calculated Earth-Sun environment / landing playback into one shared-canvas workspace; removed the header simulation shortcut and separate landing tab.
- [x] Preserved the supplied Earth/Sun assets and source identities; reused model loading and lazy Apollo/optional Moon loading.
- [x] Added up to three synchronized site panels with exact UTC matching, independent surfaces, metrics, requirement failures and unavailable states.
- [x] Added close camera framing, regolith grain and an inspection light; kept measured geometry and reference-sphere limitations intact.
- [x] Passed 138 JavaScript checks.
- [x] Completed desktop / 390 px browser acceptance: three actual site results, one shared primary canvas, body models, independent metrics, animated touchdown, synchronized mission UTC, keyboard site selection and saved-workspace recalculation. Evidence images and details are in `docs/UNIFIED_3D.md`.

Evidence and limits: `docs/UNIFIED_3D.md`.


### V2 experiment — 3D-first mission observatory — 2026-11-15

Status — Complete for the experimental V2 interface on 2026-11-15; the current interface remains preserved. Scientific, hardware and human-validation gates remain unchanged.

- [x] Added a separate `/v2/index.html` entry and isolated UI files; retained current application hashes in `v2/baseline.json`.
- [x] Retained all existing controls and shared the calculation service, data and assets; isolated V2 browser storage.
- [x] Added a full-viewport 3D scene with left planning/locator panels, right metrics/actions and a 70/30 horizon/timeline bottom dock.
- [x] Added panel toggles, camera-following locator, exact-sample chart interaction and responsive drawers/compact comparisons.
- [x] Verify real calculations, changing locations/times, simulation/comparison, saved restoration and keyboard/narrow-screen workflows; retain the earlier integration artifacts and document the current iteration's specific checks and limits.
- [x] Record final evidence and confirm current-version preservation: `v2/evidence/ACCEPTANCE.md`; 147 passing JavaScript checks including the original-file hash gate.
- [x] Add offline stage guidance and a contextual Meta AI guide that explains without executing operations; retain the separate planning assistant for execution.
- [x] Add prominent mission Play/Pause, timeline drag/wheel scrubbing, resizable charts and legible close-view markers. Retain custom coordinates and all scientific controls while removing the redundant visible introduction/shortcut row.

Scope and use: `v2/README.md`. Existing scientific, hardware and human-validation gates remain unchanged.

### V2 guided decision workflow — 2026-11-15

Status — Complete for the nine software/UI items on 2026-11-15. Evidence and verification limits: `v2/evidence/DECISION_WORKFLOW.md`. Original application hashes and scientific identities are preserved; scientific, hardware and real-user validation gates are unchanged.

- [x] U1 — One header AI assistant beside V2 · Observatory: conversational help and planning tabs; remove scattered question-mark controls and repair the upload/automatic-run layout.
- [x] U2 — Explicit custom-coordinate entry and accessible multi-site selection; wide side-by-side/sequential comparison using real existing results.
- [x] U3 — Prominent sampled sunset/Earthset countdowns, including hidden/no-event/end-of-interval states.
- [x] U4 — Highlight current solar elevation and separate sunlight/Earth/shared windows without equating geometry to electrical power.
- [x] U5 — Larger readable locator with expansion/scale controls, connected 2D/3D views and source/model distinctions.
- [x] U6 — Rapid comparison summaries, schedule changes, failures and tested-alternative access without stale results.
- [x] U7 — Visible real calculation stages, stage progress, queue state and cancellation; never invent a whole-job percentage or ETA.
- [x] U8 — Visual airless-Moon explanation and sampled shadow-length teaching comparison with its limits.
- [x] U9 — Explain tested location/date differences through actual clearance, distance, metric changes and source scope; verify desktop and phone flow and record evidence.

### V2 scene-first shell — 2026-11-15

Status — In progress: implementation and automated checks pass; final responsive browser acceptance is pending an unlocked Windows desktop. Evidence: `v2/evidence/SCENE_FIRST.md`.

- [x] E1 — Full-viewport globe, compact input-only sidebar and edge collapse control; preserve custom coordinates, mission catalogue and calculation settings.
- [x] E2 — Essential metrics upper right; detailed views, comparisons, sources, engineering, alternatives and exports under Menu.
- [x] E3 — Optional draggable location map over the scene; preserve follow, radius and expansion controls.
- [x] E4 — Persistent lightweight mission playback and optional resizable horizon/timeline overlay; reframe Moon when panels change.
- [x] E5 — Correct Earth/Sun depth occlusion and hidden-label behavior; explicitly distinguish neutral atlas lighting and diagrammatic body scale.
- [ ] E6 — Final desktop and 390 px visual/keyboard acceptance of the new shell; finish screenshots and delivery notes. Earlier phone evidence is retained separately.
- [x] Run 158 JavaScript checks and syntax checks; confirm baseline application hashes and all original control identities.

Scientific, hardware and actual participant validation gates remain unchanged.
