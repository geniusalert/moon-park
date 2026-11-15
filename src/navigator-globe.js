import * as THREE from './vendor/three.module.js';
import {loadBodyModel,bodyOpacity} from './scene-assets.js';
import {OrbitControls} from './vendor/OrbitControls.js';
import {lunarXYZ,xyzToLunar,localDirection} from './moon-coordinates.js';
export class NavigatorGlobe{
 constructor(container,{onPoint,onLocation}){
  this.container=container;this.onPoint=onPoint;this.onLocation=onLocation;this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#0c110e');this.camera=new THREE.PerspectiveCamera(40,1,.002,100);this.camera.position.set(2.7,-1,1.1);this.renderer=new THREE.WebGLRenderer({antialias:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));container.append(this.renderer.domElement);this.renderer.domElement.setAttribute('role','img');this.renderer.domElement.setAttribute('aria-label','Moon globe with historical landing sites and selectable south-pole research points. Drag to orbit; scroll to zoom. Equivalent location controls follow.');
  this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.minDistance=1.03;this.controls.maxDistance=30;this.controls.enablePan=false;this.controls.addEventListener('change',()=>this.render());
  const material=new THREE.MeshBasicMaterial({color:0xb7bec5});this.moon=new THREE.Mesh(new THREE.SphereGeometry(1,128,64),material);this.scene.add(this.moon);
  const apply=texture=>{texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(8,this.renderer.capabilities.getMaxAnisotropy());material.map?.dispose();material.map=texture;material.color.set(0xffffff);material.needsUpdate=true;this.render();};
  const loader=new THREE.TextureLoader();loader.load('/data/globe/lroc-color-2k.jpg',texture=>{apply(texture);container.dataset.texture='2k';this.textureStatus.textContent='2K imagery · loading detail';loader.load('/data/globe/lroc-color-8k.jpg',high=>{if(this.renderer.capabilities.maxTextureSize<8192){high.dispose();this.textureStatus.textContent='2K imagery · device limit';return;}apply(high);container.dataset.texture='8k';this.textureStatus.textContent='8K LROC context · polar albedo fill';},undefined,()=>{this.textureStatus.textContent='2K imagery · high detail unavailable';});},undefined,()=>{container.dataset.texture='unavailable';this.textureStatus.textContent='Imagery unavailable · coordinate sphere';});
  this.overlay=document.createElement('div');this.overlay.className='globe-overlay';container.append(this.overlay);this.textureStatus=document.createElement('span');this.textureStatus.className='globe-texture-status';this.textureStatus.textContent='Loading NASA imagery';container.append(this.textureStatus);this.readout=document.createElement('span');this.readout.className='globe-coordinate-readout';this.readout.textContent='DRAG TO ORBIT · SCROLL TO ZOOM';container.append(this.readout);
  this.graticule=new THREE.Group();const lineMaterial=new THREE.LineBasicMaterial({color:0xaec4aa,transparent:true,opacity:.23});
  for(let lat=-60;lat<=60;lat+=30){const points=[];for(let lon=0;lon<=360;lon+=2)points.push(new THREE.Vector3(...lunarXYZ(lon,lat,1.001)));this.graticule.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),lineMaterial));}
  for(let lon=0;lon<360;lon+=30){const points=[];for(let lat=-90;lat<=90;lat+=2)points.push(new THREE.Vector3(...lunarXYZ(lon,lat,1.001)));this.graticule.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),lineMaterial));}this.scene.add(this.graticule);this.graticule.visible=false;
  this.renderer.domElement.addEventListener('pointermove',e=>{if(this.stage)return;const b=this.renderer.domElement.getBoundingClientRect();this.pick.setFromCamera(new THREE.Vector2((e.clientX-b.left)/b.width*2-1,-(e.clientY-b.top)/b.height*2+1),this.camera);const hit=this.pick.intersectObject(this.moon)[0];if(hit){const p=xyzToLunar(hit.point.toArray());this.readout.textContent=`${Math.abs(p.latitude).toFixed(3)}° ${p.latitude<0?'S':'N'} / ${Math.abs(p.longitude).toFixed(3)}° ${p.longitude<0?'W':'E'}`;}});
  const ring=[];for(let lon=0;lon<=360;lon++)ring.push(new THREE.Vector3(...lunarXYZ(lon,-85,1.002)));const ringMesh=new THREE.Line(new THREE.BufferGeometry().setFromPoints(ring),new THREE.LineBasicMaterial({color:0xc9e2aa}));this.scene.add(ringMesh);this.markers=new THREE.Group();this.scene.add(this.markers);this.directions=new THREE.Group();this.scene.add(this.directions);this.pick=new THREE.Raycaster();
  let down;this.renderer.domElement.addEventListener('pointerdown',e=>{if(this.stage)return;down=[e.clientX,e.clientY];});this.renderer.domElement.addEventListener('pointerup',e=>{if(this.stage)return;if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;const bounds=this.renderer.domElement.getBoundingClientRect();this.pick.setFromCamera(new THREE.Vector2((e.clientX-bounds.left)/bounds.width*2-1,-(e.clientY-bounds.top)/bounds.height*2+1),this.camera);const hits=this.pick.intersectObjects([this.moon,...this.markers.children],false);const hit=hits[0];if(!hit)return;if(hit.object.userData.location)this.onLocation(hit.object.userData.location);else this.onPoint(xyzToLunar(hit.point.toArray()));});
  this.bodies=new THREE.Group();this.scene.add(this.bodies);this.bodyItems=[];
  for(const [name,color,size]of [['sun','#edcc8b',.75],['earth','#b9cfad',.65]]){
   const group=new THREE.Group();this.bodies.add(group);const label=document.createElement('span');label.className='globe-body-label';label.hidden=true;container.append(label);const item={name,group,label};this.bodyItems.push(item);
   loadBodyModel(name,size).then(model=>{group.add(model);group.userData.loaded=true;container.dataset[name+'Model']='loaded';bodyOpacity(group,this.skySample?.[name]===false?.55:1);this.render();}).catch(()=>{const fallback=new THREE.Mesh(new THREE.SphereGeometry(size/2,24,16),new THREE.MeshBasicMaterial({color}));group.add(fallback);group.userData.loaded=false;container.dataset[name+'Model']='fallback';this.render();});
  }this.bodies.visible=false;
  new ResizeObserver(()=>this.render()).observe(container);this.render();
 }
 setLocations(locations,pins,selected){
  this.overlay.replaceChildren();this.pinLabels=[];
  for(const child of [...this.markers.children]){this.markers.remove(child);child.geometry.dispose();child.material.dispose();}
  for(const p of locations){const active=p.id===selected,pinned=pins.includes(p.id);const mesh=new THREE.Mesh(new THREE.SphereGeometry(active?.009:p.kind==='mission'?.008:.0035,10,8),new THREE.MeshBasicMaterial({color:active?0xffffff:pinned?0xc9e2aa:p.kind==='mission'?0xeab978:0xaec4aa}));mesh.position.fromArray(lunarXYZ(p.longitude,p.latitude,1.005));mesh.userData.location=p;this.markers.add(mesh);if(pinned){const label=document.createElement('button');label.className='globe-pin-label';label.textContent=`${pins.indexOf(p.id)+1} · ${p.name}`;label.onclick=()=>this.onLocation(p);this.overlay.append(label);this.pinLabels.push({label,position:mesh.position.clone()});}}this.render();
 }
 highlight(p){if(this.focusRing){this.scene.remove(this.focusRing);this.focusRing.geometry.dispose();this.focusRing.material.dispose();}this.focusRing=new THREE.Mesh(new THREE.RingGeometry(1,1.3,40),new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide}));const normal=new THREE.Vector3(...lunarXYZ(p.longitude,p.latitude));this.focusRing.position.copy(normal.clone().multiplyScalar(1.013));this.focusRing.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),normal);this.scene.add(this.focusRing);this.render();}
 focus(p,close=true){this.highlight(p);this.camera.up.set(0,1,0);const vector=new THREE.Vector3(...lunarXYZ(p.longitude,p.latitude));if(Math.abs(p.latitude)>80)this.camera.up.set(1,0,0);this.camera.position.copy(vector.multiplyScalar(close?1.24:3));this.controls.target.set(0,0,0);this.controls.update();this.render();}
 whole(){this.camera.up.set(0,1,0);this.camera.position.set(3,0,0);this.controls.target.set(0,0,0);this.controls.update();this.render();}
 celestial(site,sample){
  for(const child of [...this.directions.children]){this.directions.remove(child);child.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}
  this.skySite=site;this.skySample=sample;this.bodies.visible=!!site&&!!sample;
  if(site&&sample){const origin=new THREE.Vector3(...lunarXYZ(site.longitude,site.latitude,1.008));
   for(const item of this.bodyItems){const solar=item.name==='sun',az=solar?sample.az:sample.earthAz,el=solar?sample.sunEl:sample.earthEl,visible=solar?sample.sun:sample.earth;
    const direction=new THREE.Vector3(...localDirection(site.longitude,site.latitude,az,el));item.group.position.copy(origin).addScaledVector(direction,solar?3.6:3.1);bodyOpacity(item.group,visible?1:.55);
    const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([origin,item.group.position]),new THREE.LineDashedMaterial({color:visible?(solar?'#edcc8b':'#b9cfad'):'#cf9f8b',dashSize:visible?10:.05,gapSize:.035,transparent:true,opacity:.75,depthTest:false}));line.computeLineDistances();this.directions.add(line);item.label.textContent=`${solar?'Sun':'Earth'} · ${visible?'visible':'hidden'}`;
   }
  }
  const note=document.getElementById('globeEnvironment');if(note)note.textContent=sample?`${sample.utc} · Sun ${sample.sunEl.toFixed(2)}° (${sample.sun?'visible':'hidden'}) · Earth ${sample.earthEl.toFixed(2)}° (${sample.earth?'visible':'hidden'}). Positions are observer directions; body sizes, texture orientation and distances are illustrative.`:'Generate a site and time to see calculated Sun / Earth positions. The textured Moon is geographic context.';
  this.render();
 }
 setStage(stage){
  if(this.stage===stage)return;this.stage?.activate(false);this.stage=stage;this.controls.enabled=!stage;
  this.overlay.hidden=!!stage||!this.markers.visible;this.textureStatus.hidden=!!stage;this.readout.hidden=!!stage;for(const i of this.bodyItems)i.label.hidden=true;
  this.container.dataset.stage=stage?'surface':'globe';if(stage)stage.activate(true);else{this.renderer.toneMapping=THREE.NoToneMapping;this.renderer.shadowMap.enabled=false;this.renderer.setScissorTest(false);this.render();}
 }
 system(){
  if(!this.skySample){this.whole();return;}
  const objects=[{p:new THREE.Vector3(),r:1},...this.bodyItems.map(i=>({p:i.group.position,r:i.name==='sun'?.4:.35}))],box=new THREE.Box3();for(const o of objects){box.expandByPoint(o.p.clone().addScalar(o.r));box.expandByPoint(o.p.clone().addScalar(-o.r));}
  const center=box.getCenter(new THREE.Vector3()),away=new THREE.Vector3(.4,1.6,2.8).normalize(),right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),away).normalize(),up=new THREE.Vector3().crossVectors(away,right),tan=Math.tan(this.camera.fov*Math.PI/360);let distance=3;
  const aspect=this.container.clientWidth/(this.container.clientHeight||480);
  for(const o of objects){const d=o.p.clone().sub(center),depth=d.dot(away);distance=Math.max(distance,depth+(Math.abs(d.dot(up))+o.r)/tan,depth+(Math.abs(d.dot(right))+o.r)/(tan*aspect));}
  this.camera.up.set(0,1,0);this.controls.target.copy(center);this.camera.position.copy(center).addScaledVector(away,distance*1.13);this.controls.update();this.render();
 }

 zoom(factor){this.camera.position.sub(this.controls.target).multiplyScalar(factor).clampLength(this.controls.minDistance,this.controls.maxDistance).add(this.controls.target);this.controls.update();this.render();}
 layers(grid,sites){this.graticule.visible=grid;this.markers.visible=sites;this.overlay.hidden=!sites;this.render();}
 render(){if(this.stage){this.stage.render();return;}if(this.focusRing)this.focusRing.scale.setScalar(Math.max(.001,(this.camera.position.length()-1)*.015));const w=this.container.clientWidth,h=this.container.clientHeight||430;if(!w)return;this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.renderer.setViewport(0,0,w,h);this.renderer.setScissorTest(false);this.renderer.render(this.scene,this.camera);for(const item of this.pinLabels??[]){const v=item.position.clone().project(this.camera),front=item.position.dot(this.camera.position)>1;item.label.hidden=!front||Math.abs(v.x)>.94||Math.abs(v.y)>.92;item.label.style.left=`${(v.x+1)*w/2}px`;item.label.style.top=`${(1-v.y)*h/2}px`;}
  let previous=null;for(const item of this.bodyItems??[]){const p=item.group.position.clone().project(this.camera),x=(p.x+1)*w/2;let y=(1-p.y)*h/2;item.label.hidden=!this.bodies.visible||p.z< -1||p.z>1||x<50||x>w-50||y<30||y>h-40;if(previous&&Math.abs(x-previous.x)<130&&Math.abs(y-previous.y)<35)y=previous.y+36;item.label.style.left=x+'px';item.label.style.top=y+'px';previous={x,y};}
 }
}
