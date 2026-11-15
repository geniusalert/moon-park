# Objective completion plan

Updated 13 November 2026. This document expands the authoritative checklist in [plan.md](../plan.md). It defines the remaining work; it does not claim that planned features have passed acceptance.

## Product outcome

A person selects up to three supported lunar locations, sets an arrival and visibility requirements, sees the consequences of a schedule change, inspects why a window opens or closes, chooses among explicitly tested alternatives, and saves a reproducible comparison. The core product remains a local south-pole navigator for 85–90°S and 2027 arrivals, with a separate recorded 2026 demonstration.

## Objective audit

| Objective | Existing foundation | Remaining gap and action |
|---|---|---|
| Interactive selection | Prepared points, exact polar coordinates, three pins | Distinguish research samples from named mission sites; improve geographic orientation and source context (N11) |
| Rapid comparison | Original/revised metrics, requirements, bounded recovery | Validate N10; expose constraint margins and date trade-offs in one visual comparison (N12) |
| Date flexibility | 2027 UTC calculations, delayed mission coverage | Add bounded date sweep and useful presets without implying other years or global search (N12) |
| Sun/Earth relative to horizon | Synchronized terrain, horizon, sampled replay | Add readable axes, legend, playback controls and event jumps; validate countdowns (N10/N13) |
| Power/communications opportunity | Sun/Earth windows, solar angle, projection reference | Validate labels and terrain screening; expose separate continuous windows and failed limits without implying watts or RF feasibility (N10/N12) |
| Multiple visualizations | Polar overview, 3D terrain, horizon, timeline | Improve map orientation and synchronized explanations, mobile text equivalents (N11/N13) |
| Temporal dynamics | Manual ten-minute replay | Play/pause, speed and event navigation with reduced-motion support (N13) |
| Mixed audiences | Optional evidence and guide | Progressive explanation, task-based onboarding and actual comprehension evidence (N13/N9) |

## Resource use

- [QuickMap](https://quickmap.lroc.asu.edu/) currently redirects to the LROC QuickMap host. Use it for optional terrain/imagery exploration and product discovery. Preserve product IDs, acquisition dates, coverage and licenses when bringing assets into the app. Do not assume an undocumented embedding or data API. The page requires JavaScript; its internal capabilities were not audited in this planning pass.
- [Moon Trek](https://trek.nasa.gov/moon/) is an optional external exploration destination. Verify supported location-link parameters before generating deep links; retain a plain portal link if parameters cannot be confirmed. Its interactive interface was not audited in this planning pass.
- [JPL Horizons](https://ssd.jpl.nasa.gov/horizons/) provides documented ephemeris interfaces and time-span guidance. Extend retained coordinate-specific cross-checks to representative custom points and seasons, recording observer/frame/height/time/aberration settings. Shared JPL inputs mean cross-method agreement is not independent absolute-accuracy evidence.
- [CSA Moon exploration](https://www.asc-csa.gc.ca/eng/astronomy/moon-exploration/) supplies mission and educational context, including Canadian lunar initiatives. Treat it as context, not a terrain or ephemeris dataset. Source mission coordinates from specific authoritative mission records before presenting a selectable mission site.

## Execution sequence and completion gates

### N10 — Finish operational cues

Status: Complete. See navigator-objective-verification.md.

Validate separate Sun/Earth/shared totals and continuous windows, signed deltas, solar elevation, terrain-screened projection and bracketed countdowns. Check always-hidden/visible states, end-of-interval events, exported parity, units and screen-reader replay. Preserve geometry-only wording. Record results and fix failures before checking N10 complete.

### N11 — Geographic context and resource provenance

Status: Complete. See navigator-objective-verification.md.

Deliver a map with labeled latitude rings, reference meridians, scale/convention explanation and clear selected/pinned states. Add source-linked location descriptions and resource links. Catalogue fields: name, kind, coordinates, coordinate source, source date, coverage state and calculation availability. Clearly separate study samples, mission context and calculated locations. Only add named mission targets after confirming authoritative coordinates and terrain coverage; out-of-cap sites remain educational context and cannot receive inherited polar results.

Acceptance: map and coordinate input identify the same point; pole/wrapping conventions are readable; each named entry has a traceable source; unsupported locations explain why calculation is unavailable; external resource failure does not disable local comparison.

### N12 — Visual trade-offs and bounded date exploration

Status: Complete. See navigator-objective-verification.md.

Deliver aligned comparison bars for Sun, Earth and shared windows; show darkness, overlap and continuous-activity margins against entered limits. Add a date sweep across pinned points using explicit offsets 0–72 h in 12 h steps from the revised arrival. Reuse the existing recovery engine and source-aware horizon cache. Show unavailable cells, ties, exact dates and the ranking rule. Let a user inspect a cell and deliberately apply its arrival. Preserve the original comparison until application; clear stale alternatives when settings change. A separate seasonal comparison uses two user-chosen 2027 dates and queued calculations, with explicit time cost and cancellation. Seasonal results are temporary and excluded from version-1 workspace exports; saving seasons is deferred, so no workspace migration is introduced.

Acceptance: a failed constraint can be traced to its metric and margin; all displayed sweep cells reproduce ordinary scenario calculations; no missing cell counts as a failure or pass; applying a choice keeps location/date/height synchronized; no global optimum claim; stale/cancelled jobs cannot replace current results.

### N13 — Guided temporal explanation

Status: Complete. See navigator-objective-verification.md.

Deliver play/pause, speed, previous/next sampled event and arrival/end controls. Label horizon azimuth/elevation axes and timeline UTC bounds. Keep terrain, sky, time, countdown and witnesses on one selected result. Supply short explanations of terrain screening, polar low solar angles and Earth visibility, with optional detailed evidence. Respect reduced motion, pause when context changes, and provide full keyboard and text operation.

Acceptance: event jumps land on labeled sampled brackets; all views agree after point/date changes; playback stops at the final available sample; desktop and 390 px workflows expose equivalent information; reduced-motion and keyboard use work without 3D interaction.

### N14 — Scientific and integrated release evidence

Status: Complete. See navigator-objective-verification.md.

Deliver a new versioned local package, updated setup/guide and an objective-by-objective evidence report. Regress retained prepared outputs. Extend Horizons cross-checks to custom points/seasons with matched settings; document residuals and the limits of shared-source checks. Check representative terrain seams, horizon/time sampling sensitivity, exact pole, late-year coverage, cache invalidation, missing sources, cancellation, exports and restore. Measure cold/cached time and memory on the actual machine. Run the fresh extracted package through demo, custom calculation, comparison, alternatives and export. Keep older verified archives intact.

Acceptance: all required flows pass with dated evidence and source/software identities; unresolved errors are explicit release blockers or scoped limitations. No operational-accuracy certification follows from software verification.

### N9 — Actual-user understanding

Status: Blocked on real participants; run after the revised workflow stabilizes. Use the existing five-person protocol. Target four of five completing every interpretation task unaided, preserve failures and record fixes. Also record whether participants can explain a schedule trade-off and distinguish direct Earth geometry from an RF link. Automated sessions cannot satisfy this gate.

## Potential considerations and decisions

| Consideration | Treatment |
|---|---|
| Whole-Moon/Apollo coverage | Optional future expansion requiring new coverage/frame validation; unnecessary for completing this polar workflow |
| Terrain detail and unresolved ridges | Show actual source detail; sensitivity checks on representative cases; never transfer benchmark uncertainty evidence to custom points |
| Lunar frame, libration and observer geometry | Preserve current frame-matched SPICE calculation; compare coordinate-specific reference outputs with recorded settings |
| No atmospheric refraction | Keep airless geometry; describe terrain horizon and lunar curvature assumptions in methods |
| Partial Sun disc and eclipses | Preserve disc threshold definition; label projection as a simplified geometric reference; eclipses remain omitted and disclosed |
| Power, RF, thermal and hazards | Keep separate from visibility requirements; engineering modules require their own inputs, models and validation |
| Date/time and finite samples | UTC ten-minute grid; transition brackets; no silent rounding or extrapolation |
| Speed/offline behavior | Prepared demo works offline; custom source setup is explicit; queue, cancellation and cache state remain visible |
| Images and 3D | Prefer verified original products; imagery is historical context until registration is accepted; display spacing differs from calculation detail |
| Accessibility and comprehension | Keyboard/text equivalents, readable mobile layouts, restrained animation and real-user evidence |

## Definition of completion

N10–N14 complete the strengthened software workflow when their acceptance evidence passes. N9 establishes the separate human-understanding result. No new downloads are required from the user to begin N10/N11; specific source requests should identify product, region, resolution, size and purpose if acquisition later fails. Independent scientific review remains a separate activity.
