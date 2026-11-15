import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {polarToLonLat,terrainToScene,pointInRings,sampleDisplayHeight} from '../src/spatial-math.js';
const dataset=JSON.parse(await readFile('data/mission-data.json','utf8')),raw=await readFile(dataset.spatial.url.slice(1)),spatial=JSON.parse(raw);
let checks=0;const check=(condition,message)=>{assert.ok(condition,message);checks++;};
check(createHash('sha256').update(raw).digest('hex')===dataset.spatial.sha256,'artifact checksum');
check(spatial.regions.length===15&&spatial.tiles.length===3,'published source counts');
const points=[];
for(const site of dataset.sites){
 const tile=spatial.tiles.find(t=>t.siteId===site.id),p=polarToLonLat(...site.xy);
 check(Math.abs(p.latitude-site.latitude)<1e-7&&Math.abs(p.longitude-site.longitude)<1e-7,site.id+' projection');
 check(tile.sourceSha256===site.provenance.sha256,site.id+' terrain source');
 check(tile.z.length===129&&tile.z.every(r=>r.length===129),site.id+' mesh dimensions');
 check(tile.x.every((v,i)=>!i||v>tile.x[i-1])&&tile.y.every((v,i)=>!i||v<tile.y[i-1]),site.id+' grid axes');
 check(Number.isFinite(sampleDisplayHeight(tile,...site.xy)),site.id+' point coverage');
 check(tile.z.every((row,r)=>row.every((z,c)=>z===null||terrainToScene(tile.x[c],tile.y[r],z,site).every(Number.isFinite))),site.id+' finite scene vertices');
 const source=spatial.sources.find(s=>s.siteId===site.id);check(source.projectionResidualDeg<=1e-9,site.id+' ROI CRS match');
 points.push({id:site.id,containingOutlines:spatial.regions.filter(r=>r.siteId===site.id&&pointInRings(...site.xy,r.ringsXY)).map(r=>r.id)});
}
for(const roi of spatial.regions){const t=spatial.tiles.find(t=>t.siteId===roi.siteId),b=t.bounds;check(roi.ringsXY.flat().every(([x,y])=>x>=b[0]&&x<=b[2]&&y>=b[1]&&y<=b[3]),roi.id+' DEM coverage');check(roi.simulationCached===false,roi.id+' no invented simulation');}
const report={checks,passed:true,points,attributeFlags:spatial.regions.filter(r=>r.attributePointStatus!=='inside').map(r=>({id:r.id,status:r.attributePointStatus})),scope:spatial.scope};
await writeFile('docs/spatial-validation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
