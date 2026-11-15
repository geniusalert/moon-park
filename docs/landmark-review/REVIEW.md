# Shackleton replacement-landmark review

12 November 2026 · Research continuation after application build 0.11

## Delivered

Open `index.html` for the self-contained atlas, or inspect `shackleton-review-atlas.png`. Every row is one of nine fixed, nonoverlapping regions covering the entire 401 × 401 inspection grid. The five columns show the historical photo, mission hillshade, stereo hillshade at azimuths 45° and 225°, and stereo confidence. The two stereo lighting directions help distinguish topographic shapes from photographic shading. They are synthetic illumination at 30° altitude, not reconstructed acquisition lighting.

The companion JSON records exact window edges, projected bounds, source hashes and complete-cell support for every region. The generator checks all consumed asset hashes against the application catalogues and verifies that the nine regions account for all 160,801 cells and all 156,415 supported cells. Run `python docs/landmark-review/build_atlas.py` from the repository root to reproduce these artifacts. The current packaged application remains build 0.11; this separate research artifact does not change its source stamp or calculations.

## Initial visual inspection

This is an agent inspection of the generated atlas, not an independent scientific review. No coordinates were selected and no matches were accepted.

- R1C1 and R3C1 contain several localized crater shapes worth examining at native photo resolution. Some crater interiors have stereo gaps; a rim feature must be inspected independently of its shadowed centre.
- R1C2 and R2C2 contain recognizable crater groups, but several interiors coincide with missing stereo heights. The earlier unsupported fit must not be reinstated simply because the surrounding region has high average support.
- R1C3, R2C3 and R3C3 have 100% complete-cell support, yet their relatively smooth surfaces provide fewer immediately distinctive point features. Support percentage alone is therefore unsuitable for ranking landmark quality.
- Small photo craters are substantially smoothed in the mission hillshade. A convincing photo-to-stereo resemblance alone cannot certify a photo-to-mission pair. The mission-side feature must itself be identifiable.

These observations nominate search regions, not feature correspondences. Fixed partitioning preserves the low-support regions and avoids selecting only visually convenient patches.

## Next acceptance work

1. Inspect native-resolution rim shapes in the western regions, then seek well-defined features elsewhere to obtain spatial spread. Record the exact physical feature being picked, rather than an illumination-dependent shadow centre.
2. For each proposed pair, record image and mission coordinates, local source support, plausible competing features and picking uncertainty. Repeat the selections without showing the previous coordinates to estimate repeatability.
3. Reserve independent check landmarks before estimating a shift. Insufficient mission-side detail is a reason to reject a candidate or retain an unregistered image.
4. Assess the fit and check residuals with the source's documented offsets and picking uncertainty. The workbench's count/spread threshold is only a review trigger; it is not scientific acceptance.

Physical registration remains open. The atlas supports this review; it supplies no new landing-feasibility claim, accepted correspondence or correction.

## Native-photo follow-up

Three western search regions were inspected in `native-rim-review.png`, using 300 × 300 original 1 m photo pixels per region. The mission terrain is shown under opposite synthetic illumination alongside stereo terrain and quality on the same nominal footprint. Terrain display enlargement adds no resolution. `native-rim-review.json` records the exact photo windows, all consumed hashes and enclosing native-confidence count bounds. Reproduce with `python docs/landmark-review/build_closeups.py`.

The initial search centres are common-grid pixels (50,29), (98,106) and (44,284); these define search areas, not picked landmarks. The northern window was moved slightly inward to preserve a complete 300 m source footprint. All actual footprint bounds are recorded.

Agent inspection found recognizable crater neighbourhoods in all three windows, but no uniquely defined corresponding rim point on the smoothed mission display. In Search 1 the prominent photographic crater has a shadowed stereo interior and a diffuse mission-side shape. Search 2 has a localized mission feature, but its specific rim location remains ambiguous under opposite lighting. Search 3 likewise shows a crater vicinity without a defensible point correspondence; its stereo interior includes unsupported categories. These are qualitative observations, not measured horizontal offsets.

Result: three searched windows, zero accepted pairs. Picking uncertainty is **unmeasured**, not zero; no repeated blind picks were performed because the initial point definition was unresolved. No translation was fitted. Physical registration must remain open until broader identifiable features or better resolved terrain support an unambiguous point definition. This follow-up does not exhaust all possible features in the crop.

## Broad ridge investigation and decision

`ridge-profiles.png` shows the photo and mission terrain with three fixed cross-crop transects, followed by their actual elevation profiles. `ridge-profile-samples.csv` retains all 1,203 samples, coordinates, heights, confidence fractions and support flags. `ridge-profiles.json` retains source identities and numerical summaries. Reproduce with `python docs/landmark-review/build_ridge_profiles.py`.

The rows 80, 200 and 320 cross the full crop at projected Y −6068.70, −6667.50 and −7266.30 m. There are respectively 380, 392 and 392 completely stereo-supported cells out of 401. Mission and supported-stereo sampled maximum X positions differ by 0, 4.99 and 0 m. These are differences between two elevation products on a common nominal grid; they are **not photo registration residuals**. The products share control heritage.

The mission profile's cells within one metre of its maximum span approximately 59.88, 24.95 and 19.96 m in X. This descriptive height band demonstrates why a broad high area is not a unique point; it is not a confidence interval or a measured picking error. The northern profile also has a broad, uneven top. No numerical comparison of photo brightness with elevation is attempted: the visible bright–dark transition depends on illumination and reflectance and cannot simply be treated as the crest. A recognizable extended ridge also does not supply independent, spatially distributed point constraints by itself.

**Bounded review decision:** the atlas, three native-photo searches and broad-ridge investigation are delivered. They have not established a defensible photo-to-mission correspondence set. Physical registration acceptance remains open; no shift is fitted or applied, and no claim of horizontal accuracy is added. Further registration work needs identifiable physical features with reviewed point definitions, repeatable picks and independent checks. Further variations of these visualizations alone would not satisfy that requirement.

The next product milestone should therefore assemble the existing decision workflow and its evidence into a clear guided demonstration, with the unregistered image explicitly presented as historical context. Physical registration remains a separate research gate and must not prevent demonstrating the supported terrain/time-window analysis.
