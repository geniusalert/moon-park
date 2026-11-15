import test from 'node:test';
import assert from 'node:assert/strict';
import {solarGeometry,summarizeSolar} from '../src/solar-geometry.js';
test('visible low Sun, blocked high Sun and depressed horizon are separate from incidence',()=>{
 const sample=(sunEl,horizon,sunFraction=1)=>({sunEl,horizon,sunFraction});
 assert.ok(Math.abs(solarGeometry(sample(30,0)).horizontalProjection-.5)<1e-12);
 assert.equal(solarGeometry(sample(30,40,0)).unblockedCenterProjection,0);
 const below=solarGeometry(sample(-1,-2));assert.equal(below.centerVisible,true);assert.equal(below.unblockedCenterProjection,0);
 assert.equal(solarGeometry(sample(0,0,.5)).centerVisible,false);
 assert.equal(solarGeometry(sample(90,0)).incidenceDeg,0);
});
test('projection uses clipped time bins and does not turn partial-disc fraction into watts',()=>{
 const r=summarizeSolar([{hour:0,sunEl:30,horizon:0,sunFraction:.6},{hour:1,sunEl:30,horizon:40,sunFraction:0}],1.5);
 assert.ok(Math.abs(r.equivalentNormalIncidenceHours-.5)<1e-12);
 assert.ok(Math.abs(r.meanUnblockedHorizontalProjection-1/3)<1e-12);
 assert.throws(()=>solarGeometry({sunEl:NaN,horizon:0,sunFraction:1}));
 assert.throws(()=>summarizeSolar([{hour:2,sunEl:0,horizon:0,sunFraction:1}],1));
});
