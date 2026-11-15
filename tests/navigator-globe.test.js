import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {lunarXYZ,xyzToLunar,localDirection,supportedPolarPoint} from '../src/moon-coordinates.js';
import {MISSION_CONTEXT,POLAR_DESTINATIONS} from '../src/mission-catalogue.js';
test('globe coordinate selection round trips over seam, poles and hemispheres',()=>{for(const lat of [-90,-89.5,-85,-3,0,26,90])for(const lon of [-180,-90,0,23.47314,179.99]){const p=xyzToLunar(lunarXYZ(lon,lat));assert.ok(Math.abs(p.latitude-lat)<1e-6);if(Math.abs(lat)!==90)assert.ok(Math.abs((p.longitude-lon+540)%360-180)<1e-7);}});
test('texture coordinates align Greenwich, east and north',()=>{assert.deepEqual(lunarXYZ(0,0),[1,0,-0]);assert.ok(Math.abs(lunarXYZ(90,0)[2]+1)<1e-10);assert.ok(Math.abs(lunarXYZ(0,90)[1]-1)<1e-10);});
test('observer-relative globe directions are unit vectors with correct elevation',()=>{for(const latitude of [-90,-87.5,0,26])for(const az of [0,90,180,270])for(const el of [-4,0,30,90]){const v=localDirection(23,latitude,az,el),up=lunarXYZ(23,latitude);assert.ok(Math.abs(Math.hypot(...v)-1)<1e-10);assert.ok(Math.abs(v.reduce((sum,n,i)=>sum+n*up[i],0)-Math.sin(el*Math.PI/180))<1e-10);}});
test('historical missions never qualify for polar calculations',()=>{assert.equal(MISSION_CONTEXT.length,6);for(const site of MISSION_CONTEXT){assert.equal(supportedPolarPoint(site),false);assert.match(site.source,/nasa.gov/);assert.equal(site.kind,'historical-context');}assert.ok(supportedPolarPoint({latitude:-90,longitude:0}));assert.ok(supportedPolarPoint({latitude:-85,longitude:180}));assert.equal(supportedPolarPoint({latitude:-84.999,longitude:0}),false);});
test('bundled globe asset retains its acquired NASA source checksum',()=>{const manifest=JSON.parse(readFileSync('data/globe/manifest.json'));assert.equal(createHash('sha256').update(readFileSync(manifest.file)).digest('hex'),manifest.sha256);assert.match(manifest.source,/svs.gsfc.nasa.gov/);});

test('curated polar study points request their own supported coordinates',()=>{assert.equal(POLAR_DESTINATIONS.length,3);for(const p of POLAR_DESTINATIONS){assert.ok(supportedPolarPoint(p));assert.equal(p.id,`coordinate:${p.latitude}:${p.longitude}`);assert.equal(p.kind,'custom');assert.ok(p.coordinateBasis);assert.ok(p.source);}});
test('local north and east directions align with Moon coordinate axes',()=>{const near=(a,b)=>a.every((v,i)=>Math.abs(v-b[i])<1e-10);assert.ok(near(localDirection(0,0,0,0),[0,1,0]));assert.ok(near(localDirection(0,0,90,0),[0,0,-1]));assert.ok(near(localDirection(0,-90,0,0),[1,0,0]));assert.ok(near(localDirection(90,0,90,0),[-1,0,0]));});
