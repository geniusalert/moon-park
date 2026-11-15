import test from 'node:test';
import assert from 'node:assert/strict';
import {validateAIPlan,rankSiteResults} from '../src/ai-plan.js';
import {interpretWithMeta,metaRequest,validateImages} from '../scripts/ai-service.mjs';
const sites=[{id:'apollo',name:'Apollo',latitude:.67,longitude:23.47},{id:'unpublished',name:'Future mission'}];
const config={key:'test-key-never-real',model:'test-model',base:'https://api.meta.ai/v1',legacy:false};
const plan=()=>({action:'calculate',reply:'Calculate the requested visibility.',locations:[{catalogueId:'apollo',name:null,latitude:null,longitude:null}],settings:{startUTC:'2027-06-21T12:00:00Z',duration:24,delay:0,height:2,maxDark:null,minOverlap:null,minSun:null,maxBlackout:null,activityHours:2,modelPreference:'reference-sphere'},assumptions:[],questions:[],view:'horizon',arrivalDeadlineUTC:null});
const input=()=>({message:'Show Apollo in June 2027',images:[],history:[],context:{settings:{duration:72,activityHours:2}}});
const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aN1cAAAAASUVORK5CYII=';
test('catalogue identity is resolved rather than model-generated coordinates',()=>{
 const p=validateAIPlan(plan(),sites);assert.equal(p.locations[0].latitude,.67);
 const forged=plan();forged.locations[0].latitude=10;assert.throws(()=>validateAIPlan(forged,sites),/changed a catalogue/);
 for(const id of ['not-real','unpublished']){const p=plan();p.locations[0].catalogueId=id;assert.throws(()=>validateAIPlan(p,sites));}
});
test('arbitrary execution and unexpected plan fields are rejected',()=>{
 const p=plan();p.action='run_shell';assert.throws(()=>validateAIPlan(p,sites));
 const q=plan();q.settings.javascript='alert(1)';assert.throws(()=>validateAIPlan(q,sites),/Unexpected/);
});
test('unsupported dates, silent rounding and equipment heights are rejected',()=>{
 for(const date of ['2026-06-21T12:00:00Z','2027-02-30T00:00:00Z','2027-06-21T12:03:00Z','2027-06-21T12:00:00+05:30']){const p=plan();p.settings.startUTC=date;assert.throws(()=>validateAIPlan(p,sites),/2027 UTC/);}
 const p=plan();p.settings.height=3;assert.throws(()=>validateAIPlan(p,sites),/height/);
});
test('custom longitude wraps and exact pole uses its documented reference',()=>{
 const p=plan();p.locations=[{catalogueId:null,name:'Study point',latitude:-90,longitude:300}];assert.equal(validateAIPlan(p,sites).locations[0].longitude,0);
 p.locations[0].latitude=-88;assert.equal(validateAIPlan(p,sites).locations[0].longitude,-60);
});
test('arrival deadline produces a bounded search and cannot cross the supported year',()=>{
 const p=plan();p.action='find_arrival';p.arrivalDeadlineUTC='2027-06-24T12:00:00Z';assert.equal(validateAIPlan(p,sites).settings.startUTC,'2027-06-21T12:00:00Z');
 p.arrivalDeadlineUTC='2027-01-02T00:00:00Z';assert.throws(()=>validateAIPlan(p,sites),/outside 2027/);
});
test('questions force clarification; missing or impossible activity cannot execute',()=>{
 const p=plan();p.questions=['Which year?'];assert.equal(validateAIPlan(p,sites).action,'clarify');
 p.settings.duration=1;assert.throws(()=>validateAIPlan(p,sites),/fit within/);
});
test('site ranking never recommends a failed or unavailable scenario',()=>{
 const r=(id,failures,longestCombined,overlap)=>({id,comparison:{failures,revised:{longestCombined,overlap}}});
 const ranking=rankSiteResults([r('fails',['darkness'],100,100),{id:'unavailable'},r('a',[],2,10),r('b',[],4,5)]);assert.deepEqual(ranking.map(r=>r.id),['b','a']);
});
test('site ranking identifies equal passing metrics as ties',()=>{
 const record=id=>({id,comparison:{failures:[],revised:{longestCombined:4,overlap:8}}});
 const ranking=rankSiteResults([record('a'),record('b')]);assert.equal(ranking.length,2);assert.ok(ranking.every(r=>r.tied));
});
test('images must be bounded inline images with matching magic bytes',()=>{
 assert.equal(validateImages([{dataURL:png}]).length,1);
 assert.throws(()=>validateImages([{dataURL:'https://example.com/x.png'}]));
 assert.throws(()=>validateImages([{dataURL:png.replace('image/png','image/jpeg')}]));
 assert.throws(()=>validateImages([{dataURL:png},{dataURL:png},{dataURL:png}]));
});
test('current and legacy Meta envelopes support images and schema output',()=>{
 for(const legacy of [false,true]){const r=metaRequest({...config,legacy},{...input(),images:[png]},sites);assert.equal(r.messages.at(-1).content[1].type,'image_url');assert.equal(r.response_format.type,'json_schema');assert.equal(r.stream,false);}
});
test('provider adapter validates a structured multimodal plan before returning it',async()=>{
 let sent;const response=await interpretWithMeta({...input(),images:[{dataURL:png}]},config,sites,async(url,options)=>{sent={url,...options};return new Response(JSON.stringify({choices:[{message:{content:JSON.stringify(plan())}}]}));});
 assert.equal(response.plan.action,'calculate');assert.equal(sent.url,'https://api.meta.ai/v1/chat/completions');assert.equal(JSON.parse(sent.body).messages.at(-1).content[1].image_url.url,png);assert.equal(sent.headers.Authorization,'Bearer test-key-never-real');
 const legacy=await interpretWithMeta(input(),{...config,legacy:true},sites,async()=>new Response(JSON.stringify({completion_message:{content:{type:'text',text:JSON.stringify(plan())}}})));assert.equal(legacy.plan.action,'calculate');
});
test('missing credentials make no provider call; provider errors do not leak bodies',async()=>{
 let called=false;await assert.rejects(()=>interpretWithMeta(input(),{...config,key:''},sites,async()=>{called=true;}),/META_API_KEY/);assert.equal(called,false);
 await assert.rejects(()=>interpretWithMeta(input(),config,sites,async()=>new Response('private-upstream-detail',{status:401})),e=>!e.message.includes('private-upstream-detail')&&e.message.includes('key'));
 await assert.rejects(()=>interpretWithMeta(input(),config,sites,async()=>new Response(JSON.stringify({choices:[{message:{content:JSON.stringify({...plan(),action:'execute_code'})}}]}))),/Invalid AI action/);
});
test('cancellation is passed to the provider request',async()=>{
 const controller=new AbortController();controller.abort();
 await assert.rejects(()=>interpretWithMeta(input(),config,sites,async(url,options)=>{assert.equal(options.signal.aborted,true);throw new DOMException('Cancelled','AbortError');},controller.signal),e=>e.name==='AbortError');
});
