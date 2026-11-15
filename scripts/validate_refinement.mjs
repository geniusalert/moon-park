import fs from 'node:fs';
import {evaluateMission} from '../src/mission.js';
const report=JSON.parse(fs.readFileSync('docs/scientific-refinement.json'));
const site=JSON.parse(fs.readFileSync('data/mission-data.json')).sites.find(s=>s.id===report.siteId);
const sun=report.rows.map(r=>r.sun),earth=report.rows.map(r=>r.earth);
const fine={...site,ephemeridesByHeight:undefined,observationStepMinutes:1,ephemerides:{sun,earth}};
const settings={startUTC:sun[0].utc,delay:0,duration:(report.rows.length-1)/60};
const a=evaluateMission(fine,{...settings,stepMinutes:1});
const b=evaluateMission(fine,{...settings,stepMinutes:10});
function events(result,key){
 return result.samples.flatMap((sample,i)=>i&&sample[key]!==result.samples[i-1][key]?[{from:result.samples[i-1].utc,to:sample.utc,visible:sample[key]}]:[]);
}
const evidence={siteId:site.id,frameDisplacements:report.frameDisplacements,sourceKernels:report.kernels,method:'Same SPICE CN+S geometry and terrain profile, independently evaluated at one-minute versus ten-minute cadence',metrics:{fine:{sunHours:a.sunHours,earthHours:a.earthHours,overlap:a.overlap},coarse:{sunHours:b.sunHours,earthHours:b.earthHours,overlap:b.overlap}},events:{fineSun:events(a,'sun'),coarseSun:events(b,'sun'),fineEarth:events(a,'earth'),coarseEarth:events(b,'earth')},limitations:['A single point and day cannot establish convergence across the domain.','Sub-minute windows remain unresolved.','Frame displacements do not identify unknown catalogue frames.']};
fs.writeFileSync('docs/scientific-refinement-summary.json',JSON.stringify(evidence,null,2));
console.log(JSON.stringify(evidence.metrics));

