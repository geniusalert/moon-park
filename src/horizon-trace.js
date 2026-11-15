import {solarVisibility} from './airless-visibility.js';
import {compileHorizon,discFraction} from './engine.js';
import {polarToLonLat,lonLatToPolar} from './spatial-math.js';

const radians=d=>d*Math.PI/180,degrees=r=>r*180/Math.PI;
const normalized=a=>((a%360)+360)%360;

// A great-circle surface path in the shared source south-polar projection.
export function surfacePathXY(start,end,segments=32){
 if(!Number.isInteger(segments)||segments<1||segments>256)throw new Error('Invalid trace path sampling');
 const vector=xy=>{const p=polarToLonLat(...xy),l=radians(p.longitude),b=radians(p.latitude);return [Math.cos(b)*Math.cos(l),Math.cos(b)*Math.sin(l),Math.sin(b)];};
 const a=vector(start),b=vector(end),angle=Math.acos(Math.max(-1,Math.min(1,a.reduce((s,v,i)=>s+v*b[i],0))));
 if(angle<1e-10)return [[...start],[...end]];
 if(Math.PI-angle<1e-8)throw new Error('Antipodal trace is ambiguous');
 return Array.from({length:segments+1},(_,i)=>{
  if(i===0)return [...start];if(i===segments)return [...end];
  const t=i/segments,u=Math.sin((1-t)*angle)/Math.sin(angle),v=Math.sin(t*angle)/Math.sin(angle),p=a.map((x,j)=>u*x+v*b[j]);
  return lonLatToPolar(degrees(Math.atan2(p[1],p[0])),degrees(Math.atan2(p[2],Math.hypot(p[0],p[1]))));
 });
}

export function traceHorizon(site,sample,height,profile,object='sun'){
 if(!['sun','earth'].includes(object))throw new Error('Unknown trace target');
 if(!site.xy||site.xy.length!==2||site.xy.some(v=>!Number.isFinite(v))||!Number.isFinite(height)||height<0)throw new Error('Invalid trace observer');
 const azimuth=normalized(object==='sun'?sample.az:sample.earthAz),elevation=object==='sun'?sample.sunEl:sample.earthEl;
 if(!Number.isFinite(azimuth)||!Number.isFinite(elevation)||!Number.isFinite(Date.parse(sample.utc)))throw new Error('Invalid trace observation');
 const at=compileHorizon(profile),rays=[...profile].sort((a,b)=>a.az-b.az);
 let az=azimuth;if(az<rays[0].az)az+=360;
 let index=rays.length-1;for(let i=0;i<rays.length-1;i++)if(az>=rays[i].az&&az<rays[i+1].az){index=i;break;}
 const a=rays[index],b=rays[(index+1)%rays.length],endAz=index===rays.length-1?b.az+360:b.az,t=(az-a.az)/(endAz-a.az);
 const horizon=at(azimuth),fraction=object==='sun'?(sample.sunFraction??solarVisibility({az:azimuth,el:elevation},at,{terrainDisc:!!site.horizonModel}).fraction):null;
 const witnesses=[{ray:a,weight:1-t},{ray:b,weight:t}].filter(w=>w.weight>1e-12).map(({ray,weight},i)=>{
  if(!Array.isArray(ray.blocker)||ray.blocker.length!==2||ray.blocker.some(v=>!Number.isFinite(v))||!Number.isFinite(ray.distanceM)||ray.distanceM<=0||!Number.isFinite(ray.coverageM)||ray.coverageM<ray.distanceM)throw new Error('Sampled terrain location or coverage is unavailable');
  return {label:i===0?'A':'B',rayAzimuthDeg:ray.az,horizonElevationDeg:ray.el,blockerElevationM:ray.blockerElevationM??null,radialRefinementDeltaDeg:ray.radialRefinementDeltaDeg??null,remoteUpperBoundDeg:ray.remoteUpperBoundDeg??null,interpolationWeight:weight,distanceM:ray.distanceM,xy:[...ray.blocker],...polarToLonLat(...ray.blocker),source:ray.source??'unspecified terrain',coverageM:ray.coverageM,pathXY:surfacePathXY(site.xy,ray.blocker)};
 });
 return {schemaVersion:1,siteId:site.id,utc:sample.utc,observerHeightM:height,observerXY:[...site.xy],object,objectAzimuthDeg:azimuth,objectElevationDeg:elevation,interpolatedHorizonDeg:horizon,centerClearanceDeg:elevation-horizon,solarDiscFraction:fraction,solarRadiusDeg:sample.solarRadiusDeg??null,solarDiscMethod:sample.solarDiscMethod??'legacy circular segment',refraction:site.horizonModel?.refraction??site.provenance?.refraction??'none',visibilityCriterion:object==='sun'?'At least 50% of modeled solar disc visible':'Earth center strictly above modeled horizon',modelAvailable:object==='sun'?fraction>=.5:elevation>horizon,witnesses,terrainSource:{url:site.provenance?.url??null,sha256:site.provenance?.sha256??null,crs:site.provenance?.crs??null,regional:site.provenance?.regional??null},scope:'Nominal sampled-ray witnesses supporting a linearly interpolated angular horizon. A and B are separate sampled rays, not one exact blocker on the target azimuth. No unsampled terrain, statistical confidence, radio link or power result is implied.'};
}
