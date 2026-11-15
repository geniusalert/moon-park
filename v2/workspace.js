import {horizon,timeline} from './charts.js';
import {installGuide} from './guide.js';
import {installReplayTools} from './replay-controls.js';
import {installDecisionTools} from './decision-tools.js';
import {guideContext} from './help-content.js';
import {installObservatory} from './observatory-shell.js';
const $=id=>document.getElementById(id);
let api,context={},lastView=null,follow=true,pending=false,decisions,shell;
function layout(){window.dispatchEvent(new Event('resize'));window.dispatchEvent(new Event('moonpark-v2-layout'));requestAnimationFrame(()=>{if(context.sample)paintCharts();});}
export function panel(name,open){document.body.classList.toggle(name+'-open',open);const map={left:'v2TogglePlan',right:'v2ToggleResults',dock:'v2ToggleDock'};$(map[name]).setAttribute('aria-expanded',String(open));layout();}
function paintCharts(){if(!context.sample||!context.site||!context.result)return;horizon(context.site.profiles[String(context.height)],context.sample,context.site.analysisModel==='reference-sphere');timeline(context.result,context.index);}
function repaint(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;sync();});}
function sync(){
 if(!api)return;const ready=!!context.sample,point=context.location??api.selected();document.body.classList.toggle('v2-calculated',ready);
 $('v2RightTitle').textContent=point?.name??'No site calculated';$('v2RightCoordinate').textContent=point?`${point.latitude.toFixed(5)}° N · ${point.longitude.toFixed(5)}° E${ready?'':' · preview'}`:'Choose a location, then Generate.';
 $('v2ModelScope').textContent=ready?(context.site.analysisModel==='reference-sphere'?'Reference sphere · measured terrain omitted':'Measured terrain · source detail below'):'Preview · calculation needed';
 $('v2Clock').textContent=context.sample?.utc??$('arrival').value.replace('T',' ')+' UTC';$('v2MobileUTC').textContent=context.sample?.utc??'UTC · generate a scenario';$('v2EmptyMetrics').hidden=ready;$('v2HorizonBasis').textContent=ready?((point?.name??'Selected site').slice(0,28)+' · '+(context.site.analysisModel==='reference-sphere'?'Reference sphere · terrain omitted':'Measured terrain · no refraction')):'Generate a scenario';
 $('v2StageName').textContent=$('moonGlobe').dataset.stage==='surface'?($('moonGlobe').dataset.layout==='compare'?'SITE COMPARISON':'LOCAL LANDING VIEW'):'LUNAR GLOBE';
 const err=$('error').textContent;$('v2Toast').hidden=!err;$('v2Toast').textContent=err;const job=$('jobs').textContent;$('v2StatusText').textContent=job||($('coverage').textContent.includes('installed')?'Local engine ready · choose a location':'Loading local source catalogue…');$('v2StatusText').title=job;
 if(ready&&!sync.wasReady&&innerWidth<1100&&document.body.classList.contains('left-open'))panel('left',false);sync.wasReady=ready;
 const state=api.state();$('v2SiteList').replaceChildren();for(const [i,p]of state.pins.entries()){const b=document.createElement('button');b.type='button';b.textContent=String.fromCharCode(65+i)+' · '+p.name;b.setAttribute('aria-pressed',String(p.id===state.selected));b.onclick=()=>api.inspect(p.id);$('v2SiteList').append(b);}
 decisions.update({context,state});
 shell?.update(context);
 for(const summary of document.querySelectorAll('summary[aria-label]'))if(summary.textContent.trim()==='?')summary.textContent=summary.getAttribute('aria-label');
 $('v2WindowMetrics').replaceChildren();if(ready)for(const [name,value]of [['Shared total',context.result.overlap],['Longest shared',context.result.longestCombined]]){const box=document.createElement('div'),label=document.createElement('span'),number=document.createElement('strong');label.textContent=name;number.textContent=value.toFixed(1)+' h';box.append(label,number);$('v2WindowMetrics').append(box);}
 const controls=$('sharedReplay');controls.hidden=false;for(const e of controls.querySelectorAll('button,input,select'))e.disabled=!ready;
 $('v2ReplayUTC').textContent=context.sample?.utc??'Generate a scenario to enable mission replay';
 if(!ready){$('horizonScene').replaceChildren();$('timeline').replaceChildren();}else paintCharts();
 if(follow&&lastView?.point)map(lastView.point,lastView.mode);else if(point)map(point,'site');
 const mode=$('moonGlobe').dataset.stage==='surface';document.body.classList.toggle('v2-local',mode);$('v2DescentControls').hidden=!mode;$('v2LandingTools').classList.toggle('has-scene',mode);$('v2ComparisonTools').classList.toggle('has-comparison',state.pins.length>1);
}
function map(point,mode){api.map(point);$('v2MapPosition').textContent=`${mode==='globe'?'Near-facing view':mode==='surface'?'Local surface':'Selected site'} · ${Math.abs(point.latitude).toFixed(2)}° ${point.latitude<0?'S':'N'}, ${Math.abs(point.longitude).toFixed(2)}° ${point.longitude<0?'W':'E'}`;}
export function installV2(adapter){
 if(api)return;api=adapter;
 const scope=document.createElement('span');scope.id='v2ModelScope';$('v2ConditionsHeader').append(scope);
 installGuide({context:()=>guideContext(adapter.context(),context)});installReplayTools();installLocationUX();installLocator();decisions=installDecisionTools(adapter);
 const metrics=document.createElement('div');metrics.id='v2WindowMetrics';$('v2MetricsMount').append(metrics);const sites=document.createElement('div');sites.id='v2SiteList';$('v2ActionMount').prepend(sites);
 if(innerWidth<1100){document.body.classList.remove('left-open','right-open');$('v2TogglePlan').setAttribute('aria-expanded','false');$('v2ToggleResults').setAttribute('aria-expanded','false');}
 for(const [button,name]of [['v2TogglePlan','left'],['v2ToggleResults','right'],['v2ToggleDock','dock']])$(button).onclick=()=>{const opening=!document.body.classList.contains(name+'-open');if(innerWidth<1100&&opening&&name!=='dock')panel(name==='left'?'right':'left',false);panel(name,opening);};
 $('v2MapMode').onclick=()=>{follow=!follow;$('v2MapMode').textContent=follow?'Follow view':'Selected site';$('v2MapMode').setAttribute('aria-pressed',String(follow));sync();};
 window.addEventListener('moonpark-v2-context',event=>{context=event.detail??{};repaint();});window.addEventListener('moonpark-v2-view',event=>{lastView=event.detail;if(follow&&lastView?.point)map(lastView.point,lastView.mode);});
 const observer=new MutationObserver(repaint);for(const id of ['liveMetrics','activeLocationName','activeTimeBadge','jobs','error','coverage','loadStatus','analysisStatus'])observer.observe($(id),{childList:true,subtree:true,characterData:true});observer.observe($('moonGlobe'),{attributes:true,attributeFilter:['data-stage','data-layout']});
 window.addEventListener('moonpark-v2-jobs',repaint);for(const id of ['comparisonScenario','comparisonLayout'])$(id).addEventListener('change',repaint);
 new ResizeObserver(()=>{if(context.sample)paintCharts();}).observe($('v2Bottom'));
 for(const id of ['sceneGlobe','sceneSystem','sceneSimulate','sceneCompare','sceneRun','sceneLight'])$(id).addEventListener('click',()=>{if(innerWidth<1100)panel('right',false);});
 window.addEventListener('moonpark-v2-tool',e=>{const name=e.detail;if(['horizon','timeline'].includes(name))panel('dock',true);if(name==='map')shell?.showMap(true);if(name==='simulation'){shell?.showMenu(true);$('v2SkyTools').open=true;$('view-simulation').hidden=false;}});
 window.addEventListener('resize',()=>{if(context.sample)paintCharts();});
 for(const [id,timelineMode]of [['v2ChartHorizon',false],['v2ChartTimeline',true]])$(id).onclick=()=>{document.body.classList.toggle('timeline-focus',timelineMode);$('v2ChartHorizon').setAttribute('aria-pressed',String(!timelineMode));$('v2ChartTimeline').setAttribute('aria-pressed',String(timelineMode));layout();};
 const small=matchMedia('(max-width:1099px)');small.addEventListener('change',e=>{panel('left',!e.matches);panel('right',!e.matches);});
 $('v2QuickPlay').onclick=()=>$('sceneRun').click();const refreshPlayback=()=>{$('v2QuickPlay').disabled=$('sceneRun').disabled;const paused=$('sceneRun').textContent.includes('Pause');$('v2QuickPlay').textContent=paused?'Ⅱ':'▶';$('v2QuickPlay').setAttribute('aria-label',paused?'Pause landing':'Play landing');$('v2QuickClock').textContent='Descent '+$('landingClock').textContent;};const playObserver=new MutationObserver(refreshPlayback);for(const id of ['sceneRun','landingClock'])playObserver.observe($(id),{childList:true,characterData:true,subtree:true});refreshPlayback();
 $('v2PrevSite').onclick=()=>$('previousSite').click();$('v2NextSite').onclick=()=>$('nextSite').click();
 $('v2Fit').onclick=()=>{if(adapter.globe().stage)$('sceneGlobe').click();adapter.globe().whole();};$('v2Fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{$('v2Toast').hidden=false;$('v2Toast').textContent='Full screen is unavailable in this browser.';}};
 shell=installObservatory({panel,globe:adapter.globe,context:()=>context});sync();adapter.globe()?.whole();layout();document.body.dataset.ready='true';
}
function installLocationUX(){
 const body=$('setupStep1').querySelector('.step-body'),label=document.createElement('label');label.htmlFor='v2LocationMethod';label.textContent='Location input';const select=document.createElement('select');select.id='v2LocationMethod';for(const [value,text]of [['catalogue','Site catalogue'],['custom','Custom lunar coordinates'],['mission','Mission programme / named target']])select.add(new Option(text,value));body.prepend(label,select);
 const mission=document.querySelector('.mission-programs'),catalogueLabel=document.querySelector('label[for=location]');
 function method(value){select.value=value;for(const e of [catalogueLabel,$('location'),$('pin'),$('locationContext')])e.hidden=value!=='catalogue';$('customCoordinatePanel').hidden=value!=='custom';mission.hidden=value!=='mission';if(value==='mission')mission.open=true;}
 select.onchange=()=>method(select.value);method('catalogue');
 $('addAnotherSite').addEventListener('click',()=>{method('catalogue');$('location').focus();});
 window.addEventListener('moonpark-v2-preview',e=>{if(e.detail==='globe'||e.detail==='custom')method('custom');});
}
function installLocator(){
 const buttons=document.createElement('div');buttons.className='v2-map-actions';buttons.innerHTML='<label for="v2MapScale">Map radius</label><select id="v2MapScale"><option value="50">50 km</option><option value="200" selected>200 km</option><option value="500">500 km</option></select><button id="v2MapExpand" type="button" aria-haspopup="dialog">Expand map ↗</button>';$('v2MapPosition').after(buttons);$('polarMap').dataset.rangeKm='200';
 const dialog=document.createElement('dialog');dialog.id='v2MapDialog';dialog.setAttribute('aria-label','Expanded location map');dialog.innerHTML='<header><div><h2>Location map</h2><p>Geographic context · north up · distance rings</p></div><button id="v2MapClose" type="button" aria-label="Close location map">×</button></header><div id="v2ExpandedMap"></div><p>Click a coordinate or marker to choose it. Coordinates are geographic; this diagram adds no measured terrain coverage. Use the planner to Generate the selected point.</p>';
 document.body.append(dialog);const redraw=()=>{const point=follow&&lastView?.point?lastView.point:context.location??api.selected();if(point)api.map(point);};
 $('v2MapScale').onchange=()=>{$('polarMap').dataset.rangeKm=$('v2MapScale').value;redraw();};
 $('v2MapExpand').onclick=()=>{$('v2ExpandedMap').append($('view-map'));dialog.showModal();redraw();};$('v2MapClose').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{$('v2MapMount').append($('view-map'));redraw();$('v2MapExpand').focus();});
 $('polarMap').addEventListener('click',()=>{if(dialog.open)dialog.close();});
}
