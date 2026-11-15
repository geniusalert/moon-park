"""Read a bounded COG window via HTTP ranges; retain the actual crop and metadata."""
import hashlib
import json
import io
import math
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.request import Request,urlopen
import tifffile
import rasterio
from rasterio.windows import from_bounds

URL='https://pgda.gsfc.nasa.gov/data/LOLA_20mpp/LDEM_60S_240MPP_ADJ.TIF'
PATH=Path('data/raw/regional-240m.tif')

def acquire():
    if PATH.exists():return PATH
    def read_range(bounds):
        start,end=bounds
        with urlopen(Request(URL,headers={'Range':f'bytes={start}-{end}'}),timeout=60) as response:
            if response.status!=206 or not response.headers.get('Content-Range','').startswith(f'bytes {start}-{end}/'):
                raise ValueError('Server did not honor requested byte range')
            raw=response.read()
            if len(raw)!=end-start+1:raise ValueError('Truncated remote block')
            return start,raw,response.headers['Content-Range']
    _,header,content_range=read_range((0,1048575))
    total=int(content_range.split('/')[1])
    with tifffile.TiffFile(io.BytesIO(header)) as tif:
        page=tif.pages[0]
        tx,ty=page.tilewidth,page.tilelength
        across=math.ceil(page.imagewidth/tx)
        # The documented 240 m map transform gives this exact source-pixel window.
        offsets=page.dataoffsets;counts=page.databytecounts
        selected=[]
        for row in range(2880//ty,math.ceil(4880/ty)):
            for col in range(2880//tx,math.ceil(4880/tx)):
                i=row*across+col;selected.append((offsets[i],offsets[i]+counts[i]-1))
    selected.sort();groups=[]
    for start,end in selected:
        if groups and start<=groups[-1][1]+4097:groups[-1]=(groups[-1][0],end)
        else:groups.append((start,end))
    sparse=PATH.with_suffix('.source-part.tif')
    print('Fetching',len(groups),'regional COG block groups; bytes',sum(b-a+1 for a,b in groups),flush=True)
    with sparse.open('wb') as target:
        target.truncate(total);target.seek(0);target.write(header)
        with ThreadPoolExecutor(max_workers=4) as pool:
            for start,raw,_ in pool.map(read_range,groups):
                target.seek(start);target.write(raw)
                print('Received block group',start,len(raw),flush=True)
    try:
        with rasterio.open(sparse) as src:
            window=from_bounds(-240000,-240000,240000,240000,src.transform).round_offsets().round_lengths()
            if (window.col_off,window.row_off,window.width,window.height)!=(2880,2880,2000,2000):
                raise ValueError('Source grid changed; selected tile window must be recalculated')
            print('Regional source',src.shape,src.crs,'crop',window,flush=True)
            terrain=src.read(1,window=window)
            meta=src.profile.copy();meta.update(width=terrain.shape[1],height=terrain.shape[0],transform=src.window_transform(window),driver='GTiff',compress='deflate')
            with rasterio.open(PATH.with_suffix('.part.tif'),'w',**meta) as out:out.write(terrain,1)
            PATH.with_suffix('.part.tif').replace(PATH)
            manifest=dict(url=URL,window=dict(col_off=window.col_off,row_off=window.row_off,width=window.width,height=window.height),crs=src.crs.to_wkt(),pixelM=240,source='NASA PGDA product 90; MOON_ME / DE421',cropSha256=hashlib.sha256(PATH.read_bytes()).hexdigest(),bounds=list(rasterio.windows.bounds(window,src.transform)))
            manifest['acquisition']='HTTP range extraction of all native TIFF tiles intersecting the retained window'
            manifest['byteRanges']=groups
    finally:
        sparse.unlink(missing_ok=True)
    PATH.with_suffix('.manifest.json').write_text(json.dumps(manifest,indent=2))
    print('Regional crop saved',PATH.stat().st_size,flush=True)
    return PATH

if __name__=='__main__':acquire()
