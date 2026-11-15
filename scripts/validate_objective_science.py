"""Retain new objective evidence without replacing earlier release reports."""
import datetime as dt,hashlib,json,time,urllib.request,sys
from pathlib import Path
from urllib.parse import urlencode
sys.path.insert(0,str(Path(__file__).parent))
from prepare_ephemerides import parse
BASE='http://127.0.0.1:4173'
def api(path,body=None):
 req=urllib.request.Request(BASE+path,data=None if body is None else json.dumps(body).encode(),headers={'Content-Type':'application/json'})
 with urllib.request.urlopen(req,timeout=60) as r:return json.load(r)
def run_job(lon,lat,start):
 req=dict(longitude=lon,latitude=lat,startUTC=start,duration=72,delay=48,height=2)
 began=time.monotonic();record=api('/api/jobs',req)
 while record['status'] not in ['completed','failed','cancelled']:
  time.sleep(.5);record=api('/api/jobs/'+record['id'])
 if record['status']!='completed':raise RuntimeError(str(record))
 result=api('/api/results/'+record['resultId'])
 return dict(request=req,resultId=record['resultId'],wallSeconds=time.monotonic()-began,performance=result['performance']),result['site']
def main():
 report=dict(date='2026-11-13',status='in-progress',interpretation='Cross-method implementation checks share JPL inputs; residuals are not absolute physical accuracy.',cases=[])
 out=Path('docs/navigator-objective-science.json');rawdir=Path('data/raw/objective-reference');rawdir.mkdir(parents=True,exist_ok=True)
 for lon,lat,start in [(0,-87.5,'2027-01-01T00:00:00Z'),(90,-86.5,'2027-06-21T12:00:00Z')]:
  case,site=run_job(lon,lat,start);case['references']=[];case['completeHorizon']=all(p['coverageM']==180000 for p in site['profiles']['2']);assert case['completeHorizon']
  stop=(dt.datetime.fromisoformat(start.replace('Z','+00:00'))+dt.timedelta(days=2)).strftime('%Y-%m-%d %H:%M')
  for target,name in [('10','sun'),('399','earth')]:
   params=dict(format='json',COMMAND=f"'{target}'",OBJ_DATA="'NO'",MAKE_EPHEM="'YES'",EPHEM_TYPE="'OBSERVER'",CENTER="'coord@301'",COORD_TYPE="'GEODETIC'",SITE_COORD=f"'{lon},{lat},{(site['groundM']+2)/1000}'",START_TIME="'"+start[:16].replace('T',' ')+"'",STOP_TIME=f"'{stop}'",STEP_SIZE="'24 h'",QUANTITIES="'4'",CSV_FORMAT="'YES'",ELEV_CUT="'-90'",APPARENT="'AIRLESS'",TIME_TYPE="'UT'")
   url='https://ssd.jpl.nasa.gov/api/horizons.api?'+urlencode(params);path=rawdir/(hashlib.sha256(url.encode()).hexdigest()+'.json')
   if path.exists():raw=path.read_bytes()
   else:
    with urllib.request.urlopen(url,timeout=60) as response:raw=response.read()
    path.write_bytes(raw)
   rows=parse(raw,step_minutes=1440);observations={r['utc']:r for r in site['ephemerides'][name]};diff=[]
   for r in rows:
    actual=observations[r['utc']];diff.append(dict(utc=r['utc'],azimuthDeg=(actual['az']-r['az']+180)%360-180,elevationDeg=actual['el']-r['el']))
   maximum=max(abs(d['elevationDeg']) for d in diff);assert maximum<.001,(name,maximum)
   case['references'].append(dict(target=name,url=url,sha256=hashlib.sha256(raw).hexdigest(),parameters=params,residuals=diff,maxElevationDifferenceDeg=maximum,checkToleranceDeg=.001))
  report['cases'].append(case);out.write_text(json.dumps(report,indent=2),encoding='utf-8');print('Reference case complete',lon,lat,flush=True)
 cached,_=run_job(0,-87.5,'2027-01-01T00:00:00Z');report['cached']=cached
 report['status']='passed';out.write_text(json.dumps(report,indent=2),encoding='utf-8');print('Objective scientific reference checks passed',flush=True)
if __name__=='__main__':main()
