import fs from 'node:fs';
import {evaluateMission} from '../src/mission.js';
const sites=JSON.parse(fs.readFileSync('data/mission-data.json')).sites;
const observations=JSON.parse(fs.readFileSync('docs/seasonal-cadence-observations.json'));
const events=(r,key)=>r.samples.flatMap((s,i)=>i&&s[key]!==r.samples[i-1][key]?[{from:r.samples[i-1].utc,to:s.utc,visible:s[key]}]:[]);
const cases=observations.map(record=>{
 const site={...sites.find(s=>s.id===record.siteId),ephemeridesByHeight:undefined,observationStepMinutes:1,ephemerides:record.series};
 const config={startUTC:record.series.sun[0].utc,delay:0,duration:24,includeEclipses:true};
 const fine=evaluateMission(site,{...config,stepMinutes:1}),coarse=evaluateMission(site,{...config,stepMinutes:10});
 return {siteId:site.id,startUTC:config.startUTC,metricDifferencesHours:{sun:fine.sunHours-coarse.sunHours,earth:fine.earthHours-coarse.earthHours,combined:fine.overlap-coarse.overlap},events:{fineSun:events(fine,'sun'),coarseSun:events(coarse,'sun'),fineEarth:events(fine,'earth'),coarseEarth:events(coarse,'earth')}};
});
fs.writeFileSync('docs/seasonal-cadence-validation.json',JSON.stringify({method:'Independent observations at one-minute cadence, evaluated against unchanged benchmark terrain at 1 and 10 minutes',cases,limitations:['Prepared benchmark horizons only. No new crater-floor or cap-boundary validation.','One-minute samples can still miss shorter windows.','Numerical agreement is separate from terrain source accuracy.']},null,2));
console.log(cases.length+' seasonal cadence comparisons');
