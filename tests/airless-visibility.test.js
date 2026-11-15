import {test} from 'node:test';
import assert from 'node:assert/strict';
import {solarAngularRadius,terrainDiscFraction,solarVisibility} from '../src/airless-visibility.js';
import {discFraction} from '../src/engine.js';
test('solar radius follows physical distance and rejects invalid ranges',()=>{
 assert.ok(Math.abs(solarAngularRadius(149597870.7)-.26645)<.0001);
 assert.ok(solarAngularRadius(147e6)>solarAngularRadius(152e6));
 assert.throws(()=>solarAngularRadius(0));assert.throws(()=>solarAngularRadius(NaN));
});
test('spherical solar area matches the straight-horizon analytic solution',()=>{
 const radius=.2666;
 for(const el of [-1,-.15,0,.15,1]){
  const sampled=terrainDiscFraction(359.99,el,radius,()=>0,32,128);
  assert.ok(Math.abs(sampled-discFraction(el,radius))<.004,`${el}: ${sampled}`);
 }
});
test('terrain beside the centre can block the solar disc across north wrap',()=>{
 const flat=terrainDiscFraction(0,0,.2666,()=>0);
 const ridge=terrainDiscFraction(0,0,.2666,az=>az<.4?1:0);
 assert.equal(flat,.5);assert.ok(ridge<flat);assert.ok(ridge>0);
});
test('spherical disc handles high elevations and fully hidden directions',()=>{
 assert.equal(terrainDiscFraction(0,90,.2666,()=>5),1);
 assert.equal(terrainDiscFraction(180,-30,.2666,()=>0),0);
 assert.equal(terrainDiscFraction(90,30,.2666,()=>0),1);
});
test('legacy missing ranges retain documented fallback while new data uses range',()=>{
 assert.equal(solarVisibility({az:0,el:0},()=>0).radiusDeg,.2666);
 const result=solarVisibility({az:0,el:0,rangeKm:147e6},()=>0,{terrainDisc:true});
 assert.equal(result.fraction,.5);assert.match(result.method,/1024/);
});
