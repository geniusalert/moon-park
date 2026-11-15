import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {traceHorizon} from '../src/horizon-trace.js';
import {decodeCandidate} from '../src/candidate-model.js';
import {evaluateMission} from '../src/mission.js';
import {MOON_RADIUS_M} from '../src/spatial-math.js';
const read=async p=>JSON.parse(await readFile(p,'utf8')),base=await read('data/mission-data.json'),manifest=await read(base.candidates.url.slice(1)),sites=[...base.sites];
for(const group of manifest.regions)for(const point of group.points)sites.push(decodeCandidate(await read(point.url.slice(1)),point));
let checks=0,cases=0,maxDistanceResidualM=0,maxBearingResidualDeg=0,regionalWitnesses=0,localWitnesses=0;
const check=(ok,message)=>{assert.ok(ok,message);checks++;},rad=d=>d*Math.PI/180;
for(const site of sites)for(const height of [2,5,10])for(const index of [0,864,1728,2592,3456]){
 const utc=site.ephemeridesByHeight[height].sun[index].utc,result=evaluateMission(site,{startUTC:utc,delay:0,duration:24,height,maxDark:12,minOverlap:8}),sample=result.samples[0];
 for(const object of ['sun','earth']){
  const trace=traceHorizon(site,sample,height,site.profiles[height],object);cases++;
  check(Math.abs(trace.interpolatedHorizonDeg-(object==='sun'?sample.horizon:sample.earthHorizon))<1e-12,'trace agrees with evaluated horizon');
  check(trace.modelAvailable===sample[object],'trace agrees with evaluated visibility criterion');
  check(Math.abs(trace.witnesses.reduce((s,w)=>s+w.interpolationWeight,0)-1)<1e-12,'weights sum to one');
  check(Math.abs(trace.witnesses.reduce((s,w)=>s+w.interpolationWeight*w.horizonElevationDeg,0)-trace.interpolatedHorizonDeg)<1e-12,'weighted witness angles reconstruct horizon');
  for(const w of trace.witnesses){
   const p1=rad(site.latitude),p2=rad(w.latitude),dl=rad(w.longitude-site.longitude),dp=p2-p1;
   const h=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2,d=2*MOON_RADIUS_M*Math.asin(Math.sqrt(Math.min(1,h)));
   const bearing=(Math.atan2(Math.sin(dl)*Math.cos(p2),Math.cos(p1)*Math.sin(p2)-Math.sin(p1)*Math.cos(p2)*Math.cos(dl))*180/Math.PI+360)%360;
   const residual=Math.abs(d-w.distanceM),angular=Math.abs((bearing-w.rayAzimuthDeg+180)%360-180);
   maxDistanceResidualM=Math.max(maxDistanceResidualM,residual);maxBearingResidualDeg=Math.max(maxBearingResidualDeg,angular);
   check(residual<.005,'stored blocker distance matches spherical coordinates within metadata rounding');
   check(angular<.002/w.distanceM*180/Math.PI+1e-6,'stored blocker direction matches sampled ray within coordinate rounding');
   check(w.pathXY.every(p=>p.every(Number.isFinite)),'surface path finite');
   check(w.pathXY[0].every((v,i)=>v===site.xy[i])&&w.pathXY.at(-1).every((v,i)=>v===w.xy[i]),'path preserves source endpoints');
   if(w.source==='regional-240m')regionalWitnesses++;else localWitnesses++;
  }
 }
}
const report={passed:true,checks,cases,points:sites.length,heights:[2,5,10],sampleDates:['2026-11-14','2026-11-20','2026-11-26','2026-12-02','2026-12-08'],maxDistanceResidualM,maxBearingResidualDeg,regionalWitnesses,localWitnesses,scope:'Witness reconstruction and stored-coordinate checks, not new terrain, observational validation or a physical error bound. Candidate source coordinates are rounded to millimeters.'};
await writeFile('docs/trace-validation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
