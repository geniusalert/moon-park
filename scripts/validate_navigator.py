"""Verify real navigator jobs through the loopback API; no fabricated responses."""
import json,time,urllib.request,platform,hashlib
from pathlib import Path
BASE='http://127.0.0.1:4176'
def api(path,body=None,method=None):
 data=None if body is None else json.dumps(body).encode()
 req=urllib.request.Request(BASE+path,data=data,method=method,headers={'Content-Type':'application/json'})
 with urllib.request.urlopen(req,timeout=60) as r:return json.load(r)
def job(lon,lat,start='2027-01-01T00:00:00Z',duration=1,delay=0):
 request=dict(longitude=lon,latitude=lat,startUTC=start,duration=duration,delay=delay,height=2)
 record=api('/api/jobs',request);began=time.monotonic()
 while record['status'] not in ['completed','failed','cancelled']:
  time.sleep(.5);record=api('/api/jobs/'+record['id'])
 if record['status']!='completed':raise RuntimeError(str(record))
 result=api('/api/results/'+record['resultId']);site=result['site'];assert site['latitude']==lat
 assert all(r['coverageM']==180000 for r in site['profiles']['2'])
 report=dict(request=request,resultId=record['resultId'],siteId=site['id'],groundResolutionM=site['provenance']['groundResolutionM'],groundM=site['groundM'],horizonHash=hashlib.sha256(json.dumps(site['profiles'],sort_keys=True).encode()).hexdigest(),observations=[site['ephemerides']['sun'][0]['utc'],site['ephemerides']['sun'][-1]['utc']],performance=result['performance'],wallSeconds=time.monotonic()-began)
 print(json.dumps(report),flush=True);return report
if __name__=='__main__':
 report=dict(machine=dict(system=platform.platform(),processor=platform.processor()),cases=[],status='in-progress')
 out=Path('docs/navigator-custom-verification.json')
 # Different regions, cap edge at multiple longitudes, exact pole, original fine coverage.
 coords=[(0,-87.5),(90,-86.5),(0,-90)]+[(v,-85) for v in range(-180,180,45)]
 base=json.loads(Path('data/mission-data.json').read_text(encoding='utf-8'))
 coords += [(s['longitude'],s['latitude']) for s in base['sites']]
 for lon,lat in coords:
  report['cases'].append(job(lon,lat));out.write_text(json.dumps(report,indent=2))
 # Separate seasons and latest supported arrival with complete recovery interval.
 for start,duration,delay in [('2027-06-21T12:00:00Z',72,48),('2027-12-31T23:50:00Z',168,72)]:
  report['cases'].append(job(0,-87.5,start,duration,delay));out.write_text(json.dumps(report,indent=2))
 cached=job(0,-87.5);assert cached['performance']['horizonCacheHit'] and cached['performance']['observationCacheHit'];report['cached']=cached
 assert report['cases'][0]['horizonHash']!=report['cases'][1]['horizonHash']
 assert report['cases'][-1]['observations'][-1]>='2028-01-14T00:00:00Z'
 # Cancellation is terminal even if a worker response arrives later.
 r=api('/api/jobs',dict(longitude=30,latitude=-87,startUTC='2027-02-01T00:00:00Z',duration=1,delay=0,height=2));api('/api/jobs/'+r['id'],method='DELETE');time.sleep(.5);assert api('/api/jobs/'+r['id'])['status']=='cancelled';report['cancelledJobVerified']=True
 report['status']='passed';out.write_text(json.dumps(report,indent=2));print('REAL NAVIGATOR CHECKS PASSED',flush=True)
