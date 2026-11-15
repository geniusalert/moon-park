# Measured topography and orbital variations

Verified 13 November 2026 in the current local source build. Preserved release archives remain unchanged.

## Existing scientific foundation

Measured polar mode already uses source-identified LOLA elevations in curved, airless horizon rays, with valid local high-resolution data where available and broader terrain farther away. Missing terrain is rejected. The existing diagnostics record finite sampling, source spacing and a conditional beyond-radius envelope. The reference sphere is not inserted as an artificial obstruction beneath crater floors. Global sphere mode remains a separate approximation without measured ground elevation or local topography.

The existing coordinate-specific Horizons observations use high-precision lunar mean-Earth orientation, airless apparent positions and time-dependent Sun/Earth ranges. Recorded SPICE observations use their stored orientation and planetary kernels. These sources include orbital and rotational behavior; another sinusoidal libration term would double count it. The displayed Earth motion is not a recovered set of libration angles and does not isolate libration from other effects. Source/frame identities and earlier Horizons/SPICE comparisons remain the scientific evidence.

## New integrated inspection

Terrain appearance offers shaded relief, fixed display-slope bands (0–10°, 10–20°, 20–30°, ≥30°), and elevation colors normalized to the selected patch. Geometry remains true scale. Slopes use central elevation differences and projected display-grid distances without projection-scale correction. Boundary and missing gradients are gray; no zero slope is invented. These are descriptive display diagnostics, not native DEM hazard slopes. Elevation colors are patch-relative and cannot be compared as an absolute color scale across sites. Patch maximum minus minimum is relief, not measured crater depth.

The linked text panel records relief, maximum sampled display slope and spacing. Earth elevation, horizon clearance, unwrapped azimuth change and range extrema are computed from the active scenario's samples. Current hidden/visible state and UTC follow replay. Per-sample Earth/Sun range is now retained in mission results and JSON evidence; legacy missing ranges stay unavailable. No synthetic Earth motion is generated.

Steep surfaces and deep relief can be inspected with the new colors and the existing terrain witnesses, horizon and visibility timeline. Surface lighting is deliberately identified as shading rather than a shadow map. This update does not calculate a surface-wide shadow field or establish permanently shadowed regions, thermal conditions or landing safety.

## Verification

88 JavaScript tests pass, including display slopes on a 45° plane, missing support cells, azimuth wrapping and range/elevation extrema. Existing curved terrain, source-frame and airless checks are retained. No Python worker changes were made in this update; its previous 51-test pass remains recorded separately.

Browser verification: shaded/elevation/slope controls operate without console errors. The prepared selected patch has 2463.6 m relief and 27.1° maximum display-grid slope. During its revised mission, Earth elevation spans -2.695° to 1.463° and range 389838–402775 km. Arrival state is hidden and last replay state visible. Mobile client/scroll widths both equal 375 px at a 390 px viewport. Screenshot: terrain-dynamics.jpg. These are software checks, not independent validation or actual-user study.

## Primary references

[NASA PGDA south-pole terrain](https://pgda.gsfc.nasa.gov/products/90), [JPL Horizons manual](https://ssd.jpl.nasa.gov/horizons/manual.html), [JPL DE440/DE441 ephemerides and lunar libration orientation](https://ssd.jpl.nasa.gov/doc/Park.2021.AJ.DE440.pdf), [Horizons lunar-orientation update](https://ssd.jpl.nasa.gov/announcements/an20210929.html).
