export function decodeCandidate(payload,expected){
 const {site,context,profiles,ephemerides,times,provenance,ephemerisProvenance}=payload;
 if(payload.schemaVersion!==1||site?.id!==expected.id||site.regionId!==expected.regionId||site.sourceSiteId!==expected.sourceSiteId||site.longitude!==expected.longitude||site.latitude!==expected.latitude||site.groundM!==expected.groundM||site.xy?.some((v,i)=>v!==expected.xy[i]))throw new Error('Candidate coordinate context mismatch');
 if(!context||context.sourceDEM!==provenance.sha256||context.point.id!==site.id||!ephemerisProvenance.coordinateSpecific||ephemerisProvenance.frame!=='MOON_ME_DE421')throw new Error('Candidate provenance mismatch');
 if(!Array.isArray(times)||times.length<2||times.some((t,i)=>!Number.isFinite(Date.parse(t))||(i&&Date.parse(t)-Date.parse(times[i-1])!==600000)))throw new Error('Candidate observation grid incomplete');
 if(times[0]!==context.startUTC||times.at(-1)!==context.endUTC)throw new Error('Candidate interval context mismatch');
 const decodedProfiles={},series={};
 for(const h of [2,5,10]){
  const p=profiles[h];if(!p||p.length!==1440||p.some(row=>row.length!==5||row.some(v=>!Number.isFinite(v))||row[1]<=0||![0,1].includes(row[2])))throw new Error('Candidate horizon incomplete');
  decodedProfiles[h]=p.map(([el,distanceM,regional,x,y],i)=>({az:i*.25,el,distanceM,source:regional?'regional-240m':'local-5m',blocker:[x,y],coverageM:180000}));
  series[h]={};for(const object of ['sun','earth']){
   const rows=ephemerides[h]?.[object];if(!rows||rows.length!==times.length||rows.some(r=>r.length!==3||r.some(v=>!Number.isFinite(v))||r[0]<0||r[0]>=360||r[1]<-90||r[1]>90||r[2]<=0))throw new Error('Candidate observations incomplete');
   series[h][object]=rows.map(([az,el,rangeKm],i)=>({utc:times[i],az,el,rangeKm}));
  }
 }
 return {...site,profiles:decodedProfiles,ephemeridesByHeight:series,ephemerides:series[2],observationStepMinutes:10,provenance,ephemerisProvenance:{sun:ephemerisProvenance,earth:ephemerisProvenance},candidateEvidence:{url:expected.url,sha256:expected.sha256,context}};
}

export async function verifiedJSON(reference){
 if(!reference?.url?.startsWith('/data/')||!/^[a-f0-9]{64}$/.test(reference.sha256))throw new Error('Invalid evidence reference');
 const response=await fetch(reference.url);if(!response.ok)throw new Error('Evidence artifact unavailable');
 const raw=await response.arrayBuffer(),hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',raw)),b=>b.toString(16).padStart(2,'0')).join('');
 if(hash!==reference.sha256)throw new Error('Evidence checksum mismatch');return JSON.parse(new TextDecoder().decode(raw));
}
