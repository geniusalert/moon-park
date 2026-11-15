# Moon Park — delivery status

Updated 11 November 2026 · Build 0.10

## Completed: de Gerlache context crop

After honoring the source cooldown, two range requests acquired the remaining 10,485,760 bytes. The approximately 2 km de Gerlache crop now has 4,004,001 valid source pixels (100.0% support), up from 3,293,646 (82.3%). All 710,355 newly available pixels come from the original source; every previously valid pixel remains exactly unchanged. All 187 prior retained blocks retain their original hashes; the completed extraction references 227 blocks. The 767 MB master file was not downloaded in full, and its full-file SHA-256 remains null.

The historical image and alignment inspection assets have been regenerated. Acquisition-complete status now appears in the app and receipt. Historical lighting, unmeasured registration and point-specific outside-crop limits still apply. Connecting Ridge remains 40.7% supported because its original source has nodata; Shackleton and de Gerlache crops have 100.0% support. These fractions describe these crops, not whole-region coverage.

## Alignment evidence and restoration

Two tentative Shackleton physical feature correspondences were selected by the agent, distinct from the arbitrary developer controls. One fit gives an exploratory image-to-terrain X/Y shift of −29.9/−5.0 m; the separate check has a 25.4 m residual. Shadowed/degraded feature centers and insufficient point count/spread prevent acceptance. These results are unreviewed and do not establish an offset or absolute accuracy bound. Zero correspondences are accepted, and no shift or texture drape is applied. PRELIMINARY_ALIGNMENT.md records the limits.

Saved assessments can now be restored only against matching image, metadata, DEM and inspection sources. Statistics are recomputed and saved approval claims ignored. A rejected import preserves current pairs. The import is limited to 2 MB / 200 pairs. Historical data from another area changing does not invalidate unchanged area-specific source assets.

## Verification

47 JavaScript and 22 Python tests pass (69 total). Imagery passes 97 checks; common-grid inspection assets pass 84 checks. Ten transition checks verify the completed crop against the exact v0.9 release, including unchanged prior pixels, ranges and original scientific arrays. All 187 cached blocks were checked before resuming. Original benchmark science and candidate references remain unchanged.

Browser checks and source-matched exports are recorded in browser-validation-v0.10.json. Earlier records remain under history/. The portable package and clean-extraction validation are under release/.

## Roadmap state

M0–M7 bounded implementation milestones are complete. M8 acquisition and measurement tooling are delivered; physical registration acceptance remains open. Actual human testing remains deferred with zero participants. Independent scientific review, full-field uncertainty, operational validation and event eligibility remain open. No deployment or submission has been made.

Next: identify additional unambiguous, spatially distributed fit/check landmarks and review their correspondence before allowing precise overlays. The current historical context view remains available without an alignment claim.
