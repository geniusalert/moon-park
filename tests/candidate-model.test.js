import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';import {decodeCandidate} from '../src/candidate-model.js';
const manifest=JSON.parse(readFileSync('data/candidates.json','utf8')),point=manifest.regions[0].points[0],read=()=>JSON.parse(readFileSync(point.url.slice(1),'utf8'));
test('interior sample uses its own coordinates, native ground and height-specific observations',()=>{
 const p=read(),site=decodeCandidate(p,point);assert.equal(site.regionId,manifest.regions[0].regionId);assert.equal(site.groundM,p.site.groundM);assert.notDeepEqual(site.ephemeridesByHeight[2].earth,site.ephemeridesByHeight[10].earth);assert.equal(site.terrainVariants,undefined);
});
test('candidate rejects mismatched coordinates, gaps, missing horizons and malformed target range',()=>{
 let p=read();p.site.latitude+=.001;assert.throws(()=>decodeCandidate(p,point),/context/);
 p=read();p.times[2]=p.times[1];assert.throws(()=>decodeCandidate(p,point),/grid/);
 p=read();p.profiles[2].pop();assert.throws(()=>decodeCandidate(p,point),/horizon/);
 p=read();p.ephemerides[2].earth[0][2]=-1;assert.throws(()=>decodeCandidate(p,point),/observations/);
});
