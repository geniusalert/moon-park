"""Attach exact current source-file hashes to the reproducible data artifact."""
import hashlib
import json
from pathlib import Path

def stamp():
    path=Path('data/mission-data.json')
    dataset=json.loads(path.read_text(encoding='utf-8'))
    files=sorted([*Path('src').rglob('*.js'),*Path('src').glob('*.css'),*Path('scripts').glob('*.py'),*Path('scripts').glob('*.mjs'),Path('requirements.txt'),Path('package.json'),Path('package-lock.json'),Path('src/vendor/THREE-LICENSE.txt'),Path('index.html'),Path('workbench.html')])
    files.extend([Path('src/vendor/manifest.json'),Path('pilot.html'),Path('registration.html')])
    files.extend(sorted(Path('docs/demo').glob('*.js')))
    files.extend([Path('docs/demo/index.html'),Path('docs/demo/style.css')])
    files.extend(sorted(Path('docs/landmark-review').glob('*.py')))
    globe=Path('data/globe/manifest.json')
    if globe.exists():dataset['globe']={'url':'/data/globe/manifest.json','sha256':hashlib.sha256(globe.read_bytes()).hexdigest()}
    dataset['software']={p.as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in files}
    path.write_text(json.dumps(dataset,allow_nan=False,separators=(',',':')),encoding='utf-8')
    print('Stamped',len(files),'source files')

if __name__=='__main__':stamp()
