# Moon Park — demonstration narrative

## Interactive guided demonstration

Open `/docs/demo/index.html` on the local server for a five-step walkthrough: Ask, Compare, Explain, Schedule and Inspect. The delay slider recomputes the recorded interior point with the existing mission engine; the example values are not substituted into the calculation. The candidate manifest and coordinate-specific payload are checksum verified before display. A single-point evidence export includes the actual baseline/delayed samples, current configuration, activity windows, source references, guide-file hashes and limitations.

Browser checks confirm zero delay gives 5.17 h on both sides and fails the overlap requirement; +48 h gives 53.17 h delayed and passes the configured limits. The first two-hour sampled activity start is 16 November 2026 at 18:50 UTC. Navigation, keyboard-operated delay changes and download were exercised; the default desktop view has no horizontal overflow. Export verification passed 82 checks, including all 73 existing mission-software hashes. See `demo/validation.json`, `demo/sample-export.json` and `demo/preview.png`. This is agent verification, with zero human participants. Mobile behavior has not been browser verified in this addition.

The guide is a local addition after packaged build 0.11. It does not establish image registration, operational feasibility or independent scientific validity. The existing packaged release has not yet been regenerated to include it.

1. **The question.** A lunar arrival moves by 48 hours. Does the same surface mission still fit its visibility requirements?
2. **The evidence.** Show three terrain-derived research points with NASA LOLA data and observer-specific SPICE positions with a retained Horizons cross-check. Distinguish research points from certified landing candidates.
3. **The comparison.** Set arrival, delay, duration, darkness limit and total overlap requirement. Read baseline and delayed results without implying that a dramatic reversal must occur.
4. **The explanation.** Inspect one point. Scrub time, switch Sun/Earth, and show the modeled horizon and nearest ray's blocking terrain distance. The elevation view comes from the actual DEM.
5. **The alternatives.** Inspect the bounded recovery search. Explain that the earliest passing tested delay is not a global optimum or an operational recommendation.
6. **The activity.** Specify an activity length and see whether it fits a continuous combined window. Total overlap alone is insufficient.
7. **The receipt.** Export inputs, source queries, hashes, assumptions, intervals and limitations. Show the validation reports and remaining full-field uncertainty and independent-reference checks.

Choose the final example from recorded real outputs. Do not fabricate a lost window or rank reversal. For a 30-second demonstration, show question → delay interaction → explanation → receipt. For a seven-slide format, use the seven steps above. Current event requirements must be confirmed separately.

## Pilot task sheet

Ask five users individually to compare baseline and delayed outcomes at one point, explain a failure, and find a continuous activity interval. Record completion time, incorrect interpretations, assistance needed and whether the user understands the provisional status. Do not count developer testing as a human usability study. Target four of five correct unaided interpretations, and record results even if the target is missed.


Build 0.5 spatial walkthrough: select a published outline and explain why its geometry alone is not a calculated landing result. Use its area's modeled-point button, orbit the real terrain, then switch to Horizon sky and scrub Mission replay. Explain that the coarse local display and the 180 km horizon model have different purposes. Show the flagged missing/outside source attributes and export their source identity with the receipt.


## Recorded interior-point walkthrough

Choose Site01 published study region 1, then grid-south. With the default mission, show baseline 5.17 h and delayed 53.17 h combined availability. At zero delay that point fails the 8 h overlap requirement; at +48 h it passes the nominal limits. Open nominal recovery for a bounded alternative point/delay/height comparison. Explain that terrain-clone support is unavailable at these interior samples.

The editable seven-slide deck is under deliverables/Moon-Park-demo.pptx. A 30-second narration draft: “A lunar arrival moves by 48 hours. At this sampled point, combined sunlight and Earth visibility changes from 5.17 to 53.17 hours. Moon Park traces the result to real terrain and observer geometry, compares tested alternatives, and exports the evidence. Nearby points can behave differently. Our regional samples use nominal terrain; separate benchmark points add conditional terrain checks. This is an educational research prototype.” Read aloud and time before recording; no finished video or accepted submission is claimed.


Build 0.7 explanation step: select Trace Earth above the map. Inspect A/B ray directions, weights, source distances and local/regional resolutions. Fit the samples, then scrub replay and compare the object's elevation with the interpolated horizon. Explain that two sampled witnesses support the angular interpolation; they are not one exact blocker on the unsampled target azimuth. Export the active trace with the decision receipt.


Build 0.12 release verification: the freshly extracted app loaded the recorded example and exported the current decision receipt; its main-entry link opened the guide, which exported the same 79 current software source hashes plus three guide identities. Both saved exports match current sources. See browser-validation-v0.12.json. Earlier 82-check guide evidence is preserved under history/ as build 0.11 evidence.


## Operational timing and geometry

Show the expanded comparison metrics: total sunlight and longest sunlight interval, total direct-Earth visibility and longest Earth window, simultaneous overlap, longest shared window, and peak solar elevation. At replay, compare the ideal-horizontal-surface solar projection with the terrain-screened Sun state. Then read the next sunset and Earthset/return countdown ranges. Explain that these are sampled geometry cues: no watts, thermal viability or radio link is calculated.
