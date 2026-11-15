/** A job stage percentage is not an estimate of whole-job completion. */
export function analysisStatus({name='Selected location',pending=false,job,hasResult=false,reason}={}){
 if(hasResult)return {visible:false,busy:false};
 if(pending||['queued','running'].includes(job?.status)){
  const progress=Number.isFinite(job?.progress)?Math.max(0,Math.min(1,job.progress)):null;
  const stage=job?.stage??'Preparing calculation';
  return {visible:true,busy:true,title:job?.status==='queued'?'Waiting for the calculation worker':'Calculating '+name,
   detail:stage+(progress===null?'':` · ${Math.round(progress*100)}% of this stage`)+(job?.queuePosition?` · queue position ${job.queuePosition}`:''),progress,
   explanation:'First-time measured-terrain calculations can take a minute or more. The terrain horizon and Sun/Earth observations must finish before these views can be shown.'};
 }
 if(job?.status==='failed'||reason)return {visible:true,busy:false,retry:true,title:'Calculation or display unavailable',detail:reason??job.error??'The worker could not produce a result. Retry the calculation.'};
 if(job?.status==='cancelled')return {visible:true,busy:false,retry:true,title:'Calculation cancelled',detail:'No new result was applied. Retry when you are ready.'};
 return {visible:false,busy:false};
}
export function paintAnalysisStatus(state){
 const $=id=>document.getElementById(id),panel=$('analysisStatus');panel.hidden=!state.visible;
 $('analysisStatusTitle').textContent=state.title??'';
 $('analysisStatusDetail').textContent=[state.detail,state.explanation].filter(Boolean).join('. ');
 $('analysisCancel').hidden=!state.busy;$('analysisRetry').hidden=!state.retry;
 const progress=$('analysisProgress');progress.hidden=!state.busy;
 if(state.progress==null)progress.removeAttribute('value');else progress.value=state.progress;
 for(const empty of document.querySelectorAll('.view-empty')){
  if(!empty.dataset.idleText)empty.dataset.idleText=empty.textContent;
  empty.textContent=state.busy?'Calculation in progress. This view will appear automatically when the result is ready.':state.retry?'No result is available. Use Retry calculation above.':empty.dataset.idleText;
 }
}
