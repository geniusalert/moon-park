# Using Moon Park

Open the local application with `npm start`, then visit http://127.0.0.1:4173.

## Prepared demonstration

Choose **Recorded example**. The original November 2026 arrival has 5.17 combined Sun/Earth hours. A 48-hour delay gives 53.17 hours for the 72-hour stay. These are retained prepared results, separately labeled from 2027 calculations.

Pin up to three locations. Original and revised columns use the same location, stay length and observer height. The comparison separates total Sun time, longest continuous Sun window, direct Earth visibility, longest direct Earth window, simultaneous Sun/Earth overlap, longest shared window and peak solar elevation. Window durations are in hours; peak elevation is in degrees. Each point shows signed changes and a plain-language note on whether the arrival shift trades one window against another or changes both in the same direction. The revised status includes every entered model constraint, including the separate continuous-activity requirement. The starting limits are examples you can change; they are not official mission requirements or a landing go/no-go. Combined hours are simultaneous intervals, not an arithmetic sum. Inspect selects the map marker, terrain, horizon, timeline and historical context together. The replay slider supports arrow keys; its accessible value includes the selected UTC sample and Sun/Earth visibility state. Gold marks Sun, blue Earth and green combined availability. The 3D terrain has true relief and synthetic lighting; its colored spheres show directions, not physical distances or object sizes.

## A custom 2027 location

1. Switch the calculation period to **2027 — calculate locally**.
2. Enter latitude from -90 to -85 and east longitude, or click blank map space to fill these fields. Coordinates are retained exactly as entered after equivalent longitude normalization. At the pole longitude zero defines north/azimuth; it is a convention, not a unique geographic north.
3. Pin exact coordinates. Up to three queued jobs run one at a time. Cancel stops pending work; Calculate retries after a correction.
4. Enter arrival in UTC on a ten-minute grid, a 1–168 hour stay and initial delay 0–72 hours. Select 2, 5 or 10 m observer height. Calculate again when dates exceed available observations.
5. Read the failed requirements, inspect a continuous activity interval and explore alternatives. An alternative is one of the explicitly tested pinned sites and dates, not a global optimum.
6. **Use this arrival** makes an alternative the new original arrival with zero delay. It does not authorize or certify landing. Recovery into 2028 is evaluated for a late 2027 mission, but cannot be selected as a new arrival outside the agreed year.
7. Export the JSON workspace and the readable Markdown brief. Reopening a workspace recomputes comparisons; changed sources/software require fresh calculations.

## Interpretation

Sunlight requires at least half of the modeled disc above the sampled terrain horizon. The instantaneous solar panel reference is the sine of solar elevation for an ideal horizontal panel, set to zero when the modeled terrain blocks the Sun. It is a geometric projection only; it does not predict watts and does not account for panel tilt, terrain slope, hardware, thermal effects or eclipses. Earth visibility requires its centre strictly above the horizon and is shown as a direct-to-Earth line-of-sight opportunity. It does not predict RF link margin, antenna pointing or ground-station availability. The app shows a countdown range to the next sampled sunset/sunrise and Earthset/return of direct visibility. Event times are ten-minute brackets, not exact transition times. No transition found only describes the available interval. The cards report Sun and Earth windows separately as well as their simultaneous overlap. Combined hours can be scattered: the requested continuous activity must fit inside one uninterrupted combined window.

Ground detail is shown separately from display-mesh spacing. Nominal custom and interior results do not inherit the three benchmark points' conditional clone evidence. Historical imagery is unregistered context, not a predicted illumination overlay. A passing result establishes only these selected geometric requirements; it does not establish landing safety, power, radio performance, thermal survival or complete mission feasibility.

## How this fits rapid mission planning

A planner can compare three sites for one arrival schedule, then test a moved arrival across the same sites. The metrics expose separate lighting and direct Earth windows, simultaneous shared time, an instantaneous solar-angle reference, and time to the next modeled visibility change. This supports fast triage for science and engineering discussion; it does not make the final mission decision.

## Visual date comparison and replay

Availability bars use the same stay-length scale for original and revised Sun, direct Earth and shared time. Find passing alternatives also displays every tested delay in a horizontally scrollable grid. Select any cell to see its exact UTC arrival and signed requirement margins; negative values indicate shortfalls. Preview preserves the applied comparison. Apply arrival sets that tested arrival as the new original arrival with zero delay.

Use Arrival, Previous event, Play/Pause, Next event and Last sample alongside the keyboard replay slider. Events identify the bracket between samples. Playback stops when the scenario changes, the page is hidden or the last sample is reached. Reduced-motion preference leaves manual controls available.

Compare two seasons calculates two user-selected 2027 arrivals at the inspected location with the current stay, observer and requirements. Jobs use the local queue and can be cancelled. Seasonal results are temporary: they are not included in version-1 workspace exports or delay ranking. Changing location or scenario invalidates them.

The polar map labels latitude rings and east-longitude meridians. It uses south-polar stereographic coordinates on the model sphere; projected scale varies with latitude. At the exact pole longitude zero defines the azimuth convention. Study samples remain distinct from mission targets. Optional external resource links do not supply live local calculations.

## Integrated Moon explorer (0.15)

The main page opens a NASA-textured Moon globe. Whole Moon, South pole and Focus inspected location change its camera. Drag to orbit and scroll to zoom. Click the surface to fill coordinate fields; Calculate this coordinate switches to the supported 2027 mode and runs that exact displayed coordinate. The polar map and coordinate fields remain keyboard-accessible alternatives. NASA SVS imagery is visual context with lower-resolution polar fill; terrain calculations use the separate identified DEMs.

Six Apollo Lunar Module sites use NASA NSSDCA coordinates in the DE421 Mean Earth/Polar Axis system. These historical entries are outside calculation coverage and cannot be pinned as analyzed sites. The catalogue also includes the user-supplied Shackleton and de Gerlache image-study coordinates and the geographic south pole. These three destinations run their own on-demand calculations; the image-product link does not establish registration or mission landing suitability.

Choose Original arrival or Revised arrival in the inspector. The same selection controls terrain rays, globe directions, elevation/clearance cards, horizon, timeline, event brackets and continuous activity information. The replay slider advances elapsed mission time in that selected scenario. A negative solar elevation can still clear a depressed terrain horizon; a top-facing horizontal surface can then have zero direct-beam projection.

After a delay-grid preview, Inspect this tested date opens its complete result without changing the pinned arrival. Seasonal cards also offer Inspect this date, with their own coordinate-specific terrain and observations. Return to pinned comparison restores the main result. Seasonal previews remain temporary and are excluded from saved pinned workspaces. A workspace retains original/revised inspection selection, with revised as the default for older version-1 files.

Local terrain has true relief, an observer reference, north/east arrows and Sun/Earth direction rays tied to the sampled calculation. Arrow lengths and the observer glyph are illustrative. Display shading follows the Sun direction but does not compute terrain shadows or replace the 180 km horizon model.
