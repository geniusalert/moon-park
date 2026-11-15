import {test} from 'node:test';
import assert from 'node:assert/strict';
import {displacedCoordinates} from '../src/scientific-confidence.js';
test('position offsets preserve requested surface distance across seam and pole',()=>{
 for(const [lon,lat] of [[179.999,-86],[0,-90],[-20,30]])for(const bearing of [0,90,180,270]){
  const point=displacedCoordinates(lon,lat,20,bearing),r=Math.PI/180;
  const hav=Math.sin((point.latitude-lat)*r/2)**2+Math.cos(lat*r)*Math.cos(point.latitude*r)*Math.sin((point.longitude-lon)*r/2)**2;
  const distance=2*1737400*Math.asin(Math.sqrt(hav));
  assert.ok(Math.abs(distance-20)<.001);
 }
 assert.throws(()=>displacedCoordinates(0,-91,20,0));
});
