import {test} from 'node:test';
import assert from 'node:assert/strict';
import {engineeringEstimate} from '../src/engineering-model.js';
const p={areaM2:1,efficiency:1,derating:1,tiltDeg:0,azimuthDeg:0,loadW:100,chargeEfficiency:1,dischargeEfficiency:1,usableFraction:.5,absorptivity:1,emissivity:1,radiatingAreaM2:1,internalHeatW:0};
const sample={hour:0,sunEl:90,az:0,sunFraction:1,sunRangeKm:149597870.7};
test('normal incidence and inverse square irradiance match analytical energy',()=>{
 const full=engineeringEstimate([sample],2,p);
 assert.ok(Math.abs(full.energyWh-2722)<1e-8);
 assert.ok(Math.abs(engineeringEstimate([{...sample,sunRangeKm:sample.sunRangeKm*2}],2,p).energyWh-680.5)<1e-8);
 assert.ok(Math.abs(full.bins[0].equilibriumK-(1361/5.670374419e-8)**.25)<1e-9);
});
test('battery sizing follows consecutive deficits and recharge',()=>{
 const dark={...sample,sunFraction:0};
 assert.ok(Math.abs(engineeringEstimate([dark,{...dark,hour:1}],2,p).minimumInitiallyFullBatteryWh-400)<1e-8);
 assert.ok(Math.abs(engineeringEstimate([dark,{...sample,hour:1},{...dark,hour:2}],3,p).minimumInitiallyFullBatteryWh-200)<1e-8);
});
test('invalid physical fractions and timeline reject',()=>{
 assert.throws(()=>engineeringEstimate([sample],1,{...p,efficiency:2}));
 assert.throws(()=>engineeringEstimate([{...sample,hour:1}],1,p));
});

test('initial charge and discharge power limit expose unmet load',()=>{
 const result=engineeringEstimate([{...sample,sunFraction:0}],1,{...p,initialChargeFraction:0,maxDischargeW:0});
 assert.ok(Math.abs(result.unservedWh-100)<1e-8);
 assert.equal(result.finalStoredWh,0);
});
test('radiative cooling follows analytic isolated-body solution',()=>{
 const initial=250,heatCapacity=10000,duration=1;
 const result=engineeringEstimate([{...sample,sunFraction:0}],duration,{...p,initialTemperatureK:initial,heatCapacityJK:heatCapacity});
 const exact=(initial**-3+3*5.670374419e-8*3600/heatCapacity)**(-1/3);
 assert.ok(Math.abs(result.bins[0].temperatureK-exact)<.5);
});
