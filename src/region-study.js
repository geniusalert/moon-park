import {decodeCandidate,verifiedJSON} from './candidate-model.js';
import {evaluateMission,scheduleActivity,findRecovery} from './mission.js';
const $=id=>document.getElementById(id),f=n=>n.toFixed(2);
export class RegionStudy{
 constructor(dataset,manifest,onChange,onPoints,onRecover){
  this.dataset=dataset;this.manifest=manifest;this.onChange=onChange;this.onPoints=onPoints;this.onRecover=onRecover;this.cache=new Map();this.sequence=0;this.models=[];
  $('regionPoint').onchange=()=>{this.pointId=$('regionPoint').value;this.onChange();};
 }
 async selectRegion(id){
  const sequence=++this.sequence;this.models=[];this.group=null;this.lastKey=null;this.rows=[];this.onPoints([]);this.onChange();
  const group=this.manifest.regions.find(r=>r.regionId===id);$('regionStudy').hidden=!group;if(!group)return;
  $('regionStudyTitle').textContent='Calculated samples · '+id;$('regionStudyStatus').textContent='Loading coordinate-specific evidence…';$('regionMetrics').replaceChildren();$('regionDetails').replaceChildren();$('regionPoint').disabled=true;
  try{
   const models=await Promise.all(group.points.map(async p=>{if(!this.cache.has(p.sha256))this.cache.set(p.sha256,decodeCandidate(await verifiedJSON(p),p));return this.cache.get(p.sha256);}));
   if(sequence!==this.sequence)return;this.models=models;this.group=group;this.pointId=models[0].id;
   $('regionPoint').innerHTML=models.map(m=>`<option value="${m.id}">${m.key} · ${m.xy[0].toFixed(1)}, ${m.xy[1].toFixed(1)} m</option>`).join('');$('regionPoint').disabled=false;
   $('regionStudyStatus').textContent=`${models.length} calculated interior point${models.length===1?'':'s'}. Nominal terrain only; no clone ensemble has been calculated here. The surrounding polygon is not continuously evaluated.`;
   this.onPoints(models);this.onChange();
  }catch(e){if(sequence===this.sequence)$('regionStudyStatus').textContent='Region evidence unavailable: '+e.message;}
 }
 clear(){++this.sequence;this.models=[];this.group=null;this.lastKey=null;this.rows=[];$('regionStudy').hidden=true;this.onPoints([]);}
 selectPoint(id){if(!this.models.some(m=>m.id===id))return;this.pointId=id;$('regionPoint').value=id;this.onChange();}
 update(config,index){
  if(!this.models.length)return null;
  try{
   const key=JSON.stringify(config);
   if(key!==this.lastKey){
    this.rows=this.models.map(site=>({site,baseline:evaluateMission(site,{...config,delay:0}),delayed:evaluateMission(site,config)}));this.lastKey=key;
    const range=k=>{const v=this.rows.map(r=>r.delayed[k]);return `${f(Math.min(...v))}–${f(Math.max(...v))} h`;};
    $('regionMetrics').innerHTML=`<p>Across these ${this.rows.length} sampled points: Sun ${range('sunHours')} · combined availability ${range('overlap')} · longest darkness ${range('longestDark')}.</p><p class="muted">Same date, duration, height and requirements as the mission controls below. Arrows compare baseline → delayed hours. This is spatial variation in selected points, not a statistical uncertainty interval.</p><div class="region-table"><table><thead><tr><th>Interior sample</th><th>Sun · h</th><th>Sun + Earth · h</th><th>Longest dark · h</th><th>Configured limits</th></tr></thead><tbody>${this.rows.map(({site,baseline:b,delayed:d})=>`<tr><td><button data-candidate="${site.id}">${site.key}</button><small>${f(site.offsetFromAnchorM)} m from anchor</small></td><td>${f(b.sunHours)} → ${f(d.sunHours)}</td><td>${f(b.overlap)} → ${f(d.overlap)}</td><td>${f(b.longestDark)} → ${f(d.longestDark)}</td><td>${d.modelPass?'Nominal model passes':d.failures.join('; ')}</td></tr>`).join('')}</tbody></table></div>`;
    document.querySelectorAll('[data-candidate]').forEach(b=>b.onclick=()=>this.selectPoint(b.dataset.candidate));
    this.recovery=findRecovery(this.models,config,{heights:[2,5,10].filter(h=>h>=config.height)});
    $('regionMetrics').insertAdjacentHTML('beforeend',`<details><summary>Nominal recovery within these sampled points</summary><p>${this.recovery.candidates.length} nominal passes / ${this.recovery.tested} tested point, delay and height combinations. Extra delay 0–72 h in 12 h steps. Terrain-clone support is unavailable at these points.</p>${this.recovery.candidates.slice(0,3).map((c,i)=>`<button data-region-recover="${i}">${this.models.find(s=>s.id===c.siteId).key} · +${c.extraHours} h extra · ${c.height} m · ${f(c.overlap)} h combined</button>`).join('')||'<p>No tested nominal combination passes.</p>'}</details>`);
    document.querySelectorAll('[data-region-recover]').forEach(b=>b.onclick=()=>{const c=this.recovery.candidates[Number(b.dataset.regionRecover)];this.pointId=c.siteId;$('regionPoint').value=c.siteId;this.onRecover(c);});
   }
   const r=this.rows.find(r=>r.site.id===this.pointId),sample=r.delayed.samples[Math.min(index,r.delayed.samples.length-1)];
   const w=scheduleActivity(r.delayed,Number($('activity').value));
   $('regionDetails').textContent=`Terrain and horizon above now show ${r.site.name}. Native ground ${f(r.site.groundM)} m; ${r.site.latitude.toFixed(6)}°, ${r.site.longitude.toFixed(6)}° E. ${w.length} nominal interval(s) can fit the requested activity. Terrain-clone support and whole-region feasibility remain unknown.`;
   return {site:r.site,sample,height:config.height,profile:r.site.profiles[config.height]};
  }catch(e){this.rows=[];this.lastKey=null;$('regionDetails').textContent='Analysis unavailable: '+e.message;return null;}
 }
 evidence(){return this.group?{regionId:this.group.regionId,pointId:this.pointId,scope:this.manifest.scope,manifest:this.dataset.candidates,recovery:this.recovery,points:this.rows.map(({site,baseline,delayed})=>({id:site.id,latitude:site.latitude,longitude:site.longitude,groundM:site.groundM,evidence:site.candidateEvidence,baseline,delayed}))}:null;}
}
