const $=id=>document.getElementById(id);
export function describeImageContext(entry,site){
 if(!entry)return {state:'unavailable',message:'No historical image is prepared for this area.'};
 const p=entry.pointCoverage?.[site.id];
 if(!p||p.longitude!==site.longitude||p.latitude!==site.latitude)return {state:'unverified-coordinate-context',message:'Image support has not been checked at this selected coordinate.'};
 const messages={'valid-source-pixel':'The selected coordinate maps to a valid source pixel.','source-nodata':entry.acquisitionIncomplete?'The selected coordinate has no available image value; unreceived strips and source nodata are masked.':'The selected coordinate maps to source nodata; no image value is available there.','outside-crop':'The selected point is outside this context crop.'};
 if(!messages[p.state])throw new Error('Invalid image coverage state');
 return {state:p.state,message:messages[p.state]};
}
async function imageURL(reference){
 if(!reference.url.startsWith('/data/imagery/')||!/^[a-f0-9]{64}$/.test(reference.sha256))throw new Error('Invalid image reference');
 const response=await fetch(reference.url);if(!response.ok)throw new Error('Historical image unavailable');
 const raw=await response.arrayBuffer(),bytes=new Uint8Array(raw),hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',raw)),b=>b.toString(16).padStart(2,'0')).join('');
 if(hash!==reference.sha256||[137,80,78,71,13,10,26,10].some((b,i)=>bytes[i]!==b))throw new Error('Historical image checksum or PNG signature mismatch');
 return URL.createObjectURL(new Blob([raw],{type:'image/png'}));
}
export class ImageryContext{
 constructor(dataset,catalog){
  if(catalog.schemaVersion!==1||catalog.entries.length!==dataset.imagery.entryCount||new Set(catalog.entries.map(e=>e.sourceSiteId)).size!==catalog.entries.length)throw new Error('Imagery catalog context mismatch');
  for(const entry of catalog.entries)if(!entry.productPage.startsWith('https://data.lroc.im-ldi.com/')||!entry.native.url.startsWith('/data/imagery/'))throw new Error('Invalid imagery source link');
  this.dataset=dataset;this.catalog=catalog;this.cache=new Map();this.sequence=0;this.loadedKey=null;
 }
 update(site,visible){
  if(!site)return;this.site=site;this.visible=visible;this.entry=this.catalog.entries.find(e=>e.sourceSiteId===(site.sourceSiteId??site.id));this.context=describeImageContext(this.entry,site);
  $('viewImage').disabled=!this.entry;if(!visible)return;
  if(!this.entry){++this.sequence;this.loadedKey=null;$('imageStatus').textContent=this.context.message;$('contextImage').hidden=true;for(const id of ['imageCaption','imagePointStatus','imageRegistration'])$(id).textContent='';for(const id of ['imageSource','imageNative'])$(id).removeAttribute('href');return;}
  const e=this.entry;$('imageCaption').textContent=`${e.name} · ${e.resolutionM[0].toFixed(2)} m/pixel · source imaging ${e.acquisitionDates}`;
  $('imagePointStatus').textContent=this.context.message+' This crop is centered on the area’s outline-1 anchor; no selected-point marker is placed on the unregistered image.';
  $('imageSource').href=e.productPage;$('imageNative').href=e.native.url;
  $('imageRegistration').textContent=`${e.acquisitionIncomplete?e.acquisitionNote+' ':''}${(e.validContextFraction*100).toFixed(1)}% of this crop has available, non-nodata source pixels. ${e.alignment}`;
  if(this.loadedKey===e.png.sha256)return;this.loadedKey=e.png.sha256;const sequence=++this.sequence;
  $('contextImage').hidden=true;$('imageStatus').textContent='Checking historical image integrity…';
  if(!this.cache.has(e.png.sha256))this.cache.set(e.png.sha256,imageURL(e.png).catch(error=>{this.cache.delete(e.png.sha256);throw error;}));
  this.cache.get(e.png.sha256).then(url=>{if(sequence!==this.sequence)return;$('contextImage').src=url;$('contextImage').hidden=false;$('imageStatus').textContent='Historical source image · shadows do not follow mission replay.';}).catch(error=>{if(sequence!==this.sequence)return;this.loadedKey=null;$('imageStatus').textContent='Image unavailable: '+error.message;});
 }
 evidence(){return this.entry?{displayed:this.visible,imageVerified:this.loadedKey===this.entry.png.sha256&&!$('contextImage').hidden,sourceSiteId:this.entry.sourceSiteId,productId:this.entry.productId,png:this.entry.png,native:this.entry.native,metadata:this.entry.metadata,acquisitionDates:this.entry.acquisitionDates,acquisitionIncomplete:this.entry.acquisitionIncomplete,acquisitionNote:this.entry.acquisitionNote,acquiredPixelFraction:this.entry.acquiredPixelFraction,selectedPointId:this.site.id,pointContext:this.context,alignment:this.entry.alignment,scope:this.entry.scope}:null;}
}
