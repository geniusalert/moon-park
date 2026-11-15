import test from 'node:test';
import assert from 'node:assert/strict';
import {analysisStatus} from '../src/analysis-status.js';

test('a running terrain job explains the wait and labels stage progress',()=>{
 const s=analysisStatus({name:'Grid west',pending:true,job:{status:'running',stage:'Calculating airless terrain horizon',progress:.5}});
 assert.equal(s.busy,true);assert.equal(s.progress,.5);assert.match(s.detail,/50% of this stage/);assert.match(s.explanation,/before these views/);
});
test('queued work retains its queue position without inventing a completion percentage',()=>{
 const s=analysisStatus({job:{status:'queued',stage:'Waiting',queuePosition:2}});
 assert.equal(s.busy,true);assert.equal(s.progress,null);assert.match(s.detail,/queue position 2/);
});
test('cancelled and failed jobs expose retry rather than the initial location prompt',()=>{
 for(const job of [{status:'cancelled'},{status:'failed',error:'Missing terrain support'}]){
  const s=analysisStatus({job});assert.equal(s.visible,true);assert.equal(s.busy,false);assert.equal(s.retry,true);
 }
 assert.equal(analysisStatus({job:{status:'failed',error:'Missing terrain support'}}).detail,'Missing terrain support');
});
test('a valid displayed result clears the loading state',()=>{
 const s=analysisStatus({hasResult:true,job:{status:'completed'}});assert.equal(s.visible,false);assert.equal(s.busy,false);
});
