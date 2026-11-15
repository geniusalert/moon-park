# Moon Park — regional visibility and frame checks

Build 0.3 · 11 November 2026

The current build extends the terrain calculation to 180 km, uses native 5 m terrain near each point, and computes Sun/Earth geometry directly in the terrain's DE421/MOON_ME reference frame. Full mission feasibility remains unknown because finite coverage, unresolved terrain, uncertainty and omitted engineering models still matter.

## What changed and why

| Item | Build 0.2 | Build 0.3 |
|---|---|---|
| Terrain coverage | Local maps; minimum ray coverage about 7 km | Every sampled ray reaches 180 km |
| Terrain samples | 20 m resampled local grid | Bilinear native 5 m local grid; 240 m regional grid outside local coverage |
| Observer ground | Coarser-grid elevation | Native-grid interpolated elevation at the same coordinates |
| Azimuth sampling | 1° | 0.25° |
| Radial sampling | 20 m | 5 m to 200 m, 20 m to 12 km, then 120 m |
| Astronomy | Horizons reference at 2 m | Frame-matched SPICE, recalculated for 2/5/10 m observers |
| Time evidence | 10/20/30-minute bin comparison | Additional direct 1/5/10-minute recomputation on five scenarios |

The ground correction is approximately +0.404 m at Site01, +0.058 m at Site04 and +0.169 m at Site11. Coordinates and the research-point selection rule are unchanged. These are demonstration research points, not certified landing candidates.

## Regional terrain impact

The retained benchmark contains 18 configurations: three sites, three arrival dates, and baseline/+48 h delay, all using 72 h missions and 2 m observers. The comparison separates the original build from the corrected local model, then compares corrected local against regional using identical geometry and finer rays.

Adding regional terrain reduces combined Sun/Earth hours in **8 of 18** cases. The largest reduction is **58.17 hours**. Sunlight totals do not change from adding the regional layer in these tested cases. This is a measured result for this benchmark, not a global claim about all lunar locations or dates.

The old-to-new comparison includes several corrections. Only the corrected-local-to-regional comparison isolates regional terrain. See [the impact report](terrain-impact.json) and [retained original baseline](terrain-impact-baseline.json).

## Coordinate and ephemeris checks

NASA PGDA identifies both terrain products as MOON_ME / DE421. The NAIF frame kernel explicitly associates MOON_ME with MOON_ME_DE421, and the calculation loads the corresponding binary lunar orientation kernel and DE421 planetary ephemeris. Observer positions use the same 1737.4 km sphere as the rasters. Azimuth/elevation come from orthonormal local north/east/up vectors. [PGDA regional data](https://pgda.gsfc.nasa.gov/products/90), [NAIF frame kernel](https://naif.jpl.nasa.gov/pub/naif/generic_kernels/fk/satellites/moon_080317.tf)

The calculation uses SPICE `spkcpo`, with a constant body-fixed observer and converged light-time plus stellar aberration (`CN+S`). Its output frame is evaluated at the observer epoch. [NAIF documentation](https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/C/cspice/spkcpo_c.html)

For each site and target, 31 samples at 24 h spacing are compared against the retained Horizons outputs at identical coordinates and original observer altitude. Across all six comparisons, the maximum elevation difference is **0.00001351°**, approximately **0.049 arcseconds**. Maximum azimuth difference is below **0.00000626°**. These are cross-method residuals, not absolute accuracy estimates. Both paths use JPL products; differences also include ephemeris, frame realization and aberration choices. SPICE here does not add Horizons' gravitational light deflection. [Detailed frame report](frame-validation.json)

## Time sampling

Five scenarios were recomputed directly at one-minute spacing; five- and ten-minute results are subsets of that same calculation. This checks temporal discretization while keeping the terrain model fixed.

- The de Gerlache default delayed scenario differs by 4 minutes of combined availability between 10- and 1-minute bins.
- The Shackleton 21 November delayed scenario differs by 3 minutes of sunlight and longest darkness.
- The other three tested scenarios show no material change in these aggregate metrics.

This does not prove minute-level physical accuracy, and terrain uncertainty can exceed sampling effects. See [the temporal report](time-convergence.json).

## Remaining work

Build 0.4 adds conditional near-field clone and resolution checks; see [the current uncertainty report](UNCERTAINTY.md). Full-field/ensemble uncertainty and broader spatial convergence remain open. Regional pixels are 240 m; bilinear interpolation does not recreate sub-pixel ridges. Near-field data are interpolated laser-altimetry terrain, not perfect ground truth. Terrain beyond 180 km remains unmodeled. The solar disc uses a locally horizontal horizon approximation; eclipses, power, thermal survival and RF engineering are absent. Human usability and published-ROI candidate validation are still pending.
