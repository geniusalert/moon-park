import {test} from 'node:test';
import assert from 'node:assert/strict';
import {earthOccultor} from '../src/eclipse-geometry.js';
import {terrainDiscFraction} from '../src/airless-visibility.js';
test('opaque Earth fully blocks aligned solar disc and leaves separated disc clear',()=>{
 const sun={az:0,el:10,rangeKm:149597870};
 const earth={az:0,el:10,rangeKm:384400};
 const occultor=earthOccultor(sun,earth);
 assert.equal(occultor.possible,true);
 assert.equal(terrainDiscFraction(0,10,.2666,()=>-90,16,64,occultor.blocks),0);
 assert.equal(earthOccultor(sun,{...earth,az:30}).possible,false);
});
test('partial eclipse respects the same terrain mask',()=>{
 const occultor=earthOccultor({az:0,el:0,rangeKm:149597870},{az:1,el:0,rangeKm:384400});
 const clear=terrainDiscFraction(0,0,.2666,()=>-90,32,128,occultor.blocks);
 const terrain=terrainDiscFraction(0,0,.2666,()=>0,32,128,occultor.blocks);
 assert.ok(clear>0&&clear<1);
 assert.ok(terrain>=0&&terrain<=clear&&terrain<=.5);
 assert.equal(earthOccultor({az:0,el:0},{az:0,el:0}),null);
});
