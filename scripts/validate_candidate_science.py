"""Coordinate-specific checks against native heights and retained Horizons outputs."""
import hashlib,json
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import urlopen
import numpy as np
import rasterio
import spiceypy as spice
from prepare_spice import acquire,observe
from prepare_ephemerides import parse
from extend_horizons import bilinear

def build():
    base=json.loads(Path('data/mission-data.json').read_text(encoding='utf-8'));manifest=json.loads(Path(base['candidates']['url'][1:]).read_text());checks=0;sites=[]
    for k in acquire():spice.furnsh(k['path'])
    for group in manifest['regions']:
        for point in group['points']:
            p=json.loads(Path(point['url'][1:]).read_text());site=p['site']
            with rasterio.open(f'data/raw/{site["sourceSiteId"]}.tif') as ds:
                z,valid=bilinear(ds.read(1,masked=True).filled(np.nan),ds.transform,*site['xy'])
                assert valid and abs(float(z)-site['groundM'])<1e-8;checks+=1
            for h in [2,5,10]:
                for target,name in [('SUN','sun'),('EARTH','earth')]:
                    for i in [0,1000,len(p['times'])-1]:
                        direct=observe(target,p['times'][i],site['longitude'],site['latitude'],site['groundM']+h);stored=p['ephemerides'][str(h)][name][i]
                        assert abs((direct['az']-stored[0]+180)%360-180)<5.1e-8 and abs(direct['el']-stored[1])<5.1e-8;checks+=1
        # One anchor in each terrain area gets a separate Horizons implementation-path check.
        if not group['regionId'].endswith('-1'):continue
        point=group['points'][0];p=json.loads(Path(point['url'][1:]).read_text());site=p['site'];residuals={}
        for target,name in [('10','sun'),('399','earth')]:
            params=dict(format='json',COMMAND=f"'{target}'",OBJ_DATA="'NO'",MAKE_EPHEM="'YES'",EPHEM_TYPE="'OBSERVER'",CENTER="'coord@301'",COORD_TYPE="'GEODETIC'",SITE_COORD=f"'{site['longitude']},{site['latitude']},{(site['groundM']+2)/1000}'",START_TIME="'2026-11-14'",STOP_TIME="'2026-12-14'",STEP_SIZE="'1 d'",QUANTITIES="'4'",CSV_FORMAT="'YES'",ELEV_CUT="'-90'",APPARENT="'AIRLESS'",TIME_TYPE="'UT'")
            url='https://ssd.jpl.nasa.gov/api/horizons.api?'+urlencode(params);cache=Path('data/raw')/(site['id']+'-'+name+'-daily.json');request=cache.with_suffix('.request.json')
            if not cache.exists() or not request.exists() or json.loads(request.read_text())!=params:
                with urlopen(url,timeout=60) as response:raw=response.read()
                parse(raw);cache.write_bytes(raw);request.write_text(json.dumps(params))
            raw=cache.read_bytes();rows=parse(raw);errors=[]
            for row in rows:
                predicted=observe('SUN' if name=='sun' else 'EARTH',row['utc'],site['longitude'],site['latitude'],site['groundM']+2)
                errors.append([float((predicted['az']-row['az']+180)%360-180),float(predicted['el']-row['el'])])
            a=np.array(errors);assert np.max(np.abs(a[:,1]))<.001;checks+=1
            residuals[name]=dict(samples=len(rows),maxAzDifferenceDeg=float(np.max(np.abs(a[:,0]))),maxElDifferenceDeg=float(np.max(np.abs(a[:,1]))),url=url,sha256=hashlib.sha256(raw).hexdigest())
        sites.append(dict(id=site['id'],residuals=residuals));print(site['id'],residuals,flush=True)
    spice.kclear();report=dict(checks=checks,passed=True,sites=sites,scope='Native point-height and direct SPICE serialization checks for all 27 points. Separate daily Horizons cross-check at three anchors only; same NASA/JPL lineage, not independent observational truth.')
    Path('docs/candidate-science-validation.json').write_text(json.dumps(report,indent=2));print('Science checks',checks,flush=True)
if __name__=='__main__':build()
