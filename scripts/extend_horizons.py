"""Multi-resolution lunar horizons with explicit finite-radius coverage."""
import hashlib
import json
from pathlib import Path
import numpy as np
import rasterio
from pyproj import CRS,Transformer
from prepare_terrain import R,ray_angle
from fetch_regional import acquire

def bilinear(data,transform,x,y):
    """Interpolate between pixel centers; reject any missing support cell."""
    col,row=(~transform)*(x,y);col=col-.5;row=row-.5
    c=np.floor(col).astype(int);r=np.floor(row).astype(int)
    inside=(c>=0)&(r>=0)&(c+1<data.shape[1])&(r+1<data.shape[0])
    c=np.clip(c,0,data.shape[1]-2);r=np.clip(r,0,data.shape[0]-2)
    dx=col-c;dy=row-r
    a,b,d,e=data[r,c],data[r,c+1],data[r+1,c],data[r+1,c+1]
    valid=inside&np.isfinite(a)&np.isfinite(b)&np.isfinite(d)&np.isfinite(e)
    z=(1-dy)*((1-dx)*a+dx*b)+dy*((1-dx)*d+dx*e)
    return z,valid

def destinations(lon,lat,az,distances):
    a=np.radians(az[:,None]);delta=distances[None,:]/R
    phi,lam=np.radians(lat),np.radians(lon)
    p=np.arcsin(np.sin(phi)*np.cos(delta)+np.cos(phi)*np.sin(delta)*np.cos(a))
    l=lam+np.arctan2(np.sin(a)*np.sin(delta)*np.cos(phi),np.cos(delta)-np.sin(phi)*np.sin(p))
    return np.degrees(l),np.degrees(p)

def build():
    region_path=acquire()
    products=json.loads(Path('data/terrain.json').read_text(encoding='utf-8'))
    region_manifest=json.loads(region_path.with_suffix('.manifest.json').read_text())
    with rasterio.open(region_path) as region:
        regional=region.read(1,masked=True).filled(np.nan)
        for site in products:
            with rasterio.open(f'data/raw/{site["id"]}.tif') as local:
                terrain=local.read(1,masked=True).filled(np.nan)
                lunar=CRS.from_proj4(f'+proj=longlat +R={R} +no_defs')
                forward=Transformer.from_crs(lunar,local.crs,always_xy=True)
                region_forward=Transformer.from_crs(lunar,region.crs,always_xy=True)
                ground,valid=bilinear(terrain,local.transform,*site['xy'])
                if not valid:raise ValueError('Research point lacks native terrain support')
                site['previousGroundM']=site['groundM'];site['groundM']=float(ground)
                profiles={str(h):[] for h in [2,5,10]}
                local_profiles={str(h):[] for h in [2,5,10]}
                distances=np.concatenate([np.arange(5,205,5),np.arange(220,12001,20),np.arange(12120,180001,120)])
                all_az=np.arange(0,360,.25)
                for first in range(0,len(all_az),120):
                    az=all_az[first:first+120]
                    lon,lat=destinations(site['longitude'],site['latitude'],az,distances)
                    x,y=forward.transform(lon,lat);rx,ry=region_forward.transform(lon,lat)
                    near,nvalid=bilinear(terrain,local.transform,x,y)
                    far,fvalid=bilinear(regional,region.transform,rx,ry)
                    sampled=np.where(nvalid,near,far);valid=nvalid|fvalid
                    for height in [2,5,10]:
                        angles=np.where(valid,ray_angle(distances[None,:],sampled,float(ground),height),-np.inf)
                        old=np.where(nvalid&(distances[None,:]<=12000),ray_angle(distances[None,:],near,float(ground),height),-np.inf)
                        for j,angle in enumerate(az):
                            idx=int(np.argmax(angles[j]));old_idx=int(np.argmax(old[j]))
                            bad=np.flatnonzero(~valid[j]);coverage=float(distances[bad[0]-1]) if len(bad) and bad[0] else (0 if len(bad) else 180000)
                            near_bad=np.flatnonzero(~nvalid[j]);near_coverage=float(distances[near_bad[0]-1]) if len(near_bad) and near_bad[0] else (0 if len(near_bad) else 180000)
                            profiles[str(height)].append(dict(az=float(angle),el=float(angles[j,idx]),distanceM=float(distances[idx]),coverageM=coverage,nearCoverageM=near_coverage,source='local-5m' if nvalid[j,idx] else 'regional-240m',blocker=[float(x[j,idx]),float(y[j,idx])]))
                            local_profiles[str(height)].append(dict(az=float(angle),el=float(old[j,old_idx]),distanceM=float(distances[old_idx]),coverageM=min(12000,near_coverage)))
                site['profiles']=profiles;site['localProfiles']=local_profiles
                site['provenance'].update(analysisPixelM=5,rayStepM='5 m to 200 m; 20 m to 12 km; 120 m farther',azimuthStepDeg=.25,maxRadiusM=180000,coverage='Finite regional coverage to 180 km; beyond-radius terrain and sub-grid relief remain unmodeled',groundMethod='Bilinear native 5 m terrain at unchanged research-point coordinates',regional=region_manifest)
                print(site['id'],'ground correction',float(ground)-site['previousGroundM'],'minimum coverage',min(p['coverageM'] for p in profiles['2']),flush=True)
    Path('data/terrain-regional.json').write_text(json.dumps(products,allow_nan=False,separators=(',',':')),encoding='utf-8')

if __name__=='__main__':build()
