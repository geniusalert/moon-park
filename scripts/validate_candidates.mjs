import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {decodeCandidate} from '../src/candidate-model.js';
import {pointInRings,polarToLonLat} from '../src/spatial-math.js';
import {evaluateMission,findRecovery,scheduleActivity} from '../src/mission.js';
const read=async p=>JSON.parse(await readFile(p,'utf8')),hash=b=>createHash('sha256').update(b).digest('hex');
const base=await read('data/mission-data.json'),raw=await readFile(base.candidates.url.slice(1)),manifest=JSON.parse(raw),spatial=await read(base.spatial.url.slice(1));
let checks=0;const check=(v,m)=>{assert.ok(v,m);checks++;};check(hash(raw)===base.candidates.sha256,'manifest hash');
check(manifest.regions.length===15&&manifest.regions.reduce((n,g)=>n+g.points.length,0)===27,'point counts');
const sites=[],regions=[];
const config={startUTC:'2026-11-14T00:00:00Z',delay:48,duration:72,height:2,maxDark:12,minOverlap:8};
for(const group of manifest.regions){
 const outline=spatial.regions.find(r=>r.id===group.regionId),rows=[];
 check(new Set(group.points.map(p=>p.xy.join(','))).size===group.points.length,group.regionId+' distinct pixels');
 for(const p of group.points){
  const raw=await readFile(p.url.slice(1));check(hash(raw)===p.sha256,p.id+' checksum');const payload=JSON.parse(raw),site=decodeCandidate(payload,p);sites.push(site);
  check(pointInRings(...site.xy,outline.ringsXY),p.id+' interior');
  const coords=polarToLonLat(...site.xy);check(Math.abs(coords.latitude-site.latitude)<1e-8&&Math.abs(coords.longitude-site.longitude)<1e-8,p.id+' projection');
  check(payload.context.spatialHash===base.spatial.sha256,p.id+' polygon source context');
  check(site.provenance.sha256===base.sites.find(s=>s.id===site.sourceSiteId).provenance.sha256,p.id+' native source');
  check(site.profiles[2].every((q,i)=>q.el>=site.profiles[5][i].el-1e-7&&site.profiles[5][i].el>=site.profiles[10][i].el-1e-7),p.id+' height monotonicity');
  check(!site.terrainVariants,p.id+' no transferred ensemble');
  const baseline=evaluateMission(site,{...config,delay:0}),delayed=evaluateMission(site,config);
  check([baseline,delayed].every(r=>r.feasible===null&&r.overlap<=r.sunHours+1e-8&&r.sunHours<=config.duration),p.id+' bounded metrics');
  rows.push({id:p.id,offsetFromAnchorM:p.offsetFromAnchorM,baseline:{sun:baseline.sunHours,overlap:baseline.overlap,dark:baseline.longestDark,modelPass:baseline.modelPass},delayed:{sun:delayed.sunHours,overlap:delayed.overlap,dark:delayed.longestDark,modelPass:delayed.modelPass},nominalActivities:scheduleActivity(delayed,2).length});
 }
 regions.push({regionId:group.regionId,points:rows});
}
const scenarios=[];for(const startUTC of ['2026-11-14T00:00:00Z','2026-11-21T00:00:00Z','2026-11-28T00:00:00Z'])for(const height of [2,5,10]){
 const results=sites.map(s=>evaluateMission(s,{...config,startUTC,height}));check(results.every(r=>Number.isFinite(r.overlap)),startUTC+' finite comparison '+height);
 scenarios.push({startUTC,height,passing:results.filter(r=>r.modelPass).length,total:results.length,minOverlap:Math.min(...results.map(r=>r.overlap)),maxOverlap:Math.max(...results.map(r=>r.overlap))});
}
const start=performance.now();const recovery=findRecovery(sites,config);const elapsed=performance.now()-start;
const report={checks,passed:true,config,regions,scenarios,recovery:{tested:recovery.tested,passing:recovery.candidates.length,milliseconds:elapsed},scope:manifest.scope};
await writeFile('docs/candidate-validation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({checks,points:sites.length,regions:regions.length,recovery:report.recovery,expanded:regions.filter(r=>r.points.length>1)},null,2));
