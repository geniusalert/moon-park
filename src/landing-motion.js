export const TOUCHDOWN_SECONDS=58;
export const LANDING_DURATION=66;
export function landingPose(seconds){
 const time=Math.max(0,Math.min(LANDING_DURATION,Number.isFinite(seconds)?seconds:0));
 const u=Math.min(1,time/TOUCHDOWN_SECONDS),remaining=1-u;
 const altitude=180*remaining**2.2;
 return {time,x:90*remaining**2.4,z:65*remaining**2.4,altitude,
  descentSpeed:time>=TOUCHDOWN_SECONDS?0:180*2.2/TOUCHDOWN_SECONDS*remaining**1.2,
  tilt:0.16*Math.sin(Math.PI*u)*remaining,
  phase:time>=TOUCHDOWN_SECONDS?'Touchdown':altitude<12?'Final descent':altitude<80?'Braking':'Approach',
  engine:time<TOUCHDOWN_SECONDS,
  dust:altitude<16?Math.max(0,Math.min(1,(16-altitude)/16))*(time>TOUCHDOWN_SECONDS?Math.max(0,1-(time-TOUCHDOWN_SECONDS)/3):1):0};
}
