"""Retain near-field crops of four documented PGDA error realizations per site."""
import hashlib
import io
import json
import math
import re
from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser
from pathlib import Path
from urllib.request import Request,urlopen
import numpy as np
import rasterio
from rasterio.windows import Window
import tifffile

ROOT=Path('data/raw/clones')
IDS=[1,26,51,76]

def error_from_surfaces(clone,nominal):
    if clone.shape!=nominal.shape:raise ValueError('Clone and nominal crop shapes differ')
    difference=np.ma.masked_invalid(clone)-np.ma.masked_invalid(nominal)
    finite=difference.compressed()
    if not len(finite) or float(np.median(np.abs(finite)))>100:raise ValueError('Clone/nominal interpretation or grid check failed')
    return difference

def read_range(url,start,end):
    root=ROOT/'http-cache';root.mkdir(parents=True,exist_ok=True)
    key=hashlib.sha256(f'{url}:{start}:{end}'.encode()).hexdigest()
    cache=root/f'{key}.bin';meta=root/f'{key}.json'
    wanted=end-start+1
    if cache.exists() and cache.stat().st_size>wanted:raise ValueError('Invalid cached range size')
    failures=0
    while failures<6:
        obtained=cache.stat().st_size if cache.exists() else 0
        if obtained==wanted and meta.exists():return cache.read_bytes(),json.loads(meta.read_text())['total']
        position=start+obtained
        request_end=min(end,position+1048575)
        try:
            with urlopen(Request(url,headers={'Range':f'bytes={position}-{request_end}'}),timeout=30) as response:
                if response.status!=206 or not response.headers.get('Content-Range','').startswith(f'bytes {position}-{request_end}/'):
                    raise ValueError('Source did not honor byte range')
                total=int(response.headers['Content-Range'].split('/')[1])
                stamp=response.headers.get('ETag',response.headers.get('Last-Modified'))
                if meta.exists() and json.loads(meta.read_text()).get('stamp')!=stamp:raise ValueError('Source changed while acquiring range')
                meta.write_text(json.dumps(dict(total=total,stamp=stamp)))
                with cache.open('ab') as out:
                    target_size=request_end-start+1
                    while out.tell()<target_size:
                        block=response.read1(min(65536,target_size-out.tell()))
                        if not block:raise IOError('Truncated source range')
                        out.write(block);out.flush()
            if cache.stat().st_size==wanted:return cache.read_bytes(),total
        except ValueError:raise
        except Exception as error:
            failures+=1
            if failures==6:raise
            print('Resuming source block',Path(url).name,'attempt',failures+1,'saved',cache.stat().st_size if cache.exists() else 0,flush=True)
    raise IOError('Source acquisition exhausted retries')

def selected_blocks(page,window):
    if page.is_tiled:
        nx=math.ceil(page.imagewidth/page.tilewidth)
        indices=[r*nx+c for r in range(int(window.row_off)//page.tilelength,math.ceil((window.row_off+window.height)/page.tilelength)) for c in range(int(window.col_off)//page.tilewidth,math.ceil((window.col_off+window.width)/page.tilewidth))]
    else:
        indices=range(int(window.row_off)//page.rowsperstrip,math.ceil((window.row_off+window.height)/page.rowsperstrip))
    groups=[]
    for a,b in sorted((page.dataoffsets[i],page.dataoffsets[i]+page.databytecounts[i]-1) for i in indices):
        if groups and a<=groups[-1][1]+4097:groups[-1]=(groups[-1][0],b)
        else:groups.append((a,b))
    return groups

def fetch(job):
    site,number,url=job
    ROOT.mkdir(parents=True,exist_ok=True)
    path=ROOT/f'{site["id"]}-{number:04d}-error.tif'
    manifest_path=path.with_suffix('.json')
    if path.exists() and manifest_path.exists():return json.loads(manifest_path.read_text())
    with rasterio.open(f'data/raw/{site["id"]}.tif') as nominal:
        col,row=(~nominal.transform)*tuple(site['xy'])
        # 2 km circular perturbation region, plus bilinear support cells.
        window=Window(math.floor(col)-402,math.floor(row)-402,805,805)
        if window.col_off<0 or window.row_off<0 or window.col_off+window.width>nominal.width or window.row_off+window.height>nominal.height:raise ValueError('Clone crop exceeds nominal extent')
        expected=nominal.transform
        reference=nominal.read(1,window=window,masked=True)
    header,total=read_range(url,0,131071)
    with tifffile.TiffFile(io.BytesIO(header)) as tif:
        page=tif.pages[0]
        if (page.imagewidth,page.imagelength)!=(3200,3200):raise ValueError('Unexpected clone grid')
        groups=selected_blocks(page,window)
    sparse=path.with_suffix('.source-part.tif')
    try:
        with sparse.open('wb') as target:
            target.truncate(total);target.write(header)
            for start,end in groups:
                data,_=read_range(url,start,end);target.seek(start);target.write(data)
        with rasterio.open(sparse) as src:
            if src.transform!=expected:raise ValueError('Clone and nominal grids differ')
            data=src.read(1,window=window,masked=True)
            # These *_err files are absolute clone surfaces despite the suffix.
            # Derive the signed perturbation from the co-registered nominal map.
            difference=error_from_surfaces(data,reference)
            finite=difference.compressed()
            meta=src.profile.copy();meta.update(width=int(window.width),height=int(window.height),transform=src.window_transform(window),compress='deflate')
            with rasterio.open(path.with_suffix('.part.tif'),'w',**meta) as out:out.write(difference.filled(np.nan),1)
            path.with_suffix('.part.tif').replace(path)
            manifest=dict(siteId=site['id'],cloneId=number,url=url,path=path.as_posix(),cropSha256=hashlib.sha256(path.read_bytes()).hexdigest(),window=dict(col=window.col_off,row=window.row_off,width=window.width,height=window.height),perturbationRadiusM=2000,semantics='Published absolute clone surface minus co-registered nominal DEM; derived error applied inside 2 km, nominal terrain held fixed outside',rmsErrorM=float(np.sqrt(np.mean(finite**2))),minErrorM=float(np.min(finite)),maxErrorM=float(np.max(finite)),byteRanges=groups)
            manifest_path.write_text(json.dumps(manifest,indent=2))
    finally:sparse.unlink(missing_ok=True)
    print(site['id'],number,'crop saved',path.stat().st_size,flush=True)
    return manifest

class Links(HTMLParser):
    def __init__(self):super().__init__();self.urls={}
    def handle_starttag(self,tag,attrs):
        url=dict(attrs).get('href','')
        m=re.search(r'/(Site01|Site04|Site11)/Clones/.*_(\d{4})_err\.tif$',url)
        if tag=='a' and m:self.urls[(m[1],int(m[2]))]=url

def acquire():
    sites=json.loads(Path('data/terrain-regional.json').read_text(encoding='utf-8'))
    cached=[ROOT/f'{s["id"]}-{i:04d}-error.json' for s in sites for i in IDS]
    if all(p.exists() and p.with_suffix('.tif').exists() for p in cached):
        manifest=[json.loads(p.read_text()) for p in cached]
        Path('data/clone-sources.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
        return manifest
    parser=Links();parser.feed(urlopen('https://pgda.gsfc.nasa.gov/products/78',timeout=60).read().decode())
    jobs=[(s,i,parser.urls[(s['id'],i)]) for s in sites for i in IDS]
    def checked(job):
        try:return fetch(job)
        except Exception as error:
            print('Clone acquisition failed',job[0]['id'],job[1],str(error),flush=True)
            raise
    with ThreadPoolExecutor(max_workers=2) as pool:manifest=list(pool.map(checked,jobs))
    Path('data/clone-sources.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
    return manifest

if __name__=='__main__':acquire()
