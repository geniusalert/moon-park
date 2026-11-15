import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {evaluateMission,findRecovery} from '../src/mission.js';
const data=JSON.parse(await readFile('data/mission-data.json','utf8'));
const report={generatedAt:new Date().toISOString(),checks:[],sites:[],limitations:['SPICE/Horizons comparison is not independent observational truth','Terrain is finite-radius and spatial convergence remains incomplete','Terrain-clone statistics and human usability remain unvalidated']};
function check(name,pass){report.checks.push({name,pass});if(!pass)throw new Error(name);}
for(const site of data.sites){
 for(const object of ['sun','earth']){
  const raw=await readFile(`data/raw/${site.id}-${object}.json`),hash=createHash('sha256').update(raw).digest('hex');
  check(`${site.id} ${object} Horizons reference hash`,hash===(site.horizonsProvenance??site.ephemerisProvenance)[object].sha256);
  const rows=site.ephemerides[object];check(`${site.id} ${object} ten-minute cadence`,rows.every((s,i)=>!i||Date.parse(s.utc)-Date.parse(rows[i-1].utc)===600000));
 }
 check(`${site.id} terrain source hash`,createHash('sha256').update(await readFile(`data/raw/${site.id}.tif`)).digest('hex')===site.provenance.sha256);
 check(`${site.id} observer-height horizon monotonicity`,site.profiles['2'].every((p,i)=>p.el>=site.profiles['5'][i].el&&site.profiles['5'][i].el>=site.profiles['10'][i].el));
 if(site.localProfiles){
  check(`${site.id} regional horizon cannot remove a sampled local obstruction`,[2,5,10].every(h=>site.profiles[h].every((p,i)=>p.el>=site.localProfiles[h][i].el-1e-10)));
  check(`${site.id} all rays reach 180 km`,site.profiles['2'].every(p=>p.coverageM===180000));
  check(`${site.id} Horizons elevation cross-check within 0.001 degree sanity threshold`,Object.values(site.frameCheck).every(r=>r.maxElDifferenceDeg<.001));
 }
 const base={delay:48,duration:72,height:2,startUTC:'2026-11-14T00:00:00Z'};
 const results=[10,20,30].map(stepMinutes=>{const r=evaluateMission(site,{...base,stepMinutes});return {stepMinutes,sunHours:r.sunHours,overlap:r.overlap,longestDark:r.longestDark,modelPass:r.modelPass};});
 report.sites.push({id:site.id,coordinates:[site.longitude,site.latitude],minimumRayCoverageM:Math.min(...site.profiles['2'].map(p=>p.coverageM)),temporalSensitivity:results});
}
if(data.schemaVersion>=3){
 const s=data.sites[0];
 check('regional crop source hash',createHash('sha256').update(await readFile('data/raw/regional-240m.tif')).digest('hex')===s.provenance.regional.cropSha256);
 for(const k of s.ephemerisProvenance.sun.kernels)check(`NAIF kernel ${k.path} hash`,createHash('sha256').update(await readFile(k.path)).digest('hex')===k.sha256);
}
const config={delay:48,duration:72,height:2,startUTC:'2026-11-14T00:00:00Z'};
const start=performance.now();const recovery=findRecovery(data.sites,config,{heights:[2,5,10]});report.recoveryMilliseconds=performance.now()-start;report.recovery={tested:recovery.tested,passing:recovery.candidates.length};
await writeFile('docs/validation.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));

