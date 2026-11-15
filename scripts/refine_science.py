"""Recompute one-minute geometry and quantify pinned lunar-frame displacements."""
import argparse,datetime as dt,json,math
from pathlib import Path
import spiceypy as spice
from prepare_spice import observe
parser=argparse.ArgumentParser()
parser.add_argument('--site',default='Site01')
parser.add_argument('--hours',type=int,default=24)
parser.add_argument('--output',default='docs/scientific-refinement.json')
args=parser.parse_args()
if not 1<=args.hours<=744:parser.error('hours must be 1–744')
data=json.loads(Path('data/mission-data.json').read_text())
site=next(s for s in data['sites'] if s['id']==args.site)
kernels=json.loads(Path('data/raw/kernels/manifest.json').read_text())
for kernel in kernels:spice.furnsh(kernel['path'])
start=dt.datetime.fromisoformat(site['ephemerides']['sun'][0]['utc'].replace('Z','+00:00'))
rows=[]
for minute in range(args.hours*60+1):
 utc=(start+dt.timedelta(minutes=minute)).isoformat().replace('+00:00','Z')
 sun=observe('SUN',utc,site['longitude'],site['latitude'],site['groundM']+2)
 earth=observe('EARTH',utc,site['longitude'],site['latitude'],site['groundM']+2)
 rows.append(dict(utc=utc,sun=sun,earth=earth))
frames=[]
lon,lat=map(math.radians,[site['longitude'],site['latitude']])
position=spice.latrec(1737.4+site['groundM']/1000,lon,lat)
for source in ['MOON_PA','MOON_ME']:
 converted=spice.mxv(spice.pxform(source,'MOON_ME',spice.str2et(rows[0]['utc'])),position)
 frames.append(dict(sourceFrame=source,targetFrame='MOON_ME',displacementM=float(spice.vnorm(converted-position)*1000)))
Path(args.output).write_text(json.dumps(dict(siteId=site['id'],kernels=kernels,frameDisplacements=frames,rows=rows,scope='Frame differences are hypothetical interpretations of identical numeric coordinates. Unknown catalogue source frames remain unresolved.'),separators=(',',':')))
spice.kclear()
