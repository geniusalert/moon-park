import {MOON_RADIUS_M,terrainToScene,lonLatToPolar,sampleDisplayHeight,azElToScene} from './spatial-math.js';
export function prepareLandingSurface(site,tile=site?.landingDisplay??site?.display){
 if(!tile||!site||!Number.isFinite(site.groundM))return null;
 const sphere=site.analysisModel==='reference-sphere';
 const local=tile.frame==='local-reference-sphere';
 const rad=Math.PI/180,l=site.longitude*rad,p=site.latitude*rad;
 const up=[Math.cos(p)*Math.cos(l),Math.cos(p)*Math.sin(l),Math.sin(p)],north=[-Math.sin(p)*Math.cos(l),-Math.sin(p)*Math.sin(l),Math.cos(p)],east=[-Math.sin(l),Math.cos(l),0];
 function rawHeight(x,z){
  if(local)return sampleDisplayHeight(tile,x,-z);
  let radius=MOON_RADIUS_M+site.groundM,lon,lat,height;
  for(let n=0;n<2;n++){
   const vertical=Math.sqrt(Math.max(0,radius*radius-x*x-z*z));const v=up.map((a,i)=>a*vertical+east[i]*x-north[i]*z);
   lon=Math.atan2(v[1],v[0])/rad;lat=Math.atan2(v[2],Math.hypot(v[0],v[1]))/rad;
   const [px,py]=lonLatToPolar(lon,lat);height=sampleDisplayHeight(tile,px,py);if(height==null)return null;radius=MOON_RADIUS_M+height;
  }
  const [px,py]=lonLatToPolar(lon,lat);return terrainToScene(px,py,height,site)[1]*1000;
 }
 const offset=rawHeight(0,0);if(!Number.isFinite(offset))return null;
 const positions=[];for(let r=0;r<tile.height;r++)for(let c=0;c<tile.width;c++){
  const h=tile.z[r][c];if(!Number.isFinite(h))return null;
  const v=local?[tile.x[c],h,-tile.y[r]]:terrainToScene(tile.x[c],tile.y[r],h,site).map(v=>v*1000);
  positions.push(v[0],v[1]-offset,v[2]);
 }
 return {tile,positions,offset,sphere,heightAt(x,z){const v=rawHeight(x,z);return v==null?null:v-offset;}};
}
export function sampledSkyState(sample,height){
 if(!sample)return null;
 if(![sample.az,sample.sunEl,sample.earthAz,sample.earthEl,height].every(Number.isFinite))throw new Error('Incomplete observer sky sample');
 return {utc:sample.utc,observerHeightM:height,
  sun:{direction:azElToScene(sample.az,sample.sunEl),az:sample.az,elevation:sample.sunEl,visible:sample.sun,clearance:sample.sunCenterClearanceDeg},
  earth:{direction:azElToScene(sample.earthAz,sample.earthEl),az:sample.earthAz,elevation:sample.earthEl,visible:sample.earth,clearance:sample.earthCenterClearanceDeg}};
}
