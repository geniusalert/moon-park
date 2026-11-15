import * as THREE from './vendor/three.module.js';
import {OrbitControls} from './vendor/OrbitControls.js';
import {azElToScene} from './spatial-math.js';
export class SkySimulator{
 constructor(container){
  this.container=container;this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#101713');this.camera=new THREE.PerspectiveCamera(60,1,.001,50);this.renderer=new THREE.WebGLRenderer({antialias:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));container.append(this.renderer.domElement);this.renderer.domElement.setAttribute('role','img');this.renderer.domElement.setAttribute('aria-label','3D angular sky simulator; horizon and Sun/Earth tracks use inspected calculation samples. All radial distances are illustrative.');this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.enablePan=false;this.controls.enableDamping=false;this.controls.minDistance=1.5;this.controls.maxDistance=6;this.controls.addEventListener('change',()=>this.draw());this.root=new THREE.Group();this.scene.add(this.root);this.mode='dome';this.key=null;this.frame=null;this.camera.position.set(2,1.4,2);new ResizeObserver(()=>this.draw()).observe(container);
 }
 clear(){for(const object of [...this.root.children]){this.root.remove(object);object.traverse(o=>{o.geometry?.dispose();o.material?.map?.dispose();o.material?.dispose();});}}
 line(points,color,opacity=1){const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color,transparent:opacity<1,opacity}));this.root.add(line);return line;}
 label(text,position,color){const canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;const ctx=canvas.getContext('2d');ctx.fillStyle='#101713dd';ctx.fillRect(0,0,256,64);ctx.font='28px system-ui';ctx.textAlign='center';ctx.fillStyle=color;ctx.fillText(text,128,42);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false}));sprite.position.copy(position);sprite.scale.set(.28,.07,1);this.root.add(sprite);}
 point(az,el,r=1){return new THREE.Vector3(...azElToScene(az,el)).multiplyScalar(r);}
 set(site,result,sample,index){
  this.stop();this.site=site;this.result=result;this.sample=sample;this.index=index;
  this.clear();if(!site||!result||!sample){this.draw();return;}
  for(const elevation of [-30,0,30,60]){const p=[];for(let az=0;az<=360;az+=3)p.push(this.point(az,elevation));this.line(p,elevation===0?'#b5bdaa':'#3b4a40');}
  for(let az=0;az<360;az+=45){const p=[];for(let el=-90;el<=90;el+=3)p.push(this.point(az,el));this.line(p,'#3b4a40');}
  for(const [name,az]of [['N',0],['E',90],['S',180],['W',270]])this.label(name,this.point(az,6,1.05),'#bdc9ba');
  const profile=site.profiles[String(result.config.height)];const boundary=profile.map(p=>this.point(p.az,p.el,1.004));if(boundary.length)boundary.push(boundary[0]);this.line(boundary,'#c9e2aa');
  const vertices=[];for(let i=0;i<profile.length;i++){const a=profile[i],b=profile[(i+1)%profile.length];for(const p of [this.point(a.az,a.el),this.point(a.az,-40),this.point(b.az,b.el),this.point(b.az,b.el),this.point(a.az,-40),this.point(b.az,-40)])vertices.push(...p.toArray());}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));this.curtain=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color:0x8fa37e,transparent:true,opacity:.13,side:THREE.DoubleSide,depthWrite:false}));this.root.add(this.curtain);
  for(const [name,azKey,elKey,color]of [['Sun','az','sunEl',0xedcc8b],['Earth','earthAz','earthEl',0xaec4aa]]){
   const points=result.samples.map(s=>this.point(s[azKey],s[elKey],1.015));this.line(points,color,.5);
   const pos=this.point(sample[azKey],sample[elKey],1.025),marker=new THREE.Mesh(new THREE.SphereGeometry(.025,16,12),new THREE.MeshBasicMaterial({color}));marker.position.copy(pos);this.root.add(marker);this.label(name,pos.clone().multiplyScalar(1.1),name==='Sun'?'#edcc8b':'#aec4aa');this.line([new THREE.Vector3(),pos],color,.55);
  }
  const observer=new THREE.Mesh(new THREE.SphereGeometry(.018,12,8),new THREE.MeshBasicMaterial({color:0xffffff}));this.root.add(observer);
  this.applyMode();this.draw();
 }
 setMode(mode){this.stop();this.mode=mode;this.applyMode();this.draw();}
 applyMode(){
  if(!this.sample)return;
  const observer=this.mode==='sun'||this.mode==='earth';this.controls.enabled=!observer;this.curtain.visible=this.mode!=='tracks';
  if(observer){this.camera.position.set(0,0,0);const target=this.mode==='sun'?this.point(this.sample.az,this.sample.sunEl):this.point(this.sample.earthAz,this.sample.earthEl);this.camera.up.set(0,1,0);this.camera.lookAt(target);}
  else {this.camera.position.set(2,1.4,2);this.camera.up.set(0,1,0);this.controls.target.set(0,0,0);this.controls.update();}
 }
 stop(){if(this.frame)cancelAnimationFrame(this.frame);this.frame=null;const b=document.getElementById('skyOrbit');if(b){b.textContent='Orbit camera';b.setAttribute('aria-pressed','false');}}
 orbit(){
  if(this.frame){this.stop();return;}if(['sun','earth'].includes(this.mode))this.setMode('dome');
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){this.camera.position.applyAxisAngle(new THREE.Vector3(0,1,0),Math.PI/6);this.camera.lookAt(0,0,0);this.draw();return;}
  let previous=performance.now();const tick=now=>{const elapsed=Math.min(.1,(now-previous)/1000);previous=now;this.camera.position.applyAxisAngle(new THREE.Vector3(0,1,0),elapsed*.18);this.camera.lookAt(0,0,0);this.draw();this.frame=requestAnimationFrame(tick);};this.frame=requestAnimationFrame(tick);const b=document.getElementById('skyOrbit');b.textContent='Pause orbit';b.setAttribute('aria-pressed','true');
 }
 draw(){const w=this.container.clientWidth;if(!w)return;this.renderer.setSize(w,360,false);this.camera.aspect=w/360;this.camera.updateProjectionMatrix();this.renderer.render(this.scene,this.camera);}
}
