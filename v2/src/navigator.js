import {timeline as v2Timeline} from '/v2/charts.js';
import {installV2} from '/v2/workspace.js';
import {installLandingSimulation} from './landing-simulator.js';
let landingSimulation;
import {analysisStatus,paintAnalysisStatus} from '/src/analysis-status.js';
import {installAIPlanner} from '/src/ai-planner.js';
import {rankSiteResults} from '/src/ai-plan.js';
import {drawLocationMap,drawHorizonScene,comparisonVisual,installPlannerFlow} from './planner-flow.js';
let visualFlow;
import {hardwareThermalEvidence,restoreHardwareThermal,validateHardwareThermalReceipt} from '/src/hardware-thermal-panel.js';
import {renderConfidence,uncertaintyEvidence,restoreUncertaintyEvidence} from '/src/scientific-confidence.js';

import {renderEngineering,engineeringSettings,restoreEngineering,engineeringEvidence} from '/src/engineering-panel.js';

import {SkySimulator} from '/src/sky-simulator.js';

let skySimulator;

document.getElementById('observationCadence').onchange=()=>{inspectionPreview=null;cancelJobs();render();};
document.getElementById('includeEclipses').onchange=()=>{inspectionPreview=null;cancelJobs();render();};

import {renderObservatory} from '/src/visual-observatory.js';

import {renderTerrainDynamics} from '/src/terrain-dynamics.js';

import {renderRapidInsights,renderLunarContext,scheduleImpact} from '/src/scenario-insights.js';

import {solarGeometry} from '/src/solar-geometry.js';

import {renderAirlessDetails} from '/src/airless-details.js';

import {renderEphemerisSource} from '/src/ephemeris-source.js';



import {renderWindowOverview,drawElevationChart} from '/src/window-overview.js';



import {traceHorizon} from '/src/horizon-trace.js';



import {NavigatorGlobe} from './navigator-globe.js';



import {MISSION_SITES,POLAR_DESTINATIONS} from '/src/mission-catalogue.js';



import {supportedPolarPoint} from '/src/moon-coordinates.js';



import {analysisModelFor,hasCoordinates,modelLabel,coordinateMeaning,coordinateLabel,filterMissions} from '/src/mission-selection.js';



import {renderComparisonMatrix} from '/src/site-comparison.js';



import {scheduleActivity} from '/src/mission.js';



import {NavigatorTerrain} from '/src/navigator-terrain.js';



import {verifiedJSON,decodeCandidate} from '/src/candidate-model.js';



import {comparePoint,pinLocation,nextVisibilityEvent,alternatives} from '/src/navigator-model.js';



import {installSeasons} from '/src/navigator-seasons.js';



import {operationalMetrics,shiftReadout,nextEventSummary,solarReference} from '/src/navigator-operations.js';



import {lonLatToPolar,polarToLonLat} from '/src/spatial-math.js';



const $=id=>document.getElementById(id),svgNS='http://www.w3.org/2000/svg';



let replayTimer=null,seasonControl=null,globeView=null,globePoint=null,inspectionPreview=null;



let catalogue=[],pins=[],selected=null,models=new Map(),results=new Map(),pending=new Set(),analysisErrors=new Map(),sequence=0;



const jobStates=new Map();
let aiExecutionEpoch=0,aiUndoWorkspace=null;
let dataset,datasetHash,tiles=[],terrainView=null,terrainKey=null,jobEpoch=0,jobIds=[],coverageRecord=null;const prepared=new Map();let imagery=[],lastAlternatives=null;



function error(e){$('error').textContent=e?.message??String(e);}



function config(){if(!Number.isFinite(Number($('duration').value))||Number($('duration').value)*6!==Math.round(Number($('duration').value)*6)||Number($('delay').value)*6!==Math.round(Number($('delay').value)*6))throw new Error('Use durations and delays on the ten-minute grid');if(![2,5,10].includes(Number($('height').value))||Number($('duration').value)<1||Number($('duration').value)>744||Number($('delay').value)<0||Number($('delay').value)>72)throw new Error('Unsupported mission settings');if(!/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test($('arrival').value)||Number($('arrival').value.slice(-2))%10)throw new Error('Choose UTC time on a ten-minute grid');return {stepMinutes:Number(document.getElementById('observationCadence').value),includeEclipses:document.getElementById('includeEclipses')?.checked??false,startUTC:$('arrival').value+':00Z',delay:Number($('delay').value),duration:Number($('duration').value),height:Number($('height').value),maxDark:Number($('dark').value),minOverlap:Number($('overlap').value),minSun:$('minSun').value===''?null:Number($('minSun').value),maxBlackout:$('maxBlackout').value===''?null:Number($('maxBlackout').value),modelPreference:$('analysisModel').value};}



function node(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;}



function drawMap(center){
 const point=center??catalogue.find(p=>p.id===selected)??globePoint;
 drawLocationMap($('polarMap'),point,catalogue,pins,selected,p=>{
  globePoint=p;$('latitude').value=p.latitude;$('longitude').value=p.longitude;
  showGlobePoint(p);globeView?.focus(p,supportedPolarPoint(p));drawMap(p);
 });
}

async function pin(id){



 try{const nextPins=pinLocation(pins,id);const destination=catalogue.find(p=>p.id===id);if(['custom','mission'].includes(destination?.kind)&&$('mode').value!=='custom'){$('mode').value='custom';await $('mode').onchange();}pins=nextPins;lastAlternatives=null;$('alternatives').replaceChildren();selected=id;inspectionPreview=null;error('');render();if($('mode').value==='custom'){await calculate();return;}if(models.has(id)||pending.has(id))return;pending.add(id);$('loadStatus').textContent='Loading coordinate-specific evidence…';const item=catalogue.find(p=>p.id===id);const model=decodeCandidate(await verifiedJSON(item),item);model.display=tiles.find(t=>t.siteId===model.sourceSiteId);models.set(id,model);prepared.set(id,model);}



 catch(e){error(e);}finally{if($('mode').value!=='custom')pending.delete(id);render();}



}



function render(){



 if(!pins.includes(selected))selected=pins[0]??null;inspectionPreview=null;stopPlayback();seasonControl?.contextChanged();$('dateGrid').replaceChildren();$('datePreview').replaceChildren();



 $('compareWorkspace').hidden=pins.length<2;$('inspectionPanel').hidden=pins.length<1;$('workspaceTools').hidden=false;$('save').disabled=pins.length<1;$('brief').disabled=pins.length<1;$('calculate').hidden=pins.length<1;$('cancel').hidden=pending.size===0;for(const selector of ['#alternativesWorkspace','#seasonWorkspace','#historicalTools','#evidenceTools']){const panel=document.querySelector(selector);if(panel)panel.hidden=pins.length<1;}



 ++sequence;results.clear();analysisErrors.clear();$('cards').replaceChildren();drawMap();



 for(const id of pins){const item=catalogue.find(p=>p.id===id),card=node('article',undefined,'card'+(selected===id?' selected':''));card.append(node('h3',item.name));if(item.kind==='mission')card.append(node('p',`${item.operator} · ${coordinateMeaning(item.coordinateType)} · ${item.status}`));const actions=node('div',undefined,'actions');const inspect=node('button','Inspect');inspect.onclick=()=>{selected=id;inspectionPreview=null;render();globeView?.focus(catalogue.find(p=>p.id===id));};const remove=node('button','Remove');remove.setAttribute('aria-label','Remove '+item.name);remove.onclick=()=>{cancelJobs();lastAlternatives=null;$('alternatives').replaceChildren();pins=pins.filter(p=>p!==id);if(selected===id)selected=pins[0]??null;render();};actions.append(inspect,remove);card.append(actions);



  if(!models.has(id))card.append(node('p',pending.has(id)?'Loading evidence…':'Evidence unavailable; select the location again to retry.'));



  else try{if($('mode').value==='custom'&&(models.get(id).analysisModel??'terrain')!==analysisModelFor(item,config().modelPreference))throw new Error('Calculate again for the selected model; existing results have a different scope.');const result=comparePoint(models.get(id),config(),Number($('activity').value));results.set(id,result);card.append(node('p',result.failures.length?'Revised scenario misses entered model constraints':'Revised scenario meets entered model constraints','status'));const table=node('table'),head=node('tr');for(const s of ['Metric','Original','Revised'])head.append(node('th',s));table.append(head);for(const metric of operationalMetrics(result)){const row=node('tr');row.append(node('td',metric.label),node('td',metric.original.toFixed(2)+metric.unit),node('td',metric.revised.toFixed(2)+metric.unit));table.append(row);}card.append(availabilityBars(result),table,node('p',shiftReadout(result),'shift-impact'),node('p',`Revised margins (hours; negative means shortfall): darkness ${(config().maxDark-result.revised.longestDark).toFixed(2)}; total overlap ${(result.revised.overlap-config().minOverlap).toFixed(2)}; continuous activity ${(result.revised.longestCombined-Number($('activity').value)).toFixed(2)}.`),node('p',result.failures.join('; ')||'All entered model constraints pass.'));card.append(node('p',modelLabel(models.get(id)),'model-badge'));card.append(node('small',models.get(id)?.analysisModel==='reference-sphere'?'Airless celestial geometry on a smooth reference sphere. Actual terrain, ground elevation and obstructions are omitted.':models.get(id)?.id.startsWith('custom-')?'Nominal 2027 calculation; benchmark clone tests do not apply to this result.':item.kind==='benchmark'?'Original benchmark; conditional terrain tests are available in the research workbench.':item.kind==='custom'?'Custom coordinate: nominal terrain only; no clone support.':'Interior sample: nominal terrain only; no clone support.'));}



  catch(e){analysisErrors.set(id,e.message);card.append(node('p','Analysis unavailable: '+e.message));}



  comparisonVisual(card,item,results.get(id)?.[$('comparisonScenario').value]);$('cards').append(card);



 }



 if(!pins.length)$('cards').append(node('p','Select a location from the catalogue and pin it here.'));



 globeView?.setLocations(catalogue,pins,selected);renderSiteComparison();renderRapidInsights($('rapidInsights'),pins.map(id=>catalogue.find(p=>p.id===id)),results,id=>{selected=id;inspectionPreview=null;$('time').value=0;render();$('pointTitle').scrollIntoView({block:'start'});});inspect();updateAnalysisStatus();visualFlow?.refresh(pins.map(id=>catalogue.find(p=>p.id===id)),catalogue.find(p=>p.id===selected));persist();



}



function inspect(){const result=inspectionPreview?.comparison??results.get(selected),site=inspectionPreview?.site??models.get(selected);const scenario=$('inspectScenario').value;const active=result?.[scenario];const inspectionConfig=active?.config;const activity=active?scheduleActivity(active,Number($('activity').value)):[];$('returnComparison').hidden=!inspectionPreview;$('inspectScenario').disabled=!!inspectionPreview;$('inspectionNotice').textContent=inspectionPreview?`${inspectionPreview.kind??"Seasonal"} preview: ${inspectionPreview.name}. Pinned comparison inputs and saved workspace remain unchanged.`:`${scenario==='baseline'?'Original':'Revised'} scenario; globe directions, terrain, horizon, live metrics and replay share this result.`;$('liveMetrics').replaceChildren();document.getElementById('ephemerisSource')?.remove();document.getElementById('airlessDetails')?.remove();$('inspectionExplanation').textContent='';skySimulator?.set(null,null,null);$('skySimStatus').textContent='Calculate a scenario to inspect its sky.';$('lunarContext').replaceChildren();$('visualObservatory').replaceChildren();$('terrainDynamics').replaceChildren();$('sky').replaceChildren();$('timeline').replaceChildren();$('historical').replaceChildren();$('pointTitle').textContent=inspectionPreview?.name??catalogue.find(p=>p.id===selected)?.name??site?.name??'Select a calculated location';$('pointSummary').textContent='';$('locationContext').textContent=site?`${site.name}: ${catalogue.find(p=>p.id===selected)?.kind??'research'} coordinate. Source identities are included in the workspace export; study samples are not mission landing targets.`:'';if(site){const basis=prepared.get(selected)?.provenance??site.provenance;$('locationContext').append(node('br'),node('span',`Coordinate basis: ${basis?.selection??catalogue.find(p=>p.id===selected)?.coordinateBasis??catalogue.find(p=>p.id===selected)?.coordinateType??(catalogue.find(p=>p.id===selected)?.kind==='custom'?'User-entered exact coordinate':'Deterministic sample in a published terrain study region')}. `));const link=node('a',site.analysisModel==='reference-sphere'?'Location source; reference sphere omits terrain':'Terrain source and coverage');link.href=catalogue.find(p=>p.id===selected)?.source??basis?.url??'https://pgda.gsfc.nasa.gov/products/90';link.target='_blank';link.rel='noopener';$('locationContext').append(link);}$('sky').setAttribute('aria-label',site?.analysisModel==='reference-sphere'?'Analytic reference-sphere horizon and Sun/Earth positions; terrain omitted':'Computed terrain horizon and Sun/Earth positions');$('time').disabled=!result;renderEngineering(active);renderConfidence(site,active,catalogue.find(p=>p.id===selected));if(!result){landingSimulation?.setContext({location:catalogue.find(p=>p.id===selected)??null,sample:null});visualFlow?.sample(null);$('time').removeAttribute('aria-valuetext');for(const id of ['events','traceInfo','activityResult','terrainCaption','powerSummary','powerLimit','communicationsSummary'])$(id).textContent='';globeView?.celestial(null,null);$('globeTime').textContent='Calculate a scenario to see observer-specific Sun/Earth directions.';terrainView?.set(null);terrainKey=null;return;}



 document.querySelector('label[for="time"]').textContent='Inspected mission replay - '+active.config.stepMinutes+'-minute samples';

 $('time').max=active.samples.length-1;$('time').value=Math.min(Number($('time').value),active.samples.length-1);const sample=active.samples[Number($('time').value)];landingSimulation?.setContext({location:site,site,sample,result:active,index:Number($('time').value),height:inspectionConfig.height});visualFlow?.sample(sample);drawTimeline(active);showImagery(selected);terrainView?.celestial(sample,inspectionConfig.height);globeView?.celestial(site,sample);$('pointSummary').textContent=`${modelLabel(site)} · ${coordinateLabel(site)} · ${sample.utc} · Sun ${sample.sun?'visible':'hidden'} · Earth ${sample.earth?'visible':'hidden'} · Sun elevation ${sample.sunEl.toFixed(2)}° · Earth elevation ${sample.earthEl.toFixed(2)}°`;



 const displayKey=selected+':'+(inspectionPreview?.site.resultReference?.sha256??'main');if(terrainKey!==displayKey){terrainKey=displayKey;try{const shown=terrainView?.set(site);$('terrainCaption').textContent=site.analysisModel==='reference-sphere'?'Smooth reference-sphere patch, with curvature only. No measured topography or terrain shadows. Direction arrows use illustrative lengths.':shown?`LOLA measured topography · ground detail: ${site.provenance?.groundResolutionM?site.provenance.groundResolutionM+' m':'see source evidence'}; mixed-source 180 km rays. Display mesh: ${site.display.pixelM??Math.abs(site.display.x[1]-site.display.x[0]).toFixed(1)} m spacing, true relief. Light follows the Sun direction; display shading does not calculate terrain shadows. Direction arrows use illustrative lengths. Horizon visibility retains its own source resolution.`:'Display terrain unavailable for this point.';}catch(e){$('terrainCaption').textContent='3D view unavailable: '+e.message;}}



 terrainView?.celestial(sample,inspectionConfig.height);const profile=site.profiles[String(inspectionConfig.height)];drawHorizonScene(profile,sample,site.analysisModel==='reference-sphere');const path=document.createElementNS(svgNS,'path');const low=Math.min(0,...profile.map(p=>p.el),sample.sunEl,sample.earthEl)-1,high=Math.max(0,...profile.map(p=>p.el),sample.sunEl,sample.earthEl)+1;const y=e=>180-(e-low)/(high-low)*160;path.setAttribute('d',profile.map((p,i)=>`${i?'L':'M'}${p.az/360*720},${y(p.el)}`).join(' '));path.setAttribute('stroke','#add8c2');path.setAttribute('fill','none');$('sky').append(path);const zero=document.createElementNS(svgNS,'path');zero.setAttribute('d',`M0,${y(0)} L720,${y(0)}`);zero.setAttribute('stroke','#a3b1a8');zero.setAttribute('stroke-dasharray','6 4');$('sky').append(zero);const zeroText=document.createElementNS(svgNS,'text');zeroText.setAttribute('x',350);zeroText.setAttribute('y',Math.max(12,y(0)-5));zeroText.textContent='0° local horizontal · no refraction';$('sky').append(zeroText);for(const az of [0,90,180,270,360]){const text=document.createElementNS(svgNS,'text');text.setAttribute('x',Math.min(680,az*2));text.setAttribute('y',198);text.textContent=`${az}° az`;$('sky').append(text);}for(const el of [low,high]){const text=document.createElementNS(svgNS,'text');text.setAttribute('x',2);text.setAttribute('y',Math.max(12,y(el)));text.textContent=`${el.toFixed(1)}° elevation`;$('sky').append(text);}



 for(const [name,az,el,color] of [['Sun',sample.az,sample.sunEl,'#edcc8b'],['Earth',sample.earthAz,sample.earthEl,'#aec4aa']]){const c=document.createElementNS(svgNS,'circle');c.setAttribute('cx',az*2);c.setAttribute('cy',y(el));c.setAttribute('r',5);c.setAttribute('fill',color);$('sky').append(c);const t=document.createElementNS(svgNS,'text');t.setAttribute('x',Math.min(az*2+8,670));t.setAttribute('y',y(el));t.textContent=name;$('sky').append(t);}



 $('events').replaceChildren(...['sun','earth'].map(target=>node('p',nextEventSummary(active.samples,Number($('time').value),target))));



 skySimulator?.set(site,active,sample,Number($('time').value));$('skySimStatus').textContent=`${sample.utc} · Sun ${sample.sun?'visible':'below visibility threshold'} · Earth ${sample.earth?'visible':'hidden'} · Sun elevation ${sample.sunEl.toFixed(2)}° · Earth elevation ${sample.earthEl.toFixed(2)}°. ${site.analysisModel==='reference-sphere'?'Sphere horizon; actual terrain omitted.':'Skyline comes from measured-terrain calculation; finite resolution applies.'}`;updateLiveMetrics(site,sample,active);renderAirlessDetails(site,sample,active);renderLunarContext($('lunarContext'),sample,site.analysisModel==='reference-sphere');renderTerrainDynamics($('terrainDynamics'),site,active,sample);renderObservatory($('visualObservatory'),active,sample,Number($('time').value));



 $('time').setAttribute('aria-valuetext',`${sample.utc}; Sun ${sample.sun?'visible':'not visible'}; Earth ${sample.earth?'visible':'not visible'}`);$('powerSummary').textContent=solarReference(sample);$('powerLimit').textContent='Visibility is geometric. Engineering estimates use the assumptions below. Eclipse treatment: '+sample.eclipseModel+'.';$('communicationsSummary').textContent=`Earth centre elevation ${sample.earthEl.toFixed(2)}°. Direct Earth visibility is geometric line of sight, not a radio-link prediction.`;







 try{if(site.analysisModel==='reference-sphere')throw new Error('Analytic sphere horizon: no measured terrain-ray witnesses. Observer height is above the 1737.4 km reference radius; actual surface elevation is unknown.');const trace=traceHorizon(site,sample,inspectionConfig.height,profile,$('traceTarget').value);$('traceInfo').textContent=`Clearance ${trace.centerClearanceDeg.toFixed(3)}°. `+trace.witnesses.map(w=>`${w.label}: ${w.rayAzimuthDeg.toFixed(2)}° ray, ${(w.distanceM/1000).toFixed(2)} km, ${w.source}, weight ${(100*w.interpolationWeight).toFixed(1)}%`).join('; ')+'. Separate sampled witnesses, not one exact blocker.';}catch(e){$('traceInfo').textContent=e.message;}



 $('activityResult').textContent=activity.length?`First sampled ${$('activity').value}-hour activity start: ${activity[0].startUTC}. ${activity.length} fitting combined interval(s).`:'No combined interval fits the requested continuous activity.';



}



try{const response=await fetch('/data/mission-data.json');if(!response.ok)throw new Error('Mission data unavailable');const raw=await response.text();datasetHash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw)))).map(v=>v.toString(16).padStart(2,'0')).join('');const data=JSON.parse(raw);dataset=data;const spatial=await verifiedJSON(data.spatial);tiles=spatial.tiles;imagery=(await verifiedJSON(data.imagery)).entries;try{terrainView=new NavigatorTerrain($('terrain'));}catch(e){$('terrainCaption').textContent=e.message;}const manifest=await verifiedJSON(data.candidates);catalogue=[...data.sites.map(s=>({...s,kind:'benchmark'})),...manifest.regions.flatMap(r=>r.points.map(p=>({...p,kind:'interior'}))),...POLAR_DESTINATIONS,...MISSION_SITES.filter(hasCoordinates)];for(const site of data.sites){site.display=tiles.find(t=>t.siteId===site.id);models.set(site.id,site);prepared.set(site.id,site);}for(const item of catalogue){const option=node('option',item.name+(item.kind==='custom'?' · 2027 on demand':''));option.value=item.id;$('location').append(option);}$('location').onchange=()=>{$('pin').disabled=!$('location').value;};$('pin').onclick=()=>pin($('location').value);for(const id of ['arrival','delay','duration','height','dark','overlap','minSun','maxBlackout','activity','analysisModel'])$(id).oninput=()=>{inspectionPreview=null;cancelJobs();$('alternatives').replaceChildren();lastAlternatives=null;error('');render();};$('time').oninput=inspect;installControls();installV2({context:aiContext,globe:()=>globeView,map:drawMap,selected:()=>catalogue.find(p=>p.id===selected),inspect:id=>{if(!pins.includes(id))return;selected=id;inspectionPreview=null;render();},state:()=>({pins:pins.map(id=>catalogue.find(p=>p.id===id)),entries:pins.map(id=>({point:catalogue.find(p=>p.id===id),comparison:results.get(id),model:models.has(id)?models.get(id).analysisModel??'terrain':null,job:jobStates.get(id),pending:pending.has(id),error:analysisErrors.get(id)})),selected,site:models.get(selected),result:inspectionPreview?.comparison?.[$('inspectScenario').value]??results.get(selected)?.[$('inspectScenario').value]})});$('loadStatus').textContent='Choose a location to begin.';render();}catch(e){error(e);$('loadStatus').textContent='Location catalogue unavailable';}







async function api(path,options){const response=await fetch(path,options);const value=await response.json();if(!response.ok)throw new Error(value.error||'Local calculation service unavailable');return value;}



function updateAnalysisStatus(){
 const state=analysisStatus({name:catalogue.find(p=>p.id===selected)?.name,pending:pending.has(selected),job:jobStates.get(selected),hasResult:results.has(selected),reason:analysisErrors.get(selected)});
 paintAnalysisStatus(state);window.dispatchEvent(new Event('moonpark-v2-jobs'));
 $('inspectionPanel').hidden=!results.has(selected);
 document.querySelector('.mission-live-strip').hidden=!results.has(selected);
 $('alternativesWorkspace').hidden=!pins.length||!pins.every(id=>results.has(id));
 const busy=pending.size>0;$('cancel').hidden=!busy;$('calculate').disabled=busy;
 visualFlow?.busy(busy);
 $('loadStatus').textContent=state.busy?state.title:state.retry?state.title:results.has(selected)?'Calculation complete.':'Choose a location to begin.';
}

async function cancelJobs(){
 ++jobEpoch;for(const id of pending)jobStates.set(id,{status:'cancelled',stage:'Cancelled'});pending.clear();
 const ids=jobIds;jobIds=[];await Promise.allSettled(ids.map(id=>api('/api/jobs/'+id,{method:'DELETE'})));
 $('jobs').textContent='Calculation cancelled';if(dataset)render();
}

async function calculate(){



 const epoch=++jobEpoch;const previous=jobIds;jobIds=[];await Promise.allSettled(previous.map(id=>api('/api/jobs/'+id,{method:'DELETE'})));



 try{



  const c=config();if($('mode').value==='demo'){for(const id of pins)if(prepared.has(id))models.set(id,prepared.get(id));render();return;}



  if(!c.startUTC.startsWith('2027-'))throw new Error('Choose a 2027 UTC arrival for custom calculations');



  for(const id of pins){const analysisModel=analysisModelFor(catalogue.find(p=>p.id===id),c.modelPreference);if(analysisModel==='terrain'&&!coverageRecord?.installed)throw new Error('Polar terrain setup is not complete. Run python scripts/setup_navigator_terrain.py. No reference-sphere fallback was applied.');if(analysisModel==='reference-sphere'&&!coverageRecord?.referenceInstalled)throw new Error('Global screening needs SPICE kernels. Run python scripts/fetch_kernels.py, then reload.');}



  jobStates.clear();for(const id of pins){models.delete(id);pending.add(id);jobStates.set(id,{status:'queued',stage:'Preparing calculation'});}terrainKey=null;render();



  const requests=await Promise.all(pins.map(async id=>{const item=catalogue.find(p=>p.id===id);const job=await api('/api/jobs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...c,latitude:item.latitude,longitude:item.longitude,analysisModel:analysisModelFor(item,c.modelPreference)})});if(epoch!==jobEpoch){await api('/api/jobs/'+job.id,{method:'DELETE'});return {id,job,done:true};}jobIds.push(job.id);jobStates.set(id,job);updateAnalysisStatus();return {id,job};}));



  while(epoch===jobEpoch&&requests.some(v=>!v.done)){



   for(const r of requests.filter(v=>!v.done)){r.job=await api('/api/jobs/'+r.job.id);if(epoch!==jobEpoch)return;jobStates.set(r.id,r.job);updateAnalysisStatus();

    if(r.job.status==='completed'){const result=await api('/api/results/'+r.job.resultId);if(epoch!==jobEpoch)return;const model=result.site;model.name=catalogue.find(p=>p.id===r.id).name;model.coordinateType=catalogue.find(p=>p.id===r.id).coordinateType;model.catalogueId=r.id;model.resultReference={url:'/api/results/'+r.job.resultId,sha256:r.job.resultId};models.set(r.id,model);pending.delete(r.id);r.done=true;terrainKey=null;render();}



    else if(['failed','cancelled'].includes(r.job.status)){pending.delete(r.id);r.done=true;r.error=r.job.error||'Cancelled';render();error(r.error);}



   }



   $('jobs').textContent=requests.map(r=>`${catalogue.find(p=>p.id===r.id).name}: ${r.job.status} — ${r.job.stage}${Number.isFinite(r.job.progress)?' ('+Math.round(r.job.progress*100)+'% of stage)':''}${r.job.queuePosition?' (queue '+r.job.queuePosition+')':''}${r.error?' · '+r.error:''}`).join(' | ');



   if(requests.some(v=>!v.done))await new Promise(resolve=>setTimeout(resolve,1000));



  }



 }catch(e){if(epoch===jobEpoch){const affected=[...pins];await cancelJobs();for(const id of affected)jobStates.set(id,{status:'failed',error:e.message??String(e)});error(e);updateAnalysisStatus();}}



}



function sourceIdentity(){return {preparedData:datasetHash,globe:dataset.globe?.sha256??null,candidates:dataset.candidates.sha256,spatial:dataset.spatial.sha256,polar:coverageRecord?.sources.map(s=>s.sha256)??[],calculation:coverageRecord?.calculationIdentity??null};}



function workspace(includeResults=false){return {schemaVersion:1,application:'Moon Park navigator workspace',mode:$('mode').value,config:config(),engineering:engineeringSettings(),hardwareThermal:hardwareThermalEvidence(),uncertainty:uncertaintyEvidence(),activityHours:Number($('activity').value),sourceIdentity:sourceIdentity(),selected,inspection:{sampleIndex:Number($('time').value),target:$('traceTarget').value,scenario:$('inspectScenario').value},locations:pins.map(id=>{const p=catalogue.find(v=>v.id===id);return {id:p.id,name:p.name,latitude:p.latitude,longitude:p.longitude,kind:p.kind,coordinateType:p.coordinateType,operator:p.operator,source:p.source,coordinateSource:p.coordinateSource};}),...(includeResults?{engineeringEstimates:[...results.entries()].map(([id,r])=>({id,baseline:engineeringEvidence(r.baseline),revised:engineeringEvidence(r.revised)})),software:coverageRecord?.calculationIdentity??dataset.software,alternatives:lastAlternatives,scenarioInsights:pins.filter(id=>results.has(id)).map(id=>({id,...scheduleImpact(results.get(id))})),results:[...results.values()],resultSources:pins.map(id=>({id,terrain:models.get(id)?.provenance,observations:models.get(id)?.ephemerisProvenance,analysisModel:models.get(id)?.analysisModel??'terrain',catalogue:catalogue.find(p=>p.id===id),reference:models.get(id)?.resultReference??catalogue.find(p=>p.id===id).sha256??models.get(id)?.provenance?.sha256})),scope:'Visibility and continuous activity constraints under the identified model. Reference-sphere screening omits terrain; polar results use measured DEM sources. Not landing feasibility.'}:{})};}



document.addEventListener('hardwarethermalchange',persist);document.addEventListener('engineeringchange',persist);document.addEventListener('uncertaintychange',persist);

function persist(){try{if(dataset&&coverageRecord)localStorage.setItem('moon-park-lab-v2-workspace',JSON.stringify(workspace()));}catch{}}



async function restoreWorkspace(record){



 if(record?.application!=='Moon Park navigator workspace'||record.schemaVersion!==1||!Array.isArray(record.locations)||record.locations.length>3||!['demo','custom'].includes(record.mode))throw new Error('Unsupported workspace format');



 const currentCoverage=await api('/api/coverage');
 if(JSON.stringify(currentCoverage.calculationIdentity)!==JSON.stringify(coverageRecord?.calculationIdentity))throw new Error('Calculation sources changed during this session. Reload and recalculate before restoring.');
 if(JSON.stringify(record.sourceIdentity)!==JSON.stringify(sourceIdentity()))throw new Error('Source identities differ. Recreate the scenarios and recalculate; the current workspace has been preserved.');



 

 const c=record.config;if(!c||(c.stepMinutes!==undefined&&![1,10].includes(c.stepMinutes))||[c.minSun,c.maxBlackout].some(v=>v!=null&&(!Number.isFinite(v)||v<0))||(c.modelPreference!==undefined&&!['auto','terrain','reference-sphere'].includes(c.modelPreference))||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:00Z$/.test(c.startUTC)||![2,5,10].includes(c.height)||![c.duration,c.delay,c.maxDark,c.minOverlap,record.activityHours].every(Number.isFinite)||c.duration<1||c.duration>744||c.delay<0||c.delay>72||c.maxDark<0||c.minOverlap<0||record.activityHours<=0||record.activityHours>c.duration)throw new Error('Invalid workspace settings');



 if(new Date(c.startUTC).toISOString()!==c.startUTC.replace('Z','.000Z')||Number(c.startUTC.slice(14,16))%10||c.duration*6!==Math.round(c.duration*6)||c.delay*6!==Math.round(c.delay*6)||(record.mode==='custom'&&!c.startUTC.startsWith('2027-'))||record.locations.some(p=>record.mode==='demo'&&['custom','mission'].includes(p.kind)))throw new Error('Unsupported workspace date or time grid');



 if(record.inspection&&(!Number.isInteger(record.inspection.sampleIndex)||record.inspection.sampleIndex<0||!['sun','earth'].includes(record.inspection.target)||(record.inspection.scenario!==undefined&&!['baseline','revised'].includes(record.inspection.scenario))))throw new Error('Invalid inspection state');



 const unique=new Set();for(const p of record.locations){if(typeof p.id!=='string'||unique.has(p.id)||!Number.isFinite(p.latitude)||!Number.isFinite(p.longitude)||p.latitude< -90||p.latitude>90)throw new Error('Invalid location');unique.add(p.id);for(const key of ['source','coordinateSource'])if(p[key]!==undefined&&p[key]!==null&&(typeof p[key]!=='string'||!/^https?:\/\//i.test(p[key])))throw new Error('Invalid source link in workspace');const known=catalogue.find(v=>v.id===p.id);if(known&&(known.latitude!==p.latitude||known.longitude!==p.longitude))throw new Error('Location identity changed');if(!known&&p.kind!=='custom')throw new Error('Prepared location no longer available');}



 await validateHardwareThermalReceipt(record.hardwareThermal);
 document.getElementById('observationCadence').value=record.config.stepMinutes??10;document.getElementById('includeEclipses').checked=record.config.includeEclipses??false;restoreEngineering(record.engineering);inspectionPreview=null;await cancelJobs();$('mode').value=record.mode;$('arrival').value=c.startUTC.slice(0,16);for(const [field,key] of [['delay','delay'],['duration','duration'],['height','height'],['dark','maxDark'],['overlap','minOverlap']])$(field).value=c[key];$('minSun').value=c.minSun??'';$('maxBlackout').value=c.maxBlackout??'';$('activity').value=record.activityHours;$('analysisModel').value=c.modelPreference??'auto';



 for(const p of record.locations)if(!catalogue.some(v=>v.id===p.id)){catalogue.push(p);const option=node('option',p.name);option.value=p.id;$('location').append(option);}



 pins=[];for(const p of record.locations){pins=pinLocation(pins,p.id);if(record.mode==='demo'&&['custom','mission'].includes(p.kind))throw new Error('Custom coordinates require 2027 calculation mode');if(record.mode==='demo'&&!prepared.has(p.id)){const reference=catalogue.find(v=>v.id===p.id);const model=decodeCandidate(await verifiedJSON(reference),reference);model.display=tiles.find(t=>t.siteId===model.sourceSiteId);prepared.set(p.id,model);}if(record.mode==='demo')models.set(p.id,prepared.get(p.id));}



 selected=pins.includes(record.selected)?record.selected:pins[0]??null;$('time').max=1007;$('time').value=record.inspection?.sampleIndex??0;$('traceTarget').value=record.inspection?.target??'sun';$('inspectScenario').value=record.inspection?.scenario??'revised';terrainKey=null;if(record.mode==='custom')await calculate();else render();await restoreHardwareThermal(record.hardwareThermal);await restoreUncertaintyEvidence(record.uncertainty,models.get(selected),results.get(selected)?.[record.inspection?.scenario??'revised']);$('saveStatus').textContent='Workspace restored; saved result summaries were recalculated.';persist();



}



function installControls(){



 let saved=null;try{saved=JSON.parse(localStorage.getItem('moon-park-lab-v2-workspace'));}catch{}



 api('/api/coverage').then(async value=>{coverageRecord=value;$('coverage').textContent=`Polar terrain: ${value.installed?'installed':'not installed'}. Global reference kernels: ${value.referenceInstalled?'installed':'not installed'}. Each terrain coordinate still needs a coverage check. ${value.installed?'':value.setup}`;if(saved)try{await restoreWorkspace(saved);}catch(e){$('saveStatus').textContent=e.message;}}).catch(()=>{$('coverage').textContent='Local calculation service unavailable. Check the setup instructions and try again.';});



 $('custom').onclick=async()=>{try{if($('mode').value!=='custom')throw new Error('New calculations use the 2027 mission planning period.');let longitude=Number($('longitude').value),latitude=Number($('latitude').value);if(!$('longitude').value||!$('latitude').value||!Number.isFinite(longitude)||!Number.isFinite(latitude)||latitude< -90||latitude>90)throw new Error('Enter finite lunar coordinates from -90 to +90 latitude');longitude=(((longitude+180)%360)+360)%360-180;if(Math.abs(latitude)===90)longitude=0;const id=`coordinate:${latitude}:${longitude}`;pinLocation(pins,id);if(!catalogue.some(p=>p.id===id)){const item={id,name:`${Math.abs(latitude).toFixed(5)}° ${latitude<0?'S':'N'}, ${longitude.toFixed(5)}° E`,latitude,longitude,kind:'custom'};catalogue.push(item);const option=node('option',item.name);option.value=id;$('location').append(option);}if($('mode').value!=='custom')throw new Error('New calculations use the 2027 mission planning period.');await pin(id);}catch(e){error(e);}};



 $('mode').onchange=async()=>{inspectionPreview=null;await cancelJobs();models.clear();terrainKey=null;if($('mode').value==='demo'){for(const [id,model] of prepared)models.set(id,model);pins=pins.filter(id=>!['custom','mission'].includes(catalogue.find(p=>p.id===id).kind));$('arrival').value='2026-11-14T00:00';}else $('arrival').value='2027-01-01T00:00';render();};



 $('calculate').onclick=calculate;$('cancel').onclick=cancelJobs;$('analysisCancel').onclick=cancelJobs;$('analysisRetry').onclick=calculate;$('traceTarget').onchange=inspect;$('terrainStyle').onchange=()=>terrainView?.colorMode($('terrainStyle').value);$('top').onclick=()=>terrainView?.top();$('oblique').onclick=()=>terrainView?.oblique();



 try{skySimulator=new SkySimulator($('skySimulator'));$('skyMode').onchange=()=>skySimulator.setMode($('skyMode').value);$('skyOrbit').onclick=()=>{skySimulator.orbit();$('skyMode').value=skySimulator.mode;};$('skyReset').onclick=()=>{skySimulator.setMode('dome');$('skyMode').value='dome';};document.addEventListener('visibilitychange',()=>{if(document.hidden)skySimulator.stop();});}catch(e){$('skySimulator').textContent='3D sky unavailable. Use the horizon chart and numerical readouts.';}installGlobe();installReplay();$('inspectScenario').onchange=()=>{stopPlayback();$('time').value=0;inspect();persist();};$('returnComparison').onclick=()=>{stopPlayback();inspectionPreview=null;terrainKey=null;$('time').value=0;inspect();};seasonControl=installSeasons({api,config,location:()=>catalogue.find(p=>p.id===selected),error,onInspect:inspectScenarioPreview});$('recover').onclick=()=>{try{if(!pins.length||pins.some(id=>!results.has(id)))throw new Error('Calculate every pinned location for the current settings before exploring alternatives.');const found=lastAlternatives=alternatives(pins.map(id=>models.get(id)),config(),Number($('activity').value),$('otherHeights').checked?[2,5,10]:[config().height]);renderDateGrid(found);$('alternatives').replaceChildren(node('p',`${found.choices.length} passes from ${found.tested} tested combinations; ${found.unavailable.length} unavailable due to data coverage.`));for(const c of found.choices){const row=node('div');row.append(node('p',`${c.name}: +${c.extraHours} h extra delay, ${c.height} m observer; ${c.longestCombined.toFixed(2)} h continuous, ${c.overlap.toFixed(2)} h total${c.tied?' · tied':''}.`));const use=node('button','Use this arrival');use.onclick=()=>{const start=new Date(Date.parse(config().startUTC)+c.delay*3600000);if($('mode').value==='custom'&&start.getUTCFullYear()!==2027){error('This recovery extends into 2028. It is inspectable in the exported comparison, but cannot become a new 2027 arrival.');return;}lastAlternatives=null;selected=pins.find(id=>models.get(id)?.id===c.siteId);$('arrival').value=start.toISOString().slice(0,16);$('delay').value=0;$('height').value=c.height;$('alternatives').replaceChildren();if($('mode').value==='custom')calculate();else render();};row.append(use);$('alternatives').append(row);}if(!found.choices.length)$('alternatives').append(node('p','No passing alternative within this search. Try different locations or requirements.'));}catch(e){error(e);}};



 $('save').onclick=()=>{try{const value=workspace(true),url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'})),a=node('a');a.href=url;a.download='moon-park-workspace.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){error(e);}};



 $('brief').onclick=()=>{try{const text=comparisonBrief(workspace(true));downloadText(text,'moon-park-comparison.md','text/markdown');}catch(e){error(e);}};$('reset').onclick=async()=>{document.getElementById('observationCadence').value=10;document.getElementById('includeEclipses').checked=false;restoreEngineering();await restoreHardwareThermal(null);await cancelJobs();localStorage.removeItem('moon-park-lab-v2-workspace');pins=[];selected=null;models.clear();for(const [id,model] of prepared)models.set(id,model);$('mode').value='custom';$('arrival').value='2027-01-01T00:00';for(const [id,value] of Object.entries({delay:48,duration:72,height:2,dark:12,overlap:8,minSun:'',maxBlackout:'',activity:2,analysisModel:'auto',latitude:-87.5,longitude:0,time:0}))$(id).value=value;$('otherHeights').checked=false;lastAlternatives=null;$('alternatives').replaceChildren();error('');terrainKey=null;render();localStorage.removeItem('moon-park-lab-v2-workspace');$('saveStatus').textContent='Saved workspace cleared.';};



 $('restore').onchange=async()=>{try{error('');$('saveStatus').textContent='Restoring workspace…';const file=$('restore').files[0];if(!file)return;if(file.size>20*1024*1024)throw new Error('Workspace exceeds 20 MB');await restoreWorkspace(JSON.parse(await file.text()));}catch(e){$('saveStatus').textContent='Workspace restore failed; see the message above.';error(e);}};



 landingSimulation=installLandingSimulation({globe:globeView,getEntries:()=>pins.map(id=>({point:catalogue.find(p=>p.id===id),site:models.get(id),result:results.get(id)?.[$('inspectScenario').value],failures:results.get(id)?.[$('inspectScenario').value==='baseline'?'baselineFailures':'failures'],reason:analysisErrors.get(id)})),onInspect:id=>{selected=id;inspectionPreview=null;render();}});
 visualFlow=installPlannerFlow({locations:()=>catalogue,pin,custom:$('custom').onclick,globe:$('globePin').onclick,
 preview:point=>{if(!point)return;globePoint=point;error('');$('globePanel').hidden=true;stopPlayback();landingSimulation?.setContext({location:point,sample:null});globeView?.focus(point,supportedPolarPoint(point));drawMap(point);},
 remove:id=>{cancelJobs();pins=pins.filter(p=>p!==id);inspectionPreview=null;lastAlternatives=null;render();}});
 installAIPlanner({context:aiContext,catalogue:()=>catalogue,execute:executeAIPlan,
  cancel:async()=>{++aiExecutionEpoch;await cancelJobs();},
  undo:async()=>{if(!aiUndoWorkspace)throw new Error('There are no AI settings to undo');++aiExecutionEpoch;await restoreWorkspace(aiUndoWorkspace);aiUndoWorkspace=null;}});
}







function drawTimeline(result){



 return v2Timeline(result,Number($('time').value));
 const svg=$('timeline'),width=550;svg.setAttribute('viewBox','0 0 720 110');const bounds=document.createElementNS(svgNS,'text');bounds.setAttribute('x',0);bounds.setAttribute('y',100);bounds.textContent=`${result.startUTC} → ${result.endUTC}`;svg.append(bounds);



 for(const [row,key,label,color] of [[0,'sun','Sun','#edcc8b'],[1,'earth','Earth','#aec4aa'],[2,'both','Both','#c9e2aa']]){



  const text=document.createElementNS(svgNS,'text');text.setAttribute('x',0);text.setAttribute('y',row*25+16);text.textContent=label;svg.append(text);



  result.samples.forEach((s,i)=>{if(!s[key])return;const r=document.createElementNS(svgNS,'rect');r.setAttribute('x',110+i/result.samples.length*width);r.setAttribute('y',row*25+2);r.setAttribute('width',width/result.samples.length+.2);r.setAttribute('height',18);r.setAttribute('fill',color);svg.append(r);});



 }



 const line=document.createElementNS(svgNS,'path');const x=110+Number($('time').value)/result.samples.length*width;line.setAttribute('d',`M${x},0V75`);line.setAttribute('stroke','white');svg.append(line);drawElevationChart(svg,result,Number($('time').value));



}



function showImagery(id){



 const entry=imagery.find(e=>e.pointCoverage?.[id]?.state==='valid-source-pixel');



 if(!entry){$('historical').append(node('p','No verified historical image coverage for this selected point.'));return;}



 const img=node('img');img.src=entry.png.url;img.alt=entry.name+' historical context, not aligned with the calculation terrain';img.loading='lazy';



 const caption=node('p',`${entry.name}, acquired ${entry.acquisitionDates}. ${entry.resolutionM.join(' × ')} m source pixels. Historical context only: unregistered; not a current illumination prediction. Crop may include missing pixels.`);const link=node('a','Source product');link.href=entry.productPage;$('historical').append(img,caption,link);



}



function downloadText(text,name,type){const url=URL.createObjectURL(new Blob([text],{type})),a=node('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}



function comparisonBrief(w){



 const lines=['# Moon Park comparison brief','',`Original arrival: ${w.config.startUTC}; revised delay: ${w.config.delay} h; stay: ${w.config.duration} h; observer: ${w.config.height} m.`,`Requirements: darkness ≤ ${w.config.maxDark} h; total combined ≥ ${w.config.minOverlap} h; continuous activity ≥ ${w.activityHours} h. Minimum sunlight: ${w.config.minSun??"unset"} h. Maximum direct Earth blackout: ${w.config.maxBlackout??"unset"} h.`,''];



 lines.push('## Engineering assumptions',JSON.stringify(w.engineering),'## Engineering estimates',JSON.stringify(w.engineeringEstimates??[]),'## Hardware thermal correlation',JSON.stringify(w.hardwareThermal?.report??null),'## Conditional uncertainty trials',JSON.stringify(w.uncertainty??null));

 for(const p of w.locations){const r=results.get(p.id);lines.push(`## ${p.name}`,`${p.latitude}° N, ${p.longitude}° E; ${p.kind}.`);if(!r){lines.push('Calculation unavailable.','');continue;}lines.push(`Original interval: ${r.baseline.startUTC} to ${r.baseline.endUTC}. Revised interval: ${r.revised.startUTC} to ${r.revised.endUTC}.`,`Model: ${modelLabel(models.get(p.id))}. ${models.get(p.id)?.analysisModel==='reference-sphere'?'No terrain resolution or measured ground elevation applies.':`Ground detail: ${models.get(p.id)?.provenance?.groundResolutionM??'unavailable'} m; mixed-source 180 km horizon.`}`,'','| Metric (hours) | Original | Revised |','|---|---:|---:|');for(const [name,key] of [['Sunlight','sunHours'],['Earth','earthHours'],['Combined','overlap'],['Longest darkness','longestDark'],['Longest continuous combined','longestCombined']])lines.push(`| ${name} | ${r.baseline[key].toFixed(3)} | ${r.revised[key].toFixed(3)} |`);lines.push(r.failures.join('; ')||'Selected nominal visibility requirements pass.',`First fitting activity start: ${r.activity[0]?.startUTC??'none'}.`,'');}



 lines.push('## Tested alternatives','Least additional delay, then longest continuous combined window, then total combined hours. Ties preserved.');if(!w.alternatives)lines.push('Alternatives have not been evaluated for the current settings.');for(const c of w.alternatives?.choices??[])lines.push(`${c.name}: +${c.extraHours} h extra; ${c.height} m; ${c.longestCombined.toFixed(3)} h continuous; ${c.overlap.toFixed(3)} h combined.`);



 lines.push('## Engineering assumptions',JSON.stringify(w.engineering),'## Engineering estimates',JSON.stringify(w.engineeringEstimates??[]),'## Hardware thermal correlation',JSON.stringify(w.hardwareThermal?.report??null),'## Conditional uncertainty trials',JSON.stringify(w.uncertainty??null));

 for(const p of w.locations){const r=results.get(p.id);if(!r)continue;lines.push(`## Operational comparison: ${p.name}`,shiftReadout(r),`Schedule impact evidence: ${JSON.stringify(scheduleImpact(r))}. Visibility changes are compared at equal elapsed time after arrival, not interpreted as an uncertainty bound.`);for(const m of operationalMetrics(r))lines.push(`${m.label}: original ${m.original.toFixed(3)}${m.unit}; revised ${m.revised.toFixed(3)}${m.unit}.`);if(p.id===w.selected){const inspected=r[w.inspection.scenario??'revised'];const i=Math.min(w.inspection.sampleIndex,inspected.samples.length-1);lines.push(`Replay scenario: ${w.inspection.scenario??'revised'}`,solarReference(inspected.samples[i]),nextEventSummary(inspected.samples,i,'sun'),nextEventSummary(inspected.samples,i,'earth'));}}lines.push('Airless geometry: no atmospheric refraction or Earth-style effective-radius correction. Solar elevation is relative to the radial local horizontal; visibility is relative to the curved terrain skyline or analytic sphere limb. Mean horizontal projection uses max(0, sin(solar elevation)), zero when the Sun centre is blocked, with half-open time bins. This centre-ray metric is not disc-integrated irradiance, electrical power or energy.','User-selected limits and example defaults are not official mission requirements or a landing go/no-go.');lines.push('','## Limits','Sample spacing is recorded in each result config. Polar terrain results use finite 180 km rays and mixed terrain detail. Reference-sphere results omit terrain. Nominal custom/interior results have no clone uncertainty evidence. No landing safety, RF, power, thermal or eclipse certification.','', '## Reproduction','Restore the companion versioned JSON workspace with matching source/software identities.','```json',JSON.stringify(w.sourceIdentity,null,2),'```');return lines.join('\n');



}



function stopPlayback(){if(replayTimer)clearInterval(replayTimer);replayTimer=null;if($('play'))$('play').textContent='▶ Play';}



function installReplay(){



 const move=index=>{stopPlayback();$('time').value=index;inspect();};



 $('replayStart').onclick=()=>move(0);$('replayEnd').onclick=()=>move(Number($('time').max));



 for(const [id,direction] of [['previousEvent',-1],['nextEvent',1]])$(id).onclick=()=>{const samples=(inspectionPreview?.comparison??results.get(selected))?.[$('inspectScenario').value].samples;if(!samples)return;const current=Number($('time').value);for(let i=current+direction;i>0&&i<samples.length;i+=direction)if(samples[i].sun!==samples[i-1].sun||samples[i].earth!==samples[i-1].earth){move(i);$('replayMessage').textContent=`Visibility transition bracket: ${samples[i-1].utc} to ${samples[i].utc}.`;return;}$('replayMessage').textContent='No further sampled visibility event in this direction.';};



 $('play').onclick=()=>{if(replayTimer){stopPlayback();return;}if(matchMedia('(prefers-reduced-motion: reduce)').matches){$('replayMessage').textContent='Reduced motion is enabled. Use the slider or event buttons.';return;}if($('time').disabled)return;if(Number($('time').value)>=Number($('time').max)){$('time').value=0;inspect();}$('play').textContent='Ⅱ Pause';replayTimer=setInterval(()=>{if(Number($('time').value)>=Number($('time').max)){stopPlayback();return;}$('time').value=Number($('time').value)+1;inspect();},Number($('playSpeed').value));};



 $('playSpeed').onchange=stopPlayback;$('time').addEventListener('pointerdown',stopPlayback);document.addEventListener('visibilitychange',()=>{if(document.hidden)stopPlayback();});



}



function drawMapContext(map){



 for(const lat of [-85,-87,-89]){const radius=lonLatToPolar(0,lat)[1]/800;const c=document.createElementNS(svgNS,'circle');for(const [k,v] of Object.entries({cx:200,cy:200,r:radius,fill:'none',stroke:'#57718a'}))c.setAttribute(k,v);map.append(c);const t=document.createElementNS(svgNS,'text');t.setAttribute('x',205);t.setAttribute('y',200-radius+14);t.textContent=`${-lat}° S`;map.append(t);}



 for(const lon of [0,90,180,-90]){const [x,y]=lonLatToPolar(lon,-85);const line=document.createElementNS(svgNS,'path');line.setAttribute('d',`M200,200L${200+x/800},${200-y/800}`);line.setAttribute('stroke','#40576a');map.append(line);const t=document.createElementNS(svgNS,'text');t.setAttribute('x',Math.max(5,Math.min(350,200+x/900)));t.setAttribute('y',Math.max(15,Math.min(390,200-y/900)));t.textContent=`${lon}° E`;map.append(t);}



}



function renderDateGrid(found){



 $('dateGrid').replaceChildren();$('datePreview').replaceChildren();



 const table=node('table');const head=node('tr');for(const label of ['Location / height',...Array.from({length:7},(_,i)=>`+${i*12} h`)])head.append(node('th',label));table.append(head);



 const groups=new Map();for(const cell of found.cells){const key=cell.siteId+':'+cell.height;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(cell);}



 for(const cells of groups.values()){const row=node('tr');row.append(node('th',`${cells[0].name} / ${cells[0].height} m`));for(const cell of cells){const td=node('td'),button=node('button',cell.status==='unavailable'?'Unavailable':`${cell.status}: ${cell.overlap.toFixed(2)} h total / ${cell.longestCombined.toFixed(2)} h continuous`);button.onclick=()=>{const panel=$('datePreview');panel.replaceChildren(node('p',`${cell.name}, ${cell.arrivalUTC}, ${cell.height} m: ${cell.status}.`));if(cell.reason){panel.append(node('p',cell.reason));return;}panel.append(node('p',`Margins in hours (negative means shortfall): darkness ${cell.margins.darkness.toFixed(2)}; overlap ${cell.margins.overlap.toFixed(2)}; activity ${cell.margins.activity.toFixed(2)}.`),node('p',cell.failures.join('; ')||'All entered model constraints pass.'));const previewButton=node('button','Inspect this tested date');previewButton.onclick=()=>{const locationId=pins.find(id=>models.get(id)?.id===cell.siteId);const site=models.get(locationId);const comparison=comparePoint(site,{...config(),height:cell.height,delay:config().delay+cell.extraHours},Number($('activity').value));inspectScenarioPreview({site,comparison,locationId,kind:'Tested alternative',name:`${cell.name} · ${cell.arrivalUTC}`});};panel.append(previewButton);const apply=node('button','Apply arrival');apply.onclick=()=>{if($('mode').value==='custom'&&!cell.arrivalUTC.startsWith('2027-')){error('New arrivals must remain in 2027.');return;}selected=pins.find(id=>models.get(id)?.id===cell.siteId);$('arrival').value=cell.arrivalUTC.slice(0,16);$('delay').value=0;$('height').value=cell.height;lastAlternatives=null;$('alternatives').replaceChildren();if($('mode').value==='custom')calculate();else render();};panel.append(apply);};td.append(button);row.append(td);}table.append(row);}$('dateGrid').append(table);



}



function availabilityBars(result){const wrapper=node('div',undefined,'availability-bars');for(const [label,key] of [['Sunlight','sunHours'],['Direct Earth','earthHours'],['Shared','overlap']]){wrapper.append(node('strong',label));for(const [name,r] of [['Original',result.baseline],['Revised',result.revised]]){const row=node('div');row.append(node('span',`${name} ${r[key].toFixed(2)} h`));const meter=node('meter');meter.min=0;meter.max=r.config.duration;meter.value=r[key];meter.setAttribute('aria-label',`${label}, ${name}: ${r[key].toFixed(2)} hours of ${r.config.duration}`);row.append(meter);wrapper.append(row);}}return wrapper;}



function installGlobe(){
 $('globeWhole').onclick=()=>globeView?.whole();
 $('globePole').onclick=()=>globeView?.focus({latitude:-90,longitude:0},false);
 $('globeSelected').onclick=()=>{const point=globePoint??catalogue.find(p=>p.id===selected);if(hasCoordinates(point))globeView?.focus(point,supportedPolarPoint(point));else error('Choose a location first.');};




 try{globeView=new NavigatorGlobe($('moonGlobe'),{onPoint:point=>{globePoint=point;globeView?.highlight(point);$('latitude').value=point.latitude.toFixed(7);$('longitude').value=point.longitude.toFixed(7);showGlobePoint(point);},onLocation:point=>{globePoint=point;showGlobePoint(point);globeView?.focus(point,supportedPolarPoint(point));}});}catch(e){$('moonGlobe').textContent='3D globe unavailable. Use the catalogue and coordinate controls below.';}



 const fillMissions=()=>{const list=filterMissions(MISSION_SITES,$('missionGroup').value,$('missionSearch').value);const choice=node('option','Choose a mission or named target');choice.value='';$('missionLocation').replaceChildren(choice);for(const p of list){const option=node('option',`${p.name} · ${p.status}`);option.value=p.id;$('missionLocation').append(option);}$('missionLocation').disabled=!list.length;$('missionShow').disabled=true;globePoint=null;$('globePin').disabled=true;$('globePanel').hidden=true;$('globeSelection').replaceChildren(node('p',list.length?'Click the Moon or choose a named site to preview its coordinate.':'No missions match this filter.'));};



 fillMissions();$('missionGroup').onchange=fillMissions;$('missionSearch').oninput=fillMissions;$('analysisModel').addEventListener('change',()=>{if(globePoint)showGlobePoint(globePoint);});$('missionLocation').onchange=()=>{$('missionShow').disabled=!$('missionLocation').value;};



 const updateLayers=()=>globeView?.layers($('globeGrid').checked,$('globeSites').checked);$('globeGrid').onchange=updateLayers;$('globeSites').onchange=updateLayers;$('globeZoomIn').onclick=()=>globeView?.zoom(.8);$('globeZoomOut').onclick=()=>globeView?.zoom(1.25);



 $('missionShow').onclick=()=>{globePoint=MISSION_SITES.find(p=>p.id===$('missionLocation').value);showGlobePoint(globePoint);if(hasCoordinates(globePoint))globeView?.focus(globePoint,supportedPolarPoint(globePoint));};



 $('globePin').onclick=async()=>{if(!hasCoordinates(globePoint))return;const point={...globePoint};if(point.kind==='mission'){await pin(point.id);return;}if($('mode').value!=='custom'){$('mode').value='custom';await $('mode').onchange();}$('latitude').value=point.latitude.toFixed(7);$('longitude').value=point.longitude.toFixed(7);$('custom').click();};



 $('comparisonLayout').onchange=renderSiteComparison;$('comparisonScenario').onchange=renderSiteComparison;for(const [id,direction] of [['previousSite',-1],['nextSite',1]])$(id).onclick=()=>{if(!pins.length)return;selected=pins[(Math.max(0,pins.indexOf(selected))+direction+pins.length)%pins.length];inspectionPreview=null;render();globeView?.focus(catalogue.find(p=>p.id===selected),supportedPolarPoint(catalogue.find(p=>p.id===selected)));};



}



function showGlobePoint(point){
 visualFlow?.choose(point,'globe');



 const valid=hasCoordinates(point);let model,errorText;try{model=analysisModelFor(point,$('analysisModel').value);}catch(e){errorText=e.message;}$('globePin').disabled=!valid||!!errorText;$('globePin').textContent='Continue with this location →';const panel=$('globeSelection');$('globePanel').hidden=false;panel.replaceChildren(node('h3',point?.name??'Selected coordinate'));



 if(!point)return;panel.append(node('p',valid?coordinateLabel(point):'Exact coordinate not published in the selected source.'));



 if(point.status)panel.append(node('p',`${point.operator} · ${point.status} · verified ${point.lastVerified}.`));if(point.coordinateType)panel.append(node('p',`Coordinate meaning: ${coordinateMeaning(point.coordinateType)}.`));panel.append(node('p',errorText??(model==='terrain'?'This coordinate will use measured polar terrain.':'This coordinate will use a reference sphere with JPL Horizons positions. Actual terrain and ground elevation are omitted.')));



 if(point.description)panel.append(node('p',point.description));for(const [label,url] of [['Mission / location source',point.source],['Coordinate source',point.coordinateSource]])if(url){const link=node('a',label);link.href=url;link.target='_blank';link.rel='noopener';panel.append(link,node('br'));}if(point.frame)panel.append(node('p',point.frame));



}



function renderSiteComparison(){



 const locations=pins.map(id=>catalogue.find(p=>p.id===id)),layout=$('comparisonLayout').value;$('cards').hidden=layout==='table';$('cards').classList.toggle('sequential',layout==='sequential');$('comparisonTable').hidden=layout!=='table';$('sequentialControls').hidden=layout!=='sequential';$('comparisonScenario').disabled=layout!=='table';$('sequencePosition').textContent=pins.length?`${Math.max(0,pins.indexOf(selected))+1} of ${pins.length}`:'No pinned sites';



 const labels=new Set(pins.filter(id=>models.has(id)).map(id=>modelLabel(models.get(id))));$('comparisonModels').textContent=labels.size>1?'Mixed calculation models are shown. Terrain-based and reference-sphere results have different scope; select reference sphere for all sites for a common geometric screen.':'Each column uses the stated calculation model; unpublished mission targets have no invented coordinates.';



 renderComparisonMatrix($('comparisonTable'),{locations,results,models,errors:analysisErrors,scenario:$('comparisonScenario').value,onRemove:id=>{cancelJobs();pins=pins.filter(p=>p!==id);if(selected===id)selected=pins[0]??null;lastAlternatives=null;$('alternatives').replaceChildren();render();},onInspect:(id,scenario)=>{selected=id;$('inspectScenario').value=scenario;render();globeView?.focus(catalogue.find(p=>p.id===id),supportedPolarPoint(catalogue.find(p=>p.id===id)));$('pointTitle').scrollIntoView({behavior:'instant',block:'start'});}});



}



function updateLiveMetrics(site,sample,active){renderEphemerisSource(site,active.config.height);renderWindowOverview($('liveMetrics'),active);const reference=site.analysisModel==='reference-sphere';



 const g=solarGeometry(sample);

 const values=[['Visible solar disc',`${(sample.sunFraction*100).toFixed(1)}%`,'50% disc visibility defines mission sunlight; not electrical power'],['Horizontal projection',`${(100*g.unblockedCenterProjection).toFixed(1)}%`,'Centre-ray geometry relative to normal incidence; zero when blocked'],['Sun elevation',`${sample.sunEl.toFixed(2)}°`,sample.sun?'Sun visibility threshold met':'Sun visibility threshold not met'],[reference?'Sun clearance above sphere':'Sun clearance',`${(sample.sunEl-sample.horizon).toFixed(2)}°`,reference?'Solar centre relative to analytic sphere limb':'Solar centre relative to sampled terrain horizon'],['Earth elevation',`${sample.earthEl.toFixed(2)}°`,sample.earth?'Earth centre clears modeled horizon':'Earth centre hidden by modeled horizon'],[reference?'Earth clearance above sphere':'Earth clearance',`${(sample.earthEl-sample.earthHorizon).toFixed(2)}°`,'Direct line of sight; RF performance separate']];



 for(const [label,value,detail] of values){const card=node('div');card.append(node('span',label),node('strong',value),node('small',detail));$('liveMetrics').append(card);}



 $('inspectionExplanation').textContent=reference?'Global reference-sphere screening uses real Sun/Earth positions above an analytic lunar limb. No measured ground elevation, craters or mountains are included.':sample.sun&&sample.sunEl<0?'The Sun is below the local horizontal but above this depressed terrain horizon. Visibility and the geometric projection onto a horizontal surface answer different questions.':'Elevation is measured from the local horizontal; clearance is measured from the terrain horizon in the object’s direction. Positive Earth clearance gives modeled direct visibility.';



 $('globeTime').textContent=`Inspected: ${$('pointTitle').textContent}; ${sample.utc}. Gold and sage arrows show observer-specific Sun and Earth directions at illustrative lengths. Globe surface lighting is neutral context.`;



 $('pointSummary').textContent+=` · Interval ${active.startUTC} to ${active.endUTC}`;



}







function inspectScenarioPreview(preview){stopPlayback();if(preview.locationId)selected=preview.locationId;inspectionPreview=preview;$('inspectScenario').value='revised';$('time').value=0;terrainKey=null;drawMap();globeView?.setLocations(catalogue,pins,selected);inspect();globeView?.focus(preview.site);$('pointTitle').scrollIntoView({behavior:'instant',block:'start'});}





function aiContext(){
 let settings;try{settings={...config(),activityHours:Number($('activity').value)};}catch{settings={startUTC:$('arrival').value+':00Z',duration:Number($('duration').value),height:Number($('height').value)};}
 return {settings,locations:pins.map(id=>{const p=catalogue.find(p=>p.id===id);return {id:p.id,name:p.name,latitude:p.latitude,longitude:p.longitude};}),
  displayedInspection:aiInspectionContext(),pinnedComparisons:pins.map(id=>{const r=results.get(id);return r?{id,name:catalogue.find(p=>p.id===id).name,model:modelLabel(models.get(id)),startUTC:r.revised.startUTC,endUTC:r.revised.endUTC,metrics:operationalMetrics(r).map(m=>({label:m.label,value:m.revised,unit:m.unit})),failures:r.failures,source:models.get(id)?.resultReference??null}: {id,status:'unavailable'};}),scope:'Modeled sunlight and direct Earth-centre visibility; no landing safety certification. Arrival searches are 0 to 72 hours in 12-hour steps.'};
}
function aiInspectionContext(){
 const comparison=inspectionPreview?.comparison??results.get(selected);if(!comparison)return null;
 const active=comparison[$('inspectScenario').value],sample=active.samples[Number($('time').value)];const site=inspectionPreview?.site??models.get(selected);
 return {name:inspectionPreview?.name??catalogue.find(p=>p.id===selected)?.name,kind:inspectionPreview?'temporary tested preview':'pinned scenario',model:modelLabel(site),arrivalUTC:active.startUTC,inspectedUTC:sample?.utc,metrics:operationalMetrics(comparison).map(m=>({label:m.label,value:$('inspectScenario').value==='baseline'?m.original:m.revised,unit:m.unit})),nextEvents:sample?['sun','earth'].map(t=>nextEventSummary(active.samples,Number($('time').value),t)):[],source:site?.resultReference??null};
}
function aiRevision(){const c=aiContext();return JSON.stringify({settings:c.settings,locations:c.locations});}
function aiView(view){document.querySelector(`[data-view="${view==='landing'?'globe':view}"]`)?.click();if(view==='landing'&&results.has(selected))landingSimulation?.open();}
async function executeAIPlan(plan){
 if(plan.action==='clarify'||plan.action==='explain')return 'No mission settings changed.';
 if(plan.action==='inspect'){
  if(plan.view==='landing'){if(!results.has(selected))throw new Error('Generate a site and time first, then ask to simulate it.');aiView('landing');return 'Opened the illustrative Apollo landing simulation using the supplied models. Its descent is an animation, not a calculated flight trajectory.';}
  if(plan.locations.length){const id=plan.locations[0].id;if(!pins.includes(id)||!results.has(id))throw new Error('Calculate this location first, then ask to inspect it.');selected=id;render();}
  if(!results.has(selected))throw new Error('There is no calculated result to inspect yet.');aiView(plan.view);return 'Showing '+catalogue.find(p=>p.id===selected).name+' in the requested view.';
 }
 const run=++aiExecutionEpoch;aiUndoWorkspace=workspace();await cancelJobs();
 for(const [key,field] of [['startUTC','arrival'],['duration','duration'],['delay','delay'],['height','height'],['maxDark','dark'],['minOverlap','overlap'],['minSun','minSun'],['maxBlackout','maxBlackout'],['activityHours','activity'],['modelPreference','analysisModel']])if(plan.settings[key]!==undefined)$(field).value=key==='startUTC'?plan.settings[key].slice(0,16):plan.settings[key];
 $('mode').value='custom';
 if(plan.locations.length){pins=[];for(const point of plan.locations){let existing=catalogue.find(p=>p.id===point.id);if(!existing){existing={...point,kind:'custom'};catalogue.push(existing);const option=node('option',existing.name);option.value=existing.id;$('location').append(option);}pins=pinLocation(pins,existing.id);}selected=pins[0];}
 if(!pins.length)throw new Error('Choose a location or include a location/coordinate in your request.');
 if(!config().startUTC.startsWith('2027-'))throw new Error('Include a 2027 arrival date. The historical demonstration cannot be used for a new AI calculation.');
 if(['find_site','find_arrival'].includes(plan.action)&&new Set(pins.map(id=>analysisModelFor(catalogue.find(p=>p.id===id),config().modelPreference))).size>1)throw new Error('These sites mix terrain and reference-sphere models. Ask for reference sphere for all sites, or choose polar terrain sites together, before ranking.');
 const revision=aiRevision();$('time').value=0;lastAlternatives=null;$('alternatives').replaceChildren();aiView(plan.view);await calculate();
 if(run!==aiExecutionEpoch||revision!==aiRevision())throw new Error('The request was interrupted or mission settings changed. No AI recommendation was applied.');
 const records=pins.map(id=>({id,point:catalogue.find(p=>p.id===id),comparison:results.get(id)}));
 const ready=records.filter(r=>r.comparison);if(!ready.length)throw new Error($('error').textContent||'No calculated results are available. Check the calculation status and retry.');
 const report=[];
 for(const r of records){if(!r.comparison){report.push(r.point.name+': unavailable; no recommendation can use this result.');continue;}const a=r.comparison.revised;report.push(`${r.point.name}: Sun ${a.sunHours.toFixed(2)} h, direct Earth ${a.earthHours.toFixed(2)} h, shared ${a.overlap.toFixed(2)} h, longest continuous shared ${a.longestCombined.toFixed(2)} h. ${r.comparison.failures.length?'Fails: '+r.comparison.failures.join('; '):'Passes the entered visibility requirements'}. Model: ${modelLabel(models.get(r.id))}.`);}
 if(plan.action==='find_site'){
  const ranked=rankSiteResults(records);if(ranked.length){selected=ranked[0].id;render();report.unshift((ranked[0].tied?'The top passing metrics are tied; showing one tied tested site. ':'Showing the highest-ranked passing tested site. ')+'Ranking: longest continuous shared window, then total shared time. Equal metrics remain tied; this is not a whole-Moon optimum.');}else report.unshift('No tested site passes all entered requirements. No viable landing recommendation is established.');
 }
 if(plan.action==='find_arrival'){
  if(ready.length!==records.length)throw new Error('Calculate every requested site before ranking arrival alternatives.');
  const found=alternatives(pins.map(id=>models.get(id)),config(),Number($('activity').value),[config().height]);lastAlternatives=found;renderDateGrid(found);
  if(found.choices.length){const choice=found.choices[0],id=pins.find(id=>models.get(id).id===choice.siteId),site=models.get(id);const comparison=comparePoint(site,{...config(),delay:choice.delay},Number($('activity').value));
   if(plan.arrivalDeadlineUTC&&Date.parse(comparison.revised.startUTC)>Date.parse(plan.arrivalDeadlineUTC))throw new Error('No tested recommendation may exceed the requested arrival deadline.');
   selected=id;visualFlow?.refresh(pins.map(id=>catalogue.find(p=>p.id===id)),catalogue.find(p=>p.id===id));inspectScenarioPreview({site,comparison,locationId:id,kind:'AI tested alternative',name:`${catalogue.find(p=>p.id===id).name} · ${comparison.revised.startUTC}`});
   report.unshift(`Found ${found.choices.length} passing tested alternative(s) from ${found.tested} checks. Showing ${comparison.revised.startUTC}, ${choice.name}, ${choice.height} m: ${choice.longestCombined.toFixed(2)} h continuous shared, ${choice.overlap.toFixed(2)} h total shared. Ranking: least additional delay, then longest continuous shared, then total shared; ties remain. The controls retain the search baseline; use Apply arrival in the date grid to adopt the preview.`);
  }else report.unshift(`No passing arrival among ${found.tested} checks at additional delays 0–72 h in 12-hour steps. ${found.unavailable.length} checks were unavailable. This does not rule out other dates.`);
 }
 aiView(plan.view);globeView?.focus(catalogue.find(p=>p.id===selected),supportedPolarPoint(catalogue.find(p=>p.id===selected)));
 report.push('These are modeled visibility constraints, not landing safety, electrical/RF performance or full mission feasibility. Source identities remain in the regular evidence/export workflow.');
 return report.join('\n\n');
}
