import {reply} from '../../../src/engine.mjs';
import type {ChatRequest,ChatResponse} from '@/contracts/learning';
import {lessons,skills} from '../../../data/learning.mjs';
import {requestOnlineTutor,safeEndpoint} from '../../../src/chat-client.mjs';
export const TUTOR_API_URL=safeEndpoint(process.env.NEXT_PUBLIC_TUTOR_API_URL||'');
export const onlineConfigured=Boolean(TUTOR_API_URL);
export function askOnlineTutor(request:ChatRequest,signal:AbortSignal):Promise<ChatResponse>{return requestOnlineTutor(TUTOR_API_URL,request,{signal}) as Promise<ChatResponse>;}
export function askTutor(request:ChatRequest):ChatResponse{
 const result=reply(request.question,{...request.context,pricing:request.pricing});
 const lesson=lessons.find(l=>l.skill===request.skill)!;
 if(/学习计划|学习路径|怎么学|学什么/.test(request.question))return {text:`你正在学习${skills.find(s=>s.id===request.skill)?.name||'电子商务运营'}。\n建议先完成6题学习诊断，再进入“学习路径”。系统会依据不同题目的作答证据安排阅读和迁移练习。\n本节目标：${lesson.objective}\n你可以从“${lesson.prompt}”开始，或者告诉我你不理解的概念。`,sourceIds:[],suggestions:[lesson.prompt,'举个例子','依据是什么？'],context:{...request.context},mode:'local'};
 const text=request.mode==='coach'&&result.kind==='answer'?`先自己判断一个问题：${lesson.case}\n\n你会先比较哪个指标？\n\n参考线索：${result.text}`:result.text;
 return {...result,text,mode:'local'} as ChatResponse;
}
