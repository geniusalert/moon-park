"""Conditional near-field error realizations and separate numerical checks."""
import hashlib
import json
from pathlib import Path
import numpy as np
import rasterio
from rasterio.enums import Resampling
from pyproj import CRS,Transformer
import spiceypy as spice
from extend_horizons import bilinear,destinations
from prepare_terrain import R,ray_angle
from prepare_spice import acquire as kernels,observe

def ray_distances(refined=False):
    if refined:return np.concatenate([np.arange(2.5,202.5,2.5),np.arange(210,12001,10),np.arange(12060,180001,60)])
    return np.concatenate([np.arange(5,205,5),np.arange(220,12001,20),np.arange(12120,180001,120)])

def compact_profiles(azimuth_step,values):
    return {str(h):dict(azimuthStepDeg=azimuth_step,coverageM=180000,values=values[str(h)]) for h in [2,5,10]}

def clone_weight(distances):
    phase=np.clip((np.asarray(distances)-1800)/200,0,1)
    return .5*(1+np.cos(np.pi*phase))

def build():
    path=Path('data/mission-data.json');dataset=json.loads(path.read_text(encoding='utf-8'))
    sources=json.loads(Path('data/clone-sources.json').read_text())
    prepared=dict(schemaVersion=1,scope=dict(cloneRadiusM=2000,fullPerturbationRadiusM=1800,taper='Cosine weight from one to zero between 1.8 and 2.0 km to avoid an artificial crop-edge step',cloneIds=[1,26,51,76],interpretation='Four fixed published clone-minus-nominal perturbations, full inside 1.8 km and tapered to zero by 2 km; outer local/regional terrain is held nominal. Frequencies are conditional sample counts, not probabilities.',numericalInterpretation='Numerical variants are a separate family; they are not added to the clone sample count.'),sites=[])
    for k in kernels():spice.furnsh(k['path'])
    correction_checks=[]
    with rasterio.open('data/raw/regional-240m.tif') as region:
        regional=region.read(1,masked=True).filled(np.nan)
        lunar=CRS.from_proj4(f'+proj=longlat +R={R} +no_defs')
        reg_forward=Transformer.from_crs(lunar,region.crs,always_xy=True)
        for site in dataset['sites']:
            variants=[]
            with rasterio.open(f'data/raw/{site["id"]}.tif') as ds:
                nominal=ds.read(1,masked=True).filled(np.nan)
                forward=Transformer.from_crs(lunar,ds.crs,always_xy=True)
                local_sources=[s for s in sources if s['siteId']==site['id']]
                crops=[]
                for source in local_sources:
                    with rasterio.open(source['path']) as crop:
                        errors=crop.read(1,masked=True).filled(np.nan)
                        delta,valid=bilinear(errors,crop.transform,*site['xy'])
                        if not valid:raise ValueError('Clone observer lacks support')
                        crops.append(dict(source=source,data=errors,transform=crop.transform,delta=float(delta)))
                        variants.append(dict(id=f'clone-{source["cloneId"]:04d}',label=f'Near-field clone {source["cloneId"]:03d}',family='clone',groundShiftM=float(delta),provenance=source,profiles={str(h):[] for h in [2,5,10]}))
                # Reuse nominal sampled geometry for all clone realizations.
                distances=ray_distances();azimuths=np.arange(0,360,.25)
                for first in range(0,len(azimuths),120):
                    az=azimuths[first:first+120]
                    lon,lat=destinations(site['longitude'],site['latitude'],az,distances)
                    x,y=forward.transform(lon,lat);rx,ry=reg_forward.transform(lon,lat)
                    near,nvalid=bilinear(nominal,ds.transform,x,y);far,fvalid=bilinear(regional,region.transform,rx,ry)
                    if not np.all(nvalid|fvalid):raise ValueError('Nominal terrain coverage gap')
                    nominal_samples=np.where(nvalid,near,far)
                    for crop,variant in zip(crops,variants):
                        errors,evalid=bilinear(crop['data'],crop['transform'],x,y)
                        weight=clone_weight(distances)[None,:];perturbed=weight>0
                        if np.any(perturbed&~evalid):raise ValueError('Near-field clone coverage gap')
                        sampled=nominal_samples+np.where(perturbed,errors*weight,0)
                        for h in [2,5,10]:
                            angles=ray_angle(distances[None,:],sampled,site['groundM']+crop['delta'],h)
                            variant['profiles'][str(h)].extend(np.max(angles,axis=1).tolist())
                for variant in variants:variant['profiles']=compact_profiles(.25,variant['profiles'])

                numerical=[('angular-coarse','0.5° azimuth rays',.5,False,1),('angular-fine','0.125° azimuth rays',.125,False,1),('radial-fine','Finer radial sampling',.25,True,1),('grid-20m','20 m local terrain',.25,False,4)]
                for key,label,step,refined,factor in numerical:
                    if factor==1:terrain,transform=nominal,ds.transform
                    else:
                        terrain=ds.read(1,out_shape=(ds.height//factor,ds.width//factor),resampling=Resampling.average,masked=True).filled(np.nan)
                        transform=ds.transform*ds.transform.scale(factor,factor)
                    ground,valid=bilinear(terrain,transform,*site['xy'])
                    if not valid:raise ValueError('Numerical variant lacks observer support')
                    values={str(h):[] for h in [2,5,10]};distances=ray_distances(refined);azimuths=np.arange(0,360,step)
                    for first in range(0,len(azimuths),120):
                        az=azimuths[first:first+120]
                        lon,lat=destinations(site['longitude'],site['latitude'],az,distances)
                        x,y=forward.transform(lon,lat);rx,ry=reg_forward.transform(lon,lat)
                        near,nvalid=bilinear(terrain,transform,x,y);far,fvalid=bilinear(regional,region.transform,rx,ry)
                        if not np.all(nvalid|fvalid):raise ValueError('Numerical variant coverage gap')
                        sampled=np.where(nvalid,near,far)
                        for h in [2,5,10]:values[str(h)].extend(np.max(ray_angle(distances[None,:],sampled,float(ground),h),axis=1).tolist())
                    variants.append(dict(id=key,label=label,family='numerical',groundShiftM=float(ground)-site['groundM'],provenance=dict(analysisPixelM=5*factor,azimuthStepDeg=step,radialSpacingM='2.5/10/60' if refined else '5/20/120',groundMethod='Bilinear interpolation of the variant local terrain',sourceDEMHash=site['provenance']['sha256'],regionalHash=site['provenance']['regional']['cropSha256']),profiles=compact_profiles(step,values)))
                    print(site['id'],key,'complete',flush=True)

                # Validate radial observer-vector correction against exact SPICE.
                worst=0.0
                for variant in variants:
                    shift=variant['groundShiftM']
                    for h in [2,5,10]:
                        for name,target in [('sun','SUN'),('earth','EARTH')]:
                            rows=site['ephemeridesByHeight'][str(h)][name]
                            for row in [rows[0],rows[len(rows)//2],rows[-1]]:
                                e=np.radians(row['el']);r=row['rangeKm']
                                corrected=float(np.degrees(np.arctan2(r*np.sin(e)-shift/1000,r*np.cos(e))))
                                exact=observe(target,row['utc'],site['longitude'],site['latitude'],site['groundM']+h+shift)
                                worst=max(worst,abs(corrected-exact['el']))
                correction_checks.append(dict(siteId=site['id'],maxElevationResidualDeg=worst,checks=len(variants)*3*2*3))
                if worst>1e-8:raise ValueError('Observer radial correction exceeds sanity threshold')
                prepared['sites'].append(dict(siteId=site['id'],context=dict(longitude=site['longitude'],latitude=site['latitude'],groundM=site['groundM'],startUTC=site['ephemerides']['sun'][0]['utc'],endUTC=site['ephemerides']['sun'][-1]['utc']),variants=variants))
    prepared['observerCorrection']=dict(method='Translate the nominal apparent topocentric vector along the local radial axis, using its actual target range; validate against direct SPICE at start/middle/end for each variant, target and height.',checks=correction_checks)
    raw=json.dumps(prepared,allow_nan=False,separators=(',',':')).encode()
    checksum=hashlib.sha256(raw).hexdigest()
    artifact=Path(f'data/terrain-variants-{checksum[:12]}.json')
    artifact.write_bytes(raw)
    Path('data/terrain-variants.json').write_bytes(raw)
    dataset['uncertainty']=dict(url='/'+artifact.as_posix(),sha256=checksum,scope=prepared['scope'],observerCorrection=prepared['observerCorrection'])
    dataset['schemaVersion']=4;dataset['status']='real-data-regional-terrain-with-conditional-uncertainty'
    temporary=path.with_suffix('.json.tmp')
    temporary.write_text(json.dumps(dataset,allow_nan=False,separators=(',',':')),encoding='utf-8');temporary.replace(path)
    spice.kclear()
    print('Prepared',sum(len(s['variants']) for s in prepared['sites']),'terrain variants',flush=True)

if __name__=='__main__':build()
