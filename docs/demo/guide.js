import {decodeCandidate,verifiedJSON} from '/src/candidate-model.js';
import {evaluateMission,scheduleActivity} from '/src/mission.js';

const $=id=>document.getElementById(id);
const config={startUTC:'2026-11-14T00:00:00Z',delay:48,duration:72,height:2,maxDark:12,minOverlap:8,stepMinutes:10};
const chapters=[
 ['Ask','A schedule change is a terrain question.','A +48-hour arrival moves this 72-hour surface stay to 16 November. The Sun and Earth follow different paths relative to the local terrain horizon.','The research question is whether the same point still meets the configured visibility limits. Here the limits are at least 8 total hours of Sun + Earth and no more than 12 continuous hours of darkness.'],
 ['Compare','Calculate both arrivals at the same point.','The numbers below are recomputed from coordinate-specific observations and terrain horizons when you change the delay.','This is one sampled point inside a published study outline. The surrounding polygon has not been evaluated continuously. The familiar 5.17 → 53.17 h result applies at +48 hours with these settings.'],
 ['Explain','Read the terrain horizon behind the result.','A target can rise above the astronomical horizon and still be hidden by terrain. Moon Park compares its elevation with the computed horizon in that direction.','Open the full navigator, choose “Try a recorded example”, then “Trace Earth”. The A/B sampled terrain rays explain the interpolated horizon. They do not identify one exact blocker at an unsampled azimuth.'],
 ['Schedule','Total availability is not a continuous work period.','A two-hour activity needs an uninterrupted combined window. Adding scattered visible periods is insufficient.','The timeline and activity result below use the same 10-minute samples. Visibility intervals are half-open bins. Sample timing and unresolved terrain limit the precision of their boundaries.'],
 ['Inspect','Keep the result attached to its evidence.','Export the current settings, point identity, verified source references, calculated results and limitations.','This interior sample has nominal terrain only; it does not inherit the original benchmark points’ clone tests. Historical photos remain unregistered context. Power, RF link quality, hazards, eclipses and thermal conditions are outside this demonstration.']
];
let chapter=0,site,base,baseline,delayed,manifestRef,pointRef,activity;
const hours=v=>`${v.toFixed(2)} h`;
function render(){
 config.delay=Number($('delay').value);
 delayed=evaluateMission(site,config);activity=scheduleActivity(delayed,2);
 $('delayValue').textContent=`+${config.delay} h`;
 for(const [prefix,result] of [['base',baseline],['delay',delayed]]){
  $(prefix+'Hours').replaceChildren(document.createTextNode(hours(result.overlap)));
  const small=document.createElement('small');small.textContent='total Sun + Earth';$(prefix+'Hours').append(small);
  $(prefix+'Decision').textContent=result.modelPass?'Configured nominal limits pass':'Configured nominal limits fail';
 }
 $('reason').textContent=`Delayed arrival: ${delayed.startUTC.slice(0,16).replace('T',' ')} UTC. Longest darkness: ${hours(delayed.longestDark)}. ${delayed.failures.join('; ')||'Both configured visibility limits pass.'}`;
 $('timeline').replaceChildren(...delayed.samples.map(s=>{const el=document.createElement('i');el.className=s.both?'both':s.sun?'sun':s.earth?'earth':'';return el;}));
 $('timeline').setAttribute('aria-label',`72-hour timeline: ${hours(delayed.sunHours)} sunlight, ${hours(delayed.overlap)} combined; longest darkness ${hours(delayed.longestDark)}.`);
 $('activity').textContent=activity.length?`A 2-hour activity fits in ${activity.length} combined window(s). First sampled start: ${activity[0].startUTC.replace('T',' ').replace('.000Z',' UTC')}.`:'No uninterrupted combined window fits a 2-hour activity.';
}
function show(focus=false){
 const [label,title,story,detail]=chapters[chapter];
 $('stepNumber').textContent=`STEP ${chapter+1} / ${chapters.length} · ${label.toUpperCase()}`;
 $('stepTitle').textContent=title;$('story').textContent=story;$('detail').textContent=detail;
 $('previous').disabled=chapter===0;$('next').disabled=chapter===chapters.length-1;$('progress').textContent=`${chapter+1} of ${chapters.length}`;
 [...$('steps').children].forEach((b,i)=>{if(i===chapter)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
 if(focus)$('stepTitle').focus();
}
async function initialize(){
 try{
  const response=await fetch('/data/mission-data.json');if(!response.ok)throw new Error('Mission data unavailable');base=await response.json();
  manifestRef=base.candidates;const manifest=await verifiedJSON(manifestRef);
  pointRef=manifest.regions.flatMap(r=>r.points).find(p=>p.id==='Site01-roi-1-grid-south');
  if(!pointRef)throw new Error('Recorded point unavailable');site=decodeCandidate(await verifiedJSON(pointRef),pointRef);
  baseline=evaluateMission(site,{...config,delay:0});
  chapters.forEach(([label],i)=>{const b=document.createElement('button');b.textContent=`${i+1}. ${label}`;b.onclick=()=>{chapter=i;show(true);};$('steps').append(b);});
  $('previous').onclick=()=>{chapter=Math.max(0,chapter-1);show(true);};$('next').onclick=()=>{chapter=Math.min(chapters.length-1,chapter+1);show(true);};
  $('delay').oninput=()=>{try{render();}catch(e){$('error').hidden=false;$('error').textContent=e.message;$('download').disabled=true;}};
  $('candidateSource').href=pointRef.url;
  $('download').onclick=async()=>{
   $('download').disabled=true;
   try{
    const sha=async raw=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',raw)),v=>v.toString(16).padStart(2,'0')).join('');
    const guideSources={};for(const name of ['index.html','style.css','guide.js']){const res=await fetch(new URL(name,import.meta.url));if(!res.ok)throw new Error('Demonstration source unavailable');guideSources[name]=await sha(await res.arrayBuffer());}
    const record={schemaVersion:1,application:'Moon Park guided demonstration',createdAt:new Date().toISOString(),pointId:site.id,config:{...config},activityDurationHours:2,guideSources,missionSoftware:base.software,manifestSource:manifestRef,pointSource:pointRef,baseline,delayed,activity,registrationEstablished:false,limitations:delayed.limitations,scope:'Single nominal interior point; no clone uncertainty, accepted image alignment or operational feasibility. Guide hashes describe fetched source bytes.'};
    const url=URL.createObjectURL(new Blob([JSON.stringify(record,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='moon-park-guided-decision.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
   }catch(e){$('error').hidden=false;$('error').textContent=e.message;}finally{$('download').disabled=false;}
  };
  render();show();$('status').textContent='Point and manifest checksums verified · Calculated from cached NASA terrain and SPICE geometry';$('experience').hidden=false;
 }catch(e){$('status').textContent='Demonstration unavailable';$('error').hidden=false;$('error').textContent=e.message;}
}
initialize();
