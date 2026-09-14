import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
import {createNodeHandler} from './tutor-proxy.mjs';
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.txt':'text/plain; charset=utf-8','.md':'text/plain; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.woff2':'font/woff2'};
export function createLocalApp({rootDir=resolve('web/out-local'),env=process.env,fetchImpl=fetch}={}){
 const root=resolve(rootDir),port=Number(env.TUTOR_PORT||4174);
 const proxy=createNodeHandler({env:{...env,TUTOR_ALLOWED_ORIGINS:env.TUTOR_ALLOWED_ORIGINS||`http://127.0.0.1:${port},http://localhost:${port}`},fetchImpl});
 return http.createServer(async(req,res)=>{
  const pathname=(req.url||'/').split('?')[0];
  if(pathname==='/api/chat')return proxy(req,res);
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
  try{
   let path=decodeURIComponent(pathname);if(path==='/'||path==='/kedaxunfei'){res.writeHead(302,{Location:'/kedaxunfei/'});res.end();return;}
   if(!path.startsWith('/kedaxunfei/'))throw new Error('not found');
   path=path.slice('/kedaxunfei/'.length);if(path.split(/[\\/]/).some(part=>part==='..'||part.startsWith('.')))throw new Error('not found');
   let file=resolve(root,path||'index.html');if(file!==root&&!file.startsWith(root+sep))throw new Error('not found');
   if((await stat(file)).isDirectory())file=resolve(file,'index.html');
   const content=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:content);
  }catch{res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('页面不存在。请先完成本机模型版构建。');}
 });
}
