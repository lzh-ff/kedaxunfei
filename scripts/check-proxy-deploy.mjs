// Deploy-time guard for the hosted tutoring proxy.
// Runs as the Vercel build step so a misconfigured deployment fails here
// instead of answering 503 to every visitor.
import {createTutorProxy} from '../server/tutor-proxy.mjs';
import {knowledge} from '../data/knowledge.mjs';

const problems=[],warnings=[];
const origins=(process.env.TUTOR_ALLOWED_ORIGINS||'https://lzh-ff.github.io').split(',').map(s=>s.trim()).filter(Boolean);

// Runtime secrets can be injected separately from the build environment, so a
// missing value here is not conclusive. The deployed endpoint is smoke-tested
// after release; see docs/deployment.md.
if(!process.env.DEEPSEEK_API_KEY)warnings.push('构建环境没有 DEEPSEEK_API_KEY。若运行环境也没有，问答只会返回“在线问答尚未配置完成”。');
// The Netlify adapter reads the client address from the platform context, so
// the forwarded-header setting only applies to the plain Node deployment.
if(!process.env.NETLIFY&&process.env.TUTOR_TRUST_PROXY!=='1')warnings.push('构建环境没有 TUTOR_TRUST_PROXY=1。若运行环境也没有，限流会把所有访问者当成同一个来源。');
if(!origins.every(o=>/^https?:\/\//.test(o)))problems.push('TUTOR_ALLOWED_ORIGINS 含非法来源：'+origins.join(', '));
if(knowledge.length<60)problems.push(`知识条目只有 ${knowledge.length} 条，少于比赛要求的 50 条下限。`);

// Building the handler also resolves the whole import graph the function needs.
const handle=createTutorProxy();
const forbidden=await handle({method:'POST',headers:{origin:'https://example.invalid','content-type':'application/json'},body:'{}'});
if(forbidden.status!==403)problems.push(`来源白名单未生效，未知来源返回 ${forbidden.status}。`);

for(const w of warnings)console.warn('提醒：'+w);
if(problems.length){
 console.error('问答服务部署检查未通过：');
 for(const p of problems)console.error(' - '+p);
 process.exit(1);
}
console.log(`问答服务部署检查通过：${knowledge.length} 条知识，允许来源 ${origins.join(', ')}。`);
