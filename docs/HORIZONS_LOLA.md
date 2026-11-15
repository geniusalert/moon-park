# Horizons and LOLA integration

New 2027 on-demand site calculations request airless Sun (10) and Earth (399) observer tables directly from JPL Horizons at the requested lunar longitude, latitude and terrain elevation plus observer height. Quantities 4 and 20 supply azimuth, elevation and range. Ten-minute UTC tables are validated and cached with response hashes; failures do not silently substitute synthetic or SPICE observations. Prepared 2026 demonstrations retain their recorded original sources.

Measured terrain uses NASA PGDA LOLA elevation products: native 5 m local tiles where present, 20 m near-field coverage, and 240 m regional coverage. The existing spherical ray calculation samples 2,880 azimuths to 180 km at observer heights of 2, 5 and 10 m. Missing terrain makes a result unavailable. No atmospheric refraction is applied. The display is now a 101 by 101 mesh at 50 m spacing over 5 km, with true vertical relief; display spacing is separate from calculation resolution.

JPL documents modern Horizons lunar MEAN_ME as the standard DE421 mean-Earth frame, consistent with the LOLA product frame. Live responses are checked for high-precision MEAN_ME/MOON_ME orientation, the 1737.4 km spherical datum and AIRLESS treatment. This validates configuration compatibility, not absolute surface registration accuracy. These calculations are preliminary geometric screening. Prepared datasets are not rewritten by the live integration.

Verified with a live polar calculation at 0 longitude, 89 south, arrival 2027-01-01: six Horizons requests (two bodies, three heights), measured terrain profiles, display mesh and JavaScript mission evaluation. Network access is required on a cache miss. Raw Horizons responses remain in the calculation cache.

References: https://ssd-api.jpl.nasa.gov/doc/horizons.html and https://pgda.gsfc.nasa.gov/products/90

See AIRLESS_HORIZON.md for the refined geometry, solar-disc integration and numerical diagnostics.
