"""Build cached observation tables at the actual terrain-derived research points."""
import csv
import datetime as dt
import hashlib
import json
import math
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import urlopen

MONTHS={x:i+1 for i,x in enumerate(['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'])}

def parse(raw,step_minutes=10):
    if not isinstance(step_minutes,(int,float)) or not math.isfinite(step_minutes) or step_minutes<=0: raise ValueError("Invalid expected Horizons cadence")
    payload=json.loads(raw)
    if payload.get('error'): raise ValueError('Horizons error: '+str(payload['error']))
    text=payload.get('result','')
    if '$$SOE' not in text or '$$EOE' not in text: raise ValueError('Missing Horizons observation boundaries')
    body=text.split('$$SOE')[1].split('$$EOE')[0].strip()
    result=[]
    for row in csv.reader(body.splitlines()):
        date, time=row[0].strip().split();year,month,day=date.split('-')
        timestamp=f'{year}-{MONTHS[month]:02}-{day}T{time}'+(':00Z' if time.count(':')==1 else 'Z')
        az,el=float(row[3]),float(row[4])
        if not math.isfinite(az) or not math.isfinite(el) or not 0<=az<=360 or not -90<=el<=90: raise ValueError('Invalid coordinates')
        if result and dt.datetime.fromisoformat(timestamp)-dt.datetime.fromisoformat(result[-1]['utc'])!=dt.timedelta(minutes=step_minutes): raise ValueError('Horizons grid must be continuous at the requested interval')
        result.append(dict(utc=timestamp,az=az%360,el=el))
    if len(result)<2: raise ValueError('Insufficient observations')
    return result

def build():
    terrain=json.loads(Path('data/terrain.json').read_text(encoding='utf-8'))
    Path('data/raw').mkdir(parents=True,exist_ok=True)
    for site in terrain:
        site['ephemerides']={}; site['ephemerisProvenance']={}
        for target,name in [('10','sun'),('399','earth')]:
            params=dict(format='json',COMMAND=f"'{target}'",OBJ_DATA="'NO'",MAKE_EPHEM="'YES'",EPHEM_TYPE="'OBSERVER'",CENTER="'coord@301'",COORD_TYPE="'GEODETIC'",SITE_COORD=f"'{site['longitude']},{site['latitude']},{(site['groundM']+2)/1000}'",START_TIME="'2026-11-14'",STOP_TIME="'2026-12-14'",STEP_SIZE="'10 m'",QUANTITIES="'4'",CSV_FORMAT="'YES'",ELEV_CUT="'-90'",APPARENT="'AIRLESS'",TIME_TYPE="'UT'")
            url='https://ssd.jpl.nasa.gov/api/horizons.api?'+urlencode(params)
            path=Path(f'data/raw/{site["id"]}-{name}.json')
            request_path=path.with_suffix('.request.json')
            cached_request=json.loads(request_path.read_text()) if request_path.exists() else None
            if path.exists() and cached_request==params: raw=path.read_bytes()
            else:
                with urlopen(url,timeout=60) as response: raw=response.read()
                payload=json.loads(raw)
                if payload.get('error') or '$$SOE' not in payload.get('result',''): raise ValueError(payload)
                path.write_bytes(raw)
                request_path.write_text(json.dumps(params,indent=2))
            site['ephemerides'][name]=parse(raw)
            site['ephemerisProvenance'][name]=dict(url=url,sha256=hashlib.sha256(raw).hexdigest(),parameters=params,signature=json.loads(raw).get('signature'),observerHeightM=2,frame='Horizons MEAN_ME; DE441 response; DE421 terrain alignment unvalidated')
            print(site['id'],name,len(site['ephemerides'][name]),flush=True)
    output=dict(schemaVersion=2,generatedAt=dt.datetime.now(dt.timezone.utc).isoformat(),status='real-data-local-terrain-experimental',startUTC='2026-11-14T00:00:00Z',endUTC='2026-12-14T00:00:00Z',sites=terrain)
    Path('data/mission-data.json').write_text(json.dumps(output,allow_nan=False,separators=(',',':')),encoding='utf-8')

if __name__=='__main__': build()
