"""Retain coordinate-specific SPICE/Horizons comparisons across prepared sites and seasons."""
import datetime as dt,json,os,sys,tempfile,time
from pathlib import Path
import spiceypy as spice
from prepare_spice import observe
from horizons_observer import fetch_observations
from setup_navigator_terrain import digest
sites=json.loads(Path('data/mission-data.json').read_text())['sites']
kernels=json.loads(Path('data/raw/kernels/manifest.json').read_text())
for kernel in kernels:
 if digest(Path(kernel['path']))!=kernel['sha256']:raise ValueError('Kernel checksum mismatch')
 spice.furnsh(kernel['path'])
store=Path(os.environ.get('LOCALAPPDATA',tempfile.gettempdir()))/'MoonPark'/'seasonal-validation'
store.mkdir(parents=True,exist_ok=True)
report=dict(generatedUTC=dt.datetime.now(dt.timezone.utc).isoformat(),kernels=kernels,cases=[],scope='Three prepared terrain coordinates, four seasons; SPICE CN+S compared against airless Horizons apparent angles. Agreement is a cross-method check, not observational truth.')
out=Path('docs/seasonal-science-validation.json')
for site in sites:
 for month,day in [(3,20),(6,21),(9,22),(12,21)]:
  start=dt.datetime(2027,month,day,tzinfo=dt.timezone.utc)
  times=[(start+dt.timedelta(minutes=10*i)).isoformat().replace('+00:00','Z') for i in range(7)]
  case=dict(siteId=site['id'],longitude=site['longitude'],latitude=site['latitude'],groundM=site['groundM'],startUTC=times[0],targets={})
  for target,name in [('10','sun'),('399','earth')]:
   try:
    rows,source=fetch_observations(target,site['longitude'],site['latitude'],site['groundM']+2,times,store)
    comparisons=[]
    for row in rows:
     point=observe(name.upper(),row['utc'],site['longitude'],site['latitude'],site['groundM']+2)
     comparisons.append(dict(utc=row['utc'],azimuthResidualDeg=(point['az']-row['az']+180)%360-180,elevationResidualDeg=point['el']-row['el'],spiceElevationDeg=point['el'],horizonsElevationDeg=row['el']))
    case['targets'][name]=dict(source=source,comparisons=comparisons,maxElevationResidualDeg=max(abs(r['elevationResidualDeg']) for r in comparisons),maxAzimuthResidualDeg=max(abs(r['azimuthResidualDeg']) for r in comparisons))
   except Exception as error:case['targets'][name]=dict(error=str(error))
  report['cases'].append(case);out.write_text(json.dumps(report,indent=2));print(site['id'],times[0],flush=True)
spice.kclear()
