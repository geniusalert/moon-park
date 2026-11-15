import test from 'node:test';
import assert from 'node:assert/strict';
import {displayTerrainStats,earthMotion} from '../src/terrain-dynamics.js';
test('display slopes retain spacing, missing cells and true relief',()=>{
 const tile={width:3,height:3,x:[0,10,20],y:[20,10,0],z:[[0,10,20],[0,10,20],[0,10,20]]};
 let r=displayTerrainStats(tile);assert.equal(r.reliefM,20);assert.equal(r.slopes[1][1],45);assert.equal(r.slopes[0][1],null);
 tile.z[1][0]=null;r=displayTerrainStats(tile);assert.equal(r.slopes[1][1],null);assert.equal(r.maxSlopeDeg,null);assert.equal(r.validCells,8);
});
test('Earth motion unwraps azimuth and reports observed ranges without inventing libration',()=>{
 const r=earthMotion([{earthAz:359,earthEl:-1,earthCenterClearanceDeg:-2,earthRangeKm:400000},{earthAz:1,earthEl:1,earthCenterClearanceDeg:0,earthRangeKm:390000}]);
 assert.equal(r.azimuthSweepDeg,2);assert.deepEqual(r.rangeKm,{min:390000,max:400000});assert.deepEqual(r.elevation,{min:-1,max:1});assert.equal(earthMotion([{earthAz:0,earthEl:0}]).rangeKm,null);
});
