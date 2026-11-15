import * as THREE from 'three';
import {OrbitControls} from './vendor/OrbitControls.js';
import {azElToScene,terrainToScene,sampleDisplayHeight,pointInRings,MOON_RADIUS_M} from './spatial-math.js';
import {traceHorizon} from './horizon-trace.js';

const $=id=>document.getElementById(id),svgNS='http://www.w3.org/2000/svg';
const el=(tag,attrs={},text)=>{const e=document.createElementNS(svgNS,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);if(text!==undefined)e.textContent=text;return e;};

export class SpatialNavigator{
 constructor(dataset,spatial,onSelect,onRegionSelect=()=>{}){
  this.onRegionSelect=onRegionSelect;this.extraPoints=[];this.dataset=dataset;this.data=spatial;this.onSelect=onSelect;this.active=null;this.roi=null;this.exaggeration=1;
  $('navigator').hidden=false;
  $('roiSelect').innerHTML='<option value="">Choose a published outline…</option>'+spatial.regions.map(r=>`<option value="${r.id}">${r.label}</option>`).join('');
  $('roiSelect').onchange=()=>this.selectRegion($('roiSelect').value);
  $('mapOverview').onclick=()=>this.fitMap([-47000,-23000,10000,26000]);
  $('mapPoint').onclick=()=>this.fitMap(this.data.tiles.find(t=>t.siteId===(this.active.sourceSiteId??this.active.id)).bounds);
  $('mapRegions').onclick=()=>{const rings=this.data.regions.filter(r=>r.siteId===(this.active.sourceSiteId??this.active.id)).flatMap(r=>r.ringsXY.flat());this.fitPoints(rings,600);};
  $('mapZoomIn').onclick=()=>this.zoomMap(.65);$('mapZoomOut').onclick=()=>this.zoomMap(1.5);
  $('modelForROI').onclick=()=>{const r=this.data.regions.find(r=>r.id===this.roi);if(r)this.onSelect(r.siteId);};
  $('mapSvg').addEventListener('wheel',e=>{e.preventDefault();this.zoomMap(e.deltaY>0?1.2:.84);},{passive:false});
  let drag;
  $('mapSvg').addEventListener('pointerdown',e=>{if(e.target.closest('[data-map-point],[data-map-roi],[data-trace-witness]'))return;drag={x:e.clientX,y:e.clientY,view:[...this.mapView]};$('mapSvg').setPointerCapture(e.pointerId);});
  $('mapSvg').addEventListener('pointermove',e=>{if(!drag)return;const r=$('mapSvg').getBoundingClientRect();this.mapView=[drag.view[0]-(e.clientX-drag.x)/r.width*drag.view[2],drag.view[1]+(e.clientY-drag.y)/r.height*drag.view[3],drag.view[2],drag.view[3]];this.drawMap();});
  $('mapSvg').addEventListener('pointerup',()=>drag=null);$('mapSvg').addEventListener('pointercancel',()=>drag=null);
  for(const [id,mode] of [['viewTerrain','terrain'],['viewSky','sky'],['viewImage','image']])$(id).onclick=()=>this.mode(mode);
  $('cameraOblique').onclick=()=>this.cameraPreset(false);$('cameraTop').onclick=()=>this.cameraPreset(true);
  $('rotateLeft').onclick=()=>this.rotate(-.3);$('rotateRight').onclick=()=>this.rotate(.3);
  $('relief').onchange=()=>{this.exaggeration=Number($('relief').value);if(this.terrainGroup)this.terrainGroup.scale.y=this.exaggeration;this.render();this.updateCaption();};
  this.traceTarget=null;this.trace=null;this.traceFocus=0;
  $('traceSun').onclick=()=>this.selectTrace('sun');$('traceEarth').onclick=()=>this.selectTrace('earth');
  $('traceFit').onclick=()=>this.fitTrace();$('traceClear').onclick=()=>this.clearTrace();
  this.images=new Map(spatial.tiles.map(t=>[t.siteId,this.raster(t)]));
  new ResizeObserver(()=>{if(!this.mapView)return;const box=$('mapSvg').getBoundingClientRect();if(box.width<1||box.height<1)return;const [x,y,w,h]=this.mapView,nh=w*box.height/box.width;this.mapView=[x,y+(h-nh)/2,w,nh];this.drawMap();}).observe($('mapSvg'));
  this.initScene();this.mode('terrain');
 }
 raster(tile){
  const canvas=document.createElement('canvas');canvas.width=tile.width;canvas.height=tile.height;
  const ctx=canvas.getContext('2d'),image=ctx.createImageData(tile.width,tile.height),finite=tile.z.flat().filter(Number.isFinite),lo=Math.min(...finite),hi=Math.max(...finite);
  for(let r=0;r<tile.height;r++)for(let c=0;c<tile.width;c++){
   const z=tile.z[r][c],i=(r*tile.width+c)*4;if(z===null)continue;
   const a=tile.z[Math.max(0,r-1)][c]??z,b=tile.z[r][Math.max(0,c-1)]??z;
   const shade=Math.max(.45,Math.min(1.2,.8+(a-z+b-z)/800)),v=(70+110*(z-lo)/(hi-lo||1))*shade;
   image.data[i]=v*.88;image.data[i+1]=v;image.data[i+2]=v*.93;image.data[i+3]=255;
  }
  ctx.putImageData(image,0,0);return canvas.toDataURL('image/png');
 }
 fitPoints(points,padding=1500){this.fitMap([Math.min(...points.map(p=>p[0]))-padding,Math.min(...points.map(p=>p[1]))-padding,Math.max(...points.map(p=>p[0]))+padding,Math.max(...points.map(p=>p[1]))+padding]);}
 fitMap(bounds){
  const box=$('mapSvg').getBoundingClientRect(),aspect=box.width/(box.height||300),cx=(bounds[0]+bounds[2])/2,cy=(bounds[1]+bounds[3])/2;
  let w=(bounds[2]-bounds[0])*1.12,h=(bounds[3]-bounds[1])*1.12;
  if(w/h<aspect)w=h*aspect;else h=w/aspect;
  this.mapView=[cx-w/2,cy-h/2,w,h];this.drawMap();
 }
 zoomMap(factor){if(!this.mapView)return;const [x,y,w,h]=this.mapView,nw=Math.max(400,Math.min(500000,w*factor)),nh=nw*h/w;this.mapView=[x+w/2-nw/2,y+h/2-nh/2,nw,nh];this.drawMap();}
 drawMap(){
  if(!this.mapView)return;
  const svg=$('mapSvg'),[x,y,w,h]=this.mapView,unit=w/Math.max(1,svg.getBoundingClientRect().width);
  svg.setAttribute('viewBox',`${x} ${-y-h} ${w} ${h}`);svg.replaceChildren();
  svg.append(el('rect',{x,y:-y-h,width:w,height:h,fill:'#111a17'}));
  for(const tile of this.data.tiles){const b=tile.bounds;svg.append(el('image',{href:this.images.get(tile.siteId),x:b[0],y:-b[3],width:b[2]-b[0],height:b[3]-b[1],opacity:.85}));}
  for(const lat of [-89.5,-89,-88.5]){const radius=2*MOON_RADIUS_M*Math.tan((90+lat)*Math.PI/360);svg.append(el('circle',{cx:0,cy:0,r:radius,fill:'none',stroke:'#a6b9aa','stroke-opacity':.25,'stroke-width':unit*.7}));}
  svg.append(el('circle',{cx:0,cy:0,r:unit*3,fill:'#c7cec4'}));svg.append(el('text',{x:unit*8,y:-unit*7,fill:'#c7cec4','font-size':unit*10},'South pole'));
  for(const r of this.data.regions){
   const d=r.ringsXY.map(ring=>ring.map(([x,y],i)=>`${i?'L':'M'}${x},${-y}`).join(' ')+'Z').join(' ');
   const selected=r.id===this.roi;
   const p=el('path',{d,fill:selected?'#f0c584':'#ddbe76','fill-opacity':selected?.6:.24,stroke:selected?'#ffe1a0':'#dfbc78','stroke-width':unit*(selected?2:1),'fill-rule':'evenodd','data-map-roi':r.id,tabindex:0,role:'button','aria-label':r.label});
   p.addEventListener('click',()=>this.selectRegion(r.id));p.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();this.selectRegion(r.id);}});svg.append(p);
  }
  for(const site of this.dataset.sites){
   const group=el('g',{'data-map-point':site.id,tabindex:0,role:'button','aria-label':`Select modeled point ${site.name}`});
   group.append(el('circle',{cx:site.xy[0],cy:-site.xy[1],r:unit*(site.id===this.active?.id?7:5),fill:site.id===this.active?.id?'#d4ecad':'#15241b',stroke:'#d4ecad','stroke-width':unit*2}));
   group.append(el('text',{x:site.xy[0]+unit*11,y:-site.xy[1]-unit*10,fill:'#e3eadb','font-size':unit*10},site.id));
   group.addEventListener('click',()=>this.onSelect(site.id));group.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();this.onSelect(site.id);}});svg.append(group);
  }
  for(const point of this.extraPoints){
   const circle=el('circle',{cx:point.xy[0],cy:-point.xy[1],r:unit*(this.active?.id===point.id?6:4),fill:'#84d1dc',stroke:'#102629','stroke-width':unit,tabindex:0,role:'button','aria-label':`Inspect calculated sample ${point.key}`});
   circle.addEventListener('click',()=>this.onCandidateSelect?.(point.id));circle.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();this.onCandidateSelect?.(point.id);}});svg.append(circle);
  }
  if(this.trace){
   const origin=this.trace.observerXY;
   this.trace.witnesses.forEach((w,i)=>{
    const selected=i===this.traceFocus,color=selected?'#f2b892':'#a6c6df';
    svg.append(el('path',{d:w.pathXY.map(([x,y],j)=>`${j?'L':'M'}${x},${-y}`).join(' '),fill:'none',stroke:color,'stroke-width':unit*(selected?2:1),'stroke-dasharray':`${unit*5} ${unit*4}`,'pointer-events':'none'}));
    const g=el('g',{'data-trace-witness':i,tabindex:0,role:'button','aria-label':`Inspect terrain witness ${w.label}, ${(w.distanceM/1000).toFixed(2)} km`});
    g.append(el('circle',{cx:w.xy[0],cy:-w.xy[1],r:unit*(selected?7:5),fill:color,stroke:'#10201b','stroke-width':unit*1.5}));
    g.append(el('text',{x:w.xy[0]+unit*10,y:-w.xy[1]+unit*(i?18:-10),fill:color,'font-size':unit*12},w.label));
    g.addEventListener('click',()=>this.focusTrace(i,'map'));g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();this.focusTrace(i,'map');}});svg.append(g);
   });
   svg.append(el('circle',{cx:origin[0],cy:-origin[1],r:unit*9,fill:'none',stroke:'#f5e4bc','stroke-width':unit,'pointer-events':'none'}));
   svg.append(el('text',{x:origin[0]+unit*12,y:-origin[1]-unit*12,fill:'#f5e4bc','font-size':unit*11,'pointer-events':'none'},'Observer'));
  }
  const km=w/1000;$('mapScale').textContent=`Map width ${km.toFixed(km<5?1:0)} km · south polar stereographic X/Y`;
 }
 selectRegion(id){
  const loading=this.onRegionSelect(id);this.roi=id||null;const r=this.data.regions.find(r=>r.id===id);$('roiSelect').value=id||'';$('modelForROI').disabled=!r;
  if(r){
   $('roiInfo').textContent=`${r.label}. Published illumination-study outline; ${this.calculatedRegions?.has(id)?this.calculatedRegions.get(id)+' cached interior sample(s), shown below':'no cached interior calculation'}. No continuous whole-region calculation. ${r.attributePointStatus==='outside'?'Its published point attribute falls outside this outline.':r.attributePointStatus==='missing'?'Its point attribute is missing.':''}`;
   this.fitPoints(r.ringsXY.flat(),Math.max(150,(r.boundsXY[2]-r.boundsXY[0])*.5));
  }else{$('roiInfo').textContent='Gold outlines are published illumination study regions. Green markers are the points with cached mission results.';this.drawMap();}
  return loading;
 }
 initScene(){
  try{
   this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.setClearColor(0x0b1211);this.renderer.outputColorSpace=THREE.SRGBColorSpace;
   this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(43,1,.01,250);
   $('terrainScene').append(this.renderer.domElement);this.renderer.domElement.setAttribute('role','img');this.renderer.domElement.setAttribute('aria-label','Lunar terrain in local east, north and up coordinates');
   this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.enableDamping=false;this.controls.minDistance=2;this.controls.maxDistance=45;this.controls.maxPolarAngle=Math.PI*.49;this.controls.addEventListener('change',()=>this.render());
   this.scene.add(new THREE.AmbientLight(0xb9cebf,.8));const light=new THREE.DirectionalLight(0xf1eee2,2.2);light.position.set(5,9,7);this.scene.add(light);
   this.terrainGroup=new THREE.Group();this.scene.add(this.terrainGroup);
   this.marker=new THREE.Mesh(new THREE.SphereGeometry(.065,16,12),new THREE.MeshBasicMaterial({color:0xcce5a9,depthTest:false}));this.marker.renderOrder=5;this.scene.add(this.marker);
   this.bodies={};
   for(const [name,color] of [['Sun',0xf1c47a],['Earth',0x8bbddd]]){
    const material=new THREE.LineDashedMaterial({color,transparent:true,opacity:.9,dashSize:.17,gapSize:.08,depthTest:false});
    const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3(1,0,0)]),material);line.renderOrder=4;this.scene.add(line);
    const sphere=new THREE.Mesh(new THREE.SphereGeometry(name==='Sun'?.18:.14,20,12),new THREE.MeshBasicMaterial({color,depthTest:false}));sphere.renderOrder=5;this.scene.add(sphere);
    const label=document.createElement('span');label.className=`body-label ${name.toLowerCase()}`;$('terrainScene').append(label);this.bodies[name]={line,sphere,label};
   }
   new ResizeObserver(()=>this.resize()).observe($('terrainScene'));
   this.cameraPreset(false);
  }catch(error){this.renderer=null;$('terrainScene').textContent='3D graphics are unavailable on this device. The map and computed horizon sky remain available.';$('viewTerrain').disabled=true;this.mode('sky');}
 }
 mode(name){
  if(name==='terrain'&&!this.renderer)name='sky';if(name==='image'&&!this.imageryView)name='sky';this.view=name;
  $('terrainScene').hidden=name!=='terrain';$('horizonSky').toggleAttribute('hidden',name!=='sky');
  $('viewTerrain').setAttribute('aria-pressed',String(name==='terrain'));$('viewSky').setAttribute('aria-pressed',String(name==='sky'));
  $('historicImage').hidden=name!=='image';$('imageMetadata').hidden=name!=='image';$('viewImage').setAttribute('aria-pressed',String(name==='image'));this.imageryView?.update(this.active,name==='image');
  $('terrainControls').hidden=name!=='terrain';this.resize();this.updateCaption();
 }
 resize(){if(!this.renderer||!this.camera)return;const r=$('terrainScene').getBoundingClientRect();if(r.width<1||r.height<1)return;this.renderer.setSize(r.width,r.height);this.camera.aspect=r.width/r.height;this.camera.updateProjectionMatrix();this.render();}
 cameraPreset(top){if(!this.camera)return;this.camera.position.set(...(top?[0,23,.001]:[11,8,12]));this.controls.target.set(0,0,0);this.camera.lookAt(0,0,0);this.controls.update();this.render();}
 rotate(delta){if(!this.camera)return;const s=new THREE.Spherical().setFromVector3(this.camera.position.clone().sub(this.controls.target));s.theta+=delta;this.camera.position.setFromSpherical(s).add(this.controls.target);this.controls.update();this.render();}
 setSite(site){
  if(this.active?.id===site.id)return;this.active=site;this.tile=this.data.tiles.find(t=>t.siteId===(site.sourceSiteId??site.id));
  this.clearTrace();
  $('navSiteName').textContent=site.name;
  const inside=this.data.regions.filter(r=>r.siteId===(site.sourceSiteId??site.id)&&pointInRings(...site.xy,r.ringsXY));
  $('pointContext').textContent=`${site.regionId?'Calculated interior sample · nominal terrain only · ':''}${site.latitude.toFixed(5)}°, ${site.longitude.toFixed(5)}° E · ${inside.length?'Within a published study outline':'Outside the published study outlines'} · modeled research point, not an approved landing site.`;
  if(!this.mapView)this.fitMap([-47000,-23000,10000,26000]);else this.drawMap();
  if(this.renderer){
   for(const child of [...this.terrainGroup.children]){child.geometry?.dispose();if(Array.isArray(child.material))child.material.forEach(m=>m.dispose());else child.material?.dispose();this.terrainGroup.remove(child);}
   const t=this.tile,positions=[],indices=[],colors=[];
   for(let r=0;r<t.height;r++)for(let c=0;c<t.width;c++){
    const z=t.z[r][c];positions.push(...terrainToScene(t.x[c],t.y[r],z??site.groundM,site));
    const v=Math.max(.32,Math.min(.65,.48+((z??site.groundM)-site.groundM)/9000));colors.push(v*.95,v,v*.97);
    if(r<t.height-1&&c<t.width-1&&[z,t.z[r][c+1],t.z[r+1][c],t.z[r+1][c+1]].every(v=>v!==null)){
     const a=r*t.width+c;indices.push(a,a+t.width,a+1,a+1,a+t.width,a+t.width+1);
    }
   }
   const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();
   this.terrainGroup.add(new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,metalness:0,side:THREE.DoubleSide})));
   for(const roi of this.data.regions.filter(r=>r.siteId===(site.sourceSiteId??site.id)))for(const ring of roi.ringsXY){
    const vertices=ring.map(([x,y])=>{const z=sampleDisplayHeight(t,x,y);return z===null?null:new THREE.Vector3(...terrainToScene(x,y,z,site)).add(new THREE.Vector3(0,.015,0));}).filter(Boolean);
    if(vertices.length>2)this.terrainGroup.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(vertices),new THREE.LineBasicMaterial({color:0xeac17e})));
   }
   this.terrainGroup.scale.y=this.exaggeration;this.cameraPreset(false);
  }
  this.updateCaption();
 }
 update(site,sample,height,profile){this.setSite(site);this.sample=sample;this.height=height;this.profile=profile;this.imageryView?.update(site,this.view==='image');if(this.traceTarget)this.updateTrace();this.drawSky();this.updateCaption();
  if(this.renderer){
   const origin=new THREE.Vector3(0,height/1000,0);this.marker.position.copy(origin);
   for(const [name,az,elevation,clear] of [['Sun',sample.az,sample.sunEl,sample.sun],['Earth',sample.earthAz,sample.earthEl,sample.earth]]){
    const b=this.bodies[name],end=new THREE.Vector3(...azElToScene(az,elevation)).multiplyScalar(6).add(origin);
    b.line.geometry.setFromPoints([origin,end]);b.line.computeLineDistances();b.line.material.opacity=clear?.9:.4;
    b.sphere.position.copy(end);b.label.textContent=name==='Sun'?`Sun · ${Math.round(sample.sunFraction*100)}% disc`:`Earth · ${clear?'center clear':'obscured'}`;
   }
   this.render();
  }
 }
 selectTrace(object){this.traceTarget=object;this.traceFocus=0;this.updateTrace();this.fitTrace();this.drawSky();}
 clearTrace(){
  this.traceTarget=null;this.trace=null;this.traceFocus=0;
  $('traceSun').setAttribute('aria-pressed','false');$('traceEarth').setAttribute('aria-pressed','false');$('traceFit').disabled=true;$('traceClear').disabled=true;$('traceEvidence').hidden=true;
  $('traceSummary').textContent='Choose Sun or Earth to map the sampled terrain rays supporting its horizon. The visibility calculation interpolates between those rays.';
  $('traceMapNote').hidden=true;this.drawMap();if(this.profile&&this.sample)this.drawSky();
 }
 updateTrace(){
  try{
   this.trace=traceHorizon(this.active,this.sample,this.height,this.profile,this.traceTarget);this.traceFocus=Math.min(this.traceFocus,this.trace.witnesses.length-1);
   const t=this.trace,name=t.object==='sun'?'Sun':'Earth';
   $('traceSummary').textContent=`${name}: elevation ${t.objectElevationDeg.toFixed(3)}°, interpolated horizon ${t.interpolatedHorizonDeg.toFixed(3)}°, center clearance ${t.centerClearanceDeg.toFixed(3)}°. ${t.object==='sun'?`${(t.solarDiscFraction*100).toFixed(1)}% of the solar disc is visible.`:t.modelAvailable?'Earth center clears the modeled horizon.':'Earth center is obscured by the modeled horizon.'}`;
   $('traceEvidence').hidden=false;$('traceEvidence').innerHTML=`<table><thead><tr><th>Sample ray</th><th>Horizon / weight</th><th>Terrain distance / source</th><th>Sample location</th></tr></thead><tbody>${t.witnesses.map((w,i)=>`<tr class="${i===this.traceFocus?'trace-selected':''}"><td><button data-trace-row="${i}">Inspect ${w.label}</button><br>${w.rayAzimuthDeg.toFixed(2)}° azimuth</td><td>${w.horizonElevationDeg.toFixed(3)}°<br>${(w.interpolationWeight*100).toFixed(1)}%</td><td>${(w.distanceM/1000).toFixed(3)} km<br>${w.source==='local-5m'?'Native local · 5 m':w.source==='regional-240m'?'Regional · 240 m':'Source unspecified'}</td><td>${w.latitude.toFixed(5)}°, ${w.longitude.toFixed(5)}° E</td></tr>`).join('')}</tbody></table>`;
   document.querySelectorAll('[data-trace-row]').forEach(b=>b.onclick=()=>this.focusTrace(Number(b.dataset.traceRow)));
   $('traceMapNote').hidden=false;$('traceMapNote').textContent='A/B mark separate sampled-ray terrain locations. Dashed paths follow great circles. Imagery is shown only inside the local display tiles; blank map areas are not missing horizon data.';
  }catch(e){this.trace=null;$('traceEvidence').hidden=true;$('traceMapNote').hidden=true;$('traceSummary').textContent='Terrain trace unavailable: '+e.message;}
  $('traceSun').setAttribute('aria-pressed',String(this.traceTarget==='sun'));$('traceEarth').setAttribute('aria-pressed',String(this.traceTarget==='earth'));$('traceFit').disabled=!this.trace;$('traceClear').disabled=!this.traceTarget;this.drawMap();
 }
 focusTrace(index,source='row'){this.traceFocus=index;this.updateTrace();this.drawSky();document.querySelector(source==='map'?`[data-trace-witness="${index}"]`:`[data-trace-row="${index}"]`)?.focus({preventScroll:true});}
 fitTrace(){if(this.trace)this.fitPoints([this.trace.observerXY,...this.trace.witnesses.map(w=>w.xy)],Math.max(500,Math.max(...this.trace.witnesses.map(w=>w.distanceM))*.07));}
 updateCaption(){if(!this.active)return;
  const epoch=this.sample?.utc.replace('T',' ').replace('Z',' UTC')??'Select a mission time';
  $('spatialReadout').textContent=`${epoch} · ${this.height??2} m observer · ${this.exaggeration}× displayed vertical relief`;
  if(this.view==='image'){$('sceneCaption').textContent='Historical imagery is context only. Its shadows and exposure do not change with mission replay. Registration to the mission terrain has not been measured; this is not an image draped on the 3D model.';return;}
  $('sceneCaption').textContent=`Display mesh approximately ${this.tile.displayPixelM.toFixed(0)} m per sample. Terrain shading shows shape, not simulated mission shadows. Symbols and ray lengths are schematic. ${this.exaggeration!==1?'Relief is exaggerated; arrows retain true angles. ':''}Visibility comes from the original 180 km horizon model.`;
 }
 drawSky(){if(!this.profile||!this.sample)return;const svg=$('horizonSky'),s=this.sample;
  const lo=Math.floor(Math.min(-4,s.sunEl-2,s.earthEl-2,...this.profile.map(p=>p.el))),hi=Math.ceil(Math.max(8,s.sunEl+2,s.earthEl+2,...this.profile.map(p=>p.el)));
  const x=a=>45+a/360*800,y=e=>265-(e-lo)/(hi-lo)*230;
  svg.setAttribute('viewBox','0 0 890 320');svg.replaceChildren();
  svg.append(el('rect',{width:890,height:320,fill:'#101b1c'}));
  for(let i=0;i<=4;i++){const e=lo+(hi-lo)*i/4;svg.append(el('line',{x1:45,x2:845,y1:y(e),y2:y(e),stroke:'#344842'}));svg.append(el('text',{x:5,y:y(e)+4,fill:'#a9b8aa','font-size':12},e.toFixed(1)+'°'));}
  for(const [a,name] of [[0,'N'],[90,'E'],[180,'S'],[270,'W'],[360,'N']]){svg.append(el('line',{x1:x(a),x2:x(a),y1:30,y2:265,stroke:'#344842'}));svg.append(el('text',{x:x(a)-5,y:292,fill:'#b7c6b5','font-size':13},name));}
  const points=[...this.profile,{az:360,el:this.profile[0].el}],d=points.map((p,i)=>`${i?'L':'M'}${x(p.az)},${y(p.el)}`).join(' ');
  svg.append(el('path',{d:d+`L845,265L45,265Z`,fill:'#34443a'}));svg.append(el('path',{d,fill:'none',stroke:'#c9dda9','stroke-width':2}));
  for(const [name,az,elevation,color,label] of [['Sun',s.az,s.sunEl,'#efc17e',`${Math.round(s.sunFraction*100)}% disc`],['Earth',s.earthAz,s.earthEl,'#8ebbd8',s.earth?'center clear':'obscured']]){
   svg.append(el('circle',{cx:x(az),cy:y(elevation),r:name==='Sun'?6:8,fill:color,stroke:'#0c1515','stroke-width':2}));
   const tx=Math.min(730,Math.max(55,x(az)+12));svg.append(el('text',{x:tx,y:y(elevation)-11,fill:color,'font-size':13},`${name} · ${label}`));
  }
  if(this.trace)for(const [i,w] of this.trace.witnesses.entries()){
   const color=i===this.traceFocus?'#f2b892':'#a6c6df';svg.append(el('line',{x1:x(w.rayAzimuthDeg),x2:x(w.rayAzimuthDeg),y1:y(w.horizonElevationDeg),y2:265,stroke:color,'stroke-dasharray':'3 3'}));svg.append(el('rect',{x:x(w.rayAzimuthDeg)-4,y:y(w.horizonElevationDeg)-4,width:8,height:8,fill:color}));svg.append(el('text',{x:x(w.rayAzimuthDeg)+8,y:y(w.horizonElevationDeg)+(i?20:-12),fill:color,'font-size':13},w.label));
  }
  svg.append(el('text',{x:45,y:315,fill:'#a9b8aa','font-size':11},'Physical angular horizon · symbols enlarged · A/B: sampled-ray witnesses when trace is active'));
 }
 render(){if(!this.renderer||!this.scene||!this.camera)return;this.renderer.render(this.scene,this.camera);
  if(this.bodies)for(const b of Object.values(this.bodies)){const v=b.sphere.position.clone().project(this.camera),r=$('terrainScene').getBoundingClientRect();b.label.style.left=`${(v.x+1)*r.width/2}px`;b.label.style.top=`${(1-v.y)*r.height/2}px`;b.label.hidden=Math.abs(v.x)>1||Math.abs(v.y)>1||v.z>1;}
 }
}
