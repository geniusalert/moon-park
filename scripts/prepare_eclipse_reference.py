"""Retain apparent geometry around a NASA catalogued total lunar eclipse."""
import datetime as dt,json
from pathlib import Path
import spiceypy as spice
from prepare_spice import observe
for k in json.loads(Path('data/raw/kernels/manifest.json').read_text()):spice.furnsh(k['path'])
start=dt.datetime(2025,9,7,16,tzinfo=dt.timezone.utc)
rows=[]
for minute in range(0,241,5):
 utc=(start+dt.timedelta(minutes=minute)).isoformat().replace('+00:00','Z')
 rows.append(dict(utc=utc,sun=observe('SUN',utc,0,0,2),earth=observe('EARTH',utc,0,0,2)))
Path('docs/eclipse-reference-observations.json').write_text(json.dumps(dict(source='https://eclipse.gsfc.nasa.gov/LEdecade/LEdecade2021.html',reference='2025-09-07 total lunar eclipse; greatest eclipse 18:12:58 TD. Samples use UTC; this check verifies occurrence, not contact timing.',rows=rows)))
spice.kclear()
