"""Prepare common-grid visual inspection assets; does not estimate registration."""
import hashlib,json,math
from pathlib import Path
import numpy as np
import rasterio
from rasterio.transform import from_bounds,array_bounds
from rasterio.warp import reproject,Resampling
from rasterio.enums import ColorInterp
from pyproj import CRS,Transformer

def sha(raw):return hashlib.sha256(raw).hexdigest()
def build():
    path=Path('data/mission-data.json');base=json.loads(path.read_text(encoding='utf-8'))
    catalog=json.loads(Path(base['imagery']['url'][1:]).read_text(encoding='utf-8'));out=Path('data/registration');out.mkdir(exist_ok=True)
    entries=[]
    for entry in catalog['entries']:
        site=next(s for s in base['sites'] if s['id']==entry['sourceSiteId']);dem_path=Path('data/raw')/(site['id']+'.tif')
        if sha(dem_path.read_bytes())!=site['provenance']['sha256']:raise ValueError('DEM identity mismatch')
        image_path=Path(entry['native']['url'][1:])
        if sha(image_path.read_bytes())!=entry['native']['sha256']:raise ValueError('Image identity mismatch')
        with rasterio.open(image_path) as image,rasterio.open(dem_path) as dem:
            # The native DEM is 5 m: a 400-ish cell grid avoids fictitious 1 m detail.
            width=math.ceil((image.bounds.right-image.bounds.left)/5);height=math.ceil((image.bounds.top-image.bounds.bottom)/5)
            transform=from_bounds(*image.bounds,width,height);shape=(height,width)
            photo=np.full(shape,np.nan,dtype='float32');elevation=np.full(shape,np.nan,dtype='float32')
            raw=image.read(1,masked=True).astype('float32').filled(np.nan)
            reproject(raw,photo,src_transform=image.transform,src_crs=image.crs,src_nodata=np.nan,dst_transform=transform,dst_crs=image.crs,dst_nodata=np.nan,resampling=Resampling.average)
            reproject(rasterio.band(dem,1),elevation,src_nodata=dem.nodata,dst_transform=transform,dst_crs=image.crs,dst_nodata=np.nan,resampling=Resampling.bilinear)
            finite=np.isfinite(elevation);filled=np.where(finite,elevation,0);dy,dx=np.gradient(filled,abs(transform.e),transform.a);north=-dy
            normal=np.sqrt(1+dx*dx+north*north)
            terrain_valid=finite.copy()
            for axis in [0,1]:terrain_valid &= np.roll(finite,1,axis)&np.roll(finite,-1,axis)
            terrain_valid[[0,-1],:]=False;terrain_valid[:,[0,-1]]=False
            masks=dict(image=np.isfinite(photo),terrain=terrain_valid);assets={}
            def png(name,values,valid):
                p=out/f'{site["id"]}-{name}.png';pixels=np.clip(np.nan_to_num(values,nan=0),0,255).astype('uint8')
                with rasterio.open(p,'w',driver='PNG',width=width,height=height,count=2,dtype='uint8') as ds:
                    ds.write(pixels,1);ds.write(valid.astype('uint8')*255,2);ds.colorinterp=(ColorInterp.gray,ColorInterp.alpha)
                assets[name]=dict(url='/'+p.as_posix(),sha256=sha(p.read_bytes()))
            png('image',photo,masks['image'])
            for az in [45,135,225,315]:
                azr=math.radians(az);alt=math.radians(30)
                light=np.maximum(0,(-dx*math.sin(azr)*math.cos(alt)-north*math.cos(azr)*math.cos(alt)+math.sin(alt))/normal)
                png('shade'+str(az),light*255,terrain_valid)
            png('slope',np.degrees(np.arctan(np.hypot(dx,north)))/45*255,terrain_valid)
            # Measure only numerical CRS round-trip closure, never ground registration.
            forward=Transformer.from_crs(image.crs,dem.crs,always_xy=True);back=Transformer.from_crs(dem.crs,image.crs,always_xy=True)
            residuals=[]
            for c,r in [(0,0),(width-1,0),(0,height-1),(width-1,height-1),(width//2,height//2)]:
                x,y=transform*(c+.5,r+.5);u,v=forward.transform(x,y);a,b=back.transform(u,v);residuals.append(math.hypot(a-x,b-y))
            entries.append(dict(siteId=site['id'],name=entry['name'],productId=entry['productId'],width=width,height=height,boundsXYM=list(array_bounds(height,width,transform)),pixelM=[transform.a,abs(transform.e)],crsWKT=image.crs.to_wkt(),assets=assets,masks={k:v.astype('uint8').ravel().tolist() for k,v in masks.items()},sourceImage=entry['native'],sourceMetadata=entry['metadata'],demSource=dict(sha256=site['provenance']['sha256'],url=site['provenance'].get('url')),acquisitionIncomplete=entry['acquisitionIncomplete'],imageValidFraction=float(masks['image'].mean()),terrainValidFraction=float(terrain_valid.mean()),projectionRoundTripMaxM=max(residuals),registrationStatus='unmeasured',acceptedLandmarks=0,scope='Common-grid inspection only. Photo averaged to approximately 5 m; DEM bilinearly sampled. Artificial 30-degree hillshades are shape aids, not source or mission illumination. Projection closure is not image-to-DEM registration.'))
            print(site['id'],shape,'projection closure m',max(residuals),flush=True)
    record=dict(schemaVersion=1,processingCodeSha256=sha(Path(__file__).read_bytes()),entries=entries,scope='Unregistered inspection assets; no shifts are applied to images or mission terrain.')
    raw=json.dumps(record,separators=(',',':'),allow_nan=False).encode();digest=sha(raw);artifact=out/f'catalog-{digest[:12]}.json';artifact.write_bytes(raw)
    base['registration']=dict(url='/'+artifact.as_posix(),sha256=digest,entryCount=3,scope=record['scope']);path.write_text(json.dumps(base,separators=(',',':'),allow_nan=False),encoding='utf-8')

if __name__=='__main__':build()
