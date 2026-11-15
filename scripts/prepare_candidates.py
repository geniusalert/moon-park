"""Independently calculate 27 points inside 15 published study outlines."""
import datetime as dt
import hashlib
import json
from pathlib import Path
import numpy as np
import rasterio
from pyproj import CRS,Transformer
import spiceypy as spice
from prepare_spice import acquire,observe
from candidate_geometry import select_points,profiles_at

def digest(raw):return hashlib.sha256(raw).hexdigest()
def encode(value):return json.dumps(value,allow_nan=False,separators=(',',':')).encode()
def build():
    base=json.loads(Path('data/mission-data.json').read_text(encoding='utf-8'));spatial=json.loads(Path(base['spatial']['url'][1:]).read_text())
    kernels=acquire()
    for k in kernels:spice.furnsh(k['path'])
    code={p:digest(Path('scripts/'+p).read_bytes()) for p in ['prepare_candidates.py','candidate_geometry.py','extend_horizons.py','prepare_spice.py','prepare_terrain.py']}
    times=[r['utc'] for r in base['sites'][0]['ephemerides']['sun']]
    lunar=CRS.from_proj4('+proj=longlat +R=1737400 +no_defs')
    output=dict(schemaVersion=1,regions=[],scope='Explicit interior sample points, not whole-region coverage or certified landing candidates. Spatial variation is not calibrated terrain uncertainty. No cloned terrain outcomes are transferred from legacy research points.',software=code)
    folder=Path('data/candidates');folder.mkdir(exist_ok=True)
    with rasterio.open('data/raw/regional-240m.tif') as rd:
        regional=rd.read(1,masked=True).filled(np.nan);reg_forward=Transformer.from_crs(lunar,rd.crs,always_xy=True)
        for source in base['sites']:
            native=Path(f'data/raw/{source["id"]}.tif')
            if digest(native.read_bytes())!=source['provenance']['sha256']:raise ValueError('DEM identity mismatch')
            with rasterio.open(native) as ds:
                terrain=ds.read(1,masked=True).filled(np.nan);inverse=Transformer.from_crs(ds.crs,lunar,always_xy=True);forward=Transformer.from_crs(lunar,ds.crs,always_xy=True)
                for roi in [r for r in spatial['regions'] if r['siteId']==source['id']]:
                    points=select_points(roi,terrain,ds.transform,expanded=roi['id'].endswith('-1'))
                    group=dict(regionId=roi['id'],sourceSiteId=source['id'],points=[])
                    for selected in points:
                        pid=roi['id']+'-'+selected['key'];lon,lat=inverse.transform(*selected['xy'])
                        site=dict(id=pid,sourceSiteId=source['id'],regionId=roi['id'],name=roi['label']+' / '+selected['key'],longitude=float(lon),latitude=float(lat),**selected)
                        context=dict(point=site,sourceDEM=source['provenance']['sha256'],spatialHash=base['spatial']['sha256'],regional=source['provenance']['regional'],kernels=kernels,software=code,startUTC=times[0],endUTC=times[-1])
                        key=digest(encode(context));cache=folder/f'{pid}-{key[:12]}.json'
                        if not cache.exists():
                            print('Calculating',pid,selected['xy'],flush=True)
                            profiles=profiles_at(site,terrain,ds.transform,regional,rd.transform,forward,reg_forward)
                            series={}
                            for h in [2,5,10]:
                                series[str(h)]={}
                                for target,name in [('SUN','sun'),('EARTH','earth')]:
                                    rows=[observe(target,t,site['longitude'],site['latitude'],site['groundM']+h) for t in times]
                                    series[str(h)][name]=[[round(r['az'],7),round(r['el'],7),round(r['rangeKm'],3)] for r in rows]
                            payload=dict(schemaVersion=1,site=site,context=context,profiles=profiles,ephemerides=series,times=times,provenance={**source['provenance'],'selection':'Nearest valid native 5 m cell center inside polygon to bounding-box center; offset probes target +/-50 m in map grid axes and remain inside polygon','groundMethod':'Native 5 m bilinear at selected pixel center','simulationScope':'Nominal terrain only; no terrain-clone ensemble calculated at this point'},ephemerisProvenance=dict(engine='NAIF SPICE spkcpo',frame='MOON_ME_DE421',aberration='CN+S',kernels=kernels,observerHeightsM=[2,5,10],coordinateSpecific=True))
                            cache.write_bytes(encode(payload))
                        raw=cache.read_bytes();payload=json.loads(raw)
                        if payload['context']!=context:raise ValueError('Cached candidate context mismatch')
                        group['points'].append({**site,'url':'/'+cache.as_posix(),'sha256':digest(raw)})
                        print('Prepared',pid,flush=True)
                    output['regions'].append(group)
    spice.kclear()
    raw=encode(output);sha=digest(raw);manifest=Path(f'data/candidates-{sha[:12]}.json');manifest.write_bytes(raw);Path('data/candidates.json').write_bytes(raw)
    base['candidates']=dict(url='/'+manifest.as_posix(),sha256=sha,pointCount=sum(len(r['points']) for r in output['regions']),regionCount=len(output['regions']),scope=output['scope'])
    Path('data/mission-data.json').write_bytes(encode(base))
    print('Completed',base['candidates'],flush=True)

if __name__=='__main__':build()
