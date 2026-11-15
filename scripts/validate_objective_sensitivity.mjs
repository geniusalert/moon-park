import {readFileSync,writeFileSync} from 'node:fs';
import {comparePoint} from '../src/navigator-model.js';
const evidence=JSON.parse(readFileSync('docs/navigator-objective-science.json'));
const cases=[];
for(const c of evidence.cases){const payload=await (await fetch('http://127.0.0.1:4173/api/results/'+c.resultId)).json();const site=payload.site;const config={...c.request,maxDark:12,minOverlap:8};const base=comparePoint(site,config,2);const coarse=structuredClone(site);for(const h of Object.keys(coarse.profiles))coarse.profiles[h]=coarse.profiles[h].filter((_,i)=>i%2===0);const angular=comparePoint(coarse,config,2);const temporal=comparePoint(site,{...config,stepMinutes:20},2);const metrics=r=>({sun:r.revised.sunHours,earth:r.revised.earthHours,overlap:r.revised.overlap,longestCombined:r.revised.longestCombined});cases.push({request:c.request,nominal:metrics(base),coarserAzimuthHalfDegree:metrics(angular),coarserTime20Minutes:metrics(temporal)});}
writeFileSync('docs/navigator-objective-sensitivity.json',JSON.stringify({date:'2026-11-13',cases,interpretation:'Coarsening sensitivity at two nominal custom scenarios, not fine-resolution convergence or full-field uncertainty. Existing finer temporal benchmark evidence remains separate.'},null,2));
console.log('Retained sensitivity for',cases.length,'real custom scenarios');
