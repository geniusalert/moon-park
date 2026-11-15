# Moon Park — conditional terrain uncertainty and rank stability

Build 0.4 · 11 November 2026

This build separates terrain-error realizations from numerical checks. It reports sample counts, metric ranges, possible rank spans and common activity windows. These are conditional experiments, not probabilities or certified mission-feasibility statements.

## Published terrain realizations

We use fixed clone IDs 001, 026, 051 and 076 from the published PGDA products for each of the three research points. The source describes an ensemble of 100 realizations with modeled terrain-error properties. Four selected members cannot establish a calibrated probability or the full ensemble distribution. [PGDA products](https://pgda.gsfc.nasa.gov/products/78), [Barker et al. methods](https://ntrs.nasa.gov/api/citations/20205009660/downloads/Mike%20Barker_%20Paper_%20Improved%20Lola.pdf)

Despite their `_err.tif` suffix, the selected source rasters contain absolute clone surfaces. Their elevation ranges, co-registered differences and publication method were checked. We subtract the matching nominal DEM to obtain signed perturbations. A validity guard rejects an inconsistent interpretation before any profile is generated.

An 805 × 805 pixel crop retains the research point and a 2 km neighborhood with interpolation support. Perturbations are applied in full within 1.8 km and tapered smoothly to zero between 1.8 and 2.0 km. Outer local and regional terrain stays fixed. This avoids a sharp artificial crop-edge step, but it is an adapted, conditional near-field experiment rather than the full published clone surface. Each crop retains its source URL, source window, derived hash and observed error statistics. Crop RMS is a descriptive statistic for the square crop, not a pointwise error bound.

Observer ground shifts with the clone realization. The apparent topocentric vector is translated along the local radial axis using the actual target range. That correction is compared against direct SPICE at the start, middle and end of the observation interval for every variant, height and target. Tiny residuals from that comparison are implementation checks, not a terrain-accuracy claim.

## Numerical family

The nominal model uses native 5 m local terrain, 0.25° azimuths, radial samples of 5 m near the point, 20 m to 12 km and 120 m farther away. Separate variants test:

- 0.5° azimuths with the nominal radial grid.
- 0.125° azimuths with the nominal radial grid.
- A finer nested radial grid: 2.5 m, 10 m and 60 m.
- Local terrain averaged to 20 m, including its corresponding interpolated observer-ground estimate.

The 20 m experiment includes terrain and observer-ground representation changes. It is not a pure azimuth-convergence check. The finer radial grid contains every nominal distance, so it must not remove an obstruction at an existing sampled azimuth. Numerical cases are not counted as extra members of the published clone ensemble.

## Constraints and ranks

Every variant is evaluated with the same mission requirements and UTC interval. Reports include per-family pass counts, sunlight/overlap/darkness ranges and explicit failures. Missing variants make stability unavailable; they cannot be silently counted as successes.

Site ordering uses requirement satisfaction first, then total combined Sun/Earth availability. Differences within one 10-minute observation bin count as ties. Best/worst tested outcomes form conservative rank spans. No cross-site pairing of clone IDs is assumed, and no probability is assigned to combinations. A preferred point is called unchanged across tested cases only when one point remains preferred within those bounds and meets the requirements in every tested case.

Recovery search examines nominally passing candidates. Candidates passing every tested clone and numerical case are shown first; the remaining ordering is earliest extra delay, lowest observer height and greatest nominal overlap. This is a stated trade-off policy, not a learned suitability score or a global optimum.

## Common activity windows

Passing total-overlap and longest-darkness constraints does not imply that a single activity time works in all cases. The scheduler intersects the combined-visibility bins of the nominal model and every tested variant. It offers common activity intervals only if this full intersection supports the requested duration. Nominal-only opportunities are identified separately. Completeness errors prevent a shared-window claim.

## Evidence and limits

See `uncertainty-validation.json` for real benchmark results and constructed threshold probes. A probe deliberately places a hypothetical darkness limit between sampled extremes; it demonstrates sensitivity without pretending that this is an actual mission requirement. It is separate from the fixed benchmark.

The nearest 2 km alone is perturbed. Regional terrain error, uncertainty outside the crop, missing sub-grid relief, terrain beyond 180 km, finite temporal sampling, eclipses, thermal/power/RF models, published candidate-point approval and human usability remain open. A 4/4 result means four selected conditional cases passed; it does not mean 100% safety or 100% confidence.

## Measured results

The fixed benchmark contains 12 mission scenarios and 36 per-point cases at 10-minute spacing: arrival dates 14/21/29 November 2026, 2/10 m observers, baseline/+48 h delays, 72 h duration, maximum 12 h darkness and minimum 8 h combined availability.

| Measurement | Result in the tested sample |
|---|---|
| Requirement outcomes | No pass/fail changes relative to nominal in these 36 cases |
| Preferred point | Six scenarios have one preferred point, four have no unique preference, two have no passing choice |
| Near-field clone spread in Sun/Earth overlap | Up to 1.5 h (90 minutes), at Shackleton with a 10 m observer |
| Resolution-check spread in overlap | Up to 10 minutes |
| Separate one-minute Shackleton case | Clone sunlight ranges from 20 h 13 min to 20 h 17 min; resolution checks span three minutes |
| Constructed one-minute threshold probe | With a 51 h 45 min darkness limit and no required Earth overlap, 2/4 clones pass |
| Default recovery search | 42 nominally passing choices out of 63 attempted combinations; all 42 pass the eight selected variants |
| Default common activity window | Starts 16 November 2026 at 12:50 UTC, compared with 12:40 nominally; a 2 h activity fits in every tested case |

The hypothetical threshold probe deliberately tests a boundary. It is not evidence of an actual mission requirement. The zero sunlight spread in the coarse benchmark hid a four-minute spread in the separate one-minute case; coarse agreement must not be mistaken for exact agreement. Near-limit sampled results are explicitly flagged in the interface.

Verification comprises 28 JavaScript tests, 14 Python tests, 32 nominal data checks and 38 uncertainty checks. The uncertainty pipeline was reproduced using cached inputs. Browser checks verified live numeric updates, labeled keyboard sliders, rank/support displays, shared windows, the separate fine study, the timing warning, the shaded horizon range and the exported evidence. At a 390 px viewport, page width was 375 px with no horizontal page overflow.
