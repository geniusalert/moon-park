# Scientific accuracy audit — 14 November 2026

## Current acceptance scope

The named mission catalogue frame gap is resolved for its 20 NASA coordinates and two USGS LOLA 2011 regional references. The current metadata distinguishes frame identity from measurement uncertainty. A 76-coordinate installed-terrain support check passed. A measured Diviner surface benchmark is available with an aggregate latitude-mean residual RMSE of 9.23 K against the published regolith reference model. These results are documented in SCIENTIFIC_ACCEPTANCE.md.

Measured spacecraft thermal validation remains unestablished. Diviner surface temperatures cannot validate an arbitrary spacecraft body. Earlier open-gap statements below are retained as historical implementation records; the current acceptance report identifies the evidence now available.

The present visibility engine has useful representative checks. Accuracy across arbitrary coordinates, terrain and mission configurations remains unestablished.

| Priority | Gap | Required completion evidence |
|---|---|---|
| P0 | Catalogue frame identities are ambiguous for some records | Retain original reported frame, datum, epoch and coordinate precision. Transform only records with authoritative frame identities using pinned SPICE kernels. Report surface displacement and rerun visibility at original/transformed coordinates. Unknown frames must remain unresolved. |
| P0 | Ten-minute sampling can miss short windows | Recalculate Sun/Earth geometry and terrain-disc visibility at one-minute cadence, then bisect each transition using new observations. Compare counts, total windows and transition brackets against ten-minute runs across terrain seams, seasons and near-tangent events. Searching only detected coarse transitions cannot detect skipped short events. |
| P0 | Finite terrain rays and outer coverage | Validate missing masks, ray extent, angular refinement and remote obstructions with independently sampled profiles. Record convergence separately from source elevation uncertainty. |
| P1 | Panel power and storage | First-order model added in src/engineering-model.js. Integrate explicit assumptions into scenario settings, exports and restoration, and validate against independent analytical cases before exposing engineering decisions. |
| P1 | Thermal survival | Added isolated instantaneous equilibrium estimate in the same module. A transient model requires heat capacity, regolith temperature and view factors, conduction, radiator geometry and component temperature bounds. Compare against measured Diviner temperatures and published mission cases. |
| P1 | End-to-end scientific validation | Repeat custom terrain scenarios, seasonal and year-boundary cases through the browser. Retain identities, runtime, reference residuals and numerical convergence. |

The engineering module is connected to navigator controls and workspace exports. Engineering results remain separate from the visibility constraint decision. Its solar irradiance reference is 1361 W/m² at 1 AU. Power uses fixed-panel incidence, distance scaling, disc fraction and explicit efficiency/derating. Storage integrates the greatest cumulative energy deficit with charge and discharge efficiencies from an initially full battery. Thermal output solves absorbed sunlight plus supplied internal heat against gray-body radiation to cold space.

Unknown catalogue frames cannot be quantified reliably from coordinate values alone. Assigning every source a shared frame would suppress the uncertainty. Obtaining authoritative metadata is necessary before closing that gap.

Sources
- https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/Tutorials/pdf/individual_docs/23_lunar-earth_pck-fk.pdf
- https://pgda.gsfc.nasa.gov/products/95
- https://arxiv.org/abs/2509.13110

## Implementation update

Engineering assumptions now have navigator controls and workspace persistence. Analytical tests check normal incidence, inverse-square scaling, equilibrium radiation and cumulative battery deficits with recharge. Equipment defaults are illustrative. Browser integration still needs interactive verification.

The repeatable scripts/refine_science.py and scripts/validate_refinement.mjs produce independently calculated one-minute observations and compare the existing terrain visibility engine at one-minute and ten-minute cadence. Evidence is retained in scientific-refinement-summary.json. Frame comparison at Site01 finds approximately 658.64 m displacement when identical numeric coordinates are interpreted in MOON_PA versus MOON_ME. This is a conditional frame comparison, not a correction to any catalogue record. Unknown catalogue frames remain unresolved. Temporal bisection and domain-wide sampling validation remain open.

## Eclipse and sensitivity update

The navigator now offers an experimental opaque spherical Earth occultation option. The same projected-area solar-disc rays test both terrain obstruction and Earth obstruction, avoiding multiplication of two unrelated visible fractions. Corrected fractions feed sunlight thresholds and engineering estimates. The option is saved and restored with the scenario and defaults off for historical compatibility. Missing target ranges are explicitly labeled unavailable. Earth uses a conservative equatorial radius of 6378.137 km, with no oblateness or atmospheric transmission. Geometry unit tests cover aligned total occultation, separated discs and partial occultation with a terrain mask. Historical eclipse and independent occultation-reference comparisons remain required.

scripts/validate_visibility_sensitivity.mjs generated visibility-sensitivity.json with nine benchmark/date cases and assumed horizon perturbations of ±0.1 degrees. This quantifies conditional sensitivity only. A measured terrain-error distribution, geographic coordinate-error propagation and broad seasonal/reference comparisons remain open.

The full pre-existing 97 JavaScript tests passed after integration. Two additional eclipse geometry tests passed. Browser checks of the eclipse control, export/restore and engineering estimates remain outstanding. No software-completion or scientific-validation milestone is closed by these changes.

## Integrated scientific implementation — 14 November 2026

| Capability | Implemented behavior | Verification and remaining limits |
|---|---|---|
| Seasonal ephemeris validation | Three prepared locations, four 2027 seasons, Sun and Earth at seven timestamps per case | 24 target comparisons against Horizons. Largest absolute elevation residual 0.0000110741 degrees. This validates representative angular agreement, not terrain or absolute truth. See seasonal-science-validation.json. |
| Seasonal time sampling | Twelve 24-hour calculations with separately evaluated one-minute observations, compared at one and ten minutes | Three fine-cadence transitions occurred. Maximum absolute total-availability difference was 0.1333333 h (eight minutes). See seasonal-cadence-validation.json. No new crater-floor or boundary dataset is covered by this run. |
| Navigator fine cadence | Select one or ten minutes before calculating 2027 sites. Workers request actual source observations at the chosen spacing. Arrival inputs retain their ten-minute grid. | Real reference-sphere worker returned one-minute observations and 60 samples for a one-hour stay. See one-minute-worker-verification.json. Prepared ten-minute data reject requests for unsupported finer sampling. Events remain sample brackets, with no fabricated interpolation. |
| Positional sensitivity | Recalculate four great-circle offsets with user-supplied distance, queued with cancellation and immutable result references | Unknown coordinate error distributions remain unknown. Four offsets do not bound all possible positions. |
| Relative terrain elevation sensitivity | Two terrain-worker runs shift all terrain-ray elevations by the supplied positive/negative error relative to fixed observer ground | Explicit conditional terrain stress, not measured uncertainty. Perturbations are part of horizon cache identity. Angular horizon stress remains separately available. |
| Eclipse geometry | Optional opaque spherical Earth model intersects the same disc rays with terrain | Total and partial occultation detected around NASA's 7 September 2025 total lunar eclipse. See eclipse-reference-validation.json. This checks occurrence, not precise global contact times or atmospheric transmission. |
| Time-dependent equipment | Initial usable storage charge, nominal capacity, charge/discharge limits, repeating active/idle loads, temperature coefficient for panel efficiency | Reports unserved load and final storage. Minimum initially full battery remains an energy-only lower bound. Aging and temperature-dependent battery capacity remain omitted. |
| Transient thermal model | Backward-Euler lumped heat balance with heat capacity, internal heating, electrical extraction, gray radiation, fixed ground infrared view factor and conduction | Analytic radiative-cooling check passed within 0.5 K over one hour. No component/material calibration or validation against measured surface temperatures. A spacecraft lumped body and regolith temperatures require different physical models. |
| Exports and controls | Scientific assumptions, engineering summaries and completed uncertainty evidence included in workspace exports and comparison brief | Browser checks confirmed initial-charge changes update unmet load and the horizon sensitivity control returns three results. Export contained 29 engineering assumptions, estimates and cadence/eclipse settings. End-to-end restoration of the new fields still requires interactive acceptance. |

### External evidence still required

Unknown catalogue source frames cannot be recovered from the coordinate values. Source-specific authoritative datum/frame records are required before any correction is applied.

Diviner measures lunar surface radiometric temperatures. It cannot directly validate the temperature of an arbitrary modeled spacecraft panel. A regolith model, matched footprint, observation geometry, UTC or local solar time, quality flags and source identities are needed for that comparison. Current user-entered ground temperature is an assumption. No Diviner validation has been claimed or manufactured.

Sources
- https://eclipse.gsfc.nasa.gov/LEdecade/LEdecade2021.html
- https://www.diviner.ucla.edu/science

Software regression results and live terrain-stress acceptance are recorded separately below. Independent scientific review remains outstanding.

### Final verification evidence

- 102 JavaScript tests and 51 Python tests passed.
- docs/one-minute-api-verification.json records a completed one-minute local API request, source spacing and result identity.
- docs/terrain-stress-integration.json records a real +1 m terrain-elevation stress run, with 60 one-minute samples for the tested hour. Cold runtime was 64.06 seconds and peak working set was 581,218,304 bytes.
- Browser checks exercised changed battery charge and angular sensitivity. The downloaded workspace contained 29 engineering assumptions, engineering estimates, cadence and eclipse settings.
- Interactive acceptance for the complete six-job positional/elevation uncertainty workflow and restoration of its evidence remains open.

## Acceptance follow-up completed

See [scientific acceptance](SCIENTIFIC_ACCEPTANCE.md) for source-backed catalogue frame resolution, the 76-coordinate terrain support check, the measured Diviner/reference-model comparison and completed six-job browser export/restore verification. Browser acceptance now includes cancellation/retry and altered-source-identity rejection. Tests passed 103 JavaScript and 51 Python cases.

Measured spacecraft thermal calibration remains an external evidence requirement. The implemented surface benchmark reports residuals and does not certify the spacecraft model.
## Hardware measurement workflow implementedThe navigator now imports component thermal-test records, fits selected parameters using calibration runs only, evaluates separate validation runs, records residuals and sensor uncertainty, and checks whether mission forcing ranges exceed the supplied tests. The mission estimate and test comparison share the same thermal integrator. Studies export with input hashes and are recalculated during restoration. Synthetic data cannot establish a hardware-validation pass.The user confirmed that no hardware measurements are available. Software acceptance passed 108 JavaScript tests, 51 Python tests and browser import/cancellation/application/export/restoration/integrity checks. Physical spacecraft accuracy remains unvalidated. See [hardware thermal validation](HARDWARE_THERMAL_VALIDATION.md).