import {renderHardwareThermal} from './hardware-thermal-panel.js';
import {engineeringEstimate} from './engineering-model.js';

export const engineeringDefaults={areaM2:2,efficiency:.25,derating:.8,tiltDeg:90,azimuthDeg:0,loadW:100,chargeEfficiency:.9,dischargeEfficiency:.9,usableFraction:.8,absorptivity:.8,emissivity:.85,radiatingAreaM2:2,internalHeatW:20,capacityWh:1000,initialChargeFraction:1,maxChargeW:500,maxDischargeW:500,activeLoadW:200,activeHours:2,loadPeriodHours:24,heatCapacityJK:10000,initialTemperatureK:250,groundTemperatureK:100,groundViewFactor:0,conductanceWK:0,temperatureCoefficientPerK:-.004,referenceTemperatureK:298.15,minTemperatureK:100,maxTemperatureK:400};

const labels={areaM2:'Panel area (m²)',efficiency:'Electrical efficiency (fraction)',derating:'Derating (fraction)',tiltDeg:'Panel tilt from horizontal (°)',azimuthDeg:'Panel azimuth clockwise from north (°)',loadW:'Constant load (W)',chargeEfficiency:'Charge efficiency',dischargeEfficiency:'Discharge efficiency',usableFraction:'Usable battery fraction',absorptivity:'Solar absorptivity',emissivity:'Thermal emissivity',radiatingAreaM2:'Radiating area (m²)',internalHeatW:'Internal heat (W)'};

let panel,output;const cached=new WeakMap();

export function engineeringSettings(){

 return Object.fromEntries(Object.keys(engineeringDefaults).map(k=>[k,Number(document.getElementById('eng-'+k)?.value??engineeringDefaults[k])]));

}

export function restoreEngineering(settings=engineeringDefaults){

 settings={...engineeringDefaults,...settings};

 engineeringEstimate([{hour:0,sunEl:90,az:0,sunFraction:1,sunRangeKm:149597870.7}],1,settings);

 for(const k of Object.keys(engineeringDefaults))document.getElementById('eng-'+k).value=settings[k];

}

export function renderEngineering(active){

 if(!panel){

  panel=document.createElement('details');const title=document.createElement('summary');title.textContent='Panel, storage and thermal assumptions';panel.append(title);

  const note=document.createElement('p');note.textContent='Illustrative defaults. Enter your equipment assumptions. Transient thermal output uses a lumped body, fixed supplied ground temperature and view factor. Defaults are illustrative, with no measured material calibration.';panel.append(note);
  const reference=document.createElement('details'),referenceTitle=document.createElement('summary');
  referenceTitle.textContent='Measured Diviner surface-temperature benchmark';reference.append(referenceTitle);
  const referenceStatus=document.createElement('p');referenceStatus.textContent='Loading measured reference evidence...';reference.append(referenceStatus);panel.append(reference);
  fetch('/docs/diviner-thermal-comparison.json').then(async response=>{
   if(!response.ok)throw new Error('Measured reference report unavailable');
   const report=await response.json();
   referenceStatus.textContent=report.status+'. Latitude-mean RMSE '+report.rmseLatitudeMeansK.toFixed(2)+' K. Comparison uses a published regolith model and three sampled latitude bands from one aggregated midnight summer data segment. Spacecraft temperatures require their own material and hardware validation.';
   const table=document.createElement('table'),header=document.createElement('tr');
   for(const label of ['Latitude','Measured surface (K)','Regolith reference (K)','Residual (K)']){const cell=document.createElement('th');cell.textContent=label;header.append(cell);}table.append(header);
   for(const row of report.cases){const tr=document.createElement('tr');for(const value of [row.latitude,row.measuredMeanK,row.referenceModelMeanK,row.residualK]){const td=document.createElement('td');td.textContent=value.toFixed(2);tr.append(td);}table.append(tr);}reference.append(table);
   const link=document.createElement('a');link.href='/docs/diviner-thermal-comparison.json';link.textContent='Measurement identities, model assumptions and limitations';reference.append(link);
  }).catch(error=>{referenceStatus.textContent=error.message;});


  for(const [key,value] of Object.entries(engineeringDefaults)){

   const label=document.createElement('label');label.textContent=labels[key]??({capacityWh:'Nominal battery capacity (Wh)',initialChargeFraction:'Initial usable charge fraction',maxChargeW:'Maximum charging input (W)',maxDischargeW:'Maximum delivered discharge power (W)',activeLoadW:'Active-period load (W)',activeHours:'Active hours per load cycle',loadPeriodHours:'Load cycle duration (h)',heatCapacityJK:'Body heat capacity (J/K)',initialTemperatureK:'Initial body temperature (K)',groundTemperatureK:'Fixed ground temperature (K)',groundViewFactor:'Ground radiative view factor',conductanceWK:'Conductance to ground (W/K)',temperatureCoefficientPerK:'Panel efficiency temperature coefficient (1/K)',referenceTemperatureK:'Efficiency reference temperature (K)',minTemperatureK:'Minimum allowed body temperature (K)',maxTemperatureK:'Maximum allowed body temperature (K)'}[key]);const input=document.createElement('input');input.type='number';input.step='any';input.id='eng-'+key;input.value=value;label.append(input);panel.append(label);

  }

  output=document.createElement('p');output.setAttribute('role','status');panel.append(output);

  document.getElementById('powerLimit').after(panel);

 }

 const applyThermal=profile=>{
  for(const [key,value] of Object.entries(profile))document.getElementById('eng-'+key).value=value;
  renderEngineering(active);document.dispatchEvent(new Event('engineeringchange'));
 };
 panel.oninput=()=>{renderEngineering(active);document.dispatchEvent(new Event('engineeringchange'));};

 if(!active){renderHardwareThermal(panel,engineeringSettings(),applyThermal);output.textContent='Calculate a scenario to estimate energy and storage.';return;}

 try{

  const settings=engineeringSettings(),signature=JSON.stringify(settings);

  let entry=cached.get(active);

  if(entry?.signature!==signature){entry={signature,estimate:engineeringEstimate(active.samples,active.config.duration,settings)};cached.set(active,entry);}

  const estimate=entry.estimate;
  renderHardwareThermal(panel,settings,applyThermal,{...estimate.thermalForcingRanges,temperatureK:{minimum:estimate.minTemperatureK,maximum:estimate.maxTemperatureK}});

  const temperatures=estimate.bins.map(b=>b.equilibriumK);

  output.textContent='Modeled generation '+estimate.energyWh.toFixed(1)+' Wh; load '+estimate.loadWh.toFixed(1)+' Wh; minimum initially full nominal battery '+estimate.minimumInitiallyFullBatteryWh.toFixed(1)+' Wh; isolated equilibrium '+Math.min(...temperatures).toFixed(1)+'–'+Math.max(...temperatures).toFixed(1)+' K. Transient temperature '+estimate.minTemperatureK.toFixed(1)+' to '+estimate.maxTemperatureK.toFixed(1)+' K; unserved load '+estimate.unservedWh.toFixed(1)+' Wh; final stored energy '+estimate.finalStoredWh.toFixed(1)+' Wh. Temperature bounds '+(estimate.temperatureLimitsPassed?'met':'exceeded')+'. Battery aging and temperature derating remain omitted.';

 }catch(error){renderHardwareThermal(panel,engineeringSettings(),applyThermal);output.textContent=error.message;}

}



export function engineeringEvidence(active,settings=engineeringSettings()){

 try{

  const {bins,...summary}=engineeringEstimate(active.samples,active.config.duration,settings);

  return summary;

 }catch(error){return {unavailable:error.message};}

}

