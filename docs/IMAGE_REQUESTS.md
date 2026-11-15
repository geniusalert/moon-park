# Optional image requests

These are lunar coordinates around our actual calculated anchors. Images are optional; implementation continues using the validated elevation data. Prioritize one original overhead image for each area, covering roughly 2 km × 2 km around its center. A wider 8–16 km context image is also useful if available.

| Area | Latitude | East longitude | Data area |
|---|---:|---:|---|
| Connecting Ridge | -89.438702° | -137.071320° | Site01 / outline 1 |
| Shackleton rim | -89.761359° | -157.128899° | Site04 / outline 1 |
| de Gerlache rim | -88.667979° | -68.403384° | Site11 / outline 1 |

Negative east longitude is west longitude. Please retain the source URL or product identifier, original file, resolution (meters per pixel), map footprint/corner coordinates, projection and orientation. Acquisition time and illumination information are useful if supplied. A georeferenced GeoTIFF is ideal; an original PNG/JPEG with map metadata also works. A dark crater image is useful context but does not establish terrain height or safety.

Exact requested footprints, in native lunar polar XY and longitude/latitude, are in data/image-request-footprints.json. These are Moon coordinates, not terrestrial WGS84. Our request boxes describe imagery context; their whole interiors have not been simulated.

NASA source terrain and published study outlines: https://pgda.gsfc.nasa.gov/products/78 . Do not alter or add NASA logos. No full-Moon model is required for the current obstruction-trace milestone. Any overview model would be presentation context and would not replace local scientific elevations.
