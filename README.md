# Moon Park — Lunar Site Navigator

Select lunar locations, compare 2027 arrival scenarios, inspect modeled sunlight and direct Earth visibility, and save a reproducible shortlist. Global screening uses a reference sphere; measured-terrain calculations cover 85°S–90°S when the required local data is installed. This does not certify landing safety or complete mission feasibility.

Release 0.16 adds 29 sourced mission/target records, global custom coordinates and side-by-side or sequential comparison. Unpublished targets remain unpinnable; regional references are clearly labeled. See the [mission catalogue guide](docs/MISSION_CATALOGUE.md) for setup, models and verification. Global calculations require internet for uncached JPL Horizons requests; reference-sphere screening omits actual terrain. Previous release 0.15 adds an integrated NASA-textured Moon globe, supported polar destinations, historical Apollo context and shared original/revised, seasonal and alternative inspection. See [integration evidence](docs/INTEGRATED_NAVIGATOR.md). The 0.14 archive remains preserved. Progress: [plan.md](plan.md). Instructions: [Start here: detailed website guide](docs/START_HERE.md); [technical navigator guide](docs/NAVIGATOR_GUIDE.md). Research background: [preserved 0.12 README](docs/README_RESEARCH_0_12.md).

## Run the navigator

Requires Node.js 22+. Extract the release into a writable folder and run `npm start`. Open http://127.0.0.1:4173, choose a location in step 01, set arrival and stay in step 02, then select **Write →** in step 03. Write a second location to reveal the comparison. The server binds to loopback; set PORT to change its port.

## Enable custom coordinates

Install Python 3.11+ and run these commands from the project folder:

```
python -m pip install -r requirements.txt
python scripts/fetch_kernels.py
python scripts/setup_navigator_terrain.py
npm start
```

Set MOON_PARK_PYTHON if your executable is not named python. Reload the browser after setup, select the 2027 period and pin exact coordinates. One job runs at a time with cancellation and retry.

Reserve several GB for optional NASA terrain downloads and acquisition caches. Interrupted blocks resume; source rate limits stop acquisition with a cooldown. Large sources stay in ignored data/raw and are excluded from the release. Existing verified 5 m local data is optional; regional-only installations have different source identities. Generated results and separate horizon/observation caches live outside the static tree under your home directory, .moon-park/workspace-id. Moving the project creates a new cache namespace.

Use up to three locations, UTC times on a ten-minute grid, 1–168 hour stays, 0–72 hour initial delays, and 2/5/10 m observers. Compare total and continuous sunlight, direct Earth visibility, their simultaneous overlap, signed schedule-impact deltas, a plain-language trade-off readout, peak solar elevation, and a countdown range to the next modeled set/rise event. The ideal horizontal-surface projection is a geometric sunlight reference, not energy or array output. Alternatives search another 0–72 hours in 12-hour steps, at fixed height unless explicitly expanded. Ranking: least delay, longest continuous combined window, total combined hours; ties preserved.

Horizon rays extend 180 km with 5 m terrain where valid, 20 m near-field coverage to 12 km and 240 m distant coverage. New custom terrain jobs use 0.125 degree angular spacing and radial spacing of 1 m to 200 m, 10 m to 12 km and 60 m farther out. Retained prepared examples keep their original settings and source identities. Display meshes are separate. Missing terrain is rejected. Exact-pole azimuth uses longitude zero as reference.

Direct Earth visibility is a geometric line of sight, not an RF window prediction. Read the [mission-planning requirements map](docs/MISSION_PLANNING_REQUIREMENTS.md) for the supported interpretation and limitations.

Export a versioned JSON workspace and Markdown brief. Changed sources/software require recalculation. Custom/interior points have nominal evidence; historical images are unregistered context. Eclipses, power, RF, thermal performance and landing hazards are not modeled. Independent scientific review and real-human testing remain separate.

## Verify

Run `npm test` and `python -m unittest discover -s tests -p "test_*.py"`. With acquired data and a server on port 4176, run `python scripts/validate_navigator.py` for real calculations, seasons, boundaries, cache reuse and cancellation. See docs/navigator-verification.md.

Code and documents were developed with AI assistance. NASA data use does not imply NASA endorsement.


## AI planning with Meta

Use **Plan with AI** for text and image requests that fill the controls and run the same scientific engine. Add your Meta key to the root `.env` file; the server reads it per request. See [AI setup, examples and execution limits](docs/AI_PLANNER.md) and [.env.example](.env.example). The integration is implemented and tested with mocked provider responses; live Meta interpretation requires your account key.


## Landing visualization

Open **Simulate** in the header or visual tabs to play, pause and seek an Apollo lunar module descent using the supplied GLB models. Includes follow, surface, whole-Moon and orbit cameras, playback speeds, full screen and optional selected-observation Sun lighting. It works without an AI key. The descent and compressed Moon scale are illustrative, not a flight solver. [Controls, models and limits](docs/LANDING_SIMULATION.md).
