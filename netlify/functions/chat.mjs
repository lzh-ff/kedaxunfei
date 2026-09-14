// Netlify adapter for the tutoring proxy.
// createTutorProxy is transport-agnostic: it takes a plain request description
// and returns {status, headers, json}, so this file only translates shapes.
import {createTutorProxy} from '../../server/tutor-proxy.mjs';

const handle=createTutorProxy();

export default async function(request,context){
 const body=request.method==='POST'?await request.text():undefined;
 const result=await handle({
  method:request.method,
  headers:Object.fromEntries(request.headers),
  body,
  // Netlify terminates TLS and supplies the client address itself, so the
  // rate limiter does not have to trust a forwarded header.
  ip:context?.ip||request.headers.get('x-nf-client-connection-ip')||'unknown',
  signal:request.signal,
 });
 return new Response(result.json===null?null:JSON.stringify(result.json),{status:result.status,headers:result.headers});
}

export const config={path:'/api/chat'};
