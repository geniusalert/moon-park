import {sceneFrame,projectedOffset} from './layout-math.js';
export function frame(){
 const visible=e=>e&&!e.hidden&&getComputedStyle(e).display!=='none';
 const left=document.getElementById('v2Left'),right=document.getElementById('v2Right'),dock=document.getElementById('v2Bottom'),playback=document.getElementById('v2Playback');
 const mobile=innerWidth<1100;
 const reserveBottom=Math.max(visible(dock)?innerHeight-dock.getBoundingClientRect().top:0,visible(playback)?innerHeight-playback.getBoundingClientRect().top:36);
 return sceneFrame(innerWidth,innerHeight,{left:!mobile&&document.body.classList.contains('left-open')&&visible(left)?left.getBoundingClientRect().right:0,right:!mobile&&document.body.classList.contains('right-open')&&visible(right)?innerWidth-right.getBoundingClientRect().left:0,bottom:reserveBottom,top:document.querySelector('.v2-topbar')?.getBoundingClientRect().height??54});
}
export function projection(camera,w,h){const f=frame(),o=projectedOffset(w,h,f);camera.setViewOffset(w,h,o.x,o.y,w,h);return f;}
export function viewChanged(point,mode='globe'){
 const key=`${mode}:${point?.latitude?.toFixed(2)}:${point?.longitude?.toFixed(2)}`;
 viewChanged.pending={point,mode,key};
 if(key===viewChanged.key){clearTimeout(viewChanged.timer);viewChanged.timer=null;return;}
 const flush=()=>{viewChanged.timer=null;const p=viewChanged.pending;if(p.key===viewChanged.key)return;viewChanged.last=performance.now();viewChanged.key=p.key;window.dispatchEvent(new CustomEvent('moonpark-v2-view',{detail:{point:p.point,mode:p.mode}}));};
 const elapsed=performance.now()-(viewChanged.last??0);if(elapsed>=100){clearTimeout(viewChanged.timer);flush();}else if(!viewChanged.timer)viewChanged.timer=setTimeout(flush,100-elapsed);
}
