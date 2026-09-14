import {spawnSync} from 'node:child_process';
import {cp,mkdir,rm} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const target=resolve(root,'web/out-offline');
for(const [script,directory] of [['scripts/build.mjs','web'],['scripts/prepare-site.mjs','.']]){
 const result=spawnSync(process.execPath,[script],{cwd:resolve(root,directory),env:{...process.env,NEXT_PUBLIC_TUTOR_API_URL:'',NEXT_TELEMETRY_DISABLED:'1'},stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);
}
// Keep a copy, because web/out is rebuilt for whichever endpoint gets published.
if(!target.startsWith(resolve(root,'web')+sep))throw new Error('invalid output path');
await rm(target,{recursive:true,force:true});await mkdir(target,{recursive:true});await cp(resolve(root,'web/out'),target,{recursive:true});
console.log('教材规则版已保存到 web/out-offline；离线预览包使用此目录。');
