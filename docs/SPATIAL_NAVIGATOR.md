# Spatial evidence navigator · build 0.5

The map contains three calculated research points and 15 published illumination-study outlines. Choosing an outline only shows its geometry and metadata. Use the separate modeled-point button to inspect the existing calculated point in its source area. Outlines are not approved landing zones and their interiors have not been simulated.

## Source and geometry

Source: [NASA PGDA 5 m lunar south-pole maps](https://pgda.gsfc.nasa.gov/products/78), including the Site01, Site04 and Site11 ROI archives. Archive bytes, source projection WKT, DEM source hashes and projection residuals are recorded in the spatial artifact. Files are read from memory without extracting archive paths. The lunar reference radius is 1,737,400 m; the source south-polar stereographic projection has central meridian 0° and standard parallel −90°.

Published attribute X/Y values are not used as research-point coordinates. Site04 regions 2 and 3 and Site11 region 3 contain attribute points outside the associated outline; Site11 region 4 has missing point attributes. These conditions are visible in the region inspector. The existing Site01 and Site11 research points fall in their region 1; Site04's point is outside all four outlines. This geometric association does not validate a landing candidate.

## Display and calculated evidence

Each native elevation tile is bilinearly downsampled to 129 × 129 display samples, with centers derived from its raster transform. Source heights are converted through lunar Cartesian coordinates into local east/up/negative-north scene axes, centered on the modeled point's ground elevation. Lunar curvature is preserved. The scene spans the local source tile, whereas computed horizons extend to 180 km.

Fixed scene lights emphasize relief and are unrelated to the replay Sun position. No mesh shadows or terrain safety classifications are computed. The optional 3×/6× exaggeration applies to terrain relief only. Sun and Earth ray directions retain physical angles; symbols, observer marker size and ray lengths are enlarged or shortened for display. Consequently the apparent intersection of a schematic arrow and coarse mesh is not a visibility calculation.

The sky panel shows the physical, unexaggerated 0–360° horizon at the chosen observer height. Enlarged Sun/Earth symbols follow the same time sample as the calculations. Sun classification uses the model's visible-disc fraction; Earth classification uses center clearance. Replay controls in both parts of the page stay synchronized. If WebGL is unavailable, the map and horizon sky remain available.

## Reproduction and evidence

Run `npm ci`, then `npm run vendor:three` to reproduce the pinned local Three.js assets and MIT license. Prepared display data ships with the application. With the native terrain cache available, run `npm run prepare:spatial`, `npm run validate:spatial`, then `python scripts/stamp_build.py`. The full `prepare:science` pipeline includes spatial preparation and validation.

The browser verifies the spatial artifact SHA-256 and its matching terrain source identities. Decision receipts record the spatial artifact and view state separately from scientific results. See spatial-validation.json for projection, grid, source, coverage and polygon checks. Automated numerical tests cover cardinal directions, projection inversion, local observer origin, curvature, polygon holes and missing display coverage.

## Next step

Generate new horizon/ephemeris calculations for explicitly chosen points inside selected published outlines. Validate geometry, sampling and coordinate frame at each new point, then compare spatial variation. Until that work is complete, an outline selection must not inherit a nearby point's results.
