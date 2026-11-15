export function comparisonAtUTC(entries,utc){
 const epoch=Date.parse(utc);if(!Number.isFinite(epoch))return entries.map(e=>({...e,available:false,reason:'Choose a calculated mission time first.'}));
 return entries.slice(0,3).map(e=>{
  if(!e.site||!e.result)return {...e,available:false,reason:e.reason??'Calculate this location for the current settings.'};
  const index=e.result.samples.findIndex(s=>Date.parse(s.utc)===epoch);
  if(index<0)return {...e,available:false,reason:'No exact sample at this UTC; no interpolation or nearest-site substitution.'};
  return {...e,available:true,index,sample:e.result.samples[index],height:e.result.config.height};
 });
}
export function comparisonRects(width,height,count){
 if(!Number.isInteger(count)||count<1||count>3)throw new Error('Compare one to three locations');
 const stacked=width<700;
 return Array.from({length:count},(_,i)=>stacked?{x:0,y:Math.floor(height*i/count),width,height:Math.floor(height*(i+1)/count)-Math.floor(height*i/count)}:{x:Math.floor(width*i/count),y:0,width:Math.floor(width*(i+1)/count)-Math.floor(width*i/count),height});
}
