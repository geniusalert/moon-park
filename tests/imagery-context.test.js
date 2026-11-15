import test from 'node:test';import assert from 'node:assert/strict';
import {describeImageContext} from '../src/imagery-context.js';
const site={id:'a',longitude:-137,latitude:-89};
const entry=state=>({pointCoverage:{a:{longitude:-137,latitude:-89,state}}});
test('historical crop support distinguishes valid pixels, nodata and outside coverage',()=>{
 for(const state of ['valid-source-pixel','source-nodata','outside-crop'])assert.equal(describeImageContext(entry(state),site).state,state);
 assert.match(describeImageContext(entry('source-nodata'),site).message,/no image value/);
});
test('historical image support is not inherited by a different coordinate',()=>{
 assert.equal(describeImageContext(entry('valid-source-pixel'),{...site,longitude:-138}).state,'unverified-coordinate-context');
 assert.equal(describeImageContext(null,site).state,'unavailable');
 assert.throws(()=>describeImageContext(entry('whole-region-approved'),site),/Invalid/);
});
