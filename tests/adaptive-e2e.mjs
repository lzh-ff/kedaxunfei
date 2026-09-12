import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,readFile} from 'node:fs/promises';
import {questions,practiceQuestions} from '../data/learning.mjs';
await mkdir('test-results',{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});
const page=await context.newPage(),errors=[],failed=[];
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(url))failed.push(`${r.status()} ${r.url()}`);});
const url=process.env.DEMO_URL||'http://127.0.0.1:4173/kedaxunfei/';
const go=async hash=>{await page.evaluate(h=>location.hash=h,hash);await page.waitForTimeout(100);};
const state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('vocational-tutor-v2')));
const answerAll=async qs=>{for(const q of qs)await page.locator(`input[name="${q.id}"][value="${q.answer}"]`).check();};
try{
 await page.goto(url+'#__proto__');await page.getByRole('heading',{name:'今天，想学懂什么？'}).waitFor();
 assert.equal((await state()).attempts.length,0);
 await page.screenshot({path:'test-results/adaptive-home-desktop.png'});
 await page.getByRole('button',{name:'开始诊断',exact:true}).click();
 for(const q of questions){const a=q.skill==='cost'?(q.answer+1)%q.options.length:q.answer;await page.locator(`input[name="${q.id}"][value="${a}"]`).check();}
 await page.getByRole('button',{name:'提交诊断，更新学习路径'}).click();
 await page.getByRole('heading',{name:'答对 5 / 6 题'}).waitFor();
 assert.equal((await state()).attempts.length,6);
 await page.getByRole('button',{name:'查看更新后的路径'}).click();
 assert.match(await page.locator('.skill-card').filter({hasText:'成本与利润'}).textContent(),/优先补强/);
 await page.screenshot({path:'test-results/adaptive-path-desktop.png'});
 await go('reading/cost');await page.getByRole('heading',{name:'销售额很好看，利润呢？'}).waitFor();
 await page.getByRole('button',{name:'标记本节已读'}).click();assert.ok((await state()).reads.includes('cost'));assert.equal((await state()).attempts.length,6);
 await page.getByRole('button',{name:'复核与迁移练习'}).click();
 await answerAll([...questions.filter(q=>q.skill==='cost'),...practiceQuestions.filter(q=>q.skill==='cost')]);
 await page.getByRole('button',{name:'提交练习，更新学习路径'}).click();await page.getByRole('heading',{name:'答对 3 / 3 题'}).waitFor();
 await page.getByRole('button',{name:'回到相关讲解'}).first().click();await page.getByRole('heading',{name:'销售额很好看，利润呢？'}).waitFor();
 await go('mastery');assert.match(await page.locator('.skill-card').filter({hasText:'成本与利润'}).textContent(),/本组已达标/);
 await page.reload();await page.locator('.skill-card').first().waitFor();assert.match(await page.locator('.skill-card').filter({hasText:'成本与利润'}).textContent(),/100%/);
 await go('home');for(const q of ['这个怎么弄？','需求价格弹性','举个例子','依据是什么？']){await page.getByRole('textbox',{name:'向学习助手提问'}).fill(q);await page.getByRole('button',{name:'发送问题'}).click();}
 assert.equal(await page.locator('.message-user').count(),4);assert.match(await page.locator('.conversation').textContent(),/你想先解决哪一部分/);assert.ok(await page.locator('.message-assistant a').count()>0);
 const firstId=(await state()).activeConversation;
 for(let i=0;i<4;i++){await page.getByRole('button',{name:'开始新对话',exact:true}).click();await page.getByRole('textbox',{name:'向学习助手提问'}).fill(`机会成本 ${i}`);await page.getByRole('button',{name:'发送问题'}).click();}
 await go('memory');await page.getByRole('tab',{name:/学习对话/}).click();assert.equal(await page.getByRole('button',{name:'继续对话',exact:true}).count(),5);await page.getByRole('button',{name:'继续对话',exact:true}).last().click();assert.equal((await state()).activeConversation,firstId);assert.equal(await page.locator('.message-user').count(),4);
 await go('knowledge');await page.getByRole('searchbox',{name:'搜索知识库'}).fill('弹性');assert.ok(await page.locator('.knowledge-card').count()>0);await page.locator('.knowledge-card h2 button').first().click();await page.getByRole('dialog').waitFor();assert.ok(await page.getByRole('dialog').locator('a').count()>0);await page.getByRole('button',{name:'关闭弹窗'}).click();await page.getByRole('searchbox',{name:'搜索知识库'}).fill('xyz-unmatched');await page.getByRole('heading',{name:'还没有匹配的知识'}).waitFor();
 await go('workspace');await page.getByRole('heading',{name:'经营变量实验'}).waitFor();const before=await page.locator('[data-metric="profit"]').textContent();await page.locator('#price').fill('80');assert.notEqual(await page.locator('[data-metric="profit"]').textContent(),before);await page.locator('#capacity').fill('1100');assert.match(await page.locator('#pricing-result').textContent(),/库存约束已触发/);
 await page.getByLabel('业务情境',{exact:true}).selectOption('inventory');await page.getByLabel('学习层级',{exact:true}).selectOption('进阶');await page.getByRole('button',{name:'生成学习任务'}).click();assert.equal(await page.locator('.checklist input').count(),5);await page.locator('.checklist input').first().check();await page.locator('#learning-note').fill('自动化测试记录：库存限制时，降价可能降低利润；需核实真实需求弹性。');
 let downloadEvent=page.waitForEvent('download');await page.getByRole('button',{name:'导出实训报告',exact:true}).click();let d=await downloadEvent;const report=await readFile(await d.path(),'utf8');assert.match(report,/职教自适应学习助手/);assert.match(report,/成本与利润：本组已达标/);assert.match(report,/自动化测试记录/);
 await page.locator('.game-experiment summary').click();await page.locator('#kappa').fill('0');assert.match(await page.locator('#game-result').textContent(),/选择背叛/);await page.locator('#kappa').fill('0.5');assert.match(await page.locator('#game-result').textContent(),/选择合作/);
 await page.screenshot({path:'test-results/adaptive-practicum-desktop.png'});
 await go('guide');await page.getByRole('button',{name:'填写真实试用反馈'}).click();const f=page.getByRole('dialog');await f.locator('[name=role]').selectOption('专业教师');await f.locator('[name=identity]').fill('自动化测试，不是真实试用者');for(const n of ['实用性','易用性','准确性'])await f.locator(`[name="${n}"]`).selectOption('4');await f.locator('[name=benefit]').fill('仅用于验证导出流程，不能用作参赛反馈。');await f.locator('[name=improvement]').fill('此记录必须排除在师生试用反馈之外。');await f.locator('[name=actual]').check();downloadEvent=page.waitForEvent('download');await f.getByRole('button',{name:'导出反馈记录'}).click();d=await downloadEvent;const feedback=JSON.parse(await readFile(await d.path(),'utf8'));assert.match(feedback.identity,/自动化测试/);
 await go('settings');await page.getByRole('button',{name:'深色',exact:true}).click();assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');await page.screenshot({path:'test-results/adaptive-dark.png'});await page.getByRole('button',{name:'浅色',exact:true}).click();
 for(const v of ['home','mastery','reading','workspace','space','memory','knowledge','settings','guide','diagnosis','practice']){await go(v);assert.ok(await page.locator('#main-content').evaluate(e=>e.scrollWidth<=e.clientWidth+1),`desktop overflow ${v}`);}
 await page.setViewportSize({width:390,height:844});
 for(const v of ['home','mastery','reading','workspace','space','memory','knowledge','settings','guide','diagnosis','practice']){await go(v);assert.ok(await page.locator('#main-content').evaluate(e=>e.scrollWidth<=e.clientWidth+1),`mobile overflow ${v}`);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`page overflow ${v}`);}
 await page.getByRole('button',{name:'打开导航'}).click();await page.getByRole('button',{name:'学习空间',exact:true}).click();await page.getByRole('heading',{name:'你学过的，都在这里。'}).waitFor();assert.equal(await page.locator('.sidebar').getAttribute('inert'),'');
 await page.getByRole('button',{name:'打开导航'}).click();await page.keyboard.press('Escape');assert.equal(await page.getByRole('button',{name:'打开导航'}).getAttribute('aria-expanded'),'false');
 await go('settings');await page.getByRole('button',{name:'清除记录',exact:true}).click();await page.getByRole('button',{name:'确认清除'}).click();await page.getByRole('heading',{name:'今天，想学懂什么？'}).waitFor();assert.equal((await state()).attempts.length,0);await page.screenshot({path:'test-results/adaptive-home-mobile.png'});
 await go('mastery');await page.screenshot({path:'test-results/adaptive-path-mobile.png'});
 const migrated=await browser.newContext();await migrated.addInitScript(()=>localStorage.setItem('jingshi-practicum-v1',JSON.stringify({version:1,assessed:true,answers:{q1:1},note:'旧版迁入测试'})));const migrationPage=await migrated.newPage();await migrationPage.goto(url);await migrationPage.getByRole('heading',{name:'今天，想学懂什么？'}).waitFor();assert.equal(await migrationPage.evaluate(()=>JSON.parse(localStorage.getItem('vocational-tutor-v2')).note),'旧版迁入测试');await migrated.close();
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
 console.log(JSON.stringify({url,status:'passed',views:11,desktop:'1440x1000',mobile:'390x844',consoleErrors:errors.length,failedResponses:failed.length,checks:['diagnosis-remediation-retest','mastery refresh','source chat followups','all conversation history','knowledge search','pricing and inventory','report export','synthetic feedback export','game','themes','responsive','mobile keyboard','clear','v1 migration']},null,2));
}finally{await context.close();await browser.close();}
