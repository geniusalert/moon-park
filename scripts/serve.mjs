import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {navigatorAPI} from './navigator-service.mjs';
import {aiAPI} from './ai-service.mjs';
const root=resolve('.');
const port=Number(process.env.PORT??4173);
if(!Number.isInteger(port)||port<1||port>65535)throw new Error('PORT must be an integer from 1 to 65535');
http.createServer(async(req,res)=>{
 try {
  if(![`127.0.0.1:${port}`,`localhost:${port}`].includes(req.headers.host)){res.writeHead(403).end('Invalid host');return;}
  const requested=new URL(req.url,`http://${req.headers.host}`);
  // Credentials and repository metadata must never be static web assets.
  if(decodeURIComponent(requested.pathname).split('/').some(p=>p.startsWith('.'))){res.writeHead(404).end('Not found');return;}
  if(['/workbench.html','/registration.html','/pilot.html'].includes(requested.pathname)){
   res.writeHead(302,{Location:'/'}).end();return;
  }
  if(await aiAPI(req,res,requested))return;
  if(await navigatorAPI(req,res,requested))return;
  const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname === '/' ? '/index.html' : new URL(req.url,'http://localhost').pathname));
  if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}
  const body=await readFile(path);res.writeHead(200,{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.glb':'model/gltf-binary','.wasm':'application/wasm','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.tif':'image/tiff','.tiff':'image/tiff','.csv':'text/csv; charset=utf-8','.md':'text/plain; charset=utf-8','.zip':'application/zip','.pptx':'application/vnd.openxmlformats-officedocument.presentationml.presentation'})[extname(path)]||'application/octet-stream','X-Content-Type-Options':'nosniff'}).end(body);
 }catch{res.writeHead(404).end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`Moon Park: http://127.0.0.1:${port}`));
