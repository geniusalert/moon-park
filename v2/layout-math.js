export function sceneFrame(width,height,{left=0,right=0,bottom=0,top=54,gap=14}={}){
 const x=Math.min(left+gap,width*.45),y=top+gap;
 return {x,y,width:Math.max(120,width-x-Math.min(right+gap,width*.45)),height:Math.max(120,height-y-bottom-gap)};
}
export function projectedOffset(width,height,frame){return {x:width/2-(frame.x+frame.width/2),y:height/2-(frame.y+frame.height/2)};}
export function sampleAtPosition(fraction,samples){if(!samples.length)return -1;return Math.max(0,Math.min(samples.length-1,Math.floor(Math.max(0,Math.min(1,fraction))*samples.length)));}
export function clampDockHeight(value,viewportHeight){const high=Math.max(150,Math.floor(viewportHeight*.58)),low=Math.min(210,high);return Math.round(Math.max(low,Math.min(high,value)));}
export function markerRadius(distance,fov,height,pixels){return Math.max(.0001,2*distance*Math.tan(fov*Math.PI/360)/Math.max(1,height)*pixels);}
export function globeFitDistance(fullHeight,freeWidth,freeHeight,fov=40){const diameter=Math.max(1,Math.min(freeWidth,freeHeight)*.84),ratio=fullHeight/(diameter*Math.tan(fov*Math.PI/360));return Math.sqrt(1+ratio*ratio);}
export function reframedDistance(distance,previous,next){const scale=next.fullHeight/previous.fullHeight*Math.min(previous.width,previous.height)/Math.max(1,Math.min(next.width,next.height));return Math.max(1.75,Math.min(30,distance*scale));}
export function globeOccludes(camera,point,radius=1){const d=point.map((v,i)=>v-camera[i]),den=d.reduce((sum,v)=>sum+v*v,0);if(!den)return false;const t=-camera.reduce((sum,v,i)=>sum+v*d[i],0)/den;if(t<=0||t>=1)return false;return camera.reduce((sum,v,i)=>sum+(v+t*d[i])**2,0)<radius*radius;}
