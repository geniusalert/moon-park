export function renderEphemerisSource(site,height){
 let panel=document.getElementById('ephemerisSource');if(!panel){panel=document.createElement('p');panel.id='ephemerisSource';panel.className='muted';document.getElementById('liveMetrics').after(panel);}
 const root=site.ephemerisProvenanceByHeight?.[height??document.getElementById('height')?.value]??site.ephemerisProvenance??{},records=root.sun?[root.sun,root.earth]:[root];
 const labels=records.map(p=>p?.engine??(p?.parameters?'JPL Horizons':p?.kernels?'SPICE with recorded kernels':'Source not recorded'));
 panel.textContent=`Sun/Earth observations: ${[...new Set(labels)].join('; ')}. Frame: ${[...new Set(records.map(p=>p?.frame??'not recorded'))].join('; ')}. Sample spacing: ${site.observationStepMinutes??10} minutes. `;
 const link=document.createElement('a');link.href='https://ssd.jpl.nasa.gov/horizons/';link.target='_blank';link.rel='noopener';link.textContent='About JPL ephemerides';panel.append(link);if(records.some(p=>p?.frameAlignment)){panel.append(document.createTextNode(' '+records.find(p=>p?.frameAlignment).frameAlignment+'.'));}
}
