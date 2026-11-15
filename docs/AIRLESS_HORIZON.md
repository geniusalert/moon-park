# Airless lunar horizons: calculation and accuracy

## Physical model

The lunar exosphere does not provide the Earth-style atmospheric bending used in terrestrial horizon calculators. All new lunar observations require AIRLESS treatment, and all terrain rays use straight lines with an effective-radius factor of exactly one. No 34-arcminute terrestrial sunrise correction or 4/3-Earth radio-radius correction is applied. Light-time, stellar aberration and gravitational light deflection in Horizons apparent coordinates remain active: these are different effects from atmospheric refraction.

LOLA elevation is radial height z above R = 1,737,400 m. An observer at ground elevation g and height h is at radius R + g + h. For a terrain sample at datum arc distance d, theta = d/R:

- Horizontal component: (R + z) sin(theta)
- Vertical component: (z - g - h) - 2 (R + z) sin²(theta/2)
- Apparent terrain elevation: atan2(vertical, horizontal)

The second form avoids subtracting two lunar radii and remains stable at short distances. The maximum elevation along each sampled direction defines the skyline. The radial vertical establishes the horizon plane; terrain slope does not change the local coordinate vertical. Observer height is radial height above measured ground, not height above the datum or an instrument's slope-normal mounting length.

The reference datum is not an opaque ball. Forcing its limb into measured terrain would incorrectly block below-datum craters. A separate smooth-sphere model uses the exact tangent dip atan2(sqrt(h(2r+h)), r), line-of-sight distance sqrt(h(2r+h)), and surface arc r times the dip, with r the chosen surface radius. The terrain inspector provides this tangent at the site's ground radius for comparison only.

## Terrain support and sampling

New polar calculations use 2,880 azimuths at 0.125 degrees, including periodic interpolation across north. Radial spacing is 1 m from 1–200 m, 10 m to 12 km and 60 m to 180 km. The finest available supported LOLA product is used: local 5 m tiles where available, 20 m near-field and 240 m regional terrain. Bilinear interpolation is between pixel centres and requires all four support cells. Missing required terrain rejects the result rather than filling holes with zero or a reference sphere. Finer ray spacing does not create finer DEM resolution.

Every horizon ray retains its blocker location, elevation, range, source resolution and supported radius. The profile reports the change from removing alternate radial samples. Alternate azimuths provide a coarser 0.25-degree profile; midpoint and mission-direction differences expose angular sensitivity. These are convergence diagnostics, not rigorous uncertainty intervals. They cannot detect a feature missed by both grids.

The calculation omits boulders, lander structures and features below the DEM's effective resolution, including terrain within the first metre. DEM vertical errors, registration errors, tidal surface displacement and the difference between radial vertical and the physical gravity plumb line are not modeled as calibrated uncertainties. Those limits must remain explicit for mission use.

## Finite-radius obstruction check

A 180 km terrain profile is not automatically a full-body horizon. Each observer height therefore has a conditional remote angular bound assuming all farther terrain is at or below +12,000 m above the lunar datum. This is an engineering envelope above published lunar summit elevations, not a measured global maximum or an authoritative safety bound.

The bound maximizes the exact terrain angle for angular distances theta >= 180000/R. When the observer lies above the envelope radius, the maximum may occur at its tangent; otherwise it occurs at the first unmodeled distance. It is not a flat-Earth height/distance approximation.

The mission calculation keeps nominal measured-terrain results and separately tests Sun/Earth visibility with the maximum of the measured skyline and this remote bound. It reports nominal visible samples sensitive to that envelope, plus a conditional lower bound on the visible solar area. These fields do not imply complete terrain coverage or calibrated confidence. Unmodeled terrain cannot make a blocked geometric direction visible.

## Sun and Earth

For observations containing a range, apparent solar angular radius is asin(695700 km / observer-to-Sun range), using the IAU nominal photospheric radius. Legacy observations without ranges retain an explicitly identified 0.2666-degree fallback. Impossible supplied solar ranges are rejected.

For the refined terrain model, 16 equal projected-area radial rings and 64 azimuth sectors provide 1,024 area samples on the solar disc. Directions are mapped onto the celestial sphere in a tangent basis, including wrap at north and zenith behavior; each is compared against its own azimuth's terrain skyline. The result is uniformly bright geometric visible area, not irradiance: limb darkening, solar eclipses, equipment occlusions and electrical conversion are excluded. The sunlight threshold remains at least 50 percent visible area. Geometric partial visibility and centre clearance are reported separately. Earth communications continue to require the Earth centre above its own skyline; visibility of part of the Earth disc is not treated as a radio link.

Existing ten-minute observation bins remain ten-minute bins. Visibility events are bracketed by adjacent real samples; no sub-minute timing precision or interpolated ephemeris accuracy is claimed. Horizon refinement improves spatial geometry and does not remove temporal sampling limits.

## Reference frames and provenance

JPL's current manual states that modern lunar MEAN_ME is the standard DE421 mean-Earth frame, obtained by fixed rotation from the DE440 principal-axis solution. NASA's LOLA products use MOON_ME of DE421. The earlier generic incompatible-frame warning was incorrect and has been replaced by checks on each response's reported high-precision centre frame, spherical radii and AIRLESS header. Raw responses, parameters and checksums remain cached. Refined model versions and calculation-source hashes invalidate old geometry caches. Prepared 2026 artifacts retain their original sampling; they are labeled separately in the inspector.

## Verification

Analytic tests cover exact sphere tangencies, observer-height dependence, multiple ground datums, sub-metre stability, curvature, invalid inputs, synthetic blockers, refinement diagnostics and remote envelopes for both low and high observers. Solar tests compare numerical area against analytic circular segments, test varying skylines and north wrap, and check zenith and range dependence. Integration checks use installed LOLA data and live/cached JPL Horizons tables through the JavaScript mission evaluator.

## Primary references

- JPL Horizons manual: https://ssd.jpl.nasa.gov/horizons/manual.html (lunar DE421 mean-Earth frame, apparent azimuth/elevation, atmospheric treatment)
- Horizons API: https://ssd-api.jpl.nasa.gov/doc/horizons.html
- NASA PGDA LOLA products: https://pgda.gsfc.nasa.gov/products/90 (product frame, elevation and resolution)
- IAU 2015 Resolution B3: https://www.iau.org/common/Uploaded%20files/IAUGA2015-Resolution-B3-recommended-nominal-conversion.pdf (nominal solar radius)
- LROC summit elevation context: https://lroc.im-ldi.com/images/944 (published elevation at least 10,786 m; does not certify the assumed remote envelope)
