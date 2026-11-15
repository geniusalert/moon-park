// Presentation only: keep the original controls and scientific state intact.
const $=id=>document.getElementById(id);
const element=(tag,attributes={},text)=>{const e=document.createElement(tag);for(const [k,v]of Object.entries(attributes))e.setAttribute(k,v);if(text!==undefined)e.textContent=text;return e;};
export function installObservatory({panel,globe,context}){
 const menu=element('aside',{id:'v2ToolMenu','aria-label':'Tools and information',hidden:''});
 menu.innerHTML='<div class="v2-menu-heading"><h2>Tools & information</h2><button id="v2CloseMenu" type="button" aria-label="Close tools">×</button></div><p id="v2MenuEmpty">Generate a scenario to unlock calculated readouts.</p><section class="v2-menu-section"><h3>Workspace</h3><div id="v2WorkspaceOptions"></div></section><section class="v2-menu-section"><h3>3D environment</h3><div id="v2MenuViews"></div></section><div id="v2InformationTools"></div>';
 document.body.append(menu);
 const menuButton=element('button',{id:'v2MenuToggle',type:'button','aria-expanded':'false','aria-controls':'v2ToolMenu'},'☰ Menu');
 const nav=document.querySelector('.v2-topbar nav');nav.prepend(menuButton);
 const menuOpen=value=>{menu.hidden=!value;document.body.classList.toggle('menu-open',value);menuButton.setAttribute('aria-expanded',String(value));};
 menuButton.onclick=()=>menuOpen(menu.hidden);$('v2CloseMenu').onclick=()=>{menuOpen(false);menuButton.focus();};
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden&&!document.querySelector('dialog[open]')){menuOpen(false);menuButton.focus();}});
 document.addEventListener('pointerdown',e=>{if(!menu.hidden&&!menu.contains(e.target)&&e.target!==menuButton&&!e.target.closest('dialog'))menuOpen(false);});

 const heading=element('div',{class:'v2-input-heading'});heading.innerHTML='<div><span class="v2-kicker">MISSION SETUP</span><h2>Plan a scenario</h2></div><button id="v2MapToggle" type="button" aria-pressed="false" aria-controls="v2MapOverlay">Map</button>';
 $('v2Left').prepend(heading);
 const collapse=$('v2TogglePlan');collapse.textContent='‹';collapse.setAttribute('aria-label','Collapse or expand the input sidebar');collapse.setAttribute('aria-controls','v2Left');document.body.append(collapse);
 $('v2ToggleResults').textContent='Show mission metrics';$('v2WorkspaceOptions').append($('v2ToggleResults'));
 const fullscreen=$('v2Fullscreen');fullscreen.textContent='Full screen';$('v2WorkspaceOptions').append(fullscreen);
 const graphOption=element('button',{id:'v2MenuGraphs',type:'button','aria-pressed':'false'},'Show graphs');$('v2WorkspaceOptions').append(graphOption);graphOption.onclick=()=>$('v2ToggleDock').click();
 const mapOption=element('button',{id:'v2MenuMap',type:'button','aria-pressed':'false'},'Show map overlay');$('v2WorkspaceOptions').append(mapOption);

 // The map belongs to the scene, never to the input column.
 const map=element('section',{id:'v2MapOverlay','aria-label':'Location map overlay',hidden:''});map.append($('v2Locator'));document.body.append(map);
 const mapClose=element('button',{id:'v2MapHide',type:'button','aria-label':'Hide map overlay'},'×');map.querySelector('.v2-panel-heading').append(mapClose);
 function showMap(value){if(value&&innerWidth<1100){panel('left',false);panel('right',false);}map.hidden=!value;document.body.classList.toggle('map-open',value);$('v2MapToggle').setAttribute('aria-pressed',String(value));mapOption.setAttribute('aria-pressed',String(value));window.dispatchEvent(new Event('moonpark-v2-layout'));}
 $('v2MapToggle').onclick=()=>showMap(map.hidden);mapOption.onclick=()=>showMap(map.hidden);mapClose.onclick=()=>showMap(false);
 let drag;const grip=map.querySelector('.v2-panel-heading');grip.title='Drag to move the map within the scene';
 grip.addEventListener('pointerdown',e=>{if(e.target.closest('button')||e.button!==0)return;const rect=map.getBoundingClientRect();drag={x:e.clientX,y:e.clientY,left:rect.left,top:rect.top};grip.setPointerCapture(e.pointerId);e.preventDefault();});
 grip.addEventListener('pointermove',e=>{if(!drag)return;const left=innerWidth>=1100&&document.body.classList.contains('left-open')?$('v2Left').getBoundingClientRect().right+12:10,top=document.querySelector('.v2-topbar').getBoundingClientRect().bottom+10;map.style.left=Math.max(left,Math.min(innerWidth-map.offsetWidth-10,drag.left+e.clientX-drag.x))+'px';map.style.top=Math.max(top,Math.min(innerHeight-map.offsetHeight-115,drag.top+e.clientY-drag.y))+'px';map.style.bottom='auto';});
 for(const name of ['pointerup','pointercancel','lostpointercapture'])grip.addEventListener(name,()=>{drag=null;});
 window.addEventListener('resize',()=>{map.style.removeProperty('left');map.style.removeProperty('top');map.style.removeProperty('bottom');});

 const info=element('div',{id:'v2SceneInfo','aria-label':'Inspected scene context'});info.append($('v2StageName'));info.append(element('strong',{id:'v2SceneLocation'},'Choose a lunar location'));info.append(element('span',{id:'v2SceneCoordinate'}));info.append($('v2Clock'),element('span',{id:'v2SceneBasis'},'Geographic atlas · neutral lighting'));document.body.append(info);
 const labels=element('button',{id:'v2MenuLabels',type:'button','aria-pressed':'true'},'Scene information visible');$('v2WorkspaceOptions').append(labels);labels.onclick=()=>{info.hidden=!info.hidden;labels.setAttribute('aria-pressed',String(!info.hidden));};
 for(const id of ['v2ToggleResults','v2MenuMap','v2MenuGraphs','v2Fullscreen','v2MenuLabels'])$(id).addEventListener('click',()=>menuOpen(false));

 // Preserve all camera identities for internal actions; remove the old shortcut bar.
 for(const id of ['globeWhole','globePole','globeSelected','v2Fit'])$('v2Compatibility').append($(id));
 const zoom=element('div',{id:'v2ZoomRail','aria-label':'Scene zoom'});zoom.append($('globeZoomIn'),$('globeZoomOut'));document.body.append(zoom);
 const layers=element('details');layers.append(element('summary',{},'View options'));for(const id of ['globeGrid','globeSites'])layers.append($(id).closest('label'));$('v2InformationTools').append(layers);
 $('v2MenuViews').append(document.querySelector('.scene-workflow'));
 for(const id of ['sceneGlobe','sceneSystem','sceneSimulate','sceneCompare'])$(id).addEventListener('click',()=>{menuOpen(false);if(id==='sceneGlobe'){globe().showCelestial(false);const c=context();if(c.location)globe().focus(c.location,false);else globe().whole();}$('v2SceneBasis').textContent=id==='sceneSystem'?'Observer directions · diagrammatic body scales':id==='sceneGlobe'?'Geographic atlas · neutral lighting':'Display terrain · illustrative descent';});
 $('v2LandingTools').append($('v2DescentControls'));
 const notices=element('details');notices.append(element('summary',{},'Location, model and source notes'),$('v2Notices'));
 for(const id of ['v2DetailedMetrics','v2MoonExplainer','v2LandingTools','v2ComparisonTools','v2AnalysisTools','v2AlternativeTools','v2SaveTools','v2SkyTools'])$('v2InformationTools').append($(id));$('v2InformationTools').append(notices);
 for(const help of document.querySelectorAll('#v2PlannerScroll .inline-help'))notices.append(help);
 // Avoid a second view toolbar: comparison and body views live in Menu.
 $('v2ViewModes').hidden=true;$('v2CameraTools').hidden=true;

 // Persistent light playback; charts are a separate opt-in overlay above it.
 const playback=element('section',{id:'v2Playback','aria-label':'Mission time playback'}),toggles=element('div',{id:'v2ReplayToggles'});document.body.append(playback);playback.append($('sharedReplay'),toggles);const graphs=$('v2ToggleDock');graphs.textContent='Graphs';graphs.setAttribute('aria-controls','v2Bottom');toggles.append(graphs);
 for(const [id,text,label]of [['replayStart','|◀','Go to arrival'],['previousEvent','‹','Previous visibility event'],['nextEvent','›','Next visibility event'],['replayEnd','▶|','Go to last sample']]){const b=$(id);b.textContent=text;b.title=label;b.setAttribute('aria-label',label);}
 $('v2ToggleResults').setAttribute('aria-controls','v2Right');$('v2Right').setAttribute('aria-label','Essential mission metrics');
 compactInputs();
 const reflect=()=>{collapse.textContent=document.body.classList.contains('left-open')?'‹':'›';graphOption.setAttribute('aria-pressed',String(document.body.classList.contains('dock-open')));if(innerWidth<1100&&!map.hidden&&(document.body.classList.contains('left-open')||document.body.classList.contains('right-open')))showMap(false);};new MutationObserver(reflect).observe(document.body,{attributes:true,attributeFilter:['class']});reflect();
 return {showMap,showMenu:menuOpen,update(c){$('v2MenuEmpty').hidden=!!c.sample;const p=c.location;$('v2SceneLocation').textContent=p?.name??'Choose a lunar location';$('v2SceneCoordinate').textContent=p?`${Math.abs(p.latitude).toFixed(4)}° ${p.latitude<0?'S':'N'} · ${Math.abs(p.longitude).toFixed(4)}° ${p.longitude<0?'W':'E'}`:'Drag the Moon to explore · scroll to zoom';const scene=globe();$('v2SceneBasis').textContent=scene.stage?'Display terrain · illustrative descent':scene.celestialMode?'Observer directions · diagrammatic body scales':'Geographic atlas · neutral lighting';graphOption.setAttribute('aria-pressed',String(document.body.classList.contains('dock-open')));$('v2ToggleResults').textContent=document.body.classList.contains('right-open')?'Hide mission metrics':'Show mission metrics';collapse.textContent=document.body.classList.contains('left-open')?'‹':'›';}};
}
function compactInputs(){
 const body=$('setupStep2').querySelector('.step-body'),grid=element('div',{class:'v2-arrival-grid'});
 for(const id of ['arrival','delay','duration','height']){const group=element('div',{class:'v2-input-field'+(id==='arrival'?' v2-input-wide':'')});group.append(document.querySelector('label[for="'+id+'"]'),$(id));grid.append(group);}body.prepend(grid);
 for(const id of ['setupStep1','setupStep2','setupStep3'])$(id).addEventListener('toggle',()=>{if(!$(id).open)return;for(const other of ['setupStep1','setupStep2','setupStep3'])if(other!==id)$(other).open=false;});
}
