import {advanceThermalTemperature,validateThermalParameters,THERMAL_MODEL_VERSION} from './thermal-model.js';
const FIT_KEYS=['heatCapacityJK','emissivity','conductanceWK'];
const FORCING_KEYS=['irradianceWm2','internalHeatW','electricalW','groundTemperatureK','skyTemperatureK'];
export function validateHardwareDataset(data){
 if(data?.schemaVersion!==1||data.format!=='moon-park-hardware-thermal-test'||data.physicalTarget!=='spacecraft-component'||data.temperatureUnit!=='K')throw new Error('Use spacecraft-component thermal test schema 1 with Kelvin temperatures');
 for(const key of ['hardwareId','sensorId','sensorLocation','sensorCalibrationReference'])if(typeof data[key]!=='string'||!data[key].trim())throw new Error('Missing '+key);
 if(!['measured','synthetic'].includes(data.evidenceType))throw new Error('Declare measured or synthetic evidence');
 if(!Number.isFinite(data.sensorUncertaintyK)||data.sensorUncertaintyK<0)throw new Error('Supply sensor uncertainty in Kelvin');
 validateThermalParameters(data.parameters);
 if(!data.criteria||!['maxRMSEK','maxAbsErrorK'].every(key=>Number.isFinite(data.criteria[key])&&data.criteria[key]>0))throw new Error('Supply positive error acceptance limits');
 if(!Array.isArray(data.runs)||data.runs.length<2||data.runs.length>12)throw new Error('Supply 2–12 separate calibration and validation runs');
 const ids=new Set(),rowSets=new Set();let count=0,span=0;
 for(const run of data.runs){
  if(!['calibration','validation'].includes(run.role)||typeof run.runId!=='string'||!run.runId||ids.has(run.runId))throw new Error('Use unique run identities and explicit calibration/validation roles');
  ids.add(run.runId);
  if(typeof run.sourceReference!=='string'||!run.sourceReference.trim())throw new Error('Record the measurement source for each run');
  if(!Array.isArray(run.rows)||run.rows.length<4)throw new Error('Each run needs an initial temperature and at least three later measurements');
  if(run.rows[0].elapsedSeconds!==0)throw new Error('Start each run at zero elapsed seconds');
  let previous=-1;
  for(const row of run.rows){
   if(!Number.isFinite(row.elapsedSeconds)||row.elapsedSeconds<=previous||!Number.isFinite(row.temperatureK)||row.temperatureK<=0||row.temperatureK>2000)throw new Error('Use increasing finite sample times and temperatures in Kelvin');
   previous=row.elapsedSeconds;
   for(const key of FORCING_KEYS)if(!Number.isFinite(row[key])||row[key]<0)throw new Error('Missing or invalid '+key);
   if(row.skyTemperatureK>2000||row.groundTemperatureK>2000)throw new Error('Thermal sink temperatures exceed the supported range');
  }
  count+=run.rows.length;span+=previous;
  const signature=JSON.stringify(run.rows);
  if(rowSets.has(signature))throw new Error('Calibration and validation runs must not reuse identical records');
  rowSets.add(signature);
 }
 if(count>12000||span>30*86400)throw new Error('Test dataset exceeds 12000 records or 30 days of combined run time');
 if(!data.runs.some(run=>run.role==='calibration')||!data.runs.some(run=>run.role==='validation'))throw new Error('Reserve a separate validation run before fitting');
 const grids=Object.entries(data.fitGrids??{});
 if(grids.length>2)throw new Error('Fit at most two thermal parameters per study');
 for(const [key,values] of grids){
  if(!FIT_KEYS.includes(key)||!Array.isArray(values)||values.length<1||values.length>7||new Set(values).size!==values.length)throw new Error('Use 1–7 distinct candidates for supported thermal parameters');
  for(const value of values)validateThermalParameters({...data.parameters,[key]:value});
 }
 return data;
}
function simulateRun(run,parameters,maxStepSeconds=10){
 let temperature=run.rows[0].temperatureK;
 return run.rows.slice(1).map((row,index)=>{
  const previous=run.rows[index],seconds=row.elapsedSeconds-previous.elapsedSeconds;
  const steps=Math.ceil(seconds/maxStepSeconds);
  for(let step=0;step<steps;step++)temperature=advanceThermalTemperature(temperature,seconds/steps,parameters,previous);
  return {elapsedSeconds:row.elapsedSeconds,measuredK:row.temperatureK,predictedK:temperature,residualK:temperature-row.temperatureK};
 });
}
function metrics(rows){
 return {points:rows.length,rmseK:Math.sqrt(rows.reduce((sum,r)=>sum+r.residualK**2,0)/rows.length),biasK:rows.reduce((sum,r)=>sum+r.residualK,0)/rows.length,maeK:rows.reduce((sum,r)=>sum+Math.abs(r.residualK),0)/rows.length,maxAbsErrorK:Math.max(...rows.map(r=>Math.abs(r.residualK)))};
}
export function calibrateHardware(data,onProgress=()=>{}){
 validateHardwareDataset(data);
 let candidates=[validateThermalParameters(data.parameters)];
 const grids=Object.entries(data.fitGrids??{});
 for(const [key,values] of grids)candidates=candidates.flatMap(p=>values.map(value=>({...p,[key]:value})));
 const calibration=data.runs.filter(run=>run.role==='calibration');
 const ranked=candidates.map((parameters,index)=>{
  const residuals=calibration.flatMap(run=>simulateRun(run,parameters));
  onProgress({stage:'Fitting calibration runs',completed:index+1,total:candidates.length});
  return {parameters,score:metrics(residuals).rmseK,index};
 }).sort((a,b)=>a.score-b.score||a.index-b.index);
 const best=ranked[0];
 const runs=data.runs.map(run=>{
  const predictions=simulateRun(run,best.parameters),summary=metrics(predictions);
  return {runId:run.runId,role:run.role,sourceReference:run.sourceReference,...summary,passes:summary.rmseK<=data.criteria.maxRMSEK&&summary.maxAbsErrorK<=data.criteria.maxAbsErrorK,predictions};
 });
 const validationRuns=runs.filter(run=>run.role==='validation');
 const ranges=Object.fromEntries(FORCING_KEYS.map(key=>{
  const values=data.runs.filter(run=>run.role==='validation').flatMap(run=>run.rows.slice(0,-1).map(row=>row[key]));
  return [key,{minimum:Math.min(...values),maximum:Math.max(...values)}];
 }));
 const temperatures=data.runs.filter(run=>run.role==='validation').flatMap(run=>run.rows.map(row=>row.temperatureK));
 ranges.temperatureK={minimum:Math.min(...temperatures),maximum:Math.max(...temperatures)};
 const refinement=data.runs.filter(run=>run.role==='validation').flatMap(run=>{
  const coarse=simulateRun(run,best.parameters),fine=simulateRun(run,best.parameters,5);
  return fine.map((p,i)=>Math.abs(p.predictedK-coarse[i].predictedK));
 });
 const maxNumericalRefinementDeltaK=Math.max(...refinement);
 const validationPass=validationRuns.every(run=>run.passes);
 return {schemaVersion:1,modelVersion:THERMAL_MODEL_VERSION,hardwareId:data.hardwareId,sensorId:data.sensorId,evidenceType:data.evidenceType,
  status:data.evidenceType==='synthetic'?'synthetic-software-check':validationPass?'passes-supplied-hardware-tests':'fails-supplied-hardware-tests',
  independentValidationPass:data.evidenceType==='measured'&&validationPass,validationWithinLimits:validationPass,criteria:data.criteria,sensorUncertaintyK:data.sensorUncertaintyK,
  calibratedParameters:best.parameters,fitCandidates:ranked.length,calibrationRMSEK:best.score,
  secondBestCalibrationRMSEK:ranked[1]?.score??null,
  fitAtGridBoundary:grids.some(([key,values])=>values.length>1&&(best.parameters[key]===Math.min(...values)||best.parameters[key]===Math.max(...values))),
  validationMetrics:metrics(validationRuns.flatMap(run=>run.predictions)),maxNumericalRefinementDeltaK,
  refinementExceedsSensorUncertainty:maxNumericalRefinementDeltaK>data.sensorUncertaintyK,
  validatedForcingRanges:ranges,runs,
  limitations:['Parameters are fitted only to designated calibration runs; validation records are evaluated afterward.','Sensor uncertainty is reported separately from model error; no statistical confidence interval is inferred.','Passing describes the supplied component, sensor, setup and tested forcing ranges only. Input authenticity is user-declared.','A single thermal node omits internal gradients, contact changes, aging and unmodeled heat paths.','Grid fitting can leave parameters unidentifiable; a grid-boundary result requires investigation.','The initial measured temperature initializes each run and is excluded from residual metrics. Forcing is held constant until the next record.']};
}
