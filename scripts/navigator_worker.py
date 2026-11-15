from airless_horizon import AZIMUTH_STEP_DEG,ray_distances,profile_row,model_metadata,MODEL_VERSION
from horizons_observer import observations as horizons_observations
"""One exact-coordinate polar analysis, with separate horizon/observation caches."""
import datetime as dt
import hashlib,json,os,sys,time
from pathlib import Path
import numpy as np
import rasterio
from rasterio.windows import Window,from_bounds
from pyproj import CRS,Transformer
import spiceypy as spice
from extend_horizons import bilinear
from prepare_terrain import R,ray_angle
from prepare_spice import observe,basis
from setup_navigator_terrain import digest

def emit(stage,**kw):print(json.dumps(dict(stage=stage,**kw)),flush=True)
def encode(v):return json.dumps(v,allow_nan=False,separators=(',',':')).encode()
def key(v):return hashlib.sha256(encode(v)).hexdigest()
def save(p,v):
    tmp=p.with_suffix('.part');tmp.write_bytes(encode(v));tmp.replace(p)
def cache_save(p,v):save(p,dict(sha256=key(v),payload=v))
def cache_read(p):
    envelope=json.loads(p.read_text());payload=envelope['payload']
    if key(payload)!=envelope['sha256']:raise ValueError('Cached evidence checksum mismatch; remove the affected cache and retry')
    return payload
def destinations(lon,lat,az,distances):
    north,east,up=basis(lon,lat);a=np.radians(az);delta=distances/R
    tangent=np.cos(a)[:,None]*north+np.sin(a)[:,None]*east
    xyz=np.cos(delta)[None,:,None]*up+np.sin(delta)[None,:,None]*tangent[:,None,:]
    return np.degrees(np.arctan2(xyz[:,:,1],xyz[:,:,0])),np.degrees(np.arctan2(xyz[:,:,2],np.hypot(xyz[:,:,0],xyz[:,:,1])))
def validate(request):
    lon=float(request['longitude']);lat=float(request['latitude']);duration=float(request['duration']);delay=float(request['delay']);height=float(request['height'])
    if not all(np.isfinite(v) for v in [lon,lat,duration,delay]) or not -90<=lat<=-85 or not 1<=duration<=744 or not 0<=delay<=72 or height not in [2,5,10]:raise ValueError('Unsupported coordinates or mission settings')
    if duration*6!=round(duration*6) or delay*6!=round(delay*6):raise ValueError('Use a ten-minute time grid')
    start=dt.datetime.fromisoformat(request['startUTC'].replace('Z','+00:00'))
    if start.tzinfo is None or start.utcoffset()!=dt.timedelta(0) or start.year!=2027 or start.minute%10 or start.second or start.microsecond:raise ValueError('Choose a UTC arrival in 2027 on a ten-minute grid')
    lon=((lon+180)%360)-180
    if lat==-90:lon=0
    return lon,lat,start,duration,delay,height
def peak_memory_bytes():
    if os.name=='nt':
        import ctypes
        from ctypes import wintypes
        class Counters(ctypes.Structure):
            _fields_=[('cb',wintypes.DWORD),('PageFaultCount',wintypes.DWORD)]+[(n,ctypes.c_size_t) for n in ['PeakWorkingSetSize','WorkingSetSize','QuotaPeakPagedPoolUsage','QuotaPagedPoolUsage','QuotaPeakNonPagedPoolUsage','QuotaNonPagedPoolUsage','PagefileUsage','PeakPagefileUsage']]
        c=Counters();c.cb=ctypes.sizeof(c);handle=ctypes.windll.kernel32.GetCurrentProcess
        handle.restype=wintypes.HANDLE
        memory_info=ctypes.windll.psapi.GetProcessMemoryInfo
        memory_info.argtypes=[wintypes.HANDLE,ctypes.c_void_p,wintypes.DWORD]
        if memory_info(handle(),ctypes.byref(c),c.cb):return c.PeakWorkingSetSize
        return None
    import resource
    return resource.getrusage(resource.RUSAGE_SELF).ru_maxrss*(1 if sys.platform=='darwin' else 1024)
def run(request):
    began=time.perf_counter();lon,lat,start,duration,delay,height=validate(request)
    terrain_error=float(request.get('terrainElevationOffsetM',0))
    if not np.isfinite(terrain_error) or abs(terrain_error)>100:raise ValueError('Terrain elevation stress must be within 100 metres')
    cadence=request.get('stepMinutes',10)
    if cadence not in [1,10]:raise ValueError('Observation cadence must be 1 or 10 minutes')
    store=Path(os.environ['MOON_PARK_STORE']);store.mkdir(parents=True,exist_ok=True)
    catalogue_path=Path('data/raw/navigator/catalog.json')
    if not catalogue_path.exists():raise ValueError('Polar terrain is not installed. Run python scripts/setup_navigator_terrain.py first.')
    catalogue=json.loads(catalogue_path.read_text());records=catalogue['sources'][:]
    base=json.loads(Path('data/mission-data.json').read_text(encoding='utf-8'))
    for s in base['sites']:
        p=Path(f'data/raw/{s["id"]}.tif')
        if p.exists():records.append(dict(id=s['id'],path=p.as_posix(),sha256=s['provenance']['sha256'],pixelM=5,url=s['provenance'].get('url')))
    emit('Checking terrain and kernel identities')
    for record in records:
        if digest(Path(record['path']))!=record['sha256']:raise ValueError('Terrain checksum changed: '+record['id'])
    kernel_path=Path('data/raw/kernels/manifest.json')
    if not kernel_path.exists():raise ValueError('Kernels missing. Run python scripts/fetch_kernels.py first.')
    kernels=json.loads(kernel_path.read_text())
    for kernel in kernels:
        if digest(Path(kernel['path']))!=kernel['sha256']:raise ValueError('Kernel checksum changed')
        spice.furnsh(kernel['path'])
    method={p:digest(Path('scripts')/p) for p in ['navigator_worker.py','extend_horizons.py','prepare_terrain.py','prepare_spice.py','horizons_observer.py','airless_horizon.py']}
    context=dict(runtime=dict(python=sys.version,numpy=np.__version__,rasterio=rasterio.__version__,spice=spice.tkvrsn('TOOLKIT')),longitude=lon,latitude=lat,sources=records,method=method,frame='MOON_ME_DE421',radiusM=180000,azimuthStepDeg=AZIMUTH_STEP_DEG,horizonModelVersion=MODEL_VERSION,terrainElevationOffsetM=terrain_error)
    horizon_id=key(context);hp=store/(horizon_id+'.horizon.json');hit=hp.exists()
    if hit:
        horizon=cache_read(hp);assert horizon['context']==context
    else:
        emit('Calculating coordinate-specific terrain horizon')
        layers=[];lunar=CRS.from_proj4('+proj=longlat +R=1737400 +no_defs')
        for record in sorted(records,key=lambda r:r['pixelM'],reverse=True):
            with rasterio.open(record['path']) as ds:
                forward=Transformer.from_crs(lunar,ds.crs,always_xy=True);x,y=forward.transform(lon,lat)
                expected=CRS.from_proj4('+proj=stere +lat_0=-90 +lat_ts=-90 +lon_0=0 +R=1737400 +units=m +no_defs')
                crs=CRS.from_user_input(ds.crs)
                reference=Transformer.from_crs(lunar,expected,always_xy=True)
                probes=([0,90,180,-90],[-86,-87,-88,-89])
                if abs(crs.ellipsoid.semi_major_metre-R)>1e-6 or not np.allclose(forward.transform(*probes),reference.transform(*probes),atol=1e-5,rtol=0):raise ValueError('Terrain projection/frame convention mismatch')
                radius=190000 if record['pixelM']==240 else 14000
                wanted=from_bounds(x-radius,y-radius,x+radius,y+radius,ds.transform).round_offsets().round_lengths()
                try:window=Window(0,0,ds.width,ds.height) if record['pixelM']==5 else wanted.intersection(Window(0,0,ds.width,ds.height))
                except rasterio.errors.WindowError:continue
                if window.width<2 or window.height<2:continue
                data=ds.read(1,window=window,masked=True).astype('float64').filled(np.nan)
                layers.append((record,data,ds.window_transform(window),forward))
        def sample(lons,lats,near_only=False,distances=None):
            values=np.full(np.shape(lons),np.nan);resolution=np.zeros(np.shape(lons),dtype=int);xx=yy=None
            for record,data,tr,forward in layers:
                if near_only and record['pixelM']==240:continue
                x,y=forward.transform(lons,lats);z,valid=bilinear(data,tr,x,y)
                if distances is not None:
                    if record['pixelM']==240:valid=valid&(distances[None,:]>12000)
                    if record['pixelM']==20:valid=valid&(distances[None,:]<=12000)
                values=np.where(valid,z,values);resolution=np.where(valid,record['pixelM'],resolution);xx,yy=x,y
            return values,resolution,xx,yy
        ground,ground_res,x,y=sample(np.array(lon),np.array(lat),True)
        if not np.isfinite(ground):raise ValueError('No valid near-field terrain at the requested coordinate')
        profiles={str(h):[] for h in [2,5,10]};distances=ray_distances()
        ray_count=round(360/AZIMUTH_STEP_DEG)
        for first in range(0,ray_count,60):
            az=np.arange(first,min(first+60,ray_count))*AZIMUTH_STEP_DEG;lo,la=destinations(lon,lat,az,distances);z,res,px,py=sample(lo,la,distances=distances)
            if not np.all(np.isfinite(z)):raise ValueError('Incomplete terrain support along the 180 km horizon; result unavailable')
            for h in [2,5,10]:
                for j,a in enumerate(az):profiles[str(h)].append(profile_row(a,distances,z[j]+terrain_error,float(ground),h,res[j],px[j],py[j]))
            emit('Calculating airless terrain horizon',progress=min(first+60,ray_count)/ray_count)
        # A small display mesh is separate from the native calculation resolution.
        projection=layers[0][3];inverse=Transformer.from_crs(projection.target_crs,lunar,always_xy=True);cx,cy=projection.transform(lon,lat)
        xs=np.linspace(cx-2500,cx+2500,101);ys=np.linspace(cy+2500,cy-2500,101);gx,gy=np.meshgrid(xs,ys);lo,la=inverse.transform(gx,gy);mesh,_,_,_=sample(lo,la,near_only=True)
        if not np.all(np.isfinite(mesh)):raise ValueError('Display terrain incomplete')
        horizon=dict(context=context,horizonModel=model_metadata(profiles,float(ground)),profiles=profiles,groundM=float(ground),groundResolutionM=int(ground_res),xy=[cx,cy],display=dict(x=xs.tolist(),y=ys.tolist(),z=mesh.tolist(),width=101,height=101,pixelM=50,source='NASA LOLA measured elevation',verticalExaggeration=1))
        # Native-detail landing display is separate from the horizon calculation.
        spacing=5 if int(ground_res)==5 else 20
        count=int(1200/spacing)+1
        lx=np.linspace(cx-600,cx+600,count);ly=np.linspace(cy+600,cy-600,count)
        xx,yy=np.meshgrid(lx,ly);llo,lla=inverse.transform(xx,yy)
        detail,resolutions,_,_=sample(llo,lla,near_only=True)
        if np.all(np.isfinite(detail)):
            unique,counts=np.unique(resolutions,return_counts=True)
            horizon['landingDisplay']=dict(x=lx.tolist(),y=ly.tolist(),z=detail.tolist(),width=count,height=count,pixelM=spacing,source='NASA LOLA adjusted measured elevation',frame='MOON_ME_DE421 south polar stereographic',verticalExaggeration=1,sourceResolutionCounts={str(int(a)):int(b) for a,b in zip(unique,counts)},scope='Native-detail display grid; interpolation does not improve native source resolution; not a landing hazard model')
        cache_save(hp,horizon)
    end=start+dt.timedelta(hours=delay+72+duration+1/6)
    # Includes one guard sample past every possible mission endpoint.
    times=[(start+dt.timedelta(minutes=cadence*i)).isoformat().replace('+00:00','Z') for i in range(int((end-start).total_seconds()/(cadence*60))+1)]
    observation_context=dict(provider='JPL Horizons',horizon=horizon_id,start=times[0],end=times[-1])
    series,sources=horizons_observations(lon,lat,horizon['groundM'],times,store,emit)
    observations=dict(series=series);observation_hit=all(p.get('cacheHit',False) for by_height in sources.values() for p in by_height.values())
    site=dict(id='custom-'+horizon_id[:16],name=f'{abs(lat):.5f}° S, {lon:.5f}° E',longitude=lon,latitude=lat,groundM=horizon['groundM'],xy=horizon['xy'],profiles=horizon['profiles'],horizonModel=horizon['horizonModel'],ephemeridesByHeight=observations['series'],ephemerides=observations['series']['2'],observationStepMinutes=cadence,display=horizon['display'],landingDisplay=horizon.get('landingDisplay'),provenance=dict(sha256=horizon_id,sources=records,regional=True,groundResolutionM=horizon['groundResolutionM'],instrument='Lunar Orbiter Laser Altimeter (LOLA)',frame='MOON_ME_DE421',refraction='none',scope='Measured LOLA terrain; exact spherical airless rays and finite 180 km coverage. See horizonModel diagnostics and conditional remote envelope.'),ephemerisProvenance=sources['2'],ephemerisProvenanceByHeight=sources)
    result=dict(schemaVersion=1,site=site,context=context,observationContext=observation_context,performance=dict(seconds=time.perf_counter()-began,peakWorkingSetBytes=peak_memory_bytes(),horizonCacheHit=hit,observationCacheHit=observation_hit),scope='85–90 S, 2027 nominal visibility; exact pole uses longitude zero as azimuth reference.')
    output_id=key(result);save(store/(output_id+'.result.json'),result);spice.kclear();emit('complete',resultId=output_id,performance=result['performance'])
if __name__=='__main__':
    try:run(json.load(sys.stdin))
    except Exception as error:emit('failed',error=str(error));sys.exit(1)
