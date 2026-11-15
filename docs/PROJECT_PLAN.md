# Moon Park — Lunar Landing Site Navigator

Living research and implementation plan · Version 0.7 · 11 November 2026

## 1. Evaluation framework

The verified 2025 NASA Space Apps judging guidance supplies five dimensions. It calls for a holistic 1–5 assessment, rather than a published weighted formula. Treat this as a planning baseline until the applicable current-year guidance is verified. Do not invent criterion weights or predicted scores. [Official guidance](https://spaceapps-v2-staging.s3.amazonaws.com/media/documents/Final_Space_Apps_2025_Judging_Guidelines_for_web.pdf)

| Dimension | Meaning for Moon Park | Evidence to produce | Internal acceptance target, not an official threshold |
|---|---|---|---|
| Impact | Help students and early mission-study users compare schedule-sensitive choices | Before/after comparison task and user observations | Four of five pilot users correctly explain a constraint failure without coaching |
| Creativity | Make uncertainty and schedule changes part of the decision | Prior-art comparison and one counterfactual walkthrough | Demonstrate a useful decision beyond simply plotting positions |
| Validity | Correct geometry, traceable inputs, bounded claims | Numerical checks, fixtures, convergence report, provenance | Every scientific result traceable to source, coordinates, timestamp, model and sampling |
| Relevance | Compare sites and dates through Sun/Earth visibility | End-to-end real-data scenario | Three verified points, one bounded date interval, baseline and delayed comparison |
| Presentation | Make the question, physical cause, and result understandable | Working demo, compact explanation, evidence export | A new user explains the decision after a short walkthrough |

No user study has yet been performed; these are proposed targets. Real inputs now drive the regional research model. Frame matching and initial cross-method checks are implemented; spatial uncertainty, completeness and human evaluation gates remain open.

## 2. Lessons from documented projects

NASA's 2025 account describes SpaceGenes+ as an interactive space-biology research dashboard, Twisters as a weather-to-activity assessment platform, and PureFlow as a habitat design environment with space-environment checks. These are useful precedents for making scientific information actionable. Public descriptions do not establish causal explanations for judging decisions or validate every implementation claim. [NASA project descriptions](https://www.nasa.gov/learning-resources/stem-engagement-at-nasa/nasa-announces-2025-international-space-apps-challenge-global-winners/)

Our interpretation: connect authentic data to a specific user's decision, let interaction explain the underlying science, and show evidence that the result works. Study three relevant examples deeply rather than compile unverified historical statistics. Next review should inspect their linked public demonstrations for task clarity, reproducibility, and limitations; code-level reviews are pending.

## 3. Product thesis

**Question:** If arrival slips by 48 hours, which candidate locations still satisfy a specified surface mission, and what is the smallest tested change that restores feasibility?

Moon Park compares terrain-dependent sunlight and Earth-center visibility against explicit requirements. It explains failures, tests alternative arrival times, and reports whether decisions change under terrain assumptions. Intended audiences are educators, students, and preliminary mission studies. It is not a landing guidance system.

Keep the name Moon Park. “WindowShift” in the supplied notes becomes the delay-comparison interaction, rather than a competing product name.

## 4. Differentiation and defensible originality

NASA Moon Trek already offers mapping, terrain profiles, lighting, slope analysis and mission-planning capabilities. NASA also identifies QuickMap as a lunar-data exploration tool. Therefore 3D terrain, shadows, or NASA data alone are not a credible novelty claim. [Moon Trek](https://trek.nasa.gov/moon/jpl/config/textAbout.html), [NASA interactives](https://science.nasa.gov/moon/interactives/)

Our proposed contribution is an **explainable mission recovery workflow**:

1. State mission limits, compare an arrival against a delayed arrival, and identify the binding constraint.
2. Trace an obstruction to a horizon azimuth and ultimately to the actual terrain samples responsible.
3. Search a bounded set of alternatives: arrival time, observation height, and candidate point. Report tested feasible alternatives, including their trade-offs. Do not call a result globally optimal unless the search space and objective justify it.
4. Re-run alternatives against terrain clones or documented uncertainty models. Show feasible-member counts and rank reversals; do not label ensemble frequency a calibrated probability.
5. Export a decision receipt containing inputs, dataset identifiers, checksums, equations, sampling, assumptions, per-site results and failure reasons.

This is a product and validation hypothesis, not a claim to have invented terrain visibility or to be first worldwide. The supplied notes mention SYNEXIS, CLPS Lunar Mission Browser and LunarSite Compass; their implementation claims and exact public repositories remain unverified here. Audit their real capabilities before publishing any comparative superiority claim.

### Why a single prompt is insufficient evidence

An interface is easy to reproduce. A defensible result requires aligned coordinate frames, reviewed site coordinates, measured DEM coverage, horizon calculations, reference ephemerides, regression fixtures, numerical convergence evidence, and observed user comprehension. Our durable contribution should be a small reproducible benchmark corpus and traceable decision receipts. An LLM can assist implementation, but cannot substitute for measured evidence. No arbitrary “AI safety score” is planned.

## 5. Scope and priorities

| Priority | Deliverable | Exit condition |
|---|---|---|
| P0 | Mission comparison and explicit constraints | Baseline/delay, continuous darkness, total combined availability and failure reasons implemented with real local terrain and observations |
| P0 | One real data-to-result path | Reviewed coordinate and datum; raw Sun/Earth request manifest; terrain horizon with coverage map |
| P0 | Validation suite | Analytic geometry cases, coordinate/reference checks, missing-data rejection, convergence |
| P0 | Three verified candidate points | Specific points selected from source ROIs, not crater-center placeholders |
| P1 | Recovery search | Enumerate bounded alternative dates and sites; show minimal tested changes and trade-offs |
| P1 | Terrain sensitivity | Observer-height recomputation, resolution changes and valid clones; distinguish unknown from infeasible |
| P1 | Decision receipt | Reproducible real-data export with provenance and limits |
| P2 | Synchronized terrain replay | Visual explanation matches the validated horizon calculations |
| P2 | Activity windows | Continuous, scheduled task intervals under explicit visibility requirements |
| P3 | Battery estimates | Only after panel attitude, power load and storage assumptions are testable |

Defer rover routing, full trajectory design, thermal survival, RF budgets, global arbitrary-point coverage, and machine-learning ranking. Total overlap must not be described as a continuous task window.

## 6. Scientific pipeline and contracts

**Terrain:** NASA PGDA high-resolution LOLA products include site DEMs, uncertainty products and clones. Begin by evaluating Site01, Site04 and Site11 coverage, then select actual supported points. Their descriptive names are connecting ridge, Shackleton rim and de Gerlache rim. Pixel spacing does not imply equal terrain accuracy. [Dataset and methods](https://pgda.gsfc.nasa.gov/products/78)

**Ephemerides:** retain observer-specific JPL Horizons queries and responses as references. The current primary calculation uses SPICE in MOON_ME_DE421 with corresponding planetary, orientation and frame kernels, recomputed at 2/5/10 m observer heights. Coordinates use the DEM's 1737.4 km sphere, native-grid ground elevation plus observer height, explicit UTC times and documented local axes. Do not substitute height above ground for height above the reference surface. [Horizons API](https://ssd-api.jpl.nasa.gov/doc/horizons.html), [manual](https://ssd.jpl.nasa.gov/horizons/manual.html), [SPICE observer calculation](https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/C/cspice/spkcpo_c.html)

**Horizon:** for each azimuth, calculate the maximum terrain elevation angle using lunar curvature and observer height. Preserve the blocking cell/distance for explanation. Use detailed nearby terrain plus regional far-field terrain. Missing map coverage or nodata must produce an unknown/coverage-limited result, not a zero horizon. Recompute horizon when observer height changes; a uniform angular shift is only a software sensitivity fixture.

**Visibility:** compare object elevation against the horizon at its azimuth. Integrate the solar disc where justified; the prototype uses the circular-segment area above a locally horizontal edge with an assumed 0.2666° solar radius. This is an approximation and needs date-dependent radius and terrain-profile treatment for real use. Earth-center clearance is geometric visibility only. It says nothing about Earth station availability, antenna pointing, signal strength, or link budget.

**Intervals:** use half-open mission bins, count durations once, report leading/trailing darkness, and refine transitions. The interface uses 10-minute observations. The evidence includes 10/20/30-minute comparisons and direct 1/5/10-minute SPICE recomputation on five scenarios. This checks temporal discretization; no equivalent physical timing accuracy is claimed.

**Constraints:** report each physical metric and requirement independently. No fabricated composite suitability score. A feasible result means only that the modeled requirements pass under stated assumptions; unknown inputs must prevent a confident recommendation.

**Receipt schema:** application version, exact software-file hashes, input UTC start/end, site coordinates and CRS, observer-height datum, DEM source/hash, ephemeris kernel/reference details, horizon coverage and resolution, step size, visibility definition, continuous overlap intervals, failure reasons, angular stress-test outcomes, corrected local-only comparison, selected activity, recovery results and limitations are implemented. Independent reproduction remains a release task; no immutable Git revision is claimed.

## 7. Execution sequence

| Milestone | Work | Acceptance evidence | Status |
|---|---|---|---|
| M0 | Establish plan, research register, fixture engine and interaction | Running local app and deterministic tests | Implemented; checks recorded in STATUS.md |
| M1 | Acquire observations and inspect DEMs | Raw responses + hashes; CRS/nodata/extent metadata | Implemented for three maps and six observation tables |
| M2 | Compute terrain horizons, validate clearance | Flat sphere/ridge fixtures and reference comparisons | Native/regional geometry implemented; frame-matched SPICE cross-checked against 186 Horizons samples. Observational validation remains outside this check |
| M3 | Extend to three points and delayed windows | All metrics derived from documented inputs | Implemented: original three benchmarks plus 27 nominal interior samples in 15 outlines; independent scientific release gate open |
| M4 | Add recovery search and uncertainty | Bounded-search checks and sensitivity evidence | Conditional near-field clone and numerical-check implementation added; empirical benchmark completion recorded in STATUS.md |
| M5 | Finish explanation and presentation | Usability observations, replay consistency, evidence bundle | Complete for revised delivery scope: replay, export, mobile checks, demo and agent task walkthrough; original human target deferred |

For a concentrated 48-hour build, provisionally reserve 20% for data feasibility, 25% for geometry and validation, 20% for comparisons/recovery, 15% for interaction/usability, and 20% for evidence and presentation. These are effort allocations, not a verified event schedule. Reduce to one supported point and fewer dates if terrain coverage or frame alignment remains unresolved; never replace unknown physical outputs with artificial predictions.

## 8. Verification and measurement

| Test | Proposed acceptance condition |
|---|---|
| Ephemeris parser | Exact agreement to retained Horizons precision on held-out raw response rows; parser check alone is not independent astronomical validation |
| Independent geometry | Cross-check a second implementation/SPICE configuration; publish angular residuals and frame assumptions before setting defensible tolerances |
| Horizon geometry | Analytic flat-sphere and isolated-ridge cases; seam wrapping and observer-height monotonicity |
| Time convergence | Publish 10/5/1-minute transition changes; provisional target within one coarse bin, not sub-bin accuracy |
| Coverage | Nodata and missing far-field terrain visibly block confidence |
| Decision stability | Enumerate accepted terrain variants, site rank changes and binding constraints |
| Performance | Provisional cached three-point comparison <1 second on measured reference hardware; cached calculation measured: warm p95 193.35 ms on the hardware recorded in performance.json; browser loading/rendering excluded |
| Usability | Five pilot users; completion time, correct interpretation, and errors; target four correct unaided comparisons |

Automated checks now cover interval endpoints, solar-disc boundaries, circular horizon interpolation, invalid grids, repeatability, obstruction monotonicity, reference-response parsing, spherical chord geometry, coverage rejection, separate object azimuths, bounded recovery, and continuous scheduling. The real-data report additionally records source hashes, cadence, observer-height horizon monotonicity, 10/20/30-minute sensitivity and search runtime. These checks do not independently validate astronomical frames or establish operational suitability.

## 9. Presentation design

Open with a decision, not a feature list: “The arrival moved. Does the same surface mission still fit?” Show baseline and delay side by side, inspect the exact constraint and physical obstruction, then compare the tested alternatives. Finish with one validation result and the decision receipt. Choose the scenario from real outputs, even if delay leaves the decision unchanged.

Use restrained lunar imagery only when it explains actual data. Do not imply synthetic decorative terrain is a real site. Keep units, legend, UTC dates, uncertainty and provenance visible. Prepare a seven-slide-or-fewer narrative and a separate short demo only after confirming current requirements. The verified 2025 guidance specified a maximum seven-slide demo OR a video no longer than 30 seconds; do not assume a generic multi-minute video is accepted in the current year.

## 10. Delivery requirements and open decisions

Historical minimum requirements include English, challenge alignment, accessible links, NASA resources and AI-use disclosure. Exact current-year rules, permitted preparation work, event dates, submission assets and selected local event must still be verified. The user has requested implementation now; record development dates honestly. Do not assume this preparatory code is eligible for later submission. The official 2026 landing page remains unavailable to direct retrieval in this review. A verified organizer answer on 5 November says project development should start at the official event time and working ahead can affect eligibility. This prototype predates the event and is not represented as an eligible event submission; see RELEASE_READINESS.md and its primary-source link.

Resolved choices: cached observation interval 14 November–14 December 2026, three original benchmarks plus 27 computationally validated interior research samples in 15 published outlines, native 5 m local / 240 m regional processing to 180 km, and explicit limits. Participant responses are unavailable; the user requested an agent-operated walkthrough. That revised delivery gate is complete, while actual-user evidence and independent review remain deferred/open. No user credentials or paid services are needed for the local build.

## 11. Updating this plan

After each milestone or meaningful scope change, update this file and STATUS.md together: date, implemented work, verification evidence, remaining gaps, and next acceptance gate. Promote a claim from proposed to verified only with a reproducible artifact. Keep original literature claims in the research register until their primary sources are checked. No automatic background work is implied.

## 12. Build 0.2 implementation decisions

The local research build uses a compact prepared dataset rather than a live prediction server. Python processes source rasters and retains observation tables; the browser performs mission comparisons and finite recovery searches. This keeps demonstrations reproducible and makes a network outage independent of the main interaction. The initial framework recommendations were options, not requirements; React, FastAPI and a database are unnecessary for this bounded build.

Three points are selected algorithmically as the highest analysis pixel in a central 2 km square of PGDA Site01, Site04 and Site11. This is a reproducible demonstration-selection rule, not a landing-hazard assessment or a claim to match published ROIs. Native 5 m maps are resampled to 20 m; great-circle rays sample every 20 m and 1° azimuth out to 12 km or the map boundary. Horizons use the selected coordinates and ground plus 2 m altitude. Height alternatives recalculate the terrain geometry, while preserving the 2 m ephemeris approximation explicitly.

The interface reports provisional local-model pass/fail and keeps full feasibility unknown. Recovery additionally tests supported heights at least as high as the current observer. It orders tested alternatives by additional delay, then height, then overlap; it does not combine those trade-offs into an unexplained score. A surface task must fit a continuous overlap interval. A replay switches between Sun and Earth clearance and identifies the nearest ray's strongest obstruction distance. An oblique elevation view uses the actual DEM preview; it does not claim photorealistic or hazard-map accuracy.

At the close of build 0.2, the open gates included regional terrain, frame reconciliation, finer transition checks, uncertainty clones and human usability. Build 0.3 closes bounded regional integration, explicit frame matching and the initial cross-method/time-sampling checks, as detailed below. Battery, RF, thermal and rover models remain outside this build's scope.

## 13. Build 0.3 — bounded regional visibility and scientific cross-checks

All 0.25° horizon rays now reach 180 km using native 5 m local maps and a 240 m regional product. Surface height is bilinearly evaluated at the unchanged research-point coordinates. This corrects the build 0.2 coarser-grid height by approximately 0.06–0.40 m. Radial sampling is 5 m near the observer, 20 m to 12 km, and 120 m beyond. These spacings do not establish equivalent physical accuracy.

Sun/Earth observations now come from NAIF SPICE in MOON_ME_DE421, using DE421 and its corresponding lunar orientation/frame kernels, at each supported observer height. Retained Horizons outputs form a separate implementation-path cross-check: 31 daily samples for each of three points and two targets. The largest elevation difference is 0.00001351°, not an absolute error bound. The kernel definitions supply explicit frame matching to the published terrain convention.

An 18-case benchmark separates the original model, the corrected local model and the extended regional model. Regional terrain alone reduces combined availability in eight cases, by at most 58.17 h in this benchmark. Five scenarios were recomputed directly at 1/5/10-minute cadence; measured aggregate changes are at most four minutes in combined availability and three minutes in sunlight. These results apply to the tested cases and fixed terrain model.

The app shows regional-vs-local changes and records frame residuals, terrain coverage, source hashes and exact software hashes in the evidence path. The cached pipeline is reproducible with `npm run prepare:science`; scientific methods and limits are summarized in SCIENCE_VALIDATION.md. Current verification: 17 JavaScript tests, 10 Python tests and 32 data-integrity/sanity checks pass.

**Build 0.3 handoff gate:** spatial/angular and terrain-uncertainty tests, now implemented conditionally in build 0.4 below. Full spatial/ensemble completeness, terrain outside 180 km, published-ROI candidate verification and human usability remain open. Full feasibility remains unknown.

## 14. Build 0.4 — conditional near-field uncertainty

The new uncertainty path uses clone IDs 001, 026, 051 and 076 from each site's published ensemble. Their absolute clone surfaces are differenced against the co-registered nominal map. Perturbations are applied at full strength within 1.8 km and tapered to zero by 2 km; outer terrain is fixed. This conditional sample does not represent regional terrain uncertainty or the entire 100-member ensemble. Acquisition, numerical generation and real benchmark completion are recorded in STATUS.md.

Four resolution variants form a separate family: 0.5° and 0.125° azimuths, a finer nested radial grid, and 20 m local terrain with its corresponding ground estimate. The interface keeps each family's pass count and metric range separate. It adds conservative rank spans using requirement satisfaction first, then combined availability, with 10-minute ties. No pairing of same-numbered clones across sites is assumed.

Recovery choices passing nominal plus every clone/resolution case appear before nominal-only passing choices; earliest extra delay, height and overlap break remaining ties. A shared activity interval is computed from the intersection of all tested combined-visibility bins. Aggregate mission constraints passing in every case does not guarantee a shared activity window.

Checks include source/grid interpretation, crop hashes, complete family counts, observer-height monotonicity, radial nesting, parallax correction against SPICE, missing-data rejection, decision reversals, ties and disjoint activity windows. Exact methods and evidence are in UNCERTAINTY.md and uncertainty-validation.json. Results must remain labeled conditional; full-field/ensemble uncertainty and human validation remain open.

The completed fixed benchmark covers 12 scenarios / 36 per-point cases at 10-minute spacing. Requirement classifications remain unchanged, but clone overlap varies by up to 90 minutes and resolution-case overlap by up to 10 minutes. Six scenarios have one preferred point, four no unique preference and two no passing choice. A separate one-minute Shackleton study reveals a four-minute clone sunlight spread hidden by coarse sampling. A constructed boundary test passes in 2/4 clones; it is explicitly hypothetical. The interface flags near-sampling-limit results and exposes this separate study.

Current verification: 42 automated tests and 70 data checks pass. Browser export was checked for eight variant outcomes per point, rank bounds, selected/shared activity windows, conditional scope and all 30 recorded source-file hashes. The common default activity window starts 10 minutes later than the nominal window, demonstrating why aggregate totals alone are insufficient.

## 15. Build 0.5 — spatial evidence navigator

The navigator now connects three modeled points, 15 published illumination-study outlines, a real-elevation 3D terrain scene and a full-azimuth horizon sky. The same mission sample and observer height drive both visual views and the existing results. The terrain is converted from the source south-polar projection into curved lunar coordinates, then into the observer's east/north/up frame. Sun and Earth directions use that same frame.

Each local 16 km source tile is downsampled to 129 × 129 cells (approximately 124 m spacing) for display. It does not replace the native 5 m local and 240 m regional horizon calculation. Fixed display lighting exposes shape; it does not simulate time-dependent shadows. True/3×/6× relief is explicit. Body symbols and ray lengths are schematic; the sky view retains physical angular geometry.

The published ROI shapefiles are checked against the native DEM projection and bounds. Three point attributes lie outside their corresponding outline and one is absent; these are flagged. The existing Connecting Ridge and de Gerlache points lie within outline 1 of their respective source areas. The Shackleton research point lies outside the published outlines. Selecting an outline inspects metadata only; a separate button selects the already modeled research point in that source area. None of the 15 outlines receives an invented simulation or an approved-landing-site designation.

Spatial artifacts carry SHA-256 identities, and the browser checks their hash and terrain-source context. Exported receipts retain the spatial source, selected outline, active point, view and exaggeration. Three.js is pinned and vendored locally with its license, so the viewer requires no external graphics CDN. See SPATIAL_NAVIGATOR.md and spatial-validation.json.

Next implementation gate: compute and validate representative points for selected published outlines, using their geometry and native source elevations rather than unreliable attribute coordinates. Then compare within-region spatial sensitivity and expose computed coverage on the map. Human interpretation testing, hazard/roughness analysis and full-field uncertainty remain open; no certification or full mission feasibility is claimed.

Build 0.5 verification: 47 automated tests and 123 data checks pass. Browser checks confirm point/outline separation, sky/terrain switching, synchronized replay, height and relief controls, and no mobile horizontal overflow. The downloaded receipt matches all 42 recorded software hashes. A retained preview and sample receipt document the tested build.

## 16. Build 0.6 — interior points and release materials

All 15 published outlines now have a separately calculated interior anchor. Outline 1 in each terrain area adds four constrained grid-offset probes, for 27 points total. Selection uses native raster cell centers and polygon inclusion rather than DBF point attributes. Each point receives native ground elevation, a 180 km horizon at three heights and its own 10-minute SPICE observations. Data loads by selected outline and verifies its hash and coordinate context. Spatial ranges describe sampled points only; candidate-specific clone uncertainty remains unknown.

A Connecting Ridge south probe changes from 5.17 h baseline combined availability to 53.17 h after +48 h delay, switching the configured nominal result from fail to pass. Five Shackleton outline-1 samples vary from 21.00 to 28.17 h after delay, while the distinct original benchmark point has zero. These measured examples now drive the demo narrative. The region inspector includes bounded nominal recovery, and the selected point drives terrain and horizon replay.

Verification records 55 automated tests and 884 data checks: 32 nominal, 38 uncertainty, 53 spatial, 242 candidate and 519 candidate-science checks. Six additional daily Horizons tables cross-check three anchors at 186 target/time samples; maximum tested elevation difference is approximately 0.00001351°. This does not supply independent observational truth. Cached calculation warm p95 is 193.35 ms on the recorded reference hardware, excluding loading and rendering.

Release materials include an editable seven-slide demonstration, a timed-narration draft, source/evidence packaging and an anonymous pilot tool. Developer sessions are explicitly excluded from human evidence, and the aggregation tool rejects duplicates, inconsistent scores and mixed app versions. The original human-study gate was retained initially. The user subsequently requested an agent-run evaluation because responses were unavailable; the revised scope and measured walkthrough are recorded below. No human observations have been invented.

M0–M5 bounded implementation work and the revised M5 agent walkthrough are complete; the original human acceptance target remains untested and deferred. Independent review, full-field ensemble completeness and public deployment remain separate open gates. Deferred battery/RF/thermal/rover/trajectory models are not silently added to the completed scope. Development dates and unresolved event eligibility are documented in RELEASE_READINESS.md.

Final browser checks confirm all three source areas, ROI selection/recovery, height/replay changes and no mobile horizontal overflow. The downloaded receipt matches all 54 current software hashes and preserves five independently calculated interior results. The developer pilot record is explicitly excluded from human evidence; actual participant evidence remains unavailable and is deferred for current delivery.


## 17. Revised delivery acceptance — agent-operated walkthrough

On 11 November 2026 the user requested that the agent complete the tasks because actual participant answers could not be obtained. The bounded M5 delivery gate is revised to a recorded agent-operated browser walkthrough. All five interpretation tasks pass, along with missing-limit export blocking and valid-input restoration. Exact observed text and conditions are retained in agent-task-audit.json; AGENT_TASK_AUDIT.md explains the decision.

This closes M5 for the revised delivery scope. It does not claim the original four-of-five-human comprehension target, a human success rate, independent scientific review or operational readiness. The actual-user study is deferred with zero participants and the pilot tool remains available. All M0–M5 bounded deliverables are now complete; deferred engineering models and separate scientific/public/event release gates remain as documented.


## 18. M6 / Build 0.7 — trace the sampled terrain horizon

The new explanation milestone connects the selected Sun/Earth direction to the actual sampled terrain locations supporting its nominal horizon. The viewer preserves both neighboring ray witnesses and their interpolation weights; it does not imply one exact blocker on an unsampled target azimuth. The map shows great-circle paths, selectable A/B markers, source resolution, distance and coordinates. The sky panel uses the same angular witnesses. Time and observer-height changes refresh the trace; point changes clear it. Receipts preserve the full trace and terrain source identities.

Six numerical tests and 900 real-data trace cases (10,800 checks) pass across all 30 points, both targets, three observer heights and five dates. The original scientific arrays remain unchanged. M6 is implemented, with final browser/receipt checks recorded in STATUS.md. HORIZON_TRACE.md documents interpretation and limits.

Optional original imagery has been requested around the actual Connecting Ridge, Shackleton and de Gerlache outline-1 anchors. IMAGE_REQUESTS.md and data/image-request-footprints.json provide exact lunar coordinates and 2 km context footprints. Imagery does not block this build. Any future image texture must be registered to the scientific terrain before use; a generic Moon model is context only.

Next planned phase: refine the choose-point → delay → failure explanation → recovery journey, and incorporate source-identified context imagery if supplied. Preserve coordinate/frame checks, point-vs-region scope, and the explicit distinction between agent review and actual-user evidence.

M6 final verification: browser controls, keyboard focus, native/regional witnesses, replay/height refresh, reset/clear, map fit and mobile containment pass. Both active and cleared receipts match all 57 recorded software hashes; the active trace reconstructs the selected interior point’s horizon. The v0.7 local release and image-request artifacts are prepared.


## 19. Original-image intake

On 11 November the referenced Download Lunar Images chat supplied an LROC Connecting Ridge orthophoto product. The original GeoTIFF and README were acquired, source identities retained, and an exact source-pixel context crop prepared. The Connecting Ridge anchor has valid imagery; the other two selected anchors lie outside this image. Only 40.7% of the requested 2 km crop has non-nodata support. These limits are recorded in IMAGERY_INTAKE.md and data/imagery/connecting-ridge-context.source.json.

The product's historical lighting and documented source-registration offsets prevent treating it as simulated mission illumination or an independently registered texture. Integration remains gated on registration assessment. This asset intake does not alter the validated scientific model. The user need not re-download the existing LOLA elevation maps; actual Shackleton/de Gerlache imagery and additional Connecting Ridge coverage remain useful.

## 20. M7 / Build 0.8 — decision journey and historical imagery

Completed the recorded example, selected-point baseline/delay summary, mission/trace/recovery navigation, and three source-verified historical image contexts. The recorded south probe changes from 5.17 to 53.17 h after +48 h, with its nominal fail-to-pass status preserved. Imagery is separate from simulated lighting and unregistered terrain; each point has its own coverage status. The de Gerlache acquisition is incomplete and missing strips remain transparent. All three outline-1 anchors have valid pixels. HISTORICAL_IMAGERY.md and STATUS.md record scope and verification: 63 automated tests and 98 imagery checks; original scientific arrays are unchanged.

Next gate: complete de Gerlache acquisition when source access permits, then measure image-to-current-DEM registration before considering precise overlays. Independent scientific review and actual human testing remain open; no human observations or operational readiness are claimed.

## 21. M8 / Build 0.9 — alignment measurement tools

Delivered a dedicated image/terrain alignment workbench with common-grid masked inspection assets for all three areas, four synthetic hillshades, slope contrast, synchronized zoom/pan, keyboard selection and named landmark pairs. Median translation uses fit landmarks only; separate held-out landmarks expose residual mismatch. The exploratory review threshold requires three fit and three check landmarks with spatial spread. It never automatically establishes registration or applies a correction. Receipts retain exact source identities and unreviewed selections.

46 JavaScript and 20 Python tests pass. Common-grid provenance, masks, source identities and display assets pass 84 checks; original imagery passes 98 checks. Numerical projection closure is distinct from physical alignment. Browser developer controls are explicitly arbitrary and excluded from scientific evidence. Zero accepted physical correspondences are claimed.

M8 measurement tooling is delivered; full imagery acquisition and physical registration acceptance remain open. The source retry window lasts until at least 19:34:53 IST on 11 November, conservatively recorded from the partial acquisition timestamp. No retry was made during this build. Future rate limits now stop promptly and persist their retry time. After acquisition, regenerate dependent assets before assessing actual stable-feature correspondences. REGISTRATION.md gives the exact workflow and remaining acceptance gate.



## 22. M8 continuation / Build 0.10 — completed coverage and preliminary correspondence review

The de Gerlache source cooldown was honored, then two verified range requests retrieved the final 10 MB for the requested context crop. It now contains 4,004,001 valid source pixels, including 710,355 newly available pixels. All prior pixels and 187 cached range hashes remain unchanged; the full 767 MB master was not downloaded. Historical and common-grid views were regenerated with complete-crop acquisition status.

Source-bound restoration now rejects changed image, metadata, DEM or inspection assets, recalculates statistics and ignores saved approval fields. Inputs are bounded and rejected imports preserve existing work. Two tentative agent-selected physical Shackleton correspondences produce a one-fit shift and a 25.4 m held-out mismatch. They are unreviewed, insufficiently distributed and not accepted; no correction is applied. PRELIMINARY_ALIGNMENT.md explains why this does not establish registration.

Verification: 69 automated tests, 97 imagery checks, 84 common-grid checks and 10 acquisition-transition checks. All 187 previously retained blocks were verified before resume. M8 acquisition and measurement tooling are complete; physical registration acceptance remains open, alongside independent review and actual-human evaluation.


## 23. M8 source-quality review / Build 0.11

Added the Shackleton parent NAC stereo DTM and original PDS confidence categories as a separate source-qualified inspection view. The browse confidence TIFF had display-scaled values and was excluded from quantitative decoding. Exact native crops, source hashes, nominal lunar projection/height interpretation, complete-cell confidence support and unshifted product differences are retained. The comparison uses 156,415 fully supported inspection cells: median NAC-minus-mission difference +0.781 m, with central 90% −0.473 to +2.215 m. Shared LOLA control prevents treating this as independent truth or photo registration.

The source audit finds the earlier northern-crater fit is shadowed and has no stereo elevation at either nominal coordinate. The bowl check has stereo support but remains unreviewed. Existing measurements are preserved as history, with no accepted pair or applied correction. Reference-mode controls block mission landmark picks, hide mission markers on the other terrain, preserve source identities and export the displayed source/layer. Other source areas cannot inherit this reference.

Verification: 73 automated tests and 235 current data checks. STEREO_REFERENCE.md documents the methods and remaining correspondence-review gate. M8 source-quality review is delivered; physical registration, independent scientific review and actual-human evaluation remain open.

## 24. M8 continuation — exhaustive landmark search atlas

Added a source-verified, self-contained nine-region atlas and reproducible generator under `docs/landmark-review/`. Each fixed region compares photo, mission hillshade, opposite stereo lighting and scientific confidence. Region accounting closes to all 160,801 inspection cells and all 156,415 supported cells. The research artifact is separate from packaged application build 0.11.

Initial agent visual inspection nominates western crater groups for closer rim review and records two obstacles: shadowed stereo interiors and mission terrain smoothing of photo craters. Fully supported eastern regions still lack immediately distinctive point features. Next work must identify precise source-supported features on the mission terrain, repeat picks to measure selection uncertainty, and reserve separate checks before fitting. No new matches are accepted; the physical registration gate remains open. Findings and reproduction instructions are in `landmark-review/REVIEW.md`.

### Native-photo follow-up

Delivered reproducible 300 m closeups of three western search regions with original 1 m photo pixels, mission hillshades under opposite lighting, stereo hillshade and quality. Source identity and source-footprint checks pass; exact enclosing native-confidence count bounds are recorded separately from photo bounds. Visual inspection finds crater neighbourhoods but no unique mission-side rim point. Therefore zero new pairs are accepted, uncertainty remains unmeasured and no translation is fitted. Next investigate broader distinctive terrain features; do not complete the registration gate using ambiguous small crater centres. Application release remains 0.11.

### Broad-feature investigation and bounded search outcome

Delivered three fixed full-width ridge transects with 1,203 exported samples, source hashes, numeric support flags, a standalone figure and reproducible generation. The mission and supported-stereo sampled maxima differ by 0, 4.99 and 0 m in X, while the mission's one-metre height bands span approximately 59.88, 24.95 and 19.96 m. Neither metric measures photo registration. The illumination-dependent photo boundary cannot define an exact crest point, and an extended ridge alone does not supply a reviewed distributed point set.

The bounded landmark search is complete with zero accepted new pairs; physical registration acceptance remains open. Reopen acceptance work with identifiable feature definitions, repeatable picks and independent checks. Application release remains 0.11. Next product milestone: assemble a guided demonstration of the existing terrain/time-window decision, with linked evidence and clear unregistered historical imagery. This milestone must use existing supported calculations and preserve the scientific limitations; it must not imply completion of physical registration or human evaluation.

## 25. Guided decision demonstration — local delivery

Delivered `/docs/demo/index.html` with five navigable chapters, a keyboard-operable 0–72 h delay experiment, live nominal calculation, accessible timeline summary, continuous two-hour activity result and downloadable source-bound single-point evidence. It imports the existing mission engine and verifies the candidate manifest/payload; calculations are not replaced with narration values. The guide identifies missing interior-point clone uncertainty, unregistered imagery and omitted operational constraints.

Browser verification reproduced the zero/+48 h comparison, chapter navigation and actual download. The saved export passes 82 artifact checks including all 73 existing mission-software hashes. The desktop screenshot was inspected and no horizontal overflow was observed. Human participants remain zero; mobile browser verification remains pending. The packaged build 0.11 is retained unchanged and does not yet contain this new addition.

Next: connect the guide to the main entry point, update release source stamping/versioning, package the research and guide additions, and validate the guide from a clean extraction. Physical correspondence acceptance and independent scientific review remain open.



## 26. Build 0.12 — integrated local research product

Connect the guide from the main navigator, stamp the guide and research generator sources, include the full bounded landmark investigation in the portable archive and check the product from a fresh extraction. The local server now serves images and downloadable artifacts with explicit media types and supports an optional PORT to isolate release validation. Scientific source arrays and existing model behavior are unchanged.

Delivered software scope: the guided introduction, mission-window comparison, region samples, recovery search, activity scheduling, terrain/horizon/source explanation, historical context, evidence exports and research alignment workbench. Physical image registration, human evaluation, independent scientific review and operational certification remain open. They must not be represented as completed product validation.

Validation evidence: 73 automated tests, 235 workspace data checks, per-file archive checksums and extracted-release results under release/. Future work should respond to real reviewer/user findings and the open scientific gates rather than inflate the completed feature list.
