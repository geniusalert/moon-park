import {ImageryContext} from './imagery-context.js';
import {RegionStudy} from './region-study.js';
import {verifiedJSON} from './candidate-model.js';
import {SpatialNavigator} from './spatial-view.js';
import {evaluateMission,findRecovery,scheduleActivity,receipt} from './mission.js';
import {attachTerrainVariants,analyzeSite,rankStability,findRobustRecovery} from './robustness.js';
import {compileHorizon} from './engine.js';
const $=id=>document.getElementById(id),fmt=n=>n.toFixed(1);
let navigatorView=null,regionStudy=null;
let dataset,results=[],config,recovery,ranking,earth=false,timer;

function render(){
 if(!dataset)return;
 try{
  config={startUTC:$('start').value+'T00:00:00Z',delay:Number($('delay').value),duration:Number($('duration').value),height:Number($('height').value),maxDark:Number($('dark').value),minOverlap:Number($('overlap').value)};
  if(!$('dark').value||!$('overlap').value)throw new Error('Enter both mission limits');
  const next=dataset.sites.map(site=>({site,baseline:evaluateMission(site,{...config,delay:0}),delayed:evaluateMission(site,config),localOnly:site.localProfiles?evaluateMission({...site,profiles:site.localProfiles},config):null,sensitivity:[-.25,.25].map(offset=>evaluateMission(site,{...config,offset}).modelPass),robustness:analyzeSite(site,config)}));
  const found=findRobustRecovery(dataset.sites,config,{heights:[2,5,10].filter(h=>h>=config.height)});results=next;recovery=found;ranking=rankStability(next.map(r=>r.robustness));
  $('error').hidden=true;$('delayValue').value=`+${config.delay} h`;
  $('cards').innerHTML=results.map(({site,baseline:b,delayed:d,sensitivity,localOnly})=>`<article class="card"><div class="card-head"><button data-site="${site.id}">${site.name} ↗</button><span class="badge ${d.modelPass?'':'fail'}">${d.modelPass?'MODEL PASSES':'MODEL FAILS'}</span></div><div class="metrics">${[['Sun available','sunHours'],['Combined availability','overlap'],['Longest darkness','longestDark']].map(([label,key])=>`<div class="metric"><span>${label}</span><strong><em>${fmt(b[key])} → </em>${fmt(d[key])} h</strong></div>`).join('')}</div><div class="timeline" aria-label="Green: Sun and Earth; gold: Sun only; blue: Earth only; dark: neither">${d.samples.map(s=>`<i class="${s.both?'both':s.sun?'sun':s.earth?'earth':''}" title="${s.utc}: Sun ${s.sun}, Earth ${s.earth}"></i>`).join('')}</div><p class="reason">${d.failures.length?d.failures.join(' · '):'Configured limits pass in the terrain model.'}<br>Full feasibility remains unknown.${localOnly?`<br>Adding regional terrain: overlap ${fmt(localOnly.overlap)} → ${fmt(d.overlap)} h; sunlight ${fmt(localOnly.sunHours)} → ${fmt(d.sunHours)} h.`:''}</p></article>`).join('');
  document.querySelectorAll('[data-site]').forEach(b=>b.onclick=()=>{regionStudy?.clear();$('site').value=b.dataset.site;inspect();});
  $('quality').innerHTML=`<h2>How stable is this decision?</h2><p class="muted">Four selected published terrain realizations within 2 km of each point. Terrain farther away stays fixed. Four resolution checks are reported separately. Current tests use 10-minute bins. Counts and ranges are not probabilities.</p><p>${ranking.status==='stable-tested-preference'?`Preferred across these tests: ${dataset.sites.find(s=>s.id===ranking.possiblePreferredSites[0]).name}.`:ranking.status==='near-sampling-limit'?'The preferred point is near a timing limit; refine the observations.':ranking.status==='unavailable'?'Terrain stability analysis is unavailable.':ranking.status==='no-passing-choice'?'No tested choice meets these requirements.':'No unique preferred point across the tested cases; rankings are sensitive or tied.'}</p><table><thead><tr><th>Point</th><th>Nominal / possible rank</th><th>Near-field clones passing</th><th>Resolution checks passing</th></tr></thead><tbody>${results.map(r=>{const q=r.robustness,row=ranking.rows.find(x=>x.siteId===r.site.id);return `<tr><td>${r.site.name}<br><small>${({'passes-all-tested':'Passes every clone/resolution case','fails-all-tested':'Fails every clone/resolution case',sensitive:'Changes across tests',unavailable:'Not evaluated'})[q.status]}${q.nearSamplingLimit?' · near timing limit':''}</small></td><td>${row?`${row.nominalRank} / ${row.bestRank}–${row.worstRank}`:'Unavailable'}</td><td>${q.families.clone?.ranges?`${q.families.clone.passing}/${q.families.clone.tested}<br><small>Sun ${fmt(q.families.clone.ranges.sunHours.min)}–${fmt(q.families.clone.ranges.sunHours.max)} h<br>Overlap ${fmt(q.families.clone.ranges.overlap.min)}–${fmt(q.families.clone.ranges.overlap.max)} h</small>`:'Unavailable'}</td><td>${q.families.numerical?.ranges?`${q.families.numerical.passing}/${q.families.numerical.tested}<br><small>Sun ${fmt(q.families.numerical.ranges.sunHours.min)}–${fmt(q.families.numerical.ranges.sunHours.max)} h<br>Overlap ${fmt(q.families.numerical.ranges.overlap.min)}–${fmt(q.families.numerical.ranges.overlap.max)} h</small>`:'Unavailable'}</td></tr>`;}).join('')}</tbody></table><p class="muted">Requirements first, then combined hours; differences within 10 minutes count as ties. Rank spans use independent per-site tested bounds, with no assumed cross-site clone pairing.</p>`;
  $('recovery').innerHTML=recovery.candidates.length?`<table><thead><tr><th>Research point</th><th>Height</th><th>Extra delay</th><th>Overlap</th><th>Tested support</th><th></th></tr></thead><tbody>${recovery.candidates.slice(0,6).map(c=>`<tr><td>${c.name}</td><td>${c.height} m</td><td>+${c.extraHours} h</td><td>${fmt(c.overlap)} h</td><td>${c.cloneSupport?.passing??0}/${c.cloneSupport?.tested??0} clones<br>${c.numericalSupport?.passing??0}/${c.numericalSupport?.tested??0} numerical${c.nearSamplingLimit?'<br>Near timing limit':''}</td><td><button data-recover="${c.siteId}" data-delay="${c.delayHours}" data-height="${c.height}">Inspect</button></td></tr>`).join('')}</tbody></table><p class="muted">${recovery.candidates.length} nominal passes / ${recovery.tested} attempted combinations; ${recovery.rejected.length} unavailable. ${recovery.passingAllTested} pass all tested cases. These appear first, then earliest extra delay, lowest height and most overlap. No certified recommendations.</p>`:'<p>No tested combination passes these terrain-model limits. Explore another date or different requirements.</p>';
  document.querySelectorAll('[data-recover]').forEach(b=>b.onclick=()=>{regionStudy?.clear();$('site').value=b.dataset.recover;$('height').value=b.dataset.height;$('delay').max=Math.max(144,Number(b.dataset.delay));$('delay').value=b.dataset.delay;render();});
  const fine=dataset.uncertainty?.fineStudy;
  if(fine)$('quality').insertAdjacentHTML('beforeend',`<details><summary>Separate one-minute Shackleton study</summary><p>Arrival 21 November 2026, delayed 48 h; 72 h mission at 2 m. Sunlight varies by ${fmt(fine.cloneSunlightSpreadMinutes)} minutes across the four nearby-terrain cases, and ${fmt(fine.numericalSunlightSpreadMinutes)} minutes across resolution checks. These changes were hidden by the 10-minute bins.</p><p>A constructed test with a ${fine.constructedThresholdProbe.config.maxDark.toFixed(2)} h darkness limit and zero required Earth overlap passes in ${fine.constructedThresholdProbe.analysis.families.clone.passing}/4 selected clones. This hypothetical limit illustrates sensitivity; it is separate from your current inputs.</p><p><a href="/docs/uncertainty-validation.json">Inspect the full benchmark ↗</a></p></details>`);
  $('time').max=results[0].delayed.samples.length-1;$('time').value=Math.min(Number($('time').value),Number($('time').max));
  $('export').disabled=false;$('report').disabled=false;inspect();
 }catch(e){$('decisionSummary').textContent='Enter valid mission inputs to recompute this comparison.';$('error').hidden=false;$('error').textContent=e.message;$('export').disabled=true;$('report').disabled=true;$('quality').textContent='Enter valid mission inputs to recompute stability.';}
}
function inspect(){
 const r=results.find(r=>r.site.id===$('site').value);if(!r)return;
 const s=r.site;
 $('provenance').innerHTML=`<p>${s.latitude.toFixed(6)}° latitude, ${s.longitude.toFixed(6)}° east longitude; ground ${s.groundM.toFixed(2)} m above the 1737.4 km reference sphere. Demonstration research point, not a certified landing site.</p><p><a href="${s.provenance.url}">Source DEM ↗</a> · ${s.provenance.analysisPixelM} m local analysis · ${s.provenance.azimuthStepDeg}° rays · ${(s.provenance.maxRadiusM/1000).toFixed(0)} km radius.<br>Minimum ray coverage: ${(Math.min(...s.profiles[String(config.height)].map(p=>p.coverageM))/1000).toFixed(2)} km. Terrain outside coverage remains unmodeled.</p><p>DEM SHA-256: <code>${s.provenance.sha256}</code><br>Geometry: ${s.ephemerisProvenance.sun.frame}. ${s.frameCheck?`Horizons cross-check maximum elevation difference: Sun ${(s.frameCheck.sun.maxElDifferenceDeg*3600).toFixed(3)} arcsec; Earth ${(s.frameCheck.earth.maxElDifferenceDeg*3600).toFixed(3)} arcsec.`:'Frame cross-check pending.'}</p><p><a href="${s.ephemerisProvenance.sun.referenceHorizons?.url??s.ephemerisProvenance.sun.url}">Horizons Sun reference ↗</a> · <a href="${s.ephemerisProvenance.earth.referenceHorizons?.url??s.ephemerisProvenance.earth.url}">Horizons Earth reference ↗</a> · <a href="https://pgda.gsfc.nasa.gov/products/90">Regional terrain documentation ↗</a></p>`;
 try{
  const hours=Number($('activity').value),w=scheduleActivity(r.delayed,hours);
  const common=r.robustness.commonWindows?scheduleActivity({...r.delayed,combinedWindows:r.robustness.commonWindows},hours):null;
  $('export').disabled=!$('error').hidden;
  $('schedule').innerHTML=`<p class="muted">Nominal schedule: ${w.length} available interval(s). Common to nominal + all eight tested variants: ${common===null?'analysis unavailable':common.length+' interval(s)'}. The near-field scope and fixed outer terrain still apply.</p>`+(common?.length?common.slice(0,4).map(w=>`<p class="reason">${w.startUTC.replace('T',' ').replace('.000Z',' UTC')} · ${hours} h fits within ${fmt(w.availableUntilHour-w.startHour)} h shared by every tested case.</p>`).join(''):w.length?'<p>A nominal activity fits, but no common activity interval has been established across all tested cases.</p>':'<p>No continuous combined window fits this activity.</p>');
 }catch(e){$('schedule').textContent=e.message;$('export').disabled=true;}
 chart();
}
function chart(){
 const r=results.find(r=>r.site.id===$('site').value);if(!r)return;
 const d=r.delayed,s=d.samples[Number($('time').value)],ek=earth?'earthEl':'sunEl',hk=earth?'earthHorizon':'horizon';
 const cloneAngles=(r.site.terrainVariants??[]).filter(v=>v.family==='clone').map(v=>compileHorizon(v.profiles[String(config.height)]));
 const band=cloneAngles.length?d.samples.map(s=>{const values=cloneAngles.map(at=>at(earth?s.earthAz:s.az));return {hour:s.hour,min:Math.min(...values),max:Math.max(...values)};}):[];
 const vals=[...d.samples.flatMap(s=>[s[ek],s[hk]]),...band.flatMap(b=>[b.min,b.max])],lo=Math.floor(Math.min(...vals)-.5),hi=Math.ceil(Math.max(...vals)+.5);
 const x=h=>45+h/config.duration*730,y=e=>165-(e-lo)/(hi-lo)*145;
 const path=k=>d.samples.map((s,i)=>`${i?'L':'M'}${x(s.hour)},${y(s[k])}`).join(' ');
 const bandPath=band.length?band.map((b,i)=>`${i?'L':'M'}${x(b.hour)},${y(b.max)}`).join(' ')+[...band].reverse().map(b=>`L${x(b.hour)},${y(b.min)}`).join(' ')+'Z':'';
 $('horizon').innerHTML=`${Array.from({length:5},(_,i)=>lo+(hi-lo)*i/4).map(v=>`<line x1="45" x2="775" y1="${y(v)}" y2="${y(v)}" stroke="#34443a"/><text x="0" y="${y(v)+4}" fill="#99ad9c" font-size="10">${v.toFixed(1)}°</text>`).join('')}<path d="${path(hk)}" fill="none" stroke="#88a58d" stroke-width="2"/><path d="${path(ek)}" fill="none" stroke="#edcc8b" stroke-width="2"/><line x1="${x(s.hour)}" x2="${x(s.hour)}" y1="20" y2="165" stroke="#eee" stroke-dasharray="3 3"/>${[0,.25,.5,.75,1].map(f=>`<text x="${x(f*config.duration)}" y="198" fill="#99ad9c" font-size="10">${f*config.duration}h</text>`).join('')}`;
 $('timeValue').value=fmt(s.hour)+' h';const az=earth?s.earthAz:s.az,profile=r.site.profiles[String(config.height)],step=r.site.provenance.azimuthStepDeg,ray=profile[Math.round(az/step)%profile.length];
 if(bandPath)$('horizon').insertAdjacentHTML('afterbegin',`<path d="${bandPath}" fill="#c9e2aa" fill-opacity="0.22" stroke="none"/>`);
 $('horizon').setAttribute('aria-label',`${earth?'Earth':'Sun'} elevation and terrain horizon; shaded range of four conditional near-field clone horizons`);
 $('explanation').textContent=`${s.utc.replace('T',' ').replace('Z',' UTC')} · ${earth?'Earth':'Sun'} elevation ${s[ek].toFixed(3)}°, azimuth ${az.toFixed(2)}°. Terrain horizon ${s[hk].toFixed(3)}°. Nearest ${step}° ray's strongest obstruction is ${fmt(ray.distanceM/1000)} km away (${ray.source??'local terrain'}). ${earth?(s.earth?'Earth center clears modeled terrain.':'Earth center is obscured.'):`${Math.round(s.sunFraction*100)}% solar disc visible in the model.`}`;
 $('spatialTime').max=$('time').max;$('spatialTime').value=$('time').value;
 const region=regionStudy?.update(config,Number($('time').value));
 if(region)navigatorView?.update(region.site,region.sample,region.height,region.profile);else navigatorView?.update(r.site,s,config.height,profile);
 const selected=region?regionStudy.rows.find(row=>row.site.id===region.site.id):r,b=selected.baseline,after=selected.delayed;
 $('decisionTitle').textContent=selected.site.name;
 $('decisionSummary').textContent=`Combined Sun + Earth: ${b.overlap.toFixed(2)} → ${after.overlap.toFixed(2)} h. Baseline ${b.modelPass?'passes':'fails'}; delayed scenario ${after.modelPass?'passes':'fails'} the configured nominal limits.${after.failures.length?' '+after.failures.join(' · '):''}`;
 $('decisionContext').textContent=`Arrival ${config.startUTC.slice(0,10)} UTC · +${config.delay} h delay · ${config.duration} h mission · ${config.height} m observer. ${region?'Interior sample: nominal terrain only; no clone support calculated here.':'Original benchmark: separate conditional terrain tests appear below.'} Full mission feasibility remains unknown.`;
 $('goTrace').disabled=false;$('goRecovery').disabled=false;
}
let renderTimer;
for(const id of ['start','delay','duration','height','dark','overlap']){
 $(id).addEventListener('input',()=>{clearTimeout(renderTimer);renderTimer=setTimeout(render,180);});
 $(id).addEventListener('change',()=>{clearTimeout(renderTimer);render();});
}
$('spatialTime').oninput=()=>{$('time').value=$('spatialTime').value;chart();};
$('time').oninput=chart;$('activity').oninput=inspect;$('activity').onchange=inspect;$('site').onchange=()=>{regionStudy?.clear();inspect();};
$('object').onclick=()=>{earth=!earth;$('object').textContent=earth?'Show Sun geometry':'Show Earth geometry';$('object').setAttribute('aria-pressed',String(earth));chart();};
$('play').onclick=()=>{if(timer){clearInterval(timer);timer=null;$('play').textContent='Play replay';}else{$('play').textContent='Pause replay';timer=setInterval(()=>{$('time').value=(Number($('time').value)+3)%(Number($('time').max)+1);chart();},120);}};
function decisionReceipt(){
 const selected=results.find(r=>r.site.id===$('site').value),hours=Number($('activity').value);
 const payload=receipt(dataset,config,results.map(r=>({...r.delayed,robustness:r.robustness,angularStressTests:{offsetDegrees:[-.25,.25],modelPass:r.sensitivity,excludedFromVariantCounts:true},correctedLocalOnly:r.localOnly?{sunHours:r.localOnly.sunHours,overlap:r.localOnly.overlap,longestDark:r.localOnly.longestDark}:null})),recovery);
 return {...payload,regionStudy:regionStudy?.evidence()??null,candidateSource:dataset.candidates??null,spatialSource:dataset.spatial??null,imagerySource:dataset.imagery??null,spatialView:navigatorView?{siteId:navigatorView.active?.id,selectedStudyOutline:navigatorView.roi,mode:navigatorView.view,verticalExaggeration:navigatorView.exaggeration,horizonTrace:navigatorView.trace,imagery:navigatorView.imageryView?.evidence()??null,scope:'Display state; separately calculated interior results are in regionStudy. Outlines are not continuously calculated.'}:null,ranking,activity:{siteId:selected.site.id,durationHours:hours,windows:scheduleActivity(selected.delayed,hours),allTestedWindows:selected.robustness.commonWindows?scheduleActivity({...selected.delayed,combinedWindows:selected.robustness.commonWindows},hours):null,scope:'Shared nominal + four conditional near-field clone + four numerical cases; regional uncertainty is not tested'}};
}
$('export').onclick=()=>{
 const url=URL.createObjectURL(new Blob([JSON.stringify(decisionReceipt(),null,2)],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download='moon-park-decision-receipt.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
$('report').onclick=()=>window.print();
try{
 const response=await fetch('/data/mission-data.json');if(!response.ok)throw new Error('Prepared dataset missing. See README for preparation commands.');dataset=await response.json();
 if(dataset.uncertainty){
  const response=await fetch(dataset.uncertainty.url);if(!response.ok)throw new Error('Terrain variants missing');
  const raw=await response.arrayBuffer(),hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',raw)),b=>b.toString(16).padStart(2,'0')).join('');
  if(hash!==dataset.uncertainty.sha256)throw new Error('Terrain variant checksum mismatch');
  attachTerrainVariants(dataset,JSON.parse(new TextDecoder().decode(raw)));
 }
 if(dataset.spatial){
  try{
   const response=await fetch(dataset.spatial.url);if(!response.ok)throw new Error('Spatial dataset missing');
   const raw=await response.arrayBuffer(),hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',raw)),b=>b.toString(16).padStart(2,'0')).join('');
   if(hash!==dataset.spatial.sha256)throw new Error('Spatial dataset checksum mismatch');
   const spatial=JSON.parse(new TextDecoder().decode(raw));
   if(spatial.tiles.length!==dataset.sites.length||spatial.regions.length!==dataset.spatial.regionCount||dataset.sites.some(s=>spatial.tiles.find(t=>t.siteId===s.id)?.sourceSha256!==s.provenance.sha256))throw new Error('Spatial dataset source context mismatch');
   navigatorView=new SpatialNavigator(dataset,spatial,id=>{regionStudy?.clear();$('site').value=id;inspect();},id=>regionStudy?.selectRegion(id));
  }catch(e){$('navigator').hidden=false;$('spatialError').textContent='Spatial view unavailable: '+e.message;}
 }
 if(dataset.candidates&&navigatorView){
  try{
   const manifest=await verifiedJSON(dataset.candidates);
   if(manifest.regions.length!==dataset.candidates.regionCount||manifest.regions.reduce((n,r)=>n+r.points.length,0)!==dataset.candidates.pointCount)throw new Error('Candidate manifest counts mismatch');
   regionStudy=new RegionStudy(dataset,manifest,chart,points=>{navigatorView.extraPoints=points;navigatorView.drawMap();},c=>{$('height').value=String(c.height);$('delay').max=Math.max(144,c.delayHours);$('delay').value=String(c.delayHours);render();});navigatorView.calculatedRegions=new Map(manifest.regions.map(r=>[r.regionId,r.points.length]));navigatorView.onCandidateSelect=id=>regionStudy.selectPoint(id);
  }catch(e){$('spatialError').textContent='Interior point analysis unavailable: '+e.message;}
 }
 if(dataset.imagery&&navigatorView){try{navigatorView.imageryView=new ImageryContext(dataset,await verifiedJSON(dataset.imagery));$('viewImage').disabled=false;}catch(e){$('spatialError').textContent='Historical image context unavailable: '+e.message;}}
 $('recordedExample').disabled=!regionStudy;
 $('site').innerHTML=dataset.sites.map(s=>`<option value="${s.id}">${s.name}</option>`).join('');$('dataStatus').textContent=dataset.schemaVersion>=4?'NASA LOLA + NAIF SPICE · 180 km horizons with near-field clone and numerical stability checks. Conditional tests cover the nearest 2 km; regional terrain uncertainty is not included.':'NASA LOLA + NAIF SPICE · Regional terrain model. Terrain variants have not been loaded.';render();
}catch(e){dataset=null;results=[];$('dataStatus').textContent='Data unavailable';$('error').hidden=false;$('error').textContent=e.message;$('export').disabled=true;$('report').disabled=true;}














$('goMission').onclick=()=>$('missionControls').scrollIntoView({behavior:'smooth',block:'start'});
$('goTrace').onclick=()=>{navigatorView?.selectTrace('earth');$('navigator').scrollIntoView({behavior:'smooth',block:'start'});};
$('goRecovery').onclick=()=>{const regionDetails=regionStudy?.models.length?document.querySelector('#regionMetrics details'):null;if(regionDetails){regionDetails.open=true;regionDetails.scrollIntoView({behavior:'smooth',block:'start'});}else $('recoverySection').scrollIntoView({behavior:'smooth',block:'start'});};
$('recordedExample').onclick=async()=>{
 const button=$('recordedExample');button.disabled=true;button.textContent='Loading the recorded example…';
 try{
  $('start').value='2026-11-14';$('delay').max=72;$('delay').value=48;$('height').value=2;$('duration').value=72;$('dark').value=12;$('overlap').value=8;$('activity').value=2;render();
  await navigatorView.selectRegion('Site01-roi-1');regionStudy.selectPoint('Site01-roi-1-grid-south');
  const result=regionStudy.rows.find(r=>r.site.id==='Site01-roi-1-grid-south');if(!result)throw new Error('Recorded example evidence unavailable');
  const first=result.delayed.samples.findIndex(s=>s.both);$('time').value=Math.max(0,first);chart();navigatorView.mode('sky');navigatorView.selectTrace('earth');
  $('navigator').scrollIntoView({behavior:'smooth',block:'start'});
 }catch(e){$('error').hidden=false;$('error').textContent=e.message;}finally{button.disabled=false;button.textContent='Try a recorded example';}
};
