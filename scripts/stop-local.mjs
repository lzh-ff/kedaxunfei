import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const file=path.join(process.env.LOCALAPPDATA||path.join(os.homedir(),'.local/share'),'GangkeZhilian/app-process.json');
if(fs.existsSync(file)){
 const record=JSON.parse(fs.readFileSync(file,'utf8'));
 if(record.root!==root||!Number.isInteger(record.pid))throw new Error('进程记录与当前项目不一致，未停止其他程序。');
 if(process.platform==='win32'){
  const command=`[Console]::OutputEncoding=[System.Text.UTF8Encoding]::new(); $p=Get-CimInstance Win32_Process -Filter 'ProcessId=${record.pid}'; if($null-ne$p){$p | Select-Object Name,CommandLine | ConvertTo-Json -Compress}`;
  const text=execFileSync('powershell.exe',['-NoProfile','-Command',command],{encoding:'utf8',windowsHide:true}).trim();
  if(text){const p=JSON.parse(text);const expected=path.join(root,'scripts/local-app.mjs');if(p.Name==='node.exe'&&p.CommandLine.includes(expected))process.kill(record.pid);else throw new Error('记录的进程已变化，未停止其他程序。');}
 }else{console.log('请在启动终端停止本机服务。');process.exit(0);}
 fs.unlinkSync(file);console.log('本机问答已关闭。');
}else console.log('没有由启动器开启的本机问答。');
