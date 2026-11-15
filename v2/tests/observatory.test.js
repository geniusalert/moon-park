import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {globeFitDistance,reframedDistance,globeOccludes} from '../layout-math.js';
test('fitted globe stays within the available scene with both wide and phone frames',()=>{for(const [h,w,freeH]of [[1080,900,800],[844,360,620],[800,450,300]]){const d=globeFitDistance(h,w,freeH),diameter=h/(Math.sqrt(d*d-1)*Math.tan(40*Math.PI/360));assert.ok(Math.abs(diameter-Math.min(w,freeH)*.84)<1e-7);}});
test('opening graphs reduces apparent globe size to preserve its relative scene fit',()=>{const a={fullHeight:1000,width:900,height:800},b={fullHeight:1000,width:900,height:500};assert.equal(reframedDistance(4,a,b),6.4);assert.equal(reframedDistance(6.4,b,a),4);assert.ok(reframedDistance(2,a,{fullHeight:1000,width:800,height:900})>=1.75);});
test('display labels behind the Moon are occluded while off-limb and foreground bodies remain available',()=>{assert.equal(globeOccludes([0,0,5],[0,0,-3]),true);assert.equal(globeOccludes([0,0,5],[3,0,-3]),false);assert.equal(globeOccludes([0,0,5],[0,0,3]),false);assert.equal(globeOccludes([0,0,5],[0,0,5]),false);});
test('initial observatory reserves no graph dock and loads the scene-first shell styles',()=>{const html=readFileSync('v2/index.html','utf8');const body=html.match(/<body[^>]+>/)[0];assert.doesNotMatch(body,/dock-open/);assert.match(html,/aria-expanded="false" id="v2ToggleDock"/);assert.match(html,/\/v2\/observatory.css/);assert.match(body,/left-open/);});
