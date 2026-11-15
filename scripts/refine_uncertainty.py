"""Direct one-minute SPICE observations for a bounded transition-heavy case."""
import datetime as dt
import json
from pathlib import Path
import spiceypy as spice
from prepare_spice import acquire,observe

dataset=json.loads(Path('data/mission-data.json').read_text(encoding='utf-8'))
site=next(s for s in dataset['sites'] if s['id']=='Site04')
for kernel in acquire():spice.furnsh(kernel['path'])
start=dt.datetime(2026,11,23,tzinfo=dt.timezone.utc)
observations={}
for name,target in [('sun','SUN'),('earth','EARTH')]:
    observations[name]=[observe(target,(start+dt.timedelta(minutes=i)).isoformat().replace('+00:00','Z'),site['longitude'],site['latitude'],site['groundM']+2) for i in range(4321)]
    print('One-minute',name,'complete',flush=True)
Path('data/uncertainty-fine-case.json').write_text(json.dumps(dict(siteId=site['id'],context=dict(longitude=site['longitude'],latitude=site['latitude'],groundM=site['groundM'],frame='MOON_ME_DE421'),startUTC='2026-11-21T00:00:00Z',delayHours=48,heightM=2,observationStepMinutes=1,ephemerides=observations),separators=(',',':')),encoding='utf-8')
spice.kclear()
