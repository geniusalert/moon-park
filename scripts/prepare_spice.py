"""Frame-matched SPICE observations, plus a separate Horizons cross-check."""
import datetime as dt
import hashlib
import json
from pathlib import Path
import numpy as np
import spiceypy as spice
from fetch_kernels import acquire

R_KM=1737.4

def basis(lon,lat):
    l,p=np.radians(lon),np.radians(lat)
    up=np.array([np.cos(p)*np.cos(l),np.cos(p)*np.sin(l),np.sin(p)])
    north=np.array([-np.sin(p)*np.cos(l),-np.sin(p)*np.sin(l),np.cos(p)])
    east=np.array([-np.sin(l),np.cos(l),0])
    return north,east,up

def observe(target,utc,lon,lat,altitude_m):
    north,east,up=basis(lon,lat)
    position=up*(R_KM+altitude_m/1000)
    state,_=spice.spkcpo(target,spice.str2et(utc),'MOON_ME','OBSERVER','CN+S',position,'MOON','MOON_ME')
    vec=state[:3]
    n,e,u=np.dot(vec,north),np.dot(vec,east),np.dot(vec,up)
    return dict(utc=utc,az=float(np.degrees(np.arctan2(e,n))%360),el=float(np.degrees(np.arctan2(u,np.hypot(n,e)))),rangeKm=float(np.linalg.norm(vec)))

def build():
    kernels=acquire()
    for k in kernels:spice.furnsh(k['path'])
    reference=json.loads(Path('data/mission-data.json').read_text(encoding='utf-8'))
    sources={s['id']:s for s in reference['sites']}
    sites=json.loads(Path('data/terrain-regional.json').read_text(encoding='utf-8'))
    report=dict(generatedAt=dt.datetime.now(dt.timezone.utc).isoformat(),method='SPICE spkcpo CN+S, DE421 MOON_ME; compare Horizons MEAN_ME/DE441 at identical reference coordinates and original altitude',interpretation='Independent implementation-path cross-check, not independent observational truth. Differences include ephemeris/frame and aberration model differences; SPICE omits gravitational light deflection.',kernels=kernels,sites=[])
    for site in sites:
        ref=sources[site['id']]
        # Preserve original Horizons reference even on repeated preparation runs.
        horizons=ref.get('horizonsReference',ref['ephemerides'])
        horizons_sources=ref.get('horizonsProvenance',ref['ephemerisProvenance'])
        reference_ground=ref.get('horizonsGroundM',ref['groundM'])
        site['horizonsReference']=horizons;site['horizonsProvenance']=horizons_sources;site['horizonsGroundM']=reference_ground
        site['ephemeridesByHeight']={};site['ephemerisProvenance']={}
        residuals={}
        for target,name in [('SUN','sun'),('EARTH','earth')]:
            rows=horizons[name]
            compared=[]
            for row in rows[::144]:
                p=observe(target,row['utc'],site['longitude'],site['latitude'],reference_ground+2)
                da=(p['az']-row['az']+180)%360-180
                compared.append([da,p['el']-row['el']])
            a=np.array(compared)
            residuals[name]=dict(samples=len(a),maxAzDifferenceDeg=float(np.max(np.abs(a[:,0]))),maxElDifferenceDeg=float(np.max(np.abs(a[:,1]))),rmsElDifferenceDeg=float(np.sqrt(np.mean(a[:,1]**2))))
            for height in [2,5,10]:
                observations=[observe(target,row['utc'],site['longitude'],site['latitude'],site['groundM']+height) for row in rows]
                site['ephemeridesByHeight'].setdefault(str(height),{})[name]=observations
            site['ephemerisProvenance'][name]=dict(engine='NAIF SPICE / SpiceyPy',target=target,frame='MOON_ME_DE421',aberration='CN+S',observerHeightsM=[2,5,10],kernels=kernels,referenceHorizons=horizons_sources[name],signature={'source':'NASA/JPL NAIF SPICE','version':spice.tkvrsn('TOOLKIT')})
        site['ephemerides']=site['ephemeridesByHeight']['2']
        site['frameCheck']=residuals;report['sites'].append(dict(id=site['id'],residuals=residuals))
        print(site['id'],residuals,flush=True)
    reference.update(schemaVersion=3,status='real-data-regional-terrain-spice-experimental',sites=sites,generatedAt=dt.datetime.now(dt.timezone.utc).isoformat())
    reference['software']={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in [Path('scripts/extend_horizons.py'),Path('scripts/prepare_spice.py'),Path('src/mission.js'),Path('src/engine.js')]}
    Path('data/mission-data.json').write_text(json.dumps(reference,allow_nan=False,separators=(',',':')),encoding='utf-8')
    Path('docs/frame-validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    spice.kclear()

if __name__=='__main__':build()
