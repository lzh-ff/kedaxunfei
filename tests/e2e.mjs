import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
await mkdir('test-results',{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
const url=process.env.DEMO_URL||'http://127.0.0.1:4173/';
try{
 await page.goto(url+'#__proto__');await page.getByRole('heading',{name:'把经济学，放进一次经营决策。'}).waitFor();
 const profit=await page.locator('[data-metric="profit"]').textContent();
 await page.locator('#price').fill('80');await page.locator('#price').dispatchEvent('input');
 assert.notEqual(await page.locator('[data-metric="profit"]').textContent(),profit);
 await page.locator('#capacity').fill('1100');await page.locator('#capacity').dispatchEvent('input');
 assert.match(await page.locator('#pricing-result').textContent(),/库存约束/);
 await page.locator('#chat-input').fill('这个怎么弄？');await page.getByRole('button',{name:'发送问题'}).click();
 assert.match(await page.locator('#messages').textContent(),/你想先解决哪一部分/);
 for(const q of ['需求价格弹性','举个例子','依据是什么？']){await page.locator('#chat-input').fill(q);await page.getByRole('button',{name:'发送问题'}).click();}
 assert.equal(await page.locator('#messages .message.user').count(),4);
 await page.getByRole('button',{name:'学习诊断',exact:true}).click();
 for(const [id,a]of [['q1',1],['q2',2],['q3',0],['q4',1],['q5',2],['q6',0]]) await page.locator(`input[name="${id}"][value="${a}"]`).check();
 await page.getByRole('button',{name:'生成学习建议'}).click();assert.match(await page.locator('#diagnosis-result').textContent(),/100/);
 await page.reload();assert.match(await page.locator('#diagnosis-result').textContent(),/100/);
 await page.getByRole('button',{name:'知识库',exact:true}).click();
 await page.locator('#knowledge-search').fill('弹性');assert.ok(await page.locator('.knowledge-card').count()>0);
 await page.locator('.knowledge-card button').first().click();await page.getByRole('dialog').waitFor();await page.getByRole('button',{name:'关闭弹窗'}).click();
 await page.getByRole('button',{name:'偏好实验',exact:true}).click();
 await page.locator('#kappa').fill('0');await page.locator('#kappa').dispatchEvent('input');assert.match(await page.locator('#game-result').textContent(),/选择背叛/);
 await page.locator('#kappa').fill('0.5');await page.locator('#kappa').dispatchEvent('input');assert.match(await page.locator('#game-result').textContent(),/选择合作/);
 await page.getByRole('button',{name:'实训工作台',exact:true}).click();
 const downloadEvent=page.waitForEvent('download');await page.getByRole('button',{name:'导出实训报告',exact:true}).click();const download=await downloadEvent;assert.match(download.suggestedFilename(),/实训报告/);
 await page.screenshot({path:'test-results/desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/mobile.png',fullPage:true});
 for(const title of ['实训工作台','岗位能力图谱','学习诊断','知识库','偏好实验','体验说明']){
  await page.getByRole('button',{name:title,exact:true}).click();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${title} overflows mobile`);
 }
 assert.deepEqual(errors,[]);console.log('PASS: pricing, constraints, four chat turns, assessment, persistence, knowledge dialog, preference experiment, report download, six mobile views, no browser errors');
}finally{await browser.close();}
