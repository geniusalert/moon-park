import test from 'node:test';
import assert from 'node:assert/strict';
import {compassPoint,availabilityPercent} from '../src/visual-observatory.js';
test('compass is clockwise from north and wraps longitude-like angles',()=>{
 assert.deepEqual(compassPoint(0),[110,34]);assert.deepEqual(compassPoint(90),[186,110]);
 assert.ok(Math.abs(compassPoint(360)[0]-110)<1e-10);
 assert.equal(compassPoint(180)[1],186);
});
test('availability dials use mission duration, preserve zero and clip visual overflow',()=>{
 assert.equal(availabilityPercent(36,72),50);assert.equal(availabilityPercent(0,72),0);assert.equal(availabilityPercent(80,72),100);assert.equal(availabilityPercent(NaN,72),0);
});
