import test from 'node:test';
import assert from 'node:assert/strict';
let module;try{module=await import('../src/answer-format.mjs');}catch(error){if(error.code!=='ERR_MODULE_NOT_FOUND')throw error;}
const parse=text=>{assert.equal(typeof module?.answerBlocks,'function','safe answer formatting must exist');return module.answerBlocks(text);};
test('recognizes teaching tables, headings, lists and text without executing or linking model HTML',()=>{
 const blocks=parse('## 利润比较\n\n| 方案 | 利润 |\n| --- | ---: |\n| 日常 | **30000** |\n| 促销 | 12000 |\n\n- 检查成本\n- 核实库存\n\n<script>alert(1)</script>\n[资料](https://evil.invalid)');
 assert.equal(blocks[0].type,'heading');assert.deepEqual(blocks[1].header,['方案','利润']);assert.equal(blocks[1].rows.length,2);assert.equal(blocks[2].type,'list');assert.match(blocks[3].text,/<script>/);
});
test('keeps incomplete or malformed tables readable and bounds columns',()=>{
 assert.equal(parse('单价 | 收入\n这不是分隔行')[0].type,'paragraph');
 const table=parse('| '+Array(20).fill('列').join(' | ')+' |\n| '+Array(20).fill('---').join(' | ')+' |\n| '+Array(20).fill('值').join(' | ')+' |')[0];assert.ok(table.header.length<=8);assert.ok(table.rows[0].length<=8);
});
