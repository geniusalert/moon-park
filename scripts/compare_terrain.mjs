import {readFile,writeFile} from 'node:fs/promises';
import {evaluateMission} from '../src/mission.js';
const dataset=JSON.parse(await readFile('data/mission-data.json','utf8'));
const baseline=JSON.parse(await readFile('docs/terrain-impact-baseline.json','utf8'));
const cases=baseline.cases.map(old=>{
 const site=dataset.sites.find(s=>s.id===old.siteId);
 const regional=evaluateMission(site,old.config);
 const local=evaluateMission({...site,profiles:site.localProfiles},old.config);
 const metrics=r=>({sunHours:r.sunHours,overlap:r.overlap,longestDark:r.longestDark,modelPass:r.modelPass});
 return {siteId:site.id,config:old.config,v02:metrics(old),correctedLocal:metrics(local),regional:metrics(regional),regionalMinusCorrectedLocal:{sunHours:regional.sunHours-local.sunHours,overlap:regional.overlap-local.overlap,longestDark:regional.longestDark-local.longestDark}};
});
const report={baselineDatasetSha256:baseline.datasetSha256,method:'v0.2→corrected local includes native-grid ground correction, interpolation, angular/radial refinement, and frame-matched ephemerides. Corrected local→regional isolates extended terrain on the same fine rays and geometry.',cases,summary:{cases:cases.length,casesWithChangedOverlapFromRegional:cases.filter(c=>Math.abs(c.regionalMinusCorrectedLocal.overlap)>1e-9).length,maxOverlapReductionHours:Math.max(...cases.map(c=>-c.regionalMinusCorrectedLocal.overlap)),maxSunReductionHours:Math.max(...cases.map(c=>-c.regionalMinusCorrectedLocal.sunHours))}};
await writeFile('docs/terrain-impact.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report.summary,null,2));
