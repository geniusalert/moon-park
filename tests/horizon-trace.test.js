import test from 'node:test';import assert from 'node:assert/strict';
import {traceHorizon,surfacePathXY} from '../src/horizon-trace.js';
import {polarToLonLat,lonLatToPolar} from '../src/spatial-math.js';
const site={id:'fixture',xy:[1000,2000],provenance:{sha256:'fixture'}},sample={utc:'2026-11-14T00:00:00Z',az:45,sunEl:4,earthAz:270,earthEl:5};
const profile=[0,90,180,270].map((az,i)=>({az,el:[2,4,3,5][i],distanceM:1000,coverageM:180000,source:i%2?'regional-240m':'local-5m',blocker:[1000+i*200,3000+i*100]}));
test('trace retains both bracketing witnesses and their interpolation weights',()=>{
 const t=traceHorizon(site,sample,2,profile);assert.equal(t.interpolatedHorizonDeg,3);assert.equal(t.centerClearanceDeg,1);assert.equal(t.modelAvailable,true);assert.deepEqual(t.witnesses.map(w=>w.interpolationWeight),[.5,.5]);assert.deepEqual(t.witnesses.map(w=>w.rayAzimuthDeg),[0,90]);assert.equal(t.witnesses[1].source,'regional-240m');
});
test('north seam wraps rays and weights without inventing a blocker at target azimuth',()=>{
 const t=traceHorizon(site,{...sample,az:315},2,profile);assert.equal(t.interpolatedHorizonDeg,3.5);assert.deepEqual(t.witnesses.map(w=>w.rayAzimuthDeg),[270,0]);
 const sorted=[...profile].reverse();assert.equal(traceHorizon(site,{...sample,az:-45},2,sorted).interpolatedHorizonDeg,t.interpolatedHorizonDeg);
});
test('exact-ray target has a single witness; Earth touching horizon is obscured',()=>{
 const t=traceHorizon(site,sample,10,profile,'earth');assert.equal(t.witnesses.length,1);assert.equal(t.witnesses[0].rayAzimuthDeg,270);assert.equal(t.witnesses[0].interpolationWeight,1);assert.equal(t.modelAvailable,false);assert.equal(t.solarDiscFraction,null);
});
test('solar half-disc boundary follows the existing model criterion',()=>{
 const t=traceHorizon(site,{...sample,sunEl:3},5,profile);assert.equal(t.solarDiscFraction,.5);assert.equal(t.modelAvailable,true);
});
test('missing witness metadata never becomes a fabricated map location',()=>{
 const p=structuredClone(profile);delete p[1].blocker;assert.throws(()=>traceHorizon(site,sample,2,p),/unavailable/);
 p[1].blocker=[0,0];p[1].coverageM=100;assert.throws(()=>traceHorizon(site,sample,2,p),/coverage/);
 assert.throws(()=>traceHorizon(site,{...sample,az:NaN},2,profile),/observation/);
});
test('surface path preserves endpoints and lies on the great-circle plane',()=>{
 const start=lonLatToPolar(-137,-89.4),end=lonLatToPolar(-20,-85),path=surfacePathXY(start,end,16);
 assert.deepEqual(path[0],start);assert.deepEqual(path.at(-1),end);assert.equal(path.length,17);
 const v=xy=>{const p=polarToLonLat(...xy),l=p.longitude*Math.PI/180,b=p.latitude*Math.PI/180;return [Math.cos(b)*Math.cos(l),Math.cos(b)*Math.sin(l),Math.sin(b)];};
 const a=v(start),b=v(end),normal=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 for(const xy of path)assert.ok(Math.abs(v(xy).reduce((s,x,i)=>s+x*normal[i],0))<1e-12);
 assert.deepEqual(surfacePathXY(start,start),[start,start]);
});
