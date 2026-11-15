export function stereoContext(entry,reference){
 if(!reference||entry?.siteId!==reference.siteId)return null;
 const equal=(a,b)=>a?.url===b?.url&&a?.sha256===b?.sha256;
 if(reference.schemaVersion!==1||!equal(reference.imageContext,entry.sourceImage)||reference.missionDEM?.sha256!==entry.demSource.sha256||reference.width!==entry.width||reference.height!==entry.height||reference.boundsXYM?.length!==4||reference.boundsXYM.some((v,i)=>Math.abs(v-entry.boundsXYM[i])>1e-7))throw new Error('Stereo reference does not match this image/mission grid');
 for(const name of ['shade45','shade135','shade225','shade315','slope','confidence']){const a=reference.assets?.[name];if(!a?.url?.startsWith('/data/registration/reference/')||!/^[a-f0-9]{64}$/.test(a.sha256))throw new Error('Invalid stereo reference display asset');}
 const fraction=reference.strictCorrelationFraction,stats=reference.strictDifference;
 if(!Number.isFinite(fraction)||fraction<0||fraction>1||!Number.isInteger(stats?.count)||stats.count<0||Math.abs(stats.count/(entry.width*entry.height)-fraction)>1e-10)throw new Error('Invalid stereo support summary');
 return reference;
}
export function mayPickTerrain(source){return source==='mission';}
