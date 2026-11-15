import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {calibrateHardware,validateHardwareDataset} from '../src/hardware-thermal.js';
import {validateHardwareThermalReceipt} from '../src/hardware-thermal-panel.js';
import {createHash} from 'node:crypto';
const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/hardware-thermal-synthetic.json',import.meta.url)));
const copy=()=>structuredClone(fixture);
test('analytical synthetic cooling recovers heat capacity without claiming hardware validation',()=>{
 const report=calibrateHardware(copy());
 assert.equal(report.calibratedParameters.heatCapacityJK,1000);
 assert.equal(report.status,'synthetic-software-check');
 assert.equal(report.independentValidationPass,false);
 assert.ok(report.validationWithinLimits);
 assert.ok(report.validationMetrics.maxAbsErrorK<.5);
});
test('held-out measurements cannot influence the fitted parameters',()=>{
 const data=copy();data.runs[1].rows.slice(1).forEach(row=>{row.temperatureK+=20;});
 const report=calibrateHardware(data);
 assert.equal(report.calibratedParameters.heatCapacityJK,1000);
 assert.equal(report.validationWithinLimits,false);
 assert.ok(report.validationMetrics.rmseK>10);
});
test('duplicated runs, missing source, bad times and temperature units reject',()=>{
 for(const mutate of [
  d=>{d.runs[1].rows=structuredClone(d.runs[0].rows);},
  d=>{d.runs[1].sourceReference='';},
  d=>{d.runs[0].rows[2].elapsedSeconds=0;},
  d=>{d.temperatureUnit='C';},
  d=>{d.parameters.emissivity=0;}
 ]){
  const data=copy();mutate(data);assert.throws(()=>validateHardwareDataset(data));
 }
});
test('unfilled measurement template cannot become measured validation',()=>{
 const template=JSON.parse(fs.readFileSync(new URL('../docs/hardware-thermal-template.json',import.meta.url)));
 assert.throws(()=>calibrateHardware(template));
});
test('hardware input identity is checked before restoring a receipt',async()=>{
 const dataset=copy();
 const receipt={schemaVersion:1,dataset,inputSHA256:createHash('sha256').update(JSON.stringify(dataset)).digest('hex')};
 await validateHardwareThermalReceipt(receipt);
 dataset.criteria.maxRMSEK+=1;
 await assert.rejects(validateHardwareThermalReceipt(receipt),/identity changed/);
});
