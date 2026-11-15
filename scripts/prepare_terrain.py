"""Acquire published terrain and compute bounded, curvature-aware ray horizons."""
import hashlib
import json
import math
from pathlib import Path
from urllib.request import urlopen
import numpy as np
import rasterio
from rasterio.enums import Resampling
from pyproj import CRS, Transformer

R = 1737400.0
RAW = Path('data/raw'); RAW.mkdir(exist_ok=True, parents=True)
OUT = Path('data'); OUT.mkdir(exist_ok=True)

from airless_horizon import ray_angle

def build():
    products=[]
    for code, name in [('Site01','Connecting ridge'),('Site04','Shackleton rim'),('Site11','de Gerlache rim')]:
        url=f'https://pgda.gsfc.nasa.gov/data/LOLA_5mpp/{code}/{code}_final_adj_5mpp_surf.tif'
        path=RAW/f'{code}.tif'
        if not path.exists():
            with urlopen(url,timeout=60) as response: path.write_bytes(response.read())
        with rasterio.open(path) as ds:
            print(code,ds.shape,ds.crs,ds.bounds,ds.nodata,flush=True)
            # Retain original 5 m pixels for point selection; use a 20 m analysis grid.
            factor=4
            z=ds.read(1,out_shape=(math.ceil(ds.height/factor),math.ceil(ds.width/factor)),resampling=Resampling.bilinear,masked=True)
            transform=ds.transform*ds.transform.scale(ds.width/z.shape[1],ds.height/z.shape[0])
            good=~np.ma.getmaskarray(z)&np.isfinite(z.data)
            rr,cc=np.indices(z.shape)
            center=(np.abs(rr-z.shape[0]/2)<50)&(np.abs(cc-z.shape[1]/2)<50)&good
            row,col=np.unravel_index(np.argmax(np.where(center,z.data,-np.inf)),z.shape)
            x,y=transform*(col+.5,row+.5)
            lunar=CRS.from_proj4(f'+proj=longlat +R={R} +no_defs')
            inverse=Transformer.from_crs(ds.crs,lunar,always_xy=True)
            forward=Transformer.from_crs(lunar,ds.crs,always_xy=True)
            lon,lat=inverse.transform(x,y); ground=float(z[row,col])
            profiles={}
            distances=np.arange(20,12001,20,dtype=float)
            az=np.arange(360,dtype=float)
            a=np.radians(az[:,None]); delta=distances[None,:]/R
            phi,lam=np.radians(lat),np.radians(lon)
            ph2=np.arcsin(np.sin(phi)*np.cos(delta)+np.cos(phi)*np.sin(delta)*np.cos(a))
            la2=lam+np.arctan2(np.sin(a)*np.sin(delta)*np.cos(phi),np.cos(delta)-np.sin(phi)*np.sin(ph2))
            xx,yy=forward.transform(np.degrees(la2),np.degrees(ph2))
            cols,rows=(~transform)*(xx,yy)
            ri=np.floor(rows).astype(int);ci=np.floor(cols).astype(int)
            inside=(ri>=0)&(ri<z.shape[0])&(ci>=0)&(ci<z.shape[1])
            ri=np.clip(ri,0,z.shape[0]-1);ci=np.clip(ci,0,z.shape[1]-1)
            valid=inside&good[ri,ci]
            terrain=z.data[ri,ci]
            for height in [2,5,10]:
                angles=np.where(valid,ray_angle(distances[None,:],terrain,ground,height),-np.inf)
                indices=np.argmax(angles,axis=1)
                profile=[]
                for i,idx in enumerate(indices):
                    first_bad=np.flatnonzero(~valid[i])
                    coverage=float(distances[first_bad[0]-1]) if len(first_bad) and first_bad[0]>0 else (0 if len(first_bad) else 12000)
                    profile.append(dict(az=i,el=float(angles[i,idx]) if np.isfinite(angles[i,idx]) else None,distanceM=float(distances[idx]),coverageM=coverage,blocker=[float(xx[i,idx]),float(yy[i,idx])]))
                profiles[str(height)]=profile
            preview=z[::max(1,z.shape[0]//100),::max(1,z.shape[1]//100)]
            products.append(dict(id=code,name=name+' · research point',longitude=lon,latitude=lat,groundM=ground,xy=[x,y],profiles=profiles,
                terrainPreview=dict(width=preview.shape[1],height=preview.shape[0],values=preview.filled(np.nan).tolist()),
                provenance=dict(url=url,sha256=hashlib.sha256(path.read_bytes()).hexdigest(),crs=ds.crs.to_wkt(),nativePixelM=5,analysisPixelM=20,rayStepM=20,azimuthStepDeg=1,maxRadiusM=12000,referenceRadiusM=R,frame='MOON_ME / DE421 per PGDA README',bounds=list(ds.bounds),selection='Highest 20 m analysis pixel in central 2 km square; not a certified landing site',coverage='Local DEM only; terrain outside extent and beyond 12 km unmodeled')))
            print(f'{name}: {lat:.6f}, {lon:.6f}, ground {ground:.2f} m',flush=True)
    # GeoTIFF nodata is masked; JSON must contain no non-finite values.
    text=json.dumps(products,allow_nan=True).replace('NaN','null')
    (OUT/'terrain.json').write_text(text,encoding='utf-8')

if __name__=='__main__': build()
