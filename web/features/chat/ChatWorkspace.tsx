'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowUp,ArrowRight,BookOpen,GraduationCap,MessageCircle,Route,Plus} from 'lucide-react';
import {useTutor} from '@/shared/context';
import type {ChatRequest,ChatResponse} from '@/contracts/learning';
import {askTutor,askOnlineTutor,onlineConfigured} from './adapter';
import AnswerText from './AnswerText';
import {SourceLinks} from '@/components/common';
import {skills,lessons} from '../../../data/learning.mjs';
import {buildPath,diagnosisComplete} from '../../../src/mastery.mjs';

type Job={id:string;request:ChatRequest;controller:AbortController};
type Failure={id:string;request:ChatRequest;message:string};
export default function ChatWorkspace({compact=false}:{compact?:boolean}){
 const {state,update,navigate,notify}=useTutor();
 const [draft,setDraft]=useState(''),[mode,setMode]=useState<'explain'|'coach'>('explain');
 const [provider,setProvider]=useState<'online'|'local'>(onlineConfigured?'online':'local');
 const [pending,setPending]=useState(false),[failure,setFailure]=useState<Failure|null>(null);
 const job=useRef<Job|null>(null),last=useRef<HTMLDivElement>(null),input=useRef<HTMLTextAreaElement>(null);
 const conversation=state.conversations.find(c=>c.id===state.activeConversation),messages=conversation?.messages||[];
 const skill=skills.find(s=>s.id===state.selectedSkill)!,path=buildPath(state.attempts,state.minutes),recommended=path[0];
 useEffect(()=>{if(messages.length)last.current?.scrollIntoView({block:'nearest',behavior:'smooth'});},[messages.length,pending]);
 useEffect(()=>{const fn=(e:Event)=>{setDraft((e as CustomEvent<string>).detail);input.current?.focus();};window.addEventListener('tutor-question',fn);return()=>window.removeEventListener('tutor-question',fn);},[]);
 useEffect(()=>()=>{job.current?.controller.abort();job.current=null;},[]);
 useEffect(()=>{
  if(job.current&&job.current.id!==state.activeConversation){job.current.controller.abort();job.current=null;setPending(false);}
  setFailure(f=>f&&f.id!==state.activeConversation?null:f);
 },[state.activeConversation]);
 function appendAnswer(id:string,response:ChatResponse){
  update(s=>{if(s.activeConversation!==id)return s;return {...s,conversations:s.conversations.map(c=>c.id===id?{...c,context:response.context,messages:[...c.messages,{role:'assistant' as const,...response}].slice(-40)}:c)};});
 }
 async function attempt(request:ChatRequest,id:string){
  if(job.current)return;
  const active={id,request,controller:new AbortController()};job.current=active;setPending(true);setFailure(null);
  try{const response=await askOnlineTutor(request,active.controller.signal);if(job.current===active)appendAnswer(id,response);}
  catch(error){if(job.current===active)setFailure({id,request,message:error instanceof Error?error.message:'DeepSeek 暂时无法回答，请使用教材规则。'});}
  finally{if(job.current===active){job.current=null;setPending(false);}}
 }
 function send(question:string){
  const text=question.trim();if(!text||job.current||text.length>2000)return;
  const request:ChatRequest={question:text,context:conversation?.context||{},pricing:state.pricing,skill:state.selectedSkill,mode,history:messages};
  const id=conversation?.id||crypto.randomUUID();
  try{
   const response=provider==='local'?askTutor(request):null;
   update(s=>{const existing=s.conversations.find(c=>c.id===id);const c={id,title:existing?.title||text.slice(0,32),context:response?.context||existing?.context||{},messages:[...(existing?.messages||[]),{role:'user' as const,text},...(response?[{role:'assistant' as const,...response}]:[])].slice(-40)};return {...s,activeConversation:id,conversations:[...s.conversations.filter(c=>c.id!==id),c].slice(-10)};});
   setDraft('');setFailure(null);if(!response)void attempt(request,id);
  }catch{notify('暂时无法生成回答，请缩短问题后重试。');}
 }
 function propose(question:string){if(provider==='online'){setDraft(question);input.current?.focus();}else send(question);}
 function cancel(){const active=job.current;if(!active)return;job.current=null;active.controller.abort();setPending(false);setFailure({id:active.id,request:active.request,message:'已取消本次在线回答。'});}
 function fallback(){if(!failure||failure.id!==state.activeConversation)return;appendAnswer(failure.id,askTutor(failure.request));setFailure(null);}
 const activeFailure=failure?.id===state.activeConversation?failure:null;
 return <div className={`chat-workspace ${compact?'compact-chat':''} ${messages.length?'has-messages':''}`}>
  {messages.length?<div className="conversation" role="log" aria-label="学习对话">{messages.map((m,i)=><article key={i} className={`message message-${m.role}`}><div className="message-label">{m.role==='assistant'?<><GraduationCap size={20}/><strong>学习助手</strong><small>AI生成内容 · {m.mode==='model'?'DeepSeek 在线回答':'教材与规则'}</small></>:<span>我</span>}</div><div className="message-text">{m.role==='assistant'?<AnswerText text={m.text}/>:m.text}</div>{m.role==='assistant'&&<>{m.mode==='model'&&!!m.sourceIds?.length&&<p className="source-caption">本轮参考教材 · 请逐项核对回答</p>}<SourceLinks ids={m.sourceIds||[]}/></>}</article>)}<div ref={last}/></div>:<div className="welcome"><div className="welcome-mark"><GraduationCap size={43} strokeWidth={1.15}/></div><p className="eyebrow">电子商务运营 · 学习答疑</p><h1>{compact?'这节内容，哪里还不清楚？':'今天，想学懂什么？'}</h1><p className="welcome-subtitle">可以问概念、看岗位案例，<br className="mobile-only"/>或结合实训参数分析收入与利润。</p></div>}
  <div className="composer-area">
   <div className="chat-provider"><label>回答方式 <select aria-label="回答方式" value={provider} disabled={pending} onChange={e=>{setProvider(e.target.value as 'online'|'local');setFailure(null);}}>{onlineConfigured&&<option value="online">DeepSeek 在线</option>}<option value="local">教材规则 · 离线</option></select></label>{!onlineConfigured&&<span>在线服务尚未配置</span>}</div>
   {provider==='online'&&<p className="chat-disclosure">点击发送即将本轮问题、最近最多 6 条对话（合计最多 4000 字）及当前经营实验参数，经问答服务发送至 DeepSeek；服务端会加入相关教材片段。请勿输入姓名、联系方式或其他私人信息。初次打开页面不会上传历史。</p>}
   {pending&&<div className="chat-request-status" role="status">DeepSeek 正在回答…<button type="button" onClick={cancel}>取消回答</button></div>}
   {activeFailure&&<div className="chat-request-status chat-error" role="alert"><p>{activeFailure.message}</p><div><button type="button" onClick={()=>void attempt(activeFailure.request,activeFailure.id)}>重试在线回答</button><button type="button" onClick={fallback}>用教材规则回答此题</button></div></div>}
   <form className="composer" onSubmit={e=>{e.preventDefault();send(draft);}}><textarea ref={input} aria-label="向学习助手提问" placeholder={compact?'对这节内容有什么疑问？':'问一个问题，或告诉我你正在遇到的学习困难…'} rows={3} maxLength={2000} value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();send(draft);}}}/><div className="composer-toolbar"><label className="mode-picker"><MessageCircle size={16}/><select aria-label="讲解方式" value={mode} onChange={e=>setMode(e.target.value as 'explain'|'coach')}><option value="explain">讲解与答疑</option><option value="coach">引导式学习</option></select></label><span className="composer-divider"/><label className="context-picker"><BookOpen size={15}/><select aria-label="当前学习主题" value={state.selectedSkill} onChange={e=>update({selectedSkill:e.target.value})}>{skills.map(s=><option value={s.id} key={s.id}>{s.name}</option>)}</select></label><button type="submit" className="send-button" aria-label="发送问题" disabled={pending||!draft.trim()}><ArrowUp size={19}/></button></div></form>
   <div className="chat-caption">AI生成内容 · {provider==='online'?'DeepSeek 结合本轮教材与实验参数回答':'依据内置教材与规则生成'} · 请核对来源</div>
   {messages.length?<div className="suggestions">{(messages.at(-1)?.suggestions||[]).map(q=><button key={q} disabled={pending} onClick={()=>propose(q)}>{q}<ArrowRight size={12}/></button>)}<button onClick={()=>{update({activeConversation:null});setDraft('');}}><Plus size={13}/>新对话</button></div>:<><div className="starter-grid">{[{icon:Route,text:'为我规划今天的学习',action:()=>navigate(diagnosisComplete(state.attempts)?'mastery':'diagnosis')},{icon:BookOpen,text:'降价了，为什么利润没涨？',action:()=>propose('为什么收入不等于利润？')},{icon:GraduationCap,text:'给我讲一个岗位里的例子',action:()=>propose(lessons.find(l=>l.skill===skill.id)!.prompt+' 举个例子')}].map(({icon:Icon,text,action})=><button key={text} disabled={pending} onClick={action}><Icon size={17} strokeWidth={1.5}/><span>{text}</span><ArrowRight size={13}/></button>)}</div>{!compact&&<div className="continue-learning"><div className="continue-icon"><Route size={20}/></div><div><span>{diagnosisComplete(state.attempts)?'根据你的作答，继续下一步':'还不了解自己的起点？'}</span><strong>{diagnosisComplete(state.attempts)?recommended?.lesson?.title:'用 6 道小题，找到适合自己的学习路径'}</strong></div><button onClick={()=>navigate(diagnosisComplete(state.attempts)?'mastery':'diagnosis')}>{diagnosisComplete(state.attempts)?'查看路径':'开始诊断'}<ArrowRight size={15}/></button></div>}</>}
  </div>{!messages.length&&!compact&&<div className="home-footnote"><span>财经商贸专业群</span><span>电子商务运营专员</span><span>65 条有来源的专业知识</span></div>}
 </div>;
}
