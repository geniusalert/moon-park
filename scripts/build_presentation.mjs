import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
export async function buildDeck(presentation){
 const root=fileURLToPath(new URL('../',import.meta.url));
 const report=JSON.parse(await fs.readFile(root+'docs/candidate-validation.json','utf8'));
 const text=(slide,value,x,y,w,h,size=28,color='#e8e9e5')=>{
  const shape=slide.shapes.add({geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});
  shape.text=value;shape.text.style={fontFamily:'Arial',fontSize:size,color:color};return shape;
 };
 const make=(title,note)=>{const slide=presentation.slides.add();slide.background.fill='#101716';text(slide,title,64,48,1152,105,44);slide.speakerNotes.text=note;return slide;};
 const foot=(s,t)=>text(s,t,64,648,1152,42,17,'#a8bbac');
 let s=make('Moon Park · Lunar Landing Site Navigator','AI-assisted software and documentation. Terrain: https://pgda.gsfc.nasa.gov/products/78 ; geometry: https://naif.jpl.nasa.gov/ . Local implementation and evidence under docs/. Development dates are recorded; event eligibility is not asserted.');
 text(s,'The arrival moved.\nDoes the surface mission still fit?',64,188,560,215,42,'#c9e2aa');
 text(s,'Compare visibility requirements, inspect the terrain, and preserve the evidence.',64,455,520,125,27);
 s.images.add({path:root+'docs/preview-v0.5.png',alt:'Real Moon Park terrain and polar map interface using NASA LOLA elevations',fit:'contain',position:{left:660,top:190,width:550,height:370}});
 foot(s,'Research prototype · visibility calculations are not a landing safety assessment');
 s=make('Specific coordinates, documented sources','NASA terrain and ROI archives: https://pgda.gsfc.nasa.gov/products/78 ; regional terrain: https://pgda.gsfc.nasa.gov/products/90 ; observer geometry: https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/C/cspice/spkcpo_c.html ; local data/candidates.json.');
 text(s,'27 calculated interior points\n15 published study outlines\n3 lunar terrain areas',64,190,570,275,42,'#c9e2aa');
 text(s,'Native 5 m local terrain\n240 m regional terrain to 180 km\nDE421 / MOON_ME geometry\n2, 5 and 10 m observer heights',700,190,500,295,29);
 foot(s,'Sampling does not establish equivalent physical accuracy; interiors between sample points remain uncalculated');
 s=make('A measured arrival-delay recovery','docs/candidate-validation.json, Site01-roi-1-grid-south. Config: 2026-11-14 UTC, delay 48 h, duration 72 h, height 2 m, darkness limit 12 h, combined minimum 8 h. Sample is approximately 50.25 m from anchor. Both scenarios have 72 h modeled sunlight.');
 text(s,'Connecting Ridge · interior south probe\n72-hour mission · 2 m observer · 8 h minimum overlap',64,153,1100,90,26,'#a8bbac');
 s.charts.add('bar',{position:{left:64,top:275,width:720,height:325},categories:['Baseline','Delayed +48 h'],series:[{name:'Combined hours',values:[5.17,53.17],fill:'#64845a'}],hasLegend:false,dataLabels:{showValue:true,position:'outEnd',numberFormatCode:'0.00',textStyle:{fontFamily:'Arial',fontSize:20}},chartFill:'#f0f2eb',plotAreaFill:'#f0f2eb',yAxis:{min:0,max:72,numberFormatCode:'0',textStyle:{fontFamily:'Arial',fontSize:18}},xAxis:{textStyle:{fontFamily:'Arial',fontSize:18}},barOptions:{direction:'column',grouping:'clustered'}});
 text(s,'5.17 h → 53.17 h',835,290,365,100,39,'#c9e2aa');
 text(s,'The baseline fails the 8 h limit.\nThe delayed case passes the configured nominal limits.',835,405,365,180,27);
 foot(s,'10-minute time bins · nominal terrain · no clone ensemble calculated at this interior sample');
 s=make('Nearby samples have different visibility','docs/candidate-validation.json, Site04-roi-1, default delayed scenario. Labels denote map-grid probe targets, not local compass directions. Offsets are recorded in metadata; each probe is constrained to an interior native pixel.');
 const g=report.regions.find(r=>r.regionId==='Site04-roi-1');
 s.charts.add('bar',{position:{left:64,top:185,width:760,height:390},categories:g.points.map(p=>p.id.split('grid-')[1]??'anchor'),series:[{name:'Combined hours',values:g.points.map(p=>Number(p.delayed.overlap.toFixed(2))),fill:'#4e8c98'}],hasLegend:false,dataLabels:{showValue:true,position:'outEnd',numberFormatCode:'0.00',textStyle:{fontFamily:'Arial',fontSize:20}},chartFill:'#f0f2eb',plotAreaFill:'#f0f2eb',yAxis:{min:0,max:36,numberFormatCode:'0',textStyle:{fontFamily:'Arial',fontSize:18}},xAxis:{textStyle:{fontFamily:'Arial',fontSize:18}},barOptions:{direction:'column',grouping:'clustered'}});
 text(s,'21.00–28.17 h',865,210,340,100,38,'#c9e2aa');
 text(s,'Five samples inside one Shackleton study outline.\n\nA nearby point’s result cannot stand in for the entire region.',865,335,340,240,27);
 foot(s,'Same delayed scenario as slide 3 · nominal spatial variation, not a probability interval');
 s=make('Tested terrain support changes the activity start','Original benchmark points only: docs/UNCERTAINTY.md and uncertainty-validation.json. Default Connecting Ridge: nominal first combined window starts 2026-11-16T12:40Z; intersection across nominal plus four clone cases and four numerical checks starts 12:50Z. A two-hour activity fits.');
 text(s,'12:40 UTC',64,208,520,95,62,'#a8bbac');text(s,'First nominal activity start',64,322,520,65,27);
 text(s,'12:50 UTC',700,208,520,95,62,'#c9e2aa');text(s,'First start shared by all tested cases',700,322,520,85,27);
 text(s,'Four conditional near-field terrain realizations and four separate numerical checks. Counts are not probabilities. These tests apply to the original benchmark points.',64,457,1140,125,29);
 foot(s,'16 November 2026 · 2-hour activity · regional terrain uncertainty remains untested');
 s=make('Every result has an evidence path','Local evidence: candidate-validation.json, candidate-science-validation.json, frame-validation.json, time-convergence.json, uncertainty-validation.json and spatial-validation.json, all under docs/. Source hashes, formulas and reproduction instructions: PROJECT_PLAN.md and README.md.');
 text(s,'Source terrain and kernels\nCoordinates, native elevation and UTC\nHorizon rays and visibility intervals\nConstraints, alternatives and receipt',64,180,690,370,33);
 text(s,'Checksums travel with the result',840,190,355,145,36,'#c9e2aa');text(s,'Exports retain inputs,\nsource identities,\nmodel limits and exact\nsoftware hashes.',840,383,355,165,28);
 foot(s,'SPICE / Horizons comparisons check an implementation path; they are not independent observational truth');
 s=make('Use the prototype within its measured scope','Data: https://pgda.gsfc.nasa.gov/products/78 and https://naif.jpl.nasa.gov/ . Prior art: NASA Moon Trek, https://trek.nasa.gov/moon/jpl/config/textAbout.html . Human pilot: docs/USABILITY.md. AI-assisted development; no NASA endorsement or operational certification.');
 text(s,'Explore dates, compare requirements, inspect a sampled point, and export a decision receipt.',64,180,1090,145,40,'#c9e2aa');
 text(s,'Open: actual-user interpretation study, independent scientific review and full-field terrain uncertainty.\n\nExcluded: landing hazards, power, thermal survival, eclipses and radio-link budgets.',64,370,1100,195,28);
 foot(s,'AI-assisted software and documentation · real NASA/JPL source data · educational research prototype');
 return {slideCount:presentation.slides.items.length};
}

