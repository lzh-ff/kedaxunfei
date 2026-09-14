import http from 'node:http';
import {createNodeHandler} from '../server/tutor-proxy.mjs';
const handler=createNodeHandler();
const port=Number(process.env.TUTOR_PORT||4174);
http.createServer((req,res)=>{if(req.url==='/api/chat')return handler(req,res);res.writeHead(404,{'Content-Type':'application/json'});res.end('{"code":"NOT_FOUND"}');}).listen(port,'127.0.0.1',()=>console.log(`Tutor proxy listening on http://127.0.0.1:${port}/api/chat`));
