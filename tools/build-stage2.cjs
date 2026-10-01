'use strict';
// Assemble the reviewed student-only bank and a deterministic offline workbook.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const source=path.join(root,'new-hsk1/hsk1/stage2');
const output=process.argv[2]?path.resolve(process.argv[2]):path.join(root,'dist/stage2');
const files=['bank-01-05.json','bank-06-10.json','bank-11-15.json'];
const bank=files.flatMap(file=>JSON.parse(fs.readFileSync(path.join(source,'question-bank',file),'utf8')));
const pilot=require('../new-hsk1/hsk1/stage1/sample-bank.js')[0];
assert.deepEqual(bank.map(row=>row.id),Array.from({length:15},(_,i)=>i+1),'Expected all 15 lessons in order.');
assert.deepEqual(bank.find(row=>row.id===3),pilot,'The approved Lesson 3 sample must stay unchanged.');
const ids=new Set();
for(const lesson of bank){
  for(const kind of ['choice','sort','translation']){
    assert.equal(lesson[kind].length,5,`Lesson ${lesson.id} ${kind} must contain five items.`);
    for(const q of lesson[kind]){
      assert.equal(q.kind,kind);
      assert.ok(!ids.has(q.id),`Duplicate question ID: ${q.id}`);ids.add(q.id);
      assert.equal(q.assessment,kind==='translation'?'manual':'automatic');
      assert.ok(q.source&&q.source.label&&q.source.printPages.length&&q.source.pdfPages.length,`Missing evidence: ${q.id}`);
      if(kind==='translation'){
        for(const field of ['answer','answers','options','reference','referenceAnswer','explanation','optionFeedback','score']) assert.ok(!(field in q),`Teacher-only field in student translation: ${q.id}.${field}`);
      }
    }
  }
}
fs.mkdirSync(output,{recursive:true});
const bankSource=`/* Generated from the three reviewed question-bank JSON files. */\n(function(root,factory){'use strict';const bank=factory();if(typeof module==='object'&&module.exports)module.exports=bank;if(root){root.HSKStep2Bank=bank;root.HSKStep2BankVersion='stage2-20261001';}})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';return ${JSON.stringify(bank,null,2)};});\n`;
fs.writeFileSync(path.join(source,'bank.js'),bankSource);
let html=fs.readFileSync(path.join(source,'index.html'),'utf8');
for(const href of ['../learning.css','styles.css']){
  const css=fs.readFileSync(path.resolve(source,href),'utf8').replace(/^@charset[^;]+;/,'');
  html=html.replace(`<link rel="stylesheet" href="${href}">`,`<style>\n${css}\n</style>`);
}
for(const file of ['bank.js','engine.js','app.js']){
  const js=fs.readFileSync(path.join(source,file),'utf8');
  if(/<\/script/i.test(js))throw new Error(`Unsafe inline closing tag in ${file}`);
  html=html.replace(`<script src="${file}"></script>`,`<script>\n${js}\n</script>`);
}
assert.ok(!/<script[^>]+src=|<link[^>]+rel="stylesheet"/i.test(html),'Offline workbook still has external scripts or styles.');
const target=path.join(output,'HSK1-Step2-All15Lessons.html');
fs.writeFileSync(target,html);
const digest=data=>crypto.createHash('sha256').update(data).digest('hex');
const manifest={version:'stage2-20261001',lessons:15,questions:ids.size,automatic:150,manual:75,
  studentFile:'HSK1-Step2-All15Lessons.html',bytes:Buffer.byteLength(html),sha256:digest(html),
  sources:files.map(file=>({file:`new-hsk1/hsk1/stage2/question-bank/${file}`,sha256:digest(fs.readFileSync(path.join(source,'question-bank',file)))}))};
fs.writeFileSync(path.join(output,'build-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({file:target,...manifest}));
