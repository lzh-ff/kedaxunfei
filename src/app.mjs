import {knowledge,sources} from '../data/knowledge.mjs';
import {questions} from '../data/curriculum.mjs';
import {defaults,simulatePricing,describeBreakEven,reply,diagnose,createTask} from './engine.mjs';
import {esc,number,sourceLinks,workspaceView,mapView,diagnosisView,knowledgeView,gameView,guideView,pricingResults,gameResults,messagesView,suggestionButtons,knowledgeCards,diagnosisResults} from './views.mjs';
const storageKey='jingshi-practicum-v1';
const fresh=()=>({view:'workspace',pricing:{...defaults},task:createTask(),steps:[],note:'',messages:[],chatContext:{},answers:{},assessed:false,query:'',filter:'all',game:{belief:.5,kappa:.5}});
let state=fresh();
try{const saved=JSON.parse(localStorage.getItem(storageKey)||'null');if(saved?.version===1){
 if(saved.pricing){simulatePricing(saved.pricing);state.pricing={...defaults,...saved.pricing};}
 if(saved.task)state.task=createTask(saved.task);
 state.note=String(saved.note||'').slice(0,5000);state.steps=Array.isArray(saved.steps)?saved.steps.map(Boolean):[];
 if(saved.answers&&typeof saved.answers==='object')for(const q of questions){const a=saved.answers[q.id];if(Number.isInteger(a)&&a>=0&&a<q.options.length)state.answers[q.id]=a;}
 state.assessed=Boolean(saved.assessed)&&diagnose(state.answers).completed===questions.length;
}}catch{state=fresh();}
const views={workspace:workspaceView,map:mapView,diagnosis:diagnosisView,knowledge:knowledgeView,game:gameView,guide:guideView};
function save(){try{localStorage.setItem(storageKey,JSON.stringify({version:1,pricing:state.pricing,task:{scenario:state.task.scenario,level:state.task.level,minutes:state.task.minutes},steps:state.steps,note:state.note,answers:state.answers,assessed:state.assessed}));}catch{toast('浏览器未允许保存记录；仍可继续体验并导出报告。');}}
let toastTimer;function toast(text){const el=document.querySelector('#toast');el.textContent=text;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),3500);}
function render(){document.querySelector('#main').innerHTML=views[state.view](state);document.querySelectorAll('[data-view]').forEach(b=>{if(b.dataset.view===state.view)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});}
function navigate(view){if(!Object.hasOwn(views,view))return;state.view=view;location.hash=view;render();window.scrollTo({top:0,behavior:'instant'});}
window.addEventListener('hashchange',()=>{const view=location.hash.slice(1);if(Object.hasOwn(views,view)&&view!==state.view){state.view=view;render();}});
state.view=Object.hasOwn(views,location.hash.slice(1))?location.hash.slice(1):'workspace';render();
const dialog=document.querySelector('#detail-dialog');
function showDialog(title,html){dialog.setAttribute('aria-label',title);document.querySelector('#dialog-content').innerHTML=html;dialog.showModal();}
function showKnowledge(id){const k=knowledge.find(k=>k.id===id);if(!k)return;showDialog(k.title,`<span class="eyebrow">${k.id} · 专业知识</span><h2>${esc(k.title)}</h2><p class="knowledge-definition">${esc(k.text)}</p><div class="example-box"><h3>放到岗位里理解</h3><p>${esc(k.example)}</p></div><h3>可追溯来源</h3><p>${esc(sources[k.sourceId].title)}<br>${esc(sources[k.sourceId].section)}</p>${sourceLinks([k.sourceId])}<p class="fine-print">中文教学改写与原创案例。${esc(sources[k.sourceId].license)}。不代表已得到原作者或教育部对本产品的背书。</p><button class="button primary" data-talk-about="${esc(k.title)}">向导师继续追问 →</button>`);}
function download(filename,text,type='text/plain;charset=utf-8'){const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);}
function exportReport(){const r=simulatePricing(state.pricing),d=diagnose(state.answers),time=new Date().toISOString();const lines=[
 '# 经世智学 · 电子商务运营岗位实训报告','',`导出时间：${time}`,'专业：财经商贸专业群 / 电子商务（530701）','岗位：电子商务运营专员','',`## ${state.task.title}`,state.task.brief,`层级：${state.task.level}；建议课时：${state.task.minutes}分钟`,'','## 输入与假设',...Object.entries({促销售价:r.params.price,基准售价:r.params.basePrice,基准销量:r.params.baseDemand,需求弹性:r.params.elasticity,单位变动成本:r.params.unitCost,固定成本:r.params.fixedCost,可交付库存:r.params.capacity}).map(([k,v])=>`- ${k}：${v}`),'','## 模型计算',`- 潜在需求：${number(r.unconstrainedDemand,2)}件`,`- 可实现销量：${number(r.quantity,2)}件`,`- 收入：${number(r.revenue,2)}元`,`- 成本：${number(r.cost,2)}元`,`- 模型利润：${number(r.profit,2)}元`,`- 基准利润：${number(r.baselineProfit,2)}元`,`- 差额：${number(r.delta,2)}元`,`- 理论保本量：${describeBreakEven(r)}`,'','## 学习步骤（学习者自行勾选）',...state.task.steps.map((s,i)=>`- [${state.steps[i]?'x':' '}] ${s}`),'','## 学习者的判断',state.note.trim()||'尚未填写学习判断。','','## 本次诊断',state.assessed?`共${d.total}题，答对${d.correct}题，正确率${d.score}%。每个能力只有1题，不代表完整岗位能力。`:'尚未提交完整诊断。',...(state.assessed?d.dimensions.map(s=>`- ${s.name}：${s.score===100?'答对':'待复习'}`):[]),'','## 来源',...state.task.sourceIds.map(id=>`- ${sources[id].title} ${sources[id].section}：${sources[id].url}`),'','## 实现边界','AI生成内容标识：本报告的计算和建议由知识与规则生成；本版本未调用外部大模型。学习者判断由用户输入。','全部经营数据为教学模拟。需求采用恒定弹性函数，单位变动成本固定，销量受库存约束；未单列税费、退款和平台抽佣。不得把本报告当作真实经营业绩或师生试用反馈。'];download('经世智学-实训报告.md',lines.join('\n'));toast('实训报告已导出，包含当前参数与知识来源。');}
function sendQuestion(q){q=String(q).trim();if(!q)return;const result=reply(q,{...state.chatContext,pricing:state.pricing});state.messages.push({role:'user',text:q},{role:'assistant',...result});state.messages=state.messages.slice(-20);state.chatContext=result.context;document.querySelector('#messages').innerHTML=messagesView(state);document.querySelector('#chat-suggestions').innerHTML=suggestionButtons(state);const input=document.querySelector('#chat-input');input.value='';const box=document.querySelector('#messages');box.scrollTop=box.scrollHeight;input.focus();}
function showFeedback(){showDialog('真实试用反馈',`<span class="eyebrow">真实体验 · 主动导出</span><h2>把你的体验，变成改进依据。</h2><p>请在实际试用后填写，可以匿名。记录会下载到你的设备，不会自动上传或发给团队。</p><form id="feedback-form" class="feedback-form"><label>试用者身份<select name="role" required><option value="">请选择</option><option>目标专业学生</option><option>专业教师</option></select></label><label>专业及年级 / 任教学科<input name="identity" required maxlength="150" placeholder="例如：电子商务专业二年级学生（匿名）"></label><div class="rating-grid">${['实用性','易用性','准确性'].map(n=>`<label>${n}<select name="${n}" required><option value="">请选择评分</option>${[1,2,3,4,5].map(i=>`<option value="${i}">${i} / 5</option>`).join('')}</select></label>`).join('')}</div><label>实际完成的操作与有帮助之处<textarea name="benefit" rows="3" required maxlength="2000" placeholder="请写下你尝试的任务和具体体验"></textarea></label><label>发现的问题或改进建议<textarea name="improvement" rows="3" required maxlength="2000"></textarea></label><label class="consent"><input type="checkbox" required name="actual"><span>我已实际体验本作品，以上为本人的真实反馈，同意将此记录用于本作品的参赛验证。</span></label><button type="submit" class="button primary">导出反馈记录</button></form>`);}
document.addEventListener('click',event=>{
 const b=event.target.closest('button');if(!b)return;
 if(b.dataset.view){navigate(b.dataset.view);return;}
 if(b.dataset.knowledge){showKnowledge(b.dataset.knowledge);return;}
 if(b.dataset.question){sendQuestion(b.dataset.question);return;}
 if(b.dataset.talkAbout){dialog.close();navigate('workspace');sendQuestion(b.dataset.talkAbout);return;}
 if(b.dataset.skill){state.filter=b.dataset.skill;state.query='';navigate('knowledge');return;}
 const a=b.dataset.action;
 if(a==='close-dialog')dialog.close();
 if(a==='export-report')exportReport();
 if(a==='feedback')showFeedback();
 if(a==='start-diagnosis')navigate('diagnosis');
 if(a==='start-workspace')navigate('workspace');
 if(a==='open-knowledge')navigate('knowledge');
 if(a==='reset-pricing'){state.pricing={...defaults,price:100};save();render();toast('已恢复100元基准售价及默认假设。');}
 if(a==='retry-quiz'){state.answers={};state.assessed=false;save();render();}
 if(a==='task-details')showDialog('任务要求',`<span class="eyebrow">${esc(state.task.level)} · ${state.task.minutes}分钟</span><h2>${esc(state.task.title)}</h2><p>${esc(state.task.brief)}</p><h3>提交成果与评价标准</h3><ol>${state.task.criteria.map(c=>`<li>${esc(c)}</li>`).join('')}</ol><h3>操作与数据规范</h3><p>${esc(state.task.safety)}</p><h3>关联资源</h3>${sourceLinks(state.task.sourceIds)}`);
 if(a==='clear-data')showDialog('清除学习记录','<h2>清除本机学习记录？</h2><p>将删除本浏览器保存的测评、任务勾选、参数和笔记。已下载的报告不受影响。</p><button class="button primary" data-action="confirm-clear">确认清除</button>');
 if(a==='confirm-clear'){try{localStorage.removeItem(storageKey);}catch{}state=fresh();dialog.close();navigate('workspace');toast('本机学习记录已清除。');}
});
document.addEventListener('input',event=>{
 const el=event.target;
 if(el.dataset.pricing){const value=el.valueAsNumber,key=el.dataset.pricing;try{simulatePricing({...state.pricing,[key]:value});state.pricing[key]=value;const out=document.querySelector(`#${key}-value`);if(out)out.textContent=value+({price:'元',unitCost:'元',capacity:'件'}[key]||'');document.querySelector('#pricing-result').innerHTML=pricingResults(state);el.setCustomValidity('');save();}catch{el.setCustomValidity('请输入有效范围内的数字。');el.reportValidity();} }
 if(el.dataset.game){state.game[el.dataset.game]=el.valueAsNumber;document.querySelector(`#${el.id}-value`).textContent=el.value;document.querySelector('#game-result').innerHTML=gameResults(state);}
 if(el.id==='learning-note'){state.note=el.value.slice(0,5000);save();}
 if(el.id==='knowledge-search'){state.query=el.value;document.querySelector('#knowledge-results').innerHTML=knowledgeCards(state.query,state.filter);}
});
document.addEventListener('change',event=>{const el=event.target;
 if(el.dataset.step!==undefined){state.steps[Number(el.dataset.step)]=el.checked;document.querySelector('#steps-counter').textContent=`${state.steps.filter(Boolean).length} / ${state.task.steps.length} 已完成`;save();}
 if(el.id==='knowledge-filter'){state.filter=el.value;document.querySelector('#knowledge-results').innerHTML=knowledgeCards(state.query,state.filter);}
 if(el.matches('#diagnosis-form input')){state.answers[el.name]=Number(el.value);state.assessed=false;document.querySelector('#diagnosis-result').innerHTML=diagnosisResults(state);document.querySelectorAll('.answer-explanation').forEach(e=>e.remove());save();}
});
document.addEventListener('keydown',event=>{if(event.target.id==='chat-input'&&event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();document.querySelector('#chat-form').requestSubmit();}});
document.addEventListener('submit',event=>{event.preventDefault();const form=event.target;
 if(form.id==='chat-form')sendQuestion(document.querySelector('#chat-input').value);
 if(form.id==='task-form'){const data=new FormData(form);state.task=createTask({scenario:data.get('scenario'),level:data.get('level'),minutes:Number(data.get('minutes'))});state.steps=[];if(state.task.scenario==='inventory')state.pricing.capacity=1100;save();render();toast('学习任务已生成，步骤与评价标准已更新。');}
 if(form.id==='diagnosis-form'){state.answers=Object.fromEntries([...new FormData(form)].map(([k,v])=>[k,Number(v)]));state.assessed=true;save();render();toast('学习建议已依据本次作答更新。');}
 if(form.id==='feedback-form'){const data=Object.fromEntries(new FormData(form));const record={type:'用户自行填写的真实试用反馈',version:1,at:new Date().toISOString(),product:'经世智学 · 电子商务运营实训',...data,actual:true};download('经世智学-真实试用反馈.json',JSON.stringify(record,null,2),'application/json;charset=utf-8');toast('反馈已导出至本机，请自行交给参赛团队。');dialog.close();}
});
