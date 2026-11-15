from airless_horizon import sphere_limb
from horizons_observer import observations as horizons_observations
"""Global JPL Horizons screening on the declared 1737.4 km reference sphere; no terrain."""
import datetime as dt
import math,os,sys,json,time
from pathlib import Path
import spiceypy as spice
import numpy as np
from navigator_worker import emit,key,save,cache_save,cache_read,peak_memory_bytes
from setup_navigator_terrain import digest
from prepare_spice import observe
R=1737400.0

def validate(request):
    values=[float(request[k]) for k in ['longitude','latitude','duration','delay','height']]
    lon,lat,duration,delay,height=values
    if not all(math.isfinite(v) for v in values) or not -90<=lat<=90 or not 1<=duration<=744 or not 0<=delay<=72 or height not in [2,5,10]:raise ValueError('Unsupported global reference settings')
    if duration*6!=round(duration*6) or delay*6!=round(delay*6):raise ValueError('Use a ten-minute time grid')
    start=dt.datetime.fromisoformat(request['startUTC'].replace('Z','+00:00'))
    if start.tzinfo is None or start.utcoffset()!=dt.timedelta(0) or start.year!=2027 or start.minute%10 or start.second or start.microsecond:raise ValueError('Choose a 2027 UTC arrival on the ten-minute grid')
    lon=((lon+180)%360)-180
    if abs(lat)==90:lon=0
    return lon,lat,start,duration,delay,height

def sphere_profile(height):
    limb=sphere_limb(height,R)
    depression=limb['elevationDeg']
    distance=limb['lineOfSightM']
    return [dict(az=i*.25,el=depression,distanceM=distance,coverageM=distance,source='analytic-reference-sphere') for i in range(1440)]

def display_patch():
    # Local east/north tangent coordinates in metres; z is sphere curvature, not measured terrain.
    axis=[-2500+i*100 for i in range(51)]
    return dict(frame='local-reference-sphere',x=axis,y=list(reversed(axis)),z=[[math.sqrt(R*R-x*x-y*y)-R for x in axis] for y in reversed(axis)],width=51,height=51,pixelM=100)

def run(request):
    began=time.perf_counter();lon,lat,start,duration,delay,height=validate(request)
    cadence=request.get('stepMinutes',10)
    if cadence not in [1,10]:raise ValueError('Observation cadence must be 1 or 10 minutes')
    store=Path(os.environ['MOON_PARK_STORE']);store.mkdir(parents=True,exist_ok=True)
    path=Path('data/raw/kernels/manifest.json')
    if not path.exists():raise ValueError('SPICE kernels missing. Run python scripts/fetch_kernels.py. Terrain downloads are unnecessary for reference-sphere screening.')
    kernels=json.loads(path.read_text())
    emit('Checking reference-sphere kernel identities')
    for kernel in kernels:
        if digest(Path(kernel['path']))!=kernel['sha256']:raise ValueError('Kernel checksum changed')
        spice.furnsh(kernel['path'])
    context=dict(analysisModel='reference-sphere',longitude=lon,latitude=lat,referenceRadiusM=R,groundM=0,frame='MOON_ME_DE421 reference coordinates; observations use Horizons MEAN_ME',kernels=kernels,method={p:digest(Path('scripts')/p) for p in ['reference_sphere_worker.py','navigator_worker.py','prepare_spice.py','horizons_observer.py','airless_horizon.py']},runtime=dict(python=sys.version,numpy=np.__version__,spiceypy=spice.__version__,spice=spice.tkvrsn('TOOLKIT')))
    end=start+dt.timedelta(hours=delay+72+duration+1/6)
    times=[(start+dt.timedelta(minutes=cadence*i)).isoformat().replace('+00:00','Z') for i in range(int((end-start).total_seconds()/(cadence*60))+1)]
    observation_context=dict(provider='JPL Horizons',context=context,startUTC=times[0],endUTC=times[-1])
    observations,sources=horizons_observations(lon,lat,0,times,store,emit);hit=all(p.get('cacheHit',False) for by_height in sources.values() for p in by_height.values())
    identity=key(context)
    site=dict(id='reference-'+identity[:16],analysisModel='reference-sphere',name=f'{lat:.6f} N, {lon:.6f} E — reference sphere',latitude=lat,longitude=lon,groundM=0,profiles={str(h):sphere_profile(h) for h in [2,5,10]},ephemeridesByHeight=observations,ephemerides=observations['2'],observationStepMinutes=cadence,display=display_patch(),provenance=dict(sha256=identity,analysisModel='reference-sphere',referenceRadiusM=R,groundResolutionM=None,regional=False,sources=[],scope='Analytic lunar sphere with observer height above radius; no measured ground elevation, mountains, craters or terrain shadows.'),ephemerisProvenance=sources['2'],ephemerisProvenanceByHeight=sources)
    result=dict(schemaVersion=1,site=site,context=context,observationContext=observation_context,performance=dict(seconds=time.perf_counter()-began,peakWorkingSetBytes=peak_memory_bytes(),horizonCacheHit=False,observationCacheHit=hit),scope='Global 2027 reference-sphere screening. No local terrain, actual power, RF link, eclipses or landing-safety assessment.')
    output=key(result);save(store/(output+'.result.json'),result);spice.kclear();emit('complete',resultId=output,performance=result['performance'])

if __name__=='__main__':
    try:run(json.load(sys.stdin))
    except Exception as error:emit('failed',error=str(error));sys.exit(1)
