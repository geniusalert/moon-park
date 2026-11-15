import {clampDockHeight} from './layout-math.js';
const $=id=>document.getElementById(id);
export function installReplayTools(){
 const grip=$('v2DockResize'),dock=$('v2Bottom');let drag=null;
 const setHeight=value=>{const h=clampDockHeight(value,innerHeight);document.documentElement.style.setProperty('--v2-bottom',h+'px');grip.setAttribute('aria-valuenow',h);grip.setAttribute('aria-valuemax',Math.floor(innerHeight*.58));window.dispatchEvent(new Event('moonpark-v2-layout'));};
 const reset=()=>{document.documentElement.style.removeProperty('--v2-bottom');grip.setAttribute('aria-valuenow',Math.round(dock.getBoundingClientRect().height));window.dispatchEvent(new Event('moonpark-v2-layout'));};
 grip.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();grip.focus({preventScroll:true});drag={y:e.clientY,height:dock.getBoundingClientRect().height};grip.setPointerCapture(e.pointerId);document.body.classList.add('v2-resizing');};
 grip.onpointermove=e=>{if(drag)setHeight(drag.height+drag.y-e.clientY);};
 const finish=()=>{drag=null;document.body.classList.remove('v2-resizing');};grip.onpointerup=finish;grip.onpointercancel=finish;grip.onlostpointercapture=finish;grip.ondblclick=reset;
 grip.onkeydown=e=>{if(e.key==='Home'){e.preventDefault();reset();}else if(['ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();setHeight(dock.getBoundingClientRect().height+(e.key==='ArrowUp'?20:-20));}};
 window.addEventListener('resize',()=>{if(document.documentElement.style.getPropertyValue('--v2-bottom'))setHeight(dock.getBoundingClientRect().height);});
 const play=$('play');play.parentElement.prepend(play);play.title='Play calculated mission samples; separate from landing animation';
 $('time').setAttribute('aria-label','Mission time: drag to inspect a calculated sample');
 const time=document.createElement('time');time.id='v2ReplayUTC';time.textContent='Generate a scenario to enable mission replay';$('sharedReplay').prepend(time);
 const render=()=>{const paused=play.textContent.includes('Pause');play.setAttribute('aria-label',paused?'Pause mission replay':'Play mission replay');play.setAttribute('aria-pressed',String(paused));};
 new MutationObserver(render).observe(play,{childList:true,subtree:true,characterData:true});render();
}
