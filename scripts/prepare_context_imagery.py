"""Acquire exact source TIFF blocks for bounded historical lunar-image crops."""
import hashlib,io,json,math,tempfile,time
from urllib.error import HTTPError
from pathlib import Path
from urllib.request import Request,urlopen
import numpy as np
import rasterio
from rasterio.windows import Window,bounds
from rasterio.enums import ColorInterp
from rasterio.transform import array_bounds
from pyproj import CRS,Transformer
import tifffile
from fetch_clones import selected_blocks

PDS='https://pds.mcp.nasa.gov/data/store/img/lunar_reconnaissance_orbiter/pds4/lroc/lro-l-lroc-5-rdr/LROLRC_2001/'
PRODUCTS=[
 dict(slug='shackleton',siteId='Site04',productId='NAC_DTM_ESALL_SR12_NACMOS_1M',path='NAC_DTM/ESALL_SR12/NAC_DTM_ESALL_SR12_NACMOS_1M.TIF',groupId='NAC_DTM_ESALL_SR12',kind='Historical LROC orthomosaic',registration='Relative registration to current Site04 LOLA terrain not measured; no correction applied.'),
 dict(slug='de-gerlache',siteId='Site11',productId='NAC_ROI_DEGERRIMLO1_P885S2933',path='NAC_ROI/DEGERRIMLO1/NAC_ROI_DEGERRIMLO1_P885S2933.TIF',groupId='NAC_ROI_DEGERRIMLO1',kind='Historical controlled composite NAC mosaic; 144 images, multiple lighting bins',registration='Product documentation estimates 5–20 m absolute positional accuracy. Relative registration to the current Site11 DEM has not been measured. No blind correction applied.'),
]
sha=lambda raw:hashlib.sha256(raw).hexdigest()

class RemoteTIFF(io.RawIOBase):
    def __init__(self,url):
        self.url=url;self.position=0;self.blocks={};self.block_size=262144;self.network_bytes=0
        self.root=Path('data/raw/imagery/http-cache')/sha(url.encode())[:20];self.root.mkdir(parents=True,exist_ok=True)
        self.name=url.rsplit('/',1)[-1];index=self.root/'source.json'
        self.known_hashes={}
        for prior in Path('data/imagery').glob('*.source.json'):
            record=json.loads(prior.read_text(encoding='utf-8'))
            if record.get('source',{}).get('url')==url:
                self.known_hashes.update({(v['start'],v['end']):v['sha256'] for v in record['source'].get('retainedRanges',[])})
        if index.exists():
            context=json.loads(index.read_text());self.total=context['total'];self.stamp=context['stamp'];self.probe={'retainedSourceIdentity':self.stamp}
        else:
            with urlopen(Request(url,headers={'Range':'bytes=0-65535'}),timeout=45) as r:
                if r.status!=206 or not r.headers.get('Content-Range','').startswith('bytes 0-65535/'):raise ValueError('Server does not support exact byte ranges')
                probe=r.read();self.total=int(r.headers['Content-Range'].split('/')[1]);self.stamp=r.headers.get('ETag',r.headers.get('Last-Modified'));self.network_bytes+=len(probe)
            if len(probe)!=65536:raise ValueError('Truncated metadata probe')
            self.probe=dict(start=0,end=65535,sha256=sha(probe))
            index.write_text(json.dumps(dict(url=url,total=self.total,stamp=self.stamp),indent=2))
    def receive(self,start,end):
        cooldown=self.root/'rate-limit.json'
        if cooldown.exists():
            record=json.loads(cooldown.read_text());remaining=record['retryNotBeforeEpoch']-time.time()
            if remaining>0:raise RuntimeError(f'Source retry window active for another {math.ceil(remaining)} seconds; retained cache is unchanged')
        if self.network_bytes+end-start+1>128*1024*1024:raise ValueError('Bounded download budget exceeded')
        for attempt in range(1):
            try:
                with urlopen(Request(self.url,headers={'Range':f'bytes={start}-{end}'}),timeout=45) as r:
                    if r.status!=206 or r.headers.get('Content-Range')!=f'bytes {start}-{end}/{self.total}' or r.headers.get('ETag',r.headers.get('Last-Modified'))!=self.stamp:raise ValueError('Range or source identity mismatch')
                    raw=r.read();self.network_bytes+=len(raw)
                if len(raw)!=end-start+1:raise ValueError('Truncated source block')
                return raw
            except HTTPError as error:
                if error.code!=429:raise
                delay=int(error.headers.get('Retry-After','30')) if error.headers.get('Retry-After','30').isdigit() else 30
                cooldown.write_text(json.dumps(dict(httpStatus=429,retryAfterSeconds=delay,observedEpoch=time.time(),retryNotBeforeEpoch=time.time()+delay),indent=2))
                raise RuntimeError(f'Source rate limit: stop requests for {delay} seconds; cache retained') from error
    def readable(self):return True
    def seekable(self):return True
    def tell(self):return self.position
    def seek(self,offset,whence=0):
        self.position=offset if whence==0 else self.position+offset if whence==1 else self.total+offset
        if self.position<0:raise ValueError('Negative source offset')
        return self.position
    def block(self,index):
        if index in self.blocks:return self.blocks[index]
        start=index*self.block_size;end=min(self.total-1,start+self.block_size-1);path=self.root/f'{start}-{end}.bin'
        if path.exists():
            raw=path.read_bytes();expected=self.known_hashes.get((start,end))
            if expected and sha(raw)!=expected:raise ValueError('Cached source block differs from retained provenance hash; refusing resume')
        else:
            raw=self.receive(start,end)
            path.write_bytes(raw)
        if len(raw)!=end-start+1:raise ValueError('Invalid cached range length')
        self.blocks[index]=raw;return raw
    def read(self,size=-1):
        if size<0:size=self.total-self.position
        size=min(size,max(0,self.total-self.position))
        if size>8*1024*1024:raise ValueError('Unbounded source read rejected')
        pieces=[];end=self.position+size
        while self.position<end:
            index=self.position//self.block_size;raw=self.block(index);offset=self.position%self.block_size;length=min(len(raw)-offset,end-self.position)
            pieces.append(raw[offset:offset+length]);self.position+=length
        return b''.join(pieces)
    def fetch(self,start,end):
        indices=list(range(start//self.block_size,end//self.block_size+1));missing=[]
        for i in indices:
            a=i*self.block_size;b=min(self.total-1,a+self.block_size-1)
            if i in self.blocks or (self.root/f'{a}-{b}.bin').exists():self.block(i)
            else:missing.append(i)
        runs=[]
        for i in missing:
            if runs and i==runs[-1][-1]+1 and len(runs[-1])<32:runs[-1].append(i)
            else:runs.append([i])
        for run in runs:
            a=run[0]*self.block_size;b=min(self.total-1,(run[-1]+1)*self.block_size-1);raw=self.receive(a,b)
            for i in run:
                start=i*self.block_size;end=min(self.total-1,start+self.block_size-1);block=raw[start-a:end-a+1]
                (self.root/f'{start}-{end}.bin').write_bytes(block);self.blocks[i]=block
            print('Received contiguous source range',a,b,flush=True)
    def materialize(self,path):
        with path.open('wb') as f:
            f.truncate(self.total)
            for index,raw in self.blocks.items():f.seek(index*self.block_size);f.write(raw)

def prepare(product):
    manifest=json.loads(Path('data/candidates.json').read_text());point=next(g['points'][0] for g in manifest['regions'] if g['regionId']==product['siteId']+'-roi-1')
    remote=RemoteTIFF(PDS+'EXTRAS/BROWSE/'+product['path']);out=Path('data/imagery');out.mkdir(parents=True,exist_ok=True)
    with tifffile.TiffFile(remote) as tif:
        page=tif.pages[0]
        if page.samplesperpixel!=1:raise ValueError('Expected one source image band')
        for tag in page.tags.values():_=tag.value
        print(product['slug'],'source',page.shape,page.dtype,'tiled',page.is_tiled,'bytes',remote.total,flush=True)
        # The temporary sparse TIFF contains only requested original blocks and is
        # never treated as a complete source image or used outside this window.
        with tempfile.NamedTemporaryFile(suffix='.tif',delete=False) as f:temporary=Path(f.name)
        try:
            remote.materialize(temporary)
            with rasterio.open(temporary) as ds:
                if ds.crs is None or ds.transform.b or ds.transform.d:raise ValueError('Unsupported image georeferencing')
                lunar=CRS.from_proj4('+proj=longlat +R=1737400 +no_defs');forward=Transformer.from_crs(lunar,ds.crs,always_xy=True)
                x,y=forward.transform(point['longitude'],point['latitude']);requested=ds.window(x-1000,y-1000,x+1000,y+1000)
                window=Window(math.floor(requested.col_off),math.floor(requested.row_off),math.ceil(requested.col_off+requested.width)-math.floor(requested.col_off),math.ceil(requested.row_off+requested.height)-math.floor(requested.row_off))
                overlap=window.intersection(Window(0,0,ds.width,ds.height));transform=ds.window_transform(window);crs=ds.crs;nodata=ds.nodata;source_bounds=list(ds.bounds);resolution=list(ds.res);source_shape=[ds.height,ds.width]
            groups=selected_blocks(page,overlap)
            for i,(a,b) in enumerate(groups):remote.fetch(a,b);print('Received',product['slug'],'block group',i+1,'/',len(groups),flush=True)
            remote.materialize(temporary)
            with rasterio.open(temporary) as ds:
                pixels=ds.read(1,window=window,boundless=True,masked=True);source_center=next(ds.sample([(x,y)],masked=True))[0]
            valid=~np.ma.getmaskarray(pixels);image=pixels.filled(nodata if nodata is not None else 0)
            tif_path=out/f'{product["slug"]}-context-native.tif'
            with rasterio.open(tif_path,'w',driver='GTiff',width=image.shape[1],height=image.shape[0],count=1,dtype=image.dtype,crs=crs,transform=transform,nodata=nodata,compress='deflate') as ds:ds.write(image,1)
            with rasterio.open(tif_path) as ds:
                assert np.array_equal(ds.read(1),image);assert ds.crs==crs;assert np.array_equal(np.ma.getmaskarray(ds.read(1,masked=True)),~valid)
                crop_center=next(ds.sample([(x,y)],masked=True))[0]
                assert np.ma.is_masked(source_center)==np.ma.is_masked(crop_center)
                if not np.ma.is_masked(source_center):assert source_center==crop_center
            if image.dtype==np.uint8:preview=image;display=dict(method='Original 8-bit values; no contrast transform')
            else:
                lo,hi=np.percentile(image[valid],[2,98]);preview=np.clip((image.astype(float)-lo)/max(1,float(hi-lo))*255,0,255).astype('uint8');display=dict(method='Display-only linear percentile stretch to 8 bits; native GeoTIFF preserves original digital numbers',lowerPercentile=2,upperPercentile=98,lowerDN=float(lo),upperDN=float(hi))
            png_path=out/f'{product["slug"]}-context.png'
            with rasterio.open(png_path,'w',driver='PNG',width=image.shape[1],height=image.shape[0],count=2,dtype='uint8') as ds:ds.write(preview,1);ds.write(valid.astype('uint8')*255,2);ds.colorinterp=(ColorInterp.gray,ColorInterp.alpha)
            ranges=[dict(start=i*remote.block_size,end=i*remote.block_size+len(raw)-1,sha256=sha(raw)) for i,raw in sorted(remote.blocks.items())]
            record=dict(schemaVersion=1,productId=product['productId'],kind=product['kind'],productPage='https://data.lroc.im-ldi.com/lroc/view_rdr_product/'+product['productId'],groupPage='https://data.lroc.im-ldi.com/lroc/view_rdr/'+product['groupId'],source=dict(url=remote.url,fullFileBytes=remote.total,fullFileSha256=None,identityETag=remote.stamp,acquisition='Exact TIFF metadata and compressed pixel blocks via verified HTTP 206 ranges; full source was not downloaded',networkBytesThisRun=remote.network_bytes,retainedUniqueBytes=sum(len(r) for r in remote.blocks.values()),metadataProbe=remote.probe,retainedRanges=ranges,selectedCompressedBlockGroups=groups),processingCodeSha256=sha(Path(__file__).read_bytes()),checks=dict(pointId=point['id'],longitude=point['longitude'],latitude=point['latitude'],sourceShape=source_shape,sourceBounds=source_bounds,sourceNoData=nodata,nativeDtype=str(image.dtype),shape=list(image.shape),resolutionM=resolution,crsWKT=crs.to_wkt(),boundsXYM=list(array_bounds(image.shape[0],image.shape[1],transform)),sourceWindow=dict(col=window.col_off,row=window.row_off,width=window.width,height=window.height),validContextFraction=float(valid.mean()),anchorPixelValid=not np.ma.is_masked(source_center),anchorDN=None if np.ma.is_masked(source_center) else int(source_center),nativePixelRoundTripEqual=True,sourceAnchorPixelPreserved=True),preview=display,registration=product['registration'],scope='Historical context only. Rectangle inclusion alone does not prove valid pixel support. Source mask is preserved; image illumination is not simulated 2026 lighting. Not independently registered to the current mission DEM.',derivedAssets={p.name:dict(path=p.as_posix(),sha256=sha(p.read_bytes()),bytes=p.stat().st_size) for p in [tif_path,png_path]})
            (out/f'{product["slug"]}-context.source.json').write_text(json.dumps(record,indent=2)+'\n')
            print(json.dumps({k:record['checks'][k] for k in ['pointId','nativeDtype','validContextFraction','anchorPixelValid','anchorDN']},indent=2),flush=True);print('Transferred',remote.network_bytes,'of',remote.total,'source bytes',flush=True)
            return record
        finally:temporary.unlink(missing_ok=True)

if __name__=='__main__':
    for product in PRODUCTS:prepare(product)
