import {nextEventSummary} from './navigator-operations.js';
export function scheduleImpact(comparison){
 const {baseline:a,revised:b}=comparison;
 const n=(b.samples.length===a.samples.length)?a.samples.length:0;
 let changed=0;for(let i=0;i<n;i++)if(a.samples[i].sun!==b.samples[i].sun||a.samples[i].earth!==b.samples[i].earth)changed++;
 return {delayHours:(Date.parse(b.startUTC)-Date.parse(a.startUTC))/3600000,overlapChange:b.overlap-a.overlap,continuousChange:b.longestCombined-a.longestCombined,changedSamples:changed,comparedSamples:n,passChanged:!(comparison.baselineFailures??a.failures).length!==!comparison.failures.length};
}
export function shadowRatio(elevation){
 if(!Number.isFinite(elevation)||elevation<=0||elevation>90)return null;
 return 1/Math.tan(elevation*Math.PI/180);
}
export function siteSeparation(a,b){
 const r=Math.PI/180,p=a.latitude*r,q=b.latitude*r,d=(b.longitude-a.longitude)*r;
 const h=Math.sin((q-p)/2)**2+Math.cos(p)*Math.cos(q)*Math.sin(d/2)**2;
 return 1737.4*2*Math.asin(Math.sqrt(Math.max(0,Math.min(1,h))));
}
const el=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
export function renderRapidInsights(container,locations,results,onInspect){
 container.replaceChildren();container.append(el('h3','Schedule impact at a glance'));
 const grid=el('div');grid.className='rapid-grid';
 for(const p of locations){const card=el('article'),c=results.get(p.id);card.append(el('h4',p.name));
  if(!c){card.append(el('p','Unavailable for the current settings. Calculate this location to compare it.'));grid.append(card);continue;}
  const impact=scheduleImpact(c),sign=n=>`${n>0?'+':''}${n.toFixed(2)} h`;
  card.append(el('strong',c.failures.length?'Revised constraints fail':'Revised constraints pass'),el('p',`${impact.delayHours} h arrival shift → ${sign(impact.overlapChange)} shared time; ${sign(impact.continuousChange)} longest shared window.${impact.passChanged?' The entered constraint status changes.':''}`));
  const first=c.baseline.samples.findIndex((a,i)=>c.revised.samples[i]&&(a.sun!==c.revised.samples[i].sun||a.earth!==c.revised.samples[i].earth));if(first>=0){const a=c.baseline.samples[first],b=c.revised.samples[first];card.append(el('p',`First changed relative-time sample: ${a.utc} → ${b.utc}. Sun centre clearance ${(a.sunEl-a.horizon).toFixed(3)}° → ${(b.sunEl-b.horizon).toFixed(3)}°; Earth clearance ${(a.earthEl-a.earthHorizon).toFixed(3)}° → ${(b.earthEl-b.earthHorizon).toFixed(3)}°. Inspect the horizon and sampled terrain witnesses to examine the obstruction; solar disc fraction sets the Sun threshold.`));}
  card.append(el('p',`${impact.changedSamples}/${impact.comparedSamples} samples change Sun or Earth visibility when aligned by time since arrival. This compares the evaluated dates, not an uncertainty estimate.`));
  for(const target of ['sun','earth'])card.append(el('p',`At revised arrival: ${nextEventSummary(c.revised.samples,0,target)}`));
  const button=el('button','Inspect '+p.name);button.onclick=()=>onInspect(p.id);card.append(button);grid.append(card);
 }
 container.append(grid);
 if(locations.length>1){const base=locations[0];for(const p of locations.slice(1)){const a=results.get(base.id)?.revised,b=results.get(p.id)?.revised;if(!a||!b)continue;const x=a.samples[0],y=b.samples[0];container.append(el('p',`At revised arrival, Sun elevation ${x.sunEl.toFixed(3)}° → ${y.sunEl.toFixed(3)}°; skyline in the Sun direction ${x.horizon.toFixed(3)}° → ${y.horizon.toFixed(3)}°. Elevation describes celestial position; the skyline describes the local obstruction. These are sampled explanations, not proof that a particular ridge causes all metric differences.`));container.append(el('p',`${base.name} ↔ ${p.name}: ${siteSeparation(base,p).toFixed(2)} km on the reference sphere; ${(b.overlap-a.overlap).toFixed(2)} h difference in shared visibility. This is a tested pair, not a spatial sensitivity bound. Different terrain sources and model choices can also change the result.`));}}
}
export function renderLunarContext(container,sample,reference){
 container.replaceChildren();const details=el('details');details.className='lunar-context-help';const summary=el('summary','?');summary.setAttribute('aria-label','Why the Moon feels different');const label=el('span','Why the Moon feels different');label.className='help-label';summary.append(label);details.append(summary);
 const ratio=shadowRatio(sample.sunEl),grid=el('div');grid.className='lunar-context-grid';
 for(const [title,angle,ratioValue] of [['Selected lunar Sun',sample.sunEl,ratio],['Illustrative 30° Sun',30,shadowRatio(30)]]){
  const card=el('div');card.append(el('strong',title),el('p',`${angle.toFixed(2)}° above horizontal`));
  if(ratioValue===null)card.append(el('p','Sun centre at/below horizontal: no finite centre-ray shadow-length estimate.'));
  else {const bar=el('div');bar.className='shadow-track';const line=el('span');line.style.width=`${Math.min(100,ratioValue/100*100)}%`;bar.append(line);card.append(bar,el('p',`1 m vertical object → ${ratioValue.toFixed(1)} m shadow on an ideal flat plane.`));}
  grid.append(card);
 }
 details.append(grid,el('p','Shadow bars share a 0–100 m scale and clip longer shadows. The 30° view is a teaching example, not an Earth forecast. Real terrain, surface slope and the finite solar disc change shadows.'));
 details.append(el('p',`Airless Moon: no atmospheric refraction bends light over the horizon; no atmospheric scattering is modeled. Earth has an atmosphere, so its near-horizon appearance differs. ${reference?'This result uses only a smooth sphere; local terrain effects cannot be inferred.':'Terrain ridges and crater rims can interrupt the low Sun or Earth line of sight. Near zero clearance, a small angular change can cross the visibility threshold.'} Ten-minute samples bracket changes; they do not resolve exact event times.`));
 if(!sample.sun)details.append(el('p','The Sun does not meet the modeled visibility threshold now. The shadow sketch is geometric illustration, not a prediction of an illuminated surface.'));
 container.append(details);
}
