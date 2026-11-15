# Moon Park functional audit

14 November 2026. Scope classifications combine implementation review, previously recorded integration runs and current regression results. They do not represent 83 independent end-to-end tests. Global calculations use a reference sphere. Measured topography is available within supported 85–90°S coverage. Results use ten-minute bins.

| ID | Priority | Requested capability | Assessment | Evidence area or gap |
|---|---|---|---|---|
| F01 | P0 | Allow users to select predefined lunar landing sites. | Implemented in supported scope | Mission catalogue, globe picker, workspace export/restore |
| F02 | P0 | Support manually entered lunar latitude and longitude. | Implemented in supported scope | Mission catalogue, globe picker, workspace export/restore |
| F03 | P0 | Allow users to select and save multiple landing sites. | Implemented in supported scope | Mission catalogue, globe picker, workspace export/restore |
| F04 | P1 | Retrieve terrain elevation for selected coordinates. | Partial | Measured elevation only for covered south-polar coordinates. |
| F05 | P1 | Identify nearby candidate landing sites. | Partial | Catalogue and polar map support manual exploration. Automatic proximity search is missing. |
| F06 | P1 | Retrieve geographical information about craters, ridges, and slopes. | Partial | Measured relief and sampled slope are available. General named-feature lookup is missing. |
| F07 | P1 | Support landing sites from Apollo, CLPS, and other lunar missions. | Implemented in supported scope | Mission catalogue, globe picker, workspace export/restore |
| F08 | P1 | Store selected sites and their associated information for later comparison. | Implemented in supported scope | Mission catalogue, globe picker, workspace export/restore |
| F09 | P0 | Allow selection of a landing date and time in UTC. | Implemented in supported scope | Scenario controls, seasonal comparison and replay |
| F10 | P0 | Support evaluation over configurable periods (hours, days, lunar cycles). | Partial | 1–168 hour stays. A continuous full lunar cycle exceeds the limit. |
| F11 | P0 | Calculate conditions at any supported point in the selected time range. | Implemented in supported scope | Scenario controls, seasonal comparison and replay |
| F12 | P0 | Support forward and backward time navigation. | Implemented in supported scope | Scenario controls, seasonal comparison and replay |
| F13 | P0 | Calculate changes in conditions when the landing date changes. | Implemented in supported scope | Scenario controls, seasonal comparison and replay |
| F14 | P0 | Compare multiple dates for the same landing site. | Implemented in supported scope | Scenario controls, seasonal comparison and replay |
| F15 | P1 | Support mission schedule changes and delayed landing scenarios. | Implemented in supported scope | Scenario controls, seasonal comparison and replay |
| F16 | P1 | Calculate variations across different lunar days and seasons. | Implemented in supported scope | Scenario controls, seasonal comparison and replay |
| F17 | P0 | Calculate the Sun's position using lunar ephemeris data. | Implemented in supported scope | Mission engine, Horizons/SPICE observations, sampled horizon and event detection |
| F18 | P0 | Calculate solar elevation angle relative to the local horizontal plane. | Implemented in supported scope | Mission engine, Horizons/SPICE observations, sampled horizon and event detection |
| F19 | P0 | Calculate solar azimuth angle. | Implemented in supported scope | Mission engine, Horizons/SPICE observations, sampled horizon and event detection |
| F20 | P1 | Determine whether the Sun is above the local terrain horizon. | Implemented in supported scope | Mission engine, Horizons/SPICE observations, sampled horizon and event detection |
| F21 | P0 | Calculate upcoming sunrise and sunset events when applicable. | Implemented in supported scope | Mission engine, Horizons/SPICE observations, sampled horizon and event detection |
| F22 | P0 | Calculate time remaining before the next sunlight-to-shadow transition. | Implemented in supported scope | Mission engine, Horizons/SPICE observations, sampled horizon and event detection |
| F23 | P0 | Determine continuous sunlight periods. | Implemented in supported scope | Mission engine, Horizons/SPICE observations, sampled horizon and event detection |
| F24 | P0 | Calculate sunlight duration over a selected evaluation period. | Implemented in supported scope | Mission engine, Horizons/SPICE observations, sampled horizon and event detection |
| F25 | P1 | Calculate Sun movement across different dates and seasons. | Implemented in supported scope | Mission engine, Horizons/SPICE observations, sampled horizon and event detection |
| F26 | P0 | Calculate Earth's apparent position from the lunar landing site. | Implemented in supported scope | Mission engine, Horizons/SPICE observations, sampled horizon and event detection |
| F27 | P0 | Calculate Earth elevation angle. | Implemented in supported scope | Mission engine, Horizons/SPICE observations, sampled horizon and event detection |
| F28 | P0 | Calculate Earth azimuth angle. | Implemented in supported scope | Mission engine, Horizons/SPICE observations, sampled horizon and event detection |
| F29 | P1 | Determine whether Earth is above the local terrain horizon. | Implemented in supported scope | Mission engine, Horizons/SPICE observations, sampled horizon and event detection |
| F30 | P0 | Calculate Earthrise and Earthset events where applicable. | Implemented in supported scope | Mission engine, Horizons/SPICE observations, sampled horizon and event detection |
| F31 | P0 | Calculate continuous direct-to-Earth visibility windows. | Implemented in supported scope | Mission engine, Horizons/SPICE observations, sampled horizon and event detection |
| F32 | P1 | Calculate communication blackout periods caused by terrain obstruction. | Partial | Earth-hidden intervals calculated. Attribution to terrain alone would require comparison to an unobstructed reference. |
| F33 | P0 | Determine time remaining before the next Earth visibility transition. | Implemented in supported scope | Mission engine, Horizons/SPICE observations, sampled horizon and event detection |
| F34 | P1 | Account for lunar libration and relevant orbital variations. | Implemented in supported scope | Mission engine, Horizons/SPICE observations, sampled horizon and event detection |
| F35 | P0 | Calculate durations when Earth visibility and solar illumination overlap. | Implemented in supported scope | Mission engine, Horizons/SPICE observations, sampled horizon and event detection |
| F36 | P0 | Determine whether a landing site receives direct solar illumination. | Implemented in supported scope | Solar geometry, mission window metrics and entered limits |
| F37 | P0 | Calculate total sunlight availability within the selected period. | Implemented in supported scope | Solar geometry, mission window metrics and entered limits |
| F38 | P1 | Determine the longest uninterrupted sunlight window. | Implemented in supported scope | Solar geometry, mission window metrics and entered limits |
| F39 | P1 | Calculate continuous shadow periods. | Implemented in supported scope | Solar geometry, mission window metrics and entered limits |
| F40 | P1 | Estimate solar power-generation potential based on Sun incidence angle and panel assumptions. | Partial | Ideal horizontal incidence projection only. Configurable panel orientation and efficiency are missing. |
| F41 | P2 | Estimate available solar energy when panel specifications are provided. | Missing | No panel-specification energy integration. |
| F42 | P1 | Identify potential battery-support requirements during prolonged darkness. | Partial | Longest darkness and its limit flag potential storage needs. Load and battery sizing are missing. |
| F43 | P1 | Identify unfavorable lighting conditions for mission operations. | Implemented in supported scope | Solar geometry, mission window metrics and entered limits |
| F44 | P2 | Estimate thermal exposure or risk using explicitly defined models and assumptions. | Missing | No defined thermal exposure model. |
| F45 | P1 | Integrate lunar topography datasets, such as NASA LOLA-derived DEMs. | Implemented in supported scope | Polar LOLA worker, airless rays, terrain witnesses and comparison |
| F46 | P1 | Calculate the local horizon using surrounding terrain elevation. | Implemented in supported scope | Polar LOLA worker, airless rays, terrain witnesses and comparison |
| F47 | P1 | Detect terrain obstacles blocking sunlight. | Implemented in supported scope | Polar LOLA worker, airless rays, terrain witnesses and comparison |
| F48 | P1 | Detect terrain obstacles blocking Earth visibility. | Implemented in supported scope | Polar LOLA worker, airless rays, terrain witnesses and comparison |
| F49 | P1 | Account for hills, crater rims, and steep slopes in line-of-sight calculations. | Implemented in supported scope | Polar LOLA worker, airless rays, terrain witnesses and comparison |
| F50 | P1 | Calculate terrain shadow conditions at selected locations and dates. | Implemented in supported scope | Polar LOLA worker, airless rays, terrain witnesses and comparison |
| F51 | P0 | Handle the Moon's absence of atmospheric refraction. | Implemented in supported scope | Polar LOLA worker, airless rays, terrain witnesses and comparison |
| F52 | P1 | Evaluate how small coordinate changes affect illumination and communication. | Implemented in supported scope | Polar LOLA worker, airless rays, terrain witnesses and comparison |
| F53 | P1 | Support configurable terrain resolution and report accuracy limitations. | Partial | Automatic source selection and limitations exist. User-selected calculation grid spacing is missing. |
| F54 | P0 | Compare multiple landing sites for a selected date. | Implemented in supported scope | Navigator comparisons, delay grid, alternatives and workspace exports |
| F55 | P0 | Compare multiple dates for the same site. | Implemented in supported scope | Navigator comparisons, delay grid, alternatives and workspace exports |
| F56 | P0 | Compare multiple combinations of landing locations and dates. | Implemented in supported scope | Navigator comparisons, delay grid, alternatives and workspace exports |
| F57 | P0 | Calculate differences in sunlight availability between scenarios. | Implemented in supported scope | Navigator comparisons, delay grid, alternatives and workspace exports |
| F58 | P0 | Calculate differences in Earth communication availability. | Implemented in supported scope | Navigator comparisons, delay grid, alternatives and workspace exports |
| F59 | P0 | Compare continuous sunlight and blackout durations. | Implemented in supported scope | Navigator comparisons, delay grid, alternatives and workspace exports |
| F60 | P1 | Allow mission-specific constraints such as minimum sunlight or maximum blackout duration. | Implemented in supported scope | Optional minimum total sunlight and maximum continuous direct-Earth blackout feed scenario decisions and alternative filtering. |
| F61 | P1 | Determine which landing scenarios satisfy configured constraints. | Implemented in supported scope | Navigator comparisons, delay grid, alternatives and workspace exports |
| F62 | P1 | Generate mission feasibility scores using transparent, adjustable criteria. | Missing | Threshold pass/fail and transparent ranking exist. No adjustable numerical feasibility score. |
| F63 | P1 | Recommend alternative landing dates when a scenario is unfavorable. | Implemented in supported scope | Navigator comparisons, delay grid, alternatives and workspace exports |
| F64 | P1 | Recommend nearby landing sites with better conditions. | Partial | Passing alternatives can use other pinned sites. Nearby unpinned points are not searched. |
| F65 | P1 | Rank landing scenarios according to mission requirements. | Implemented in supported scope | Navigator comparisons, delay grid, alternatives and workspace exports |
| F66 | P1 | Explain the calculated trade-offs between candidate scenarios. | Implemented in supported scope | Navigator comparisons, delay grid, alternatives and workspace exports |
| F67 | P1 | Export scenario comparisons and mission analysis reports. | Implemented in supported scope | Navigator comparisons, delay grid, alternatives and workspace exports |
| F68 | P0 | Integrate JPL Horizons, SPICE, or verified lunar ephemeris datasets. | Implemented in supported scope | Source checks, caching and retained scientific verification reports |
| F69 | P0 | Use consistent lunar coordinate and reference frame conventions. | Partial | Frame checks and conversions exist. Cross-source catalogue frame offsets remain unquantified. |
| F70 | P0 | Convert ephemeris data into local Sun/Earth altitude and azimuth. | Implemented in supported scope | Source checks, caching and retained scientific verification reports |
| F71 | P0 | Calculate accurate time-dependent celestial positions. | Partial | Representative elevation agreement is documented. Absolute accuracy across all coordinates and times is unestablished. |
| F72 | P0 | Validate calculated values against trusted scientific references. | Implemented in supported scope | Source checks, caching and retained scientific verification reports |
| F73 | P1 | Cache ephemeris and terrain datasets to improve performance. | Implemented in supported scope | Source checks, caching and retained scientific verification reports |
| F74 | P0 | Handle unavailable, incomplete, or low-resolution scientific data. | Implemented in supported scope | Source checks, caching and retained scientific verification reports |
| F75 | P0 | Maintain appropriate calculation precision and UTC time standards. | Partial | Supported UTC grid and event brackets enforced. Mission-specific precision beyond this resolution needs validation. |
| F76 | P0 | Document data sources, model assumptions, and uncertainties. | Implemented in supported scope | Source checks, caching and retained scientific verification reports |
| F77 | P1 | Provide both beginner and advanced user modes. | Partial | Guided demo and technical detail exist. No explicit beginner/advanced mode switch. |
| F78 | P1 | Explain scientific terms and calculated metrics. | Implemented in supported scope | Navigator, guided demo, responsive controls and workspace |
| F79 | P2 | Support guided educational lunar mission scenarios. | Implemented in supported scope | Navigator, guided demo, responsive controls and workspace |
| F80 | P1 | Allow users to adjust mission assumptions and constraints. | Implemented in supported scope | Navigator, guided demo, responsive controls and workspace |
| F81 | P1 | Support desktop and mobile access. | Implemented in supported scope | Navigator, guided demo, responsive controls and workspace |
| F82 | P1 | Allow users to reset, save, and revisit scenarios. | Implemented in supported scope | Navigator, guided demo, responsive controls and workspace |
| F83 | P1 | Generate understandable summaries of mission risks and trade-offs. | Implemented in supported scope | Navigator, guided demo, responsive controls and workspace |

## Verification

92 JavaScript and 51 Python tests passed in this audit. Direct-Earth blackout intervals and longest blackout were added to results and the comparison. For the prepared Connecting ridge revised stay, the longest blackout is 12 h 40 min. A calculation check confirmed visible plus hidden interval durations sum to 72 h.

See [global cross-method checks](mission-global-verification.json), [polar worker evidence](mission-polar-integration.json), [sampling and release evidence](navigator-objective-verification.md), and [project milestones](../plan.md). These retained checks cover selected points and dates. Independent scientific review and real-user interpretation evidence are outstanding.

The [official challenge](https://www.spaceappschallenge.org/2026/challenges/lunar-landing-site-navigator/) asks for rapid site/date comparison, visual Sun/Earth positions, power potential and direct Earth windows. Those workflows are implemented. The user-supplied F01–F83 list is the broader acceptance checklist.

## Extended duration and visibility acceptance, 14 November 2026

94 JavaScript tests and 51 Python tests passed. The live reference-sphere worker requested Sun and Earth observations at 0.67� N, 23.47� E for all three observer heights, with a 31 December 2027 23:50 UTC arrival, 72-hour shift, 72-hour recovery allowance and 744-hour stay. At 2 m the latest recovery scenario integrated 4,464 ten-minute bins through 6 February 2028 23:50 UTC. It yielded 389.5 hours of modeled sunlight and zero direct-Earth blackout hours. Result SHA-256 was d5b4dd5b9e440ad178dec0667b9c92ba79408a792b879c216855baa2d80b6599. This checks the global sphere calculation path. Terrain effects at this coordinate are outside its scope.

The prepared Site01 terrain calculation at its original arrival over 720 hours yielded 720 modeled sunlight hours and a 321.5-hour longest Earth blackout. A 720-hour minimum sunlight requirement passed and a zero-blackout requirement failed. Tests cover equality, separated blackout intervals, overlapping failures, invalid limits and the mission-duration boundary. The live run exposed a Horizons timestamp representation with omitted zero seconds. The parser now accepts it and continues checking every timestamp against the expected UTC grid.
