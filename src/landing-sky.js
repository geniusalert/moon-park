import * as THREE from './vendor/three.module.js';
import {azElToScene} from './spatial-math.js';
import {loadBodyModel,bodyOpacity} from './scene-assets.js';
import {sampledSkyState} from './landing-surface.js';
const $=id=>document.getElementById(id);
export class LandingSky{
 constructor(scene,container,onChange=()=>{}){
  this.group=new THREE.Group();scene.add(this.group);this.items=[];this.container=container;
  this.observer=new THREE.Mesh(new THREE.SphereGeometry(.18,12,8),new THREE.MeshBasicMaterial({color:'#dce9b8'}));this.group.add(this.observer);
  for(const [target,color,radius] of [['sun','#edcc8b',7],['earth','#8cb9ac',18]]){
   const body=new THREE.Group();const fallback=new THREE.Mesh(new THREE.SphereGeometry(radius,24,16),new THREE.MeshBasicMaterial({color,transparent:true,depthTest:false}));body.add(fallback);this.group.add(body);
   loadBodyModel(target,target==='earth'?90:64).then(model=>{body.remove(fallback);fallback.geometry.dispose();fallback.material.dispose();body.add(model);body.userData.model=target;bodyOpacity(body,this.state?.[target].visible===false?.3:1);onChange();}).catch(()=>{body.userData.model='fallback symbol';onChange();});
   const wire=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineDashedMaterial({color,dashSize:18,gapSize:12,transparent:true,opacity:.8,depthTest:false}));wire.renderOrder=4;this.group.add(wire);
   const label=document.createElement('span');label.className='landing-body-label';label.setAttribute('aria-hidden','true');container.append(label);this.items.push({target,body,wire,label});
  }
  this.horizon=new THREE.LineLoop(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:'#9ba98a',transparent:true,opacity:.45,depthTest:false}));this.group.add(this.horizon);this.profileCache=new Map();this.group.visible=false;
 }
 set(context,visible,ground=0,writeUI=true){
  const state=context?.sample?sampledSkyState(context.sample,context.height??2):null;this.state=state;this.group.visible=!!state&&visible;
  if(writeUI){$('landingLiveSky').hidden=!state;$('landingMissionControls').hidden=!state;}
  if(!state){for(const i of this.items)i.label.hidden=true;return;}
  const origin=new THREE.Vector3(0,ground+state.observerHeightM,0);this.observer.position.copy(origin);this.origin=origin;
  const profile=context.site?.profiles?.[String(state.observerHeightM)];const profileKey=`${context.site?.id}:${context.site?.provenance?.sha256}:${state.observerHeightM}:${ground}`;
  if(profileKey!==this.profileKey){if(!this.profileKey)this.horizon.geometry.dispose();this.profileKey=profileKey;if(!this.profileCache.has(profileKey)){const vertices=(profile??[]).map(row=>origin.clone().addScaledVector(new THREE.Vector3(...azElToScene(row.az,row.el)),1400));this.profileCache.set(profileKey,new THREE.BufferGeometry().setFromPoints(vertices));}this.horizon.geometry=this.profileCache.get(profileKey);this.horizon.visible=!!profile?.length;if(this.profileCache.size>8){const oldest=this.profileCache.keys().next().value;this.profileCache.get(oldest).dispose();this.profileCache.delete(oldest);}}

  for(const item of this.items){const s=state[item.target],end=origin.clone().addScaledVector(new THREE.Vector3(...s.direction),1400);item.body.position.copy(end);bodyOpacity(item.body,s.visible?1:.3);
   item.wire.geometry.dispose();item.wire.geometry=new THREE.BufferGeometry().setFromPoints([origin,end]);item.wire.computeLineDistances();item.wire.material.dashSize=s.visible?2000:18;item.wire.material.opacity=s.visible?.8:.5;item.wire.material.color.set(s.visible?(item.target==='sun'?'#edcc8b':'#b9d6b0'):'#dc9a83');
   item.label.textContent=`${item.target==='sun'?'Sun':'Earth'} · ${s.visible?'visible':'hidden'}`;
   if(writeUI){const box=$(item.target==='sun'?'landingSunState':'landingEarthState');box.textContent=`${item.target==='sun'?'Sun':'Earth'} ${s.visible?'visible':'hidden'} · az ${s.az.toFixed(2)}° · elevation ${s.elevation.toFixed(2)}° · clearance ${Number.isFinite(s.clearance)?s.clearance.toFixed(2)+'°':'unavailable'}`;box.dataset.visible=String(s.visible);}
  }
  if(!writeUI)return;
  $('landingObserverNote').textContent=`Lines start at the selected surface observer (${state.observerHeightM} m), not the moving lander. Solid = visible; dashed = hidden. Earth/Sun models, orientation, sizes and line lengths are illustrative. Faint outline = calculated angular horizon (including distant terrain); the local mesh covers only the displayed patch. Sample UTC: ${state.utc}.`;
  const active=context.result,index=context.index??0;if(active){$('landingMissionTime').disabled=false;$('landingMissionTime').max=active.samples.length-1;$('landingMissionTime').value=index;$('landingMissionTime').setAttribute('aria-valuetext',state.utc);$('landingMissionUTC').textContent=`${state.utc} · ${active.config.stepMinutes}-minute calculated samples`;$('landingMissionPlay').textContent=$('play').textContent==='Pause'?'Pause conditions':'Play conditions';}
  const svg=$('landingSkyCompass');svg.replaceChildren();const ns='http://www.w3.org/2000/svg';const add=(tag,attrs,text)=>{const e=document.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,v);if(text)e.textContent=text;svg.append(e);};
  add('circle',{cx:70,cy:70,r:48,fill:'none',stroke:'#6e805f'});for(const [x,y,t] of [[66,15,'N'],[126,75,'E'],[66,138,'S'],[3,75,'W']])add('text',{x,y,fill:'#bfccae','font-size':10},t);
  for(const [name,s,color]of [['Sun',state.sun,'#edcc8b'],['Earth',state.earth,'#b9d6b0']]){const a=s.az*Math.PI/180,x=70+Math.sin(a)*45,y=70-Math.cos(a)*45;add('line',{x1:70,y1:70,x2:x,y2:y,stroke:color,'stroke-dasharray':s.visible?'none':'3 3'});add('circle',{cx:x,cy:y,r:4,fill:color});add('text',{x:Math.max(4,Math.min(104,x+5)),y:y-6,fill:color,'font-size':9},name);}
 }
 labels(camera,w,h){for(const item of this.items){const p=item.body.position.clone().project(camera),x=(p.x+1)*w/2,y=(1-p.y)*h/2;item.label.hidden=!this.group.visible||p.z< -1||p.z>1||x<60||x>w-60||y<80||y>h-100;if(!item.label.hidden){item.label.style.left=x+'px';item.label.style.top=y+'px';}}}
}
