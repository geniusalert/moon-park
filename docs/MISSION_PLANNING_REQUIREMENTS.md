# Mission-planning requirements map

Moon Park addresses a practical planning gap: a user can compare a candidate location and revised arrival on one screen, inspect what changes at the surface horizon, and carry the result into a source-identified brief.

| Need in the challenge | Navigator response | What the result means |
|---|---|---|
| Avoid stitching together difficult analysis interfaces | Local map, date controls, scenario cards and inspection share one workflow | Prepared 2026 points work offline; custom south-pole calculations need local sources |
| Compare sites and dates quickly | Pin up to three points; compare baseline and shifted arrival; show signed Sun/Earth/shared-window and peak-angle changes per point, a plain-language trade-off summary, and bounded alternatives | Revised status includes all entered geometric and continuous-activity limits; ranking covers only the displayed/tested choices |
| Assess sunlight and power opportunity | Total and longest sunlight windows, peak solar elevation and a terrain-screened horizontal-surface direct-beam geometric projection | No electrical energy, panel output, thermal survival, panel pointing, slope, eclipses or hardware model |
| Assess direct-to-Earth opportunity | Independent total and longest Earth-centre visibility window plus a shared Sun/Earth window | Geometric line of sight above sampled terrain; no antenna, link budget, ground station or RF model |
| See time remaining to a visibility change | Sampled countdown to next sunset/sunrise and Earthset/return, with UTC bracket | Ten-minute transition bracket, not a precise event prediction |
| Understand terrain and time together | Polar map, 3D surface, horizon sky, time scrubber and sampled terrain-ray witnesses | Display mesh spacing differs from native horizon calculation detail |
| Serve technical and non-specialist audiences | Plain-language summary with detailed source traces and methods available nearby | N9 human comprehension study still requires actual participants |

The product’s specific contribution is the arrival-change workflow: independent Sun and Earth windows, signed impact deltas per pinned location, their simultaneous overlap, the next operational visibility change, a bounded delay shortlist, and terrain witnesses tied to the calculation sources. Each layer can be read separately, so a user can see whether a schedule change improves lighting, communication geometry, or both.

A “passing” scenario only meets user-entered geometric thresholds in this model. It is not a landing decision, mission-feasibility result, power estimate or communication-link certification.


The 0.15 integration places these capabilities in one inspected-result workflow. A NASA-textured globe selects exact supported coordinates, while sourced Apollo markers provide historical context outside the cap. Original/revised selection and temporary seasonal or tested-delay previews drive the same local terrain, global direction vectors, live elevation/clearance values, terrain horizon and replay interval. Three curated polar destinations calculate independently rather than inheriting another point's evidence. See INTEGRATED_NAVIGATOR.md for checks and limits.
