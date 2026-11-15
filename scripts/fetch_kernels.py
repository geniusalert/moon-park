"""Download only named public NAIF kernels and retain content hashes."""
import hashlib
import json
from pathlib import Path
from urllib.request import urlopen

BASE='https://naif.jpl.nasa.gov/pub/naif/generic_kernels/'
KERNELS=['lsk/naif0012.tls','spk/planets/a_old_versions/de421.bsp','pck/moon_pa_de421_1900-2050.bpc','fk/satellites/moon_080317.tf']

def acquire():
    root=Path('data/raw/kernels');root.mkdir(parents=True,exist_ok=True)
    manifest=[]
    for key in KERNELS:
        url=BASE+key;path=root/Path(key).name
        if not path.exists():
            with urlopen(url,timeout=60) as response:
                with path.with_suffix(path.suffix+'.part').open('wb') as out:
                    while chunk:=response.read(1024*1024):out.write(chunk)
            path.with_suffix(path.suffix+'.part').replace(path)
        manifest.append(dict(url=url,path=str(path),sha256=hashlib.sha256(path.read_bytes()).hexdigest()))
        print(path.name,path.stat().st_size,flush=True)
    (root/'manifest.json').write_text(json.dumps(manifest,indent=2))
    return manifest

if __name__=='__main__':acquire()
