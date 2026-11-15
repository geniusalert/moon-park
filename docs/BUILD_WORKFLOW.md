# Reproducing the research build

The compact application dataset is checked into the workspace. `npm start` runs the current app without downloading raw scientific products.

To reconstruct the original acquisition foundation on a fresh checkout:

```sh
python -m pip install -r requirements.txt
npm run prepare:terrain
npm run prepare:observations
```

Then produce the current regional/frame-matched build:

```sh
npm run prepare:science
```

The pipeline retains the original v0.2 benchmark, extracts a 480 km square crop from the regional cloud-optimized TIFF using verified HTTP byte ranges, recalculates native/local and regional horizons, acquires four named NAIF kernels, produces height-specific SPICE observations, and writes the frame, terrain-impact, time-sampling and integrity reports.

Build 0.4 additionally acquires near-field crops for four published clone surfaces per point, derives signed perturbations, produces four numerical variants per point, and writes the uncertainty/ranking report. Downloads use bounded resumable byte ranges. Prepared terrain variants have their own SHA-256 reference in the mission dataset; the app checks this before attaching them.

The first regional acquisition transfers approximately 17.4 MB of source TIFF blocks plus the header, and stores a compressed 14.3 MB crop. Raw source maps and kernels are ignored by Git; their identities and hashes are retained. The sparse temporary TIFF contains only the required source tiles and is deleted after crop extraction; it is never used as a complete planetary map. Subsequent preparation uses cached inputs.

The raw observation responses remain Horizons references. SPICE output is generated locally from retained kernels. The old acquisition commands by themselves recreate the local build; run `prepare:science` afterward to restore the current regional build.

Checks:

```sh
npm test
python -m unittest discover -s tests -p "test_*.py"
npm run validate:data
```

Interpret the reports with SCIENCE_VALIDATION.md. A passing software check does not certify mission safety.
