import {intervals} from '/src/engine.js';
import {sampleAtPosition} from './layout-math.js';
const ns='http://www.w3.org/2000/svg',$=id=>document.getElementById(id);
function el(tag,attrs,text){const e=document.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,v);if(text!==undefined)e.textContent=text;return e;}
export function horizon(profile,sample,isSphere){
 const svg=$('horizonScene');svg.replaceChildren();if(!sample)return;
 const w=Math.max(300,svg.clientWidth||900),h=Math.max(110,svg.clientHeight||170),left=36,right=w-20,top=20,bottom=h-26;
 const low=Math.min(-2,...profile.map(p=>p.el),sample.sunEl,sample.earthEl)-1,high=Math.max(3,...profile.map(p=>p.el),sample.sunEl,sample.earthEl)+2;
 const x=a=>left+a/360*(right-left),y=a=>bottom-(a-low)/(high-low)*(bottom-top);svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
 for(const angle of [low,0,high]){if(angle<low||angle>high)continue;svg.append(el('line',{x1:left,x2:right,y1:y(angle),y2:y(angle),stroke:angle===0?'#879776':'#2e3c32','stroke-dasharray':'3 5'}),el('text',{x:2,y:y(angle)+3,fill:'#a7b49c','font-size':9},angle.toFixed(1)+'°'));}
 const path=profile.map((p,i)=>`${i?'L':'M'}${x(p.az)},${y(p.el)}`).join(' ');svg.append(el('path',{d:path+`L${right} ${bottom}L${left} ${bottom}Z`,fill:'#829475',opacity:.24}),el('path',{d:path,stroke:'#a7bd90',fill:'none','stroke-width':1.4}));
 for(const [name,az,elevation,color,visible]of [['Sun',sample.az,sample.sunEl,'#edcc8b',sample.sun],['Earth',sample.earthAz,sample.earthEl,'#b8cfad',sample.earth]]){
  const shift=name==='Earth'&&Math.abs(x(sample.az)-x(sample.earthAz))<90?17:0;svg.append(el('circle',{cx:x(az),cy:y(elevation),r:5,fill:color,opacity:visible?1:.35}),el('text',{x:Math.max(left,Math.min(right-110,x(az)+10)),y:Math.max(12,Math.min(bottom-7,y(elevation)-9+shift)),fill:color,'font-size':10},`${name} ${elevation.toFixed(2)}° · ${visible?'visible':'hidden'}`));
 }
 for(const [a,label]of [[0,'N · 0°'],[90,'E · 90°'],[180,'S · 180°'],[270,'W · 270°'],[360,'360°']])svg.append(el('text',{x:x(a),y:h-7,'text-anchor':a===0?'start':a===360?'end':'middle',fill:'#92a287','font-size':9},label));
 svg.setAttribute('aria-label',`${isSphere?'Reference-sphere':'Measured terrain'} horizon. Sun ${sample.sunEl.toFixed(2)} degrees, ${sample.sun?'visible':'hidden'}; Earth ${sample.earthEl.toFixed(2)} degrees, ${sample.earth?'visible':'hidden'}. ${sample.utc}`);
}
export function timeline(result,index=Number($('time').value)){
 const svg=$('timeline');svg.replaceChildren();if(!result)return;const w=Math.max(220,svg.clientWidth||350),h=Math.max(110,svg.clientHeight||150),left=42,span=w-left-12,rowH=Math.min(27,(h-43)/3);svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
 for(const [row,key,label,color]of [[0,'sun','SUN','#edcc8b'],[1,'earth','EARTH','#b8cfad'],[2,'both','BOTH','#8cae7b']]){
  const y=14+row*rowH;svg.append(el('text',{x:0,y:y+12,fill:'#b3bfa8','font-size':9},label),el('rect',{x:left,y,width:span,height:16,rx:2,fill:'#243129'}));
  for(const [start,end]of intervals(result.samples,key,result.config.duration)){const r=el('rect',{x:left+start/result.config.duration*span,y,width:Math.max(.2,(end-start)/result.config.duration*span),height:16,fill:color});r.append(el('title',{},`${label}: ${start.toFixed(2)} to ${end.toFixed(2)} hours from arrival`));svg.append(r);}

 }
 const sample=result.samples[index];if(sample){const x=left+sample.hour/result.config.duration*span;svg.append(el('line',{x1:x,x2:x,y1:7,y2:14+rowH*2+19,stroke:'#f3f1d2','stroke-width':1.2}));}
 for(const [f,t]of [[0,'ARRIVAL'],[.5,'+'+(result.config.duration/2).toFixed(0)+' h'],[1,'+'+result.config.duration+' h']])svg.append(el('text',{x:left+span*f,y:14+rowH*3+9,'text-anchor':f===0?'start':f===1?'end':'middle',fill:'#93a48a','font-size':9},t));
 svg.setAttribute('tabindex','0');svg.setAttribute('role','slider');svg.setAttribute('aria-label','Mission time. Drag or scroll to inspect calculated samples.');svg.setAttribute('aria-valuemin','0');svg.setAttribute('aria-valuemax',result.samples.length-1);svg.setAttribute('aria-valuenow',index);svg.setAttribute('aria-valuetext',sample?.utc??'');
 const choose=i=>{if(i<0)return;$('time').dispatchEvent(new Event('pointerdown'));$('time').value=i;$('time').dispatchEvent(new Event('input',{bubbles:true}));};
 const at=e=>{const rect=svg.getBoundingClientRect();choose(sampleAtPosition(((e.clientX-rect.left)/rect.width*w-left)/span,result.samples));};
 svg.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();svg.focus({preventScroll:true});svg.setPointerCapture(e.pointerId);svg.dataset.dragging=String(e.pointerId);at(e);};
 svg.onpointermove=e=>{if(svg.dataset.dragging===String(e.pointerId))at(e);};
 svg.onpointerup=e=>{delete svg.dataset.dragging;if(svg.hasPointerCapture(e.pointerId))svg.releasePointerCapture(e.pointerId);};svg.onpointercancel=()=>{delete svg.dataset.dragging;};svg.onlostpointercapture=()=>{delete svg.dataset.dragging;};
 svg.onwheel=e=>{e.preventDefault();const delta=Math.sign(e.deltaY||e.deltaX);choose(Math.max(0,Math.min(result.samples.length-1,Number($('time').value)+delta)));};
 svg.onkeydown=e=>{let i=Number($('time').value);if(e.key==='Home')i=0;else if(e.key==='End')i=result.samples.length-1;else if(e.key==='ArrowLeft')i=Math.max(0,i-1);else if(e.key==='ArrowRight')i=Math.min(result.samples.length-1,i+1);else return;e.preventDefault();choose(i);};
}
