// Adapted from HKUDS DeepTutor 1.6.7 deeptutor/learning/mastery.py, Apache-2.0.
// Modification: JavaScript port; question deduplication and vocational planning added.
import {skills,questions,allQuestions,lessons} from '../data/learning.mjs';
export function computeMastery(correctness){
 if(!Array.isArray(correctness)||correctness.some(x=>typeof x!=='boolean'))throw new TypeError('Expected boolean evidence');
 if(!correctness.length)return 0;
 const recent=correctness.slice(-5),weights=[.5,.7,.85,.95,1].slice(-recent.length);
 const score=recent.reduce((sum,c,i)=>sum+(c?weights[i]:0),0)/weights.reduce((a,b)=>a+b,0);
 return Math.min(score,({1:.5,2:.8})[recent.length]??1);
}
export function validAttempts(attempts){
 if(!Array.isArray(attempts))return [];
 return attempts.filter(a=>a&&allQuestions.some(q=>q.id===a.questionId&&Number.isInteger(a.choice)&&a.choice>=0&&a.choice<q.options.length)&&typeof a.at==='string'&&Number.isFinite(Date.parse(a.at))).slice(-300);
}
export function evidenceFor(attempts,skill){
 const latest=new Map();
 for(const a of validAttempts(attempts)){const q=allQuestions.find(q=>q.id===a.questionId);if(q.skill===skill){latest.delete(q.id);latest.set(q.id,{...a,correct:a.choice===q.answer});}}
 return [...latest.values()];
}
export function masteryProfile(attempts){return skills.map(s=>{const evidence=evidenceFor(attempts,s.id),value=computeMastery(evidence.map(a=>a.correct)),mastered=evidence.length>=3&&value>=.8&&evidence.at(-1).correct;return {...s,evidence,value,score:Math.round(value*100),mastered,status:!evidence.length?'待诊断':mastered?'本组已达标':value>=.5?'继续巩固':'优先补强'};});}
export function diagnosisComplete(attempts){return questions.every(q=>validAttempts(attempts).some(a=>a.questionId===q.id));}
const prerequisites={pricing:['demand'],analysis:['pricing','cost'],operations:['analysis']};
export function buildPath(attempts,minutes=30){
 const profile=masteryProfile(attempts),ranked=[...profile].sort((a,b)=>Number(a.mastered)-Number(b.mastered)||a.value-b.value||skills.findIndex(s=>s.id===a.id)-skills.findIndex(s=>s.id===b.id));
 const ordered=[],added=new Set();
 function add(s){if(added.has(s.id))return;for(const id of prerequisites[s.id]||[]){const pre=profile.find(s=>s.id===id);if(!pre.mastered)add(pre);}added.add(s.id);ordered.push(s);}
 for(const s of ranked.filter(s=>!s.mastered))add(s);
 if(!ordered.length)ordered.push(...profile);
 let used=0;const selected=new Set();
 return ordered.filter(s=>{const duration=lessons.find(l=>l.skill===s.id).minutes;
  if((prerequisites[s.id]||[]).some(id=>!profile.find(s=>s.id===id).mastered&&!selected.has(id)))return false;
  if(used+duration>minutes)return false;used+=duration;selected.add(s.id);return true;
 }).map(s=>({...s,lesson:lessons.find(l=>l.skill===s.id),reason:!s.evidence.length?'尚无作答证据，从基础概念开始。':s.mastered?'本组题已达标，安排一次复习。':s.value<.5?'本组作答暴露了薄弱点，先读讲解再做迁移题。':s.evidence.length<3?'已有正确作答，但证据不足；用不同题目继续验证。':'继续练习未掌握题目，最近作答的权重更高。'}));
}
