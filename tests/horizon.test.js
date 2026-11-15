import {test} from 'node:test';
import assert from 'node:assert/strict';
import {compileHorizon} from '../src/engine.js';
test('dense horizon binary interpolation preserves exact ray values and seam',()=>{const p=Array.from({length:1440},(_,i)=>({az:i/4,el:Math.sin(i/4*Math.PI/180)}));const at=compileHorizon(p);for(let i=0;i<1440;i+=17)assert.ok(Math.abs(at(p[i].az)-p[i].el)<1e-12);assert.equal(at(0),at(360));assert.equal(at(-90),at(270));});
test('duplicate and invalid angles are rejected',()=>{assert.throws(()=>compileHorizon([{az:0,el:1},{az:0,el:2}]));assert.throws(()=>compileHorizon([{az:360,el:1}]));assert.throws(()=>compileHorizon([{az:0,el:1}])(NaN));});
