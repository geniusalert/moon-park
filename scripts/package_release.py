"""Package a local research release without credentials, caches or node_modules."""
import hashlib,json,zipfile
from pathlib import Path

def build(candidate=False):
    root=Path.cwd();base=json.loads(Path('data/mission-data.json').read_text(encoding='utf-8'));files=set()
    for folder in ['src','scripts','tests','docs']:
        files.update(p for p in Path(folder).rglob('*') if p.is_file() and '__pycache__' not in p.parts)
    files.update(Path(p) for p in ['index.html','plan.md','README.md','package.json','package-lock.json','requirements.txt','.gitignore','data/mission-data.json','data/sample-decision-receipt.json'])
    files.add(Path('.env.example'))
    files.update(Path('data').glob('*.json'))
    files.update(p for p in Path('data/models').rglob('*') if p.is_file())
    files.update(p for p in Path('data/globe').rglob('*') if p.is_file())
    files.update(p for p in Path('data/imagery').rglob('*') if p.is_file())
    files.update(p for p in Path('data/registration').rglob('*') if p.is_file())
    # Include every directly referenced immutable artifact, plus canonical aliases for tests.
    for key in ['spatial','uncertainty','candidates']:files.add(Path(base[key]['url'][1:]))
    for alias in ['spatial.json','terrain-variants.json','candidates.json']:files.add(Path('data')/alias)
    manifest=json.loads(Path(base['candidates']['url'][1:]).read_text())
    files.update(Path(p['url'][1:]) for r in manifest['regions'] for p in r['points'])
    checksums={p.as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(files)}
    Path('release').mkdir(exist_ok=True);version='.'.join(json.loads(Path('package.json').read_text())['version'].split('.')[:2]);out=Path(f'release/moon-park-navigator-v{version}'+('-candidate' if candidate else '')+'.zip')
    with zipfile.ZipFile(out,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=7) as z:
        for p in sorted(files):z.write(p,p.as_posix())
        z.writestr('release-manifest.json',json.dumps(dict(files=checksums,scope='Local research/demo release; eligibility, operational certification and independent review are not asserted'),indent=2))
    with zipfile.ZipFile(out) as z:
        assert z.testzip() is None
        for p,want in checksums.items():assert hashlib.sha256(z.read(p)).hexdigest()==want,p
        assert not any('data/raw/' in p or 'node_modules/' in p for p in z.namelist())
    report=dict(path=str(out),files=len(files),bytes=out.stat().st_size,sha256=hashlib.sha256(out.read_bytes()).hexdigest(),verified=True)
    Path('release/'+('candidate-package-evidence.json' if candidate else 'package-evidence.json')).write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
if __name__=='__main__':
    import argparse
    parser=argparse.ArgumentParser();parser.add_argument('--candidate',action='store_true');build(parser.parse_args().candidate)
