export const MOON_RADIUS_M=1737400;
const rad=d=>d*Math.PI/180,deg=r=>r*180/Math.PI;
export function polarToLonLat(x,y){
 if(!Number.isFinite(x)||!Number.isFinite(y))throw new Error('Invalid polar coordinate');
 return {longitude:deg(Math.atan2(x,y)),latitude:deg(-Math.PI/2+2*Math.atan(Math.hypot(x,y)/(2*MOON_RADIUS_M)))};
}
export function lonLatToPolar(longitude,latitude){
 if(!Number.isFinite(longitude)||!Number.isFinite(latitude)||latitude>0||latitude< -90)throw new Error('Invalid south-polar coordinate');
 const rho=2*MOON_RADIUS_M*Math.tan((Math.PI/2+rad(latitude))/2);
 return [rho*Math.sin(rad(longitude)),rho*Math.cos(rad(longitude))];
}
export function azElToScene(azimuth,elevation){
 const a=rad(azimuth),e=rad(elevation);
 return [Math.cos(e)*Math.sin(a),Math.sin(e),-Math.cos(e)*Math.cos(a)];
}
export function terrainToScene(x,y,elevation,site,exaggeration=1){
 const {longitude,latitude}=polarToLonLat(x,y),l=rad(longitude),p=rad(latitude),r=MOON_RADIUS_M+elevation;
 const sl=rad(site.longitude),sp=rad(site.latitude),observerR=MOON_RADIUS_M+site.groundM;
 const up=[Math.cos(sp)*Math.cos(sl),Math.cos(sp)*Math.sin(sl),Math.sin(sp)];
 const north=[-Math.sin(sp)*Math.cos(sl),-Math.sin(sp)*Math.sin(sl),Math.cos(sp)];
 const east=[-Math.sin(sl),Math.cos(sl),0];
 const delta=[r*Math.cos(p)*Math.cos(l)-observerR*up[0],r*Math.cos(p)*Math.sin(l)-observerR*up[1],r*Math.sin(p)-observerR*up[2]];
 const dot=v=>delta.reduce((sum,n,i)=>sum+n*v[i],0)/1000;
 return [dot(east),dot(up)*exaggeration,-dot(north)];
}
export function pointInRings(x,y,rings){
 let inside=false;
 for(const ring of rings)for(let i=0,j=ring.length-1;i<ring.length;j=i++){
  const [xi,yi]=ring[i],[xj,yj]=ring[j];
  const cross=(x-xi)*(yj-yi)-(y-yi)*(xj-xi);
  if(Math.abs(cross)<1e-6&&x>=Math.min(xi,xj)-1e-8&&x<=Math.max(xi,xj)+1e-8&&y>=Math.min(yi,yj)-1e-8&&y<=Math.max(yi,yj)+1e-8)return true;
  if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)inside=!inside;
 }
 return inside;
}
export function sampleDisplayHeight(tile,x,y){
 const col=(x-tile.x[0])/(tile.x[1]-tile.x[0]),row=(y-tile.y[0])/(tile.y[1]-tile.y[0]);
 if(col<0||row<0||col>tile.width-1||row>tile.height-1)return null;
 const c=Math.min(tile.width-2,Math.floor(col)),r=Math.min(tile.height-2,Math.floor(row)),u=col-c,v=row-r;
 const a=tile.z[r][c],b=tile.z[r][c+1],d=tile.z[r+1][c],e=tile.z[r+1][c+1];
 if([a,b,d,e].some(n=>n===null||!Number.isFinite(n)))return null;
 return (1-v)*((1-u)*a+u*b)+v*((1-u)*d+u*e);
}
