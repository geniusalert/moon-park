import * as THREE from './vendor/three.module.js';
import {OrbitControls} from './vendor/OrbitControls.js';
import {loadSceneModel} from './scene-assets.js';
import {prepareLandingSurface} from './landing-surface.js';
import {landingTerrainMesh,releaseSurface} from './landing-material.js';
import {LandingSky} from './landing-sky.js';
import {comparisonAtUTC,comparisonRects} from './scene-comparison.js';
import {azElToScene} from './spatial-math.js';
import {landingPose,LANDING_DURATION} from './landing-motion.js';
const $=id=>document.getElementById(id);
class LandingSimulator{
 constructor(host,{onGlobe,onInspect}){
  this.host=host;this.container=host.container;this.renderer=host.renderer;this.onGlobe=onGlobe;this.onInspect=onInspect;
  this.context={};this.entries=[];this.surfaces=new Map();this.time=0;this.speed=1;this.mode='follow';this.active=false;this.layout='single';
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#050706');this.emptyScene=new THREE.Scene();this.emptyScene.background=new THREE.Color('#121813');
  this.camera=new THREE.PerspectiveCamera(44,1,.08,12000);this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.enabled=false;this.controls.enableDamping=false;
  this.controls.addEventListener('start',()=>{this.mode='orbit';$('landingCamera').value='orbit';});this.controls.addEventListener('change',()=>{if(!this.updatingCamera)this.render();});
  this.surfaceRoot=new THREE.Group();this.scene.add(this.surfaceRoot);this.ambient=new THREE.HemisphereLight('#e5e4dd','#161715',.35);this.scene.add(this.ambient);
  this.sun=new THREE.DirectionalLight('#fff6df',3);this.sun.castShadow=true;this.sun.shadow.mapSize.set(1024,1024);Object.assign(this.sun.shadow.camera,{left:-26,right:26,top:26,bottom:-26,near:.1,far:1500});this.sun.shadow.normalBias=.04;this.scene.add(this.sun,this.sun.target);
  this.fill=new THREE.DirectionalLight('#d9d9cf',.35);this.fill.position.set(-80,120,-50);this.scene.add(this.fill);
  this.craft=new THREE.Group();this.scene.add(this.craft);this.target=new THREE.Group();this.scene.add(this.target);
  const ring=new THREE.Mesh(new THREE.RingGeometry(5.5,5.58,96),new THREE.MeshBasicMaterial({color:'#d1df9e',transparent:true,opacity:.55,side:THREE.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.05;this.target.add(ring);
  this.plume=new THREE.Mesh(new THREE.ConeGeometry(.65,5,20,1,true),new THREE.MeshBasicMaterial({color:'#f0dda0',transparent:true,opacity:.18,side:THREE.DoubleSide,depthWrite:false}));this.plume.position.y=-.7;this.craft.add(this.plume);
  this.dustPositions=new Float32Array(240*3);const dustGeo=new THREE.BufferGeometry();dustGeo.setAttribute('position',new THREE.BufferAttribute(this.dustPositions,3));this.dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({color:'#b4b0a6',size:.14,transparent:true,opacity:0,depthWrite:false}));this.scene.add(this.dust);
  this.craftLabel=document.createElement('span');this.craftLabel.className='landing-object-label';this.craftLabel.textContent='Apollo Lunar Module';this.craftLabel.hidden=true;this.container.append(this.craftLabel);
  this.sky=new LandingSky(this.scene,this.container,()=>this.render());
  new MutationObserver(()=>{if($('view-globe').hidden)this.pause();}).observe($('view-globe'),{attributes:true,attributeFilter:['hidden']});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)this.pause();});
  this.renderer.domElement.addEventListener('keydown',e=>{if(!this.active)return;if(e.code==='Space'){e.preventDefault();this.toggle();}else if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();this.pause();this.seek(this.time+(e.key==='ArrowRight'?1:-1)*(e.shiftKey?5:1));}});
  this.bind();
 }
 bind(){
  $('landingPlay').onclick=()=>this.toggle();$('sceneRun').onclick=()=>this.toggle();$('sceneLight').onclick=()=>{$('landingUseSun').checked=!$('landingUseSun').checked;this.seek(this.time);};$('landingReset').onclick=()=>{this.pause();this.seek(0);};$('landingTime').oninput=()=>{this.pause();this.seek(Number($('landingTime').value));};$('landingSpeed').onchange=()=>{this.speed=Number($('landingSpeed').value);};
  $('landingCamera').onchange=()=>{this.mode=$('landingCamera').value;if(this.mode==='overview'){this.onGlobe();return;}this.seek(this.time);};
  $('landingFullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('view-globe').requestFullscreen();}catch{$('landingAssetStatus').textContent='Full screen unavailable in this browser.';}};
  $('landingSurfaceMode').onchange=async()=>{if($('landingSurfaceMode').value==='demo')try{await this.ensureMoon();}catch(e){$('landingSurfaceMode').value='auto';$('landingAssetStatus').textContent='Optional Moon model unavailable: '+e.message;}this.configureSurface();this.seek(this.time);};
  $('landingShowLinks').onchange=()=>{this.configureSurface();this.render();};$('landingUseSun').onchange=()=>this.seek(this.time);
  $('landingMissionTime').oninput=()=>{$('time').value=$('landingMissionTime').value;$('time').dispatchEvent(new Event('input',{bubbles:true}));};$('landingMissionPlay').onclick=()=>$('play').click();$('landingRetry').onclick=()=>this.load();
 }
 async load(){
  if(this.loading||this.ready)return;this.loading=true;$('landingRetry').hidden=true;$('landingAssetStatus').textContent='Loading Apollo lander model…';
  try{const model=await loadSceneModel('apollo-lunar-module'),box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3()),scale=7/size.y;
   model.scale.multiplyScalar(scale);model.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale);model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});this.craft.add(model);this.lander=model;this.ready=true;$('sceneRun').disabled=false;
   this.configureSurface();this.seek(this.time);for(const id of ['landingPlay','landingReset','landingTime','landingCamera'])$(id).disabled=false;
   $('landingAssetStatus').textContent='Apollo lander loaded · Earth and Sun use your supplied models · drag to orbit in single-site mode';
  }catch(e){$('landingAssetStatus').textContent='Lander model unavailable: '+e.message;$('landingRetry').hidden=false;}finally{this.loading=false;}
 }
 async ensureMoon(){
  if(this.moon)return;if(this.moonLoading)return this.moonLoading;
  this.moonLoading=(async()=>{const moon=await loadSceneModel('moon'),box=new THREE.Box3().setFromObject(moon),scale=1000/box.getSize(new THREE.Vector3()).y,center=box.getCenter(new THREE.Vector3());moon.scale.multiplyScalar(scale);moon.position.copy(center.multiplyScalar(-scale));moon.position.y-=500;this.scene.add(moon);moon.updateMatrixWorld(true);
   const hit=new THREE.Raycaster(new THREE.Vector3(0,1000,0),new THREE.Vector3(0,-1,0)).intersectObject(moon,true)[0];if(!hit)throw new Error('No model contact point');this.demoGroundY=hit.point.y+.025;this.moon=moon;})();
  try{await this.moonLoading;}finally{this.moonLoading=null;}
 }
 entryFor(site){
  if(!site?.display)return null;const key=`${site.id}:${site.provenance?.sha256}:${site.landingDisplay?.pixelM??'coarse'}`;if(this.surfaces.has(key))return this.surfaces.get(key);
  const surface=prepareLandingSurface(site);if(!surface)return null;const group=new THREE.Group(),entry={surface,group};
  if(site.landingDisplay&&surface.tile===site.landingDisplay){entry.outer=prepareLandingSurface(site,site.display);const t=surface.tile,bounds={minX:Math.min(...t.x),maxX:Math.max(...t.x),minY:Math.min(...t.y),maxY:Math.max(...t.y)};if(entry.outer)group.add(landingTerrainMesh(entry.outer,bounds));}
  group.add(landingTerrainMesh(surface));this.surfaceRoot.add(group);this.surfaces.set(key,entry);
  if(this.surfaces.size>8){const oldest=this.surfaces.keys().next().value,old=this.surfaces.get(oldest);this.surfaces.delete(oldest);this.surfaceRoot.remove(old.group);releaseSurface(old.group);}return entry;
 }
 adopt(context){
  this.displayContext=context;for(const entry of this.surfaces.values())entry.group.visible=false;
  const entry=$('landingSurfaceMode').value==='demo'?null:this.entryFor(context.site);this.surface=entry?.surface;this.outerSurface=entry?.outer;this.isScientific=!!entry;this.groundY=entry?0:this.demoGroundY??0;
  if(entry)entry.group.visible=true;if(this.moon)this.moon.visible=!entry;this.target.position.y=this.groundY+.03;
 }
 configureSurface(){
  this.adopt(this.context);const p=this.context.location,tile=this.surface?.tile;
  $('landingSite').textContent=p?`${p.name??'Coordinate'} · ${p.latitude.toFixed(5)}° N · ${p.longitude.toFixed(5)}° E`:'Generate a site first';$('landingScenarioTime').textContent=this.context.sample?.utc??'No calculated observation selected';
  $('landingSurfaceEvidence').textContent=this.surface?(this.surface.sphere?'Reference sphere: no measured elevation or terrain. Regolith grain is decorative shading only.':`NASA LOLA measured surface · display grid ${tile.pixelM} m · native source ${tile.sourceResolutionCounts?Object.keys(tile.sourceResolutionCounts).join(' / '):this.context.site.provenance?.groundResolutionM??'see sources'} m · true relief · center display offset ${this.surface.offset.toFixed(3)} m. Regolith grain is decorative, not extra measured detail.`):$('landingSurfaceMode').value==='demo'?'Supplied Moon model demo · unregistered surface and compressed Moon scale.':'Selected surface unavailable; generate a supported result. No other site is substituted.';
  $('landingScaleLabel').textContent=this.isScientific?(this.surface.sphere?'Reference sphere · decorative grain · animated descent':'Measured terrain · true metre scale · animated descent'):'Supplied model · compressed Moon scale';
  this.sky.set(this.context,this.isScientific&&$('landingShowLinks').checked,this.groundY);$('landingUseSun').disabled=!this.context.sample;
 }
 setContext(context){this.context=context??{};if(this.context.sample&&!this.hadObservation){$('landingUseSun').checked=false;this.hadObservation=true;}if(!this.context.sample){$('landingUseSun').checked=false;this.hadObservation=false;this.pause();}this.configureSurface();this.updateComparison();if(this.ready)this.seek(this.time);}
 setEntries(entries){this.entries=entries;this.updateComparison();this.render();}
 updateComparison(){
  this.compared=comparisonAtUTC(this.entries,this.context.sample?.utc).map(e=>e.available&&!this.entryFor(e.site)?{...e,available:false,reason:'Surface data is incomplete; no terrain is substituted.'}:e);const overlay=$('sceneCompareOverlay');overlay.replaceChildren();const summary=$('sceneComparisonSummary');summary.replaceChildren();const kinds=new Set(this.compared.filter(e=>e.available).map(e=>e.site.analysisModel??'terrain'));$('sceneComparisonModelNote').textContent=kinds.size>1?'Mixed models: measured terrain and reference-sphere screening are shown separately. Terrain omissions differ; this view does not rank the sites.':'Panels share an exact sampled UTC and animation phase. Each location retains its own surface and visibility evidence.';
  for(const [i,e]of this.compared.entries()){
   const pane=document.createElement('div');pane.className='scene-compare-pane';const title=document.createElement('button');title.textContent=`${String.fromCharCode(65+i)} · ${e.point.name}`;title.onclick=()=>this.onInspect(e.point.id);pane.append(title);
   const detail=document.createElement('p');detail.textContent=e.available?`${e.sample.utc} · ${e.site.analysisModel==='reference-sphere'?'Reference sphere; terrain omitted':'Measured terrain'}`:e.reason;pane.append(detail);
   const values=document.createElement('p');values.className='scene-pane-values';values.textContent=e.available?`Sun ${e.sample.sun?'visible':'hidden'} ${e.sample.sunEl.toFixed(2)}° · Earth ${e.sample.earth?'visible':'hidden'} ${e.sample.earthEl.toFixed(2)}°`:'Unavailable';pane.append(values);overlay.append(pane);
   const card=document.createElement('article'),name=document.createElement('strong');name.textContent=e.point.name;card.append(name);const metrics=document.createElement('p');metrics.textContent=e.available?`Sun ${e.result.sunHours.toFixed(1)} h · Earth ${e.result.earthHours.toFixed(1)} h · shared ${e.result.overlap.toFixed(1)} h · continuous shared ${e.result.longestCombined.toFixed(1)} h` :e.reason;card.append(metrics);const status=document.createElement('p');status.textContent=e.available?((e.failures??e.result.failures).join('; ')||'Entered visibility limits pass; landing safety is not assessed.'):'';card.append(status);summary.append(card);
  }
 }
 setLayout(layout){this.layout=layout;if(layout==='compare')$('landingSurfaceMode').value='auto';$('landingSurfaceMode').disabled=layout==='compare';this.configureSurface();this.mode='follow';$('landingCamera').value='follow';this.controls.enabled=this.active&&layout!=='compare';this.container.dataset.layout=layout;$('sceneCompareOverlay').hidden=layout!=='compare';$('sceneComparisonSummary').hidden=layout!=='compare';this.seek(this.time);}
 activate(value){this.active=value;this.controls.enabled=value&&this.layout!=='compare';this.container.querySelector('.landing-hud').hidden=!value;this.container.querySelector('.landing-readouts').hidden=!value;if(!value){this.pause();this.craftLabel.hidden=true;for(const i of this.sky.items)i.label.hidden=true;return;}this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=.9;this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFShadowMap;this.render();}
 terrainHeight(x,z){const h=this.surface?.heightAt(x,z)??this.outerSurface?.heightAt(x,z);if(this.isScientific&&!Number.isFinite(h))throw new Error('Animated path outside available surface');return h??this.groundY;}
 applyPose(){const pose=landingPose(this.time),floor=this.terrainHeight(pose.x,pose.z);this.pose=pose;this.craft.position.set(pose.x,floor+pose.altitude,pose.z);this.craft.rotation.set(pose.tilt,Math.PI*.16,-pose.tilt*.6);this.plume.visible=pose.engine;this.plume.scale.set(.7+pose.altitude/600,Math.min(1,Math.max(.04,pose.altitude/10)),.7+pose.altitude/600);
  for(let i=0;i<240;i++){const a=i*2.39996323,age=(this.time*1.7+i*.073)%1.5,speed=1.5+(i%17)*.16;this.dustPositions[i*3]=pose.x+Math.cos(a)*speed*age;this.dustPositions[i*3+1]=floor+.05+Math.max(0,age*(.7+(i%5)*.06)-.81*age*age);this.dustPositions[i*3+2]=pose.z+Math.sin(a)*speed*age;}this.dust.geometry.attributes.position.needsUpdate=true;this.dust.material.opacity=.32*pose.dust;this.dust.visible=pose.dust>0;
 }
 lighting(writeUI=true){const s=this.displayContext.sample,use=$('landingUseSun').checked&&s,d=use?azElToScene(s.az,s.sunEl):[-.7,.8,.6];this.ambient.intensity=use?.035:.4;this.fill.intensity=use?0:.35;this.sun.intensity=use?(s.sun?3:0):3;this.sun.target.position.copy(this.craft.position);this.sun.position.copy(this.craft.position).addScaledVector(new THREE.Vector3(...d).normalize(),600);
  if(writeUI){$('sceneLightingBadge').textContent=use?'Calculated Sun direction · display shading':'Inspection light · modeled visibility unchanged';$('sceneLight').setAttribute('aria-pressed',String(!use));$('landingLightingNote').textContent=use?`Calculated Sun elevation ${s.sunEl.toFixed(2)}°; ${s.sun?'visible':'hidden'} at the fixed ${this.displayContext.height} m observer. Local shading is a display approximation, not a spatial shadow map.`:'Studio fill for readability; modeled visibility is unchanged.';}
 }
 poseCamera(){const p=this.craft.position;this.controls.minDistance=8;this.controls.maxDistance=this.mode==='context'?6000:2500;this.controls.maxPolarAngle=Math.PI*.49;
  if(['sun','earth'].includes(this.mode)){const body=this.sky.state?.[this.mode];if(body){this.controls.maxPolarAngle=Math.PI;this.camera.position.set(10,this.groundY+(this.displayContext.height??2)+6,14);this.controls.target.copy(this.sky.origin).addScaledVector(new THREE.Vector3(...body.direction),400);}}
  else if(this.mode==='context'){this.camera.position.set(0,this.groundY+1800,3600);this.controls.target.set(0,this.groundY,0);}
  else if(this.mode==='follow'){this.camera.position.copy(p).add(new THREE.Vector3(23,14,30));this.controls.target.copy(p).add(new THREE.Vector3(0,3,0));}
  else if(this.mode==='surface'){this.camera.position.set(30,this.groundY+9,38);this.controls.target.copy(p).add(new THREE.Vector3(0,3,0));}
  this.updatingCamera=true;this.controls.update();this.updatingCamera=false;
 }
 seek(time){this.time=Math.max(0,Math.min(LANDING_DURATION,time));if(!this.ready)return;this.adopt(this.context);this.applyPose();this.lighting();this.poseCamera();const pose=this.pose;
  $('landingTime').value=this.time;$('landingTime').setAttribute('aria-valuetext',`${this.time.toFixed(1)} animation seconds, ${pose.phase}, ${pose.altitude.toFixed(1)} m animated clearance`);$('landingAltitude').textContent=pose.altitude.toFixed(1)+' m';$('landingVelocity').textContent=pose.descentSpeed.toFixed(2)+' m/s';$('landingClock').textContent=this.time.toFixed(1)+' / '+LANDING_DURATION+' s';$('landingPhase').textContent=pose.phase;$('landingEngine').textContent=pose.engine?'Engine on':'Engine off';$('comparisonClock').textContent=`Shared animation: ${pose.phase} · ${this.time.toFixed(1)} / 66 s · ${pose.altitude.toFixed(1)} m clearance above each displayed mesh. Each panel uses its own calculated sky at the UTC shown.`;if(!this.playing)$('landingPlay').textContent=this.time>=LANDING_DURATION?'Replay landing':'Start / resume landing';$('sceneRun').textContent=this.playing?'Pause landing':this.time>=LANDING_DURATION?'Replay landing':'Play landing';this.render();
 }
 render(){
  if(!this.active||this.rendering||$('view-globe').hidden)return;const w=this.container.clientWidth;if(!w)return;const wantedHeight=this.layout==='compare'&&w<700?Math.max(1,this.compared?.length??0)*400+'px':'';if(this.container.style.height!==wantedHeight)this.container.style.height=wantedHeight;const h=this.container.clientHeight;if(!h)return;this.rendering=true;
  try{this.renderer.setSize(w,h,false);const compare=this.layout==='compare',cells=compare?this.compared??[]:[{...this.context,available:!!this.context.site}];const rects=comparisonRects(w,h,Math.max(1,cells.length));
   this.renderer.setScissorTest(true);for(let i=0;i<cells.length;i++){const e=cells[i],r=rects[i],y=h-r.y-r.height;this.renderer.setViewport(r.x,y,r.width,r.height);this.renderer.setScissor(r.x,y,r.width,r.height);this.camera.aspect=r.width/r.height;this.camera.updateProjectionMatrix();
    if(this.ready&&e.available){this.adopt(e);this.sky.set(e,this.isScientific&&$('landingShowLinks').checked,this.groundY,false);this.applyPose();this.lighting(false);this.poseCamera();this.renderer.render(this.scene,this.camera);}else this.renderer.render(this.emptyScene,this.camera);
    if(compare){const pane=$('sceneCompareOverlay').children[i];Object.assign(pane.style,{left:r.x+'px',top:r.y+'px',width:r.width+'px',height:r.height+'px'});}
   }
   this.renderer.setScissorTest(false);this.adopt(this.context);this.sky.set(this.context,this.isScientific&&$('landingShowLinks').checked,this.groundY);if(this.ready){this.applyPose();this.lighting();this.poseCamera();}
   if(compare){this.craftLabel.hidden=true;for(const i of this.sky.items)i.label.hidden=true;}else{this.sky.labels(this.camera,w,h);if(this.ready){const p=this.craft.position.clone().add(new THREE.Vector3(0,8.5,0)).project(this.camera),x=(p.x+1)*w/2,y=(1-p.y)*h/2;this.craftLabel.hidden=p.z>1||p.z< -1||x<60||x>w-60||y<75||y>h-100;this.craftLabel.style.left=x+'px';this.craftLabel.style.top=y+'px';}}
  }finally{this.rendering=false;}
 }
 toggle(){if(!this.ready||!this.active)return;if(this.playing){this.pause();return;}if(this.time>=LANDING_DURATION)this.seek(0);this.playing=true;$('landingPlay').textContent='Pause';$('sceneRun').textContent='Pause landing';this.previous=null;this.frame=requestAnimationFrame(t=>this.tick(t));}
 pause(){this.playing=false;cancelAnimationFrame(this.frame);$('sceneRun').textContent=this.time>=LANDING_DURATION?'Replay landing':'Play landing';$('landingPlay').textContent=this.time>=LANDING_DURATION?'Replay landing':'Start / resume landing';}
 tick(now){if(!this.playing||!this.active||document.hidden||$('view-globe').hidden){this.pause();return;}const delta=this.previous==null?0:Math.min(.1,(now-this.previous)/1000);this.previous=now;this.seek(this.time+delta*this.speed);if(this.time>=LANDING_DURATION){this.pause();return;}this.frame=requestAnimationFrame(t=>this.tick(t));}
}
export function installLandingSimulation({globe,getEntries,onInspect}){
 let simulator=null,context={},current='globe',hadSample=false;
 function mode(name){if(!globe)return;current=name;const local=name!=='globe';if(!local)$('moonGlobe').style.height='';$('landingExperience').hidden=!local;$('sceneRun').hidden=!local;$('sceneLight').hidden=!local;$('sceneLightingBadge').hidden=!local;$('globeEnvironment').hidden=local;for(const e of document.querySelectorAll('.camera-presets,.atlas-toolbar,.atlas-hint'))e.hidden=local;
  for(const [id,key]of [['sceneGlobe','globe'],['sceneSimulate','single'],['sceneCompare','compare']])$(id).setAttribute('aria-pressed',String(name===key));
  $('comparisonClock').hidden=name!=='compare';$('sceneComparisonSummary').hidden=name!=='compare';$('sceneComparisonModelNote').hidden=name!=='compare';$('sceneCompareOverlay').hidden=name!=='compare';
  if(local){if(!simulator)simulator=new LandingSimulator(globe,{onGlobe:()=>mode('globe'),onInspect});simulator.setEntries(getEntries());simulator.setContext(context);simulator.setLayout(name==='compare'?'compare':'single');globe.setStage(simulator);simulator.load();}
  else globe.setStage(null);
 }
 const focusScene=()=>$('moonGlobe').scrollIntoView({block:current==='compare'&&$('moonGlobe').clientWidth<700?'start':'center'});$('sceneGlobe').onclick=()=>{mode('globe');focusScene();};$('sceneSystem').onclick=()=>{mode('globe');globe?.system();focusScene();};$('sceneSimulate').onclick=()=>{mode('single');focusScene();};$('sceneCompare').onclick=()=>{mode('compare');focusScene();};
 return {setContext(value){context=value??{};const entries=getEntries();$('sceneSimulate').disabled=!context.sample||!context.site?.display;$('sceneCompare').disabled=!context.sample||entries.length<2||!entries.some(e=>e.result);$('sceneCompare').textContent=`Compare sites${entries.length>1?' ('+entries.length+')':''}`;
   $('sceneFlowNote').textContent=context.sample?'Environment calculated. Inspect the Moon / Earth / Sun, simulate this site, or compare your generated locations.':'Choose a location and time, then Generate. Missing or changed results must be calculated before simulation.';
   if(!context.sample&&current!=='globe')mode('globe');else if(current==='compare'&&entries.length<2)mode('single');simulator?.setEntries(entries);simulator?.setContext(context);if(context.sample&&!hadSample&&current==='globe')queueMicrotask(()=>{if(current==='globe')globe?.system();});hadSample=!!context.sample;
  },open(){mode('single');}};
}
