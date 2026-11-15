import {spawn} from 'node:child_process';
import {readFile,mkdir} from 'node:fs/promises';
import {homedir} from 'node:os';
import {resolve,join} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
const store=join(homedir(),'.moon-park',createHash('sha256').update(resolve('.')).digest('hex').slice(0,16));
const jobs=new Map();let active=null;
function pump(){
 if(active)return;const job=[...jobs.values()].find(j=>j.status==='queued');if(!job)return;
 active=job;job.status='running';job.stage='Starting worker';
 const child=spawn(process.env.MOON_PARK_PYTHON||'python',[job.request.analysisModel==='reference-sphere'?'scripts/reference_sphere_worker.py':'scripts/navigator_worker.py'],{cwd:resolve('.'),env:{...process.env,MOON_PARK_STORE:store},windowsHide:true,stdio:['pipe','pipe','pipe']});job.child=child;let buffer='',stderr='';
 child.stdout.on('data',raw=>{buffer+=raw;let split;while((split=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,split);buffer=buffer.slice(split+1);try{const value=JSON.parse(line);if(job.status==='cancelled')continue;job.stage=value.stage;job.progress=value.progress??null;if(value.stage==='complete'){job.resultId=value.resultId;job.performance=value.performance;}if(value.error)job.error=value.error;}catch{}}});
 child.stderr.on('data',raw=>{stderr=(stderr+raw).slice(-4000);});
 child.on('error',e=>{job.error=e.message;});
 child.on('close',code=>{if(job.status!=='cancelled'){job.status=code===0&&job.resultId?'completed':'failed';if(job.status==='failed'&&!job.error)job.error=stderr||'Calculation worker failed';}delete job.child;active=null;pump();});
 child.stdin.on('error',()=>{});child.stdin.end(JSON.stringify(job.request));
}
const publicJob=j=>({id:j.id,status:j.status,stage:j.stage,error:j.error,progress:j.progress,resultId:j.resultId,performance:j.performance,queuePosition:j.status==='queued'?[...jobs.values()].filter(v=>v.status==='queued').findIndex(v=>v.id===j.id)+1:0});
export async function navigatorAPI(req,res,url){
 if(!url.pathname.startsWith('/api/'))return false;
 const send=(status,value)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'}).end(JSON.stringify(value));};
 if(req.headers.host!==url.host){send(403,{error:'Invalid host'});return true;}
 if(req.headers.origin&&req.headers.origin!==url.origin){send(403,{error:'Cross-origin request rejected'});return true;}
 try{
  await mkdir(store,{recursive:true});
  if(req.method==='GET'&&url.pathname==='/api/coverage'){
   let catalogue=null;try{catalogue=JSON.parse(await readFile('data/raw/navigator/catalog.json','utf8'));}catch{}
   const calculationIdentity={};for(const file of ['data/raw/kernels/manifest.json','scripts/navigator_worker.py','scripts/reference_sphere_worker.py','scripts/extend_horizons.py','scripts/prepare_terrain.py','scripts/prepare_spice.py','scripts/horizons_observer.py','scripts/airless_horizon.py','scripts/airless_horizon.py','docs/diviner-thermal-comparison.json','docs/catalogue-frame-verification.json','src/thermal-model.js','src/hardware-thermal.js','src/hardware-thermal-worker.js','src/hardware-thermal-panel.js','src/engineering-model.js','src/engineering-panel.js','src/eclipse-geometry.js','src/scientific-confidence.js','src/airless-visibility.js','src/airless-details.js','src/mission.js','src/engine.js','src/navigator-model.js','src/navigator.js','src/navigator-operations.js','src/navigator-seasons.js','src/navigator-globe.js','src/moon-coordinates.js','src/mission-catalogue.js','src/mission-selection.js','src/site-comparison.js','src/ephemeris-source.js','src/window-overview.js','src/navigator-terrain.js','src/spatial-math.js','src/horizon-trace.js','scripts/navigator-service.mjs']){try{calculationIdentity[file]=createHash('sha256').update(await readFile(file)).digest('hex');}catch{calculationIdentity[file]=null;}}
   let referenceInstalled=false;try{const kernels=JSON.parse(await readFile('data/raw/kernels/manifest.json','utf8'));referenceInstalled=kernels.length>0;}catch{}
   send(200,{calculationIdentity,referenceInstalled,referenceLatitudeRange:[-90,90],installed:!!catalogue,latitudeRange:[-90,-85],arrivalYears:[2027],sources:catalogue?.sources.map(({path,...rest})=>rest)??[],setup:'python scripts/setup_navigator_terrain.py',scope:'Full support is checked by each horizon calculation; installed data does not guarantee every coordinate.'});
  }else if(req.method==='POST'&&url.pathname==='/api/jobs'){
   if(!req.headers['content-type']?.startsWith('application/json'))throw new Error('JSON input required');let body='';for await(const raw of req){body+=raw;if(body.length>16384)throw new Error('Request too large');}
   const input=JSON.parse(body),request={};for(const k of ['longitude','latitude','duration','delay','height']){if(typeof input[k]!=='number'||!Number.isFinite(input[k]))throw new Error('Invalid '+k);request[k]=input[k];}request.terrainElevationOffsetM=input.terrainElevationOffsetM??0;if(typeof request.terrainElevationOffsetM!=='number'||!Number.isFinite(request.terrainElevationOffsetM)||Math.abs(request.terrainElevationOffsetM)>100)throw new Error('Invalid terrain elevation stress');request.stepMinutes=input.stepMinutes??10;if(![1,10].includes(request.stepMinutes))throw new Error('Unsupported observation cadence');request.startUTC=input.startUTC;request.analysisModel=input.analysisModel??'terrain';if(!['terrain','reference-sphere'].includes(request.analysisModel))throw new Error('Unsupported analysis model');
   if(typeof request.startUTC!=='string'||request.startUTC.length>40)throw new Error('Invalid UTC arrival');
   if([...jobs.values()].filter(j=>['queued','running'].includes(j.status)).length>=6)throw new Error('Calculation queue is full');
   if(jobs.size>=200){for(const [id,j] of jobs){if(['completed','failed','cancelled'].includes(j.status)&&j!==active)jobs.delete(id);if(jobs.size<100)break;}}
   const job={id:randomUUID(),request,status:'queued',stage:'Waiting'};jobs.set(job.id,job);pump();send(202,publicJob(job));
  }else if(/^\/api\/jobs\/[a-f0-9-]+$/.test(url.pathname)){
   const job=jobs.get(url.pathname.split('/').at(-1));if(!job){send(404,{error:'Unknown job'});return true;}
   if(req.method==='DELETE'){if(['queued','running'].includes(job.status)){job.status='cancelled';job.stage='Cancelled';job.child?.kill();}send(200,publicJob(job));}
   else if(req.method==='GET')send(200,publicJob(job));else send(405,{error:'Method not supported'});
  }else if(req.method==='GET'&&/^\/api\/results\/[a-f0-9]{64}$/.test(url.pathname)){
   const id=url.pathname.split('/').at(-1);const raw=await readFile(join(store,id+'.result.json'));if(createHash('sha256').update(raw).digest('hex')!==id)throw new Error('Result checksum mismatch');res.writeHead(200,{'Content-Type':'application/json'}).end(raw);
  }else send(404,{error:'Unknown API route'});
 }catch(e){send(400,{error:e.message});}return true;
}
