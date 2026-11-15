"""Real global jobs and source-retained Horizons checks; no terrain claims."""
import datetime as dt,hashlib,json,time,urllib.request,sys,os
from pathlib import Path
from urllib.parse import urlencode
sys.path.insert(0,str(Path(__file__).parent))
from prepare_ephemerides import parse
from prepare_spice import observe
import spiceypy as spice
BASE=os.environ.get('MOON_PARK_TEST_URL','http://127.0.0.1:4173')
def api(path,body=None,method=None):
 req=urllib.request.Request(BASE+path,data=None if body is None else json.dumps(body).encode(),method=method,headers={'Content-Type':'application/json'})
 with urllib.request.urlopen(req,timeout=60) as response:return json.load(response)
def job(latitude,longitude):
 request=dict(latitude=latitude,longitude=longitude,startUTC='2027-01-01T00:00:00Z',duration=72,delay=48,height=2,analysisModel='reference-sphere');record=api('/api/jobs',request)
 while record['status'] not in ['completed','failed','cancelled']:
  time.sleep(.3);record=api('/api/jobs/'+record['id'])
 if record['status']!='completed':raise RuntimeError(record)
 result=api('/api/results/'+record['resultId']);assert result['site']['analysisModel']=='reference-sphere';assert result['site']['latitude']==latitude;assert abs(result['site']['longitude']-longitude)<1e-9;assert result['site']['groundM']==0;assert not result['site']['provenance']['sources']
 return request,record,result
if __name__=='__main__':
 for kernel in json.loads(Path('data/raw/kernels/manifest.json').read_text()):spice.furnsh(kernel['path'])
 report=dict(date='2026-11-13',status='in-progress',scope='Source-identified JPL observations on a reference sphere, cross-checked with SPICE; no terrain, actual power/RF or mission suitability result.',cases=[]);out=Path('docs/mission-global-verification.json');rawdir=Path('data/raw/mission-reference');rawdir.mkdir(parents=True,exist_ok=True)
 for name,latitude,longitude in [('Apollo 11',.67416,23.47314),("Chang’e 4",-45.4561,177.5885),('IM-3 Reiner Gamma regional reference',7.39,-58.96)]:
  request,record,result=job(latitude,longitude);site=result['site'];case=dict(name=name,request=request,resultId=record['resultId'],performance=result['performance'],provider=site.get('ephemerisProvenance'),references=[])
  for target,key in [('10','sun'),('399','earth')]:
   params=dict(format='json',COMMAND=f"'{target}'",OBJ_DATA="'NO'",MAKE_EPHEM="'YES'",EPHEM_TYPE="'OBSERVER'",CENTER="'coord@301'",COORD_TYPE="'GEODETIC'",SITE_COORD=f"'{longitude},{latitude},0.002'",START_TIME="'2027-01-01'",STOP_TIME="'2027-01-03'",STEP_SIZE="'24 h'",QUANTITIES="'4'",CSV_FORMAT="'YES'",ELEV_CUT="'-90'",APPARENT="'AIRLESS'",TIME_TYPE="'UT'")
   url='https://ssd.jpl.nasa.gov/api/horizons.api?'+urlencode(params);path=rawdir/(hashlib.sha256(url.encode()).hexdigest()+'.json')
   if path.exists():raw=path.read_bytes()
   else:
    with urllib.request.urlopen(url,timeout=60) as response:raw=response.read()
    path.write_bytes(raw)
   reference=parse(raw,step_minutes=1440);observations={r['utc']:r for r in site['ephemerides'][key]};residuals=[dict(utc=r['utc'],azimuthDeg=(observations[r['utc']]['az']-r['az']+180)%360-180,elevationDeg=observations[r['utc']]['el']-r['el']) for r in reference];maximum=max(abs(r['elevationDeg']) for r in residuals);assert maximum<.001,maximum
   spice_residuals=[]
   for row in reference:
    observed=observations[row['utc']];cross=observe('SUN' if key=='sun' else 'EARTH',row['utc'],longitude,latitude,2);spice_residuals.append(dict(utc=row['utc'],azimuthDeg=(observed['az']-cross['az']+180)%360-180,elevationDeg=observed['el']-cross['el']))
   spice_maximum=max(abs(r['elevationDeg']) for r in spice_residuals);assert spice_maximum<.001,spice_maximum
   case['references'].append(dict(target=key,parameters=params,url=url,sha256=hashlib.sha256(raw).hexdigest(),residuals=residuals,maxElevationDifferenceDeg=maximum,spiceResiduals=spice_residuals,maxSPICEElevationDifferenceDeg=spice_maximum,toleranceDeg=.001))
  report['cases'].append(case);out.write_text(json.dumps(report,indent=2),encoding='utf-8');print('Global reference check passed:',name,flush=True)
 _,record,result=job(.67416,23.47314);assert result['performance']['observationCacheHit'];report['cached']=dict(resultId=record['resultId'],performance=result['performance'])
 cancelled=api('/api/jobs',dict(latitude=3,longitude=17,startUTC='2027-03-01T00:00:00Z',duration=72,delay=48,height=2,analysisModel='reference-sphere'));api('/api/jobs/'+cancelled['id'],method='DELETE');assert api('/api/jobs/'+cancelled['id'])['status']=='cancelled';report['cancellationVerified']=True;report['status']='passed';out.write_text(json.dumps(report,indent=2),encoding='utf-8')
 print('Global mission checks passed',flush=True)
