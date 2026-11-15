export const MISSION_CONTEXT=[
 ['apollo-11','Apollo 11',.67416,23.47314],['apollo-12','Apollo 12',-3.0128,-23.4219],['apollo-14','Apollo 14',-3.64589,-17.47194],['apollo-15','Apollo 15',26.13239,3.63330],['apollo-16','Apollo 16',-8.9734,15.5011],['apollo-17','Apollo 17',20.1911,30.7723]
].map(([id,name,latitude,longitude])=>({id,name,latitude,longitude,kind:'historical-context',source:'https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_sites.html',sourceDate:'2017-03-06',frame:'Planetocentric Mean Earth/Polar Axis, DE421',description:'Historical Lunar Module landing coordinate from NASA NSSDCA. Outside the validated 85–90°S terrain cap; location context only.'}));
export const POLAR_DESTINATIONS=[
 {name:'Shackleton rim · image study coordinate',latitude:-89.7614,longitude:-157.1289,source:'https://data.lroc.im-ldi.com/lroc/view_rdr_product/NAC_DTM_ESALL_SR12_NACMOS_1M',description:'User-provided study coordinate in the Shackleton rim image-product coverage. On-demand terrain calculation; not a declared mission landing target.'},
 {name:'de Gerlache rim · image study coordinate',latitude:-88.668,longitude:-68.4034,source:'https://data.lroc.im-ldi.com/lroc/view_rdr_product/NAC_ROI_DEGERRIMLO1_P885S2933',description:'User-provided study coordinate in the de Gerlache rim image-product coverage. Historical imagery does not establish current illumination or accepted registration.'},
 {name:'Lunar south pole · coordinate reference',latitude:-90,longitude:0,source:'https://pgda.gsfc.nasa.gov/products/90',description:'Exact geographic pole. Longitude zero supplies the documented azimuth reference; it is not a selected mission target.'}
].map(p=>({...p,id:`coordinate:${p.latitude}:${p.longitude}`,kind:'custom',coordinateBasis:p.latitude===-90?'Geographic definition of south pole':'User-provided study coordinate; product page supplies geographic image context',sourceDate:'2026-11-13',frame:'Calculation uses MOON_ME / DE421'}));
const ARTIFACT_SOURCE='https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_artifact_impacts.html';
const mission=(id,name,latitude,longitude,groups,operator,status,coordinateType='landed',extra={})=>({id,name,latitude,longitude,groups,operator,status,coordinateType,kind:'mission',source:ARTIFACT_SOURCE,coordinateSource:ARTIFACT_SOURCE,sourceDate:'Verified 2026-11-13',lastVerified:'2026-11-13',frame:coordinateType==='unpublished'?null:'DE421 mean Earth/polar axis, as specified by NASA NSSDCA table notes',description:'Source-specific reported location; evaluate a user-selected 2027 arrival rather than replaying the historical mission date.',...extra});
export const MISSION_SITES=[
 ...MISSION_CONTEXT.map(p=>({...p,kind:'mission',groups:['apollo'],operator:'NASA · United States',status:'Historical landing',coordinateType:'landed',coordinateSource:p.source,lastVerified:'2026-11-13',description:'NASA NSSDCA Lunar Module landing coordinate. Evaluate a hypothetical 2027 arrival here; reference-sphere results omit actual terrain.'})),
 mission('blue-ghost-1','Blue Ghost Mission 1',18.562,61.810,['clps','commercial'],'Firefly Aerospace · United States','Landed 2025'),
 mission('im-1','IM-1 · Odysseus',-80.13,1.44,['clps','commercial'],'Intuitive Machines · United States','Landed 2024'),
 mission('im-2','IM-2 · Athena',-84.7906,29.1957,['clps','commercial'],'Intuitive Machines · United States','Landed 2025'),
 mission('hakuto-r-1','HAKUTO-R Mission 1',47.581,44.094,['commercial','international'],'ispace · Japan','Impact 2023','impact'),
 mission('hakuto-r-2','HAKUTO-R Mission 2 · RESILIENCE',60.4445,-4.588,['commercial','international'],'ispace · Japan','Impact 2025','impact'),
 mission('beresheet','Beresheet',32.5956,19.3496,['commercial','international'],'SpaceIL / IAI · Israel','Impact 2019','impact'),
 mission('change-3',"Chang’e 3",44.1214,-19.5117,['international'],'CNSA · China','Landed 2013'),
 mission('change-4',"Chang’e 4",-45.4561,177.5885,['international'],'CNSA · China','Landed 2019'),
 mission('change-5',"Chang’e 5",43.0576,-51.9161,['international'],'CNSA · China','Landed 2020'),
 mission('change-6',"Chang’e 6",-41.6385,-153.9852,['international'],'CNSA · China','Landed 2024'),
 mission('chandrayaan-3','Chandrayaan-3 · Vikram',-69.3741,32.32,['international'],'ISRO · India','Landed 2023'),
 mission('slim','SLIM',-13.316,25.251,['international'],'JAXA · Japan','Landed 2024'),
 mission('luna-16','Luna 16',-.5137,56.3638,['international'],'Soviet lunar programme','Landed 1970'),
 mission('luna-17','Luna 17',38.23764,-35.00163,['international'],'Soviet lunar programme','Landed 1970'),
 mission('im-3-target','IM-3 · Reiner Gamma regional reference',7.39,-58.96,['future-clps','clps','commercial'],'Intuitive Machines · United States','Planned target region','region-reference',{source:'https://www.nasa.gov/gallery/intuitive-machines-im-3/',coordinateSource:'https://planetarynames.wr.usgs.gov/Feature/4987',description:'USGS centre of Reiner Gamma is a regional comparison reference. It is not a published exact IM-3 touchdown coordinate.'}),
 mission('im-4-target','IM-4 · Mons Mouton regional reference',-84.6,31,['future-clps','clps','commercial'],'Intuitive Machines · United States','Planned target region','region-reference',{source:'https://pgda.gsfc.nasa.gov/products/101',coordinateSource:'https://planetarynames.wr.usgs.gov/Feature/16070',description:'NASA PGDA lists Mons Mouton. The USGS feature centre is used as a regional reference, not an exact landing target.'}),
 mission('griffin-1-target','Griffin Mission 1 · Mons Mouton region',null,null,['future-clps','clps','commercial'],'Voyager / Astrobotic · United States','Planned 2027 in source','unpublished',{source:'https://pgda.gsfc.nasa.gov/products/101',coordinateSource:null,description:'Source names Mons Mouton but no exact touchdown coordinate. No marker or calculation is assigned; use the source or enter a custom study coordinate.'}),
 mission('blue-ghost-2-target','Blue Ghost Mission 2 · near Nassau crater',null,null,['future-clps','clps','commercial'],'Firefly Aerospace · United States','Planned, no earlier than 2027','unpublished',{source:'https://fireflyspace.com/missions/blue-ghost-mission-2/',coordinateSource:null,description:'Operator names a far-side region near Nassau crater. Exact touchdown coordinates are not supplied by this source; no marker is invented.'}),
 mission('draper-series-2-target','Draper SERIES-2 · Schrödinger basin',null,null,['future-clps','clps','commercial'],'Draper / ispace U.S. · United States','Planned target region','unpublished',{source:'https://www.nasa.gov/wp-content/uploads/2025/02/np-2025-02-005-jsc-clps-intuitive-machines-press-kit-508-2-25-25.pdf',coordinateSource:null,description:'NASA identifies Schrödinger basin. An exact landing coordinate is not supplied in this catalogue; no basin centre is substituted for the target.'}),
 mission('blue-ghost-3-target','Blue Ghost Mission 3 · Gruithuisen domes',null,null,['future-clps','clps','commercial'],'Firefly Aerospace · United States','Planned target region','unpublished',{source:'https://www.nasa.gov/wp-content/uploads/2025/02/np-2025-02-005-jsc-clps-intuitive-machines-press-kit-508-2-25-25.pdf',coordinateSource:null,description:'NASA identifies the Gruithuisen domes. No exact touchdown coordinate is supplied by the cited source.'}),
 mission('blue-moon-mk1-target','Blue Moon Mark 1 · south-pole region',null,null,['future-clps','clps','commercial'],'Blue Origin · United States','Planned 2027 in source','unpublished',{source:'https://pgda.gsfc.nasa.gov/products/101',coordinateSource:null,description:'NASA PGDA lists a south-pole regional destination without exact coordinates. No point marker or calculated target is invented.'}),
 mission('astrolab-flip-target','FLIP rover · Mons Mouton region',null,null,['commercial'],'Venturi Astrolab · United States','Planned 2027 in source','unpublished',{source:'https://pgda.gsfc.nasa.gov/products/101',coordinateSource:null,description:'NASA PGDA lists Mons Mouton for the rover. Exact deployment coordinates are unpublished in this source.'}),
 mission('ispace-mission-3','ispace Mission 3',null,null,['commercial','international'],'ispace · Japan','Planned 2028 in source','unpublished',{source:'https://2022.ispace-inc.com/news-en/?p=8776',coordinateSource:null,description:'Operator’s 30 March 2026 update schedules Mission 3 in 2028. No exact target coordinate is supplied here. The navigator supports hypothetical arrivals during 2027 only.'})
].map(record=>{
 if(record.coordinateType==='unpublished')return {...record,coordinateMetadata:{status:'unpublished',sourceFrame:null,targetFrame:'MOON_ME_DE421',evidence:[record.source]}};
 const regional=record.coordinateType==='region-reference';
 return {...record,frame:regional?'LOLA 2011 control network; DE421 mean Earth/polar axis':'Planetocentric DE421 mean Earth/polar axis',coordinateMetadata:{
  status:regional?'control-network-matched':'source-confirmed',
  sourceFrame:'MOON_ME_DE421',targetFrame:'MOON_ME_DE421',
  controlNetwork:regional?'LOLA 2011':null,
  latitudeConvention:regional?'Planetographic on the lunar spherical datum':'Planetocentric',
  longitudeConvention:'east-positive; wrapped to -180 to 180',
  transformation:'Identity in the stated DE421 mean Earth frame',
  frameDisplacementM:0,
  verificationDate:'2026-11-14',
  evidence:regional?[record.coordinateSource,'https://planetarynames.wr.usgs.gov/TargetCoordinates','https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/document/rdrsis.htm']:[record.coordinateSource],
  limitations:['Frame identity does not establish coordinate measurement accuracy.','Displayed decimal precision is separate from geolocation uncertainty.',...(regional?['Regional feature centre; no exact mission landing target is established.']:[])]
 }};
});
