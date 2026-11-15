import fs from 'node:fs';
import assert from 'node:assert/strict';
import {earthOccultor} from '../src/eclipse-geometry.js';
import {terrainDiscFraction,solarAngularRadius} from '../src/airless-visibility.js';
const data=JSON.parse(fs.readFileSync('docs/eclipse-reference-observations.json'));
const cases=data.rows.map(({utc,sun,earth})=>{
 const eclipse=earthOccultor(sun,earth);
 return {utc,unoccultedFraction:eclipse.possible?terrainDiscFraction(sun.az,sun.el,solarAngularRadius(sun.rangeKm),()=>-90,32,128,eclipse.blocks):1};
});
assert.ok(cases.some(c=>c.unoccultedFraction===0));
assert.ok(cases.some(c=>c.unoccultedFraction>0&&c.unoccultedFraction<1));
fs.writeFileSync('docs/eclipse-reference-validation.json',JSON.stringify({reference:data.reference,source:data.source,cases,limitations:['Opaque spherical Earth and uniform solar disc. No atmospheric transmission or limb darkening.','Checks occurrence at a lunar surface point. NASA shadow contact times describe a different global quantity.']},null,2));
console.log('Historical total and partial occultation phases detected');
