"""Recompute meaningful transition cases directly at 10, 5 and 1 minutes."""
import datetime as dt
import json
from pathlib import Path
import numpy as np
import spiceypy as spice
from prepare_spice import acquire,observe

def durations(sun,earth,step_minutes):
    dt_hours=step_minutes/60
    both=sun&earth
    def longest(flags):
        edges=np.diff(np.concatenate(([False],flags,[False])).astype(int))
        lengths=np.flatnonzero(edges==-1)-np.flatnonzero(edges==1)
        return float(max(lengths,default=0)*dt_hours)
    return dict(sunHours=float(sun.sum()*dt_hours),overlap=float(both.sum()*dt_hours),longestDark=longest(~sun),longestCombined=longest(both))

def build():
    for kernel in acquire():spice.furnsh(kernel['path'])
    dataset=json.loads(Path('data/mission-data.json').read_text(encoding='utf-8'))
    sites={s['id']:s for s in dataset['sites']}
    report=dict(method='Direct SPICE recomputation at each cadence; same 0.25 degree terrain horizon, 50% solar disc / Earth-center thresholds, half-open 72 h bins, 2 m observer',interpretation='Temporal convergence only; does not establish terrain-resolution or full physical accuracy.',cases=[])
    for code,start in [('Site01','2026-11-14'),('Site11','2026-11-14'),('Site01','2026-11-29'),('Site04','2026-11-21'),('Site11','2026-11-30')]:
        site=sites[code];initial=dt.datetime.fromisoformat(start).replace(tzinfo=dt.timezone.utc)+dt.timedelta(hours=48)
        profile=site['profiles']['2'];az=np.array([p['az'] for p in profile]);el=np.array([p['el'] for p in profile])
        sun=[];earth=[]
        for i in range(72*60):
            utc=(initial+dt.timedelta(minutes=i)).isoformat().replace('+00:00','Z')
            states=[observe(t,utc,site['longitude'],site['latitude'],site['groundM']+2) for t in ['SUN','EARTH']]
            clears=[s['el']-np.interp(s['az'],az,el,period=360) for s in states]
            sun.append(clears[0]>=0);earth.append(clears[1]>0)
        sun=np.array(sun);earth=np.array(earth)
        values=[dict(stepMinutes=step,**durations(sun[::step],earth[::step],step)) for step in [10,5,1]]
        report['cases'].append(dict(siteId=code,arrivalDateUTC=start,delayHours=48,results=values,maxSunDifferenceHours=max(v['sunHours'] for v in values)-min(v['sunHours'] for v in values),maxOverlapDifferenceHours=max(v['overlap'] for v in values)-min(v['overlap'] for v in values)))
        print(code,values,flush=True)
    Path('docs/time-convergence.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    spice.kclear()

if __name__=='__main__':build()
