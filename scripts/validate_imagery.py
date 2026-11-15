"""Verify historical context assets and point coverage without claiming registration."""
import hashlib,json,zipfile
from pathlib import Path
import numpy as np
import rasterio
from pyproj import CRS,Transformer

def validate():
    base=json.loads(Path('data/mission-data.json').read_text(encoding='utf-8'));reference=base['imagery'];raw=Path(reference['url'][1:]).read_bytes();catalog=json.loads(raw);checks=0
    def check(condition,message):
        nonlocal checks
        if not condition:raise ValueError(message)
        checks+=1
    check(hashlib.sha256(raw).hexdigest()==reference['sha256'],'catalog checksum');check(len(catalog['entries'])==3,'three context areas')
    candidate=json.loads(Path(base['candidates']['url'][1:]).read_text());points=base['sites']+[p for g in candidate['regions'] for p in g['points']];lunar=CRS.from_proj4('+proj=longlat +R=1737400 +no_defs');rows=[]
    for entry in catalog['entries']:
        for key in ['png','native','metadata']:
            asset=entry[key];check(hashlib.sha256(Path(asset['url'][1:]).read_bytes()).hexdigest()==asset['sha256'],entry['name']+' '+key+' checksum')
        metadata=json.loads(Path(entry['metadata']['url'][1:]).read_text())
        check(entry['acquisitionIncomplete']==metadata.get('acquisitionIncomplete',False),'partial acquisition disclosure matches retained evidence')
        if entry['acquisitionIncomplete']:
            check(bool(entry['acquisitionNote']) and entry['acquiredPixelFraction']==metadata['checks']['acquiredPixelFraction']<1,'partial coverage explicitly disclosed')
        with rasterio.open(entry['native']['url'][1:]) as native,rasterio.open(entry['png']['url'][1:]) as preview:
            check(np.allclose(metadata['checks']['boundsXYM'],list(native.bounds),rtol=0,atol=1e-7),'retained crop bounds match native transform')
            a=native.read(1,masked=True);mask=~np.ma.getmaskarray(a);alpha=preview.read(2)
            check(native.shape==preview.shape,entry['name']+' dimensions');check(np.array_equal(alpha>0,mask),entry['name']+' alpha mask')
            check(abs(float(mask.mean())-entry['validContextFraction'])<1e-12,entry['name']+' non-nodata fraction')
            if native.dtypes[0]=='uint8':check(np.array_equal(preview.read(1)[mask],a.data[mask]),entry['name']+' source digital values preserved in preview')
            check(abs(CRS.from_user_input(native.crs).ellipsoid.semi_major_metre-1737400)<1e-6,entry['name']+' lunar sphere')
            forward=Transformer.from_crs(lunar,native.crs,always_xy=True);states={}
            for point in [p for p in points if p.get('sourceSiteId',p['id'])==entry['sourceSiteId']]:
                record=entry['pointCoverage'][point['id']];check(record['longitude']==point['longitude'] and record['latitude']==point['latitude'],'point context')
                x,y=forward.transform(point['longitude'],point['latitude']);r,c=native.index(x,y);inside=0<=r<native.height and 0<=c<native.width
                state='outside-crop' if not inside else 'source-nodata' if np.ma.is_masked(a[r,c]) else 'valid-source-pixel';check(state==record['state'],'source-pixel coverage state');states[state]=states.get(state,0)+1
            rows.append(dict(siteId=entry['sourceSiteId'],productId=entry['productId'],validContextFraction=entry['validContextFraction'],states=states))
        check('Historical' in entry['scope'] and 'registration' in entry['scope'],'explicit historical and registration scope')
    # Existing scientific arrays must remain identical through this visual milestone.
    old=Path('release/moon-park-research-v0.7.zip')
    if old.exists():
        with zipfile.ZipFile(old) as archive:prior=json.loads(archive.read('data/mission-data.json'))
        check(prior['sites']==base['sites'],'all benchmark scientific site arrays unchanged');check(prior['candidates']==base['candidates'],'candidate evidence references unchanged')
    report=dict(passed=True,checks=checks,entries=rows,scope='Checks source identities, retained pixels, masks, lunar projection and point-specific crop support. Does not measure image-to-DEM registration or independent scientific accuracy.')
    Path('docs/imagery-validation.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))

if __name__=='__main__':validate()
