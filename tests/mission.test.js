import {test} from 'node:test';
import assert from 'node:assert/strict';
import {evaluateMission,findRecovery,scheduleActivity,receipt} from '../src/mission.js';

function site(){
 const observations=Array.from({length:1000},(_,i)=>({utc:new Date(Date.UTC(2026,10,14)+i*600000).toISOString(),az:90,el:3}));
 return {id:'test',name:'Test point',ephemerides:{sun:observations,earth:observations.map(s=>({...s}))},profiles:Object.fromEntries([2,5,10].map(h=>[h,Array.from({length:360},(_,az)=>({az,el:1,coverageM:1000}))])),provenance:{sha256:'fixture'},ephemerisProvenance:{}};
}
test('real pipeline integrates half-open bins without claiming full feasibility',()=>{const r=evaluateMission(site(),{delay:0,duration:24});assert.equal(r.overlap,24);assert.equal(r.sunHours,24);assert.equal(r.longestDark,0);assert.equal(r.modelPass,true);assert.equal(r.feasible,null);assert.equal(r.samples.length,144);});
test('Earth and Sun use their own azimuth horizon',()=>{const s=site();s.profiles[2][180].el=5;s.ephemerides.earth=s.ephemerides.earth.map(e=>({...e,az:180}));const r=evaluateMission(s,{delay:0,duration:24});assert.equal(r.sunHours,24);assert.equal(r.earthHours,0);assert.equal(r.modelPass,false);});
test('missing coverage, gaps and out-of-bounds dates reject rather than invent data',()=>{const s=site();assert.throws(()=>evaluateMission(s,{delay:0,startUTC:'2025-01-01'}));s.ephemerides.sun[1].utc='2026-11-14T00:11:00Z';assert.throws(()=>evaluateMission(s,{delay:0,duration:1}));s.profiles[2][0].el=null;assert.throws(()=>evaluateMission(s,{delay:0,duration:1}));});
test('recovery enumerates a bounded search and returns no fabricated optimum',()=>{const found=findRecovery([site()],{delay:0,duration:24,height:2},{stepHours:12,maxExtraHours:24});assert.equal(found.tested,3);assert.equal(found.candidates.length,3);assert.equal(found.candidates[0].extraHours,0);assert.throws(()=>findRecovery([site()],{}, {stepHours:0}));});
test('activity requires a continuous window, not accumulated overlap',()=>{const r={startUTC:'2026-11-14T00:00:00Z',combinedWindows:[[0,1],[2,3]]};assert.equal(scheduleActivity(r,2).length,0);assert.equal(scheduleActivity(r,1).length,2);assert.throws(()=>scheduleActivity(r,0));});
test('receipt retains provisional status, assumptions and source evidence',()=>{const s=site(),r=evaluateMission(s,{delay:0,duration:1});const data=receipt({sites:[s],status:'test'},r.config,[r],{});assert.equal(data.schemaVersion,4);assert.equal(data.results[0].feasible,null);assert.equal(data.sources[0].terrain.sha256,'fixture');});
test('non-finite and negative inputs are rejected',()=>{for(const config of [{maxDark:NaN},{duration:0},{height:3},{delay:-1},{minOverlap:-1}])assert.throws(()=>evaluateMission(site(),config));});
test('observer-specific ephemerides are selected at the requested height',()=>{const s=site();s.ephemeridesByHeight={'5':{sun:s.ephemerides.sun.map(p=>({...p,el:-1})),earth:s.ephemerides.earth}};const r=evaluateMission(s,{height:5,delay:0,duration:1});assert.equal(r.sunHours,0);assert.ok(!r.limitations.some(x=>x.includes('parallax is not recomputed')));});
test('fine cadence requires actual source observations rather than invented upsampling',()=>{const s=site();assert.throws(()=>evaluateMission(s,{stepMinutes:1,delay:0,duration:1}));s.observationStepMinutes=1;s.ephemerides.sun=s.ephemerides.sun.map((r,i)=>({...r,utc:new Date(Date.UTC(2026,10,14)+i*60000).toISOString()}));s.ephemerides.earth=s.ephemerides.sun;const r=evaluateMission(s,{stepMinutes:1,delay:0,duration:1});assert.equal(r.samples.length,60);assert.equal(r.overlap,1);});

test('refined airless mission retains remote-envelope and spatial diagnostics',()=>{
 const s=site();for(const h of [2,5,10])s.profiles[h]=s.profiles[h].map(p=>({...p,remoteUpperBoundDeg:4}));
 s.horizonModel={version:'airless-lola-v2',refraction:'none',remoteEnvelope:{maxElevationM:12000},limitations:['Conditional remote envelope']};
 s.ephemerides.sun=s.ephemerides.sun.map(p=>({...p,rangeKm:149597870.7}));
 const r=evaluateMission(s,{delay:0,duration:1});
 assert.equal(r.horizonDiagnostics.refraction,'none');assert.equal(r.horizonDiagnostics.sunSamplesSensitiveToRemoteEnvelope,6);
 assert.ok(r.samples.every(p=>p.sunFraction>=p.remoteTerrainSunFractionLowerBound));
 assert.equal(r.samples[0].remoteTerrainEarthVisible,false);assert.equal(r.horizonModel.version,'airless-lola-v2');
 assert.ok(r.limitations.includes('Conditional remote envelope'));
});

test('sunlight and contiguous direct-Earth blackout limits include equality',()=>{
 const point=site();
 point.ephemerides.earth.forEach((sample,index)=>{sample.el=index%6<3?-4:4;});
 const settings={delay:0,duration:2,minOverlap:0,minSun:2,maxBlackout:0.5};
 const result=evaluateMission(point,settings);
 assert.equal(result.longestEarthBlackout,0.5);
 assert.equal(result.modelPass,true);
 const failed=evaluateMission(point,{...settings,minSun:3,maxBlackout:0.25});
 assert.equal(failed.failures.length,2);
 assert.equal(failed.modelPass,false);
 assert.throws(()=>evaluateMission(point,{...settings,maxBlackout:-1}));
});

test('31-day mission retains every ten-minute bin across a UTC year boundary',()=>{
 const point=site(),startUTC='2027-12-31T23:50:00Z';
 const observations=Array.from({length:744*6+1},(_,i)=>({
  utc:new Date(Date.parse(startUTC)+i*600000).toISOString(),az:90,el:3
 }));
 point.ephemerides={sun:observations,earth:observations};
 const result=evaluateMission(point,{startUTC,delay:0,duration:744});
 assert.equal(result.samples.length,4464);
 assert.equal(result.endUTC,'2028-01-31T23:50:00.000Z');
 assert.ok(Math.abs(result.sunHours-744)<1e-8);
 assert.throws(()=>evaluateMission(point,{startUTC,delay:0,duration:745}));
});

