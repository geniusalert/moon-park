// Pure interval calculations. Samples describe the start of each half-open bin.
export function compileHorizon(profile){
 if(!profile.length) throw new Error('Missing horizon coverage');
 const p=[...profile].sort((a,b)=>a.az-b.az);
 if(p.some((x,i)=>!Number.isFinite(x.az)||!Number.isFinite(x.el)||x.az<0||x.az>=360||(i&&x.az===p[i-1].az)))throw new Error('Invalid horizon');
 return azimuth=>{
  if(!Number.isFinite(azimuth))throw new Error('Invalid azimuth');
  let az=((azimuth%360)+360)%360;
  if(az<p[0].az)az+=360;
  let lo=0,hi=p.length;
  while(lo+1<hi){const mid=(lo+hi)>>1;if(p[mid].az<=az)lo=mid;else hi=mid;}
  const a=p[lo],b=lo+1<p.length?p[lo+1]:{az:p[0].az+360,el:p[0].el};
  return a.el+(b.el-a.el)*(az-a.az)/(b.az-a.az);
 };
}
export function horizonAt(profile,azimuth){return compileHorizon(profile)(azimuth);}
export function discFraction(clearance,radius=0.2666){
 if(!Number.isFinite(clearance)||!Number.isFinite(radius)||radius<=0)throw new Error('Invalid disc geometry');
 const x=Math.max(-1,Math.min(1,clearance/radius));
 return (Math.acos(-x)+x*Math.sqrt(1-x*x))/Math.PI;
}
export function intervals(samples,key,end){
 const result=[];let start=null;
 for(const s of samples){if(s[key]&&start===null)start=s.hour;if(!s[key]&&start!==null){result.push([start,s.hour]);start=null;}}
 if(start!==null)result.push([start,end]);return result;
}
export function summarize(samples,duration,maxDark=12,minOverlap=8){
 if(!Number.isFinite(duration)||!Number.isFinite(maxDark)||!Number.isFinite(minOverlap)||maxDark<0||minOverlap<0||!samples.length||samples[0].hour!==0||duration<=0||samples.some((s,i)=>!Number.isFinite(s.hour)||s.hour<0||s.hour>=duration||(i&&s.hour<=samples[i-1].hour)))throw new Error('Invalid sampling grid');
 const sum=key=>intervals(samples,key,duration).reduce((n,[a,b])=>n+b-a,0);
 const dark=intervals(samples.map(s=>({...s,dark:!s.sun})), 'dark',duration);
 const longestDark=Math.max(0,...dark.map(([a,b])=>b-a));
 const overlap=sum('both'),failures=[];
 if(longestDark>maxDark)failures.push(`Longest darkness ${longestDark.toFixed(1)} h exceeds ${maxDark} h`);
 if(overlap<minOverlap)failures.push(`Combined availability ${overlap.toFixed(1)} h is below ${minOverlap} h`);
 return {sunHours:sum('sun'),earthHours:sum('earth'),overlap,longestDark,feasible:!failures.length,failures};
}
export const sites=[{id:'ridge',name:'Ridge analogue A',phase:0,base:0.4},{id:'rim',name:'Crater-rim analogue B',phase:0.6,base:1.2},{id:'plateau',name:'Plateau analogue C',phase:1.2,base:0.8}];
export function profileFor(site){return Array.from({length:72},(_,i)=>({az:i*5,el:site.base+1.2*Math.sin(i*0.2+site.phase)**2+0.8*Math.cos(i*0.45)**6}));}
export function simulate(site,{delay=0,duration=72,maxDark=12,minOverlap=8,offset=0}={}){
 const profile=profileFor(site),samples=[];
 for(let hour=0;hour<duration;hour+=0.5){
  const t=hour+delay,az=(t*2+site.phase*60)%360;
  // Deliberately artificial signals: exercise software, never lunar ephemerides.
  const sunEl=1.5+2.5*Math.sin(t/22+site.phase),earthEl=2+1.6*Math.cos(t/30+site.phase);
  const horizon=horizonAt(profile,az)+offset,earthHorizon=horizonAt(profile,20)+offset;
  const fraction=discFraction(sunEl-horizon),sun=fraction>=0.5,earth=earthEl>earthHorizon;
  samples.push({hour,az,sunEl,earthEl,horizon,sunFraction:fraction,sun,earth,both:sun&&earth});
 }
 return {site,samples,profile,...summarize(samples,duration,maxDark,minOverlap)};
}
