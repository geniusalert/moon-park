import {advanceThermalTemperature,validateThermalParameters} from './thermal-model.js';
/** First-order engineering estimates with explicit user-supplied assumptions. */

export function engineeringEstimate(samples,duration,p){

 const required=['areaM2','efficiency','derating','tiltDeg','azimuthDeg','loadW','chargeEfficiency','dischargeEfficiency','usableFraction','absorptivity','emissivity','radiatingAreaM2','internalHeatW'];

 if(required.some(k=>!Number.isFinite(p[k])))throw new Error('Supply every engineering assumption');

 if(p.areaM2<=0||p.radiatingAreaM2<=0||p.loadW<0||p.internalHeatW<0||p.tiltDeg<0||p.tiltDeg>180)throw new Error('Invalid engineering geometry or load');

 for(const k of ['efficiency','derating','chargeEfficiency','dischargeEfficiency','usableFraction','absorptivity','emissivity'])if(p[k]<0||p[k]>1||(['chargeEfficiency','dischargeEfficiency','usableFraction','emissivity'].includes(k)&&p[k]===0))throw new Error('Fractions must be within zero and one; charge/discharge efficiency, usable storage and emissivity must be positive');

 if(!Number.isFinite(duration)||!samples.length||samples[0].hour!==0||duration<=0)throw new Error('Incomplete mission timeline');

 const d={capacityWh:1000,initialChargeFraction:1,maxChargeW:500,maxDischargeW:500,activeLoadW:p.loadW,activeHours:0,loadPeriodHours:24,heatCapacityJK:10000,initialTemperatureK:250,groundTemperatureK:100,groundViewFactor:0,conductanceWK:0,temperatureCoefficientPerK:0,referenceTemperatureK:298.15,minTemperatureK:100,maxTemperatureK:400,...p};

 for(const k of Object.keys(d))if(!Number.isFinite(d[k]))throw new Error('Engineering assumptions must be finite');

 if(d.capacityWh<=0||d.initialChargeFraction<0||d.initialChargeFraction>1||d.maxChargeW<0||d.maxDischargeW<0||d.activeLoadW<0||d.activeHours<0||d.loadPeriodHours<=0||d.activeHours>d.loadPeriodHours||d.heatCapacityJK<=0||d.initialTemperatureK<=0||d.groundTemperatureK<0||d.groundViewFactor<0||d.groundViewFactor>1||d.conductanceWK<0||d.minTemperatureK<0||d.maxTemperatureK<=d.minTemperatureK)throw new Error('Invalid storage or thermal assumptions');

 validateThermalParameters(d);
 const thermalForcingRanges=Object.fromEntries(['irradianceWm2','internalHeatW','electricalW','groundTemperatureK','skyTemperatureK'].map(key=>[key,{minimum:Infinity,maximum:-Infinity}]));
 let energyWh=0,deficitWh=0,requiredUsableWh=0,loadWh=0,unservedWh=0,temperatureK=d.initialTemperatureK;

 const capacity=d.capacityWh*p.usableFraction;

 let storedWh=capacity*d.initialChargeFraction,minStoredWh=storedWh,minTemperatureK=temperatureK,maxTemperatureK=temperatureK;

 const bins=samples.map((s,i)=>{

  const hours=(samples[i+1]?.hour??duration)-s.hour;

  if(s.sunFraction<0||s.sunFraction>1||!Number.isFinite(hours)||hours<=0||!Number.isFinite(s.sunRangeKm)||s.sunRangeKm<=0||![s.sunEl,s.az,s.sunFraction].every(Number.isFinite))throw new Error('Invalid engineering sample');

  const rad=Math.PI/180;

  const incidence=Math.max(0,Math.sin(s.sunEl*rad)*Math.cos(p.tiltDeg*rad)+Math.cos(s.sunEl*rad)*Math.sin(p.tiltDeg*rad)*Math.cos((s.az-p.azimuthDeg)*rad));

  const irradianceWm2=1361*(149597870.7/s.sunRangeKm)**2*incidence*s.sunFraction;

  let binEnergy=0;

  const steps=Math.ceil(hours*3600/60),dt=hours*3600/steps;

  for(let step=0;step<steps;step++){

   const hour=s.hour+(step+.5)*dt/3600;

   const load=hour%d.loadPeriodHours<d.activeHours?d.activeLoadW:p.loadW;

   const efficiency=Math.max(0,Math.min(p.derating>0?Math.min(1,p.absorptivity/p.derating):1,p.efficiency*(1+d.temperatureCoefficientPerK*(temperatureK-d.referenceTemperatureK))));

   const power=irradianceWm2*p.areaM2*efficiency*p.derating;

   const net=power-load,h=dt/3600;

   binEnergy+=power*h;loadWh+=load*h;

   deficitWh=Math.max(0,deficitWh+(net<0?-net/p.dischargeEfficiency:-net*p.chargeEfficiency)*h);

   requiredUsableWh=Math.max(requiredUsableWh,deficitWh);

   if(net>=0)storedWh=Math.min(capacity,storedWh+Math.min(net,d.maxChargeW)*p.chargeEfficiency*h);

   else{

    const delivered=Math.min(-net,d.maxDischargeW,storedWh*p.dischargeEfficiency/h);

    storedWh=Math.max(0,storedWh-delivered*h/p.dischargeEfficiency);

    unservedWh+=(-net-delivered)*h;

   }

   minStoredWh=Math.min(minStoredWh,storedWh);

   const forcing={irradianceWm2,internalHeatW:d.internalHeatW,electricalW:power,groundTemperatureK:d.groundTemperatureK,skyTemperatureK:0};
   for(const [key,value] of Object.entries(forcing)){const bounds=thermalForcingRanges[key];bounds.minimum=Math.min(bounds.minimum,value);bounds.maximum=Math.max(bounds.maximum,value);}
   temperatureK=advanceThermalTemperature(temperatureK,dt,d,forcing);
   minTemperatureK=Math.min(minTemperatureK,temperatureK);maxTemperatureK=Math.max(maxTemperatureK,temperatureK);

  }

  energyWh+=binEnergy;

  const equilibriumK=((irradianceWm2*p.areaM2*p.absorptivity+p.internalHeatW)/(p.emissivity*5.670374419e-8*p.radiatingAreaM2))**.25;

  return {hour:s.hour,powerW:binEnergy/hours,equilibriumK,temperatureK,storedWh};

 });

 return {energyWh,loadWh,unservedWh,minStoredWh,finalStoredWh:storedWh,minTemperatureK,maxTemperatureK,thermalForcingRanges,temperatureLimitsPassed:minTemperatureK>=d.minTemperatureK&&maxTemperatureK<=d.maxTemperatureK,minimumInitiallyFullBatteryWh:requiredUsableWh/p.usableFraction,bins,assumptions:d,limitations:['Fixed panel, uniform solar disc and centre-direction incidence approximation; supplied temperature coefficient is linear.','Minimum initially full battery is an energy-only lower bound. Storage simulation includes supplied initial charge, power limits and periodic load. Battery aging and temperature derating are omitted.','Transient lumped body uses supplied heat capacity, fixed ground temperature/view factor and conductance; no reflected sunlight, spatial temperature gradients or measured regolith coupling. Equilibrium reference is a separate isolated-body calculation.']};

}

