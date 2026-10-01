'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve('new-hsk1/hsk1'),s={window:{},console,location:{search:'',href:'http://localhost/lesson.html?id=9'}};
for(const name of ['new-data.js','new-enrichment.js','pos-tips.js','textbook-data-corrections.js','textbook-audio-segments.js','textbook-integration-corrections.js','stage3/catalog.js','stage3/media-index.js','textbook-final-corrections.js'])vm.runInNewContext(fs.readFileSync(path.join(root,name),'utf8'),s);
const C=JSON.parse(JSON.stringify(s.window.HSKStep3Catalog)),B=require(path.join(root,'stage2/bank.js')),E=require(path.join(root,'stage2/engine.js')),E3=require(path.join(root,'stage3/engine.js'));
const results={checkedAt:new Date().toISOString(),items:[],media:[],sortVariants:[],badOrders:[]};
function order(q,target){const tokens=q.tokens.map(E.normal),goal=E.normal(target);function walk(left,out,text){if(!left.length)return text===goal?out:null;for(const i of left){const next=text+tokens[i];if(goal.startsWith(next)){const v=walk(left.filter(x=>x!==i),out.concat(i),next);if(v)return v;}}return null;}return walk(tokens.map((_,i)=>i),[],'');}
test('Final corpus has 300 unique tasks, 344 senses, 319 forms, and 342 textbook course entries',()=>{
 const tasks=B.flatMap(l=>['choice','sort','translation'].flatMap(k=>l[k]));tasks.push(...C.listening);assert.equal(tasks.length,300);assert.equal(new Set(tasks.map(q=>q.id)).size,300);
 for(let l=1;l<=15;l++){for(const k of ['choice','sort','translation'])assert.equal(B[l-1][k].length,5);assert.equal(C.listening.filter(q=>q.lesson===l).length,5);}
 assert.equal(C.vocabulary.length,344);assert.equal(new Set(C.vocabulary.map(v=>v.zh)).size,319);assert.equal(s.window.HSK1_LESSONS.reduce((n,l)=>n+l.vocab.length,0),342);
 results.items=tasks.map(q=>({id:q.id,kind:q.kind||'listening',source:q.source}));
});
test('Every registered sorting variant passes and one explicitly wrong permutation per question is rejected',()=>{
 for(const q of B.flatMap(l=>l.sort)){
  for(const answer of q.answers){const o=order(q,answer);assert.ok(o,q.id+': '+answer);assert.equal(E.check(q,o),true);results.sortVariants.push({id:q.id,answer,order:o});}
  const good=order(q,q.answers[0]);let bad;
  for(let i=0;i<good.length&&!bad;i++)for(let j=i+1;j<good.length&&!bad;j++){const p=good.slice();[p[i],p[j]]=[p[j],p[i]];if(!E.check(q,p))bad=p;}
  assert.ok(bad,'No rejected permutation found '+q.id);results.badOrders.push({id:q.id,order:bad});
 }
 assert.equal(results.sortVariants.length,95);assert.equal(results.badOrders.length,75);
});
test('All four options of each objective choice and listening item have one correct source answer',()=>{
 for(const q of B.flatMap(l=>l.choice)){assert.equal(q.options.length,4);for(let i=0;i<4;i++)assert.equal(E.check(q,i),i===q.answer,q.id);}
 for(const q of C.listening){assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);assert.equal(q.optionFeedback.length,4);assert.ok(q.audio.start>=0&&q.audio.end>q.audio.start);for(let i=0;i<4;i++){const st=E3.blank();E3.createListeningSession(st,C,{lessons:[q.lesson],mode:'all',shuffle:false},0);while(st.listening.session.questionIds[st.listening.session.position]!==q.id){const other=C.listening.find(x=>x.id===st.listening.session.questionIds[st.listening.session.position]);E3.selectListening(st,C,other.id,other.answer,1);E3.submitListening(st,C,2);E3.nextListening(st,3);}E3.selectListening(st,C,q.id,i,4);assert.equal(E3.submitListening(st,C,5).correct,i===q.answer);}}
});
test('All 405 original-derived embedded clips match their actual bytes and index; 14 number records have no invented audio',()=>{
 for(let l=1;l<=15;l++)vm.runInNewContext(fs.readFileSync(path.join(root,`stage3/media/lesson-${String(l).padStart(2,'0')}.js`),'utf8'),s);
 const media=s.window.HSKStep3Media,idx=s.window.HSKStep3MediaIndex.clips;assert.equal(Object.keys(idx).length,405);assert.equal(C.vocabulary.filter(v=>!v.audio).length,14);
 for(const [id,entry] of Object.entries(idx)){assert.ok(/^data:audio\/.+;base64,/.test(media[id]));const bytes=Buffer.from(media[id].split(',')[1],'base64'),hash=crypto.createHash('sha256').update(bytes).digest('hex');assert.equal(hash,entry.sha256,id);assert.equal(bytes.length,entry.bytes,id);results.media.push({id,sha256:hash,bytes:bytes.length,duration:entry.duration});}
});
test('Final original-page vocabulary and audio indexes retain reviewed source identities without mutating the learning corpus',()=>{
 for(const L of s.window.HSK1_LESSONS.filter(l=>l.id>=9)){for(const v of C.vocabulary.filter(v=>v.lesson===L.id)){const real=L.vocab.find(x=>x.zh===v.zh);assert.ok(real);assert.ok(real.sourceSenseIds.includes(v.senseId));assert.ok(real.vn.includes(v.vi));}}
 assert.deepEqual(JSON.parse(JSON.stringify(s.window.HSK1_OFFICIAL_SEGMENTS.text['14-3'])),[[2.95,7.45],[7.6,9.55],[9.6,12.15],[12.2,22.15],[22.15,25.427]]);
 fs.mkdirSync('tools/tests/results',{recursive:true});fs.writeFileSync('tools/tests/results/integration-final-data.json',JSON.stringify(results,null,2));
});
