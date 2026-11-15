import {evaluateMission,findRecovery} from './mission.js';
import {intervals} from './engine.js';

export function attachTerrainVariants(dataset,prepared){
 if(prepared.schemaVersion!==1||!Array.isArray(prepared.sites))throw new Error('Unsupported terrain-variant schema');
 for(const site of dataset.sites){
  const entry=prepared.sites.find(s=>s.siteId===site.id);
  if(!entry||entry.context.groundM!==site.groundM||entry.context.longitude!==site.longitude||entry.context.latitude!==site.latitude||entry.context.startUTC!==site.ephemerides.sun[0].utc||entry.context.endUTC!==site.ephemerides.sun.at(-1).utc)throw new Error('Terrain variants do not match mission data');
  const ids=new Set();
  site.terrainVariants=entry.variants.map(v=>{
   if(ids.has(v.id)||!['clone','numerical'].includes(v.family)||!Number.isFinite(v.groundShiftM))throw new Error('Invalid terrain realization');ids.add(v.id);
   const profiles=Object.fromEntries([2,5,10].map(h=>{
    const p=v.profiles[String(h)];
    if(!p||!Number.isFinite(p.azimuthStepDeg)||p.azimuthStepDeg<=0||p.values.length!==Math.round(360/p.azimuthStepDeg)||!Number.isFinite(p.coverageM)||p.coverageM<=0||p.values.some(e=>!Number.isFinite(e)))throw new Error('Incomplete terrain realization');
    return [h,p.values.map((el,i)=>({az:i*p.azimuthStepDeg,el,coverageM:p.coverageM}))];
   }));
   return {...v,profiles};
  });
  const expected=prepared.scope.cloneIds.map(i=>`clone-${String(i).padStart(4,'0')}`);
  if(expected.some(id=>!ids.has(id))||site.terrainVariants.filter(v=>v.family==='numerical').length!==4)throw new Error('Incomplete variant families');
 }
 return dataset;
}

export function variantSite(site,variant){return {...site,profiles:variant.profiles,observerGroundShiftM:variant.groundShiftM};}
const metrics=r=>({modelPass:r.modelPass,overlap:r.overlap,sunHours:r.sunHours,longestDark:r.longestDark,longestCombined:r.longestCombined});
const range=(cases,key)=>({min:Math.min(...cases.map(c=>c[key])),max:Math.max(...cases.map(c=>c[key]))});

export function analyzeSite(site,config){
 const nominalResult=evaluateMission(site,config),nominal=metrics(nominalResult);
 const commonSamples=nominalResult.samples.map(s=>({hour:s.hour,both:s.both}));
 if(!site.terrainVariants?.length)return {siteId:site.id,nominal,status:'unavailable',allTestedPass:null,cases:[],families:{},errors:['Terrain variants unavailable']};
 const cases=[],errors=[];
 for(const v of site.terrainVariants){
  try{
   const result=evaluateMission(variantSite(site,v),config);
   if(result.samples.length!==commonSamples.length)throw new Error('Incompatible variant sampling');
   result.samples.forEach((s,i)=>{commonSamples[i].both=commonSamples[i].both&&s.both;});
   cases.push({id:v.id,label:v.label,family:v.family,...metrics(result)});
  }
  catch(e){errors.push({id:v.id,reason:e.message});}
 }
 const family={};
 for(const name of ['clone','numerical']){
  const c=cases.filter(c=>c.family===name),expected=site.terrainVariants.filter(v=>v.family===name).length;
  family[name]={tested:c.length,expected,passing:c.filter(c=>c.modelPass).length,complete:c.length===expected&&expected>0,ranges:c.length?{overlap:range(c,'overlap'),sunHours:range(c,'sunHours'),longestDark:range(c,'longestDark')}:null};
 }
 const all=[nominal,...cases],complete=!errors.length&&Object.values(family).every(f=>f.complete);
 const status=!complete?'unavailable':all.every(c=>c.modelPass)?'passes-all-tested':all.every(c=>!c.modelPass)?'fails-all-tested':'sensitive';
 const c=nominalResult.config,bin=c.stepMinutes/60;
 const nearSamplingLimit=all.some(r=>r.modelPass&&((c.maxDark<c.duration&&c.maxDark-r.longestDark<=bin+1e-9)||(c.minOverlap>0&&r.overlap-c.minOverlap<=bin+1e-9)));
 return {siteId:site.id,nominal,status,nearSamplingLimit,allTestedPass:complete?status==='passes-all-tested':null,cases,families:family,errors,commonWindows:complete?intervals(commonSamples,'both',nominalResult.config.duration):null,ranges:{overlap:range(all,'overlap'),sunHours:range(all,'sunHours'),longestDark:range(all,'longestDark')}};
}

function compare(a,b,tolerance){
 if(a.modelPass!==b.modelPass)return a.modelPass?1:-1;
 return Math.abs(a.overlap-b.overlap)<=tolerance+1e-9?0:Math.sign(a.overlap-b.overlap);
}

export function rankStability(analyses,{toleranceHours=1/6}={}){
 if(!Number.isFinite(toleranceHours)||toleranceHours<0)throw new Error('Invalid rank tolerance');
 const complete=analyses.every(a=>a.status!=='unavailable');
 if(!complete)return {status:'unavailable',possiblePreferredSites:[],rows:[],method:'Missing variants prevent ranking stability conclusions'};
 const bounds=analyses.map(a=>{const all=[a.nominal,...a.cases];return {a,best:all.reduce((best,c)=>compare(c,best,0)>0?c:best),worst:all.reduce((worst,c)=>compare(c,worst,0)<0?c:worst)};});
 const rows=bounds.map(({a,best,worst})=>({siteId:a.siteId,nominalRank:1+analyses.filter(other=>other!==a&&compare(other.nominal,a.nominal,toleranceHours)>0).length,bestRank:1+bounds.filter(other=>other.a!==a&&compare(other.worst,best,toleranceHours)>0).length,worstRank:1+bounds.filter(other=>other.a!==a&&compare(other.best,worst,toleranceHours)>0).length,anyPassing:[a.nominal,...a.cases].some(c=>c.modelPass),allTestedPass:a.allTestedPass}));
 const possible=rows.filter(r=>r.bestRank===1&&r.anyPassing).map(r=>r.siteId);
 const unique=possible.length===1&&rows.find(r=>r.siteId===possible[0]).allTestedPass;
 return {status:unique?(analyses.find(a=>a.siteId===possible[0]).nearSamplingLimit?'near-sampling-limit':'stable-tested-preference'):possible.length?'sensitive-or-tied':'no-passing-choice',possiblePreferredSites:possible,rows,toleranceHours,method:'Requirements first, then greater combined availability; ties within one observation bin. Rank spans use best/worst tested outcomes independently by site; they are conservative possibilities, not probabilities or matched global clone worlds.'};
}

export function findRobustRecovery(sites,config,options={}){
 const nominal=findRecovery(sites,config,options);
 const candidates=nominal.candidates.map(c=>{
  const site=sites.find(s=>s.id===c.siteId),analysis=analyzeSite(site,{...config,height:c.height,delay:c.delayHours});
  return {...c,robustness:analysis.status,nearSamplingLimit:analysis.nearSamplingLimit??null,allTestedPass:analysis.allTestedPass,cloneSupport:analysis.families.clone??null,numericalSupport:analysis.families.numerical??null,metricRanges:analysis.ranges??null,variantOutcomes:analysis.cases,variantErrors:analysis.errors};
 });
 candidates.sort((a,b)=>Number(b.allTestedPass===true)-Number(a.allTestedPass===true)||a.extraHours-b.extraHours||a.height-b.height||b.overlap-a.overlap||a.siteId.localeCompare(b.siteId));
 return {...nominal,candidates,passingAllTested:candidates.filter(c=>c.allTestedPass===true).length,interpretation:'Among nominally passing choices: all tested local-clone and numerical cases pass first; then earliest extra delay, lowest height, most overlap. Partial near-field uncertainty only; no probability or safety certification.'};
}
