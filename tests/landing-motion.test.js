import test from 'node:test';
import assert from 'node:assert/strict';
import {landingPose,TOUCHDOWN_SECONDS,LANDING_DURATION} from '../src/landing-motion.js';
test('illustrative descent is deterministic when paused, rewound or sought',()=>{
 for(const t of [0,12,35,52,58,66]){const a=landingPose(t);landingPose(66);landingPose(0);assert.deepEqual(landingPose(t),a);}
});
test('height decreases to contact without sinking through the landing reference',()=>{
 let previous=Infinity;for(let t=0;t<=LANDING_DURATION;t+=.1){const p=landingPose(t);assert.ok(p.altitude>=0);assert.ok(p.altitude<=previous);assert.ok(p.descentSpeed>=0);previous=p.altitude;}
 const p=landingPose(TOUCHDOWN_SECONDS);assert.equal(p.altitude,0);assert.equal(p.descentSpeed,0);assert.equal(p.engine,false);assert.equal(p.phase,'Touchdown');assert.equal(p.tilt,0);
});
test('endpoints clamp and exhaust/dust stop after touchdown',()=>{
 assert.deepEqual(landingPose(-100),landingPose(0));assert.deepEqual(landingPose(999),landingPose(LANDING_DURATION));assert.equal(landingPose(66).dust,0);assert.equal(landingPose(66).engine,false);
});
