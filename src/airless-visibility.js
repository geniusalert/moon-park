import {discFraction} from './engine.js';
const RAD=Math.PI/180,DEG=180/Math.PI;
// IAU 2015 nominal solar photospheric radius; angular size varies with range.
export function solarAngularRadius(rangeKm){
 if(!Number.isFinite(rangeKm)||rangeKm<=695700)throw new Error('Invalid Sun range');
 return Math.asin(695700/rangeKm)*DEG;
}
// Equal projected-area quadrature on the apparent solar disc. Each ray is
// mapped onto the celestial sphere rather than treating azimuth as flat x.
// Uniform photosphere: this is geometric visible area, not irradiance.
export function terrainDiscFraction(az,el,radius,horizon,rings=16,sectors=64,blocked=null){
 if(![az,el,radius].every(Number.isFinite)||el< -90||el>90||radius<=0||radius>=90||!Number.isInteger(rings)||rings<1||!Number.isInteger(sectors)||sectors<4)throw new Error('Invalid solar-disc geometry');
 const a=az*RAD,e=el*RAD,t=Math.tan(radius*RAD),ce=Math.cos(e),se=Math.sin(e),ca=Math.cos(a),sa=Math.sin(a);
 let visible=0;
 for(let r=0;r<rings;r++){const rho=Math.sqrt((r+.5)/rings)*t;
  for(let j=0;j<sectors;j++){const angle=2*Math.PI*(j+.5)/sectors,x=rho*Math.cos(angle),y=rho*Math.sin(angle);
   const north=ce*ca-x*sa-y*se*ca,east=ce*sa+x*ca-y*se*sa,up=se+y*ce;
   const rayAz=(Math.atan2(east,north)*DEG+360)%360,rayEl=Math.atan2(up,Math.hypot(north,east))*DEG;
   if(rayEl>horizon(rayAz)&&!blocked?.(rayAz,rayEl))visible++;
  }
 }
 return visible/(rings*sectors);
}
export function solarVisibility(sample,horizon,options={}){
 const radius=Number.isFinite(sample.rangeKm)?solarAngularRadius(sample.rangeKm):.2666;
 // Fixed-radius fallback is for legacy prepared data without target ranges.
 const fraction=options.terrainDisc?terrainDiscFraction(sample.az,sample.el,radius,horizon):discFraction(sample.el-horizon(sample.az),radius);
 const refinementDelta=options.terrainDisc&&fraction>0&&fraction<1?Math.abs(fraction-terrainDiscFraction(sample.az,sample.el,radius,horizon,8,32)):0;
 return {fraction,refinementDelta,radiusDeg:radius,radiusSource:Number.isFinite(sample.rangeKm)?'range-dependent nominal solar radius':'legacy fixed angular radius',method:options.terrainDisc?'1024 equal projected-area rays across spherical apparent disc':'straight skyline circular segment'};
}
