"""Generate fine-cadence seasonal observations for retained terrain benchmarks."""
import datetime as dt,json
from pathlib import Path
import spiceypy as spice
from prepare_spice import observe
data=json.loads(Path('data/mission-data.json').read_text())
for kernel in json.loads(Path('data/raw/kernels/manifest.json').read_text()):spice.furnsh(kernel['path'])
cases=[]
for site in data['sites']:
 for month,day in [(3,20),(6,21),(9,22),(12,21)]:
  start=dt.datetime(2027,month,day,tzinfo=dt.timezone.utc)
  series={target:[] for target in ['sun','earth']}
  for minute in range(24*60+1):
   utc=(start+dt.timedelta(minutes=minute)).isoformat().replace('+00:00','Z')
   for name in series:series[name].append(observe(name.upper(),utc,site['longitude'],site['latitude'],site['groundM']+2))
  cases.append(dict(siteId=site['id'],series=series))
Path('docs/seasonal-cadence-observations.json').write_text(json.dumps(cases,separators=(',',':')))
spice.kclear()
