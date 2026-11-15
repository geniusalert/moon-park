# Moon Park — delivery status

Updated 11 November 2026 · Build 0.6

## Completed

- 27 separately calculated interior points in all 15 published study outlines; one anchor per outline and four additional probes in one outline per source area.
- Point-specific native ground, 180 km horizons and SPICE observations at 2/5/10 m; checksum-verified lazy loading, mapped sample markers, synchronized terrain/sky replay and nominal recovery options.
- Spatial variation is explicit; none of the original benchmarks' conditional clone outcomes is transferred to these interior points.
- Editable seven-slide demo, recorded example narrative, pilot page and anonymous scoring/export/aggregation tools. All seven slides were rendered and individually inspected; the two charts remain editable.
- A source/evidence ZIP is prepared after final checks; source caches, installed packages and participant records are excluded.

## Measured evidence

The Connecting Ridge south probe changes from 5.17 to 53.17 combined hours after a 48 h delay, crossing the 8 h nominal requirement. Five points in Shackleton study outline 1 have 21.00–28.17 h after delay. Actual grid offsets are recorded and are not claimed to be exactly 50 m when constrained by the outline.

55 automated tests pass: 35 JavaScript and 20 Python. 884 data checks pass: 32 nominal + 38 uncertainty + 53 spatial + 242 candidate + 519 candidate-science. Additional Horizons comparisons cover 186 daily target/time samples at three anchors. Warm cached calculation p95 is 193.35 ms on the recorded reference hardware, excluding loading and browser graphics.

## Milestone state

M0–M5 are complete for the revised bounded delivery scope. On 11 November the user requested an agent-operated evaluation instead of unavailable participant answers. The agent walkthrough passes all five interpretation tasks and two invalid-input guards. The original human-study target is deferred, with zero participant sessions; it is not represented as achieved. No independent scientific approval is claimed.

## Open gates

Optional future human-study evidence and resulting interface improvements; independent scientific review; full-field terrain uncertainty and spatial completeness. Landing hazards, battery, RF, thermal, eclipses, rover routing and trajectory design remain deferred/outside scope. No public deployment or event submission has been made. The pre-event development dates and eligibility restriction are documented in RELEASE_READINESS.md.

Read CANDIDATE_STUDY.md, RELEASE_READINESS.md and PROJECT_PLAN.md. Use npm start at http://127.0.0.1:4173; the pilot is /pilot.html. Prior milestone records are under history/.

## Final browser and export evidence

Browser verified three terrain areas, independent ROI point selection, baseline failure, nominal recovery selection, rapid region-switch race handling, synchronized replay and observer-height changes. A 390 px viewport has a 375 px document with no horizontal overflow even with the interior-point table. The verified browser receipt includes all 54 current software hashes, a selected interior point, five independent result records and 27-point source metadata. No browser console warnings/errors were recorded. The developer pilot export scored 5/5 and explicitly excludes itself from human-study evidence. Retained screenshots show scene and sample comparisons. The original human target is deferred under the revised delivery scope. See AGENT_TASK_AUDIT.md and agent-task-audit.json.

## Revised M5 acceptance

The agent-operated browser walkthrough passes five of five tasks plus two control safeguards. No human data was fabricated. Current delivery no longer waits for unavailable participant responses. The release has been refreshed to include the audit and revised milestone status.
