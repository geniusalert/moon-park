# Sampled terrain horizon trace · build 0.7

Choose Trace Sun or Trace Earth above the polar map. The map fits the observer and the terrain locations that support the target's current nominal angular horizon. Replay and observer-height changes recompute this evidence. Selecting a different point clears the trace; activate it again for the new point. Fit terrain samples restores the extent after a pan, zoom or moving target. Clear trace removes the overlays.

## What the markers mean

The model linearly interpolates horizon elevation between two neighboring sampled azimuth rays, with periodic wrapping through north. A and B are the strongest sampled terrain locations on those two rays. Their displayed weights reconstruct the interpolated horizon elevation. If the target lies exactly on a sampled ray, there is one witness with weight one.

A and B can be different distances away, can use different source grids, and need not be the exact obstruction on the object's unsampled azimuth. The interface does not invent a single intermediate blocker. Source distances and coordinates come from the prepared nominal horizon records, not the coarse 3D display mesh or an illustrative Moon model.

Inspect A/B buttons and keyboard-accessible map markers highlight each sampled witness. The table records ray azimuth, horizon elevation, interpolation weight, distance, local 5 m or regional 240 m source, and lunar latitude/longitude. Dashed paths follow spherical great circles in the source polar projection. Map areas outside the local display tiles deliberately have no terrain image even when the solver has regional horizon data there.

The sky panel shows the same witnesses at their actual sampled angular positions. Its object marker remains at the actual target azimuth; it is distinct from the A/B rays. The nominal target's elevation, interpolated horizon and center clearance appear in the readout. Sun availability follows the existing ≥50% disc criterion; Earth requires strictly positive center clearance. No RF, power or landing safety conclusion follows from either result.

## Evidence and checks

The decision receipt records the active trace under spatialView.horizonTrace, including point, time, observer height, target angles, horizon/clearance, witnesses, weights, projected paths, source identities and scope. This is separate from the per-point mission comparison and conditional terrain-variant results. Clearing the trace exports null rather than retaining a hidden old trace.

Six numerical tests cover interpolation, the north seam, exact-ray selection, the Sun half-disc and Earth grazing criteria, missing-source rejection, and spherical paths. A real-data report evaluates all 30 prepared points (three original benchmarks plus 27 interior samples), both targets, three observer heights and five dates: 900 trace cases with 10,800 reconstruction and metadata checks. All pass.

The largest measured distance discrepancy between stored witness coordinates and their recorded spherical distance is approximately 0.00063 m; the largest bearing discrepancy is approximately 0.00075°. Candidate metadata rounds projected coordinates to millimeters. These discrepancies concern serialization/coordinate reconstruction, not terrain accuracy, angular prediction accuracy or a physical error bound. See trace-validation.json.

The scientific horizon and ephemeris artifacts are unchanged by this viewer feature. No new terrain or imagery is inferred. Native-grid spacing, angular/radial sampling, finite 180 km extent, fixed regional terrain and the existing solar-disc approximation retain their prior limits.
