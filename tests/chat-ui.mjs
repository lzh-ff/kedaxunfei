import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const url=process.env.DEMO_URL||'http://127.0.0.1:3783/kedaxunfei/';
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[],requests=[];
page.on('pageerror',error=>errors.push(error.message));
let responseMode='ok',release;
await page.route('**/api/chat',async route=>{
 const payload=route.request().postDataJSON();requests.push(payload);
 if(responseMode==='delay')await new Promise(resolve=>{release=resolve;});
 const failed=responseMode==='error';
 await route.fulfill({status:failed?502:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify(failed?{code:'UPSTREAM_ERROR'}:{mode:'model',provider:'DeepSeek',text:'**测试在线回答**：需求价格弹性。\n\n| 方案 | 利润 |\n| --- | --- |\n| 日常 | 30000 |\n| 促销 | 12000 |\n\n<script>window.unsafe=true</script>',sourceIds:['elasticity'],suggestions:['举个例子'],context:{topicId:'K018'}})}).catch(()=>{});
});
try{
 await page.goto(url);await page.getByRole('heading',{name:'今天，想学懂什么？'}).waitFor();
 assert.equal(requests.length,0,'opening page must not upload history');
 await page.getByLabel('回答方式',{exact:true}).waitFor({timeout:5000});
 assert.equal(await page.getByLabel('回答方式',{exact:true}).inputValue(),'online');assert.match(await page.locator('.chat-disclosure').textContent(),/DeepSeek/);
 const box=page.getByRole('textbox',{name:'向学习助手提问'}),send=page.getByRole('button',{name:'发送问题',exact:true});
 responseMode='delay';await box.fill('需求价格弹性是什么？');await send.click();await page.getByRole('button',{name:'取消回答',exact:true}).waitFor();
 assert.equal(await send.isDisabled(),true);await box.press('Enter');assert.equal(requests.length,1);
 await page.getByRole('button',{name:'开始新对话',exact:true}).click();release();await page.waitForTimeout(200);assert.equal(await page.locator('.message-assistant').count(),0,'late result cannot enter a new conversation');
 responseMode='ok';await box.fill('需求价格弹性是什么？');await send.click();await page.locator('.message-assistant').waitFor();assert.match(await page.locator('.message-assistant small').textContent(),/DeepSeek/);assert.ok(await page.locator('.message-assistant a').count()>0);assert.equal(await page.locator('.message-assistant table').count(),1);assert.equal(await page.locator('.message-assistant strong').count(),2);assert.equal(await page.evaluate(()=>window.unsafe),undefined);
 await page.setViewportSize({width:390,height:844});const source=page.locator('.message-assistant .source-links a').first();await source.scrollIntoViewIfNeeded();assert.ok(await source.evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),'mobile source link is not covered by composer');await page.setViewportSize({width:1600,height:1000});

 await page.reload();await page.getByLabel('回答方式',{exact:true}).waitFor();const count=requests.length;await page.waitForTimeout(100);assert.equal(requests.length,count,'restoring history must not upload');
 responseMode='error';await box.fill('举个例子');await send.click();await page.locator('.chat-error').waitFor();assert.match(await page.locator('.chat-error').textContent(),/DeepSeek/);assert.equal(await page.locator('.message-assistant').count(),1,'error must not become model answer');
 await page.getByRole('button',{name:'用教材规则回答此题',exact:true}).click();assert.equal(await page.locator('.message-assistant').count(),2);assert.match(await page.locator('.message-assistant small').last().textContent(),/教材与规则/);
 await page.getByLabel('回答方式',{exact:true}).selectOption('local');await box.fill('盈亏平衡怎么算');await send.click();assert.equal(requests.length,count+1,'offline answer sends no network request');
 await page.evaluate(()=>{location.hash='workspace';});await page.getByRole('heading',{name:'经营变量实验'}).waitFor();
 const downloaded=page.waitForEvent('download');await page.getByRole('button',{name:'导出实训报告',exact:true}).click();const download=await downloaded;const report=await readFile(await download.path(),'utf8');assert.match(report,/DeepSeek 在线回答 1 条，教材规则回答 2 条/);assert.ok(!report.includes('本版没有在线大模型调用'));
 await page.evaluate(()=>{location.hash='home';});await page.getByLabel('回答方式',{exact:true}).waitFor();

 await page.getByLabel('回答方式',{exact:true}).selectOption('online');await box.fill('我的手机号13800138000');await send.click();await page.locator('.chat-error').waitFor();assert.equal(requests.length,count+1,'private identifier blocked before network');
 await page.getByRole('button',{name:'开始新对话',exact:true}).click();responseMode='delay';await box.fill('收入不等于利润');await send.click();await page.getByRole('button',{name:'取消回答',exact:true}).click();release();await page.waitForTimeout(100);assert.equal(await page.locator('.message-assistant').count(),0);assert.match(await page.locator('.chat-request-status').textContent(),/取消/);
 for(const width of [390,1600,1920]){await page.setViewportSize({width,height:1000});await page.evaluate(()=>{location.hash='reading/cost';});await page.locator('.reading-tutor').waitFor();assert.ok(await page.locator('.reading-tutor').evaluate(e=>e.scrollWidth<=e.clientWidth+1));assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.evaluate(()=>{location.hash='home';});await page.getByLabel('回答方式',{exact:true}).waitFor();}
 assert.deepEqual(errors,[]);assert.ok(requests.every(r=>Object.keys(r).every(k=>['question','history','skill','mode','pricing'].includes(k))));
 console.log(JSON.stringify({status:'passed',requests:requests.length,checks:['no automatic history upload','pending duplicate prevention','new conversation cancellation','online label and trusted source links','error is not an answer','explicit rule fallback','offline no network','private identifier blocking','manual cancel','390/1600/1920 reading layout','export reply mode counts','mobile sources unobscured','safe Markdown table and escaped HTML'],pageErrors:errors},null,2));
}finally{release?.();await browser.close();}
