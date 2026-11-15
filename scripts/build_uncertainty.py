"""Reproduce the conditional uncertainty milestone on an existing science build."""
import json
from pathlib import Path
import shutil
import subprocess
import sys

node=shutil.which('node')
dataset=json.loads(Path('data/mission-data.json').read_text(encoding='utf-8'))
if not all('rangeKm' in s['ephemerides']['sun'][0] for s in dataset['sites']):
    subprocess.run([sys.executable,'scripts/prepare_spice.py'],check=True)
for command in [[sys.executable,'scripts/fetch_clones.py'],[sys.executable,'scripts/prepare_variants.py'],[sys.executable,'scripts/refine_uncertainty.py'],[node,'scripts/validate_uncertainty.mjs'],[sys.executable,'scripts/stamp_build.py']]:
    print('Running',command[-1],flush=True);subprocess.run(command,check=True)
