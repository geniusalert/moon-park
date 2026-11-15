// Moon Park: sage/ochre scientific overlays on a charcoal interface.
export const SLOPE_BANDS=[{max:10,color:'#aec4aa',label:'0–10°'},{max:20,color:'#d5c58e',label:'10–20°'},{max:30,color:'#c99966',label:'20–30°'},{max:Infinity,color:'#b97058',label:'≥30°'}];
export const MISSING_COLOR='#68716b';
export function slopeColor(angle){return Number.isFinite(angle)?SLOPE_BANDS.find(b=>angle<b.max).color:MISSING_COLOR;}
export function elevationColor(value,min,max){
 if(![value,min,max].every(Number.isFinite))return MISSING_COLOR;
 const t=max>min?Math.max(0,Math.min(1,(value-min)/(max-min))):.5;
 const stops=[[64,78,65],[143,163,126],[230,216,172]],u=t<.5?t*2:(t-.5)*2,a=stops[t<.5?0:1],b=stops[t<.5?1:2];
 return '#'+a.map((v,i)=>Math.round(v+(b[i]-v)*u).toString(16).padStart(2,'0')).join('');
}
