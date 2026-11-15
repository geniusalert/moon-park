import {supportedPolarPoint} from './moon-coordinates.js';
export const hasCoordinates=p=>!!p&&Number.isFinite(p.latitude)&&Number.isFinite(p.longitude)&&p.latitude>=-90&&p.latitude<=90;
export function analysisModelFor(point,preference='auto'){
 if(!hasCoordinates(point))throw new Error('No published coordinate is available for this mission. Enter a custom study coordinate.');
 if(!['auto','terrain','reference-sphere'].includes(preference))throw new Error('Unknown analysis model');
 if(preference==='terrain'&&!supportedPolarPoint(point))throw new Error('Polar terrain calculations cover 85–90°S. Select reference sphere for this location.');
 return preference==='auto'?(supportedPolarPoint(point)?'terrain':'reference-sphere'):preference;
}
export const modelLabel=site=>site?.analysisModel==='reference-sphere'?'Reference sphere · terrain omitted':'Polar terrain · measured DEM sources';
export function filterMissions(missions,group='all',query=''){
 const needle=query.trim().toLocaleLowerCase();return missions.filter(p=>(group==='all'||p.groups.includes(group))&&(!needle||`${p.name} ${p.operator} ${p.status}`.toLocaleLowerCase().includes(needle)));
}

export const coordinateMeaning=type=>({'landed':'Reported landing position','impact':'Reported impact position','region-reference':'Regional reference; exact target not specified','unpublished':'Exact coordinate unpublished','custom':'Custom study coordinate','benchmark':'Prepared research benchmark','interior':'Prepared interior study sample'}[type]??'Study coordinate');

export const coordinateLabel=p=>hasCoordinates(p)?`${Math.abs(p.latitude).toFixed(6)}° ${p.latitude<0?'S':'N'}, ${Math.abs(p.longitude).toFixed(6)}° ${p.longitude<0?'W':'E'}`:'Coordinate unpublished';
