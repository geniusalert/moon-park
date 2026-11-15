"""Offline-only image crop: mask every source strip not completely cached."""
import hashlib,json,math,tempfile
from pathlib import Path
import numpy as np
import rasterio
from rasterio.windows import Window,bounds
from rasterio.enums import ColorInterp
from rasterio.transform import array_bounds
from pyproj import CRS,Transformer
import tifffile
from prepare_context_imagery import RemoteTIFF,PRODUCTS,PDS,sha

class OfflineTIFF(RemoteTIFF):
    def receive(self,*args):raise RuntimeError('Offline extraction forbids new network requests')

def build():
    product=PRODUCTS[1];remote=OfflineTIFF(PDS+'EXTRAS/BROWSE/'+product['path'])
    for path in remote.root.glob('*.bin'):remote.block(int(path.stem.split('-')[0])//remote.block_size)
    m=json.loads(Path('data/candidates.json').read_text());point=next(g['points'][0] for g in m['regions'] if g['regionId']=='Site11-roi-1')
    with tifffile.TiffFile(remote) as tif:
        page=tif.pages[0]
        if page.is_tiled or page.samplesperpixel!=1 or page.dtype!=np.uint8:raise ValueError('Expected native one-band, striped 8-bit source')
        for tag in page.tags.values():_=tag.value
        with tempfile.NamedTemporaryFile(suffix='.tif',delete=False) as f:temporary=Path(f.name)
        try:
            remote.materialize(temporary)
            with rasterio.open(temporary) as ds:
                forward=Transformer.from_crs(CRS.from_proj4('+proj=longlat +R=1737400 +no_defs'),ds.crs,always_xy=True);x,y=forward.transform(point['longitude'],point['latitude']);w=ds.window(x-1000,y-1000,x+1000,y+1000)
                window=Window(math.floor(w.col_off),math.floor(w.row_off),math.ceil(w.col_off+w.width)-math.floor(w.col_off),math.ceil(w.row_off+w.height)-math.floor(w.row_off));overlap=window.intersection(Window(0,0,ds.width,ds.height))
                crs=ds.crs;transform=ds.window_transform(window);nodata=ds.nodata;resolution=list(ds.res);source_bounds=list(ds.bounds);source_shape=list(ds.shape)
            runs=[];complete=0;missing=0
            for i in range(int(overlap.row_off)//page.rowsperstrip,math.ceil((overlap.row_off+overlap.height)/page.rowsperstrip)):
                a=page.dataoffsets[i];b=a+page.databytecounts[i]-1;present=all(k in remote.blocks for k in range(a//remote.block_size,b//remote.block_size+1))
                if not present:missing+=1;continue
                complete+=1;r0=max(int(overlap.row_off),i*page.rowsperstrip);r1=min(int(overlap.row_off+overlap.height),(i+1)*page.rowsperstrip)
                if runs and r0==runs[-1][1]:runs[-1][1]=r1
                else:runs.append([r0,r1])
            if not complete:raise ValueError('No complete source strips in requested crop')
            image=np.zeros((int(window.height),int(window.width)),dtype='uint8');valid=np.zeros_like(image,dtype=bool);acquired=np.zeros_like(valid)
            with rasterio.open(temporary) as ds:
                for r0,r1 in runs:
                    c0=int(overlap.col_off);c1=int(overlap.col_off+overlap.width);data=ds.read(1,window=Window(c0,r0,c1-c0,r1-r0),masked=True)
                    rs=slice(r0-int(window.row_off),r1-int(window.row_off));cs=slice(c0-int(window.col_off),c1-int(window.col_off));image[rs,cs]=data.filled(0);valid[rs,cs]=~np.ma.getmaskarray(data);acquired[rs,cs]=True
            out=Path('data/imagery');tif_path=out/'de-gerlache-context-native.tif';png_path=out/'de-gerlache-context.png'
            with rasterio.Env(GDAL_TIFF_INTERNAL_MASK=True):
                with rasterio.open(tif_path,'w',driver='GTiff',width=image.shape[1],height=image.shape[0],count=1,dtype='uint8',crs=crs,transform=transform,compress='deflate') as ds:ds.write(image,1);ds.write_mask(valid.astype('uint8')*255)
            with rasterio.open(png_path,'w',driver='PNG',width=image.shape[1],height=image.shape[0],count=2,dtype='uint8') as ds:ds.write(image,1);ds.write(valid.astype('uint8')*255,2);ds.colorinterp=(ColorInterp.gray,ColorInterp.alpha)
            with rasterio.open(tif_path) as ds:
                check=ds.read(1,masked=True);assert np.array_equal(check.data,image) and np.array_equal(~np.ma.getmaskarray(check),valid);row,col=ds.index(x,y)
            record=dict(schemaVersion=1,productId=product['productId'],kind=product['kind'],productPage='https://data.lroc.im-ldi.com/lroc/view_rdr_product/'+product['productId'],groupPage='https://data.lroc.im-ldi.com/lroc/view_rdr/'+product['groupId'],source=dict(url=remote.url,fullFileBytes=remote.total,fullFileSha256=None,identityETag=remote.stamp,acquisition='Offline extraction of completely retained native TIFF strips only; missing strips explicitly masked, no new requests after rate limit',retainedUniqueBytes=sum(len(b) for b in remote.blocks.values()),retainedRanges=[dict(start=i*remote.block_size,end=i*remote.block_size+len(b)-1,sha256=sha(b)) for i,b in sorted(remote.blocks.items())]),sourceStatus=dict(httpStatus=429,retryAfterSeconds=3600,newRequestsStopped=True),acquisitionIncomplete=True,acquisitionNote='Partially acquired context crop: unreceived native strips are transparent, not synthesized. NASA PDS requested a 3600-second retry delay; no further requests were made.',processingCodeSha256=sha(Path(__file__).read_bytes()),checks=dict(pointId=point['id'],longitude=point['longitude'],latitude=point['latitude'],nativeDtype='uint8',sourceShape=source_shape,sourceBounds=source_bounds,sourceNoData=nodata,shape=list(image.shape),resolutionM=resolution,crsWKT=crs.to_wkt(),boundsXYM=list(array_bounds(image.shape[0],image.shape[1],transform)),sourceWindow=dict(col=window.col_off,row=window.row_off,width=window.width,height=window.height),validContextFraction=float(valid.mean()),acquiredPixelFraction=float(acquired.mean()),completeNativeStrips=complete,missingNativeStrips=missing,anchorPixelValid=bool(valid[row,col]),anchorPixelAcquired=bool(acquired[row,col]),anchorDN=int(image[row,col]) if valid[row,col] else None,nativePixelRoundTripEqual=True,missingStripsMasked=True),preview=dict(method='Original 8-bit values; unacquired strips and source nodata transparent'),registration=product['registration'],scope='Historical, partially acquired context only; source lighting differs from mission replay. No image-to-mission-DEM registration measurement or gap filling.',derivedAssets={p.name:dict(path=p.as_posix(),sha256=sha(p.read_bytes()),bytes=p.stat().st_size) for p in [tif_path,png_path]})
            (out/'de-gerlache-context.source.json').write_text(json.dumps(record,indent=2)+'\n');print(json.dumps(record['checks'],indent=2))
        finally:temporary.unlink(missing_ok=True)

if __name__=='__main__':build()
