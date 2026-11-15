import {nextEventSummary} from './navigator-operations.js';
const NS='http://www.w3.org/2000/svg';
export function compassPoint(az,r=76){const a=az*Math.PI/180;return [110+r*Math.sin(a),110-r*Math.cos(a)];}
export function availabilityPercent(hours,duration){if(!Number.isFinite(hours)||!Number.isFinite(duration)||duration<=0)return 0;return Math.max(0,Math.min(100,hours/duration*100));}
export function renderObservatory(container,result,sample,index){
 container.replaceChildren();const title=document.createElement('h3');title.textContent='Mission observatory';container.append(title);
 const layout=document.createElement('div');layout.className='observatory-layout';container.append(layout);
 const sky=document.createElementNS(NS,'svg');sky.setAttribute('viewBox','0 0 220 220');sky.setAttribute('role','img');sky.setAttribute('aria-label',`Azimuth compass: Sun ${sample.az.toFixed(1)}°, Earth ${sample.earthAz.toFixed(1)}°. Rings are angular guides, not terrain.`);layout.append(sky);
 const add=(tag,attrs,text)=>{const n=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,String(v));if(text)n.textContent=text;sky.append(n);return n;};
 for(const r of [38,76,96])add('circle',{cx:110,cy:110,r,fill:'none',stroke:'#3b4a40','stroke-dasharray':r===38?'2 5':'none'});
 for(const [label,az]of [['N',0],['E',90],['S',180],['W',270]]){const [x,y]=compassPoint(az,103);add('text',{x,y:y+4,'text-anchor':'middle',fill:'#aec4aa','font-size':10},label);}
 for(const [name,key,az,color]of [['Sun','az',sample.az,'#edcc8b'],['Earth','earthAz',sample.earthAz,'#aec4aa']]){
  add('path',{d:result.samples.map((s,i)=>{const [x,y]=compassPoint(s[key],name==='Sun'?76:61);return `${i?'L':'M'}${x},${y}`;}).join(' '),fill:'none',stroke:color,'stroke-width':4,opacity:.25});
  const [x,y]=compassPoint(az,name==='Sun'?76:61);add('path',{d:`M110,110L${x},${y}`,stroke:color,'stroke-dasharray':name==='Earth'?'5 3':'none'});add('circle',{cx:x,cy:y,r:5,fill:color});add('text',{x:110,y:name==='Sun'?102:122,'text-anchor':'middle',fill:color,'font-size':11},`${name} ${az.toFixed(1)}°`);
 }
 const metrics=document.createElement('div');metrics.className='observatory-metrics';layout.append(metrics);
 for(const [label,key,color] of [['Sunlight','sunHours','#edcc8b'],['Direct Earth','earthHours','#aec4aa'],['Shared window total','overlap','#c9e2aa']]){
  const value=result[key],pct=availabilityPercent(value,result.config.duration),card=document.createElement('div');card.className='orbit-stat';
  const dial=document.createElement('div');dial.className='availability-dial';dial.style.background=`conic-gradient(${color} ${pct}%, #2b372d 0)`;dial.setAttribute('aria-hidden','true');const center=document.createElement('span');center.textContent=`${pct.toFixed(0)}%`;dial.append(center);
  const text=document.createElement('div'),strong=document.createElement('strong'),small=document.createElement('span');strong.textContent=`${value.toFixed(1)} h`;small.textContent=label;text.append(strong,small);card.append(dial,text);metrics.append(card);
 }
 const caption=document.createElement('p');caption.className='muted';caption.textContent='Compass shows azimuth only; faded arcs trace the inspected mission. Dials show total availability, not continuous duration. Gold: Sun · sage: Earth · pale green: shared.';container.append(caption);
 const events=document.createElement('div');events.className='observatory-events';for(const target of ['sun','earth']){const card=document.createElement('p');card.textContent=nextEventSummary(result.samples,index,target);events.append(card);}container.append(events);
}
