"""Catalogue actual polar crop masks and projection probes without changing sources."""
import json
from pathlib import Path
import numpy as np
import rasterio
from pyproj import CRS,Transformer
catalog=json.loads(Path('data/raw/navigator/catalog.json').read_text())
report=dict(frame='MOON_ME_DE421',verticalReference='Elevation in metres above the 1737400 m reference sphere',poleConvention='Longitude zero fixes the tangent north/east azimuth basis',sourcePage='https://pgda.gsfc.nasa.gov/products/90',sources=[])
lunar=CRS.from_proj4('+proj=longlat +R=1737400 +no_defs')
for source in catalog['sources']:
 with rasterio.open(source['path']) as ds:
  missing=0
  for _,window in ds.block_windows(1):missing+=int(np.count_nonzero(ds.read_masks(1,window=window)==0))
  forward=Transformer.from_crs(lunar,ds.crs,always_xy=True)
  report['sources'].append(dict(id=source['id'],sha256=source['sha256'],resolutionM=list(ds.res),bounds=list(ds.bounds),shape=list(ds.shape),nodata='NaN' if np.isnan(ds.nodata) else ds.nodata,missingPixels=missing,totalPixels=ds.width*ds.height,crsWKT=ds.crs.to_wkt(),projectionProbes=[dict(longitude=lon,latitude=-85,xy=list(forward.transform(lon,-85))) for lon in [0,90,180,-90]],verticalReference=report['verticalReference'],frame=report['frame']))
Path('docs/navigator-terrain-catalogue.json').write_text(json.dumps(report,indent=2));print([(s['id'],s['missingPixels'],s['totalPixels']) for s in report['sources']])
