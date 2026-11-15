# Navigator verification log

## 12 November 2026 — prepared workflow

- 54 JavaScript tests pass, including baseline regression, max-three pins, sampled event brackets, bounded alternatives and separate continuous activity failure.
- 29 Python tests pass, including exact-pole rays, longitude wrapping, refusal to round off-grid inputs, and cache integrity.
- Browser verified at http://127.0.0.1:4176: Connecting Ridge, Site01 region 1 grid-south and Shackleton pinned together. Grid-south retains 5.166667 h original and 53.166667 h revised overlap. Shackleton fails total combined availability and continuous activity in the same view.
- Prepared and custom points retain separate uncertainty scope. Terrain and inspection clear when results are unavailable.

This is an incremental verification record, not a release certification. Custom terrain acquisition and complete end-to-end verification are pending.

## Real-data acceptance

- 16 real calculation cases passed: two regional interior points, the exact pole, eight longitudes at 85 S, three fine-terrain benchmarks, June and the latest December arrival. Two additional 5/20 m seam points passed with the correct ground-resolution switch.
- All sampled horizon rays reached 180 km. Acquired regional crops have zero missing pixels; this is raster support, not proof of resolved physical terrain.
- Latest arrival 2027-12-31 23:50 UTC, 168 h stay, 72 h delay and 72 h additional recovery includes observations through 2028-01-14 00:00 UTC.
- Reusing the same point/date hit both caches. Changing only season reused the horizon. API cancellation stayed terminal. Worker tests reject absent sources, changed terrain hashes and altered cached payloads.
- Browser: two exact custom locations (-87.5, 0) and (-86.5, 90) calculated through the queue and displayed distinct coordinates, elevations, horizons and witnesses. Neither inherits clone evidence.
- Browser recovery: Connecting Ridge at original demo date, 48 h delay and 65 h required overlap fails at 59.33 h; the +12 h tested alternative passes at 71.33 h. Applying it creates a new original arrival.
- Browser workspace export/reset/restore reproduced the grid-south 5.17/53.17 h comparison. A deliberately changed source identity was rejected without replacing the comparison.
- 390 px viewport: no horizontal overflow; comparison controls and table remained readable. See navigator-mobile.png.

The latest suite has 54 JavaScript and 30 Python tests. Raw timing and peak working-set measurements are in navigator-custom-verification.json. Cold calculations varied with concurrent disk work; do not present the fastest timing as a guaranteed latency.

- Keyboard End on the late-December custom mission moved replay to 2028-01-10 23:40 UTC, with synchronized Sun/Earth state, elevation, clearance and next-event text. The latest mission end is 23:50; half-open bins exclude the endpoint.

## Final workspace and release checks

- Final source preserved replay index 431 and Earth inspection target across export/reset/import. The comparison retained its original 5.166667/53.166667 h values.
- Explicit cancellation cleared pending cards and all inspection panels; no late result replaced the cancelled selection.
- Final extracted code passed 54 JavaScript and 30 Python tests. A regional-only 86.5 S, 90 E late-December calculation completed without any copied calculation cache, then exported and restored to the same 72 h combined visibility comparison. Cold calculation: 12.54 s, 268.1 MB peak working set. Restored cached calculation: 1.06 s, 161.3 MB. These are machine-specific measurements, not promised performance.
- Localhost access succeeded; foreign Host and Origin headers were rejected. Generated results remain outside the static directory.
- Dependency/runtime installation on a second clean machine was not simulated. Fresh extraction used the installed Node/Python runtimes and verified local copies of the acquired optional sources. Source acquisition itself had already run successfully from NASA ranges.
- Final packaging after these checks changes only documentation/evidence. Code hashes are checked against the tested extraction.

Software completion does not establish physical accuracy or landing safety. N9 has no human records and remains blocked.
