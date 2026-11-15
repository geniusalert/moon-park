import test from 'node:test';import assert from 'node:assert/strict';
import {pixelToXY,validPick,assessRegistration,restoreAlignment} from '../src/registration-model.js';
const entry={width:100,height:100,boundsXYM:[0,0,100,100],masks:{image:Array(10000).fill(1),terrain:Array(10000).fill(1)}};
const pair=(id,role,x,y,dx=2,dy=-3)=>({id,role,label:'Crater '+id,image:[x,y],terrain:[x+dx,y+dy]});
test('pixel centers and mask boundaries preserve north-up coordinates',()=>{
 assert.deepEqual(pixelToXY(entry,0,0),[.5,99.5]);assert.deepEqual(pixelToXY(entry,99,99),[99.5,.5]);
 assert.equal(validPick(entry,'image',[100,5]),false);assert.equal(validPick(entry,'image',[5,0]),false);
 const masked={...entry,masks:{...entry.masks,image:[...entry.masks.image]}};masked.masks.image[0]=0;assert.equal(validPick(masked,'image',[.5,99.5]),false);
});
test('restoring evidence verifies sources and recomputes rather than trusting saved approval',()=>{
 const ref={url:'/data/test.png',sha256:'a'.repeat(64)},context={...entry,siteId:'A',sourceImage:ref,sourceMetadata:ref,demSource:{sha256:'b'.repeat(64)},assets:{image:ref}};
 const record={schemaVersion:1,application:'Moon Park alignment workbench',siteId:'A',sourceImage:ref,sourceMetadata:ref,demSource:context.demSource,inspectionAssets:context.assets,pairs:[pair('a','fit',10,10)],assessment:{registrationEstablished:true,translationM:[999,999]}};
 const restored=restoreAlignment(context,record);assert.deepEqual(restored.assessment.translationM,[2,-3]);assert.equal(restored.assessment.registrationEstablished,false);
 assert.throws(()=>restoreAlignment(context,{...record,sourceImage:{...ref,sha256:'c'.repeat(64)}}),/sources have changed/);
 assert.throws(()=>restoreAlignment(context,{...record,siteId:'B'}),/different area/);
 assert.throws(()=>restoreAlignment(context,{...record,pairs:Array(201).fill(record.pairs[0])}),/200/);
 assert.throws(()=>restoreAlignment(context,{...record,pairs:[{...record.pairs[0],image:[NaN,0]}]}),/valid/);
});
test('held-out landmarks do not influence translation and expose mismatch',()=>{
 const fit=[pair('a','fit',10,10),pair('b','fit',80,15),pair('c','fit',20,80)];
 const checks=[pair('d','check',15,20,12,-3),pair('e','check',70,25,12,-3),pair('f','check',25,70,12,-3)];
 const a=assessRegistration(entry,[...fit,...checks]);assert.deepEqual(a.translationM,[2,-3]);assert.equal(a.heldOutResidual.rmseM,10);assert.equal(a.fitResidual.rmseM,0);assert.equal(a.status,'ready-for-review');assert.equal(a.registrationEstablished,false);
});
test('no evidence, narrow coverage and reused landmarks cannot establish registration',()=>{
 assert.equal(assessRegistration(entry,[]).translationM,null);
 assert.equal(assessRegistration(entry,[pair('a','fit',10,10)]).status,'insufficient-landmarks');
 assert.throws(()=>assessRegistration(entry,[pair('a','fit',10,10),pair('b','check',10,10)]),/Duplicate/);
 assert.throws(()=>assessRegistration(entry,[pair('a','fit',99,99)]),/valid/);
});
