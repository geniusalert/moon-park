"""Cached live JPL Horizons airless lunar observer tables."""
import csv,datetime as dt,hashlib,io,json,math,re
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import urlopen
AU_KM=149597870.7

def fetch_observations(target,lon,lat,altitude_m,times,store):
    if len(times)<2:raise ValueError('Observation coverage requires at least two timestamps')
    instants=[dt.datetime.fromisoformat(t.replace('Z','+00:00')) for t in times]
    cadence=(instants[1]-instants[0]).total_seconds()/60
    if cadence not in [1,10] or any((b-a).total_seconds()!=cadence*60 for a,b in zip(instants,instants[1:])):raise ValueError('Observation coverage must use a uniform one- or ten-minute grid')
    params=dict(format='json',COMMAND=f"'{target}'",OBJ_DATA="'NO'",MAKE_EPHEM="'YES'",EPHEM_TYPE="'OBSERVER'",CENTER="'coord@301'",COORD_TYPE="'GEODETIC'",SITE_COORD=f"'{lon},{lat},{altitude_m/1000}'",START_TIME="'"+times[0].replace('T',' ').rstrip('Z')+"'",STOP_TIME="'"+times[-1].replace('T',' ').rstrip('Z')+"'",STEP_SIZE="'"+str(int(cadence))+" m'",QUANTITIES="'4,20'",CSV_FORMAT="'YES'",ELEV_CUT="'-90'",APPARENT="'AIRLESS'",TIME_TYPE="'UT'",CAL_FORMAT="'CAL'",TIME_DIGITS="'SECONDS'")
    url='https://ssd.jpl.nasa.gov/api/horizons.api?'+urlencode(params)
    identity=hashlib.sha256(url.encode()).hexdigest();path=Path(store)/(identity+'.horizons.json')
    cache_hit=path.exists()
    if cache_hit:
        envelope=json.loads(path.read_text());raw=envelope['raw'].encode()
        if hashlib.sha256(raw).hexdigest()!=envelope['sha256']:raise ValueError('Horizons cache checksum mismatch')
    else:
        with urlopen(url,timeout=60) as response:raw=response.read()
    payload=json.loads(raw);text=payload.get('result','')
    if payload.get('error') or '$$SOE' not in text or '$$EOE' not in text:raise ValueError('Horizons request failed: '+str(payload.get('error',text[:300])))
    if not re.search(r'Center pole/equ\s*:\s*(?:MEAN_ME|MOON_ME)\s*\(high precision\)',text):raise ValueError('Horizons lunar observer frame must be DE421 mean Earth')
    if not re.search(r'Atmos refraction\s*:\s*NO \(AIRLESS\)',text):raise ValueError('Horizons response must be airless')
    radii=re.search(r'Center radii\s*:\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)',text)
    if not radii or any(abs(float(v)-1737.4)>1e-6 for v in radii.groups()):raise ValueError('Horizons lunar datum radius does not match LOLA')
    rows=list(csv.reader(io.StringIO(text.split('$$SOE')[1].split('$$EOE')[0].strip())))
    if len(rows)!=len(times):raise ValueError('Horizons observation coverage incomplete')
    series=[]
    for row,utc in zip(rows,times):
        timestamp=row[0].strip()
        if re.fullmatch(r'\d{4}-[A-Za-z]{3}-\d{2} \d{2}:\d{2}',timestamp):
            timestamp+=':00'
        stamp=dt.datetime.strptime(timestamp,'%Y-%b-%d %H:%M:%S').replace(tzinfo=dt.timezone.utc)
        if stamp!=dt.datetime.fromisoformat(utc.replace('Z','+00:00')):raise ValueError('Horizons observation time mismatch')
        az,el,distance=map(float,row[3:6])
        if not all(map(math.isfinite,[az,el,distance])) or not 0<=az<=360 or not -90<=el<=90 or distance<=0:raise ValueError('Invalid Horizons observation')
        series.append(dict(utc=utc,az=az%360,el=el,rangeKm=distance*AU_KM))
    sha=hashlib.sha256(raw).hexdigest()
    if not path.exists():
        tmp=path.with_suffix('.part');tmp.write_text(json.dumps(dict(raw=raw.decode(),sha256=sha)));tmp.replace(path)
    return series,dict(engine='JPL Horizons',url=url,sha256=sha,parameters=params,coordinateSpecific=True,frame='MOON_ME_DE421',reportedFrame='Horizons MEAN_ME',refraction='none',observerAltitudeM=altitude_m,frameValidation='Response confirms high-precision lunar mean-Earth orientation, 1737.4 km spherical datum and AIRLESS; Horizons maps DE440 orientation to standard DE421 ME',cacheHit=cache_hit,apparentCorrections='Horizons light time, stellar aberration and gravitational light deflection; no atmospheric refraction')

def observations(lon,lat,ground,times,store,emit):
    series={};sources={}
    for h in [2,5,10]:
        emit('Requesting JPL Horizons Sun and Earth observations',heightM=h);series[str(h)]={};sources[str(h)]={}
        for target,name in [('10','sun'),('399','earth')]:series[str(h)][name],sources[str(h)][name]=fetch_observations(target,lon,lat,ground+h,times,store)
    return series,sources
