import test from 'node:test';
import assert from 'node:assert/strict';
import { simulatePricing, evaluateGame, reply, diagnose, createTask } from '../src/engine.mjs';
import { knowledge, sources } from '../data/knowledge.mjs';
import { questions } from '../data/curriculum.mjs';

const baseline = { price: 100, basePrice: 100, baseDemand: 1000, elasticity: 1.5, unitCost: 60, fixedCost: 10000, capacity: 2000 };
test('baseline accounting agrees with hand calculation', () => {
  const r = simulatePricing(baseline);
  assert.equal(r.quantity, 1000); assert.equal(r.revenue, 100000); assert.equal(r.profit, 30000); assert.equal(r.breakEven, 250);
});
test('lower prices change demand and respect capacity', () => {
  const r = simulatePricing({ ...baseline, price: 80, capacity: 1100 });
  assert.equal(r.quantity, 1100); assert.equal(r.profit, 12000); assert.ok(r.unconstrainedDemand > 1100);
});
test('nonpositive margin has no finite break-even and remains explicit', () => {
  const r=simulatePricing({...baseline,price:50}); assert.equal(r.breakEven,null); assert.ok(r.profit<0);
});
test('bad and nonfinite parameters are rejected', () => {
  for(const patch of [{price:0},{unitCost:-1},{elasticity:NaN},{capacity:0},{baseDemand:Infinity}]) assert.throws(()=>simulatePricing({...baseline,...patch}));
});
test('rational and universalization preferences differ at the same belief', () => {
  const a=evaluateGame({belief:0.5,kappa:0,T:5,R:3,P:1,S:0});
  const b=evaluateGame({belief:0.5,kappa:0.5,T:5,R:3,P:1,S:0});
  assert.equal(a.action,'D'); assert.equal(a.cooperate,1.5); assert.equal(a.defect,3);
  assert.equal(b.action,'C'); assert.equal(b.cooperate,2.25); assert.equal(b.defect,2);
});
test('game rejects invalid probability and non-PD payoffs',()=>{
  assert.throws(()=>evaluateGame({belief:2,kappa:0,T:5,R:3,P:1,S:0}));
  assert.throws(()=>evaluateGame({belief:.5,kappa:.5,T:1,R:3,P:1,S:0}));
});
test('ambiguous first question clarifies and follow-ups preserve the subject', () => {
  const a=reply('这个怎么弄？',{});assert.equal(a.kind,'clarify');
  const b=reply('需求价格弹性',{});assert.ok(b.sourceIds.length); assert.equal(b.kind,'answer');
  const c=reply('举个例子',b.context);assert.ok(c.text.includes('例'));assert.equal(c.context.topicId,b.context.topicId);
  const d=reply('再解释一下',c.context);assert.ok(d.sourceIds.length); assert.equal(d.context.topicId,b.context.topicId);
});
test('unknown topics do not invent references',()=>{
  const a=reply('量子引力超弦振动',{});assert.equal(a.kind,'out-of-scope');assert.equal(a.sourceIds.length,0);
});
test('unchanged baseline is described as equal rather than an improvement',()=>{
 const a=reply('降价会提高利润吗？',{pricing:baseline});assert.match(a.text,/与基准相同/);assert.doesNotMatch(a.text,/利润提高/);
});
test('zero fixed cost has distinct break-even boundary cases',()=>{
 const any=simulatePricing({...baseline,price:60,fixedCost:0});assert.equal(any.breakEven,0);assert.equal(any.breakEvenType,'any');
 const zero=simulatePricing({...baseline,price:50,fixedCost:0});assert.equal(zero.breakEven,0);assert.equal(zero.breakEvenType,'zero-only');
});
test('price explicitly supplied in a question is used and marked as a what-if',()=>{
 const a=reply('降价到80元能提高利润吗？',{pricing:baseline});assert.match(a.text,/80元/);assert.doesNotMatch(a.text,/售价100元/);assert.match(a.text,/页面参数未改变/);
});
test('target discount price takes precedence over original price',()=>{
 const a=reply('原价格100元，降价到80元能提高利润吗？',{pricing:baseline});assert.match(a.text,/试算售价80元/);
});
test('negative price in a question is clarified instead of ignored',()=>{
 const a=reply('降价到-10元能提高利润吗？',{pricing:baseline});assert.equal(a.kind,'clarify');
});
test('demonstrative follow-up retains a known topic',()=>{
 const a=reply('需求价格弹性',{});const b=reply('这个怎么弄？',a.context);assert.equal(b.context.topicId,a.context.topicId);assert.equal(b.kind,'answer');
});
test('knowledge contains at least 60 unique traceable entries', () => {
  assert.ok(knowledge.length>=60);assert.equal(new Set(knowledge.map(k=>k.id)).size,knowledge.length);
  for(const k of knowledge){assert.ok(k.title&&k.text&&k.example&&k.skill);assert.ok(sources[k.sourceId]?.url.startsWith('https://'));assert.ok(sources[k.sourceId]?.section);}
});
test('diagnosis separates unassessed, wrong, and correct answers',()=>{
  assert.equal(diagnose({}).completed,0); assert.equal(diagnose({}).score,null);
  const all=Object.fromEntries(questions.map(q=>[q.id,q.answer]));const d=diagnose(all);assert.equal(d.score,100);assert.equal(d.completed,questions.length);
  const bad=Object.fromEntries(questions.map(q=>[q.id,(q.answer+1)%q.options.length]));assert.equal(diagnose(bad).score,0);assert.ok(diagnose(bad).recommendations.length);
});
test('task output changes with scenario and includes steps, resources and criteria',()=>{
  const a=createTask({scenario:'promotion',level:'基础',minutes:30});const b=createTask({scenario:'inventory',level:'进阶',minutes:60});
  assert.notEqual(a.title,b.title);assert.ok(a.steps.length>=3);assert.ok(a.sourceIds.length);assert.ok(a.criteria.length);assert.equal(b.minutes,60);
});
