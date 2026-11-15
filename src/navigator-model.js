import {evaluateMission,scheduleActivity} from './mission.js';
export function comparePoint(site,config,activityHours){
 if(!Number.isFinite(activityHours)||activityHours<=0||activityHours>config.duration)throw new Error('Activity must fit within the mission duration');
 const baseline=evaluateMission(site,{...config,delay:0}),revised=evaluateMission(site,config);
 const alignment=site.ephemerisProvenance?.sun?.frameAlignment;if(alignment)for(const r of [baseline,revised])r.limitations=[...r.limitations,alignment];
 if(site.id.startsWith('custom-'))for(const r of [baseline,revised])r.limitations=r.limitations.map(v=>v.startsWith('5 m local')?'5 m local where available, 20 m near-field and 240 m distant grids can miss narrow terrain features; consult the result horizon model for angular spacing.':v);
 return {siteId:site.id,baseline,revised,activityHours,baselineFailures:[...baseline.failures,...(baseline.longestCombined<activityHours?['No continuous combined window fits the requested activity']:[])],activity:scheduleActivity(revised,activityHours),failures:[...revised.failures,...(revised.longestCombined<activityHours?['No continuous combined window fits the requested activity']:[])]};
}
export function pinLocation(ids,id){
 if(ids.includes(id))return ids;
 if(ids.length>=3)throw new Error('Remove a pinned location before adding another; compare up to three.');
 return [...ids,id];
}
export function nextVisibilityEvent(samples,index,object){
 if(!['sun','earth'].includes(object)||!samples[index])throw new Error('Invalid replay target');
 const current=samples[index][object];
 for(let i=index+1;i<samples.length;i++)if(samples[i][object]!==samples[i-1][object])return {currentVisible:current,kind:samples[i][object]?'returns':'is lost',fromUTC:samples[i-1].utc,toUTC:samples[i].utc,afterHours:samples[i-1].hour-samples[index].hour,byHours:samples[i].hour-samples[index].hour};
 return {currentVisible:current,kind:'not-found',scope:'No transition found in the calculated mission interval'};
}
export function alternatives(sites,config,activityHours,heights=[config.height]){
 if(new Set(sites.map(site=>site.analysisModel??'terrain')).size>1)throw new Error('Use a common calculation model before ranking alternatives across sites. Select reference sphere for all sites or compare terrain sites together.');
 const choices=[],unavailable=[],cells=[];
 for(const site of sites)for(const height of heights)for(let extra=0;extra<=72;extra+=12){try{const c=comparePoint(site,{...config,height,delay:config.delay+extra},activityHours);cells.push({analysisModel:site.analysisModel??'terrain',siteId:site.id,name:site.name,height,extraHours:extra,arrivalUTC:c.revised.startUTC,status:c.failures.length?'fails':'passes',overlap:c.revised.overlap,longestCombined:c.revised.longestCombined,failures:c.failures,margins:constraintMargins(c,config,activityHours)});if(!c.failures.length)choices.push({analysisModel:site.analysisModel??'terrain',siteId:site.id,name:site.name,height,extraHours:extra,delay:config.delay+extra,overlap:c.revised.overlap,longestCombined:c.revised.longestCombined});}catch(e){unavailable.push({siteId:site.id,height,extraHours:extra,reason:e.message});cells.push({analysisModel:site.analysisModel??'terrain',siteId:site.id,name:site.name,height,extraHours:extra,status:'unavailable',reason:e.message,arrivalUTC:new Date(Date.parse(config.startUTC)+(config.delay+extra)*3600000).toISOString()});}}
 choices.sort((a,b)=>a.extraHours-b.extraHours||b.longestCombined-a.longestCombined||b.overlap-a.overlap);
 for(const c of choices)c.tied=choices.filter(o=>o.extraHours===c.extraHours&&Math.abs(o.longestCombined-c.longestCombined)<1e-8&&Math.abs(o.overlap-c.overlap)<1e-8).length>1;
 return {choices,unavailable,cells,tested:sites.length*heights.length*7};
}

export function constraintMargins(comparison,config,activityHours){
 return {darkness:config.maxDark-comparison.revised.longestDark,overlap:comparison.revised.overlap-config.minOverlap,activity:comparison.revised.longestCombined-activityHours};
}
