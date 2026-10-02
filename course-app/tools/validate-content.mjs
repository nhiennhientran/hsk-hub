import {readFileSync,readdirSync,existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const counts={2:15,3:18}, grammar={2:Array(15).fill(3),3:[3,3,3,3,4,3,4,4,3,3,4,4,3,3,4,4,4,4]};
const totals={lessons:0,words:0,texts:0,grammar:0,homework:0,listening:0,sections:0};
const seen=new Set(),questionSignatures=new Set(),issues=[],lessons=[];
const check=(condition,message)=>{if(!condition)issues.push(message)};
const text=v=>typeof v==='string'&&v.trim().length>0;
const copy=v=>v&&text(v.zh)&&text(v.vi);
for(const level of [2,3]){
 const dir=resolve(root,`content/hsk${level}`), files=existsSync(dir)?readdirSync(dir).filter(x=>/^lesson-\d\d.json$/.test(x)):[];
 if(!process.env.HSK_PILOT)check(files.length===counts[level],`HSK${level}: ${files.length}/${counts[level]} lessons`);
 for(const file of files){const l=JSON.parse(readFileSync(resolve(dir,file),'utf8')),tag=`HSK${level} lesson ${l.number}`,prefix=`hsk${level}-fltrp-2026:l${String(l.number).padStart(2,'0')}`;
 check(l.schemaVersion===1&&l.courseId===`hsk${level}-fltrp-2026`&&l.version==='2026.1'&&l.id===prefix,tag+' identity');check(copy(l.title)&&text(l.title.py),tag+' title');
 const source=s=>{check(s&&Number.isInteger(s.pdfPage)&&Number.isInteger(s.printedPage)&&s.pdfPage-s.printedPage===(level===2?15:12)&&text(s.section)&&['textbook','supplemental'].includes(s.provenance),tag+' source mapping')};
 const id=x=>{check(text(x.id)&&x.id.startsWith(prefix+':')&&!seen.has(x.id),tag+' duplicate or wrong id '+x.id);seen.add(x.id);source(x.source)};
 for(const key of ['objectives','warmup','texts','vocabulary','grammar','sections','homework','listening'])check(Array.isArray(l[key])&&l[key].length>0,tag+' missing '+key);
 if(issues.some(x=>x===tag+' missing texts'))continue;
 check(l.texts.length===4,tag+' 4 texts');check(l.grammar.length===grammar[level][l.number-1],tag+' grammar count');
 for(const o of l.objectives){id(o);check(copy(o),tag+' objective copy')}
 for(const w of l.warmup){id(w);check(copy(w.title)&&w.items.length>0,tag+' warmup')}
 for(const t of l.texts){id(t);check(t.audioTrack===`${l.number}-${2*t.number-1}`,tag+' text audio');check(copy(t.context)&&copy(t.title)&&t.lines.length>0,tag+' text');for(const line of t.lines){id(line);check(copy(line)&&text(line.py)&&text(line.speaker),tag+' line')}for(const q of t.questions??[])id(q)}
 for(const w of l.vocabulary){id(w);check(copy(w)&&text(w.py)&&text(w.pos)&&w.audioTrack===`${l.number}-${2*w.sourceText}`,tag+' word '+w.zh)}
 for(const g of l.grammar){id(g);check(copy(g.title)&&copy(g.explanation)&&text(g.structure)&&g.examples.length>0,tag+' grammar');for(const ex of [...g.examples,...g.practice]){source(ex.source);check(copy(ex),tag+' grammar example')}}
 for(const s of l.sections){id(s);check(copy(s.title)&&s.blocks.length>0,tag+' section');for(const b of s.blocks){source(b.source);check(copy(b),tag+' section block')}}
 for(const kind of ['practice','activity'])check(l.sections.some(s=>s.kind===kind),tag+' missing '+kind);
 if(l.number%3===0)check(l.sections.some(s=>s.kind==='review'),tag+' missing three-lesson review');
 check(l.homework.length===30,tag+' homework count');const distribution={vocabGrammar:10,ordering:5,listening:5,translationChoice:5,writing:5};
 for(const [part,n]of Object.entries(distribution))check(l.homework.filter(q=>q.part===part).length===n,tag+' '+part+' count');
 const stems=new Set();
 for(const q of [...l.homework,...l.listening]){id(q);check(copy(q.prompt)&&text(q.focus)&&q.source.provenance==='supplemental',tag+' question provenance');const signature=JSON.stringify([q.part,q.prompt,q.stem,q.options,q.tokens]);check(!stems.has(signature),tag+' duplicate question');stems.add(signature);check(!questionSignatures.has(signature),tag+' duplicate full question across course corpus');questionSignatures.add(signature);
 if(q.part==='writing'){check(!/\p{Script=Han}/u.test(q.focus),tag+' manual focus clue');for(const name of ['answer','solution','modelAnswer','explanation','tokens','options'])check(!(name in q),tag+' manual answer leak '+name)}
 else if(q.part==='ordering'){check(Array.isArray(q.tokens)&&q.tokens.length>=5&&Array.isArray(q.answer)&&q.answer.length===q.tokens.length&&new Set(q.answer).size===q.tokens.length&&q.answer.every(n=>Number.isInteger(n)&&n>=0&&n<q.tokens.length),tag+' ordering')}else check(Array.isArray(q.options)&&q.options.length>=3&&new Set(q.options).size===q.options.length&&Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.options.length,tag+' choice');
 if(q.part==='listening')check(new RegExp(`^${l.number}-[1357]$`).test(q.audioTrack),tag+' listening original track');
 }
 if(!process.env.HSK_PILOT)check(l.reviewStatus.sourceVisual&&l.reviewStatus.vietnamese&&l.reviewStatus.pinyin&&text(l.reviewStatus.reviewer)&&!l.reviewStatus.reviewer.includes('pending'),tag+' pending independent review');
 totals.lessons++;totals.words+=l.vocabulary.length;totals.texts+=l.texts.length;totals.grammar+=l.grammar.length;totals.homework+=l.homework.length;totals.listening+=l.listening.length;totals.sections+=l.sections.length;
 lessons.push({id:l.id,level,number:l.number,title:l.title,words:l.vocabulary.length,texts:l.texts.length,grammar:l.grammar.length,homework:l.homework.length,sha256:createHash('sha256').update(readFileSync(resolve(dir,file))).digest('hex')});
 }
}
const report={mode:process.env.HSK_PILOT?'pilot':'release',totals,lessons,issues};mkdirSync(resolve(root,'docs'),{recursive:true});writeFileSync(resolve(root,'docs/content-validation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(issues.length)process.exitCode=1;
