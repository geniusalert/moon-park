import * as THREE from './vendor/three.module.js';
let grain,albedo;
// Deterministic cosmetic grain changes shading only, never geometry or solver data.
function regolithGrain(){
 if(grain)return grain;
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d'),image=ctx.createImageData(256,256);let seed=19419;
 for(let i=0;i<image.data.length;i+=4){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const v=155+(seed>>>26);image.data[i]=image.data[i+1]=image.data[i+2]=v;image.data[i+3]=255;}
 ctx.putImageData(image,0,0);grain=new THREE.CanvasTexture(canvas);grain.wrapS=grain.wrapT=THREE.RepeatWrapping;return grain;
}
export function landingTerrainMesh(surface,exclude){
 const {tile}=surface,geometry=new THREE.BufferGeometry(),indices=[],uv=[];
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(surface.positions,3));
 for(let i=0;i<surface.positions.length;i+=3)uv.push(surface.positions[i]/32,surface.positions[i+2]/32);
 geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 for(let r=0;r<tile.height-1;r++)for(let c=0;c<tile.width-1;c++){
  const x=(tile.x[c]+tile.x[c+1])/2,y=(tile.y[r]+tile.y[r+1])/2;if(exclude&&x>=exclude.minX&&x<=exclude.maxX&&y>=exclude.minY&&y<=exclude.maxY)continue;
  const a=r*tile.width+c,b=a+1,d=a+tile.width,e=d+1;indices.push(a,d,b,b,d,e);
 }
 geometry.setIndex(indices);geometry.computeVertexNormals();
 const bump=regolithGrain();if(!albedo){albedo=bump.clone();albedo.colorSpace=THREE.SRGBColorSpace;albedo.needsUpdate=true;}const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:'#8d8a83',map:albedo,roughness:1,metalness:0,bumpMap:bump,bumpScale:.035,side:THREE.DoubleSide}));mesh.receiveShadow=true;return mesh;
}
export function releaseSurface(group){group?.traverse(o=>{o.geometry?.dispose();for(const m of [].concat(o.material??[]))m.dispose();});}
