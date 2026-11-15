# Mission catalogue and site comparison — 0.16

Updated 13 November 2026. Structured records and sources are retained in mission-catalogue-sources.json.

## Choose and compare sites

Use Mission programme to filter Apollo, future CLPS, all CLPS, commercial or international programmes. Search by mission name, operator or status. The mission panel shows the coordinate's meaning and links to the mission and coordinate sources. Pin up to three missions or custom coordinates. Select Side by side, Detailed cards or One site at a time. The table can compare original or revised arrival; each column has an inspection action and can be removed. Sequential previous/next controls move the shared inspector between pinned sites.

The comparison includes coordinates, operator, coordinate meaning, calculation model, sunlight/Earth/shared windows, peak solar elevation, longest darkness, signed requirement margins and failed requirements. The current build also preserves the shared visibility-window/elevation charts and source display. Negative margins are shortfalls. Both original and revised status include the continuous-activity requirement. Missing results remain unavailable rather than zero.

Historical missions are locations for a hypothetical user-selected 2027 arrival, not replays of their actual landing dates. Planned statuses are dated source records, not guaranteed launch dates. Reported impact coordinates are labeled as impact positions, not successful landing sites. Regional reference coordinates are not published exact touchdown targets. Unpublished targets have no marker and cannot be pinned until the user supplies a separate custom study coordinate.

## Calculation models

Automatic mode uses measured polar terrain within 85–90S and a global reference sphere elsewhere. Missing polar sources produce a setup/coverage error; they never silently become reference-sphere results. Select Reference sphere for all sites for a common global geometric screen, or Measured polar terrain only to require the existing terrain model. The latter explicitly rejects locations outside the supported cap.

Reference-sphere mode uses source-identified JPL Horizons airless observer tables; real requests record their frame, datum, angular positions and distances. Retained SPICE spkcpo calculations provide cross-method checks at selected coordinates. The sphere radius is 1737.4 km; reference ground elevation is zero and observer heights are 2, 5 or 10 m above that radius. The analytic horizon depression is -acos(R/(R+h)). Actual surface elevation, mountains and craters are omitted. This mode does not use a DEM or imply the accuracy of the measured polar model. The local display is labeled as a smooth curvature patch.

Reference and terrain results are identified in the comparison, inspector, alternatives and source-identified export. Mixed models can be viewed side by side with a scope warning; ranking alternatives across mixed models is rejected until a common model is chosen. Globe directions, horizon, timelines, event brackets and seasonal previews use the selected result's own model. Model changes require recalculation rather than reusing a horizon from a different model.

Global reference calculations require Python dependencies, the local kernel setup used by validation, and an internet connection for uncached JPL requests. Cached responses can be reused. Terrain downloads are unnecessary for this model:

```
python -m pip install -r requirements.txt
python scripts/fetch_kernels.py
npm start
```

Measured polar calculations additionally need the existing terrain setup command. Custom latitude now accepts -90 to +90; longitude is normalized and both poles use longitude zero as the azimuth reference. Supported arrivals remain in 2027 with complete delayed/recovery observations. Workspaces retain the model preference, mission identity, coordinate meaning and per-result source references; older compatible settings default to Automatic. Changed software/source identities still require recalculation.

## Source use

Apollo Lunar Module coordinates: NASA NSSDCA's Apollo landing-site table, explicitly in the Mean Earth/Polar Axis DE421 system. Other historical landing and impact coordinates: NASA NSSDCA's artifact table. Future CLPS target descriptions: NASA mission resources, NASA PGDA's mini-LRA catalogue and the relevant operator pages. The IM-3 Reiner Gamma regional reference uses the USGS feature centre. IM-4 uses the Mons Mouton USGS feature centre. These are regional study points, not exact mission targeting assertions. Cross-source coordinate/frame offsets have not been quantified.

## Evidence and limits

See mission-global-verification.json for real Apollo 11, Chang’e 4 and Reiner Gamma regional-reference calculations, retained Horizons queries/residuals, cache reuse and cancellation. Cross-method checks share JPL inputs and do not establish absolute physical accuracy. See mission-catalogue-tests.tap for calculation/model-selection/comparison regressions. Current user understanding still requires the actual-participant study; there are no human study records.

No model here certifies landing safety, electrical output, a radio link, thermal survival or complete mission feasibility. Eclipses are omitted. Reference-sphere screening does not complete whole-Moon measured-terrain coverage.
