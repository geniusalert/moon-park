import test from 'node:test';
import assert from 'node:assert/strict';
import {slopeColor,elevationColor,SLOPE_BANDS,MISSING_COLOR} from '../src/terrain-palette.js';
test('legend slope boundaries match rendering and missing gradients stay distinct',()=>{
 for(const [angle,index] of [[0,0],[9.99,0],[10,1],[20,2],[30,3],[89,3]])assert.equal(slopeColor(angle),SLOPE_BANDS[index].color);
 assert.equal(slopeColor(null),MISSING_COLOR);assert.equal(slopeColor(NaN),MISSING_COLOR);
});
test('elevation scale is clamped, stable for flat tiles and never uses a rainbow',()=>{
 assert.equal(elevationColor(0,0,100),'#404e41');assert.equal(elevationColor(100,0,100),'#e6d8ac');
 assert.equal(elevationColor(-10,0,100),elevationColor(0,0,100));assert.equal(elevationColor(50,50,50),'#8fa37e');
 assert.equal(elevationColor(null,0,100),MISSING_COLOR);
});
