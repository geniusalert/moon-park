"""Source-linked NAC stereo terrain and confidence, separate from mission inputs."""
import hashlib,json,math
from pathlib import Path
from urllib.request import urlopen
import numpy as np
import rasterio
from rasterio.windows import Window
from rasterio.transform import from_bounds,array_bounds
from rasterio.warp import reproject,Resampling
from rasterio.enums import ColorInterp
from pyproj import CRS
from stereo_reference import CONFIDENCE,supported_cells,difference_summary

PDS='https://pds.mcp.nasa.gov/data/store/img/lunar_reconnaissance_orbiter/pds4/lroc/lro-l-lroc-5-rdr/LROLRC_2001/'
RAW=Path('data/raw/imagery/reference')
sha=lambda raw:hashlib.sha256(raw).hexdigest()
def source(name,folder,limit):
    RAW.mkdir(parents=True,exist_ok=True);p=RAW/name;m=p.with_suffix(p.suffix+'.source.json')
    previous=RAW.parent/name;previous_manifest=previous.with_suffix(previous.suffix+'.source.json')
    if not p.exists() and previous.exists() and previous_manifest.exists():
        record=json.loads(previous_manifest.read_text());raw=previous.read_bytes()
        if record['url']!=PDS+folder+name or sha(raw)!=record['sha256']:raise ValueError('Prior source identity mismatch')
        p.write_bytes(raw);m.write_text(json.dumps(record,indent=2)+'\n')
    if not p.exists() or not m.exists():
        url=PDS+folder+name
        with urlopen(url,timeout=60) as r:
            raw=r.read(limit+1)
            if len(raw)>limit:raise ValueError('Unexpected source size')
            record=dict(url=url,finalURL=r.url,bytes=len(raw),sha256=sha(raw),etag=r.headers.get('ETag'))
        p.write_bytes(raw);m.write_text(json.dumps(record,indent=2)+'\n')
    record=json.loads(m.read_text());assert sha(p.read_bytes())==record['sha256'];return p,record

def build():
    dp,dr=source('NAC_DTM_ESALL_SR12.TIF','DATA/SDP/NAC_DTM/ESALL_SR12/',30000000)
    cp,cr=source('NAC_DTM_ESALL_SR12_CONF.IMG','DATA/SDP/NAC_DTM/ESALL_SR12/',8000000)
    lp,lr=source('NAC_DTM_ESALL_SR12.LBL','DATA/SDP/NAC_DTM/ESALL_SR12/',100000)
    rp,rr=source('NAC_DTM_ESALL_SR12_README.TXT','DATA/SDP/NAC_DTM/ESALL_SR12/',100000)
    label=lp.read_text()
    if 'Height [m] equals DN.' not in label or '1737.4 <KM>' not in label:raise ValueError('Height scale or reference sphere unverified')
    base_path=Path('data/mission-data.json');base=json.loads(base_path.read_text(encoding='utf-8'))
    registration=json.loads(Path(base['registration']['url'][1:]).read_text(encoding='utf-8'));entry=next(e for e in registration['entries'] if e['siteId']=='Site04')
    site=next(s for s in base['sites'] if s['id']=='Site04');mission_path=Path('data/raw/Site04.tif')
    if sha(mission_path.read_bytes())!=site['provenance']['sha256']:raise ValueError('Mission DEM identity mismatch')
    out=Path('data/registration/reference');out.mkdir(exist_ok=True);assets={}
    def asset(p):return dict(url='/'+p.as_posix(),sha256=sha(p.read_bytes()))
    with rasterio.open(dp) as dtm,rasterio.open(cp) as confidence:
        if confidence.driver!='PDS' or confidence.dtypes!=('uint8',):raise ValueError('Scientific PDS confidence product required; browse intensity values are not quality codes')
        if dtm.transform!=confidence.transform or dtm.shape!=confidence.shape or dtm.crs!=confidence.crs:raise ValueError('Confidence grid differs from stereo terrain')
        if dtm.res!=(2.,2.) or dtm.scales!=(1.,) or dtm.offsets!=(0.,) or CRS.from_user_input(dtm.crs).ellipsoid.semi_major_metre!=1737400:raise ValueError('Unexpected stereo units or reference')
        if CRS.from_user_input(dtm.crs)!=CRS.from_wkt(entry['crsWKT']):raise ValueError('Unexpected image/stereo projection mismatch')
        requested=dtm.window(*entry['boundsXYM']);window=Window(math.floor(requested.col_off),math.floor(requested.row_off),math.ceil(requested.col_off+requested.width)-math.floor(requested.col_off),math.ceil(requested.row_off+requested.height)-math.floor(requested.row_off))
        if window.intersection(Window(0,0,dtm.width,dtm.height))!=window:raise ValueError('Requested reference crop outside source')
        raw=dtm.read(1,window=window,masked=True);codes=confidence.read(1,window=window)
        legend={**CONFIDENCE,**{int(code):f'Other source code {code}; undefined in README' for code in np.unique(codes) if code not in CONFIDENCE}}
        valid=(~np.ma.getmaskarray(raw))&np.isfinite(raw.data)&(raw.data>-1e30);transform=dtm.window_transform(window);crs=dtm.crs
        native=out/'shackleton-stereo-native.tif';quality=out/'shackleton-confidence-native.tif'
        with rasterio.Env(GDAL_TIFF_INTERNAL_MASK=True):
            for p,values,mask in [(native,raw.data,valid),(quality,codes,codes!=0)]:
                with rasterio.open(p,'w',driver='GTiff',width=values.shape[1],height=values.shape[0],count=1,dtype=values.dtype,crs=crs,transform=transform,compress='deflate') as ds:ds.write(values,1);ds.write_mask(mask.astype('uint8')*255)
                with rasterio.open(p) as ds:
                    if not np.array_equal(ds.read(1),values):raise ValueError('Native source pixels changed')
        w,h=entry['width'],entry['height'];target=from_bounds(*entry['boundsXYM'],w,h);shape=(h,w)
        reference=np.full(shape,np.nan,dtype='float32');mission=np.full(shape,np.nan,dtype='float32');fraction=np.zeros(shape,dtype='float32');classes=np.zeros(shape,dtype='uint8')
        def project(a,dst,method,missing=None):
            reproject(a,dst,src_transform=transform,src_crs=crs,src_nodata=missing,dst_transform=target,dst_crs=crs,dst_nodata=np.nan if dst.dtype.kind=='f' and missing is not None else None,resampling=method)
        project(np.where(valid,raw.data,np.nan),reference,Resampling.bilinear,np.nan)
        project((codes==14).astype('float32'),fraction,Resampling.average)
        project(codes,classes,Resampling.nearest)
        with rasterio.open(mission_path) as ds:reproject(rasterio.band(ds,1),mission,src_nodata=ds.nodata,dst_transform=target,dst_crs=crs,dst_nodata=np.nan,resampling=Resampling.bilinear)
        support=supported_cells(reference,mission,fraction);paired=np.isfinite(reference)&np.isfinite(mission)
        grid=out/'shackleton-comparison-grid.tif'
        with rasterio.open(grid,'w',driver='GTiff',width=w,height=h,count=3,dtype='float32',crs=crs,transform=target,nodata=np.nan,compress='deflate') as ds:
            for i,a in enumerate([reference,mission,fraction],1):ds.write(a,i)
            ds.descriptions=('NAC stereo elevation m','Mission LOLA elevation m','Area fraction confidence code 14')
        def png(name,values,mask):
            p=out/f'shackleton-{name}.png';a=np.clip(np.nan_to_num(values,nan=0),0,255).astype('uint8')
            with rasterio.open(p,'w',driver='PNG',width=w,height=h,count=2,dtype='uint8') as ds:ds.write(a,1);ds.write(mask.astype('uint8')*255,2);ds.colorinterp=(ColorInterp.gray,ColorInterp.alpha)
            assets[name]=asset(p)
        dy,dx=np.gradient(np.nan_to_num(reference,nan=0),entry['pixelM'][1],entry['pixelM'][0]);north=-dy
        shape_mask=np.isfinite(reference)
        for axis in [0,1]:shape_mask&=np.roll(np.isfinite(reference),1,axis)&np.roll(np.isfinite(reference),-1,axis)
        shape_mask[[0,-1],:]=False;shape_mask[:,[0,-1]]=False
        for az in [45,135,225,315]:
            a=math.radians(az);alt=math.radians(30);light=np.maximum(0,(-dx*math.sin(a)*math.cos(alt)-north*math.cos(a)*math.cos(alt)+math.sin(alt))/np.sqrt(1+dx*dx+north*north));png('shade'+str(az),light*255,shape_mask)
        png('slope',np.degrees(np.arctan(np.hypot(dx,north)))/45*255,shape_mask)
        colors={**{code:[145,145,145] for code in legend},0:[0,0,0],1:[82,120,178],4:[221,163,83],14:[168,216,170]};rgb=np.zeros((3,h,w),dtype='uint8')
        for code,color in colors.items():
            for channel in range(3):rgb[channel][classes==code]=color[channel]
        p=out/'shackleton-confidence.png'
        with rasterio.open(p,'w',driver='PNG',width=w,height=h,count=4,dtype='uint8') as ds:
            ds.write(rgb,indexes=[1,2,3]);ds.write((classes!=0).astype('uint8')*255,4);ds.colorinterp=(ColorInterp.red,ColorInterp.green,ColorInterp.blue,ColorInterp.alpha)
        assets['confidence']=asset(p)
        audit_path=Path('docs/tentative-shackleton-alignment-v0.10.json');audit=json.loads(audit_path.read_text(encoding='utf-8'));audit_rows=[]
        if audit['siteId']!='Site04' or audit['sourceImage']!=entry['sourceImage'] or audit['demSource']!=entry['demSource']:raise ValueError('Historical landmark audit source mismatch')
        for point in audit['pairs']:
            samples=[]
            for side in ['image','terrain']:
                xy=point[side];code=int(next(confidence.sample([xy]))[0]);z=next(dtm.sample([xy],masked=True))[0];usable=not np.ma.is_masked(z) and np.isfinite(z) and z>-1e30
                samples.append(dict(side=side,xy=xy,confidenceCode=code,meaning=legend.get(code,'Other source code; undefined in README'),stereoElevationAvailable=bool(usable)))
            eligible=all(v['confidenceCode']==14 and v['stereoElevationAvailable'] for v in samples)
            audit_rows.append(dict(id=point['id'],label=point['label'],role=point['role'],samples=samples,reviewStatus='stereo-supported-but-unreviewed' if eligible else 'not-supported-by-this-stereo-reference',accepted=False))
        report=dict(schemaVersion=1,siteId='Site04',name='Shackleton NAC stereo reference',productId='NAC_DTM_ESALL_SR12',productPage='https://data.lroc.im-ldi.com/lroc/view_rdr_product/NAC_DTM_ESALL_SR12',confidencePage='https://data.lroc.im-ldi.com/lroc/view_rdr_product/NAC_DTM_ESALL_SR12_CONF',processingCodeSha256=sha(Path(__file__).read_bytes()),methodCodeSha256=sha(Path('scripts/stereo_reference.py').read_bytes()),sources=dict(dtm=dr,confidence=cr,label=lr,readme=rr),imageContext=entry['sourceImage'],missionDEM=entry['demSource'],width=w,height=h,boundsXYM=entry['boundsXYM'],pixelM=entry['pixelM'],nativeResolutionM=2,verticalReference='Elevation in metres above the 1737400 m lunar reference sphere; source label scale is one metre per DN.',assets=assets,native=asset(native),confidenceNative=asset(quality),comparisonGrid=asset(grid),nativeConfidenceCounts={str(code):int((codes==code).sum()) for code in legend},confidenceLegend=legend,strictCorrelationFraction=float(support.mean()),pairedFraction=float(paired.mean()),strictDifference=difference_summary(reference,mission,support),allPairedDifference=difference_summary(reference,mission,paired),scope='Unshifted terrain-height comparison, NAC minus mission LOLA. Strict cells have full area coverage by confidence code 14. Grid-cell counts are spatially correlated, not independent samples. Stereo and LOLA share control heritage. This does not establish photo registration or independent accuracy. No mission input or image correction is changed.')
        report['landmarkAudit']=dict(input=dict(url='/'+audit_path.as_posix(),sha256=sha(audit_path.read_bytes())),points=audit_rows,scope='Source quality sampled at nominal unshifted image/mission coordinates; documented photo-to-DTM offsets remain. No correspondence is accepted.')
        raw_record=json.dumps(report,separators=(',',':'),allow_nan=False).encode();digest=sha(raw_record);p=out/f'catalog-{digest[:12]}.json';p.write_bytes(raw_record)
        base['stereoReference']=dict(url='/'+p.as_posix(),sha256=digest,scope=report['scope']);base_path.write_text(json.dumps(base,separators=(',',':'),allow_nan=False),encoding='utf-8')
        print(json.dumps({k:report[k] for k in ['nativeConfidenceCounts','strictCorrelationFraction','pairedFraction','strictDifference','allPairedDifference']},indent=2))

if __name__=='__main__':build()
