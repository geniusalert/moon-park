# Moon Park — delivery status

Updated 12 November 2026 · Build 0.11

## Latest: source-qualified Shackleton terrain review

The alignment workbench now compares the historical image with either the unchanged mission LOLA terrain or a separate NAC stereo reference. The reference retains native 2 m heights, the original scientific PDS confidence categories, four synthetic-light views, slope contrast and a colour quality map. The browse confidence TIFF was rejected for quantitative classification because its values are display intensities.

On the existing 401 × 401 inspection grid, 156,415 cells (97.27%) have complete area support from successful stereo matching and both heights available. Unshifted NAC-minus-mission differences have median +0.781 m, central 90% −0.473 to +2.215 m and RMS 1.167 m. These are product differences, not independent accuracy or image-registration bounds. The sources share LOLA control heritage; source documentation reports varying photo-to-DTM offsets.

## Recorded landmark finding

The northern-crater fit from v0.10 falls on confidence category 1 (shadowed) at both nominal coordinates and has no valid stereo height. It cannot be validated using this stereo reference. The separate bowl check has category 14 and an available height, but its correspondence remains unreviewed. The earlier 25.4 m mismatch remains a result of tentative picks, not an accuracy estimate. Zero correspondences are accepted; no correction is applied. STEREO_REFERENCE.md contains the source-linked audit.

Reference terrain cannot supply mission registration picks. Its mission-pair markers and cursor are hidden, adding a pair is disabled, and keyboard/mouse selection is blocked. Switching back to the mission terrain restores that workflow; existing mission pairs retain their original source identities. Exports include reference identity and displayed source/layer. Source-specific controls prevent other terrain areas inheriting this Shackleton reference.

## Verification

49 JavaScript and 24 Python tests pass (73 total). Current data validation passes 97 imagery, 84 existing inspection and 54 stereo-reference checks (235 total). Checks cover scientific PDS decoding, original/native crop identities, complete-cell support, reconstructed height summaries and the historical landmark audit. Original horizon, ephemeris, candidate and uncertainty evidence remains unchanged.

Browser evidence and current exports are in browser-validation-v0.11.json. The local release and its clean-extraction validation are under release/. Prior states remain under history/.

## Roadmap state

M0–M7 bounded implementation milestones are complete. M8 acquisition, measurement tooling and this source-quality review are delivered; physical correspondence acceptance remains open. Human testing is deferred with zero participants. Independent scientific review, full-field terrain uncertainty, operational validation and event eligibility remain open. No public deployment or submission has been made.

Registration acceptance requires unambiguous supported features distributed across the crop, separate check landmarks and reviewed correspondences before any precise overlay. Source quality is a screening tool, not automatic acceptance. The bounded visual search is now delivered without an accepted correspondence set; the next product work is the guided demonstration of the existing decision workflow and evidence.

## Current research continuation: complete-crop landmark atlas

`landmark-review/index.html` now provides a self-contained nine-region comparison of the photo, mission hillshade, two opposite stereo hillshades and confidence map. Its source-bound JSON accounts for all 160,801 inspection cells and all 156,415 supported cells. Initial agent inspection identified western crater groups for closer rim review, while showing that eastern regions with 100% support can still lack distinctive features. Small crater detail is smoothed in the mission terrain. No new physical pairs or corrections were accepted. `landmark-review/REVIEW.md` records the findings and next acceptance steps. This is a separate research artifact following build 0.11, not a new packaged application release.

Native-photo follow-up inspected three 300 m western windows (90,000 original photo pixels each) against mission terrain under opposite illumination and the stereo reference. Exact source hashes, footprints and regional confidence counts are recorded in `landmark-review/native-rim-review.json`. Crater neighbourhoods are recognizable, but unique mission-side rim points remain unresolved. All three search candidates remain unaccepted; picking uncertainty is unmeasured and no fit was attempted. The next correspondence search should prioritize broader distinctive features, rather than infer precision from these small crater shapes.

Broad-feature follow-up is in `landmark-review/ridge-profiles.png`, its source-bound JSON and 1,203-row sample CSV. Three full-width transects show the ridge in both terrain products; sampled maximum positions differ by 0, 4.99 and 0 m. These differences are terrain-product comparisons, not photo registration residuals. The broad ridge and its illumination-dependent photographic transition do not supply a reviewed point set. This closes the bounded search deliverable while leaving physical registration acceptance open. Next: a guided, evidence-linked demonstration of the supported terrain/time-window decision, retaining imagery as unregistered context.

## Guided demonstration delivered locally

`/docs/demo/index.html` now walks through the question, live baseline/delayed comparison, terrain explanation, continuous activity window and evidence export. It uses the existing mission engine with checksum-verified coordinate-specific candidate evidence. Keyboard delay changes reproduced 5.17 h at zero delay and 53.17 h at +48 h; the two-hour activity starts at the sampled 16 November 18:50 UTC window. Chapter navigation and the actual evidence download were checked in the browser. The saved export passes 82 checks, including 73 existing software hashes. Desktop layout was visually inspected; no human testing or mobile browser verification is claimed.

This local demonstration and research continuation are newer than the retained build 0.11 ZIP. Next delivery work: integrate the guide into release discovery, include these additions in a fresh reproducible package, and check the packaged guide from a clean extraction. Scientific registration and independent review remain separate open gates.
