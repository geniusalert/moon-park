# Integrated Moon navigator — 0.15

Implemented 13 November 2026. See navigator-integration-verification.json, navigator-integration-calculations.json and navigator-integration-tests.tap for retained evidence.

## Connected workflow

Globe / polar map / catalogue / entered coordinates → up to three pinned points → original/revised arrival comparison → shared inspected scenario → globe directions, terrain, live metrics, horizon and sampled timeline → tested-date or seasonal preview → explicit return or application → pinned workspace export.

The globe uses the NASA SVS CGI Moon Kit JPEG acquired from https://svs.gsfc.nasa.gov/4720/ with its checksum and credits in data/globe/manifest.json. It is a visual map, not the terrain calculation surface. Latitude/longitude use a documented reversible sphere mapping; 67 passing JavaScript tests include seam/pole round trips and local-to-global direction checks.

Six historical Apollo Lunar Module positions come from https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_sites.html (DE421 Mean Earth/Polar Axis coordinates; source updated 6 March 2017). They are visibly outside calculation coverage and cannot request unsupported results. Three additional supported polar destinations include the user's Shackleton/de Gerlache image-study coordinates and the exact geographic south pole. Image-product identity does not establish accepted registration or mission landing suitability.

## Shared inspection

One inspected result supplies every visual and textual panel. Original/revised replay uses the selected scenario's own UTC interval and observer height. Temporary seasonal and bounded-delay previews supply their own site model, terrain, source reference, observations and configuration without replacing pinned arrival inputs. Return, configuration changes and point changes clear the preview. The version-1 workspace keeps its existing shape with an optional inspection.scenario field; older matching workspaces default to revised. Source changes still require recalculation.

Local terrain uses true relief with an observer reference, north/east directions and sampled Sun/Earth arrows. The global globe transforms those same local directions into the Moon frame. Display illumination follows Sun direction without terrain-shadow simulation. Shape, glyph lengths and global image detail must not be interpreted as additional scientific resolution.

## Observed checks

- All 67 JavaScript tests and 30 Python tests pass.
- Browser original/revised switching changed the recorded point from 14 November to 16 November; keyboard replay advanced to 00:10 UTC and updated the globe's UTC description and live metrics.
- A +24 h additional-delay preview inspected 17 November while leaving the pinned 14 November original arrival unchanged.
- Real seasonal jobs at the interior grid-south point produced January 0 h overlap and June 45.67 h overlap. Selecting June opened its 21 June 2027 terrain/horizon result in the shared inspector while the pinned arrival stayed in 2026.
- A globe click produced -85.6600285 latitude / -57.5806059 longitude. Calculation and exported source references preserve those exact requested coordinates. The curated de Gerlache coordinate also calculated independently; all three exported point/result coordinate pairs were checked.
- Original-arrival inspection at sample 1 exported and restored as original-arrival inspection at 14 November 00:10 UTC.
- At requested 390 px width, both document and client width were 375 px after scrollbar allocation. Metric cards and location controls remained readable. Console error list was empty during observed workflows.
- Desktop globe, inspector and mobile screenshots are retained under docs/navigator-integrated-*.jpg.

## Package check

The 0.15 candidate was freshly extracted without optional raw sources. All 67 JavaScript and 30 Python tests passed there; all 96 stamped runtime source identities and the NASA JPEG checksum matched. Real custom UI calculations were exercised in the development workspace with existing acquired sources; no new network terrain setup is claimed.

## Limits

Calculations remain 85–90S with 2027 arrivals and the separate 2026 demonstration. Whole-Moon terrain coverage, engineering feasibility, independent scientific review and real participant evidence remain separate. N9 remains blocked with zero actual sessions. The prior 0.14 package is preserved.
