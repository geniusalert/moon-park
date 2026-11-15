# Connected visual planner — 2026-11-14

The local app now uses three progressive setup menus: choose a location, set arrival/stay, and review/write. Selecting a catalogue or globe coordinate stages it; the Write action adds it and starts the existing calculation service. Optional source portals and imagery legend are at the end of setup.

Five tabs share one selected result and replay cursor: Moon globe, centered location map, calculated horizon, mission timeline, and 3D sky. The replay and visibility-event readouts remain below the tabs. The detailed angular chart, terrain view, scientific evidence, uncertainty controls, engineering assumptions, alternative search, export and restoration remain accessible.

## Browser checks on the development machine

- Apollo 11 and Apollo 12, arrival 2027-01-01 00:00 UTC, 72 h stay, 2 m observer: both jobs completed through the three-step interface. The second site revealed comparison cards, each with its own centered map and calculated Sun/Earth/overlap strip.
- At Apollo 12, moving replay to its last sample set both the active time and replay text to 2027-01-03T23:50:00Z. The horizon scene reported Sun −19.81° hidden and Earth 60.22° visible, matching the numerical readouts. This checks UI synchronization, not absolute scientific accuracy.
- Two-date tool at Apollo 12: 2027-01-01 00:00 and 2027-06-21 12:00, same 72 h stay. Both jobs completed; two result cards and two visual previews appeared. January showed 33 h sunlight; June showed 72 h. The existing model limitations apply.
- Custom point −42.2295° latitude, 40.088863° east longitude: generated through exact-coordinate entry and Write. All three pinned jobs completed. The location map centered on that coordinate rather than the south pole; no interface error was present.
- A 390 × 844 viewport displayed vertically stacked setup controls. The measured document width was 375 px within a 390 px viewport, with no horizontal page overflow. Desktop layout was visually inspected. This is a layout check, not a five-person usability study.
- No browser error logs were captured during the inspected generation/replay flow. JavaScript syntax checks passed for navigator.js, planner-flow.js and navigator-seasons.js. Static HTML inspection found no duplicate IDs and retained all timeline, horizon, 3D, event, terrain, restore and seasonal-result targets.

## Map and horizon display limits

The location map is an azimuthal equidistant geographic display on the existing 1737.4 km reference sphere, with 100/250/500 km distance rings. It adds no imagery registration, terrain source coverage or hazard assessment. At a pole, the selected longitude defines its tangent orientation. Map clicks convert back to latitude/longitude and stage a new coordinate.

The horizon scene uses the selected result's actual horizon profile and sampled Sun/Earth azimuth/elevation, including hidden states. Its elevation scale adapts to the data; glyph sizes and glow are illustrative. Reference-sphere results explicitly identify omitted terrain. The detailed angular chart retains numeric axes.

Scientific algorithms were retained. Full scientific regression, fresh-release packaging, human usability evaluation and hardware validation were not performed as part of this visual pass. Seasonal preview behavior and exports retain their existing evidence and workspace semantics.


## Capability access correction — 2026-11-14

Custom coordinates had been retained inside a collapsed disclosure, which made the option difficult to discover. Latitude/longitude now appear directly in step 01, with Site catalogue, Custom coordinates and Mission programmes shortcuts above the steps. Opening the next step no longer closes an earlier one.

The control inventory was compared with the preserved 0.16 HTML. Whole Moon, South pole and Focus selected location were restored. Only the explicitly retired Recorded example control is absent from that inventory; retained scientific controls and results were not removed. Restoration is now available with zero selected sites.

Browser review confirmed custom latitude/longitude entry, the location and arrival steps open simultaneously, and workspace restore available. Syntax checks passed for the modified navigator and flow modules. This is a discoverability correction, not a change to scientific calculations.


## Terrain loading repair — 2026-11-14

The reported Site01 region 1 grid-west result was generated successfully by the worker (61.62 s cold runtime), but the previous interface exposed empty result containers, an incorrect location prompt, and a stale completion message while work was still pending. The repaired UI reports queued/running stages and worker-provided stage percentages, with cancel and retry actions. Blank terrain/inspection/metrics containers are withheld until the current result exists. Features return automatically when it completes.

Targeted verification: nine Node checks passed, including retained prepared-point regression and new running/queued/cancelled/failed/completed status checks. Browser testing completed the exact reported point, showed calculated 3D sky and eight live metrics, cancelled an uncached nearby coordinate, then retried it successfully. Live terrain progress reached 48% during inspection. Cancellation did not display a result. Custom-job pending state is owned by the calculation lifecycle, so a superseded selection handler cannot clear a newer job's loading state. The obsolete south-pole-only map click listener was removed; the replacement location-centered map retains coordinate picking.

These checks address job and display behavior. They do not establish new scientific accuracy bounds or a new packaged release.
