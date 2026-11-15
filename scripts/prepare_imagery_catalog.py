"""Bind verified historical image assets to their exact calculated point contexts."""
import hashlib,json
from pathlib import Path
import numpy as np
import rasterio
from pyproj import CRS,Transformer

def build():
    base_path=Path('data/mission-data.json');base=json.loads(base_path.read_text(encoding='utf-8'))
    candidates=json.loads(Path(base['candidates']['url'][1:]).read_text());points=base['sites']+[p for g in candidates['regions'] for p in g['points']]
    lunar=CRS.from_proj4('+proj=longlat +R=1737400 +no_defs');entries=[]
    configs=[('Site01','Connecting Ridge','connecting-ridge','2010-09-22'),('Site04','Shackleton rim','shackleton','2010-09-23 to 2010-10-10'),('Site11','de Gerlache rim','de-gerlache','2009-07-04 to 2013-01-29 composite')]
    for site_id,name,slug,dates in configs:
        source_path=Path(f'data/imagery/{slug}-context.source.json');record=json.loads(source_path.read_text());assets=record['derivedAssets']
        png=next(v for k,v in assets.items() if k.endswith('.png'));native=next(v for k,v in assets.items() if k.endswith('.tif'))
        for asset in [png,native]:
            if hashlib.sha256(Path(asset['path']).read_bytes()).hexdigest()!=asset['sha256']:raise ValueError('Image asset checksum mismatch')
        coverage={}
        with rasterio.open(native['path']) as ds:
            if abs(CRS.from_user_input(ds.crs).ellipsoid.semi_major_metre-1737400)>1e-6:raise ValueError('Unexpected lunar image sphere')
            forward=Transformer.from_crs(lunar,ds.crs,always_xy=True)
            for point in [p for p in points if p.get('sourceSiteId',p['id'])==site_id]:
                x,y=forward.transform(point['longitude'],point['latitude']);row,col=ds.index(x,y);inside=0<=row<ds.height and 0<=col<ds.width
                sample=next(ds.sample([(x,y)],masked=True))[0] if inside else None
                state='outside-crop' if not inside else 'source-nodata' if np.ma.is_masked(sample) else 'valid-source-pixel'
                coverage[point['id']]=dict(longitude=point['longitude'],latitude=point['latitude'],state=state,sourcePixel=None if not inside else [row,col])
            valid_fraction=float((~np.ma.getmaskarray(ds.read(1,masked=True))).mean());resolution=list(ds.res);bounds=list(ds.bounds)
        metadata_hash=hashlib.sha256(source_path.read_bytes()).hexdigest()
        if record.get('acquisitionIncomplete'):record['acquisitionNote']='Partial image coverage: undownloaded source strips are transparent. Missing pixels have not been filled or synthesized.'
        alignment=record.get('registration',record.get('alignmentStatus'))
        if site_id=='Site04':alignment='Source README reports varying horizontal misalignments of several meters or more between orthophotos, the orthomosaic and their DTM. Registration to the current mission DEM has not been measured.'
        entries.append(dict(sourceSiteId=site_id,name=name,productId=record['productId'],productPage=record['productPage'],groupPage=record.get('groupPage'),acquisitionDates=dates,png=dict(url='/'+png['path'],sha256=png['sha256']),native=dict(url='/'+native['path'],sha256=native['sha256']),metadata=dict(url='/'+source_path.as_posix(),sha256=metadata_hash),resolutionM=resolution,boundsXYM=bounds,validContextFraction=valid_fraction,acquisitionIncomplete=record.get('acquisitionIncomplete',False),acquisitionNote=record.get('acquisitionNote'),acquiredPixelFraction=record['checks'].get('acquiredPixelFraction'),pointCoverage=coverage,alignment=alignment,preview=record.get('preview',dict(method='Original 8-bit values, no contrast transformation')),scope='Historical source-projected context crop. No image-to-DEM registration measurement or exact visual overlay is claimed. Source illumination is separate from mission replay.'))
    output=dict(schemaVersion=1,entries=entries,scope='Historical imagery context only; no scientific visibility inputs are changed. Masks and point-specific crop support are explicit.')
    raw=json.dumps(output,allow_nan=False,separators=(',',':')).encode();sha=hashlib.sha256(raw).hexdigest();path=Path(f'data/imagery/catalog-{sha[:12]}.json');path.write_bytes(raw);Path('data/imagery/catalog.json').write_bytes(raw)
    base['imagery']=dict(url='/'+path.as_posix(),sha256=sha,scope=output['scope'],entryCount=len(entries));base_path.write_text(json.dumps(base,allow_nan=False,separators=(',',':')),encoding='utf-8')
    print(json.dumps({e['name']:{'coverage':e['validContextFraction'],'states':{p:q['state'] for p,q in e['pointCoverage'].items()}} for e in entries},indent=2))

if __name__=='__main__':build()
