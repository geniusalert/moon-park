# Scientific acceptance evidence — 14 November 2026

## Coordinate sources

All 20 numeric NASA mission coordinates were matched against the NSSDCA artifact table. The table explicitly states DE421 mean Earth/polar-axis coordinates. The six Apollo points also have a dedicated NASA coordinate reference. The two regional feature references select the LOLA 2011 control network in the USGS records. Their frame match follows the LOLA product coordinate convention. No spatial correction is required for these stated frame identities. Geolocation error remains separate.

The navigator and exports now carry structured frame status, evidence URLs, transformation identity and limitations. Unpublished targets still have no coordinate or source frame.

Evidence is in catalogue-frame-verification.json, with archived source pages under data/raw/catalogue.

## Terrain coverage

The installed-source support check passed at all 76 sampled coordinates, including the pole, 12 longitudes at each of six latitudes and additional interior probes. Each coordinate checked 72 azimuths and nine distances, including 11,990 and 12,010 m on either side of the near/distant source handoff and 180 km at the outer radius. Four pixel neighbours were checked per interpolation position.

This is 49,248 sampled ray positions. It supplements the retained full-worker coverage runs. Every requested point still undergoes its own full horizon coverage check. Source support does not establish measured elevation accuracy.

Evidence is in terrain-coverage-grid.json. Run python scripts/validate_terrain_coverage_grid.py to repeat it with installed terrain.

## Measured thermal benchmark

A 64 KiB range of a real PDS Diviner south-polar product was acquired with its label and XML. The product bins bolometric surface brightness temperature at 240 m, local time 00:00–00:15, over southern summer observations from July 2009 through February 2019. The byte range and hashes are recorded.

Three latitude bands were compared with the published heat1d regolith model at pinned commit 5b73a6c1ba5047f59f6210185b37539e46e68136. The reference simulation sampled matching local-time and southern-summer conditions over one modeled year. The latitude-mean RMSE was 9.23 K. Individual residuals were +8.36, +7.80 and +11.17 K. No parameters were fitted to these measurements.

This is a limited measured surface benchmark. Aggregation periods, terrain, roughness, rocks and observation weighting are unmatched. It does not validate the navigator's lumped spacecraft body or certify thermal survival. Actual spacecraft material and hardware measurements are still required for that purpose.

Evidence is in diviner-thermal-comparison.json and is displayed in the engineering panel.

Optional reproduction uses an external reference installation.

```powershell
python scripts/fetch_diviner_reference.py
$referenceRoot = Join-Path $env:LOCALAPPDATA 'MoonPark/reference-python'
python -m pip install --target $referenceRoot -r requirements-science-reference.txt
git clone https://github.com/phayne/heat1d.git "$env:LOCALAPPDATA/MoonPark/heat1d-reference"
git -C "$env:LOCALAPPDATA/MoonPark/heat1d-reference" checkout 5b73a6c1ba5047f59f6210185b37539e46e68136
python scripts/validate_diviner_thermal.py
```

The reference package remains separate from the navigator runtime. Its installed model source was checked against the pinned checkout bytes.

## Browser acceptance

The final uncertainty, cancellation, export and restoration observations are appended below when completed.

Sources

- https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_artifact_impacts.html
- https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_sites.html
- https://planetarynames.wr.usgs.gov/Feature/4987
- https://planetarynames.wr.usgs.gov/Feature/16070
- https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/document/rdrsis.htm
- https://pds-geosciences.wustl.edu/missions/lro/diviner.htm
- https://doi.org/10.1002/2017JE005387

### Completed browser observations

The browser completed all six real terrain uncertainty cases at Connecting ridge with a 2027-03-20 UTC arrival and one-hour stay. The four horizontal offsets were 20 m and the relative elevation offsets were -1 and +1 m. Cancellation displayed a terminal cancelled state, followed by a successful cached retry.

An exported workspace was restored after deliberately changing initial battery charge. Re-export matched the original scenario config, all 29 engineering assumptions, the six recomputed uncertainty receipts and baseline/revised visibility metrics. A separate receipt with an altered source identity was rejected before changing the current workspace. The original valid workspace was then restored again.

The browser also displayed the measured Diviner comparison table with 9.23 K latitude-mean RMSE and its spacecraft-validation limitation.

Machine-readable evidence is in browser-scientific-acceptance.json. The original and re-exported file hashes are recorded there. Regression verification passed 103 JavaScript tests and 51 Python tests. This verification closes the tested software workflow. It does not establish spacecraft thermal accuracy, absolute terrain accuracy or independent scientific review.
