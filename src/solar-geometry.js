// Centre-ray geometric projection, not electrical power or disc-integrated irradiance.
export function solarGeometry(sample){
 const {sunEl,horizon,sunFraction}=sample;
 if(![sunEl,horizon,sunFraction].every(Number.isFinite)||sunEl< -90||sunEl>90||sunFraction<0||sunFraction>1)throw new Error('Invalid solar geometry');
 const horizontalProjection=Math.max(0,Math.sin(sunEl*Math.PI/180));
 const centerVisible=sunEl>horizon;
 return {elevationDeg:sunEl,horizonDeg:horizon,clearanceDeg:sunEl-horizon,visibleDiscFraction:sunFraction,incidenceDeg:90-sunEl,horizontalProjection,unblockedCenterProjection:centerVisible?horizontalProjection:0,centerVisible,refraction:'none'};
}
export function summarizeSolar(samples,duration){
 if(!samples.length||!Number.isFinite(duration)||duration<=0)throw new Error('Invalid solar interval');
 let equivalentHours=0,min=Infinity,max=-Infinity;
 for(let i=0;i<samples.length;i++){
  const s=samples[i],end=i+1<samples.length?samples[i+1].hour:duration;
  if(!Number.isFinite(s.hour)||s.hour<0||end<=s.hour||end>duration)throw new Error('Invalid solar sample interval');
  const g=solarGeometry(s);equivalentHours+=g.unblockedCenterProjection*(end-s.hour);min=Math.min(min,s.sunEl);max=Math.max(max,s.sunEl);
 }
 return {minimumElevationDeg:min,maximumElevationDeg:max,meanUnblockedHorizontalProjection:equivalentHours/duration,equivalentNormalIncidenceHours:equivalentHours,method:'Airless centre-ray projection max(0, sin(elevation)), zero when centre is blocked; half-open time bins. Not disc-integrated irradiance or electrical energy.'};
}
