import type {LearningState} from '@/contracts/learning';
import {defaults,simulatePricing} from '../../src/engine.mjs';
import {validAttempts} from '../../src/mastery.mjs';
import {skills,questions} from '../../data/learning.mjs';
export const STORAGE_KEY='vocational-tutor-v2';
export const freshState=():LearningState=>({version:2,attempts:[],reads:[],minutes:30,selectedSkill:'pricing',note:'',pricing:{...defaults},scenario:'promotion',level:'基础',steps:[],conversations:[],activeConversation:null,theme:'light'});
export function parseState(raw:unknown):LearningState{
 const s=freshState();if(!raw||typeof raw!=='object')return s;const r=raw as Partial<LearningState>;if(r.version!==2)return s;
 s.attempts=validAttempts(r.attempts);s.reads=Array.isArray(r.reads)?r.reads.filter(x=>skills.some(sk=>sk.id===x)):[];
 s.minutes=[30,45,60].includes(r.minutes||0)?r.minutes!:30;s.selectedSkill=skills.some(sk=>sk.id===r.selectedSkill)?r.selectedSkill!:'pricing';
 s.note=typeof r.note==='string'?r.note.slice(0,5000):'';try{simulatePricing(r.pricing||defaults);s.pricing={...defaults,...r.pricing};}catch{}
 s.scenario=['promotion','inventory','margin'].includes(r.scenario||'')?r.scenario!:'promotion';s.level=r.level==='进阶'?'进阶':'基础';s.steps=Array.isArray(r.steps)?r.steps.slice(0,5).map(Boolean):[];s.theme=r.theme==='dark'?'dark':'light';
 if(Array.isArray(r.conversations))s.conversations=r.conversations.filter(c=>c&&typeof c.id==='string'&&typeof c.title==='string'&&Array.isArray(c.messages)).slice(-10).map(c=>({...c,title:c.title.slice(0,80),context:c.context&&typeof c.context==='object'?c.context:{},messages:c.messages.filter(m=>(m.role==='user'||m.role==='assistant')&&typeof m.text==='string').slice(-40).map(m=>({...m,text:m.text.slice(0,10000),sourceIds:Array.isArray(m.sourceIds)?m.sourceIds.filter(x=>typeof x==='string'):[],suggestions:Array.isArray(m.suggestions)?m.suggestions.filter(x=>typeof x==='string').slice(0,4):[]}))}));
 s.activeConversation=s.conversations.some(c=>c.id===r.activeConversation)?r.activeConversation!:null;return s;
}
export function loadState(){
 const raw=localStorage.getItem(STORAGE_KEY);if(raw)return parseState(JSON.parse(raw));
 const old=JSON.parse(localStorage.getItem('jingshi-practicum-v1')||'null');const s=freshState();
 if(old?.version===1){s.note=String(old.note||'').slice(0,5000);try{simulatePricing(old.pricing);s.pricing={...defaults,...old.pricing};}catch{}if(old.assessed)s.attempts=questions.filter(q=>Number.isInteger(old.answers?.[q.id])&&old.answers[q.id]>=0&&old.answers[q.id]<q.options.length).map(q=>({questionId:q.id,choice:old.answers[q.id],at:new Date().toISOString()}));}
 return s;
}
export function download(name:string,text:string,type='text/plain;charset=utf-8'){const u=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
