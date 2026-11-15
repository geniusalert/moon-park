import fs from 'node:fs';
import {evaluateMission} from '../src/mission.js';
const dataset=JSON.parse(fs.readFileSync('data/mission-data.json'));
const cases=[];
for(const site of dataset.sites)for(const delay of [0,120,360]){
 const config={delay,duration:72};
 const nominal=evaluateMission(site,config);
 const perturbations=[-.1,.1].map(offset=>{
  const result=evaluateMission(site,{...config,offset});
  return {horizonOffsetDeg:offset,sunHours:result.sunHours,earthHours:result.earthHours,longestCombined:result.longestCombined,modelPass:result.modelPass};
 });
 cases.push({siteId:site.id,startUTC:nominal.startUTC,nominal:{sunHours:nominal.sunHours,earthHours:nominal.earthHours,longestCombined:nominal.longestCombined,modelPass:nominal.modelPass},perturbations});
}
fs.writeFileSync('docs/visibility-sensitivity.json',JSON.stringify({generatedUTC:new Date().toISOString(),method:'Uniform horizon-angle stress test at +/-0.1 degrees, three dates per prepared benchmark',interpretation:'Illustrative sensitivity only. Offsets are assumed and do not establish measured terrain error or statistical confidence.',cases},null,2));
console.log(cases.length+' benchmark/date sensitivity cases recorded');
