import {solarGeometry,summarizeSolar} from './solar-geometry.js';
import {intervals} from './engine.js';
import {nextVisibilityEvent} from './navigator-model.js';
export function operationalMetrics(result){
 const longest=(r,key)=>Math.max(0,...intervals(r.samples,key,r.config.duration).map(([a,b])=>b-a));
 return [['Sunlit time',r=>r.sunHours],['Longest Sun window',r=>longest(r,'sun')],['Direct Earth visibility',r=>r.earthHours],['Longest Earth window',r=>longest(r,'earth')],['Sun and Earth overlap',r=>r.overlap],['Longest shared window',r=>r.longestCombined],['Longest direct-Earth blackout',r=>r.longestEarthBlackout],['Longest darkness',r=>r.longestDark],['Peak Sun elevation',r=>Math.max(...r.samples.map(s=>s.sunEl))],['Mean horizontal projection',r=>100*(r.solarGeometry??summarizeSolar(r.samples,r.config.duration)).meanUnblockedHorizontalProjection]].map(([label,value])=>({label,original:value(result.baseline),revised:value(result.revised),unit:label==='Mean horizontal projection'?'%':label==='Peak Sun elevation'?'°':' h'}));
}
export function shiftReadout(result){
 const delta=v=>{const n=Math.abs(v)<.005?0:v;return `${n>0?'+':''}${n.toFixed(2)}`;};
 const sun=result.revised.sunHours-result.baseline.sunHours,earth=result.revised.earthHours-result.baseline.earthHours;
 const trade=sun*earth<0?'The shift trades Sun time against direct Earth time.':'The separate windows change as shown; inspect shared time as well.';
 return `${trade} ${operationalMetrics(result).filter(m=>['Sunlit time','Direct Earth visibility','Sun and Earth overlap','Peak Sun elevation'].includes(m.label)).map(m=>`${m.label} ${delta(m.revised-m.original)}${m.unit}`).join('; ')}. Revised status includes the continuous activity requirement.`;
}
export function solarReference(s){const g=solarGeometry(s);return `Sun elevation ${g.elevationDeg.toFixed(2)}° above the radial local horizontal; horizon ${g.horizonDeg.toFixed(2)}°; centre clearance ${g.clearanceDeg.toFixed(2)}°. Visible solar disc ${(g.visibleDiscFraction*100).toFixed(1)}%. Ideal horizontal-surface centre-ray projection ${(g.unblockedCenterProjection*100).toFixed(1)}% of normal incidence (terrain blockage included). Airless geometry; no electrical output is predicted.`;}
export function nextEventSummary(samples,index,target){
 const e=nextVisibilityEvent(samples,index,target),name=target==='sun'?'Sun':'Earth';
 if(e.kind==='not-found')return `${name} currently ${e.currentVisible?'visible':'hidden'}: no visibility transition found in the remaining modeled interval.`;
 const label=target==='sun'?(e.currentVisible?'Sunset':'Sunrise'):(e.currentVisible?'Earthset':'Direct Earth visibility returns');
 return `${label} in ${Math.round(e.afterHours*60)}–${Math.round(e.byHours*60)} min; sampled UTC bracket ${e.fromUTC} to ${e.toUTC}.`;
}
