import {fileURLToPath} from 'node:url';
import {createLocalApp} from '../server/local-app.mjs';
const rootDir=fileURLToPath(new URL('../web/out-local/',import.meta.url));
const port=Number(process.env.TUTOR_PORT||4174);
createLocalApp({rootDir}).listen(port,'127.0.0.1',()=>console.log(`本机学习助手：http://127.0.0.1:${port}/kedaxunfei/`));
