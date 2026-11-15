import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MISSION_SITES} from '../src/mission-catalogue.js';
test('numeric catalogue coordinates carry source-backed frame identities',()=>{
 for(const point of MISSION_SITES){
  const metadata=point.coordinateMetadata;
  assert.ok(metadata.evidence.length);
  if(point.coordinateType==='unpublished'){assert.equal(metadata.sourceFrame,null);assert.equal(metadata.status,'unpublished');}
  else{
   assert.equal(metadata.sourceFrame,'MOON_ME_DE421');
   assert.equal(metadata.frameDisplacementM,0);
   assert.ok(metadata.limitations.some(text=>text.includes('geolocation')));
  }
 }
});
