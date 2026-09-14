// A deliberately small Markdown subset; output is data rendered as React text, never HTML.
const cells=line=>line.trim().replace(/^\|/,'').replace(/\|$/,'').split('|').map(s=>s.trim()).slice(0,8);
const divider=line=>line.includes('|')&&cells(line).every(s=>/^:?-{3,}:?$/.test(s));
export function answerBlocks(text){
 const lines=String(text).split(/\r?\n/),blocks=[];
 for(let i=0;i<lines.length;){
  const line=lines[i];if(!line.trim()){i++;continue;}
  if(line.includes('|')&&i+1<lines.length&&divider(lines[i+1])){const header=cells(line),rows=[];i+=2;while(i<lines.length&&lines[i].includes('|')&&lines[i].trim()){const row=cells(lines[i++]);rows.push(header.map((_,n)=>row[n]||''));}blocks.push({type:'table',header,rows});continue;}
  const heading=line.match(/^#{1,6}\s+(.+)$/);if(heading){blocks.push({type:'heading',text:heading[1]});i++;continue;}
  if(/^\s*(?:[-*]|\d+[.)])\s+/.test(line)){const items=[];while(i<lines.length&&/^\s*(?:[-*]|\d+[.)])\s+/.test(lines[i]))items.push(lines[i++].replace(/^\s*(?:[-*]|\d+[.)])\s+/,''));blocks.push({type:'list',items});continue;}
  const paragraph=[line];i++;while(i<lines.length&&lines[i].trim()&&!/^#{1,6}\s|^\s*(?:[-*]|\d+[.)])\s+/.test(lines[i])&&!(lines[i].includes('|')&&i+1<lines.length&&divider(lines[i+1])))paragraph.push(lines[i++]);blocks.push({type:'paragraph',text:paragraph.join('\n')});
 }return blocks;
}
