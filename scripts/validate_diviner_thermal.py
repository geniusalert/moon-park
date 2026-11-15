"""Compare an independently published regolith reference with measured Diviner bins.

This is a surface-temperature benchmark. It does not validate spacecraft hardware.
Optional dependency: pinned phayne/heat1d checkout installed outside the app.
"""
import os,sys,json,hashlib,math,subprocess,time
from pathlib import Path
import numpy as np
root=Path(os.environ['LOCALAPPDATA'])/'MoonPark'
sys.path.insert(0,str(root/'reference-python'))
import heat1d
from heat1d import orbits
p=Path('data/raw/diviner/pcp_avg_tbol_pols_sum_ltim01_240.polar.tab')
points=[]
for line in p.read_text().splitlines():
 try:
  values=[float(v) for v in line.split(',')]
  if len(values)==5 and -90<=values[3]<=-85 and 0<values[4]<500:points.append(values)
 except ValueError:pass
if not points:raise ValueError('No valid polar measurements')
cases=[]
for target in [-85.2,-87,-89]:
 selected=[r for r in points if abs(r[3]-target)<.12]
 if not selected:continue
 latitude=float(np.mean([r[3] for r in selected]))
 config=heat1d.Configurator(solver='implicit',NYEARSEQ=1,output_interval=heat1d.planets.Moon.day/192,adaptive_tol=.25)
 model=heat1d.Model(lat=np.deg2rad(latitude),ndays=13,config=config)
 model.run()
 clock=(model.lt+12)%24
 times=model.lt/24*model.planet.day
 anomaly=orbits.trueFromMean(model.M0+orbits.TWOPI*times/model.planet.year,model.planet.eccentricity)
 declination=np.arcsin(np.sin(model.planet.obliquity)*np.sin(anomaly+model.planet.Lp))
 matched=(clock>=0)&(clock<.25)&(declination<0)
 prediction=float(np.mean(model.T[matched,0]))
 measured=float(np.mean([r[4] for r in selected]))
 cases.append(dict(latitude=latitude,longitudeRangeDeg=[min(r[2] for r in selected),max(r[2] for r in selected)],measuredSamples=len(selected),predictedSamples=int(matched.sum()),measuredMeanK=measured,measuredStdK=float(np.std([r[4] for r in selected])),referenceModelMeanK=prediction,residualK=prediction-measured))
 print(latitude,measured,prediction,flush=True)
manifest=dict(source='https://pds-geosciences.wustl.edu/lro/urn-nasa-pds-lro_diviner_derived1/data_derived_pcp/diurnal/ltim/pols/pcp_avg_tbol_pols_sum_ltim01_240.tab',byteRange=[106230000,106295535],sampleSha256=hashlib.sha256(p.read_bytes()).hexdigest(),labelSha256=hashlib.sha256(p.with_name('pcp_avg_tbol_pols_sum_ltim01_240.lbl').read_bytes()).hexdigest(),measuredQuantity='Diviner bolometric brightness temperature; 240 m bins; local time [0,0.25) h; south summer; accumulated 2009-07-05 through 2019-02-17')
report=dict(schemaVersion=1,source=manifest,referenceModel=dict(repository='https://github.com/phayne/heat1d',commit=subprocess.check_output(['git','-C',str(root/'heat1d-reference'),'rev-parse','HEAD'],text=True).strip(),paper='https://doi.org/10.1002/2017JE005387',configuration=dict(solver='implicit',equilibrationYears=1,outputSamplesPerLunarDay=192,outputLunarDays=13,adaptiveToleranceK=.25),physicalTarget='flat lunar regolith; default published thermophysical properties'),cases=cases,rmseLatitudeMeansK=float(np.sqrt(np.mean([c['residualK']**2 for c in cases]))),status='measured surface comparison completed; hardware validation remains unestablished',limitations=['Partial byte-range sample, three latitude bands and one local-time bin only.','Reference model averages one modeled year of southern summer; measurements aggregate ten years and real rough/sloped/rocky surfaces.','No pixel-specific terrain, albedo, rocks or observation weighting is matched. Residuals are exploratory diagnostics.','This benchmark checks a published regolith model, not Moon Park spacecraft temperatures. It supplies no spacecraft thermal-survival validation.'])
Path('docs/diviner-thermal-comparison.json').write_text(json.dumps(report,indent=2))
