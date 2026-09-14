import {sources,knowledge} from '../data/knowledge.mjs';

export const CHAT_LIMITS=Object.freeze({question:2000,historyCount:6,historyItem:1000,historyTotal:4000,requestBytes:25000,output:4000,providerBytes:65536});
export const PRICING_KEYS=Object.freeze(['price','basePrice','baseDemand','elasticity','unitCost','fixedCost','capacity']);
export function hasPrivateIdentifier(text){
 return /(?<!\d)1[3-9]\d{9}(?!\d)|(?<!\d)\d{17}[\dXx](?!\d)|[\w.+-]+@[\w.-]+\.[a-z]{2,}|\bsk-[a-z0-9_-]{12,}/i.test(text);
}
export function safeEndpoint(value=''){
 const endpoint=value.trim();if(endpoint==='/api/chat')return endpoint;if(!endpoint)return '';
 try{const url=new URL(endpoint);if(url.username||url.password||url.hash||url.search)return '';
  if(url.protocol==='https:'||(url.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname)))return endpoint;
 }catch{}return '';
}
export function buildOnlineRequest(request){
 const history=[];let size=0;
 for(const m of (request.history||[]).slice(-CHAT_LIMITS.historyCount).reverse()){
  if(!['user','assistant'].includes(m.role)||typeof m.text!=='string')continue;
  const text=m.text.slice(0,CHAT_LIMITS.historyItem);if(!text.trim())continue;if(size+text.length>CHAT_LIMITS.historyTotal)break;
  history.unshift({role:m.role,text});size+=text.length;
 }
 const result={question:request.question.trim(),history,skill:request.skill,mode:request.mode};
 if(request.pricing)result.pricing=Object.fromEntries(PRICING_KEYS.filter(k=>Object.hasOwn(request.pricing,k)).map(k=>[k,request.pricing[k]]));
 return result;
}
const errors={PRIVATE_INPUT:'问题或近期对话含手机号、邮箱、证件号或密钥格式，请删除相关内容，或新建对话后重试。',RATE_LIMIT:'在线提问太频繁，请稍后重试，或切换教材规则。',NOT_CONFIGURED:'DeepSeek 服务尚未配置完成，请使用教材规则。',UPSTREAM_TIMEOUT:'DeepSeek 回答超时，请重试，或使用教材规则。',INVALID_REQUEST:'问题或近期对话不符合发送要求，请缩短内容或新建对话。'};
/** @param {string} endpoint @param {any} request @param {{signal?:AbortSignal,fetchImpl?:typeof fetch,timeoutMs?:number}} options */
export async function requestOnlineTutor(endpoint,request,{signal,fetchImpl=fetch,timeoutMs=30000}={}){
 if(!safeEndpoint(endpoint))throw new Error(errors.NOT_CONFIGURED);
 const payload=buildOnlineRequest(request);
 if(hasPrivateIdentifier([payload.question,...payload.history.map(m=>m.text)].join('\n')))throw new Error(errors.PRIVATE_INPUT);
 const controller=new AbortController();let timedOut=false;
 const abort=()=>controller.abort();if(signal?.aborted)abort();else signal?.addEventListener('abort',abort,{once:true});
 const timer=setTimeout(()=>{timedOut=true;controller.abort();},timeoutMs);
 try{
  const response=await fetchImpl(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),credentials:'omit',redirect:'error',signal:controller.signal});
  let data;try{data=await response.json();}catch{throw new Error('DeepSeek 响应格式异常，请重试，或使用教材规则。');}
  if(!response.ok)throw new Error(errors[data?.code]||'DeepSeek 暂时无法回答，请重试，或使用教材规则。');
  if(data?.mode!=='model'||data.provider!=='DeepSeek'||typeof data.text!=='string'||!data.text.trim()||data.text.length>4100)throw new Error('DeepSeek 响应格式异常，请重试，或使用教材规则。');
  return {text:data.text,mode:'model',provider:'DeepSeek',sourceIds:[...new Set((Array.isArray(data.sourceIds)?data.sourceIds:[]).filter(id=>typeof id==='string'&&Object.hasOwn(sources,id)))].slice(0,4),suggestions:(Array.isArray(data.suggestions)?data.suggestions:[]).filter(s=>typeof s==='string'&&s.length<=100).slice(0,3),context:knowledge.some(k=>k.id===data.context?.topicId)?{topicId:data.context.topicId}:{},truncated:data.truncated===true};
 }catch(error){if(signal?.aborted)throw new DOMException('已取消','AbortError');if(timedOut)throw new Error(errors.UPSTREAM_TIMEOUT);if(error instanceof TypeError)throw new Error('DeepSeek 连接失败，请检查网络，或使用教材规则。');throw error;}
 finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
}
