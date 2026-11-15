import {evaluateMission} from './mission.js';

export function horizonSensitivity(site,config,angleDeg){

 if(!Number.isFinite(angleDeg)||angleDeg<0||angleDeg>5)throw new Error('Choose an assumed horizon error between 0 and 5 degrees');

 return [-angleDeg,0,angleDeg].map(offset=>{

  const result=evaluateMission(site,{...config,offset});

  return {offsetDeg:offset,sunHours:result.sunHours,earthHours:result.earthHours,longestDark:result.longestDark,longestCombined:result.longestCombined,modelPass:result.modelPass};

 });

}

export function displacedCoordinates(longitude,latitude,distanceM,bearingDeg){

 if(![longitude,latitude,distanceM,bearingDeg].every(Number.isFinite)||Math.abs(latitude)>90||distanceM<0||distanceM>10000)throw new Error('Invalid coordinate perturbation');

 const rad=Math.PI/180,p=latitude*rad,l=longitude*rad,d=distanceM/1737400,b=bearingDeg*rad;

 const p2=Math.asin(Math.sin(p)*Math.cos(d)+Math.cos(p)*Math.sin(d)*Math.cos(b));

 const l2=l+Math.atan2(Math.sin(b)*Math.sin(d)*Math.cos(p),Math.cos(d)-Math.sin(p)*Math.sin(p2));

 return {longitude:((l2/rad+540)%360)-180,latitude:p2/rad};

}

let root,epoch=0,currentJob=null,lastReport=null,activeKey;

export const uncertaintyEvidence=()=>lastReport;

async function api(path,options){const response=await fetch(path,options);const data=await response.json();if(!response.ok)throw new Error(data.error);return data;}

export function renderConfidence(site,active,catalogueRecord){

 if(!root){

  root=document.createElement('details');root.innerHTML='<summary>Scientific sensitivity and coordinate basis</summary><p data-frame></p><label>Assumed horizon error (degrees)<input data-angle type="number" min="0" max="5" step="0.01" value="0.1"></label><button data-horizon>Test horizon assumptions</button><label>Assumed horizontal position error (m)<input data-distance type="number" min="0" max="10000" value="20"></label><label>Assumed relative terrain elevation error (m)<input data-vertical type="number" min="0" max="100" value="1"></label><button data-spatial>Recalculate position and elevation assumptions</button><button data-cancel>Cancel</button><p data-status role="status"></p><pre data-results></pre>';

  document.getElementById('powerLimit').after(root);

 }

 const key=JSON.stringify([site?.id,active?.config]);

 if(key!==activeKey){activeKey=key;epoch++;if(currentJob)api('/api/jobs/'+currentJob,{method:'DELETE'}).catch(()=>{});currentJob=null;lastReport=null;root.querySelector('[data-results]').textContent='';root.querySelector('[data-status]').textContent='Sensitivity is conditional on user-supplied errors. No statistical confidence is implied.';}

 root.querySelector('[data-frame]').textContent='Reported coordinate frame: '+(catalogueRecord?.frame??site?.provenance?.frame??'Unspecified')+'. Calculation frame: '+(site?.ephemerisProvenance?.sun?.frame??'See source record')+'. '+(catalogueRecord?.coordinateMetadata?'Frame evidence: '+catalogueRecord.coordinateMetadata.status+'; stated frame displacement '+(catalogueRecord.coordinateMetadata.frameDisplacementM??'unknown')+' m. Measurement uncertainty is separate.':'Unspecified source frames require authoritative metadata before transformation.');

 root.querySelector('[data-cancel]').onclick=()=>{epoch++;if(currentJob)api('/api/jobs/'+currentJob,{method:'DELETE'}).catch(()=>{});currentJob=null;root.querySelector('[data-status]').textContent='Cancelled.';};

 root.querySelector('[data-horizon]').onclick=()=>{

  try{

   if(!active||!site)throw new Error('Calculate a scenario first');

   lastReport={kind:'assumed-angular-horizon-error',siteId:site.id,config:active.config,cases:horizonSensitivity(site,active.config,Number(root.querySelector('[data-angle]').value))};

   root.querySelector('[data-results]').textContent=JSON.stringify(lastReport,null,2);document.dispatchEvent(new Event('uncertaintychange'));

  }catch(error){root.querySelector('[data-status]').textContent=error.message;}

 };

 root.querySelector('[data-spatial]').onclick=async()=>{

  const run=++epoch;

  try{

   if(!active||!site||!active.config.startUTC.startsWith('2027'))throw new Error('Use a calculated 2027 scenario for positional uncertainty');

   const distance=Number(root.querySelector('[data-distance]').value);

   const report={kind:'four-direction-positional-stress-test',distanceM:distance,siteId:site.id,config:active.config,cases:[]};

   const vertical=Number(root.querySelector('[data-vertical]').value);

   if(!Number.isFinite(vertical)||vertical<0||vertical>100)throw new Error('Choose an elevation error between 0 and 100 m');

   const trials=[0,90,180,270].map(bearing=>({bearing,point:displacedCoordinates(site.longitude,site.latitude,distance,bearing),terrainElevationOffsetM:0}));

   if(site.analysisModel!=='reference-sphere')for(const offset of [-vertical,vertical])trials.push({bearing:'relative terrain elevation '+offset+' m',point:{longitude:site.longitude,latitude:site.latitude},terrainElevationOffsetM:offset});

   report.kind='position-and-relative-terrain-elevation-stress-test';report.verticalErrorM=vertical;

   for(const {bearing,point,terrainElevationOffsetM} of trials){

    if(run!==epoch)return;



    let job=await api('/api/jobs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...active.config,delay:Math.min(72,active.config.delay),...point,terrainElevationOffsetM,analysisModel:site.analysisModel??'terrain'})});

    if(run!==epoch){await api('/api/jobs/'+job.id,{method:'DELETE'});return;}

    currentJob=job.id;

    while(['queued','running'].includes(job.status)){

     root.querySelector('[data-status]').textContent='Bearing '+bearing+' degrees: '+job.stage;

     await new Promise(resolve=>setTimeout(resolve,500));

     if(run!==epoch)return;

     job=await api('/api/jobs/'+job.id);

    }

    if(run!==epoch)return;

    if(job.status!=='completed')report.cases.push({bearing,...point,terrainElevationOffsetM,error:job.error??job.status});

    else{

     const data=await api('/api/results/'+job.resultId);

     if(run!==epoch)return;

     const result=evaluateMission(data.site,active.config);

     report.cases.push({bearing,...point,terrainElevationOffsetM,resultId:job.resultId,sunHours:result.sunHours,earthHours:result.earthHours,longestCombined:result.longestCombined,modelPass:result.modelPass});

    }

    root.querySelector('[data-results]').textContent=JSON.stringify(report,null,2);

   }

   lastReport=report;document.dispatchEvent(new Event('uncertaintychange'));currentJob=null;root.querySelector('[data-status]').textContent='Assumed position and elevation trials evaluated. Elevation trials shift every terrain-ray sample relative to a fixed observer ground height. These trials do not represent a calibrated error distribution.';

  }catch(error){if(run===epoch)root.querySelector('[data-status]').textContent=error.message;}

 };

}



export async function restoreUncertaintyEvidence(report,site,active){

 if(!report)return;

 if(!site||!active||report.siteId!==site.id||JSON.stringify(report.config)!==JSON.stringify(active.config))throw new Error('Saved uncertainty settings no longer match the inspected result');

 const context=activeKey;

 let restored;

 if(report.kind==='assumed-angular-horizon-error'){

  const angle=Math.abs(report.cases?.[0]?.offsetDeg);

  restored={...report,cases:horizonSensitivity(site,active.config,angle)};

 }else if(report.kind==='position-and-relative-terrain-elevation-stress-test'){

  if(!Array.isArray(report.cases)||report.cases.length!== (site.analysisModel==='reference-sphere'?4:6))throw new Error('Incomplete uncertainty receipt');

  const cases=[];

  const expected=[0,90,180,270].map(bearing=>({...displacedCoordinates(site.longitude,site.latitude,report.distanceM,bearing),terrainElevationOffsetM:0}));
  if(site.analysisModel!=='reference-sphere')for(const offset of [-report.verticalErrorM,report.verticalErrorM])expected.push({longitude:site.longitude,latitude:site.latitude,terrainElevationOffsetM:offset});
  for(const [index,saved] of report.cases.entries()){
   const trial=expected[index];
   if(!Number.isFinite(saved.latitude)||!Number.isFinite(saved.longitude)||Math.abs(saved.latitude-trial.latitude)>1e-8||Math.abs(saved.longitude-trial.longitude)>1e-8)throw new Error('Uncertainty trial settings changed');

   if(saved.error){cases.push(saved);continue;}

   if(!/^[a-f0-9]{64}$/.test(saved.resultId))throw new Error('Invalid uncertainty result identity');

   const data=await api('/api/results/'+saved.resultId);

   if(context!==activeKey)return;

   if(Math.abs(data.site.latitude-saved.latitude)>1e-8||Math.abs(data.site.longitude-saved.longitude)>1e-8)throw new Error('Uncertainty coordinate identity changed');

   const result=evaluateMission(data.site,active.config);

   cases.push({...saved,sunHours:result.sunHours,earthHours:result.earthHours,longestCombined:result.longestCombined,modelPass:result.modelPass});

  }

  restored={...report,cases};

 }else throw new Error('Unsupported uncertainty receipt');

 if(context!==activeKey)return;

 lastReport=restored;document.dispatchEvent(new Event('uncertaintychange'));

 root.querySelector('[data-results]').textContent=JSON.stringify(restored,null,2);

 root.querySelector('[data-status]').textContent='Saved uncertainty results resolved and recalculated against the current settings and source identities.';

}

