import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {attachTerrainVariants,analyzeSite,rankStability,findRobustRecovery} from '../src/robustness.js';
const dataset=JSON.parse(await readFile('data/mission-data.json','utf8'));
const raw=await readFile(dataset.uncertainty.url.replace(/^\//,''));
if(createHash('sha256').update(raw).digest('hex')!==dataset.uncertainty.sha256)throw new Error('Variant checksum mismatch');
const prepared=JSON.parse(raw);attachTerrainVariants(dataset,prepared);
const checks=[{name:'Terrain variant artifact hash and context',pass:true}];
function check(name,pass){checks.push({name,pass});if(!pass)throw new Error(name);}
for(const s of dataset.sites){
 const clones=s.terrainVariants.filter(v=>v.family==='clone'),numerical=s.terrainVariants.filter(v=>v.family==='numerical');
 check(`${s.id} four clone and four numerical cases`,clones.length===4&&numerical.length===4);
 for(const v of clones){
  const actual=createHash('sha256').update(await readFile(v.provenance.path)).digest('hex');
  check(`${s.id} ${v.id} derived crop hash`,actual===v.provenance.cropSha256);
 }
 check(`${s.id} variant heights preserve monotone horizons`,s.terrainVariants.every(v=>v.profiles['2'].every((p,i)=>p.el>=v.profiles['5'][i].el-1e-10&&v.profiles['5'][i].el>=v.profiles['10'][i].el-1e-10)));
 check(`${s.id} finer radial grid retains every nominal sampled obstruction`,s.terrainVariants.find(v=>v.id==='radial-fine').profiles['2'].every((p,i)=>p.el>=s.profiles['2'][i].el-1e-9));
}
check('Observer correction cross-checks',prepared.observerCorrection.checks.every(c=>c.maxElevationResidualDeg<=1e-8));
const scenarios=[];
for(const day of [14,21,29])for(const height of [2,10])for(const delay of [0,48]){
 const config={startUTC:`2026-11-${day}T00:00:00Z`,duration:72,height,delay,maxDark:12,minOverlap:8};
 const analyses=dataset.sites.map(s=>analyzeSite(s,config));
 check(`Scenario ${day}/${height}/${delay} has complete families`,analyses.every(a=>a.status!=='unavailable'));
 scenarios.push({config,analyses,ranking:rankStability(analyses)});
}
const probes=[];
for(const scenario of scenarios)for(const a of scenario.analyses){
 const r=a.families.clone.ranges.longestDark;
 if(r.max-r.min>1e-6){
  const config={...scenario.config,maxDark:(r.min+r.max)/2,minOverlap:0};
  const site=dataset.sites.find(s=>s.id===a.siteId),analysis=analyzeSite(site,config);
  probes.push({description:'Constructed threshold probe: limit chosen midway between sampled clone darkness extremes, with zero required direct-to-Earth overlap. This is a sensitivity demonstration, not a real mission requirement.',config,siteId:a.siteId,analysis});
 }
}
const start=performance.now(),recovery=findRobustRecovery(dataset.sites,{startUTC:'2026-11-14T00:00:00Z',duration:72,height:2,delay:48,maxDark:12,minOverlap:8},{heights:[2,5,10]});
const recoveryMs=performance.now()-start;
const fineRaw=await readFile('data/uncertainty-fine-case.json'),fine=JSON.parse(fineRaw);
const fineSite={...dataset.sites.find(s=>s.id===fine.siteId),ephemerides:fine.ephemerides,ephemeridesByHeight:{'2':fine.ephemerides},observationStepMinutes:1};
check('Fine observations match the nominal location and ground',fine.context?.longitude===fineSite.longitude&&fine.context?.latitude===fineSite.latitude&&fine.context?.groundM===fineSite.groundM&&fine.context?.frame==='MOON_ME_DE421');
const fineConfig={startUTC:fine.startUTC,delay:fine.delayHours,duration:72,height:2,maxDark:12,minOverlap:8,stepMinutes:1};
const fineAnalysis=analyzeSite(fineSite,fineConfig);
check('One-minute source cadence',fine.ephemerides.sun.every((r,i)=>!i||Date.parse(r.utc)-Date.parse(fine.ephemerides.sun[i-1].utc)===60000));
check('One-minute realization families complete',fineAnalysis.status!=='unavailable');
const dark=fineAnalysis.families.clone.ranges.longestDark;
const probeConfig={...fineConfig,maxDark:(dark.min+dark.max)/2,minOverlap:0};
const probe=analyzeSite(fineSite,probeConfig);
const fineStudy={description:'Separate direct one-minute Shackleton study, not an automatic refinement of the current app inputs.',siteId:fine.siteId,config:fineConfig,analysis:fineAnalysis,constructedThresholdProbe:{description:'Hypothetical limit chosen between sampled clone extremes; zero required Earth overlap isolates the darkness constraint. Not a real mission requirement.',config:probeConfig,analysis:probe},source:{url:'/data/uncertainty-fine-case.json',sha256:createHash('sha256').update(fineRaw).digest('hex')},cloneSunlightSpreadMinutes:(fineAnalysis.families.clone.ranges.sunHours.max-fineAnalysis.families.clone.ranges.sunHours.min)*60,numericalSunlightSpreadMinutes:(fineAnalysis.families.numerical.ranges.sunHours.max-fineAnalysis.families.numerical.ranges.sunHours.min)*60};
const report={generatedAt:new Date().toISOString(),scope:prepared.scope,checks,observerCorrection:prepared.observerCorrection,scenarios,thresholdProbes:probes,summary:{scenarios:scenarios.length,siteCases:scenarios.length*dataset.sites.length,sensitiveSiteCases:scenarios.flatMap(s=>s.analyses).filter(a=>a.status==='sensitive').length,stablePreferredScenarios:scenarios.filter(s=>s.ranking.status==='stable-tested-preference').length,tiedOrSensitivePreferredScenarios:scenarios.filter(s=>s.ranking.status==='sensitive-or-tied').length,noPassingChoiceScenarios:scenarios.filter(s=>s.ranking.status==='no-passing-choice').length,constructedThresholdProbes:probes.length,maxCloneSunlightSpreadHours:Math.max(...scenarios.flatMap(s=>s.analyses.map(a=>a.families.clone.ranges.sunHours.max-a.families.clone.ranges.sunHours.min))),maxNumericalSunlightSpreadHours:Math.max(...scenarios.flatMap(s=>s.analyses.map(a=>a.families.numerical.ranges.sunHours.max-a.families.numerical.ranges.sunHours.min)))},defaultRecovery:{nominalPassing:recovery.candidates.length,passingAllTested:recovery.passingAllTested,evaluationMilliseconds:performance.now()-start}};
report.summary.maxCloneOverlapSpreadHours=Math.max(...scenarios.flatMap(s=>s.analyses.map(a=>a.families.clone.ranges.overlap.max-a.families.clone.ranges.overlap.min)));
report.summary.maxNumericalOverlapSpreadHours=Math.max(...scenarios.flatMap(s=>s.analyses.map(a=>a.families.numerical.ranges.overlap.max-a.families.numerical.ranges.overlap.min)));
report.defaultRecovery.evaluationMilliseconds=recoveryMs;report.fineStudy=fineStudy;
report.benchmarkDefinition='The summary covers 12 fixed 10-minute scenarios and 36 per-site cases; the separate one-minute study and its constructed threshold probe are reported under fineStudy.';
dataset.uncertainty.fineStudy=fineStudy;
await writeFile('data/mission-data.json',JSON.stringify(dataset,(key,value)=>key==='terrainVariants'?undefined:value));
await writeFile('docs/uncertainty-validation.json',JSON.stringify(report,null,2));console.log(JSON.stringify({summary:report.summary,checks:checks.length,recovery:report.defaultRecovery,fineStudy:{cloneMinutes:fineStudy.cloneSunlightSpreadMinutes,numericalMinutes:fineStudy.numericalSunlightSpreadMinutes,probePassing:probe.families.clone.passing}},null,2));

