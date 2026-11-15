const rad=Math.PI/180;
export function earthOccultor(sun,earth){
 if(!Number.isFinite(sun.rangeKm)||!Number.isFinite(earth.rangeKm))return null;
 if(earth.rangeKm<=6378.137||sun.rangeKm<=695700)throw new Error('Invalid occultation ranges');
 const earthRadius=Math.asin(6378.137/earth.rangeKm)/rad;
 const solarRadius=Math.asin(695700/sun.rangeKm)/rad;
 const dot=(az,el)=>Math.sin(el*rad)*Math.sin(earth.el*rad)+Math.cos(el*rad)*Math.cos(earth.el*rad)*Math.cos((az-earth.az)*rad);
 const separation=Math.acos(Math.max(-1,Math.min(1,dot(sun.az,sun.el))))/rad;
 return {possible:earth.rangeKm<sun.rangeKm&&separation<earthRadius+solarRadius,earthRadiusDeg:earthRadius,separationDeg:separation,blocks:(az,el)=>dot(az,el)>Math.cos(earthRadius*rad)};
}
