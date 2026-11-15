import test from 'node:test';
import assert from 'node:assert/strict';
import {polarToLonLat,lonLatToPolar,azElToScene,terrainToScene,pointInRings,sampleDisplayHeight} from '../src/spatial-math.js';
const near=(a,b,t=1e-8)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
test('south polar axes and projection round trip',()=>{
 for(const [lon,lat] of [[0,-89],[90,-88],[-161.9,-89.79],[-68.4,-88.66]]){const p=polarToLonLat(...lonLatToPolar(lon,lat));near(p.longitude,lon);near(p.latitude,lat);}
 near(polarToLonLat(0,0).latitude,-90);near(polarToLonLat(1000,0).longitude,90);
 assert.throws(()=>lonLatToPolar(0,91));
});
test('celestial azimuth maps north/east/up in the terrain frame',()=>{
 for(const [a,e,want] of [[0,0,[0,0,-1]],[90,0,[1,0,0]],[0,90,[0,1,0]],[180,0,[0,0,1]]])azElToScene(a,e).forEach((v,i)=>near(v,want[i]));
});
test('terrain observer origin, vertical height and lunar curvature',()=>{
 const site={longitude:30,latitude:-89,groundM:1000},xy=lonLatToPolar(30,-89);
 terrainToScene(...xy,1000,site).forEach(v=>near(v,0));
 near(terrainToScene(...xy,1002,site)[1],.002);
 const far=terrainToScene(...lonLatToPolar(30,-88.9),1000,site);
 assert.ok(far[2]<-3&&far[1]<0,'north is negative scene Z; level sphere drops below tangent');
});
test('study outline holes and boundaries are respected',()=>{
 const rings=[[[0,0],[10,0],[10,10],[0,10],[0,0]],[[3,3],[7,3],[7,7],[3,7],[3,3]]];
 assert.equal(pointInRings(1,1,rings),true);assert.equal(pointInRings(5,5,rings),false);assert.equal(pointInRings(0,5,rings),true);assert.equal(pointInRings(15,5,rings),false);
});
test('display interpolation follows descending rows and rejects missing coverage',()=>{
 const t={width:2,height:2,x:[0,10],y:[10,0],z:[[0,10],[20,30]]};
 near(sampleDisplayHeight(t,5,5),15);near(sampleDisplayHeight(t,10,0),30);assert.equal(sampleDisplayHeight(t,-1,5),null);
 t.z[1][1]=null;assert.equal(sampleDisplayHeight(t,5,5),null);
});
