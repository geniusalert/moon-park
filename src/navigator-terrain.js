import {slopeColor,elevationColor,SLOPE_BANDS,MISSING_COLOR} from './terrain-palette.js';
import {displayTerrainStats} from './terrain-dynamics.js';
import * as THREE from './vendor/three.module.js';
import {OrbitControls} from './vendor/OrbitControls.js';
import {terrainToScene,azElToScene} from './spatial-math.js';
export class NavigatorTerrain{
 constructor(container){
  this.container=container;this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#101713');this.camera=new THREE.PerspectiveCamera(45,1,.001,1000);this.renderer=new THREE.WebGLRenderer({antialias:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.outputColorSpace=THREE.SRGBColorSpace;container.append(this.renderer.domElement);this.renderer.domElement.setAttribute('role','img');this.renderer.domElement.setAttribute('aria-label','Local calculation terrain with observer, north/east reference and Sun/Earth direction rays. Drag to orbit; live metrics provide text equivalents.');this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.enableDamping=false;this.controls.addEventListener('change',()=>this.render());this.scene.add(new THREE.AmbientLight(0xffffff,.9));this.sunLight=new THREE.DirectionalLight(0xfff0ce,2);this.scene.add(this.sunLight);this.rays=new THREE.Group();this.scene.add(this.rays);this.labels=document.createElement('div');this.labels.className='terrain-labels';container.append(this.labels);this.labelObjects=[];this.scale=2;new ResizeObserver(()=>this.render()).observe(container);
 }
 clearRays(){for(const child of [...this.rays.children]){this.rays.remove(child);child.traverse(object=>{object.geometry?.dispose();if(Array.isArray(object.material))object.material.forEach(m=>m.dispose());else object.material?.dispose();});}this.labels.replaceChildren();this.labelObjects=[];}
 label(text,position,color){const span=document.createElement('span');span.textContent=text;span.style.color=color;this.labels.append(span);this.labelObjects.push({span,position});}
 celestial(sample,height=2){
  this.clearRays();if(!sample){this.render();return;}
  const origin=new THREE.Vector3(0,height/1000,0),length=this.scale*.75;
  const observer=new THREE.Mesh(new THREE.SphereGeometry(this.scale*.012,10,8),new THREE.MeshBasicMaterial({color:0xffffff}));observer.position.copy(origin);this.rays.add(observer);this.label('Observer',origin,'#ffffff');
  for(const [name,az,el,visible,color] of [['Sun',sample.az,sample.sunEl,sample.sun,0xedcc8b],['Earth',sample.earthAz,sample.earthEl,sample.earth,0xaec4aa]]){const direction=new THREE.Vector3(...azElToScene(az,el));const arrow=new THREE.ArrowHelper(direction,origin,length,color,this.scale*.05,this.scale*.025);this.rays.add(arrow);this.label(`${name} ${visible?'visible':'hidden'}`,origin.clone().addScaledVector(direction,length),'#'+color.toString(16));if(name==='Sun')this.sunLight.position.copy(direction.multiplyScalar(20));}
  for(const [name,direction] of [['N',new THREE.Vector3(0,0,-1)],['E',new THREE.Vector3(1,0,0)]]){const arrow=new THREE.ArrowHelper(direction,origin,this.scale*.35,0x91a596,this.scale*.025,this.scale*.012);this.rays.add(arrow);this.label(name,origin.clone().addScaledVector(direction,this.scale*.35),'#bdc9ba');}
  this.render();
 }
 set(site){
  this.clearRays();if(this.mesh){this.scene.remove(this.mesh);this.mesh.geometry.dispose();this.mesh.material.dispose();this.mesh=null;}
  this.renderer.domElement.setAttribute('aria-label',site?.analysisModel==='reference-sphere'?'Smooth reference-sphere curvature patch with observer-relative Sun/Earth directions; no measured terrain':'Local calculation terrain with observer and Sun/Earth directions');this.site=site;if(!site)document.getElementById('terrainLegend')?.replaceChildren();const tile=site?.display;if(!tile){this.render();return false;}
  const geometry=new THREE.BufferGeometry(),vertices=[],indices=[];
  for(let r=0;r<tile.height;r++)for(let c=0;c<tile.width;c++){const z=tile.z[r][c];vertices.push(...(Number.isFinite(z)?(tile.frame==='local-reference-sphere'?[tile.x[c]/1000,z/1000,-tile.y[r]/1000]:terrainToScene(tile.x[c],tile.y[r],z,site)):[0,0,0]));}
  for(let r=0;r<tile.height-1;r++)for(let c=0;c<tile.width-1;c++){if([tile.z[r][c],tile.z[r][c+1],tile.z[r+1][c],tile.z[r+1][c+1]].some(z=>!Number.isFinite(z)))continue;const a=r*tile.width+c,b=a+1,d=a+tile.width,e=d+1;indices.push(a,d,b,b,d,e);}
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();geometry.computeBoundingSphere();this.scale=Math.max(.3,geometry.boundingSphere.radius);this.mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:0x879597,side:THREE.DoubleSide,roughness:1}));this.scene.add(this.mesh);this.colorMode(this.mode??'relief');this.oblique();return true;
 }
 colorMode(mode){
  this.mode=mode;if(!this.mesh||!this.site?.display)return;
  const tile=this.site.display,stats=displayTerrainStats(tile),colors=[],color=new THREE.Color();
  for(let r=0;r<tile.height;r++)for(let c=0;c<tile.width;c++){
   const z=tile.z[r][c],slope=stats?.slopes[r][c];
   if(mode==='slope'&&this.site.analysisModel!=='reference-sphere')color.set(slopeColor(slope));
   else if(mode==='elevation')color.set(elevationColor(z,stats?.minimumM,stats?.maximumM));
   else color.set('#a5aaa0');colors.push(color.r,color.g,color.b);
  }
  this.mesh.geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));if((mode==='relief')!==(this.mesh.material instanceof THREE.MeshStandardMaterial)){this.mesh.material.dispose();this.mesh.material=mode==='relief'?new THREE.MeshStandardMaterial({side:THREE.DoubleSide,roughness:1}):new THREE.MeshBasicMaterial({side:THREE.DoubleSide});}this.mesh.material.color.set('#ffffff');this.mesh.material.vertexColors=true;this.mesh.material.needsUpdate=true;this.updateLegend(stats);this.render();
 }
 updateLegend(stats){
  const box=document.getElementById('terrainLegend');if(!box)return;box.replaceChildren();
  const add=(color,text)=>{const item=document.createElement('span'),swatch=document.createElement('i');swatch.style.background=color;swatch.setAttribute('aria-hidden','true');item.append(swatch,document.createTextNode(text));box.append(item);};
  if(this.site.analysisModel==='reference-sphere'){box.textContent='REFERENCE SPHERE · no measured terrain';return;}
  if(this.mode==='slope'){for(const b of SLOPE_BANDS)add(b.color,b.label);add(MISSING_COLOR,'No gradient');}
  else if(this.mode==='elevation'&&stats){for(const t of [0,.5,1]){const z=stats.minimumM+t*stats.reliefM;add(elevationColor(z,stats.minimumM,stats.maximumM),`${z.toFixed(0)} m`);}box.append(document.createTextNode('Patch-relative elevation'));}
  else box.textContent='TRUE-SCALE RELIEF · solar-direction shading · no shadow map';
 }
 render(){const w=this.container.clientWidth,h=320;if(!w)return;this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.renderer.render(this.scene,this.camera);for(const {span,position} of this.labelObjects){const p=position.clone().project(this.camera);span.hidden=p.z>1||p.z< -1||Math.abs(p.x)>1||Math.abs(p.y)>1;span.style.left=`${Math.max(8,Math.min(w-100,(p.x+1)*w/2))}px`;span.style.top=`${Math.max(8,Math.min(h-26,(1-p.y)*h/2))}px`;}}
 top(){this.camera.position.set(0,this.scale*2.6,.001);this.controls.target.set(0,0,0);this.controls.update();this.render();}
 oblique(){this.camera.position.set(this.scale*.95,this.scale*1.15,this.scale*1.3);this.controls.target.set(0,0,0);this.controls.update();this.render();}
}
