import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const privateDir=path.join(process.env.LOCALAPPDATA||path.join(os.homedir(),'.local/share'),'GangkeZhilian');
const address='http://127.0.0.1:4174/kedaxunfei/';
const ready=async()=>{try{const r=await fetch(address,{signal:AbortSignal.timeout(1000)});return r.ok&&(await r.text()).includes('职教自适应学习助手');}catch{return false;}};
function openBrowser(){if(process.platform==='win32')spawn(process.env.COMSPEC||'cmd.exe',['/c','start','',address],{windowsHide:true,stdio:'ignore'}).unref();else console.log('打开 '+address);}
async function main(){
 if(await ready()){openBrowser();return;}
 if(!fs.existsSync(path.join(root,'web/out-local/index.html')))throw new Error('缺少本机版网页，请按复现说明运行 npm run build:local。');
 if(!fs.existsSync(path.join(root,'node_modules/openai/package.json')))throw new Error('尚未安装代码依赖，请先在此目录运行 npm ci。');
 const localEnv=path.join(root,'.env.tutor.local');
 if(fs.existsSync(localEnv)){
  try{process.loadEnvFile(localEnv);}catch{throw new Error('本机环境配置格式不正确，请检查 .env.tutor.local。');}
 }
 const env={...process.env,TUTOR_ALLOWED_ORIGINS:'http://127.0.0.1:4174',TUTOR_PORT:'4174',DEEPSEEK_MODEL:process.env.DEEPSEEK_MODEL||'deepseek-flash'};
 const config=path.join(privateDir,'secrets/deepseek-runtime.json');
 if(!env.DEEPSEEK_API_KEY&&fs.existsSync(config)){
  try{env.DEEPSEEK_API_KEY=JSON.parse(fs.readFileSync(config,'utf8')).api_key;}
  catch{throw new Error('私有密钥配置格式不正确，请重新配置。');}
 }
 if(typeof env.DEEPSEEK_API_KEY!=='string'||!env.DEEPSEEK_API_KEY.trim())throw new Error('尚未配置 DeepSeek 密钥。请按复现说明设置 DEEPSEEK_API_KEY 环境变量。');
 const logs=path.join(privateDir,'logs');fs.mkdirSync(logs,{recursive:true});
 const stdout=fs.openSync(path.join(logs,'app-out.log'),'a'),stderr=fs.openSync(path.join(logs,'app-error.log'),'a');
 const child=spawn(process.execPath,[path.join(root,'scripts/local-app.mjs')],{cwd:root,env,detached:true,windowsHide:true,stdio:['ignore',stdout,stderr]});
 child.unref();fs.closeSync(stdout);fs.closeSync(stderr);
 fs.writeFileSync(path.join(privateDir,'app-process.json'),JSON.stringify({pid:child.pid,root,startedAt:new Date().toISOString()}));
 for(let i=0;i<30;i++){await new Promise(r=>setTimeout(r,300));if(await ready()){console.log('岗课智联本机问答已启动。');openBrowser();return;}}
 throw new Error('本机问答未能启动。请检查本机运行日志，或按复现说明启动。');
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
