# Image alignment workbench · build 0.9

Open `/registration.html` from the historical-image panel. It places the image crop and the mission's native 5 m DEM on the same north-up lunar projected footprint. Image values are averaged into approximately 5 m inspection cells; DEM heights are bilinearly sampled. The original native photo and scientific terrain remain unchanged. Transparent inspection cells cannot be selected.

Four synthetic hillshades use 30° light elevation and azimuths 45°, 135°, 225° and 315°. A separate slope contrast view maps 0–45° to grayscale. These are feature-identification aids, unrelated to historical or mission illumination. Image-valid fractions differ slightly from native fractions because an averaged cell can contain some supported source pixels. Numerical image↔DEM projection round-trip closure is zero at the five tested locations for each area because their projection definitions agree. This measures arithmetic closure only.

## Landmark workflow

Select the same identifiable, stable feature in both views. Prefer crater centers or geometric structures visible in both; moving shadow edges are unsuitable. Record a description and choose Fit or Check. Mouse and arrow/Enter selection are supported, with synchronized zoom and directional pan. Each area retains its own in-page pairs. Export before leaving: evidence is held in page memory, without server storage.

The fit adds a component-wise median X/Y translation from image to terrain coordinates. Check landmarks never enter that fit. The report gives fit and held-out RMS/max residuals separately. Duplicate coordinates, missing labels, invalid roles and unsupported pixels are rejected. The exploratory review threshold is three fit and three check landmarks, with each group spanning at least 20% of both crop axes. Passing this threshold means ready for review; registrationEstablished remains false. There is no automatic accuracy acceptance, applied shift, image drape or change to mission calculations.

Residuals do not include manual selection uncertainty, absolute geolocation error, rotation or local distortion. Matching shadows or maximizing brightness correlation can produce misleading offsets. This build does not use image intensity correlation to invent accepted correspondences. Actual registration remains unmeasured in all three areas, with zero accepted landmarks. Developer control tests are explicitly labeled arbitrary and are not scientific evidence.

## Evidence and reproduction

`python scripts/prepare_registration.py` checks exact image and DEM source hashes and prepares 18 masked display images plus an immutable common-grid catalog. The catalog records masks, projected bounds, resolution, source identities, numerical closure and processing-code identity. The browser checks catalog and image bytes before use. `python scripts/validate_registration.py` verifies 84 asset, mask, source and grid checks. Three numerical tests cover cell-center orientation, supported pixels, duplicate rejection and isolation of held-out evidence. They use constructed data rather than physical landmarks.

The alignment export records exact software/catalog/source identities, all unreviewed operator pairs and derived statistics. Zero-landmark exports explicitly retain null translation and unmeasured evidence. It is separate from the mission decision receipt.

## Acquisition gate

de Gerlache remains partially acquired at 82.3% native crop support. The source's HTTP 429 requested 3,600 seconds without retry. A conservative persisted cooldown uses the partial acquisition record time (11 November 2026, 18:34:53 IST), so requests are blocked until 19:34:53 IST. No network retry was made during this work. Future 429 responses now persist their own retry time and return promptly rather than blocking for an hour. After the cooldown, resume only missing ranges with `python -c "import sys; sys.path.insert(0,'scripts'); from prepare_context_imagery import prepare,PRODUCTS; prepare(PRODUCTS[1])"`. Source identity and exact HTTP range checks remain required.

After complete acquisition, regenerate imagery catalog, registration assets and both validators, then stamp software and refresh receipts. A crop can be fully acquired even if the original complete master file was never downloaded; fullFileSha256 stays null in that case. Actual stable-feature correspondence review is still required before any alignment claim.

## Build 0.10 continuation

Saved assessments can now be restored from JSON when their area-specific image, metadata, DEM and inspection identities match. Inputs are capped at 2 MB / 200 pairs; all results are recomputed. Rejected imports leave current pairs intact. Four numerical tests now cover orientation, held-out isolation, invalid/duplicate picks and source-bound restoration. Two additional Python tests cover corrupted cache rejection and prompt cooldown enforcement. PRELIMINARY_ALIGNMENT.md records two tentative agent-selected physical features, with zero accepted correspondences and no applied correction. The source-acquisition outcome for this build is recorded in STATUS.md.


## Current acquisition state after resume

Build 0.10 completed the de Gerlache context crop after the recorded cooldown. Its native crop and 5 m inspection view now have 100.0% supported pixels. The historical partial-state discussion above records the earlier acquisition gate; it is resolved for this requested crop. Precise overlays remain gated on physical correspondence evidence. PRELIMINARY_ALIGNMENT.md records two unreviewed Shackleton picks and the unresolved 25.4 m check mismatch.


## Build 0.11 source-quality review

The Shackleton source menu now includes a separate 2 m NAC stereo reference and scientific confidence layer. Direct link: /registration.html?area=Site04&source=stereo&layer=confidence. Reference terrain cannot supply mission registration picks and does not display old mission markers as if they belonged to the reference. Source/layer identities are exported. The audit finds the previous northern-crater fit lacks stereo-height support at its nominal coordinates; the previous check has support but remains unreviewed. See STEREO_REFERENCE.md for the original-PDS decoding, product-difference measurements, exact source links and acceptance limits.

