import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,mkdtemp,writeFile,rm} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
let module;try{module=await import('../server/local-app.mjs');}catch(error){if(error.code!=='ERR_MODULE_NOT_FOUND')throw error;}
test('one loopback server serves only exported files and bounded tutoring API, never source files',async()=>{
 assert.equal(typeof module?.createLocalApp,'function','combined local teaching app must exist');
 const scratch=resolve('test-results');await mkdir(scratch,{recursive:true});const rootDir=await mkdtemp(resolve(scratch,'local-app-'));await writeFile(resolve(rootDir,'index.html'),'<h1>local test</h1>');
 const origin='http://localhost:4174';const server=module.createLocalApp({rootDir,env:{DEEPSEEK_API_KEY:'unit-test-token',TUTOR_ALLOWED_ORIGINS:origin},fetchImpl:async()=>new Response(JSON.stringify({choices:[{message:{content:'教材说明'},finish_reason:'stop'}]}))});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const url='http://127.0.0.1:'+server.address().port;
 try{
  const page=await fetch(url+'/kedaxunfei/');assert.equal(page.status,200);assert.match(await page.text(),/local test/);
  for(const path of ['/server/tutor-proxy.mjs','/.env','/kedaxunfei/%2e%2e%2fpackage.json'])assert.equal((await fetch(url+path)).status,404);
  const body={question:'弹性是什么',history:[],skill:'pricing',mode:'explain'};
  const answer=await fetch(url+'/api/chat',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)});assert.equal(answer.status,200);assert.equal((await answer.json()).provider,'DeepSeek');
  assert.equal((await fetch(url+'/api/chat',{method:'POST',headers:{origin:'https://evil.invalid','content-type':'application/json'},body:JSON.stringify(body)})).status,403);
  assert.equal((await fetch(url+'/api/chat',{method:'POST',headers:{origin,'content-type':'application/json'},body:'x'.repeat(25001)})).status,413);
 }finally{await new Promise(resolve=>server.close(resolve));assert.ok(rootDir.startsWith(scratch+sep));await rm(rootDir,{recursive:true,force:true});}
});
