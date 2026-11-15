# Objective completion evidence — 13 November 2026

Software: 0.14.0. Scope: local 85–90°S navigator, 2027 arrivals and retained 2026 demonstration.

## N10 operational interpretation

60 JavaScript tests and 30 Python tests pass. The six added objective checks cover grid parity, unavailable cells, negative margins, separate continuous-window metrics, event brackets and horizontal projection screening. Browser checks retained the 5.17 → 53.17 h recorded result, separate Sun/Earth windows, peak elevation, countdown and downloaded operational brief. Brief uses the same operational functions as cards. User-selected limits are explicitly example filters.

## N11 geographic context

Map now uses actual -85/-87/-89 degree latitude rings and 0/90/180/-90 east meridians. Existing spatial round-trip tests cover axes and pole. Coordinate convention, projection scale variation and coverage bounds are documented. Location descriptions identify research/custom kinds and coordinate selection basis; terrain source links accompany them. No new mission targets were added without authoritative coordinate records. External QuickMap, Moon Trek, Horizons and CSA links are optional portal links; no undocumented deep-link or embedding integration is claimed.

## N12 scenario comparison

Browser selected three locations and generated 21 date cells. Preview showed exact arrival, status and signed darkness/overlap/activity margins. Applying a cell set the arrival and zero delay. Tests compare all seven grid cells directly against ordinary scenario calculations, including unavailable and failing cases. Separate real seasonal jobs at Connecting ridge returned January 0 h overlap and June 45.83 h overlap, with June 36.17 h longest shared window. Seasonal results are temporary and excluded from workspace v1 and delay ranking.

## N13 temporal and responsive explanation

Browser event jump reached the recorded 18:40–18:50 UTC bracket. Play changed to Pause and advanced replay to sample 38; Pause stopped it. Event controls, UTC bounds and horizon axes are labeled. Reduced-motion behavior is explicitly implemented as manual replay instead of auto playback; that branch was inspected, not exercised with a browser media override. At a requested 390 px viewport, layout client width was 375 px after scrollbar; document width also 375 px with the grid open. The grid retains its own horizontal scrolling. Desktop and mobile screenshots are retained. Accessible slider value includes UTC and visibility states. No human usability evidence is implied.

## N14 scientific and packaged workflow

New real custom cases at (0 E,87.5 S) in January and (90 E,86.5 S) in June retain complete 180 km horizons. Twelve matched Sun/Earth samples across these cases were compared with Horizons, with maximum elevation difference 0.000008183 degrees against the declared 0.001 degree check tolerance. Shared JPL inputs mean this is cross-method consistency, not absolute accuracy. See navigator-objective-science.json.

Coarsening rays to 0.5 degrees and time bins to 20 minutes is retained in navigator-objective-sensitivity.json. One Earth total changed by 10 minutes under angular coarsening. This is limited sensitivity evidence, not finer-resolution convergence. Earlier finer-time, seams, year-boundary, missing-source, cache and cancellation reports remain the evidence for the unchanged scientific worker.

Fresh candidate extraction ran all 60 JavaScript and 30 Python tests. Browser opened the demo, calculated three points including an exact custom coordinate, generated alternatives, exported and restored a workspace. A changed-source workspace was rejected while preserving the three current locations. Final-candidate checks also confirmed explicit failed-restore status, clearing of the old error after a successful restore, and seasonal cancellation. Cold worker runs took about 5.3–5.5 s and about 582 MB peak working set; cached reference run took 1.36 s and about 162 MB. Machine-specific details are in navigator-objective-package.json and navigator-objective-science.json.

Optional sources were provisioned from existing verified acquisitions using a data/raw junction; fresh network acquisition is not asserted. Existing runtimes were used. Older archives remain intact. Final release archive checksum is recorded under release/package-evidence.json.

## Remaining evidence

N9 remains blocked: zero actual participant sessions. Independent scientific review, full-field uncertainty, finer custom-terrain convergence and engineering feasibility remain separate work. Eclipses, power hardware, RF links, thermal survival and landing hazards remain outside scope.


## 0.16 mission and global comparison extension — 13 November 2026

N16 adds the sourced mission catalogue, explicit global reference-sphere mode and side-by-side/sequential comparisons. Current evidence supersedes earlier test counts: 81 JavaScript and 51 Python tests pass, including fresh extraction. See [catalogue verification](mission-catalogue-verification.json), [global reference checks](mission-global-verification.json), and [polar integration](mission-polar-integration.json). New custom observations use recorded JPL Horizons tables; the retained prepared demonstration remains unchanged. N9 still has no actual participant records.
