import {evaluateMission,scheduleActivity} from './mission.js';
import {attachTerrainVariants,analyzeSite} from './robustness.js';
import {verifiedJSON} from './candidate-model.js';
const $=id=>document.getElementById(id);
let started,kind,questions,reference;
try{
 const response=await fetch('/data/mission-data.json');if(!response.ok)throw new Error('Mission reference unavailable');const dataset=await response.json();
 attachTerrainVariants(dataset,await verifiedJSON(dataset.uncertainty));
 const config={startUTC:'2026-11-14T00:00:00Z',delay:48,duration:72,height:2,maxDark:12,minOverlap:8},ridge=dataset.sites.find(s=>s.id==='Site01'),rim=dataset.sites.find(s=>s.id==='Site04');
 const baseline=evaluateMission(ridge,{...config,delay:0}),delayed=evaluateMission(ridge,config),rimResult=evaluateMission(rim,config),analysis=analyzeSite(ridge,config);
 const common=scheduleActivity({...delayed,combinedWindows:analysis.commonWindows},2)[0];
 reference={version:dataset.software,config,derivedAt:new Date().toISOString()};
 questions=[
  {prompt:'At the original Shackleton research point, which configured requirement fails after the delay?',choices:['Minimum combined Sun + Earth availability','Maximum continuous darkness','Both requirements pass'],answer:rimResult.overlap<config.minOverlap?0:rimResult.longestDark>config.maxDark?1:2},
  {prompt:'At the original Connecting Ridge research point, does the delay increase or decrease total combined availability?',choices:['Increase','Decrease','No change'],answer:delayed.overlap>baseline.overlap?0:delayed.overlap<baseline.overlap?1:2},
  {prompt:'For a two-hour Connecting Ridge activity, which first start is shared by the nominal model and all eight tested variants?',choices:['16 November, 12:40 UTC','16 November, 12:50 UTC','No shared activity is possible'],answer:common?.startUTC.startsWith('2026-11-16T12:50')?1:common?.startUTC.startsWith('2026-11-16T12:40')?0:2},
  {prompt:'When you inspect a calculated point inside a published study outline, what area do its results cover?',choices:['The sampled point only','Every location in the outline','The entire crater'],answer:0},
  {prompt:'What does a model pass establish?',choices:['The configured visibility limits pass under stated assumptions','The location is certified safe to land','A radio link and sufficient electrical power are guaranteed'],answer:0}
 ];
 $('tasks').innerHTML=questions.map((q,i)=>`<fieldset><legend>Task ${i+1}</legend><p>${q.prompt}</p>${q.choices.map((text,j)=>`<label><input type="radio" name="q${i}" value="${j}" required>${text}</label>`).join('')}</fieldset>`).join('');
 $('begin').disabled=false;$('begin').textContent='Start the five tasks';
 $('begin').onclick=()=>{started=performance.now();kind=$('sessionKind').value;$('sessionKind').disabled=true;$('begin').hidden=true;$('questions').hidden=false;$('studyStatus').textContent='Timer running. Use the navigator to answer without coaching.';};
 $('questions').onsubmit=e=>{
  e.preventDefault();const data=new FormData(e.currentTarget),answers=questions.map((q,i)=>Number(data.get('q'+i))),correct=answers.map((a,i)=>a===questions[i].answer),assisted=$('assisted').checked;
  const record={schemaVersion:1,anonymousSessionId:crypto.randomUUID(),createdAt:new Date().toISOString(),kind,includeInHumanStudy:kind==='participant',elapsedSeconds:Math.round((performance.now()-started)/1000),assisted,answers:questions.map((q,i)=>({task:i+1,prompt:q.prompt,response:q.choices[answers[i]],correct:correct[i]})),correctCount:correct.filter(Boolean).length,allTasksCorrectUnaided:correct.every(Boolean)&&!assisted,reference};
  const url=URL.createObjectURL(new Blob([JSON.stringify(record,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`moon-park-study-${kind}-${record.anonymousSessionId}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  $('questions').hidden=true;$('studyStatus').textContent=`Record exported. ${record.correctCount}/5 correct; ${assisted?'assisted':'unaided'}. ${kind==='developer'?'Developer verification is excluded from human-study evidence.':'Participant record ready for facilitator review.'}`;
 };
}catch(e){$('studyStatus').textContent='Study unavailable: '+e.message;}
