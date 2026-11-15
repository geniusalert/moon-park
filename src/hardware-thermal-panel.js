import {validateHardwareDataset} from './hardware-thermal.js';
let root,status,table,applyButton,currentSettings,currentRanges,applySettings;
let worker=null,epoch=0,record=null,pendingReject=null,selectionEpoch=0;
export const hardwareThermalEvidence=()=>record;
function notify(){document.dispatchEvent(new Event('hardwarethermalchange'));}
async function identity(data){
 const bytes=new TextEncoder().encode(JSON.stringify(data));
 return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(v=>v.toString(16).padStart(2,'0')).join('');
}
function download(value,name){
 const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));
 const link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function stop(){
 epoch++;worker?.terminate();worker=null;const reject=pendingReject;pendingReject=null;reject?.(new Error('Hardware analysis cancelled'));
}
function analyze(dataset){
 validateHardwareDataset(dataset);stop();const run=epoch;
 record=null;table.replaceChildren();applyButton.disabled=true;notify();
 validateHardwareDataset(dataset);
 status.textContent='Analyzing hardware test runs...';
 return new Promise((resolve,reject)=>{
  pendingReject=reject;
  worker=new Worker(new URL('./hardware-thermal-worker.js',import.meta.url),{type:'module'});
  worker.onerror=event=>{if(run!==epoch)return;worker.terminate();worker=null;pendingReject=null;status.textContent='Thermal analysis failed';reject(new Error(event.message));};
  worker.onmessage=async event=>{
   if(run!==epoch)return;
   if(event.data.progress){const p=event.data.progress;status.textContent=p.stage+' '+p.completed+'/'+p.total;return;}
   worker.terminate();worker=null;
   if(event.data.error){pendingReject=null;status.textContent=event.data.error;reject(new Error(event.data.error));return;}
   try{
    const inputSHA256=await identity(dataset);
    if(run!==epoch)return;
    record={schemaVersion:1,inputSHA256,dataset,report:event.data.report};
    pendingReject=null;draw();notify();resolve(record);
   }catch(error){pendingReject=null;status.textContent=error.message;reject(error);}
  };
  worker.postMessage(dataset);
 });
}
function draw(){
 if(!record)return;
 const report=record.report;
 const matches=currentSettings&&Object.entries(report.calibratedParameters).every(([k,v])=>currentSettings[k]===v);
 const outside=currentRanges?Object.keys(report.validatedForcingRanges).filter(key=>currentRanges[key]&&(currentRanges[key].minimum<report.validatedForcingRanges[key].minimum-1e-9||currentRanges[key].maximum>report.validatedForcingRanges[key].maximum+1e-9)):[];
 status.textContent=report.status+' for '+report.hardwareId+'. Validation RMSE '+report.validationMetrics.rmseK.toFixed(3)+' K; maximum error '+report.validationMetrics.maxAbsErrorK.toFixed(3)+' K; numerical refinement '+report.maxNumericalRefinementDeltaK.toFixed(3)+' K. '+(matches?'Current thermal settings match this fitted profile.':'Current thermal settings differ from this fitted profile.')+' Scope is limited to the supplied hardware tests and forcing ranges. '+(report.fitAtGridBoundary?'The fit reaches a candidate-grid boundary. ':'')+(report.refinementExceedsSensorUncertainty?'Numerical refinement exceeds the stated sensor uncertainty.':'');
 status.textContent+=currentRanges?(outside.length?' Mission extrapolates beyond tested ranges for '+outside.join(', ')+'.':' Mission ranges fall inside the supplied validation ranges; this alone does not establish accuracy.'):' Calculate a mission to compare its conditions with tested ranges.';
 table.replaceChildren();
 const header=document.createElement('tr');
 for(const text of ['Run','Role','RMSE (K)','Maximum error (K)','Within entered limits']){const th=document.createElement('th');th.textContent=text;header.append(th);}table.append(header);
 for(const run of report.runs){
  const tr=document.createElement('tr');
  for(const text of [run.runId,run.role,run.rmseK.toFixed(3),run.maxAbsErrorK.toFixed(3),run.passes?'Yes':'No']){const td=document.createElement('td');td.textContent=text;tr.append(td);}table.append(tr);
 }
 const caption=document.createElement('caption');
 caption.textContent='Initial measured temperatures initialize runs and are excluded from error statistics. '+(report.evidenceType==='synthetic'?'Synthetic data checks software only.':'Measurement authenticity and sensor calibration are supplied by the user.');
 table.prepend(caption);
 applyButton.disabled=false;
}
export function renderHardwareThermal(host,settings,onApply,ranges=null){
 currentSettings=settings;currentRanges=ranges;applySettings=onApply;
 if(!root){
  root=document.createElement('details');
  const summary=document.createElement('summary');summary.textContent='Validate a spacecraft component with hardware measurements';root.append(summary);
  const intro=document.createElement('p');intro.textContent='Import measured thermal-vacuum or flight-test runs for one component and sensor. Keep separate calibration and validation runs. Fit up to two uncertain thermal properties, inspect residuals, then deliberately apply the fitted properties. Surface-temperature maps and synthetic tests do not establish hardware accuracy.';root.append(intro);
  const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.id='hardwareThermalFile';
  const label=document.createElement('label');label.htmlFor=input.id;label.textContent='Hardware thermal test JSON';root.append(label,input);
  status=document.createElement('p');status.setAttribute('role','status');status.textContent='No hardware measurements loaded. Spacecraft thermal accuracy is unestablished.';root.append(status);
  table=document.createElement('table');root.append(table);
  const controls=document.createElement('div');controls.className='actions';
  const cancel=document.createElement('button');cancel.textContent='Cancel hardware analysis';cancel.onclick=()=>{selectionEpoch++;stop();status.textContent='Hardware analysis cancelled.';};
  const clear=document.createElement('button');clear.textContent='Clear hardware evidence';clear.onclick=()=>{selectionEpoch++;stop();record=null;table.replaceChildren();applyButton.disabled=true;input.value='';status.textContent='No hardware measurements loaded. Spacecraft thermal accuracy is unestablished.';notify();};
  applyButton=document.createElement('button');applyButton.textContent='Apply fitted thermal properties';applyButton.disabled=true;
  applyButton.onclick=()=>{if(record){applySettings(record.report.calibratedParameters);draw();}};
  const exportButton=document.createElement('button');exportButton.textContent='Export hardware test report';exportButton.onclick=()=>{if(record)download(record,'moon-park-hardware-thermal-report.json');else status.textContent='Load and analyze test runs first.';};
  const template=document.createElement('button');template.textContent='Download hardware measurement template';template.onclick=async()=>{
   try{const response=await fetch('/docs/hardware-thermal-template.json');if(!response.ok)throw new Error('Template unavailable');download(await response.json(),'hardware-thermal-template.json');}catch(error){status.textContent=error.message;}
  };
  controls.append(template,cancel,clear,applyButton,exportButton);root.append(controls);
  const details=document.createElement('a');details.href='/docs/HARDWARE_THERMAL_VALIDATION.md';details.textContent='Measurement format, physical assumptions and acceptance scope';root.append(details);host.append(root);
  input.onchange=async()=>{
   const selection=++selectionEpoch;
   try{
    const file=input.files[0];if(!file)return;
    if(file.size>4*1024*1024)throw new Error('Hardware test input exceeds 4 MB');
    const dataset=JSON.parse(await file.text());if(selection!==selectionEpoch)return;await analyze(dataset);
   }catch(error){if(selection===selectionEpoch)status.textContent=error.message;}
  };
 }
 draw();
}
export async function validateHardwareThermalReceipt(saved){
 if(saved==null)return;
 if(saved.schemaVersion!==1||typeof saved.inputSHA256!=='string')throw new Error('Unsupported hardware thermal receipt');
 validateHardwareDataset(saved.dataset);
 if(await identity(saved.dataset)!==saved.inputSHA256)throw new Error('Hardware measurement identity changed');
}
export async function restoreHardwareThermal(saved){
 const selection=++selectionEpoch;
 if(saved==null){stop();record=null;const input=document.getElementById('hardwareThermalFile');if(input)input.value='';if(table)table.replaceChildren();if(status)status.textContent='No hardware measurements loaded. Spacecraft thermal accuracy is unestablished.';if(applyButton)applyButton.disabled=true;return;}
 await validateHardwareThermalReceipt(saved);
 if(selection!==selectionEpoch)throw new Error('Hardware restoration superseded by new input');
 // Recompute from the original input, never trust imported fitted parameters or pass flags.
 await analyze(saved.dataset);
}
