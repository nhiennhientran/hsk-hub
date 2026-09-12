import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {JSDOM,VirtualConsole} from 'jsdom';

const read=p=>fs.readFileSync(p,'utf8');
const dataCtx={window:{}};vm.createContext(dataCtx);vm.runInContext(read('hsk4/data.js'),dataCtx,{filename:'hsk4/data.js'});
for(let i=11;i<=20;i++)vm.runInContext(read(`hsk4/data/${i}.js`),dataCtx,{filename:`hsk4/data/${i}.js`});
vm.runInContext(read('hsk4/content-audit.js'),dataCtx,{filename:'hsk4/content-audit.js'});
const data=dataCtx.window.HSK4_LOWER_LESSONS;
assert.equal(data.length,10);
assert.equal(data.reduce((n,L)=>n+L.vocab.length,0),311,'audited HSK4 Lower vocab total');
assert.equal(JSON.stringify(Array.from(data,x=>x.id)),JSON.stringify([11,12,13,14,15,16,17,18,19,20]));
for(const L of data){
  assert(L.title&&L.vn_title,`Bài ${L.id}: title`);
  assert.equal(new Set(L.vocab.map(v=>v.zh)).size,L.vocab.length,`Bài ${L.id}: duplicate vocab`);
  assert.equal(new Set(L.grammar.map(g=>g.title)).size,5,`Bài ${L.id}: duplicate grammar`);
  assert(L.vocab.length>=29,`Bài ${L.id}: vocab`);
  assert.equal(L.grammar.length,5,`Bài ${L.id}: grammar`);
  assert.equal(L.scenes.length,5,`Bài ${L.id}: texts`);
  assert(L.compare?.title&&L.expansion?.char&&L.culture?.title,`Bài ${L.id}: feature panels`);
  L.vocab.filter(v=>Array.from(v.zh).length===1).forEach(v=>assert(v.py,`Bài ${L.id}: isolated character ${v.zh} must have audited pinyin`));
}
console.log(`DATA PASS: 10 lessons, ${data.reduce((n,L)=>n+L.vocab.length,0)} vocab entries, 50 grammar points, 50 text units`);

const expectedTitles={
11:'读书好，读好书，好读书',12:'用心发现世界',13:'喝着茶看京剧',14:'保护地球母亲',15:'教育孩子的艺术',
16:'生活可以更美好。',17:'人与自然',18:'科技与世界',19:'生活的味道',20:'路上的风景'};
const expectedGrammar={
11:['连','否则','无论','然而','同时'],
12:['并且','再……也……','对于','名量词重叠','相反'],
13:['大概','偶尔','由','进行','随着'],
14:['够','以','既然','于是','什么的'],
15:['想起来','弄','千万','来','左右'],
16:['可','恐怕','到底','拿……来说','敢'],
17:['倒','干','趟','为了……而……','仍然'],
18:['是否','受不了','接着','除此以外','把……叫作……'],
19:['疑问代词活用表示任指','上','出来','总的来说','在于'],
20:['动词+着+动词+着','一……就……','究竟','起来','动词+起']};
const expectedCulture={
11:'中国古典文学名著——《西游记》',12:'孔子“因材施教”',13:'中国的筷子文化',14:'“天人合一”——中国人的“人与自然观”',15:'孟母三迁的故事',
16:'只要功夫深，铁杵磨成针',17:'中国国宝大熊猫',18:'微博与微信',19:'舌尖上的中国——饺子',20:'中国的少数民族'};
for(const L of data){
  assert.equal(L.title,expectedTitles[L.id]);
  assert.equal(JSON.stringify(Array.from(L.grammar,g=>g.title)),JSON.stringify(expectedGrammar[L.id]));
  assert.equal(L.culture.title,expectedCulture[L.id],`Bài ${L.id}: culture title`);
}
assert.match(data.find(L=>L.id===11).grammar.find(g=>g.title==='连').vn_title,/Giới từ/);
assert.match(data.find(L=>L.id===11).vocab.find(v=>v.zh==='之').vn,/trợ từ/);
assert.match(data.find(L=>L.id===14).grammar.find(g=>g.title==='够').vn_title,/phó từ/);
assert.equal(data.find(L=>L.id===16).vocab.find(v=>v.zh==='传真').vn,'gửi fax; gửi bằng fax');
assert.equal(data.find(L=>L.id===16).vocab.find(v=>v.zh==='推').vn,'hoãn; dời lại');
assert.equal(data.find(L=>L.id===17).vocab.find(v=>v.zh==='干').py,'gàn');
assert(!data.find(L=>L.id===18).vocab.find(v=>v.zh==='火').vn.includes('lửa'));
assert(!data.find(L=>L.id===20).vocab.find(v=>v.zh==='怪').vn.includes('lạ'));
assert.match(data.find(L=>L.id===20).scenes[4].points,/咸辣、香辣、酸辣/);
assert.equal(data.find(L=>L.id===16).vn_title,'Cuộc sống có thể tốt đẹp hơn.');
assert.equal(data.find(L=>L.id===13).vocab.find(v=>v.zh==='厚').vn,'sâu sắc; sâu đậm');
assert.equal(data.find(L=>L.id===14).vocab.find(v=>v.zh==='丢').vn,'vứt; ném');
assert.equal(data.find(L=>L.id===15).vocab.find(v=>v.zh==='骄傲').vn,'kiêu ngạo; tự mãn');
assert.equal(data.find(L=>L.id===18).vocab.find(v=>v.zh==='举').vn,'nêu; đưa ra (ví dụ)');
assert.equal(data.find(L=>L.id===18).vocab.find(v=>v.zh==='收').vn,'nhận');
assert.equal(data.find(L=>L.id===19).vocab.find(v=>v.zh==='功夫').vn,'võ công; kung fu');
assert.match(data.find(L=>L.id===20).vocab.find(v=>v.zh==='存').vn,/cất giữ/);
assert.match(data.find(L=>L.id===12).grammar.find(g=>g.title==='名量词重叠').structure,/人人/);
assert.match(data.find(L=>L.id===12).grammar.find(g=>g.title==='相反').vn_title,/Liên từ \/ tính từ/);
assert.match(data.find(L=>L.id===15).grammar.find(g=>g.title==='来').vn_title,/Động từ/);
assert.equal(data.find(L=>L.id===15).grammar.find(g=>g.title==='左右').vn_title,'Danh từ “左右”');
assert.equal(dataCtx.window.HSK4_LOWER_CONTENT_AUDIT?.version,'2026-08-14.3');
console.log('TEXTBOOK CONTENT AUDIT PASS: titles, language points, culture, target senses, polyphonic pinyin and corrected text focus');
assert(read('index.html').includes('hsk4/index.html'),'root portal must link HSK4 Lower');
assert(read('hsk4/index.html').includes('content-audit.js'),'HSK4 home must load content audit');
assert(read('hsk4/lesson.html').includes('content-audit.js'),'HSK4 lesson must load content audit');

function makeDom(file,url){
 const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e));
 const dom=new JSDOM(read(file),{url,runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
 const w=dom.window;w.HSK4_BOOT_DISABLE_AUTO=true;w.scrollTo=()=>{};w.confirm=()=>false;
 w.speechSynthesis={cancel(){},getVoices(){return[]},speak(){}};w.SpeechSynthesisUtterance=function(text){this.text=text};
 w.pinyinPro={pinyin:t=>Array.from(String(t))};
 return {dom,w,ctx:dom.getInternalVMContext(),errors};
}
function load(env){
 vm.runInContext(read('hsk4/data.js'),env.ctx,{filename:'hsk4/data.js'});
 for(let i=11;i<=20;i++)vm.runInContext(read(`hsk4/data/${i}.js`),env.ctx,{filename:`hsk4/data/${i}.js`});
 vm.runInContext(read('hsk4/runtime.js'),env.ctx,{filename:'hsk4/runtime.js'});
 vm.runInContext(read('hsk4/content-audit.js'),env.ctx,{filename:'hsk4/content-audit.js'});
 vm.runInContext(read('hsk4/modules.js'),env.ctx,{filename:'hsk4/modules.js'});
 // Production loads session-auth before practice.js; its HSK4 write guard prevents
 // the legacy duplicate document.write in practice.js from rewriting the page.
 vm.runInContext('document.write=()=>{}',env.ctx);
 vm.runInContext(read('hsk4/practice.js'),env.ctx,{filename:'hsk4/practice.js'});
 vm.runInContext('boot()',env.ctx);
}

{
 const env=makeDom('hsk4/index.html','https://example.test/hsk4/index.html');load(env);
 const d=env.w.document;
 assert.equal(d.documentElement.dataset.hsk4Runtime,'ok');
 assert.equal(d.querySelectorAll('#lessonGrid .lesson-card').length,10);
 assert.equal(d.querySelectorAll('#lessonGrid a[href*="lesson.html?id="]').length,70);
 assert(/^\d+$/.test(d.querySelector('#wordStat').textContent.trim()));
 assert(env.w.HSK4_LOWER_CONTENT_AUDIT?.corrected===true,'home: audit marker');
 env.dom.window.close();console.log('HOME PASS: 10 lesson cards + audited correction layer');
}
for(let id=11;id<=20;id++){
 const env=makeDom('hsk4/lesson.html',`https://example.test/hsk4/lesson.html?id=${id}&sec=vocab`);load(env);
 const d=env.w.document;
 assert.equal(d.documentElement.dataset.hsk4Runtime,'ok',`lesson ${id}: runtime`);
 assert(d.querySelector('#lessonTitle').textContent.trim(),`lesson ${id}: title`);
 assert.equal(d.querySelectorAll('#lessonSelect option').length,10,`lesson ${id}: chooser`);
 assert(d.querySelectorAll('#vocabGrid .vcard').length>=29,`lesson ${id}: vocab`);
 assert.equal(d.querySelectorAll('#sceneTabs .scene-tab').length,5,`lesson ${id}: texts`);
 assert.equal(d.querySelectorAll('#grammarList .grammar-card').length,5,`lesson ${id}: grammar`);
 assert(d.querySelector('#comparePanel').textContent.includes('比一比'),`lesson ${id}: compare`);
 assert(d.querySelector('#expansionPanel').textContent.includes('同字词'),`lesson ${id}: expansion`);
 assert(d.querySelector('#culturePanel').textContent.includes(expectedCulture[id]),`lesson ${id}: exact culture title`);
 assert(d.querySelectorAll('#hanziWordMap .hanzi-char-btn').length>0,`lesson ${id}: hanzi`);
 assert(d.querySelectorAll('#q-mc .qcard').length===8,`lesson ${id}: vocab quiz`);
 assert(d.querySelectorAll('#q-grammar .qcard').length===5,`lesson ${id}: grammar quiz`);
 assert(d.querySelectorAll('#q-read .qcard').length===5,`lesson ${id}: reading quiz`);
 assert(d.querySelectorAll('#advancedPractice .advanced-card').length===5,`lesson ${id}: advanced`);
 vm.runInContext('checkMC();checkFill();checkGrammarQuiz();checkReadQuiz();checkAdvanced()',env.ctx);
 for(const sec of ['vocab','text','grammar','hanzi','practice'])vm.runInContext(`showSection('${sec}',false)`,env.ctx);
 env.dom.window.close();
 console.log(`LESSON ${id} PASS`);
}
console.log('HSK4 LOWER AUDITED SMOKE TEST PASS');
