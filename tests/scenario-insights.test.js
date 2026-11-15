import test from 'node:test';
import assert from 'node:assert/strict';
import {scheduleImpact,siteSeparation,shadowRatio} from '../src/scenario-insights.js';
test('schedule impact aligns relative samples, preserves signed losses and constraint flips',()=>{
 const sample=(sun,earth)=>({sun,earth});
 const c={baseline:{startUTC:'2027-01-01T00:00Z',samples:[sample(true,true),sample(false,true)],overlap:1,longestCombined:1,failures:[]},revised:{startUTC:'2027-01-01T12:00Z',samples:[sample(false,true),sample(false,true)],overlap:0,longestCombined:0},baselineFailures:[],failures:['activity']};
 assert.deepEqual(scheduleImpact(c),{delayHours:12,overlapChange:-1,continuousChange:-1,changedSamples:1,comparedSamples:2,passChanged:true});
 c.revised=c.baseline;c.failures=[];assert.equal(scheduleImpact(c).changedSamples,0);assert.equal(scheduleImpact(c).passChanged,false);
});
test('shadow illustration handles low Sun, vertical Sun and below-horizontal cases',()=>{
 assert.ok(Math.abs(shadowRatio(30)-Math.sqrt(3))<1e-12);
 assert.ok(shadowRatio(1)>57);assert.ok(shadowRatio(90)<1e-12);
 for(const el of [-1,0,91,NaN])assert.equal(shadowRatio(el),null);
});
test('spherical pair distances handle wrapping and poles',()=>{
 assert.ok(siteSeparation({latitude:0,longitude:179},{latitude:0,longitude:-179})<61);
 assert.ok(siteSeparation({latitude:-90,longitude:0},{latitude:-90,longitude:120})<1e-9);
 assert.equal(siteSeparation({latitude:20,longitude:30},{latitude:20,longitude:30}),0);
});
