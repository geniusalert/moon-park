"""Acquire bounded native polar terrain windows for navigator calculations.

GDAL HTTP range reads avoid acquiring the full 2.6 GB 20 m product.
The output manifest hashes derived bytes, not an undownloaded full source.
"""
import hashlib,json,math,io,time
from urllib.request import Request,urlopen
from urllib.error import HTTPError
from http.client import IncompleteRead,RemoteDisconnected
import tifffile
from concurrent.futures import ThreadPoolExecutor
from fetch_clones import selected_blocks
from pathlib import Path
import rasterio
from rasterio.windows import Window,from_bounds,bounds
from pyproj import CRS

ROOT=Path('data/raw/navigator');ROOT.mkdir(parents=True,exist_ok=True)
SOURCES=[('polar-20m',20,170000,'LDEM_80S_20MPP_ADJ.TIF'),('polar-240m',240,350000,'LDEM_60S_240MPP_ADJ.TIF')]
def digest(path):
    h=hashlib.sha256()
    with path.open('rb') as f:
        while block:=f.read(1048576):h.update(block)
    return h.hexdigest()
def main():
    records=[]
    for name,res,radius,filename in SOURCES:
        path=ROOT/(name+'.tif');meta=ROOT/(name+'.json')
        if path.exists() and meta.exists():
            record=json.loads(meta.read_text());assert digest(path)==record['sha256'];records.append(record);continue
        url='https://pgda.gsfc.nasa.gov/data/LOLA_20mpp/'+filename
        print('Acquiring',name,'bounded radius',radius,flush=True)
        cache=ROOT/(name+'-ranges');cache.mkdir(exist_ok=True)
        def fetch(a,b):
            chunk=cache/f'{a}-{b}.bin';receipt=chunk.with_suffix('.json');cooldown=cache/'cooldown.json'
            if cooldown.exists() and time.time()<json.loads(cooldown.read_text())['until']:raise RuntimeError('Source rate limit still active; cached blocks retained')
            if chunk.exists() and receipt.exists():
                m=json.loads(receipt.read_text());assert digest(chunk)==m['sha256'];return chunk.read_bytes(),m
            for attempt in range(3):
                try:
                    with urlopen(Request(url,headers={'Range':f'bytes={a}-{b}'}),timeout=60) as response:
                        if response.status!=206 or not response.headers.get('Content-Range','').startswith(f'bytes {a}-{b}/'):raise ValueError('Unexpected source range response')
                        raw=response.read();total=int(response.headers['Content-Range'].split('/')[1]);stamp=response.headers.get('ETag',response.headers.get('Last-Modified'))
                    if len(raw)!=b-a+1:raise IOError('Truncated range')
                    m=dict(total=total,stamp=stamp,sha256=hashlib.sha256(raw).hexdigest());chunk.write_bytes(raw);receipt.write_text(json.dumps(m));return raw,m
                except HTTPError as e:
                    if e.code==429:
                        seconds=int(e.headers.get('Retry-After','60')) if e.headers.get('Retry-After','60').isdigit() else 3600
                        cooldown.write_text(json.dumps(dict(until=time.time()+seconds)));raise RuntimeError('Source rate limited; stop and retain cache') from e
                    if attempt==2:raise
                except (IOError,TimeoutError,IncompleteRead,RemoteDisconnected):
                    if attempt==2:raise
        header,identity=fetch(0,1048575)
        sparse=ROOT/(name+'.source-part.tif')
        with sparse.open('wb') as target:target.truncate(identity['total']);target.write(header)
        with rasterio.open(sparse) as info:
            req=from_bounds(-radius,-radius,radius,radius,info.transform)
            wx,wy=math.floor(req.col_off),math.floor(req.row_off)
            win=Window(wx,wy,math.ceil(req.col_off+req.width)-wx,math.ceil(req.row_off+req.height)-wy)
        with tifffile.TiffFile(io.BytesIO(header)) as t:groups=selected_blocks(t.pages[0],win)
        total_bytes=sum(b-a+1 for a,b in groups);received=0
        ranges=[(first,min(b,first+4*1024*1024-1)) for a,b in groups for first in range(a,b+1,4*1024*1024)]
        def acquire_range(pair):
            first,last=pair
            raw,block_meta=fetch(first,last)
            if (block_meta['total'],block_meta['stamp'])!=(identity['total'],identity['stamp']):raise ValueError('Remote source changed during acquisition')
            return first,raw
        with sparse.open('r+b') as target,ThreadPoolExecutor(max_workers=3) as pool:
            for first,raw in pool.map(acquire_range,ranges):
                target.seek(first);target.write(raw);received+=len(raw)
                print(name,'source blocks',round(received/total_bytes*100),'percent',flush=True)
        with rasterio.Env(GDAL_DISABLE_READDIR_ON_OPEN='EMPTY_DIR',CPL_VSIL_CURL_ALLOWED_EXTENSIONS='.TIF',GDAL_HTTP_TIMEOUT='45',GDAL_HTTP_MAX_RETRY='0'):
            with rasterio.open(sparse) as source:
                assert source.res==(res,res)
                assert CRS.from_user_input(source.crs).ellipsoid.semi_major_metre==1737400
                requested=from_bounds(-radius,-radius,radius,radius,source.transform)
                x,y=math.floor(requested.col_off),math.floor(requested.row_off)
                window=Window(x,y,math.ceil(requested.col_off+requested.width)-x,math.ceil(requested.row_off+requested.height)-y)
                assert window.intersection(Window(0,0,source.width,source.height))==window
                profile=source.profile.copy();profile.update(width=int(window.width),height=int(window.height),transform=source.window_transform(window),compress='deflate',tiled=True,blockxsize=256,blockysize=256,BIGTIFF='IF_SAFER')
                temporary=path.with_suffix('.part.tif')
                with rasterio.open(temporary,'w',**profile) as target:
                    for row in range(0,int(window.height),512):
                        height=min(512,int(window.height)-row);out=Window(0,row,window.width,height)
                        array=source.read(1,window=Window(window.col_off,window.row_off+row,window.width,height))
                        target.write(array,1,window=out)
                        print(name,round((row+height)/window.height*100),'percent',flush=True)
                temporary.replace(path)
                record=dict(id=name,path=path.as_posix(),url=url,sha256=digest(path),pixelM=res,boundsXYM=list(bounds(window,source.transform)),crsWKT=source.crs.to_wkt(),sourceWindow=list(window.flatten()),fullSourceSha256=None,frame='MOON_ME_DE421',scope='Native source crop; derived bytes hashed; full remote source not downloaded.')
                meta.write_text(json.dumps(record,indent=2)+'\n');records.append(record)
    (ROOT/'catalog.json').write_text(json.dumps(dict(schemaVersion=1,latitudeRange=[-90,-85],horizonRadiusM=180000,sources=records),indent=2)+'\n')
    print('Terrain acquisition complete; coverage validation is still required.',flush=True)
if __name__=='__main__':main()
