# V2 scene-first shell — 2026-11-15

Status: implemented; final narrow-screen browser acceptance pending an unlocked Windows desktop.

## Scope

NASA Eyes screenshots supplied by the user informed the visual arrangement. This is a separate V2 presentation experiment, not a NASA interface or a new accuracy claim. The existing root application, scientific engine, API, results and source identities remain preserved.

The user flow is: open the input sidebar → choose catalogue/custom/mission location → set arrival and stay → review and generate → inspect essential conditions → optionally open Map, Graphs or Menu tools. Controls are relocated rather than replaced with new calculation implementations.

## Implemented and checked

| Area | Change | Evidence |
|---|---|---|
| Scene | Full viewport with compact input-only left column and edge collapse handle | Native Chrome desktop inspection, 1536 × 864; arrival, delay, stay and height retained. Stay was changed by the user to 75 hours and preserved. |
| Tools | Menu consolidates view modes, comparisons, alternatives, engineering, source details and exports | Menu opened and existing sections inspected. Original DOM identities remain present exactly once. |
| Map | Optional draggable geographic map overlay in the scene, with existing radius, follow and expansion controls | Map toggled in desktop browser; left inputs remained intact. |
| Graphs | Horizon/timeline hidden initially, optional translucent overlay, independent persistent playback | Graphs toggled in desktop browser; Moon reframed as available space changed. Both charts used the existing Apollo 11 result. |
| Metrics | Compact current solar elevation, separate Sun/Earth/shared totals, continuous shared time and event brackets | Existing 75-hour Apollo 11 reference-sphere result displayed; source scope remained explicit. |
| Bodies | Explicit Moon/Earth/Sun view; normal depth testing, occulted HTML labels hidden | Desktop body view showed Earth separate from Moon. Geometry tests cover foreground, behind-Moon and off-limb labels. Neutral globe lighting and diagrammatic body scale are disclosed. |
| Isolation | Root application unchanged; V2-specific storage and adapters | Baseline hash and control-identity gates pass. |

## Automated checks

`node --test --test-reporter=dot tests/*.test.js v2/tests/*.test.js` passes **158 checks**: 138 retained application checks and 20 V2 checks. New checks cover apparent globe fit for desktop and phone frames, reframe ratios, body-label occlusion and initial optional graph state. Changed JavaScript modules pass syntax checks.

These tests do not substitute for actual narrow-screen browser acceptance. The final thin playback track, hover styling and scene-basis labels were added after the earlier desktop checks and still need their final visual pass. Windows returned to its lock screen; browser actions stopped and the user was asked to unlock it. Previous phone acceptance in DECISION_WORKFLOW.md belongs to the earlier shell.

## Retained limits

The atlas texture is visual context; polar fill has lower detail. Body positions use calculated observer directions, but displayed body sizes, distances and orientation remain illustrative. A neutral-lit globe is not a shadow map. Landing playback is illustrative, not a solved trajectory. Terrain coverage, reference-sphere omissions, event sampling, equipment assumptions and source evidence remain accessible. Scientific, hardware-specific thermal and real-user validation gates are unchanged.
