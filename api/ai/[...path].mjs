import {aiAPI} from '../../scripts/ai-service.mjs';

export default async function handler(req,res){
 const host=req.headers.host;
 if(!host){res.writeHead(400,{'Content-Type':'application/json'}).end(JSON.stringify({error:'Missing host'}));return;}
 const url=new URL(req.url,`https://${host}`);
 await aiAPI(req,res,url);
}
