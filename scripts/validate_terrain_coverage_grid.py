"""Broad installed-terrain support check using four pixel neighbours at sampled rays."""
import datetime as dt,json,math
from pathlib import Path
import numpy as np,rasterio
from pyproj import CRS,Transformer
from navigator_worker import destinations
from setup_navigator_terrain import digest
catalog=json.loads(Path('data/raw/navigator/catalog.json').read_text())
sources=catalog['sources']
for record in sources:
 if digest(Path(record['path']))!=record['sha256']:raise ValueError('Source identity mismatch')
lunar=CRS.from_proj4('+proj=longlat +R=1737400 +no_defs')
layers=[(r,rasterio.open(r['path'])) for r in sources]
coords=[(lon,lat) for lat in [-85,-86,-87,-88,-89,-89.9] for lon in range(-180,180,30)]+[(0,-90)]
# Include exact dataset-edge probes, both sides of the near/distant handoff and a known crater interior.
coords += [(-139.9,-89.9),(-139.9,-89.8),(-68.4,-88.67)]
report=dict(generatedUTC=dt.datetime.now(dt.timezone.utc).isoformat(),sources=sources,azimuthSpacingDeg=5,distancesM=[100,500,1000,5000,11990,12010,30000,90000,180000],cases=[],scope='Sampled support and four-neighbour validity check. The actual worker still verifies its full 0.125-degree ray grid per request. This check does not establish elevation accuracy.')
for lon,lat in coords:
 distances=np.array(report['distancesM'],dtype=float)
 lo,la=destinations(lon,lat,np.arange(0,360,5),distances)
 valid=np.zeros(lo.shape,dtype=bool)
 for record,ds in layers:
  transform=Transformer.from_crs(lunar,ds.crs,always_xy=True)
  x,y=transform.transform(lo.ravel(),la.ravel())
  rows,cols=rasterio.transform.rowcol(ds.transform,x,y,op=lambda v:np.floor(v-.5).astype(int))
  rows,cols=np.asarray(rows),np.asarray(cols)
  support=np.ones(len(x),dtype=bool)
  for dr,dc in [(0,0),(0,1),(1,0),(1,1)]:
   px,py=rasterio.transform.xy(ds.transform,rows+dr,cols+dc)
   samples=np.ma.asarray(list(ds.sample(zip(px,py),masked=True)))[:,0]
   support &= ~np.ma.getmaskarray(samples)&np.isfinite(samples.filled(np.nan))
  permitted=distances[None,:]<=12000 if record['pixelM']==20 else distances[None,:]>12000
  valid |= support.reshape(lo.shape)&permitted
 missing=np.argwhere(~valid)
 report['cases'].append(dict(longitude=lon,latitude=lat,testedRays=int(valid.size),missingSamples=len(missing),supported=bool(valid.all())))
Path('docs/terrain-coverage-grid.json').write_text(json.dumps(report,indent=2))
for _,ds in layers:ds.close()
print(len(report['cases']),'coordinates;',sum(not c['supported'] for c in report['cases']),'unsupported cases')
