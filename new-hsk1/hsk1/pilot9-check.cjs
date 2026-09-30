/* Run: node new-hsk1/hsk1/pilot9-check.cjs */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const bank=require('./pilot9-data.js'),E=require('./pilot9-engine.js');
let checks=0;
function check(name,fn){fn();checks++;console.log('PASS '+name);}
function answers(g){return Object.fromEntries(g.questions.map(q=>[q.id,q.type==='choice'?q.answer:q.type==='order'?q.tokens.map((_,i)=>i):q.accepted[0]]));}
check('exactly 6 groups, 30 unique questions, 5 ordering and 5 translation',()=>{
 assert.equal(bank.groups.length,6);assert(bank.groups.every(g=>g.questions.length===5));
 const qs=bank.groups.flatMap(g=>g.questions);assert.equal(new Set(qs.map(q=>q.id)).size,30);
 assert.equal(qs.filter(q=>q.type==='order').length,5);assert.equal(qs.filter(q=>q.type==='translation').length,5);
 for(const q of qs){assert(q.explain&&q.source.page>=61&&q.source.page<=67);if(q.options){assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);assert(q.options.includes(q.answer));}}
});
check('sequential unlock cannot be skipped, and incomplete submission does not unlock',()=>{
 const s=E.empty(bank);assert(!E.unlocked(bank,s,1));assert.equal(E.submit(bank,s,'translation').reason,'locked');
 E.groupState(s,'words').draft=answers(bank.groups[0]);delete s.groups.words.draft['9-w1'];
 assert.equal(E.submit(bank,s,'words').reason,'missing');assert(!E.unlocked(bank,s,1));
 s.groups.words.draft['9-w1']=bank.groups[0].questions[0].answer;assert(E.submit(bank,s,'words').ok);assert(E.unlocked(bank,s,1));assert(!E.unlocked(bank,s,2));
 assert.equal(E.submit(bank,s,'words').reason,'submitted');
});
check('all 30 answers score 30/30; refresh preserves completion and distinct histories',()=>{
 let s=E.empty(bank);for(const g of bank.groups){E.groupState(s,g.id).draft=answers(g);assert(E.submit(bank,s,g.id).ok);}
 assert.equal(E.totals(bank,s).correct,30);assert.equal(E.totals(bank,s).total,30);
 E.retry(s,'words');const g=bank.groups[0];s.groups.words.draft=Object.fromEntries(g.questions.map(q=>[q.id,q.options.find(x=>x!==q.answer)]));E.submit(bank,s,'words');
 assert.equal(E.totals(bank,s).correct,25);assert.equal(E.totals(bank,s,'first').correct,30);assert.equal(E.totals(bank,s,'best').correct,30);
 s=E.restore(bank,JSON.parse(JSON.stringify(s)));assert.equal(E.totals(bank,s).correct,25);assert.equal(s.groups.words.attemptCount,2);assert(E.unlocked(bank,s,5));
});
check('translation accepts alternate wording but never drops meaning words',()=>{
 const qs=bank.groups[5].questions;assert.equal(E.grade(qs[0],' 明天上午，我在学校学习！ ').status,'correct');
 assert.equal(E.grade(qs[4],'白天我在家看书').status,'correct');
 assert.equal(E.grade(qs[2],'这是我的两本中文书').status,'incorrect');
 assert.equal(E.grade(qs[0],'我明天上午在学校').status,'incorrect');
 assert.equal(E.grade(qs[0],'我将在明天上午于学校学习。').status,'review');
 assert.equal(E.grade(qs[0],'wǒ míngtiān').status,'missing');
 assert.equal(E.grade(qs[0],'<script>我</script>').status,'missing');
});
check('ordering requires every unique token and accepts time-first sentence',()=>{
 const q=bank.groups[4].questions[1];assert.equal(E.grade(q,[1,0,2,3,4]).status,'correct');
 assert.equal(E.grade(q,[0,2,1,3,4]).status,'incorrect');assert(!E.validAnswer(q,[0,0,2,3,4]));assert(!E.validAnswer(q,[0,1,2]));
});
check('pending translations are counted separately from wrong answers',()=>{
 const s=E.empty(bank);for(const g of bank.groups){E.groupState(s,g.id).draft=answers(g);if(g.id==='translation')s.groups[g.id].draft['9-t1']='我将在明天上午于学校学习。';assert(E.submit(bank,s,g.id).ok);}
 const t=E.totals(bank,s);assert.equal(t.correct,29);assert.equal(t.review,1);assert.equal(t.incorrect,0);assert.equal(t.total,30);
});
check('import recomputes scores, ignores illegal locks and rejects foreign data',()=>{
 const s=E.empty(bank);E.groupState(s,'words').draft=answers(bank.groups[0]);E.submit(bank,s,'words');s.groups.words.attempts[0].correct=999;
 const clean=E.restore(bank,s);assert.equal(clean.groups.words.attempts[0].correct,5);
 const fake=E.empty(bank);fake.groups.translation={attempts:[{answers:answers(bank.groups[5])}],editing:false};assert.equal(E.restore(bank,fake).groups.translation,undefined);
 assert.throws(()=>E.restore(bank,{...s,bankVersion:'wrong'}));
});
check('Lesson 9 vocabulary is corrected; other lessons remain byte-equivalent in data',()=>{
 const ctx=vm.createContext({window:{}});for(const f of ['new-data.js','new-enrichment.js','textbook-data-corrections.js','pos-tips.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,f),'utf8'),ctx);
 const others=JSON.stringify(ctx.window.HSK1_LESSONS.filter(l=>l.id!==9));vm.runInContext(fs.readFileSync(path.join(__dirname,'pilot9-data.js'),'utf8'),ctx);
 assert.equal(JSON.stringify(ctx.window.HSK1_LESSONS.filter(l=>l.id!==9)),others);
 const l=ctx.window.HSK1_LESSONS.find(l=>l.id===9);assert.equal(l.vocab.length,23);assert(l.vocab.some(w=>w.zh==='白天'));assert(l.vocab.find(w=>w.zh==='家').vn.includes('lượng từ'));
 const original=ctx.window.HSK1_LESSONS.filter(l=>[7,8,9].includes(l.id)).flatMap(l=>l.vocab);const merged=E.mergedWords(ctx.window.HSK1_LESSONS,[7,8,9]);assert(merged.length<=original.length);assert(merged.every(w=>w.lessons.every(i=>[7,8,9].includes(i))));
 const senses=E.mergedWords([{id:1,vocab:[{zh:'家',py:'jiā',vn:'nhà'}]},{id:9,vocab:[{zh:'家',py:'jiā',vn:'lượng từ'}]}],[1,9]);assert.equal(senses.length,2);
});
check('all listening intervals match official timing and original MP3 bytes',()=>{
 const ctx=vm.createContext({window:{}});vm.runInContext(fs.readFileSync(path.join(__dirname,'textbook-audio-segments.js'),'utf8'),ctx);
 const timings=ctx.window.HSK1_OFFICIAL_SEGMENTS.text;
 const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'textbook-audio-manifest.json'),'utf8'));
 for(const q of bank.groups[2].questions){const a=q.audio,id=a.file.replace('.mp3','');const file=path.join(__dirname,'audio',a.file);assert(fs.existsSync(file));
  const m=manifest.entries.find(x=>x.id===id);assert(a.start>=0&&a.end>a.start&&a.end<m.duration_s+0.02);
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),m.sha256);
  const first=timings[id].some(r=>r[0]===a.start),last=timings[id].some(r=>r[1]===a.end);assert(first&&last, q.id+' is not aligned to approved segment data');
 }
});
check('word review uses adjustable 1,3,7,14-day intervals',()=>{
 const s=E.empty(bank),now=1000000;for(const days of [1,3,7,14]){E.markWord(s,'a',true,now);assert.equal(s.words.a.due,now+days*86400000);}E.markWord(s,'a',false,now);assert.equal(s.words.a.due,now);assert.equal(s.words.a.step,0);
});
console.log(JSON.stringify({passed:checks,questions:30,groups:6}));
