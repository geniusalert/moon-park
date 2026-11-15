import {readFile,writeFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {evaluateMission} from '../src/mission.js';
const path='docs/terrain-impact-baseline.json';
try{await access(path);console.log('Retaining original v0.2 baseline');process.exit(0);}catch{}
const raw=await readFile('data/mission-data.json');const dataset=JSON.parse(raw);
if(dataset.schemaVersion!==2)throw new Error('Baseline must be captured from original v0.2 dataset');
const cases=[];
for(const day of [14,21,29])for(const site of dataset.sites)for(const delay of [0,48]){
 const config={startUTC:`2026-11-${day}T00:00:00Z`,delay,duration:72,height:2,maxDark:12,minOverlap:8};
 const r=evaluateMission(site,config);
 cases.push({siteId:site.id,config,sunHours:r.sunHours,overlap:r.overlap,longestDark:r.longestDark,modelPass:r.modelPass});
}
await writeFile(path,JSON.stringify({datasetSha256:createHash('sha256').update(raw).digest('hex'),description:'Original v0.2 dataset: 20 m analysis, 1 degree rays, local coverage, Horizons at coarser-grid ground elevation',cases},null,2));
console.log('Saved',cases.length,'baseline cases');
