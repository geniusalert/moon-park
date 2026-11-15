"""Airless lunar geometry. Heights are radial metres above the LOLA datum.

The datum is a coordinate surface, NOT a solid floor: forcing its limb onto
below-datum craters would create fictitious terrain. Measured radial terrain
already includes body curvature. A smooth sphere is a separate reference model.
"""
import math
import numpy as np
R=1737400.0
MODEL_VERSION='airless-lola-v2'
AZIMUTH_STEP_DEG=.125
MAX_RADIUS_M=180000.
# Engineering envelope, not a measured global DEM maximum or uncertainty bound.
ASSUMED_REMOTE_MAX_ELEVATION_M=12000.

def ray_angle(distance,terrain_z,ground_z,height):
    d,z,g,h=np.broadcast_arrays(np.asarray(distance,dtype=float),np.asarray(terrain_z,dtype=float),np.asarray(ground_z,dtype=float),np.asarray(height,dtype=float))
    if not all(np.all(np.isfinite(v)) for v in [d,z,g,h]) or np.any(d<=0) or np.any(d>=math.pi*R) or np.any(h<0) or np.any(R+z<=0) or np.any(R+g+h<=0):raise ValueError('Invalid airless ray geometry')
    theta=d/R
    # Stable for metre-scale rays: avoid subtracting two ~1.7 million m radii.
    vertical=(z-g-h)-2*(R+z)*np.sin(theta/2)**2
    horizontal=(R+z)*np.sin(theta)
    return np.degrees(np.arctan2(vertical,horizontal))

def sphere_limb(height,surface_radius=R):
    if not math.isfinite(height) or not math.isfinite(surface_radius) or height<0 or surface_radius<=0:raise ValueError('Invalid sphere geometry')
    # atan2 form remains stable even for tiny observer heights.
    chord=math.sqrt(height*(2*surface_radius+height))
    dip=math.atan2(chord,surface_radius)
    return dict(elevationDeg=-math.degrees(dip),surfaceDistanceM=surface_radius*dip,lineOfSightM=chord)

def remote_horizon_bound(ground,height,radius=MAX_RADIUS_M,max_elevation=ASSUMED_REMOTE_MAX_ELEVATION_M):
    if not all(math.isfinite(v) for v in [ground,height,radius,max_elevation]) or height<0 or not 0<radius<math.pi*R or min(R+ground+height,R+max_elevation)<=0:raise ValueError('Invalid remote terrain envelope')
    observer=R+ground+height;terrain=R+max_elevation
    # Max of atan2(rt*cos(theta)-ro,rt*sin(theta)) for theta >= radius/R.
    # Its stationary point is the tangent when the observer exceeds the envelope.
    tangent=math.acos(terrain/observer) if observer>terrain else 0.
    theta=max(radius/R,tangent)
    return float(ray_angle(theta*R,max_elevation,ground,height))

def ray_distances():
    return np.concatenate([np.arange(1.,201.,1.),np.arange(210.,12001.,10.),np.arange(12060.,180001.,60.)])

def profile_row(az,distances,elevations,ground,height,resolution,px,py):
    angles=ray_angle(distances,elevations,ground,height);k=int(np.argmax(angles))
    coarse=float(np.max(angles[::2]));peak=float(angles[k]);bound=remote_horizon_bound(ground,height)
    return dict(az=float(az),el=peak,distanceM=float(distances[k]),coverageM=MAX_RADIUS_M,source=f'terrain-{int(resolution[k])}m',blocker=[float(px[k]),float(py[k])],blockerElevationM=float(elevations[k]),radialRefinementDeltaDeg=peak-coarse,remoteUpperBoundDeg=bound,remoteEnvelopeExcluded=peak>=bound)

def model_metadata(profiles,ground):
    return dict(version=MODEL_VERSION,refraction='none',effectiveRadiusFactor=1,referenceRadiusM=R,groundElevationM=ground,observerHeightDefinition='Radial metres above interpolated local terrain; not height above datum',localVertical='Radial vector, not slope normal or gravity plumb line',azimuthConvention='North=0, east=90; clockwise; longitude zero reference at pole',azimuthStepDeg=AZIMUTH_STEP_DEG,maxRadiusM=MAX_RADIUS_M,rayStepM='1 m through 200 m; 10 m through 12 km; 60 m through 180 km',terrainInterpolation='Bilinear native DEM pixel centres; all four support cells required',datumSphereIsObstruction=False,remoteEnvelope=dict(maxElevationM=ASSUMED_REMOTE_MAX_ELEVATION_M,status='Conditional engineering assumption; not global terrain validation'),heights={h:dict(smoothLocalSphere=sphere_limb(float(h),R+ground),maxRadialRefinementDeltaDeg=max(p['radialRefinementDeltaDeg'] for p in rows),maxAngularMidpointDeltaDeg=max(abs(rows[i]['el']-(rows[(i-1)%len(rows)]['el']+rows[(i+1)%len(rows)]['el'])/2) for i in range(1,len(rows),2)),remoteEnvelopeExcludedRays=sum(p['remoteEnvelopeExcluded'] for p in rows),totalRays=len(rows)) for h,rows in profiles.items()},limitations=['Finite ray sampling can miss sub-grid terrain and features between rays. Refinement deltas are diagnostics, not calibrated error bounds.','LOLA elevations and registration have measurement uncertainty; no stochastic confidence is claimed.','Terrain within one metre, lander structures and boulders below DEM resolution are not modeled.','Beyond-radius exclusion is conditional on the stated maximum-elevation envelope.'])
