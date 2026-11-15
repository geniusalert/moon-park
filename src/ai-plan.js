// Shared boundary between model output and application actions. No generated code is executed.
export const AI_ACTIONS=['calculate','compare_sites','find_site','find_arrival','inspect','explain','clarify'];
const nullable=t=>({type:[t,'null']});
export const PLAN_SCHEMA={type:'object',additionalProperties:false,required:['action','reply','locations','settings','assumptions','questions','view','arrivalDeadlineUTC'],properties:{
 action:{type:'string',enum:AI_ACTIONS},reply:{type:'string'},
 locations:{type:'array',maxItems:3,items:{type:'object',additionalProperties:false,required:['catalogueId','name','latitude','longitude'],properties:{catalogueId:nullable('string'),name:nullable('string'),latitude:nullable('number'),longitude:nullable('number')}}},
 settings:{type:'object',additionalProperties:false,required:['startUTC','duration','delay','height','maxDark','minOverlap','minSun','maxBlackout','activityHours','modelPreference'],properties:{startUTC:nullable('string'),duration:nullable('number'),delay:nullable('number'),height:nullable('number'),maxDark:nullable('number'),minOverlap:nullable('number'),minSun:nullable('number'),maxBlackout:nullable('number'),activityHours:nullable('number'),modelPreference:{type:['string','null'],enum:['auto','terrain','reference-sphere',null]}}},
 assumptions:{type:'array',items:{type:'string'},maxItems:10},questions:{type:'array',items:{type:'string'},maxItems:5},
 view:{type:'string',enum:['globe','map','horizon','timeline','simulation','landing']},arrivalDeadlineUTC:nullable('string')
}};
export function supportedUTC(value){return typeof value==='string'&&/^2027-\d\d-\d\dT\d\d:\d\d:00Z$/.test(value)&&Number(value.slice(14,16))%10===0&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString()===value.replace('Z','.000Z');}
const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
function keys(value,allowed){if(!object(value)||Object.keys(value).some(k=>!allowed.includes(k)))throw new Error('Unexpected AI plan fields');}
export function validateAIPlan(raw,catalogue,current={}){
 keys(raw,Object.keys(PLAN_SCHEMA.properties));if(!AI_ACTIONS.includes(raw.action)||typeof raw.reply!=='string'||raw.reply.length>6000)throw new Error('Invalid AI action or explanation');
 if(!Array.isArray(raw.locations)||raw.locations.length>3)throw new Error('Compare at most three locations');
 const locations=raw.locations.map(p=>{keys(p,['catalogueId','name','latitude','longitude']);
  if(p.catalogueId){const known=catalogue.find(k=>k.id===p.catalogueId);if(!known)throw new Error('AI requested an unknown catalogue location');if(!Number.isFinite(known.latitude)||!Number.isFinite(known.longitude))throw new Error('This mission has no published coordinate');if((p.latitude!=null&&Math.abs(p.latitude-known.latitude)>1e-8)||(p.longitude!=null&&Math.abs(p.longitude-known.longitude)>1e-8))throw new Error('AI changed a catalogue coordinate');return {...known};}
  if(!Number.isFinite(p.latitude)||Math.abs(p.latitude)>90||!Number.isFinite(p.longitude)||Math.abs(p.longitude)>360)throw new Error('AI did not provide valid lunar coordinates');
  const longitude=Math.abs(p.latitude)===90?0:((p.longitude+180)%360+360)%360-180;
  return {id:`coordinate:${p.latitude}:${longitude}`,name:typeof p.name==='string'?p.name.slice(0,120):'AI-entered coordinate',latitude:p.latitude,longitude,kind:'custom'};
 });
 if(new Set(locations.map(p=>p.id)).size!==locations.length)throw new Error('AI requested duplicate locations');
 const allowed=Object.keys(PLAN_SCHEMA.properties.settings.properties);keys(raw.settings,allowed);
 const settings={};for(const key of allowed)if(raw.settings[key]!=null)settings[key]=raw.settings[key];
 if(settings.startUTC!==undefined&&!supportedUTC(settings.startUTC))throw new Error('Choose a real 2027 UTC arrival on the ten-minute grid; no time was rounded');
 if(settings.height!==undefined&&![2,5,10].includes(settings.height))throw new Error('Observer height must be 2, 5 or 10 metres');
 for(const [key,min,max] of [['duration',1,168],['delay',0,72],['maxDark',0,744],['minOverlap',0,744],['minSun',0,744],['maxBlackout',0,744],['activityHours',0.1,168]])if(settings[key]!==undefined&&(!Number.isFinite(settings[key])||settings[key]<min||settings[key]>max))throw new Error('Unsupported '+key+' in AI plan');
 for(const key of ['duration','delay'])if(settings[key]!==undefined&&Math.abs(settings[key]*6-Math.round(settings[key]*6))>1e-8)throw new Error('Duration and delay must use the ten-minute grid');
 if((settings.activityHours??current.activityHours??2)>(settings.duration??current.duration??72))throw new Error('Continuous activity must fit within the stay');
 if(settings.modelPreference!==undefined&&!['auto','terrain','reference-sphere'].includes(settings.modelPreference))throw new Error('Unsupported scientific model');
 if(!['globe','map','horizon','timeline','simulation','landing'].includes(raw.view))throw new Error('Unknown visualization');
 for(const name of ['assumptions','questions'])if(!Array.isArray(raw[name])||raw[name].length>(name==='questions'?5:10)||raw[name].some(t=>typeof t!=='string'||t.length>1200))throw new Error('Invalid clarification text');
 if(raw.arrivalDeadlineUTC!=null&&!supportedUTC(raw.arrivalDeadlineUTC))throw new Error('Arrival deadline must be a 2027 UTC time on the ten-minute grid');
 if(raw.action!=='find_arrival'&&raw.arrivalDeadlineUTC!=null)throw new Error('Arrival deadlines apply only to arrival searches');
 if(raw.arrivalDeadlineUTC!=null){const start=new Date(Date.parse(raw.arrivalDeadlineUTC)-72*3600000).toISOString().replace('.000Z','Z');if(!supportedUTC(start))throw new Error('The 72-hour search before this deadline extends outside 2027');settings.startUTC=start;settings.delay=0;}
 return {action:raw.questions.length?'clarify':raw.action,reply:raw.reply,locations,settings,assumptions:raw.assumptions,questions:raw.questions,view:raw.view,arrivalDeadlineUTC:raw.arrivalDeadlineUTC??null};
}
export function rankSiteResults(records){
 const passing=records.filter(r=>r.comparison&&!r.comparison.failures.length);
 const ranked=passing.sort((a,b)=>b.comparison.revised.longestCombined-a.comparison.revised.longestCombined||b.comparison.revised.overlap-a.comparison.revised.overlap);
 return ranked.map(r=>({...r,tied:ranked.some(other=>other.id!==r.id&&Math.abs(other.comparison.revised.longestCombined-r.comparison.revised.longestCombined)<1e-8&&Math.abs(other.comparison.revised.overlap-r.comparison.revised.overlap)<1e-8)}));
}
