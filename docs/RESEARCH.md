# Research and evidence register

Reviewed 11 November 2026. Supplied pasted notes and both referenced chats were inspected. The enhancements chat contains an announcement of research, not a completed report. The notes are leads, not independent evidence.

| Source | Verified finding | Application / limits |
|---|---|---|
| [2025 official judging PDF](https://spaceapps-v2-staging.s3.amazonaws.com/media/documents/Final_Space_Apps_2025_Judging_Guidelines_for_web.pdf) | Five criteria, holistic 1–5 assessment, minimum requirements | Historical baseline; current-year instructions pending |
| [NASA 2025 project descriptions](https://www.nasa.gov/learning-resources/stem-engagement-at-nasa/nasa-announces-2025-international-space-apps-challenge-global-winners/) | SpaceGenes+, Twisters, PureFlow descriptions | Case studies, not proof of causal selection factors or code quality |
| [NASA PGDA site DEMs](https://pgda.gsfc.nasa.gov/products/78) | 5 m grids, terrain uncertainty products, clones, polar stereographic MOON_ME/DE421 metadata | Foundation for horizon/uncertainty work; interpolated pixels limit interpretation |
| [JPL Horizons API](https://ssd-api.jpl.nasa.gov/doc/horizons.html) | Observer requests, site coordinates, time and output controls | Raw-reference acquisition implemented; physical integration pending |
| [Horizons manual](https://ssd.jpl.nasa.gov/horizons/manual.html) | Authoritative conventions and observer documentation | Review frame/datum conventions before accepting real results |
| [Moon Trek capabilities](https://trek.nasa.gov/moon/jpl/config/textAbout.html) | Existing lighting, slope, elevation and mapping functionality | Invalidates broad claims that lunar maps or shadows alone are novel |
| [NASA lunar interactives](https://science.nasa.gov/moon/interactives/) | Identifies QuickMap among lunar exploration tools | Full comparative workflow audit pending |
| [2026 official challenge URL](https://www.spaceappschallenge.org/2026/challenges/lunar-landing-site-navigator/) | Fetch failed in this review | Current-year scope remains unverified at official source |

## Literature queue

The supplied notes name Gläser 2014/2018 illumination work, Barker 2021 improved LOLA maps, horizon-based illumination modeling, terrain-driven Earth visibility, a 2026 Wueller assessment, and dynamic rover planning. We have verified PGDA's dataset/method descriptions, including terrain clones. Exact bibliographic identities, DOIs, and numerical claims for the other papers have not yet been independently checked here. Do not copy the notes' percentages, claims about 130 sites, or 2026 publication conclusions into product results until primary-source review is complete.

Next research tasks: read the PGDA README and linked paper; record CRS, vertical datum, effective resolution and crop size; verify horizon algorithms against published methods; audit the actual public competitor repositories cited in the original notes. Cite per claim, and record whether evidence comes from a paper, a product's own description, source inspection, or a reproduced test.

## Build 0.3 primary sources and reproduced evidence

- [PGDA product 90](https://pgda.gsfc.nasa.gov/products/90): cloud-optimized regional DEMs, documented MOON_ME/DE421 frame. A native 240 m product crop now provides finite coverage to 180 km around all three points. Crop bytes and source windows are retained in the acquisition manifest.
- [NAIF MOON_ME frame kernel](https://naif.jpl.nasa.gov/pub/naif/generic_kernels/fk/satellites/moon_080317.tf): explicit association with MOON_ME_DE421 and its binary lunar orientation kernel. Used directly with DE421, rather than estimating a frame correction.
- [NAIF spkcpo documentation](https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/C/cspice/spkcpo_c.html): constant body-fixed observer state, output-frame locus and aberration controls. Used to compute topocentric vectors before local-axis projection.
- Reproduced local results: frame-validation.json (cross-method residuals), terrain-impact.json (18-case terrain comparison), time-convergence.json (five direct cadence experiments), validation.json (hash, cadence, horizon and sanity checks). These are implementation evidence, not primary research publications or operational certification.
