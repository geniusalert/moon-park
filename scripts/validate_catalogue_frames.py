"""Retain authoritative frame statements and verify catalogue numeric coordinates."""
import hashlib,json,subprocess
from pathlib import Path
from bs4 import BeautifulSoup
source_dir=Path('data/raw/catalogue')
source_dir.mkdir(parents=True,exist_ok=True)
urls={'nssdca-artifacts.html':'https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_artifact_impacts.html',
      'usgs-4987.html':'https://planetarynames.wr.usgs.gov/Feature/4987',
      'usgs-16070.html':'https://planetarynames.wr.usgs.gov/Feature/16070'}
for name,url in urls.items():
 target=source_dir/name
 if not target.exists():
  temporary=target.with_suffix('.download')
  subprocess.run(['curl.exe','--fail','--silent','--show-error','--location','--max-time','60',url,'--output',str(temporary)],check=True)
  temporary.replace(target)
raw=(source_dir/'nssdca-artifacts.html').read_bytes()
soup=BeautifulSoup(raw,'html.parser')
assert 'Coordinates based on DE 421 mean Earth/polar rotation axis reference frame' in soup.get_text(' ',strip=True)
coordinates=[]
for row in soup.find_all('tr'):
 cells=row.find_all(['td','th'])
 if len(cells)<5:continue
 try:
  lat,lon=[float(v.strip()) for v in cells[4].get_text().split(',')]
  coordinates.append((lat,(lon+180)%360-180))
 except ValueError:pass
records=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {MISSION_SITES} from './src/mission-catalogue.js';console.log(JSON.stringify(MISSION_SITES))"],text=True,encoding='utf-8'))
for feature in [4987,16070]:
 control=BeautifulSoup(Path(f'data/raw/catalogue/usgs-{feature}.html').read_bytes(),'html.parser')
 selected=control.select('select#selected_control_net option[selected]')
 if selected:
  assert selected[0].get('label')=='LOLA 2011'
 else:
  element=control.find(id='selected_control_net')
  assert element is not None and 'LOLA 2011' in element.parent.get_text(' ',strip=True)
cases=[]
for record in records:
 meta=record['coordinateMetadata']
 matched=None
 if meta['status']=='source-confirmed':
  matched=any(abs(lat-record['latitude'])<1e-7 and abs(lon-record['longitude'])<1e-7 for lat,lon in coordinates)
  if not matched:raise ValueError('NASA coordinate mismatch: '+record['id'])
 cases.append(dict(id=record['id'],latitude=record['latitude'],longitude=record['longitude'],metadata=meta,nasaNumericCoordinatesMatched=matched))
Path('docs/catalogue-frame-verification.json').write_text(json.dumps(dict(sourceHTMLSha256=hashlib.sha256(raw).hexdigest(),sourceURL='https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_artifact_impacts.html',cases=cases,limitations=['Identity frame transformation does not imply perfect coordinate geolocation.','USGS regional references use the selected LOLA 2011 control network.','Unpublished coordinates remain unavailable.']),indent=2))
print(sum(c['nasaNumericCoordinatesMatched'] is True for c in cases),'NASA coordinates matched;',sum(c['metadata']['status']=='control-network-matched' for c in cases),'LOLA 2011 region references')
