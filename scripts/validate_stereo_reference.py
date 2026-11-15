"""Validate prepared stereo-reference provenance and unshifted height summaries."""
import hashlib,json
from pathlib import Path
import numpy as np
import rasterio
from rasterio.warp import reproject,Resampling
from stereo_reference import supported_cells,difference_summary

def validate():
    base=json.loads(Path('data/mission-data.json').read_text(encoding='utf-8'));ref=base['stereoReference'];raw=Path(ref['url'][1:]).read_bytes();r=json.loads(raw);checks=0
    def check(value,message):
        nonlocal checks
        if not value:raise ValueError(message)
        checks+=1
    sha=lambda raw:hashlib.sha256(raw).hexdigest()
    check(sha(raw)==ref['sha256'],'reference identity');check(r['processingCodeSha256']==sha(Path('scripts/prepare_stereo_reference.py').read_bytes()),'processing identity');check(r['methodCodeSha256']==sha(Path('scripts/stereo_reference.py').read_bytes()),'method identity')
    registration=json.loads(Path(base['registration']['url'][1:]).read_text());entry=next(e for e in registration['entries'] if e['siteId']==r['siteId'])
    check(r['imageContext']==entry['sourceImage'] and r['missionDEM']==entry['demSource'],'exact image and mission context');check(r['boundsXYM']==entry['boundsXYM'] and r['width']==entry['width'] and r['height']==entry['height'],'inspection footprint')
    check('/DATA/SDP/' in r['sources']['confidence']['url'] and r['sources']['confidence']['url'].endswith('_CONF.IMG'),'scientific confidence source rather than browse TIFF')
    for a in [*r['assets'].values(),r['native'],r['confidenceNative'],r['comparisonGrid']]:check(sha(Path(a['url'][1:]).read_bytes())==a['sha256'],'prepared asset checksum')
    with rasterio.open(r['native']['url'][1:]) as native,rasterio.open(r['confidenceNative']['url'][1:]) as confidence,rasterio.open(r['comparisonGrid']['url'][1:]) as grid:
        check(native.transform==confidence.transform and native.shape==confidence.shape and native.crs==confidence.crs,'native confidence and height grid alignment');check(native.res==(2.,2.) and native.dtypes==('float32',) and confidence.dtypes==('uint8',),'native data interpretation')
        codes=confidence.read(1);check({str(k):int((codes==int(k)).sum()) for k in r['nativeConfidenceCounts']}==r['nativeConfidenceCounts'],'native confidence counts')
        check(grid.count==3 and grid.shape==(r['height'],r['width']),'comparison bands');check(np.allclose(list(grid.bounds),r['boundsXYM'],rtol=0,atol=1e-7),'comparison bounds')
        heights,mission,fraction=grid.read();reconstructed=np.zeros(grid.shape,dtype='float32')
        reproject((codes==14).astype('float32'),reconstructed,src_transform=confidence.transform,src_crs=confidence.crs,dst_transform=grid.transform,dst_crs=grid.crs,resampling=Resampling.average)
        check(np.allclose(fraction,reconstructed,rtol=0,atol=1e-6),'successful-correlation area fraction');support=supported_cells(heights,mission,fraction);paired=np.isfinite(heights)&np.isfinite(mission)
        check(abs(float(support.mean())-r['strictCorrelationFraction'])<1e-12,'strict cell fraction');check(abs(float(paired.mean())-r['pairedFraction'])<1e-12,'paired coverage')
        for name,mask in [('strictDifference',support),('allPairedDifference',paired)]:
            actual=difference_summary(heights,mission,mask)
            for k,v in actual.items():check(v==r[name][k] if v is None else abs(v-r[name][k])<1e-9,'unshifted '+name+' '+k)
        for name,a in r['assets'].items():
            with rasterio.open(a['url'][1:]) as ds:check(ds.shape==grid.shape and ds.count==(4 if name=='confidence' else 2),'display grid and alpha')
        audit=r['landmarkAudit'];check(sha(Path(audit['input']['url'][1:]).read_bytes())==audit['input']['sha256'],'historical audit input identity')
        for p in audit['points']:
            check(p['accepted'] is False,'audit does not accept a correspondence')
            for s in p['samples']:
                code=int(next(confidence.sample([s['xy']]))[0]);z=next(native.sample([s['xy']],masked=True))[0];usable=not np.ma.is_masked(z) and np.isfinite(z) and z>-1e30
                check(code==s['confidenceCode'],'recorded landmark source code');check(bool(usable)==s['stereoElevationAvailable'],'recorded landmark height support')
        # Full originals are optional for a portable derived-data validation.
        original=Path('data/raw/imagery/reference/NAC_DTM_ESALL_SR12.TIF');original_conf=Path('data/raw/imagery/reference/NAC_DTM_ESALL_SR12_CONF.IMG')
        if original.exists() and original_conf.exists():
            for p,d,prepared in [(original,r['sources']['dtm'],native),(original_conf,r['sources']['confidence'],confidence)]:
                check(sha(p.read_bytes())==d['sha256'],'full source identity')
                with rasterio.open(p) as source:check(np.array_equal(source.read(1,window=source.window(*prepared.bounds)),prepared.read(1)),'native source values retained')
    report=dict(passed=True,checks=checks,sourceConfidenceFormat='PDS3 attached IMG, original categories',strictCorrelationFraction=r['strictCorrelationFraction'],unshiftedDifference=r['strictDifference'],registrationEstablished=False,scope='Checks derived pixels, confidence support, source identities and unshifted height differences. Shared control, manual selection error and image-to-terrain registration remain unresolved.')
    Path('docs/stereo-reference-validation.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8');print(json.dumps(report,indent=2))

if __name__=='__main__':validate()
