import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
for(const [script,directory] of [['scripts/build.mjs','web'],['scripts/prepare-site.mjs','.']]){
 const result=spawnSync(process.execPath,[script],{cwd:resolve(root,directory),env:{...process.env,NEXT_PUBLIC_TUTOR_API_URL:'',NEXT_TELEMETRY_DISABLED:'1'},stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);
}
