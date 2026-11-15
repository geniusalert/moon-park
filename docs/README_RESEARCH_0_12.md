# Moon Park

Lunar Landing Site Navigator — an explainable laboratory for mission-window comparisons.

**Current build (0.12):** experimental mission-window application using NASA LOLA local terrain and height-specific NAIF SPICE geometry, cross-checked against JPL Horizons. Three terrain-derived research points, 14 November–14 December 2026 observations, 2/5/10 m observer horizons, delay comparisons, recovery search, continuous activity scheduling, synchronized explanation and decision-receipt export. These research points are not certified landing sites. Terrain extends to 180 km in the matching DE421/MOON_ME frame; finite coverage and unresolved terrain remain limitations; passing local constraints is not established mission feasibility.

## Run

Requires Node.js 22+; no package installation required.

```sh
npm start
```

Open http://127.0.0.1:4173. Change arrival date, delay, duration, observer height and constraints; inspect the research points and export a decision receipt. Prepared compact data is retained in `data/mission-data.json`; the application runs without a network connection after local assets load.

```sh
npm test
python scripts/fetch_ephemeris.py
```

The legacy `fetch_ephemeris.py` command acquires a separate reference point for parser checks. To reproduce the actual application dataset:

```sh
python -m pip install -r requirements.txt
npm run prepare:terrain
npm run prepare:observations
npm run prepare:science
npm run validate:data
python -m unittest discover -s tests -p "test_*.py"
```

Data preparation requires network access and downloads three approximately 41 MB DEMs. Raw inputs stay in ignored `data/raw/`. Derived horizons retain source hashes, coordinates, processing resolution and coverage. Horizons observations are requested at ground elevation plus 2 m above the 1737.4 km reference sphere. The regional science stage recalculates native-ground horizons and observer-specific SPICE positions at 2/5/10 m in DE421/MOON_ME. Original Horizons observations remain a separate cross-check. See docs/SCIENCE_VALIDATION.md for measured differences and limitations.

Recovery searches additional 0–72 h delays at 12 h increments over all three points and supported observer heights at least as tall as the configured observer. Ordering is earliest additional delay, then lowest height, then most overlap. It is a finite experiment, not a global optimizer. ±0.25° horizon stress tests are not probabilities. Temporal sensitivity includes direct 1/5/10-minute checks on five scenarios, plus 10/20/30-minute default comparisons. This tests discretization, not absolute physical accuracy.

Read [the living project plan](docs/PROJECT_PLAN.md), [research register](docs/RESEARCH.md), [current status](docs/STATUS.md), [demonstration narrative](docs/DEMO.md), and [machine-readable validation report](docs/validation.json).

Code and documentation were developed with AI assistance. Scientific outputs require independent review. No NASA endorsement is implied.

See [scientific validation](docs/SCIENCE_VALIDATION.md) and [reproduction workflow](docs/BUILD_WORKFLOW.md) for build 0.3 details.


The uncertainty milestone adds four selected nearby-terrain clone perturbations and four separate resolution checks per point, conservative rank spans, recovery ordering by support across those tests, shaded clone-horizon ranges, and activity windows common to every tested case. Clone perturbations are conditional within 2 km, tapered from 1.8 km; outer terrain stays fixed. Counts are not probabilities.

For an existing science build, run `npm run prepare:uncertainty`. See [methods and limits](docs/UNCERTAINTY.md) and [the empirical report](docs/uncertainty-validation.json). The app verifies the versioned variant artifact hash before analysis.


Build 0.5 adds the [spatial navigator](docs/SPATIAL_NAVIGATOR.md): a polar map of three modeled points and 15 published study outlines, curved lunar terrain, synchronized Sun/Earth directions and a physical horizon sky. Outlines are geometry only; selecting one does not fabricate results inside it. Graphics dependencies are vendored with their license. Use `npm ci` and `npm run vendor:three` to reproduce those assets. Run `npm run prepare:spatial`, `npm run validate:spatial` and `python scripts/stamp_build.py` after changing prepared spatial inputs.


Build 0.6 independently calculates 27 interior samples across all 15 published outlines. Choose an outline to load its sample comparison, select a point for the terrain/sky replay, and inspect nominal recovery options. These points do not inherit the original benchmark points' terrain-clone support. Read docs/CANDIDATE_STUDY.md and docs/RELEASE_READINESS.md. The seven-slide demo is in docs/deliverables/Moon-Park-demo.pptx. The anonymous pilot runs at /pilot.html; developer records never count as participant evidence. Use `python scripts/summarize_pilot.py data/pilot-records` after collecting the actual records.

The portable release runs with Node.js using `npm start` and the included vendored graphics files. Python and source-data acquisition are needed only for regeneration. No cloud account is required. Development dates are recorded honestly; event eligibility is not asserted.


Build 0.7 adds **Trace Sun / Trace Earth** above the map. A/B mark the sampled terrain rays bracketing the target azimuth, with their actual source locations and interpolation weights. Replay and height changes update the evidence; a point change clears it. Active trace evidence is included in decision receipts. Read docs/HORIZON_TRACE.md and run `npm run validate:trace`. Optional image requests are in docs/IMAGE_REQUESTS.md, with exact lunar footprints in data/image-request-footprints.json.


Build 0.8 adds a recorded decision example, selected-point summary and workflow shortcuts, plus verified historical image context for all three areas. de Gerlache coverage is partial and explicitly masked. See [historical imagery](docs/HISTORICAL_IMAGERY.md) and [current status](docs/STATUS.md).



Build 0.9 adds a local [alignment workbench](registration.html) with matched image/terrain views, keyboard landmark selection, separate fit/check residuals and evidence export. Actual alignment remains unmeasured; no correction is applied. Read [the method](docs/REGISTRATION.md).



Build 0.10 adds source-checked restoration of saved alignment assessments and cache-integrity checks for resumed imagery. Preliminary Shackleton feature picks remain unreviewed and insufficient; read [the inspection notes](docs/PRELIMINARY_ALIGNMENT.md). Saved approval claims are ignored and statistics are recalculated on restore.



Build 0.11 adds [source-quality inspection](registration.html?area=Site04&source=stereo&layer=confidence) for the Shackleton NAC stereo terrain. Original PDS confidence codes screen the earlier tentative landmarks and support an unshifted height comparison. This is separate from the mission terrain and does not establish image registration. Read [the evidence and limits](docs/STEREO_REFERENCE.md).



Build 0.12 integrates the [guided decision demonstration](docs/demo/index.html), source-bound landmark review artifacts and a portable local release. Start with the guide, then open the full navigator to trace terrain rays, compare recovery options and export a decision receipt. Physical image registration, human evaluation and independent scientific review remain open.
