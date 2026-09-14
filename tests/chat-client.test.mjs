import test from 'node:test';
import assert from 'node:assert/strict';
let client;try{client=await import('../src/chat-client.mjs');}catch(e){if(e.code!=='ERR_MODULE_NOT_FOUND')throw e;}
const get=()=>{assert.equal(typeof client?.buildOnlineRequest,'function','privacy-limited client adapter must exist');return client;};
test('client serializes only allowed fields and a bounded recent conversation',()=>{
 const payload=get().buildOnlineRequest({question:'弹性是什么',skill:'pricing',mode:'explain',context:{identity:'not sent'},note:'private note',history:Array.from({length:40},(_,i)=>({role:i%2?'assistant':'user',text:`${i} `+'甲'.repeat(999),sourceIds:['not sent'],identity:'private'})),pricing:{price:80,profit:999}});
 assert.ok(payload.history.length<=6);assert.ok(payload.history.reduce((n,m)=>n+m.text.length,0)<=4000);assert.ok(payload.history.at(-1).text.startsWith('39 '));assert.deepEqual(Object.keys(payload).sort(),['history','mode','pricing','question','skill']);assert.deepEqual(Object.keys(payload.history[0]).sort(),['role','text']);assert.deepEqual(payload.pricing,{price:80});
});
test('browser allows configured HTTPS or same-origin API path, restricts HTTP to loopback',()=>{
 const c=get();for(const value of ['','https://example.com/api/chat','/api/chat','http://127.0.0.1:4174/api/chat'])assert.equal(c.safeEndpoint(value),value);
 for(const value of ['//evil.invalid/api/chat','http://evil.invalid/api/chat','javascript:alert(1)','https://user:pass@example.com/api/chat','/arbitrary'])assert.equal(c.safeEndpoint(value),'');
});
test('client strips unknown response sources and rejects fake model output or error text',async()=>{
 const c=get();const request={question:'弹性',skill:'pricing',mode:'explain',history:[],pricing:{}};
 const response=await c.requestOnlineTutor('/api/chat',request,{fetchImpl:async()=>new Response(JSON.stringify({mode:'model',provider:'DeepSeek',text:'解释',sourceIds:['elasticity','evil'],context:{topicId:'K018',identity:'x'},suggestions:['例子']}))});
 assert.deepEqual(response.sourceIds,['elasticity']);assert.deepEqual(response.context,{topicId:'K018'});
 await assert.rejects(c.requestOnlineTutor('/api/chat',request,{fetchImpl:async()=>new Response('private provider error',{status:502})}),/DeepSeek/);
 await assert.rejects(c.requestOnlineTutor('/api/chat',request,{fetchImpl:async()=>new Response(JSON.stringify({text:'pretend local',mode:'local'}))}),/响应/);
});
