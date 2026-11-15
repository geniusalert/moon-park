# Release readiness · build 0.12 · 12 November 2026

The bounded local research implementation is complete through the interior-region sample study. All original M0–M5 software deliverables have concrete implementations. At the user's request, M5 now uses an agent-operated task walkthrough as its bounded delivery gate: five tasks and two invalid-input guards pass. The original five-person human target is deferred, not achieved; zero human sessions are claimed. Independent scientific review and operational release are separate, open gates.

| Deliverable | Evidence | Status |
|---|---|---|
| Terrain, frames and observations | SCIENCE_VALIDATION.md, frame-validation.json | Implemented and cross-checked within stated limits |
| Delay comparison and continuous activities | App, mission tests, decision receipt | Implemented |
| Recovery and conditional uncertainty | UNCERTAINTY.md, uncertainty-validation.json | Implemented for original three benchmark points |
| Published study regions | CANDIDATE_STUDY.md, candidate-validation.json | 27 calculated interior samples in 15 outlines |
| Coordinate-specific candidate checks | candidate-science-validation.json | 519 checks; three additional anchor cross-checks |
| Synchronized map/terrain/horizon replay | App and retained previews | Implemented |
| Sampled horizon trace | HORIZON_TRACE.md, trace-validation.json | A/B source witnesses, angular weights, paths and receipt evidence |
| Performance target | performance.json | Cached calculation warm p95 193.35 ms; target 1,000 ms on recorded hardware |
| Seven-slide demonstration | deliverables/Moon-Park-demo.pptx | Editable deck; all seven slides visually inspected |
| Revised M5 task walkthrough | AGENT_TASK_AUDIT.md, agent-task-audit.json | Complete: five tasks and two guards pass |
| Original human pilot | /pilot.html, USABILITY.md | Deferred; zero human participants |
| Portable source/evidence release | release ZIP and manifest | Built after final checks |
| Independent scientific review | No reviewer evidence yet | Open |
| Public deployment | Local loopback only | Not performed |

The performance result measures cached in-process calculation, not browser loading, rendering, network or preparation. Exact run conditions are in performance.json.

## Event preparation and development dates

This research prototype was developed before the announced 14–15 November 2026 event. A 5 November organizer answer says teams should begin project work at the official local start time and that working ahead can lead to disqualification. Research and team formation are allowed before the event. [Organizer answer](https://github.com/nasa/spaceapps/discussions/1813). This build must not be represented as code written during the event or assumed eligible. Seek organizer interpretation before any event use; no submission has been made.

The official 2026 landing page is indexed with those dates, but direct retrieval returned a 502 error in this review. Historical 2025 judging/demo guidance remains a planning reference, not a substitute for the selected challenge's current rules. The final event challenge, permitted work, local deadlines and public submission links remain unresolved. The seven-slide deck is a research demonstration asset, not a submitted project.

## Use and scientific scope

Configured visibility limits can pass while full mission feasibility remains unknown. Source identities and exact software hashes are exported. Human interpretation does not validate scientific accuracy, and reference-agreement checks do not establish operational safety. Battery, RF, thermal, rover routing and trajectory design were explicitly deferred in the plan.

Build 0.7 adds source-trace explanation and optional image request footprints. The 61 automated tests include six trace tests; 900 real-data trace cases add 10,800 reconstruction checks. Scientific source arrays remain unchanged.

## Build 0.8 update

M7 adds the recorded-example decision journey and three verified historical image contexts. 63 automated tests and 98 imagery checks pass; scientific arrays remain identical to v0.7. de Gerlache remains partially acquired, explicitly disclosed in the app and receipt. Source images are not registered terrain overlays. Human testing and independent review remain open. See STATUS.md and HISTORICAL_IMAGERY.md.



## Build 0.9 update

M8 alignment measurement tooling is delivered with 18 common-grid inspection images, masked picks, four synthetic hillshades, slope contrast, median translation and held-out residuals. 66 automated tests, 84 registration checks and 98 imagery checks pass. Actual physical registration remains unmeasured and there are zero accepted correspondences. Developer control records are explicitly excluded. de Gerlache remains partial under the source retry window; complete acquisition and registration acceptance remain open. See REGISTRATION.md and STATUS.md.


## Build 0.10 update

The requested de Gerlache crop is fully acquired, with exact preservation of all prior valid pixels and cached source ranges. Source-bound assessment restore, corrupted-cache rejection and cooldown enforcement are implemented. Verification records 69 automated tests, 97 imagery checks, 84 registration-asset checks and 10 crop-transition checks. Two tentative physical feature correspondences remain unreviewed and insufficient; no registration or operational acceptance is claimed. See STATUS.md and PRELIMINARY_ALIGNMENT.md.


## Build 0.11 update

Source-qualified stereo inspection is implemented for Shackleton using the original PDS confidence product, not browse intensities. It exposes native support categories, unshifted product-height differences and a source-linked audit of the two tentative landmarks. Reference picks cannot alter mission pairs. 73 automated tests and 235 current data checks pass. No registration correction, independent accuracy, accepted correspondence or operational certification is claimed. See STATUS.md and STEREO_REFERENCE.md.



## Build 0.12 — integrated local product

The main entry point links the five-step live guided demonstration. The release includes source-bound landmark atlas, native-photo searches, ridge profiles and sample exports. The guide computes from the existing engine and verified point data. It exports its own current source identities alongside mission software hashes. All 79 current software source hashes are retained by the build stamp.

73 automated tests and 235 workspace data checks pass. Packaging verifies every included file against the release manifest. Clean-extraction verification and a browser exercise of the extracted guide are recorded under release/. Standalone data checks omit comparisons requiring excluded raw originals or a prior release. Those omissions do not imply additional data coverage.

Use Node.js to run `npm start`, then open the printed loopback URL. The prepared product uses bundled browser dependencies and needs no data acquisition to demonstrate. Python research reproduction requires requirements.txt; optional atlas/plot generators also use docs/landmark-review/requirements.txt. Public hosting, human usability evidence, independent scientific review and physical registration are separate open gates.
