import test from 'node:test';import assert from 'node:assert/strict';
import {stereoContext,mayPickTerrain} from '../src/stereo-reference.js';
const image={url:'/data/image.tif',sha256:'a'.repeat(64)},entry={siteId:'Site04',sourceImage:image,demSource:{sha256:'b'.repeat(64)},width:2,height:2,boundsXYM:[0,0,10,10]};
const reference={schemaVersion:1,siteId:'Site04',imageContext:image,missionDEM:entry.demSource,width:2,height:2,boundsXYM:entry.boundsXYM,strictCorrelationFraction:.5,strictDifference:{count:2},assets:Object.fromEntries(['shade45','shade135','shade225','shade315','slope','confidence'].map(k=>[k,{url:'/data/registration/reference/'+k+'.png',sha256:'c'.repeat(64)}]))};
test('reference binds only to the exact image, mission DEM and grid',()=>{
 assert.equal(stereoContext(entry,reference),reference);assert.equal(stereoContext({...entry,siteId:'Site11'},reference),null);
 assert.throws(()=>stereoContext(entry,{...reference,missionDEM:{sha256:'d'.repeat(64)}}),/grid/);
 assert.throws(()=>stereoContext(entry,{...reference,boundsXYM:[1,0,10,10]}),/grid/);
 assert.throws(()=>stereoContext(entry,{...reference,strictCorrelationFraction:.75}),/support/);
});
test('reference terrain cannot silently supply mission registration picks',()=>{
 assert.equal(mayPickTerrain('mission'),true);assert.equal(mayPickTerrain('stereo'),false);assert.equal(mayPickTerrain('unknown'),false);
});
