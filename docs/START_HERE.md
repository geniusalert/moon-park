# Moon Park: how to use the website

Moon Park is a local Lunar Site Navigator for comparing modeled lighting and direct Earth line of sight. It helps you organize a shortlist when a site or arrival date changes. It does not decide whether a lander can safely land.

## Open it

The app is running at [http://127.0.0.1:4173](http://127.0.0.1:4173). For your own computer, extract the project, open a terminal in its folder, run `npm start`, and visit that address. Catalogue examples are ready to explore. New calculated points need the scientific Python setup described in [README](../README.md); uncached global JPL Horizons observations require an internet connection.

## The website

Moon Park is one connected Lunar Site Navigator. Use the guided introduction when you want a walkthrough; otherwise, work from the main page. Terrain, comparison, replay, alternatives, and exports are part of that same workflow.

The main **Lunar Site Navigator** at `/` is where most people should start. The left column holds location and scenario inputs. The right column holds the Moon, map and calculated visualizations. Comparison and inspection panels appear as needed, so an empty workspace starts with the location picker and global Moon view rather than sample results.

The **guided introduction** at `/docs/demo/index.html` walks through an example. Follow it before trying a real planning question if the controls are new.


## A simple first visit

1. In **01 Choose your location**, select a catalogue site, focus a named mission, click the Moon, or enter exact coordinates. **Custom coordinates** shows latitude and longitude directly in step 01; the shortcut above the steps takes you there at any time. The **02 Arrival and stay** menu opens next, and earlier steps remain open for editing.
2. Set the UTC arrival, schedule shift, stay and observer height. Quick delay buttons fill a 24, 48 or 72-hour shift. Select **Next: review settings**.
3. In **03 Review and generate**, check optional visibility requirements and the calculation model, then select **Write →** to generate the scenario. Missing source data or a calculation failure is shown explicitly.
4. Switch between **Moon globe**, **Location map**, **Horizon**, **Timeline** and **3D sky**. The location map centers on any supported coordinate, with 100, 250 and 500 km distance rings. It is geographic context, not a measured terrain map.
5. The shared replay below these views scrubs the same calculated timeline. Arrival/end, event navigation and playback stay available across the views. Current Sun/Earth metrics and next-transition information follow that cursor.
6. Select **Add another location to compare**, repeat the setup, and write the second scenario. Visual cards show each location's centered map, Sun/Earth/overlap timeline and metrics. Detailed table and sequential views remain available. Remove a selected location using its × button.
7. For two dates at one location, expand **Compare two dates · same location** in step 03. Its result cards can be inspected in the shared visual views. Use **Explore alternatives** for the bounded schedule-delay search.
8. Export or restore a workspace below the inspection. External exploration links, mission references, imagery sources and the map legend are at the end of the setup menu under **Resources and mission references**.

## What information to bring

For a useful comparison, prepare the following. You can start with defaults and fill in missing items later.

- **Locations:** up to three named catalogue locations or exact latitude/longitude. Clarify whether each coordinate is a landing point, impact location, broad target region or your own study point. Use latitude degrees north (south is negative) and longitude degrees east; the app normalizes longitude.
- **Arrival:** planned arrival in UTC. New calculations accept 2027 dates on a ten-minute grid. A schedule shift is optional.
- **Stay and observer:** mission duration from 1 to 168 hours; observer height 2, 5 or 10 metres.
- **Operational limits:** acceptable longest continuous darkness, required total simultaneous Sun/Earth visibility, and the required uninterrupted activity duration. If you do not know the thresholds, leave the sample values and treat them as demonstration settings.
- **Calculation scope:** choose Automatic for measured polar terrain within 85–90°S and reference sphere elsewhere, Reference sphere for all sites for a common global screen, or Measured polar terrain only for a strict polar-only analysis. A sphere calculation has no real mountains, craters or ground elevation.
- **Terrain and evidence:** for custom polar points, the service must have valid DEM coverage through the full horizon radius. The app reports required setup or missing data. Never substitute a nearby point without explicitly choosing that location.

A good question to bring is: “Compare these two coordinates for a 72-hour stay starting at this UTC time; test a 24-hour arrival delay, keep the observer at 2 metres, and require at least 8 total shared hours, no more than 12 hours continuous darkness, and one uninterrupted 2-hour work window. Show which source/model each result uses.” Change those example limits to fit your actual study.

## How to read the visuals

The **Moon globe** gives global context. Its NASA texture is imagery for orientation; polar fill is coarser. Grid, marker, zoom and numbered pin controls change the view, not the calculation. The **polar map** selects research points inside the detailed terrain cap; closely spaced points may be easier to choose from the list.

The **comparison table and rapid-impact cards** show results at a glance. Total sunlight, total Earth visibility and total overlap can be spread across many intervals. The “longest” metrics and continuous activity requirement tell you how long an uninterrupted window lasts. Countdown cards show the next modeled transition from arrival; the inspection countdown follows the replay cursor.

The **3D Scenario Lab** offers a terrain skyline dome, a view facing the Sun, a view facing Earth and celestial tracks across the stay. Distances and marker sizes are illustrative. The **local terrain model** shows the selected display mesh; choose shaded relief, patch-relative elevation or display-slope bands. Mesh spacing and calculation terrain resolution are separate. Shading is not a computed shadow map. Expand Terrain measurements for relief, slope method and Earth motion.

The **horizon plot** compares object elevation with the modeled skyline. The dashed zero-degree line is the local radial horizontal. The Moon model has no atmospheric refraction. Solar elevation, clearance above the horizon, visible solar-disc fraction and horizontal projection are different quantities. Projection is an ideal geometric reference, not watts or stored energy.

## What a result means

In polar terrain mode, the worker samples source-identified lunar elevation data along finite curved rays. Ground detail varies by location and source. It can miss small rocks, narrow ridges and unsampled features; terrain beyond the modeled radius also has limits. Check the selected point's source coverage and resolution.

Global coordinates use a smooth reference sphere with time-dependent JPL Horizons Sun/Earth observations. This is useful for early comparison, but it omits local topography and actual elevation. The existing SPICE source is retained for prepared examples and selected cross-method checks. Do not read the sphere screen as measured landing-site conditions.

A Sun result applies the modeled solar-disc visibility threshold. Horizontal projection assumes an ideal horizontal surface and does not include panel tilt, array design, electrical conversion, temperature, eclipses or terrain slope. Earth visibility means geometric direct line of sight; it does not predict radio frequency link margin, antenna pointing or ground-station availability.

Passing your filters is not a landing go/no-go. Landing hazards, navigation, thermal survival, power-system engineering, communication performance and independent scientific review are outside the completed software scope. No human usability result exists until actual participant records are collected.

## Where to go next

The linked **QuickMap** and **Moon Trek** are optional external tools for exploring imagery and terrain. **JPL Horizons** is the ephemeris source for new global observations. The **Canadian Space Agency Moon exploration** page is educational context. These resources do not send their data into this local app automatically.

See [mission catalogue notes](MISSION_CATALOGUE.md), [airless solar explanation](AIRLESS_SOLAR.md), [terrain and orbital dynamics](TERRAIN_DYNAMICS.md), [3D visual atlas](VISUAL_ATLAS.md), [scenario insights](SCENARIO_INSIGHTS.md), and the authoritative [implementation plan](../plan.md).


Location entry shortcuts provide direct access to the site catalogue, custom coordinates and mission programmes. Whole Moon, South pole and Focus selected location camera shortcuts are available above the globe. Workspace restoration is available even before selecting a site; exporting requires at least one selected site.


When a measured-terrain calculation is running, the visual workspace shows its stage and any available percentage. This percentage is for the current stage, not a promised overall completion time. The first calculation at a new terrain point can take a minute or more; cached horizons are faster. Cancel stops pending work, and Retry calculation reruns the current selected scenarios. The terrain, sky and timeline appear automatically once a valid result is ready.


You can also start in **Plan with AI** at the top of setup: describe your sites, arrival and requirements, attach clearly labeled images if helpful, and select **Plan & run**. It fills the same controls and runs the same calculations. Clarifications are requested when needed, and interpreted settings are shown. A Meta API key is required; see [AI planner setup and limits](AI_PLANNER.md).


For the landing animation, select **Simulate** in the header or visual tabs. After the supplied Moon and Apollo models load, select **Start landing**. Pause, seek, change speed/camera or open full screen. You can try it before calculating any site. The animation has its own clock; calculated Sun lighting is optional when a planning observation exists. See [Simulate guide](LANDING_SIMULATION.md) for scale and scientific limits.
