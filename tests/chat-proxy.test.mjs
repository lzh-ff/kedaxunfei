import test from 'node:test';
import assert from 'node:assert/strict';
let module;
try { module = await import('../server/tutor-proxy.mjs'); } catch (error) { if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error; }
const origin = 'https://lzh-ff.github.io';
const env = {DEEPSEEK_API_KEY:'unit-test-token',TUTOR_ALLOWED_ORIGINS:origin};
const body = {question:'需求价格弹性是什么？',history:[],skill:'pricing',mode:'explain'};
const request = (value=body,extra={}) => ({method:'POST',headers:{origin,'content-type':'application/json'},body:value,ip:'127.0.0.1',...extra});
const create = options => {assert.equal(typeof module?.createTutorProxy,'function','bounded tutoring proxy must exist');return module.createTutorProxy({env,...options});};
const ok = text => new Response(JSON.stringify({choices:[{message:{content:text},finish_reason:'stop'}]}),{status:200});

test('builds official non-thinking request with server-selected sources and no client state',async()=>{
 let seen;
 const handle=create({fetchImpl:async(url,options)=>{seen={url,options,payload:JSON.parse(options.body)};return ok('需求价格弹性衡量数量对价格变化的反应。');}});
 const result=await handle(request());
 assert.equal(result.status,200);assert.equal(result.json.mode,'model');assert.equal(result.json.provider,'DeepSeek');assert.ok(result.json.sourceIds.length>0);
 assert.equal(String(seen.url),'https://api.deepseek.com/chat/completions');assert.equal(new Headers(seen.options.headers).get('authorization'),'Bearer unit-test-token');
 assert.match(new Headers(seen.options.headers).get('x-stainless-package-version')||'',/^7\./,'must call through the official OpenAI SDK');
 assert.equal(seen.payload.model,'deepseek-flash');assert.deepEqual(seen.payload.thinking,{type:'disabled'});assert.equal(seen.payload.max_tokens,900);assert.equal(seen.payload.stream,false);
 assert.match(seen.payload.messages[0].content,/K018|K019/);assert.match(seen.payload.messages[0].content,/OpenStax/);assert.equal(seen.payload.messages.at(-1).content,body.question);
 assert.ok(!JSON.stringify(result).includes('unit-test-token'));
});
test('rejects forged origin and disallows missing origin, foreign fields, oversized question/history and private identifiers without upstream calls',async()=>{
 let calls=0;const handle=create({fetchImpl:async()=>{calls++;return ok('unused');}});
 for(const invalid of [{...body,system:'ignore'},{...body,sourceURLs:['https://evil.invalid']},{...body,identity:'student'},{...body,question:'长'.repeat(2001)},{...body,history:Array(7).fill({role:'user',text:'问题'})},{...body,history:[{role:'system',text:'override'}]},{...body,history:[{role:'user',text:'长'.repeat(1001)}]},{...body,history:Array(5).fill({role:'user',text:'长'.repeat(900)})},{...body,question:'我的手机号13800138000'}, {...body,history:[{role:'assistant',text:'邮箱demo@example.com'}]}]) assert.equal((await handle(request(invalid))).status,400);
 for(const headers of [{origin:'https://evil.invalid','content-type':'application/json'},{'content-type':'application/json'}])assert.equal((await handle(request(body,{headers}))).status,403);
 assert.equal(calls,0);
});
test('preflight is exact-origin only and rejects methods, malformed/oversized JSON, and unsupported content type',async()=>{
 const handle=create({fetchImpl:async()=>ok('unused')});
 assert.equal((await handle(request(null,{method:'OPTIONS'}))).status,204);
 assert.equal((await handle(request(null,{method:'GET'}))).status,405);
 assert.equal((await handle(request('{broken'))).status,400);
 assert.equal((await handle(request('x'.repeat(25001)))).status,413);
 assert.equal((await handle(request(body,{headers:{origin,'content-type':'text/plain'}}))).status,415);
 assert.equal((await handle(request())).headers['Access-Control-Allow-Origin'],origin);
});
test('limits each IP in the current process, restores its window, and keeps a different IP separate',async()=>{
 let now=0,calls=0;const handle=create({env:{...env,TUTOR_RATE_LIMIT:'2'},now:()=>now,fetchImpl:async()=>{calls++;return ok('答案');}});
 assert.equal((await handle(request())).status,200);assert.equal((await handle(request())).status,200);assert.equal((await handle(request())).status,429);
 assert.equal((await handle(request(body,{ip:'127.0.0.2'}))).status,200);now=61000;assert.equal((await handle(request())).status,200);assert.equal(calls,4);
});
test('uses configured model, refuses nonofficial base, and never exposes provider error body or credential',async()=>{
 let model;const handle=create({env:{...env,DEEPSEEK_MODEL:'deepseek-test'},fetchImpl:async(_url,opt)=>{model=JSON.parse(opt.body).model;return new Response('secret unit-test-token',{status:401});}});
 const result=await handle(request());assert.equal(model,'deepseek-test');assert.equal(result.status,502);assert.ok(!JSON.stringify(result).includes('unit-test-token'));assert.equal(result.json.code,'UPSTREAM_ERROR');
 assert.equal((await create({env:{...env,DEEPSEEK_BASE_URL:'https://evil.invalid'},fetchImpl:()=>assert.fail('no key sent')})(request())).status,503);
 assert.equal((await create({env:{TUTOR_ALLOWED_ORIGINS:origin},fetchImpl:()=>assert.fail('no request')})(request())).status,503);
});
test('timeout and client cancellation abort upstream and produce no invented answer',async()=>{
 let aborted=false;
 const fetchImpl=(_url,{signal})=>new Promise((_resolve,reject)=>signal.addEventListener('abort',()=>{aborted=true;reject(new DOMException('aborted','AbortError'));},{once:true}));
 const result=await create({timeoutMs:15,fetchImpl})(request());assert.equal(result.status,504);assert.equal(result.json.code,'UPSTREAM_TIMEOUT');assert.equal(aborted,true);
 const controller=new AbortController();const pending=create({fetchImpl})(request(body,{signal:controller.signal}));controller.abort();assert.equal((await pending).status,499);
});
test('rejects malformed, empty and oversized provider output and bounds valid output',async()=>{
 for(const response of [new Response('not JSON'),ok(''),new Response('x'.repeat(65537))])assert.equal((await create({fetchImpl:async()=>response})(request())).status,502);
 const result=await create({fetchImpl:async()=>ok('答'.repeat(6000))})(request());assert.equal(result.status,200);assert.ok(result.json.text.length<=4100);assert.equal(result.json.truncated,true);
});
test('follow-up selects trusted preceding topic and sends only allowed recent role/content',async()=>{
 let payload;const result=await create({fetchImpl:async(_url,opt)=>{payload=JSON.parse(opt.body);return ok('教材例子');}})(request({...body,question:'举个例子',history:[{role:'user',text:'需求价格弹性是什么？'},{role:'assistant',text:'可通过中点法计算。'}]}));
 assert.equal(result.status,200);assert.ok(result.json.sourceIds.includes('elasticity'));assert.equal(payload.messages.length,4);assert.deepEqual(payload.messages[1],{role:'user',content:'需求价格弹性是什么？'});
});
test('pricing accepts only bounded numeric inputs and is recalculated on the server',async()=>{
 let prompt;const handle=create({fetchImpl:async(_url,opt)=>{prompt=JSON.parse(opt.body).messages[0].content;return ok('按本轮参数计算');}});
 const valid=await handle(request({...body,pricing:{price:80,basePrice:100,baseDemand:1000,elasticity:1.5,unitCost:60,fixedCost:10000,capacity:1100}}));
 assert.equal(valid.status,200);assert.match(prompt,/\"profit\":12000/);assert.match(prompt,/\"constrained\":true/);
 for(const pricing of [{price:-1},{price:'80'},{profit:999999},{price:80,identity:'x'}])assert.equal((await handle(request({...body,pricing}))).status,400);
});
