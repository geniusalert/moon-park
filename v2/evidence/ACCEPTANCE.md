# V2 interface acceptance — 2026-11-15

The subsequent nine-part guided workflow, including the single header assistant, custom-coordinate acceptance and rapid comparison workspace, is recorded in [DECISION_WORKFLOW.md](DECISION_WORKFLOW.md). Its current total is 154 passing JavaScript checks. The older iteration below remains historical evidence.

This records software/interaction checks, not operational or human-participant validation.

## Current iteration: guidance, replay and globe legibility

- Native Chrome opened the V2 local route against the existing service on port 4182. The original route also returned HTTP 200.
- Automatic restoration recalculated the Connecting ridge research point with the retained source identities, baseline 2027-01-01 00:00 UTC, revised +24 h, 72 h stay and 2 m observer. The revised result displayed 72 h sunlight and 0 h direct Earth/shared availability.
- Opened the header Guide and verified authored location instructions, coordinate conventions, terrain limits and access to conversational help.
- Sent an actual guide question through the configured Meta Model API (`muse-spark-1.3`): “What does observer height mean, and what should I do next? Please explain without changing my scenario.” The reply identified the current 2 m observer, current displayed scenario and next actions. The inspected UTC remained 2027-01-02T00:00:00Z; no mission operation was executed.
- Mission Play advanced from sample 0 to sample 4 (2027-01-02T00:40:00Z), with Pause state and matching horizon/timeline values.
- Dragged the timeline while playing. Replay paused, and timeline, slider, horizon and UTC selected sample 306 (2027-01-04T03:00:00Z). One wheel step selected sample 307 (03:10 UTC).
- Dragged the dock grip from approximately 250 px to 323 px height. Charts redrew without overlapping the replay footer. Keyboard resize/reset handlers and bounded height calculations are present; keyboard resize was not separately exercised in this iteration.
- Verified geographic markers remain small at the close polar view. Focus no longer jumps to the former extreme 1.24 lunar-radius camera distance. Existing 8K image, source manifest and polar-fill disclosure are retained; no new photographic detail was fabricated.
- At Chrome's 390 × 844 responsive viewport, verified all header actions fit, the guide fits and scrolls, horizon and timeline tabs remain accessible, Play/event controls fit, and the planning panel scrolls to the retained latitude/longitude fields. No horizontal page overflow was visible.
- The clean browser console showed no JavaScript errors. Chrome recorded an approximately 610 ms texture-load handler performance notice and inherited form-markup Issues notices (11 page errors / 3 improvements). Those notices are not a claim of accessibility certification or a failed scientific calculation.
- 147 JavaScript checks pass: 138 existing checks plus 9 V2 checks. Syntax checks pass for changed modules. Tests verify current-interface file hashes, retained control IDs, source-sample selection, guide context/answer boundaries, dock bounds and marker projection sizing.

## Earlier V2 integration checks retained

Earlier checks in this work session covered actual three-site calculations (Site01 grid-west, Apollo 12 and Site04), independent comparison panels, matching UTC sample selection, illustrative touchdown, JSON export/restore and narrow-screen compact comparisons. Existing artifacts: `desktop-landing.jpg`, `desktop-comparison.jpg`, `mobile-globe.jpg`, and `workspace.json` in this directory. They predate the new guide/replay styling; they are not screenshots of this iteration.

## Remaining limits

The AI guide can be wrong; answers are explanations rather than scientific verification. It uses the existing bounded server API, has cancellation, retains at most eight recent conversation entries, renders text safely, and never executes returned actions. Authored help works without an AI key or network. Planning execution remains in the separate Plan with AI control.

Global imagery is context only. Polar fill is lower detail. The scientific terrain/ephemeris engines, unsupported coverage behavior and hardware/human validation gates have not changed. Real participant understanding and hardware-specific thermal accuracy remain separate open activities.
