export function pixelToXY(entry,c,r){
 const [l,b,rr,t]=entry.boundsXYM;return [l+(c+.5)*(rr-l)/entry.width,t-(r+.5)*(t-b)/entry.height];
}
export function validPick(entry,kind,p){
 if(!Array.isArray(p)||p.length!==2||p.some(v=>!Number.isFinite(v)))return false;
 const [l,b,r,t]=entry.boundsXYM,[x,y]=p;if(x<l||x>=r||y<=b||y>t)return false;
 const c=Math.floor((x-l)/(r-l)*entry.width),row=Math.floor((t-y)/(t-b)*entry.height);
 return entry.masks[kind]?.[row*entry.width+c]===1;
}
const median=a=>{const b=[...a].sort((x,y)=>x-y),m=Math.floor(b.length/2);return b.length%2?b[m]:(b[m-1]+b[m])/2;};
export function restoreAlignment(entry,record){
 if(record?.schemaVersion!==1||record.application!=='Moon Park alignment workbench'||record.siteId!==entry.siteId)throw new Error('Saved evidence is for a different area or format');
 const same=(a,b)=>a?.url===b?.url&&a?.sha256===b?.sha256;
 if(!same(record.sourceImage,entry.sourceImage)||!same(record.sourceMetadata,entry.sourceMetadata)||record.demSource?.sha256!==entry.demSource.sha256||Object.keys(entry.assets).some(k=>!same(record.inspectionAssets?.[k],entry.assets[k])))throw new Error('Image, terrain or inspection sources have changed; saved coordinates cannot be restored');
 if(!Array.isArray(record.pairs)||record.pairs.length>200)throw new Error('Saved evidence must contain at most 200 landmark pairs');
 const pairs=record.pairs.map(p=>{
  if(typeof p.id!=='string'||p.id.length>100||typeof p.label!=='string'||p.label.length>120)throw new Error('Invalid landmark ID or description');
  return {id:p.id,label:p.label,role:p.role,image:Array.isArray(p.image)?[...p.image]:null,terrain:Array.isArray(p.terrain)?[...p.terrain]:null};
 });
 return {pairs,assessment:assessRegistration(entry,pairs),priorVersion:typeof record.version==='string'?record.version:null};
}
export function assessRegistration(entry,pairs){
 if(!Array.isArray(pairs))throw new Error('Landmarks must be an array');
 const ids=new Set(),coords=new Set();
 for(const p of pairs){
  if(!p.id||ids.has(p.id)||!['fit','check'].includes(p.role)||!p.label?.trim()||!validPick(entry,'image',p.image)||!validPick(entry,'terrain',p.terrain))throw new Error('Each landmark needs a unique ID, label, role and valid image/terrain coordinates');
  const key=JSON.stringify(p.image),other=JSON.stringify(p.terrain);if(coords.has('i'+key)||coords.has('t'+other))throw new Error('Duplicate landmark coordinates');ids.add(p.id);coords.add('i'+key);coords.add('t'+other);
 }
 const fit=pairs.filter(p=>p.role==='fit'),check=pairs.filter(p=>p.role==='check');
 const shift=fit.length?[median(fit.map(p=>p.terrain[0]-p.image[0])),median(fit.map(p=>p.terrain[1]-p.image[1]))]:null;
 const residual=p=>shift?Math.hypot(p.image[0]+shift[0]-p.terrain[0],p.image[1]+shift[1]-p.terrain[1]):null;
 const summary=list=>!shift||!list.length?null:{count:list.length,rmseM:Math.sqrt(list.reduce((s,p)=>s+residual(p)**2,0)/list.length),maxM:Math.max(...list.map(residual))};
 const [l,b,r,t]=entry.boundsXYM;
 const span=list=>list.length?[(Math.max(...list.map(p=>p.image[0]))-Math.min(...list.map(p=>p.image[0])))/(r-l),(Math.max(...list.map(p=>p.image[1]))-Math.min(...list.map(p=>p.image[1])))/(t-b)]:[0,0];
 const fitSpan=span(fit),checkSpan=span(check),enough=fit.length>=3&&check.length>=3&&[...fitSpan,...checkSpan].every(v=>v>=.2);
 return {status:enough?'ready-for-review':'insufficient-landmarks',registrationEstablished:false,fitCount:fit.length,checkCount:check.length,translationM:shift,translationConvention:'Add [east X, north Y] to image coordinates to compare with terrain coordinates; no correction applied.',fitResidual:summary(fit),heldOutResidual:summary(check),fitSpanFraction:fitSpan,heldOutSpanFraction:checkSpan,residuals:pairs.map(p=>({id:p.id,role:p.role,residualM:residual(p)})),scope:'Operator-selected landmarks; translation only, no affine/distortion fit. Held-out points never influence the fitted shift. Counts and residuals do not establish independent accuracy or operational suitability.'};
}
