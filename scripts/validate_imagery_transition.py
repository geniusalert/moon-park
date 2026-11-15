"""Check completed crop acquisition against the exact prior partial release."""
import hashlib,json,zipfile
from pathlib import Path
import numpy as np
import rasterio
from rasterio.io import MemoryFile

def validate():
    previous=Path('release/moon-park-research-v0.9.zip');metadata_path='data/imagery/de-gerlache-context.source.json';native_path='data/imagery/de-gerlache-context-native.tif';checks=0
    def check(value,message):
        nonlocal checks
        if not value:raise ValueError(message)
        checks+=1
    with zipfile.ZipFile(previous) as archive:
        old=json.loads(archive.read(metadata_path));new=json.loads(Path(metadata_path).read_text(encoding='utf-8'))
        check(old['acquisitionIncomplete'] is True and not new.get('acquisitionIncomplete',False),'partial-to-complete acquisition evidence')
        check(old['source']['url']==new['source']['url'] and old['source']['identityETag']==new['source']['identityETag'],'same original image and ETag')
        old_ranges={(p['start'],p['end']):p['sha256'] for p in old['source']['retainedRanges']};new_ranges={(p['start'],p['end']):p['sha256'] for p in new['source']['retainedRanges']}
        check(all(new_ranges.get(k)==v for k,v in old_ranges.items()),'previous retained ranges preserved byte-for-byte')
        check(new['source']['fullFileSha256'] is None,'no complete-master-file hash claim')
        with MemoryFile(archive.read(native_path)) as memory,memory.open() as prior,rasterio.open(native_path) as current:
            check(prior.shape==current.shape and prior.transform==current.transform and prior.crs==current.crs,'unchanged crop geometry')
            a=prior.read(1,masked=True);b=current.read(1,masked=True);old_mask=~np.ma.getmaskarray(a);new_mask=~np.ma.getmaskarray(b)
            check(np.all(new_mask[old_mask]),'no formerly valid pixels lost')
            check(np.array_equal(a.data[old_mask],b.data[old_mask]),'all prior available pixels unchanged')
            gained=int((new_mask&~old_mask).sum());check(gained>0,'new native source coverage added')
            old_count=int(old_mask.sum());new_count=int(new_mask.sum())
        prior_data=json.loads(archive.read('data/mission-data.json'));current_data=json.loads(Path('data/mission-data.json').read_text(encoding='utf-8'))
        check(prior_data['sites']==current_data['sites'],'scientific benchmark arrays unchanged');check(prior_data['candidates']==current_data['candidates'],'candidate evidence unchanged')
    report=dict(passed=True,checks=checks,previousArchive=previous.name,previousArchiveSha256=hashlib.sha256(previous.read_bytes()).hexdigest(),previousValidPixels=old_count,currentValidPixels=new_count,newlyAvailablePixels=gained,priorPixelsUnchanged=True,previousRetainedBlocks=len(old_ranges),currentRetainedBlocks=len(new_ranges),networkBytesThisRun=new['source']['networkBytesThisRun'],sourceFullBytes=new['source']['fullFileBytes'],scope='Completeness and retained-byte transition for the requested context crop. The full master file was not downloaded; registration is not established.')
    Path('docs/imagery-transition-v0.10.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8');print(json.dumps(report,indent=2))

if __name__=='__main__':validate()
