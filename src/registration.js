import {verifiedJSON} from './candidate-model.js';
import {pixelToXY,validPick,assessRegistration,restoreAlignment} from './registration-model.js';
import {stereoContext,mayPickTerrain} from './stereo-reference.js';
const $=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg';
let dataset,catalog,entry,stereoReference,pairs=[],picks={},sequence=0,center=[200.5,200.5],cursor={image:[200,200],terrain:[200,200]},urls={};
const byArea=new Map(),cache=new Map();
function node(tag,attrs,text){const n=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);if(text)n.textContent=text;return n;}
async function asset(ref){
 if(!ref.url.startsWith('/data/registration/')||!/^[a-f0-9]{64}$/.test(ref.sha256))throw new Error('Invalid inspection asset reference');
 if(!cache.has(ref.sha256))cache.set(ref.sha256,(async()=>{const r=await fetch(ref.url);if(!r.ok)throw new Error('Inspection asset unavailable');const raw=await r.arrayBuffer(),bytes=new Uint8Array(raw);const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',raw)),b=>b.toString(16).padStart(2,'0')).join('');if(hash!==ref.sha256||[137,80,78,71,13,10,26,10].some((v,i)=>bytes[i]!==v))throw new Error('Inspection image integrity mismatch');return URL.createObjectURL(new Blob([raw],{type:'image/png'}));})().catch(e=>{cache.delete(ref.sha256);throw e;}));
 return cache.get(ref.sha256);
}
function pixel(p){const [l,b,r,t]=entry.boundsXYM;return [(p[0]-l)/(r-l)*entry.width,(t-p[1])/(t-b)*entry.height];}
function referenceControls(){
 const ref=stereoContext(entry,stereoReference);$('stereoOption').disabled=!ref;
 if(!ref)$('terrainDataset').value='mission';const viewing=!mayPickTerrain($('terrainDataset').value);
 $('confidenceOption').disabled=!viewing;$('confidenceOption').hidden=!viewing;
 if(!viewing&&$('shade').value==='confidence')$('shade').value='shade45';
 $('referenceSummary').hidden=!viewing;
 $('terrainHeading').textContent=viewing?($('shade').value==='confidence'?'Stereo reference · source quality':'Stereo reference · terrain shape'):'Mission terrain · synthetic lighting';
 $('terrainView').setAttribute('aria-label',viewing?'Inspect stereo reference; mission registration picks disabled':'Pick terrain landmark: arrow keys move the cursor, Enter chooses it');
 if(ref){const s=ref.strictDifference;$('referenceNumbers').textContent=`${(ref.strictCorrelationFraction*100).toFixed(1)}% of inspection cells have full successful-correlation coverage. ${s.count?`Unshifted height difference: median ${s.medianM.toFixed(1)} m; central 90% ${s.p05M.toFixed(1)} to ${s.p95M.toFixed(1)} m (${s.count.toLocaleString()} cells).`:'No fully supported cells available for the height comparison.'}`;}
 if(ref?.landmarkAudit){const rows=ref.landmarkAudit.points,unsupported=rows.filter(p=>p.reviewStatus==='not-supported-by-this-stereo-reference').length;$('referenceAudit').textContent=`Earlier recorded assessment: ${unsupported} of ${rows.length} tentative pairs lack source-stereo support at the nominal coordinates. All recorded correspondences remain unaccepted.`;}
 return viewing?ref:null;
}
function draw(){
 if(!entry)return;const size=entry.width/Number($('zoom').value),half=size/2;center=center.map(v=>Math.max(half,Math.min(entry.width-half,v)));
 for(const kind of ['image','terrain']){
  const svg=$(kind+'View');svg.replaceChildren();svg.setAttribute('viewBox',`${center[0]-half} ${center[1]-half} ${size} ${size}`);
  if(urls[kind])svg.append(node('image',{href:urls[kind],x:0,y:0,width:entry.width,height:entry.height}));
  const unit=size/401;
  if(kind==='terrain'&&!mayPickTerrain($('terrainDataset').value)){$('terrainPick').textContent='Reference inspection only · switch to mission terrain to select a registration landmark.';continue;}
  pairs.forEach((p,i)=>{const [x,y]=pixel(p[kind]);svg.append(node('circle',{cx:x,cy:y,r:7*unit,fill:'#101c19',stroke:p.role==='fit'?'#efc785':'#8ed6f0','stroke-width':unit}));svg.append(node('text',{x,y:y+3*unit,'text-anchor':'middle',fill:'#fff','font-size':9*unit},String(i+1)));});
  const [c,r]=picks[kind]?pixel(picks[kind]):cursor[kind].map(v=>v+.5);svg.append(node('path',{d:`M ${c-8*unit} ${r} h ${16*unit} M ${c} ${r-8*unit} v ${16*unit}`,stroke:'#ff9e8c','stroke-width':1.5*unit,fill:'none'}));
  $(kind+'Pick').textContent=picks[kind]?`${kind==='image'?'Image':'Terrain'} X ${picks[kind][0].toFixed(1)} / Y ${picks[kind][1].toFixed(1)} m`:'No '+kind+' position selected.';
 }
 $('add').disabled=!(picks.image&&picks.terrain&&$('landmark').value.trim()&&mayPickTerrain($('terrainDataset').value));
}
function select(kind,c,r){
 if(kind==='terrain'&&!mayPickTerrain($('terrainDataset').value)){$('pairStatus').textContent='Reference terrain cannot supply a mission registration pick. Switch to mission terrain first.';return;}
 const p=pixelToXY(entry,Math.floor(c),Math.floor(r));cursor[kind]=[Math.floor(c),Math.floor(r)];
 if(!validPick(entry,kind,p)){$('pairStatus').textContent='That position has no available inspection pixel. Choose a supported landmark.';return;}
 picks[kind]=p;$('pairStatus').textContent='Position selected. Match the same stable feature in the other panel.';draw();
}
function render(){
 const a=assessRegistration(entry,pairs);$('assessment').textContent=!pairs.length?'No landmarks recorded. Registration is unmeasured.':`Fit ${a.fitCount} · held-out checks ${a.checkCount}. ${a.translationM?`Image → terrain translation X ${a.translationM[0].toFixed(1)} m, Y ${a.translationM[1].toFixed(1)} m.`:'Add fit landmarks to estimate translation.'} ${a.heldOutResidual?`Held-out RMS ${a.heldOutResidual.rmseM.toFixed(1)} m; maximum ${a.heldOutResidual.maxM.toFixed(1)} m.`:'No held-out residual available.'} ${a.status==='ready-for-review'?'Ready for review; registration remains unestablished.':'More distributed fit/check landmarks are required.'}`;
 $('pairs').replaceChildren();pairs.forEach((p,i)=>{const tr=document.createElement('tr');for(const value of [`${i+1}. ${p.label}`,p.role,p.image.map(v=>v.toFixed(1)).join(' / '),p.terrain.map(v=>v.toFixed(1)).join(' / '),a.residuals[i].residualM?.toFixed(1)??'—']){const td=document.createElement('td');td.textContent=value;tr.append(td);}const td=document.createElement('td'),b=document.createElement('button');b.textContent='Remove';b.setAttribute('aria-label','Remove landmark '+(i+1));b.onclick=()=>{pairs=pairs.filter(q=>q.id!==p.id);byArea.set(entry.siteId,pairs);render();};td.append(b);tr.append(td);$('pairs').append(tr);});$('export').disabled=false;draw();
}
async function load(){
 entry=catalog.entries.find(e=>e.siteId===$('area').value);$('terrainDataset').value='mission';referenceControls();pairs=byArea.get(entry.siteId)??[];picks={};center=[entry.width/2,entry.height/2];cursor={image:[200,200],terrain:[200,200]};urls={};$('restoreFile').disabled=false;render();await refreshAssets();
}
async function refreshAssets(){
 const seq=++sequence;$('sourceInfo').textContent='Checking image and terrain display integrity…';$('error').textContent='';
 try{const ref=referenceControls();const [image,terrain]=await Promise.all([asset(entry.assets.image),asset((ref??entry).assets[$('shade').value])]);if(seq!==sequence)return;urls={image,terrain};$('sourceInfo').textContent=`${entry.name} · ${entry.productId} · inspection cells ${entry.pixelM[0].toFixed(2)} m. ${entry.acquisitionIncomplete?'Photo acquisition is partial; missing areas remain masked. ':''}${(entry.imageValidFraction*100).toFixed(1)}% available image cells; ${(entry.terrainValidFraction*100).toFixed(1)}% mission terrain cells. Source projection round-trip closure ${entry.projectionRoundTripMaxM.toExponential(1)} m is a numerical check, not measured image alignment.`;draw();}catch(e){if(seq===sequence)$('error').textContent=e.message;}
}
for(const kind of ['image','terrain']){
 const svg=$(kind+'View');svg.onclick=e=>{if(!entry||!urls[kind])return;const point=new DOMPoint(e.clientX,e.clientY).matrixTransform(svg.getScreenCTM().inverse());select(kind,point.x,point.y);};
 svg.onkeydown=e=>{if(!entry||!urls[kind])return;const steps={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};if(steps[e.key]){e.preventDefault();cursor[kind]=cursor[kind].map((v,i)=>Math.max(0,Math.min(entry.width-1,v+steps[e.key][i])));delete picks[kind];draw();}else if(e.key==='Enter'){e.preventDefault();select(kind,...cursor[kind]);}};
}
$('area').onchange=load;$('shade').onchange=()=>{if(entry)refreshAssets();};
$('terrainDataset').onchange=()=>{if(entry){delete picks.terrain;urls.terrain=null;referenceControls();draw();refreshAssets();}};
$('zoom').onchange=draw;
for(const [id,dx,dy] of [['west',-1,0],['east',1,0],['north',0,-1],['south',0,1]])$(id).onclick=()=>{if(entry){const step=entry.width/Number($('zoom').value)/4;center=[center[0]+dx*step,center[1]+dy*step];draw();}};
$('center').onclick=()=>{if(entry){center=[entry.width/2,entry.height/2];draw();}};
$('landmark').oninput=draw;$('cancel').onclick=()=>{picks={};$('pairStatus').textContent='Current selections cleared.';draw();};
$('restoreFile').onchange=async event=>{
 const file=event.target.files?.[0];if(!file||!entry)return;const selected=entry;
 try{
  if(file.size>2*1024*1024)throw new Error('Saved evidence is too large (maximum 2 MB)');
  const restored=restoreAlignment(selected,JSON.parse(await file.text()));
  if(entry!==selected)throw new Error('Area changed while reading; choose the file again for this area');
  pairs=restored.pairs;byArea.set(entry.siteId,pairs);picks={};$('pairStatus').textContent=`Restored ${pairs.length} unreviewed landmark pairs. Results recalculated against current source identities.`;render();
 }catch(e){$('pairStatus').textContent='Restore rejected: '+e.message;}finally{event.target.value='';}
};
$('add').onclick=()=>{const p={id:crypto.randomUUID(),label:$('landmark').value.trim(),role:$('role').value,image:picks.image,terrain:picks.terrain};try{assessRegistration(entry,[...pairs,p]);pairs=[...pairs,p];byArea.set(entry.siteId,pairs);picks={};$('landmark').value='';$('pairStatus').textContent='Landmark saved in this page. Export to retain it.';render();}catch(e){$('pairStatus').textContent=e.message;}};
$('export').onclick=()=>{const record={schemaVersion:1,application:'Moon Park alignment workbench',version:'0.12.0',createdAt:new Date().toISOString(),software:dataset.software,registrationSource:dataset.registration,stereoReferenceSource:dataset.stereoReference??null,terrainDisplaySource:$('terrainDataset').value,terrainDisplayLayer:$('shade').value,siteId:entry.siteId,sourceImage:entry.sourceImage,sourceMetadata:entry.sourceMetadata,demSource:entry.demSource,inspectionAssets:entry.assets,acquisitionIncomplete:entry.acquisitionIncomplete,operatorEvidence:'Unreviewed operator selections; no independent correspondence verification',pairs,assessment:assessRegistration(entry,pairs)};const url=URL.createObjectURL(new Blob([JSON.stringify(record,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=`moon-park-alignment-${entry.siteId}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
try{const response=await fetch('/data/mission-data.json');if(!response.ok)throw new Error('Prepared dataset unavailable');dataset=await response.json();catalog=await verifiedJSON(dataset.registration);if(dataset.stereoReference){try{stereoReference=await verifiedJSON(dataset.stereoReference);}catch(e){$('error').textContent='Stereo reference unavailable: '+e.message;}}if(catalog.schemaVersion!==1||catalog.entries.length!==dataset.registration.entryCount)throw new Error('Inspection catalog context mismatch');for(const e of catalog.entries){const s=dataset.sites.find(s=>s.id===e.siteId);if(!s||e.demSource.sha256!==s.provenance.sha256||e.width!==e.height||['image','terrain'].some(k=>e.masks[k].length!==e.width*e.height))throw new Error('Inspection source/grid context mismatch');}for(const e of catalog.entries){const o=document.createElement('option');o.value=e.siteId;o.textContent=e.name;$('area').append(o);}$('area').disabled=false;const query=new URL(location.href).searchParams,requested=query.get('area');if(catalog.entries.some(e=>e.siteId===requested))$('area').value=requested;await load();if(query.get('source')==='stereo'&&stereoContext(entry,stereoReference)){$('terrainDataset').value='stereo';referenceControls();if(query.get('layer')==='confidence')$('shade').value='confidence';await refreshAssets();}}catch(e){$('error').textContent=e.message;}
