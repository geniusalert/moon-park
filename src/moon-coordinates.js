const rad=d=>d*Math.PI/180;
export function lunarXYZ(longitude,latitude,radius=1){
 if(![longitude,latitude,radius].every(Number.isFinite)||latitude< -90||latitude>90||radius<=0)throw new Error('Invalid lunar coordinate');
 const l=rad(longitude),p=rad(latitude);return [radius*Math.cos(p)*Math.cos(l),radius*Math.sin(p),-radius*Math.cos(p)*Math.sin(l)];
}
export function xyzToLunar([x,y,z]){const r=Math.hypot(x,y,z);if(!r||![x,y,z].every(Number.isFinite))throw new Error('Invalid globe point');return {latitude:Math.asin(Math.max(-1,Math.min(1,y/r)))*180/Math.PI,longitude:Math.atan2(-z,x)*180/Math.PI};}
export function supportedPolarPoint(p){return Number.isFinite(p.latitude)&&Number.isFinite(p.longitude)&&p.latitude>=-90&&p.latitude<=-85;}
export function localDirection(longitude,latitude,azimuth,elevation){
 const l=rad(longitude),p=rad(latitude),a=rad(azimuth),e=rad(elevation);
 const up=lunarXYZ(longitude,latitude),north=[-Math.sin(p)*Math.cos(l),Math.cos(p),Math.sin(p)*Math.sin(l)],east=[-Math.sin(l),0,-Math.cos(l)];
 return up.map((v,i)=>v*Math.sin(e)+(north[i]*Math.cos(a)+east[i]*Math.sin(a))*Math.cos(e));
}
