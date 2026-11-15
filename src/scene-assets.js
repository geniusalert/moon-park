import * as THREE from './vendor/three.module.js';
import {GLTFLoader} from './vendor/loaders/GLTFLoader.js';
import {DRACOLoader} from './vendor/loaders/DRACOLoader.js';
const pending=new Map();
export async function loadSceneModel(name){
 if(!pending.has(name)){
  const decoder=new DRACOLoader().setDecoderPath('/src/vendor/libs/draco/gltf/').setWorkerLimit(2);
  const loader=new GLTFLoader().setDRACOLoader(decoder);
  pending.set(name,loader.loadAsync(`/data/models/${name}.glb`).then(g=>g.scene).catch(e=>{pending.delete(name);throw e;}).finally(()=>decoder.dispose()));
 }
 const original=await pending.get(name);return original.clone(true);
}
export async function loadBodyModel(name,diameter){
 const model=await loadSceneModel(name),box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3()),factor=diameter/Math.max(size.x,size.y,size.z);
 model.scale.multiplyScalar(factor);model.position.sub(center.multiplyScalar(factor));
 model.traverse(o=>{if(o.isMesh){o.material=[].concat(o.material).map(m=>new THREE.MeshBasicMaterial({map:m.map??m.emissiveMap,color:m.map||m.emissiveMap?'#ffffff':name==='sun'?'#edcc8b':'#b8c5b0',transparent:true,depthTest:false}));if(o.material.length===1)o.material=o.material[0];o.renderOrder=6;}});
 const group=new THREE.Group();group.add(model);group.userData.model=name;return group;
}
export function bodyOpacity(body,opacity){body.traverse(o=>{if(o.isMesh)for(const m of [].concat(o.material))m.opacity=opacity;});}
