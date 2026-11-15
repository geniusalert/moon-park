/** Shared single-node gray-body heat balance, integrated with backward Euler. */
export const THERMAL_MODEL_VERSION='lumped-gray-body-2';
export const THERMAL_KEYS=['areaM2','absorptivity','emissivity','radiatingAreaM2','conductanceWK','groundViewFactor','heatCapacityJK'];
export function validateThermalParameters(p){
 if(THERMAL_KEYS.some(key=>!Number.isFinite(p[key])))throw new Error('Supply finite thermal properties');
 if(p.areaM2<=0||p.radiatingAreaM2<=0||p.heatCapacityJK<=0||p.conductanceWK<0||p.absorptivity<0||p.absorptivity>1||p.emissivity<=0||p.emissivity>1||p.groundViewFactor<0||p.groundViewFactor>1)throw new Error('Invalid thermal properties');
 return Object.fromEntries(THERMAL_KEYS.map(key=>[key,p[key]]));
}
export function advanceThermalTemperature(temperatureK,seconds,p,f){
 if(!Number.isFinite(temperatureK)||temperatureK<0||!Number.isFinite(seconds)||seconds<=0)throw new Error('Invalid thermal state or time step');
 for(const key of ['irradianceWm2','internalHeatW','electricalW','groundTemperatureK','skyTemperatureK'])if(!Number.isFinite(f[key])||f[key]<0)throw new Error('Invalid thermal boundary conditions');
 const sigmaArea=p.emissivity*5.670374419e-8*p.radiatingAreaM2;
 const incoming=f.irradianceWm2*p.areaM2*p.absorptivity+f.internalHeatW-f.electricalW+sigmaArea*(p.groundViewFactor*f.groundTemperatureK**4+(1-p.groundViewFactor)*f.skyTemperatureK**4);
 if(!Number.isFinite(incoming)||!Number.isFinite(sigmaArea)||sigmaArea<=0)throw new Error('Thermal boundary values exceed the numerical range');
 if(incoming<0)throw new Error('Electrical extraction exceeds supplied absorbed heat');
 const residual=t=>p.heatCapacityJK*(t-temperatureK)/seconds-incoming+sigmaArea*t**4+p.conductanceWK*(t-f.groundTemperatureK);
 let lo=0,hi=Math.max(1000,temperatureK*2);
 while(residual(hi)<0){hi*=2;if(!Number.isFinite(hi))throw new Error('Thermal boundary cannot be resolved');}
 for(let iteration=0;iteration<40;iteration++){const mid=(lo+hi)/2;if(residual(mid)>0)hi=mid;else lo=mid;}
 return (lo+hi)/2;
}
