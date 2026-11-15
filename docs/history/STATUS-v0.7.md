# Moon Park — delivery status

Updated 11 November 2026 · Build 0.7

## Latest milestone: sampled obstruction trace

Trace Sun/Earth now maps the actual A/B sampled terrain locations supporting the target's nominal interpolated horizon. The interface shows each ray's azimuth, elevation, interpolation weight, distance, source resolution and lunar coordinates. Great-circle paths connect observer and witnesses. Both markers and table buttons are accessible controls. The full-horizon sky shows the same angular witnesses.

Replay and observer-height changes refresh the trace. A point change clears it. Fit terrain samples restores the map extent; Clear trace removes the evidence overlay and exports null. The receipt retains active target, point/time/height, source identities and both witnesses. The viewer makes no claim of one exact obstruction on an unsampled target azimuth.

## Verification

- 41 JavaScript and 20 Python tests pass (61 total).
- 900 real-data trace cases and 10,800 reconstruction/metadata checks pass across 30 points, two targets, three heights and five dates.
- Prior data checks (884) and their bounded scientific conclusions remain applicable; horizon and ephemeris arrays are unchanged.
- The largest coordinate/metadata residuals are approximately 0.00063 m in stored distance and 0.00075° in bearing. These are serialization checks, not terrain-accuracy bounds.

Browser checks pass for regional and native-local witnesses, Sun/Earth switching, marker keyboard focus, witness highlighting, replay and height updates, point-change reset, Fit terrain samples and Clear trace. Both witnesses fit the requested map extent. At 390 px viewport width, the page is 375 px wide with no horizontal overflow; the trace table is contained in its scroll region. No console warnings/errors were recorded.

Two browser downloads were verified against all 57 current software hashes. The active receipt contains an Earth trace at the selected Site04 interior point and exact replay time, with both witnesses reconstructing its horizon. The cleared receipt records null. Source trace and scope remain separate from the original three-point uncertainty analysis. Retained previews show map/sky and the evidence table. Prior build records are under history/.

## Image help

Optional originals are useful near the three calculated outline-1 anchors: Connecting Ridge, Shackleton rim and de Gerlache rim. IMAGE_REQUESTS.md gives precise lunar coordinates and requested context sizes; data/image-request-footprints.json contains the projected and geographic footprints. Source link/product ID, resolution, footprint, projection and orientation should accompany images. No full-Moon model is needed for this milestone.

## Scope and next phase

M0–M5 remain complete under the revised agent-review delivery scope; the real-user study is deferred with zero participants. M6 implements the sampled-horizon trace. Next: refine the end-to-end decision journey and integrate verified context imagery if supplied. Independent scientific review, full-field terrain uncertainty, operational validation and event eligibility remain open. Landing hazards, power, thermal, RF, eclipses, routing and trajectories remain outside the bounded model. No public deployment or submission has been made.

The v0.7 local release includes the image brief, exact lunar footprints, trace validation, and source-linked decision receipt. The package manifest verifies every included file.

## Original-image intake

Acquired the Connecting Ridge LROC orthophoto and README identified in the user's referenced chat. Validity at the selected anchor, source CRS, source-pixel preservation and coverage were checked. A masked context crop and original-source manifest are under data/imagery; IMAGERY_INTAKE.md records the partial coverage, historical lighting and unmeasured relative registration. The other two selected anchors are outside this image. These newly prepared context assets are not yet applied to the app or included in the v0.7 ZIP. Scientific source arrays and the recorded 57 software hashes are unchanged.
