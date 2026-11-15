import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareLandingSurface,sampledSkyState} from '../src/landing-surface.js';
import {lonLatToPolar,MOON_RADIUS_M} from '../src/spatial-math.js';
function polarSite(lon=-137,lat=-89.4){const [x,y]=lonLatToPolar(lon,lat),values=[-100,0,100];return {latitude:lat,longitude:lon,groundM:100,display:{x:values.map(v=>x+v),y:values.map(v=>y-v),z:values.map(()=>[100,100,100]),width:3,height:3,pixelM:100}};}
test('polar measured surface registers the selected point and retains lunar curvature',()=>{
 const surface=prepareLandingSurface(polarSite());assert.ok(surface);assert.ok(Math.abs(surface.heightAt(0,0))<1e-8);assert.ok(surface.heightAt(40,0)<0);assert.ok(Math.abs(surface.heightAt(40,0)+40**2/(2*(MOON_RADIUS_M+100)))<1e-5);assert.equal(surface.heightAt(500,500),null);assert.equal(surface.positions.length,27);
});
test('surface preserves elevation variations and refuses missing source cells',()=>{
 const site=polarSite();site.display.z[1][2]=120;const surface=prepareLandingSurface(site);assert.ok(Math.max(...surface.positions.filter((_,i)=>i%3===1))>19);site.display.z[0][0]=null;assert.equal(prepareLandingSurface(site),null);assert.equal(prepareLandingSurface(null),null);
});
test('exact pole and alternate longitudes use their own local basis',()=>{
 for(const [lon,lat]of [[0,-90],[90,-89.5],[179,-87]]){const surface=prepareLandingSurface(polarSite(lon,lat));assert.ok(surface);assert.ok(Number.isFinite(surface.heightAt(10,10)));assert.ok(Math.abs(surface.heightAt(0,0))<1e-8);}
});
test('reference sphere remains a smooth local surface without invented relief',()=>{
 const site={latitude:20,longitude:10,groundM:0,analysisModel:'reference-sphere',display:{frame:'local-reference-sphere',x:[-20,0,20],y:[20,0,-20],z:[[-.0002,-.0001,-.0002],[-.0001,0,-.0001],[-.0002,-.0001,-.0002]],width:3,height:3}};const surface=prepareLandingSurface(site);assert.equal(surface.sphere,true);assert.equal(surface.heightAt(0,0),0);assert.equal(surface.heightAt(30,0),null);
});
test('sky directions preserve calculated visibility, observer height and UTC',()=>{
 const sample={utc:'2027-01-01T00:00:00Z',az:90,sunEl:0,earthAz:0,earthEl:30,sun:false,earth:true,sunCenterClearanceDeg:-2,earthCenterClearanceDeg:5};const sky=sampledSkyState(sample,5);assert.equal(sky.observerHeightM,5);assert.equal(sky.utc,sample.utc);assert.equal(sky.sun.visible,false);assert.equal(sky.earth.clearance,5);assert.ok(Math.abs(sky.sun.direction[0]-1)<1e-12);assert.ok(Math.abs(sky.earth.direction[1]-.5)<1e-12);assert.equal(sampledSkyState(null,2),null);assert.throws(()=>sampledSkyState({az:0},2),/Incomplete/);
});
