"""Validate prepared common-grid inspection assets, without accepting registration."""
import hashlib,json
from pathlib import Path
import numpy as np
import rasterio
from pyproj import CRS

def validate():
    base=json.loads(Path('data/mission-data.json').read_text(encoding='utf-8'));ref=base['registration'];raw=Path(ref['url'][1:]).read_bytes();catalog=json.loads(raw);checks=0;rows=[]
    def check(value,message):
        nonlocal checks
        if not value:raise ValueError(message)
        checks+=1
    sha=lambda raw:hashlib.sha256(raw).hexdigest()
    check(sha(raw)==ref['sha256'],'catalog identity');check(len(catalog['entries'])==3,'three areas');check(catalog['processingCodeSha256']==sha(Path('scripts/prepare_registration.py').read_bytes()),'processing identity')
    imagery=json.loads(Path(base['imagery']['url'][1:]).read_text(encoding='utf-8'))
    for e in catalog['entries']:
        source=next(s for s in base['sites'] if s['id']==e['siteId']);photo=next(p for p in imagery['entries'] if p['sourceSiteId']==e['siteId'])
        check(source['provenance']['sha256']==e['demSource']['sha256'],'exact mission DEM identity');check(photo['native']==e['sourceImage'],'exact native image identity');check(photo['metadata']==e['sourceMetadata'],'current acquisition metadata');check(e['acquisitionIncomplete']==photo['acquisitionIncomplete'],'partial context preserved')
        check(e['registrationStatus']=='unmeasured' and e['acceptedLandmarks']==0,'no invented registration');check(e['projectionRoundTripMaxM']<1e-6,'numerical projection closure')
        check(np.allclose(e['boundsXYM'],photo['boundsXYM'],rtol=0,atol=1e-7),'same footprint as source crop');check(CRS.from_wkt(e['crsWKT']).ellipsoid.semi_major_metre==1737400,'lunar sphere')
        check(e['width']==e['height'] and 4.9<min(e['pixelM'])<=max(e['pixelM'])<=5.01,'inspection resolution')
        for name,a in e['assets'].items():
            p=Path(a['url'][1:]);check(sha(p.read_bytes())==a['sha256'],'display checksum')
            with rasterio.open(p) as ds:
                check(ds.shape==(e['height'],e['width']) and ds.count==2,'display dimensions and alpha');mask=np.array(e['masks']['image' if name=='image' else 'terrain'],dtype='uint8').reshape(ds.shape)
                check(np.array_equal(ds.read(2)>0,mask>0),'click mask equals displayed mask')
        rows.append(dict(siteId=e['siteId'],grid=[e['height'],e['width']],pixelM=e['pixelM'],imageValidFraction=e['imageValidFraction'],projectionRoundTripMaxM=e['projectionRoundTripMaxM'],registrationStatus=e['registrationStatus']))
    report=dict(passed=True,checks=checks,entries=rows,scope='Asset/grid/provenance checks only. No landmark correspondences, physical registration accuracy or independent review are established.')
    Path('docs/registration-validation.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8');print(json.dumps(report,indent=2))

if __name__=='__main__':validate()
