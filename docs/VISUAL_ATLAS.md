# Visual lunar atlas and mission observatory

14 November 2026 — local source build, following the preserved 0.16 release.

## Visual additions

The Moon now progressively loads the existing 2K contextual texture and then an 8192×4096 NASA SVS/LROC texture. The 2019 8K RGB TIFF was downloaded from NASA and converted directly to JPEG quality 92 (8,507,748 bytes); no generative enhancement is used. Both source and derivative hashes are retained in data/globe/manifest.json. Raw TIFF remains outside the demonstration package. Globe assets are already included by the release packager. Browsers without adequate texture size retain 2K; missing high-detail imagery reports the fallback.

The atlas provides coordinate-grid and marker toggles, explicit zoom controls, numbered pinned-site labels, a live cursor-coordinate readout, and imagery status. Existing coordinate entry remains the keyboard alternative to pointer picking. Markers represent catalogue coordinates, not evaluated regions. Imagery is designed for visual rendering and includes lower-resolution polar albedo fill, as documented by NASA. This is not a tiled QuickMap equivalent and does not provide metre-resolution global imagery. Terrain calculations continue using separate source-identified measured terrain or the declared reference sphere.

Mission observatory follows the inspected baseline/revised or preview result. Sun and Earth azimuths appear on a cardinal compass, with faded arcs from actual mission samples. Arcs show azimuth alone, not elevation or a terrain boundary. Solid gold and dashed sage bearings have text equivalents. Three availability dials show sunlight, Earth and total overlap as hours and percentages of mission duration. Total overlap is explicitly separate from longest continuous activity; existing comparison constraints remain authoritative. Countdown cards use the shared event function and preserve UTC sample brackets and hidden/no-event states.

## Verification

92 JavaScript tests pass. New tests check compass axes/wrapping and duration-normalized availability. Browser loaded data-texture=8k, exercised grid and zoom, and showed Sun bearing 239.4° and Earth 133.1° at arrival changing to 203.0° and 130.2° at the last inspected sample. Countdown state follows replay. The example dials show 72 h sunlight and 59.3 h direct Earth/overlap out of 72 h. No browser console errors were observed. At 390 px viewport, document client and scroll widths both equal 375 px. Screenshot evidence is retained alongside this report. No new operational accuracy, independent review or human study is claimed.

## Inspiration and sources

[NASA SVS CGI Moon Kit](https://svs.gsfc.nasa.gov/4720/) supplies credited imagery; source and derivative records are retained locally. [QuickMap](https://quickmap.lroc.asu.edu/) and [Moon Trek](https://trek.nasa.gov/moon/) inform the atlas interaction style, not the source of embedded live tiles. [JPL Horizons](https://ssd.jpl.nasa.gov/horizons/) remains the existing new-observation provider. [CSA Moon Exploration](https://www.asc-csa.gc.ca/eng/astronomy/moon-exploration/) is retained as optional educational context. These external tools are optional and not embedded dependencies.
