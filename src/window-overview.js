export function renderWindowOverview(container,result){
 for(const [key,label] of [['sun','Sunlight duration'],['earth','Earth visibility duration']]){let hours=0,count=0;result.samples.forEach((s,i)=>{if(!s[key])return;if(!i||!result.samples[i-1][key])count++;const end=Math.min(Date.parse(result.endUTC),Date.parse(result.samples[i+1]?.utc??result.endUTC));hours+=Math.max(0,end-Date.parse(s.utc))/3600000;});const card=document.createElement('div');for(const [tag,text] of [['span',label],['strong',`${hours.toFixed(1)} h`],['small',`${count} visibility window(s) within selected stay`]]){const el=document.createElement(tag);el.textContent=text;card.append(el);}container.append(card);}
}
export function drawElevationChart(svg,result,index){
 svg.setAttribute('viewBox','0 0 720 245');const add=(tag,attrs,text)=>{const e=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,v);if(text)e.textContent=text;svg.append(e);};
 const values=result.samples.flatMap(s=>[s.sunEl,s.earthEl]),lo=Math.min(0,...values),hi=Math.max(1,...values),y=v=>215-(v-lo)/(hi-lo)*85,x=i=>110+i/result.samples.length*550;
 add('text',{x:0,y:123},'Elevation · degrees');for(const v of [lo,hi])add('text',{x:25,y:y(v)},`${v.toFixed(1)}°`);add('path',{d:`M110,${y(0)}H660`,stroke:'#91a596','stroke-dasharray':'4 4'});
 for(const [key,color]of [['sunEl','#edcc8b'],['earthEl','#aec4aa']])add('path',{d:result.samples.map((s,i)=>`${i?'L':'M'}${x(i)},${y(s[key])}`).join(' '),fill:'none',stroke:color,'stroke-width':2});
 add('path',{d:`M${x(index)},128V218`,stroke:'white'});add('text',{x:110,y:240},'Sun: gold · Earth: sage · replay moves the white cursor');
}
