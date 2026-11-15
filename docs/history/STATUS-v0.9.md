# Moon Park — delivery status

Updated 11 November 2026 · Build 0.9

## Latest: alignment measurement workbench

The historical-image panel now links to /registration.html. Matched image and terrain inspection views use the same lunar footprint at approximately 5 m cells. Four synthetic hillshades and slope contrast help identify stable features. Zoom/pan stay synchronized; mouse and keyboard picks create named Fit or Check landmark pairs. Area-specific pairs remain in page memory until exported.

Fit landmarks estimate a component-wise median translation. Held-out checks never influence that shift and report separate RMS/max residuals. The exploratory review threshold requires three fit and three check landmarks with spatial spread in each set; it never automatically establishes registration. No correction, texture drape or scientific-model change is applied.

There are zero accepted physical landmark correspondences. All three image-to-current-DEM registrations remain unmeasured. Browser testing used explicitly arbitrary developer points, then removed them; those values are not physical alignment results. The retained zero-landmark export reports null translation.

## Verification

46 JavaScript and 20 Python tests pass (66 total). Registration assets pass 84 source/grid/mask checks, including exact source hashes and source-specific unavailable pixels. Imagery passes 98 checks; original scientific arrays and candidate references remain unchanged from v0.7. Numerical projection round-trip closure is zero at the tested points; this is arithmetic closure, not physical registration accuracy.

Browser controls, area isolation/persistence, keyboard picks, synthetic lighting, synchronized zoom/pan, fit/check separation, deletion and evidence export were checked. A 390 px viewport has 375 px document width without horizontal overflow. Browser evidence is in browser-validation-v0.9.json; the retained developer receipt is clearly excluded from scientific evidence. REGISTRATION.md explains methods and limits.

## Acquisition and acceptance still open

The de Gerlache context crop remains 82.3% acquired. The source requested a one-hour no-retry window. A conservative persisted cooldown blocks requests until 19:34:53 IST on 11 November 2026, based on the later retained partial-record timestamp. No source retry was made during this build. Future 429 responses persist their retry time and stop promptly, retaining all cached blocks. Missing pixels stay transparent.

M0–M7 bounded implementation milestones are complete. M8 measurement tooling is delivered; complete acquisition and real-feature registration acceptance remain open. Actual human testing is deferred with zero participants. Independent scientific review, full-field uncertainty, operational validation and event eligibility remain open. No deployment or submission has been made.

Next: resume missing image ranges after the source cooldown, regenerate dependent assets, and collect/review stable-feature correspondences. Precise overlays stay gated on measured evidence.
