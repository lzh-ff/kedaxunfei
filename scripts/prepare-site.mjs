import {cp,mkdir,writeFile} from 'node:fs/promises';
await mkdir('web/out',{recursive:true});
for(const dir of ['docs','licenses'])await cp(dir,`web/out/${dir}`,{recursive:true});
await writeFile('web/out/.nojekyll','');
console.log('Static export includes documentation and open-source notices.');
