# Published-region interior sample study

Build 0.6 calculates 27 explicit sample points inside all 15 published illumination-study outlines across Site01, Site04 and Site11. There is one anchor per outline and four extra probes in outline 1 of each source area. These are research samples, not certified landing candidates or complete polygon evaluations.

## Selection and geometry

Select the valid native 5 m pixel center closest to the outline's bounding-box center, using an even-odd polygon test including holes. For the three expanded groups, target offsets of ±50 m in source map X and Y, selecting the closest distinct valid pixel inside the same outline. Thin or irregular geometry can shorten or deflect the target offset; actual offsets and target residuals are recorded. Grid-direction labels do not mean local compass directions. Published DBF point attributes are not used.

Ground elevation is evaluated at each selected coordinate on the native source raster. Each point receives its own curvature-aware horizon at 0.25° azimuth spacing, using the existing nested radial grid and 180 km local/regional coverage. Missing coverage rejects the point calculation. Observer-specific SPICE observations are computed separately at 2/5/10 m above that point's ground, every ten minutes from 14 November to 14 December 2026. Other locations' observations or terrain-clone outcomes are not reused as if they applied to the sample.

Immutable, per-point artifacts contain coordinates, source and software identities, compact horizons, observations, and time grids. Compact angular values are rounded to seven decimal places for serialization; this is not a physical accuracy claim. The browser checks SHA-256 and coordinate context before decoding data. Loading is limited to the selected region; stale asynchronous selections cannot replace a newer selection.

## Measured default example

Arrival 14 November 2026 UTC, delayed 48 h, 72-hour duration, 2 m observer, 12 h maximum darkness and 8 h minimum total Sun/Earth overlap:

- Site01 region 1: combined availability ranges from 53.17 to 59.33 h across five samples.
- Its south probe changes from 5.17 h at baseline to 53.17 h after delay. The configured nominal requirements change from fail to pass; modeled sunlight remains 72 h in both cases.
- Site04 region 1: five samples range from 21.00 to 28.17 h combined availability after delay, whereas the separately calculated original Shackleton benchmark point has zero. These points have different positions and horizons.
- Site11 region 1: five samples range from 56.67 to 56.83 h combined availability.

The ranges describe these selected locations, not continuous bounds over the regions, statistical intervals or uncertainty frequencies. An interior point's nominal pass does not inherit the original benchmark's clone support.

## Verification

The JavaScript report contains 242 checks covering artifact identity, projection, polygon inclusion, distinct points, source context, observer-height monotonicity and bounded metrics. Nine date/height scenarios evaluate all 27 points. A bounded default search across all points and seven delays tests 189 nominal choices; its measured runtime is recorded separately from the original robust search.

The Python report contains 519 checks: native point elevations, direct coordinate/height-specific SPICE serialization checks at three times for every point, and separate daily Horizons comparisons at three anchors. There are 186 additional target/time comparisons in those six reference tables. The maximum tested elevation difference is approximately 0.00001351°. This is an implementation-path comparison using related NASA/JPL resources, not independent observational truth or an error bound.

Read candidate-validation.json and candidate-science-validation.json for exact inputs and results. Reproduce with prepare:candidates, validate:candidates and validate:candidate-science. Source terrain and kernels must be available in data/raw; they are not bundled in the portable release.

## Remaining scientific limits

No candidate-specific terrain ensemble has been calculated. Whole-region coverage, unresolved relief, terrain outside 180 km, lunar eclipses, solar power, thermal survival, RF engineering and landing hazards remain outside this study. Additional field/ensemble testing and independent review are needed for stronger claims.
