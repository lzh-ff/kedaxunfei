import { knowledge } from '../data/knowledge.mjs';
import { skills, questions, scenarios } from '../data/curriculum.mjs';

export const defaults={price:90,basePrice:100,baseDemand:1000,elasticity:1.5,unitCost:60,fixedCost:10000,capacity:2000};
function check(value,min,max,name){if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max)throw new RangeError(`${name}须在${min}至${max}之间。`);}
export function simulatePricing(input){
 const p={...defaults,...input};
 for(const key of ['price','basePrice'])check(p[key],.01,100000,key);
 check(p.baseDemand,1,10000000,'基准销量');check(p.unitCost,0,100000,'单位成本');check(p.fixedCost,0,1e10,'固定成本');check(p.elasticity,0,10,'弹性');check(p.capacity,1,10000000,'库存');
 const unconstrainedDemand=p.baseDemand*Math.pow(p.price/p.basePrice,-p.elasticity);
 const quantity=Math.min(unconstrainedDemand,p.capacity),revenue=p.price*quantity,variableCost=p.unitCost*quantity,cost=variableCost+p.fixedCost,profit=revenue-cost,margin=p.price-p.unitCost;
 const baseQuantity=Math.min(p.baseDemand,p.capacity),baselineProfit=(p.basePrice-p.unitCost)*baseQuantity-p.fixedCost;
 const breakEven=p.fixedCost===0?0:margin>0?p.fixedCost/margin:null;
 const breakEvenType=p.fixedCost===0&&margin===0?'any':p.fixedCost===0&&margin<0?'zero-only':breakEven===null?'none':'threshold';
 return {quantity,unconstrainedDemand,revenue,variableCost,cost,profit,margin,breakEven,breakEvenType,baselineProfit,delta:profit-baselineProfit,constrained:unconstrainedDemand>p.capacity,params:p};
}
export function describeBreakEven(r){
 if(r.breakEvenType==='any')return '固定成本与单位贡献均为零，所有销量都恰好保本。';
 if(r.breakEvenType==='zero-only')return '只有零销量恰好保本；单位贡献为负，任何正销量都会亏损。';
 if(r.breakEvenType==='none')return '固定成本为正且单位贡献不为正，不存在有限的保本销量。';
 return `理论保本量${r.breakEven.toFixed(1)}件，按整件至少需${Math.ceil(r.breakEven)}件。${r.breakEven>r.params.capacity?'超过当前库存，本期无法达到。':''}`;
}
export function pricingCurve(input){return Array.from({length:31},(_,i)=>{const price=50+i*3;return {price,...simulatePricing({...input,price})};});}
export function evaluateGame({belief,kappa,T,R,P,S}){
 check(belief,0,1,'对手合作概率');check(kappa,0,1,'道德权重');for(const x of [T,R,P,S])check(x,-1000,1000,'收益');
 if(!(T>R&&R>P&&P>S))throw new RangeError('囚徒困境要求 T > R > P > S。');
 const ownC=belief*R+(1-belief)*S,ownD=belief*T+(1-belief)*P;
 const cooperate=(1-kappa)*ownC+kappa*R,defect=(1-kappa)*ownD+kappa*P;
 return {cooperate,defect,ownC,ownD,action:Math.abs(cooperate-defect)<1e-9?'tie':cooperate>defect?'C':'D'};
}
const normalize=t=>String(t).toLowerCase().replace(/[\s\p{P}\p{S}]/gu,'');
export function searchKnowledge(query,skill='all'){
 const q=normalize(query);
 return knowledge.filter(k=>skill==='all'||k.skill===skill).map(k=>{
  if(!q)return {...k,relevance:0};
  let relevance=0;const title=normalize(k.title),body=normalize(k.text+' '+k.example);
  if(title.includes(q)||q.includes(title))relevance+=20;
  for(const t of k.tags)if(q.includes(normalize(t)))relevance+=t.length>=3?8:4;
  const grams=[...new Set(Array.from({length:Math.max(0,q.length-1)},(_,i)=>q.slice(i,i+2)))];
  for(const g of grams){if(title.includes(g))relevance+=3;else if(body.includes(g))relevance+=.4;}
  return {...k,relevance};
 }).filter(k=>!q||k.relevance>=3).sort((a,b)=>b.relevance-a.relevance);
}
const followup=/^(再|能不能|能|请|那|那么|可以|给我|帮我|用|说|讲|来|具体|详细|怎么|为什么|举|有|还|换)/;
export function reply(question,context={}){
 const q=String(question).trim().slice(0,1000),normalized=normalize(q);
 const prior=knowledge.find(k=>k.id===context.topicId);
 if(!q||(!prior&&/^(这个|那个|这|怎么弄|不会|不懂|帮帮我|怎么做|你好)/.test(normalized)))return {kind:'clarify',text:'你想先解决哪一部分？可以选“促销定价”“成本与利润”或“库存限制”。告诉我具体问题后，我会给出步骤和教材依据。',sourceIds:[],suggestions:['需求价格弹性是什么？','为什么销量增加利润反而下降？','盈亏平衡怎么算？'],context};
 if(/降价|促销/.test(q)&&/赚|利润|赔/.test(q)){
  const supplied=q.match(/(?:降价到|降到)\s*(-?[0-9]+(?:\.[0-9]+)?)/)||q.match(/(?:售价|定价|价格|单价)\s*(-?[0-9]+(?:\.[0-9]+)?)/);
  const chosen=supplied?Number(supplied[1]):null;
  if(chosen!==null&&(chosen<.01||chosen>100000))return {kind:'clarify',text:'请提供0.01至100000元之间的正售价，再按相同的成本和库存假设比较。',sourceIds:[],suggestions:['降价到80元能提高利润吗？'],context};
  const r=simulatePricing({...context.pricing||defaults,...(chosen!==null?{price:chosen}:{})});
  return {kind:'answer',text:`${chosen!==null?`按你提到的${chosen}元试算，其他假设沿用当前实验；页面参数未改变。\n`:''}先看销量，再看每件贡献，最后扣固定成本。\n① ${chosen!==null?'试算':'当前实验'}售价${r.params.price}元，模型销量约${r.quantity.toFixed(0)}件。\n② 每件贡献=${r.params.price}−${r.params.unitCost}=${r.margin.toFixed(2)}元。\n③ 模型利润约${r.profit.toFixed(0)}元，与基准差额约${r.delta.toFixed(0)}元。\n结论：${Math.abs(r.delta)<.005?'当前利润与基准相同':r.delta>0?'在当前假设下利润提高':'当前降价方案未提高利润'}。这是固定弹性和成本假设下的教学计算，实际决策需要真实订单、费用和库存验证。`,sourceIds:['revenue','costs'],suggestions:['为什么收入不等于利润？','需求价格弹性是什么？','盈亏平衡怎么算？'],context:{...context,topicId:'K023'}};
 }
 const found=searchKnowledge(q),explicit=found[0]?.relevance>=8;
 const usePrior=prior&&!explicit&&(followup.test(normalized)||/例子|依据|来源|不懂|解释|步骤|这个|那个|这怎么/.test(q));
 const k=usePrior?prior:found[0];
 if(!k)return {kind:'out-of-scope',text:'当前知识库没有找到足够匹配的依据。请补充商品、价格、销量或成本方面的信息，也可以在“知识库”中检索。这里不会编造资料或把未知内容当作教材结论。',sourceIds:[],suggestions:['需求价格弹性','机会成本','贡献毛益'],context};
 const isExample=/例子|举例|案例/.test(q),isSource=/依据|来源|教材|出处/.test(q);
 const text=isExample?`${k.title}，换成岗位里的例子：\n${k.example}\n操作提示：先写出假设和数据口径，再判断这些条件是否适用于你的任务。`:isSource?`${k.title}的依据见下方章节链接。\n${k.text}\n这段文字是中文教学改写，案例为原创模拟情境；可打开原始教材核对。`:`${k.title}\n${k.text}\n岗位示例：${k.example}\n下一步：把这个知识点用于当前任务，并记录一个需要核实的假设。`;
 return {kind:'answer',text,sourceIds:[k.sourceId],knowledgeId:k.id,suggestions:['举个例子','再解释一下','依据是什么？'],context:{...context,topicId:k.id,turns:(context.turns||0)+1}};
}
export function diagnose(answers){
 const assessed=questions.filter(q=>Number.isInteger(answers[q.id])&&answers[q.id]>=0&&answers[q.id]<q.options.length);
 const correct=assessed.filter(q=>answers[q.id]===q.answer);
 const dimensions=skills.map(s=>{const subset=assessed.filter(q=>q.skill===s.id),right=subset.filter(q=>answers[q.id]===q.answer);return {...s,assessed:subset.length,score:subset.length?Math.round(right.length/subset.length*100):null};});
 const recommendations=dimensions.filter(s=>s.score===0).map(s=>({...s,reason:'本次题目答错，建议先复习关联知识，再重新测验。'}));
 return {completed:assessed.length,correct:correct.length,total:questions.length,score:assessed.length?Math.round(correct.length/assessed.length*100):null,dimensions,recommendations};
}
export function createTask({scenario='promotion',level='基础',minutes=30}={}){
 if(!scenarios[scenario])throw new RangeError('请选择现有实训情境。');if(!['基础','进阶'].includes(level))throw new RangeError('请选择学习层级。');check(minutes,15,120,'课时');
 const s=scenarios[scenario];return {scenario,title:s.title,brief:s.brief,level,minutes,steps:[...s.steps,...(level==='进阶'?['分别将弹性设为0.8、1.5、2.2，检验建议是否稳健。']:[])],sourceIds:s.sources,criteria:['口径清楚：价格、销量、成本与周期一致','计算正确：区分收入、贡献与利润','约束明确：检查库存与保本条件','结论有据：指出模型假设和需要核实的信息'],safety:'使用教学模拟数据；不要输入顾客、学生或商家的个人信息。结果不能代替实际经营尽调。'};
}
