export function displayTerrainStats(tile){
 if(!tile)return null;
 const values=tile.z.flat().filter(Number.isFinite);if(!values.length)return null;
 const slopes=tile.z.map(row=>row.map(()=>null));let maxSlope=0,count=0;
 for(let r=1;r<tile.height-1;r++)for(let c=1;c<tile.width-1;c++){
  const z=[tile.z[r][c],tile.z[r][c-1],tile.z[r][c+1],tile.z[r-1][c],tile.z[r+1][c]];
  if(!z.every(Number.isFinite))continue;
  const dx=tile.x[c+1]-tile.x[c-1],dy=tile.y[r+1]-tile.y[r-1];if(!dx||!dy)continue;
  const angle=Math.atan(Math.hypot((z[2]-z[1])/dx,(z[4]-z[3])/dy))*180/Math.PI;
  slopes[r][c]=angle;maxSlope=Math.max(maxSlope,angle);count++;
 }
 return {minimumM:Math.min(...values),maximumM:Math.max(...values),reliefM:Math.max(...values)-Math.min(...values),maxSlopeDeg:count?maxSlope:null,slopes,validCells:values.length};
}
export function earthMotion(samples){
 const finite=(key)=>samples.map(s=>s[key]).filter(Number.isFinite);
 const range=key=>{const a=finite(key);return a.length?{min:Math.min(...a),max:Math.max(...a)}:null;};
 let sweep=0;for(let i=1;i<samples.length;i++)sweep+=((samples[i].earthAz-samples[i-1].earthAz+540)%360)-180;
 return {elevation:range('earthEl'),clearance:range('earthCenterClearanceDeg'),rangeKm:range('earthRangeKm'),azimuthSweepDeg:sweep};
}
export function renderTerrainDynamics(container,site,active,sample){
 container.replaceChildren();const add=(tag,text)=>{const e=document.createElement(tag);e.textContent=text;container.append(e);};
 add('h3','Measured relief and moving Earth');
 if(site.analysisModel==='reference-sphere')add('p','Smooth sphere mode: no measured slopes, crater depths or local terrain shadows. Choose a supported polar terrain calculation to investigate actual topography.');
 else {const t=displayTerrainStats(site.display);if(t)add('p',`Display patch relief: ${t.reliefM.toFixed(1)} m from lowest to highest sampled elevation; maximum sampled display-grid slope ${t.maxSlopeDeg?.toFixed(1)??'unavailable'}°. Elevation colors span this patch only. Slope colors use fixed 0–10°, 10–20°, 20–30°, ≥30° bands. Boundary/missing slopes are gray. Slopes use projected display-grid spacing, without projection-scale correction: descriptive, not a landing-hazard assessment. This is not a measured crater depth. Display spacing ${site.display.pixelM??Math.abs(site.display.x[1]-site.display.x[0])} m; calculation terrain detail is separately recorded.`);}
 const motion=earthMotion(active.samples),show=r=>r?`${r.min.toFixed(3)} to ${r.max.toFixed(3)}`:'not available';
 add('p',`During this inspected mission: Earth elevation ${show(motion.elevation)}°; centre clearance ${show(motion.clearance)}°; signed unwrapped azimuth change ${motion.azimuthSweepDeg.toFixed(3)}°. Earth range ${motion.rangeKm?`${motion.rangeKm.min.toFixed(0)}–${motion.rangeKm.max.toFixed(0)} km`:'unavailable in this retained observation set'}. These changes combine orbital motion, lunar orientation and observer geometry; they are not isolated libration angles.`);
 add('p',`At replay time ${sample.utc}, Earth ${sample.earth?'clears':'is blocked by'} the modeled horizon. Coordinate-specific JPL Horizons high-precision lunar orientation or the recorded SPICE lunar frame supplies time-dependent positions. Libration and orbital variations are included by that source model, not added again as an artificial wobble. Consult the source identity and frame; short intervals may show only small changes.`);
 add('p','Terrain lighting is surface shading, not a computed shadow map. Visibility uses the independent curved terrain rays and solar-disc model. Neither dark shading nor a steep display slope establishes permanent shadow, thermal survival or landing safety.');
}
