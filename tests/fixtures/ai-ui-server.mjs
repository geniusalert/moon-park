// Browser acceptance fixture only: scripted model output; actual production calculations.
// Run explicitly with node tests/fixtures/ai-ui-server.mjs. Never used by npm start.
import http from 'node:http';
import {validateAIPlan} from '../../src/ai-plan.js';
import {MISSION_SITES} from '../../src/mission-catalogue.js';
const port=Number(process.env.AI_TEST_PORT??4183);
http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://127.0.0.1:'+port);
  if(url.pathname==='/api/ai/status'){res.writeHead(200,{'Content-Type':'application/json'}).end(JSON.stringify({configured:true,provider:'SCRIPTED TEST FIXTURE — not Meta',model:'browser-acceptance'}));return;}
  if(url.pathname==='/api/ai/plan'){
   let body='';for await(const part of req)body+=part;const input=JSON.parse(body);
   const action=input.message.toLowerCase().includes('deadline')?'find_arrival':input.message.toLowerCase().includes('where')?'find_site':'compare_sites';
   const plan={action,reply:'Scripted acceptance test: interpreting the requested scenario. This response did not come from Meta.',locations:(action==='find_arrival'?['apollo-12']:['apollo-11','apollo-12']).map(catalogueId=>({catalogueId,name:null,latitude:null,longitude:null})),settings:{startUTC:'2027-06-21T12:00:00Z',duration:24,delay:0,height:2,maxDark:24,minOverlap:1,minSun:null,maxBlackout:null,activityHours:1,modelPreference:'reference-sphere'},assumptions:['Scripted test output; real scientific jobs run through the normal local service.'],questions:[],view:action==='find_arrival'?'timeline':'horizon',arrivalDeadlineUTC:action==='find_arrival'?'2027-06-24T12:00:00Z':null};
   validateAIPlan(plan,MISSION_SITES);res.writeHead(200,{'Content-Type':'application/json'}).end(JSON.stringify({plan,provider:'SCRIPTED TEST FIXTURE',model:'browser-acceptance'}));return;
  }
  const headers={};for(const [k,v] of Object.entries(req.headers))if(!['host','origin','connection','content-length'].includes(k))headers[k]=v;
  const body=[];for await(const b of req)body.push(b);
  const target=await fetch('http://127.0.0.1:4182'+url.pathname+url.search,{method:req.method,headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(body)}:{})});
  res.writeHead(target.status,Object.fromEntries([...target.headers].filter(([k])=>!['content-encoding','transfer-encoding','content-length'].includes(k))));res.end(Buffer.from(await target.arrayBuffer()));
 }catch(e){res.writeHead(500,{'Content-Type':'application/json'}).end(JSON.stringify({error:e.message}));}
}).listen(port,'127.0.0.1',()=>console.log('AI fixture at http://127.0.0.1:'+port));
