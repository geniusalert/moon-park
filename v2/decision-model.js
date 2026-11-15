import {nextVisibilityEvent} from '../src/navigator-model.js';
import {scheduleImpact,siteSeparation} from '../src/scenario-insights.js';
export function eventCue(samples,index,target){
 const current=samples[index];if(!current)return null;
 const name=target==='sun'?'Sun':'Earth',event=nextVisibilityEvent(samples,index,target);
 const title=target==='sun'?(current.sun?'Sunset':'Sunrise'):(current.earth?'Earthset':'Earth visibility returns');
 if(event.kind==='not-found')return {title,state:current[target]?'Visible now':'Hidden now',found:false,lastUTC:samples.at(-1).utc,remainingHours:Math.max(0,samples.at(-1).hour-current.hour)};
 return {title,state:current[target]?'Visible now':'Hidden now',found:true,afterMinutes:Math.max(0,event.afterHours*60),byMinutes:Math.max(0,event.byHours*60),fromUTC:event.fromUTC,toUTC:event.toUTC,name};
}
export function clockRange(cue){
 const fmt=minutes=>{const n=Math.round(minutes),h=Math.floor(n/60),m=n%60;return h?`${h}h ${m.toString().padStart(2,'0')}m`:`${m}m`;};
 return cue?.found?`${fmt(cue.afterMinutes)} – ${fmt(cue.byMinutes)}`:'Not found';
}
export function scheduleDifference(comparison){
 if(!comparison)return null;const impact=scheduleImpact(comparison),a=comparison.baseline,b=comparison.revised;
 const aligned=a.samples.length===b.samples.length&&a.samples.every((s,i)=>Math.abs(s.hour-b.samples[i].hour)<1e-9);
 const index=aligned?a.samples.findIndex((s,i)=>s.sun!==b.samples[i].sun||s.earth!==b.samples[i].earth):-1;
 return {...impact,...(!aligned?{changedSamples:0,comparedSamples:0}:{}),first:index<0?null:{elapsedHours:a.samples[index].hour,original:a.samples[index],revised:b.samples[index]}};
}
export function pairDifference(a,b,scenario='revised'){
 if(!a.comparison||!b.comparison)return null;const x=a.comparison[scenario],y=b.comparison[scenario];
 const matched=x.startUTC===y.startUTC&&x.endUTC===y.endUTC&&x.config.height===y.config.height;
 return {distanceKm:siteSeparation(a.point,b.point),matched,commonModel:a.model===b.model,sunChange:y.sunHours-x.sunHours,earthChange:y.earthHours-x.earthHours,overlapChange:y.overlap-x.overlap,continuousChange:y.longestCombined-x.longestCombined,original:x.samples[0],revised:y.samples[0]};
}
export function queueState(entries){
 const active=entries.filter(e=>e.pending||['queued','running'].includes(e.job?.status));
 return {active,completed:entries.filter(e=>e.job?.status==='completed'&&!e.pending).length,total:entries.length};
}
