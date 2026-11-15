import {copyFile,mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root='node_modules/three/',out='src/vendor/';
await mkdir(out,{recursive:true});
const files={'build/three.module.js':'three.module.js','build/three.core.js':'three.core.js','examples/jsm/controls/OrbitControls.js':'OrbitControls.js','LICENSE':'THREE-LICENSE.txt'};
const manifest={package:'three',version:JSON.parse(await readFile(root+'package.json','utf8')).version,license:'MIT',files:{}};
for(const [from,to] of Object.entries(files)){await copyFile(root+from,out+to);manifest.files[to]=createHash('sha256').update(await readFile(out+to)).digest('hex');}
await writeFile(out+'manifest.json',JSON.stringify(manifest,null,2)+'\n');
console.log('Vendored Three.js',manifest.version);
