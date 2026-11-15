import {earthOccultor} from './eclipse-geometry.js';
import {terrainDiscFraction} from './airless-visibility.js';
import {summarizeSolar} from './solar-geometry.js';
import {solarVisibility} from './airless-visibility.js';
import {discFraction,compileHorizon,intervals,summarize} from './engine.js';

export const STEP_HOURS=1/6;
export function shiftedElevation(elevationDeg,rangeKm,groundShiftM=0){
 if(groundShiftM===0)return elevationDeg;
 if(!Number.isFinite(groundShiftM)||!Number.isFinite(rangeKm)||rangeKm<=0)throw new Error('Observer correction requires a valid target range');
 const e=elevationDeg*Math.PI/180;
 return Math.atan2(rangeKm*Math.sin(e)-groundShiftM/1000,rangeKm*Math.cos(e))*180/Math.PI;
}
export const LIMITATIONS=[
 'Terrain coverage is finite; unresolved terrain and terrain beyond the modeled radius may introduce obstructions.',
 'Observation provider, reference frame and atmospheric treatment are recorded with each site. Frame labels do not establish observational validation.',
 '5 m local / 240 m regional grids and 0.25° rays can miss narrow terrain features.',
 'Sunlight is disc geometry, not available electrical power; Earth occultation uses a spherical opaque Earth when ranges exist; thermal effects are omitted.',
 'Earth-center visibility is not a radio link or ground-station availability.',
 'Horizon sensitivity is a stress test, not a calibrated probability.',
 'Four selected clone perturbations apply to the original benchmark points only, within 2 km and tapered after 1.8 km; interior-region samples have nominal terrain only. Outer/regional uncertainty is not varied.',
];

function options(config){
 const c={startUTC:'2026-11-14T00:00:00Z',delay:48,duration:72,maxDark:12,minOverlap:8,height:2,offset:0,stepMinutes:10,...config};
 for(const k of ['delay','duration','maxDark','minOverlap','height','offset'])if(!Number.isFinite(c[k]))throw new Error(`Invalid ${k}`);
 if(c.duration<=0||c.duration>744||c.maxDark<0||c.minOverlap<0||c.delay<0||![2,5,10].includes(c.height)||![1,5,10,20,30].includes(c.stepMinutes))throw new Error('Mission inputs outside supported range');
 if(!Number.isFinite(Date.parse(c.startUTC)))throw new Error('Choose a valid UTC date');return c;
}

export function evaluateMission(site,config){
 const c=options(config),start=Date.parse(c.startUTC)+c.delay*3600000;
 const observations=site.ephemeridesByHeight?.[String(c.height)]??site.ephemerides;
 const sun=observations.sun,earth=observations.earth;
 const sourceMinutes=site.observationStepMinutes??10,sourceMs=sourceMinutes*60000;
 if(!Number.isFinite(sourceMinutes)||sourceMinutes<=0||c.stepMinutes<sourceMinutes||!Number.isInteger(c.stepMinutes/sourceMinutes))throw new Error('Requested sampling is finer than or incompatible with the source observations');
 const first=Math.round((start-Date.parse(sun[0].utc))/sourceMs),count=Math.ceil(c.duration*60/sourceMinutes);
 if(first<0||first+count>=sun.length||earth.length!==sun.length||Math.abs(Date.parse(sun[first]?.utc)-start)>1)throw new Error('Mission exceeds cached dates or is not aligned to the source observation grid');
 const profile=site.profiles[String(c.height)];
 if(!profile||profile.some(p=>!Number.isFinite(p.el)||p.coverageM<=0))throw new Error('Incomplete near-field horizon: analysis unavailable');
 const horizonAngle=compileHorizon(profile);
 const coarseHorizon=site.horizonModel?compileHorizon(profile.filter((_,i)=>i%2===0)):null;
 const remoteBound=site.horizonModel?profile[0].remoteUpperBoundDeg:null;
 if(site.horizonModel&&(!Number.isFinite(remoteBound)||site.horizonModel.refraction!=='none'))throw new Error('Incomplete airless model diagnostics');
 for(const limit of [c.minSun,c.maxBlackout]){
  if(limit!=null&&(!Number.isFinite(limit)||limit<0))throw new Error('Visibility limits must be nonnegative hours');
 }
 const samples=[];
 for(let i=0;i<count;i+=c.stepMinutes/sourceMinutes){
  const s=sun[first+i],e=earth[first+i],hour=i*sourceMinutes/60;
  if(s.utc!==e.utc||Date.parse(s.utc)!==start+i*sourceMs)throw new Error('Ephemeris gap or mismatched timestamps');
  if(![s.az,s.el,e.az,e.el].every(Number.isFinite))throw new Error('Invalid ephemeris angle');
  const horizon=horizonAngle(s.az)+c.offset,earthHorizon=horizonAngle(e.az)+c.offset;
  const sunEl=shiftedElevation(s.el,s.rangeKm,site.observerGroundShiftM??0),earthEl=shiftedElevation(e.el,e.rangeKm,site.observerGroundShiftM??0);
  const solar=solarVisibility({az:s.az,el:sunEl,rangeKm:s.rangeKm},az=>horizonAngle(az)+c.offset,{terrainDisc:!!site.horizonModel});
  const occultor=earthOccultor({az:s.az,el:sunEl,rangeKm:s.rangeKm},{az:e.az,el:earthEl,rangeKm:e.rangeKm});
  const fraction=c.includeEclipses&&occultor?.possible?terrainDiscFraction(s.az,sunEl,solar.radiusDeg,az=>horizonAngle(az)+c.offset,32,128,occultor.blocks):solar.fraction;
  const lit=fraction>=.5,visible=earthEl>earthHorizon;
  const remoteFraction=site.horizonModel?solarVisibility({az:s.az,el:sunEl,rangeKm:s.rangeKm},az=>Math.max(horizonAngle(az),remoteBound)+c.offset,{terrainDisc:true}).fraction:null;
  const horizonRefinementDeltaDeg=coarseHorizon?Math.max(Math.abs(horizonAngle(s.az)-coarseHorizon(s.az)),Math.abs(horizonAngle(e.az)-coarseHorizon(e.az))):null;
  samples.push({eclipseModel:!c.includeEclipses?'disabled':occultor?'spherical opaque Earth; no atmospheric transmission':'unavailable: missing target ranges',earthOccultationPossible:occultor?.possible??null,terrainOnlySunFraction:solar.fraction,hour,utc:s.utc,az:s.az,earthAz:e.az,earthRangeKm:e.rangeKm??null,sunRangeKm:s.rangeKm??null,sunEl,earthEl,horizon,earthHorizon,remoteTerrainSunFractionLowerBound:remoteFraction,remoteTerrainEarthVisible:site.horizonModel?earthEl>Math.max(horizonAngle(e.az),remoteBound)+c.offset:null,horizonRefinementDeltaDeg,solarDiscRefinementDelta:solar.refinementDelta,solarRadiusDeg:solar.radiusDeg,solarDiscMethod:solar.method,sunCenterClearanceDeg:sunEl-horizon,earthCenterClearanceDeg:earthEl-earthHorizon,sunFraction:fraction,sun:lit,earth:visible,both:lit&&visible});
 }
 const metrics=summarize(samples,c.duration,c.maxDark,c.minOverlap);
 const combined=intervals(samples,'both',c.duration);
 const earthBlackouts=intervals(samples.map(s=>({hour:s.hour,hidden:!s.earth})), 'hidden',c.duration);
 const longestEarthBlackout=Math.max(0,...earthBlackouts.map(([a,b])=>b-a));
 if(c.minSun!=null&&metrics.sunHours+1e-9<c.minSun)metrics.failures.push(`Sunlight ${metrics.sunHours.toFixed(2)} h is below ${c.minSun} h`);
 if(c.maxBlackout!=null&&longestEarthBlackout>c.maxBlackout+1e-9)metrics.failures.push(`Direct Earth blackout ${longestEarthBlackout.toFixed(2)} h exceeds ${c.maxBlackout} h`);
 metrics.feasible=metrics.failures.length===0;
 return {siteId:site.id,startUTC:new Date(start).toISOString(),endUTC:new Date(start+c.duration*3600000).toISOString(),config:c,samples,earthBlackouts,longestEarthBlackout,...metrics,solarGeometry:summarizeSolar(samples,c.duration),horizonModel:site.horizonModel??null,horizonDiagnostics:site.horizonModel?{refraction:'none',maxSampledAngularRefinementDeltaDeg:Math.max(...samples.map(s=>s.horizonRefinementDeltaDeg)),maxSolarDiscRefinementDelta:Math.max(...samples.map(s=>s.solarDiscRefinementDelta)),sunSamplesSensitiveToRemoteEnvelope:samples.filter(s=>s.sun&&s.remoteTerrainSunFractionLowerBound<.5).length,earthSamplesSensitiveToRemoteEnvelope:samples.filter(s=>s.earth&&!s.remoteTerrainEarthVisible).length,remoteEnvelopeAssumption:site.horizonModel.remoteEnvelope}:null,modelPass:metrics.feasible,feasible:null,decisionStatus:site.analysisModel==='reference-sphere'?'reference-sphere-screening':site.provenance?.regional?'provisional-regional-model':'provisional-local-model',combinedWindows:combined,longestCombined:Math.max(0,...combined.map(([a,b])=>b-a)),limitations:[...(site.analysisModel==='reference-sphere'?['Analytic reference sphere: no measured terrain or actual ground elevation; local obstructions are omitted.','Coordinate-specific positions use the provider and lunar frame recorded in ephemeris provenance, above the 1737.4 km reference sphere.','Sun disc and Earth-centre visibility are geometry only; no RF, power, thermal or landing-safety result.','Reference-sphere results do not carry terrain uncertainty or clone evidence.']:LIMITATIONS),...(site.horizonModel?.limitations??[]),...(!site.ephemeridesByHeight&&c.height!==2?['Ephemerides use the 2 m observer; height-dependent parallax is not recomputed.']:[])]};
}

export function findRecovery(sites,config,{stepHours=12,maxExtraHours=72,heights=[config.height??2]}={}){
 if(!Number.isFinite(stepHours)||stepHours<=0||!Number.isFinite(maxExtraHours)||maxExtraHours<0||maxExtraHours>720)throw new Error('Invalid recovery search bounds');
 if(!heights.length||heights.some(h=>![2,5,10].includes(h)))throw new Error('Unsupported recovery heights');
 const candidates=[],rejected=[];
 for(let extra=0;extra<=maxExtraHours;extra+=stepHours)for(const site of sites)for(const height of heights){
  try{const result=evaluateMission(site,{...config,height,delay:(config.delay??0)+extra});if(result.modelPass)candidates.push({siteId:site.id,name:site.name,height,extraHours:extra,delayHours:(config.delay??0)+extra,overlap:result.overlap,longestDark:result.longestDark,status:result.decisionStatus});}
  catch(error){rejected.push({siteId:site.id,height,extraHours:extra,reason:error.message});}
 }
 candidates.sort((a,b)=>a.extraHours-b.extraHours||a.height-b.height||b.overlap-a.overlap||a.siteId.localeCompare(b.siteId));
 return {bounds:{stepHours,maxExtraHours,heights},candidates,rejected,tested:(Math.floor(maxExtraHours/stepHours)+1)*sites.length*heights.length,interpretation:'Earliest tested additional delay, then lowest observer height, then most combined hours. Provisional terrain-model alternatives, not certified recommendations.'};
}

export function scheduleActivity(result,durationHours){
 if(!Number.isFinite(durationHours)||durationHours<=0)throw new Error('Activity duration must be positive');
 return result.combinedWindows.filter(([a,b])=>b-a>=durationHours).map(([a,b])=>({startHour:a,endHour:a+durationHours,availableUntilHour:b,startUTC:new Date(Date.parse(result.startUTC)+a*3600000).toISOString()}));
}

export function receipt(dataset,config,results,recovery){
 return {schemaVersion:4,application:'Moon Park',version:'0.12.0',software:dataset.software??{},uncertaintySource:dataset.uncertainty??null,dataStatus:dataset.status,createdAt:new Date().toISOString(),config,assumptions:{stepMinutes:config.stepMinutes??10,intervalConvention:'half-open bins; last bin clipped at mission end',refraction:'none; lunar airless straight rays; effective radius factor 1',horizon:'measured radial terrain on a curved body; datum sphere is not an artificial obstruction',sun:'at least 50% modeled solar disc visible; range-dependent nominal radius when available; legacy fallback 0.2666 deg',earth:'center strictly above horizon',feasibility:'unknown: uncertainty tests are conditional near-field samples; regional uncertainty and full terrain completeness remain untested'},sources:dataset.sites.map(s=>({id:s.id,latitude:s.latitude,longitude:s.longitude,groundM:s.groundM,terrain:s.provenance,ephemerides:s.ephemerisProvenance,frameCheck:s.frameCheck,terrainVariants:s.terrainVariants?.map(v=>({id:v.id,label:v.label,family:v.family,groundShiftM:v.groundShiftM,provenance:v.provenance??null}))??[]})),results,recovery,limitations:LIMITATIONS,aiAssistance:'Software and documentation developed with AI assistance; source terrain and ephemerides are NASA/JPL data'};
}

