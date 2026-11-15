# Moon Park — delivery status

Updated 11 November 2026 · Build 0.5

## Latest milestone

Completed the spatial evidence navigator: interactive south-polar map, 15 published study outlines, three modeled research points, curved 3D lunar terrain and synchronized Sun/Earth directions. A full-azimuth horizon sky shows the calculation's physical angular profile. Both replay sliders share the same mission time.

The map supports overview, point-area and outline zoom, drag/pan, accessible point/outline selection and explicit switching from a study outline to its area's modeled research point. The scene supports orbit, zoom, top/oblique presets and true/3×/6× relief. Graphics assets are pinned and included locally with their license.

## Source findings

Three published point attributes fall outside their corresponding polygons; one is absent. These are flagged rather than used as calculated coordinates. The Site01 and Site11 research points lie within their region 1. The Site04 research point lies outside its published study outlines. No outline is presented as a newly calculated or certified landing site.

The local display mesh is approximately 124 m per sample and spans the native source tile. Original scientific calculations retain their separate 180 km terrain horizon. Scene lighting exposes relief rather than simulating mission shadows. Body symbols and ray lengths are schematic.

## Verification

- 33 JavaScript and 14 Python tests pass (47 total).
- 32 nominal, 38 uncertainty and 53 spatial checks pass (123 total).
- Spatial checks cover artifact identity, source context, projection, axes, mesh dimensions, finite scene vertices, point coverage, outline coverage and no invented ROI simulations.
- Source projection round-trip, cardinal directions, curvature, polygon holes and missing display samples have numerical tests.

Browser verified outline inspection without changing the calculated point, explicit switching to the modeled point, flagged source attributes, 3D/sky switching, synchronized replay sliders, observer height, top/oblique views and relief exaggeration. No browser console warnings/errors were recorded. At 390 px viewport width the document is 375 px wide, with no horizontal overflow. The browser-exported receipt retains 15-outline source metadata, selected point/view state, three result records and all 42 software hashes matching current files. preview-v0.5.png shows the completed navigator. Prior milestone evidence remains in history/STATUS-v0.4.md.

## Reproduction

Run npm start for http://127.0.0.1:4173. Prepared scientific and spatial artifacts are included. Native source caches are required to regenerate geometry with npm run prepare:spatial. The full prepare:science pipeline includes this stage. See SPATIAL_NAVIGATOR.md.

## Next milestone and release gates

Calculate and validate explicit representative points inside selected published study outlines, then expose spatial variation and computed coverage on the map. Human usability evidence, full-field/ensemble uncertainty, hazards and independent scientific review remain open. Terrain outside 180 km, eclipse, power, thermal and RF models are absent. No deployment has been made; full mission feasibility remains unknown.
