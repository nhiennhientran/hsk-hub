import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'../..');
const ledger=JSON.parse(fs.readFileSync(path.join(root,'docs/textbook-page-coverage-ledger.json')));
if(ledger.schemaVersion===2){ledger.entries=ledger.shards.flatMap(shard=>{const bytes=fs.readFileSync(path.join(root,'docs',shard.path));assert.equal(createHash('sha256').update(bytes).digest('hex'),shard.sha256);const data=JSON.parse(bytes);assert.equal(data.entries.length,shard.pages);return data.entries}).sort((a,b)=>a.documentId.localeCompare(b.documentId)||a.pdfPage-b.pdfPage)}
const expected={'hsk2-textbook':162,'hsk3-textbook':212,'hsk2-answers':21,'hsk3-answers':27};
assert.equal(ledger.entries.length,422);
for(const [doc,count] of Object.entries(expected)){const es=ledger.entries.filter(e=>e.documentId===doc);assert.equal(es.length,count);assert.deepEqual(es.map(e=>e.pdfPage),Array.from({length:count},(_,i)=>i+1));}
const ids=new Set();const totals={activities:0,fields:0,official:0,reference:0,open:0,illustrations:0,textQuestions:0,homework:0};
for(const level of [2,3]){
 const rel=`course-app/content/hsk${level}/lesson-01.json`,l=JSON.parse(fs.readFileSync(path.join(root,`content/hsk${level}/lesson-01.json`)));
 const base=JSON.parse(execFileSync('git',['show','437b658:'+rel],{cwd:path.dirname(root),encoding:'utf8'}));
 for(const key of ['title','source','objectives','warmup','texts','grammar','sections','homework','listening'])assert.deepEqual(l[key],base[key],`${level} preserves existing ${key}`);
 assert.equal(l.homework.length,30);totals.homework+=l.homework.length;
 assert.equal(l.vocabulary.length,base.vocabulary.length);l.vocabulary.forEach((w,i)=>{const {supplementarySyllabus,appendixSource,...old}=w;assert.deepEqual(old,base.vocabulary[i]);assert.equal(typeof supplementarySyllabus,'boolean');assert(appendixSource.pdfPage>l.source.endPdfPage)});
 const images=new Map(l.illustrationManifest.map(x=>[x.id,x]));const qids=l.texts.flatMap(t=>t.questions.map(q=>q.id));const mapped=[];
 for(const a of l.activities){assert(!ids.has(a.id));ids.add(a.id);totals.activities++;assert.equal(a.origin,'textbook');assert(a.source.pdfPage>=l.source.startPdfPage&&a.source.pdfPage<=l.source.endPdfPage);
  for(const f of a.fields){assert(!ids.has(f.id));ids.add(f.id);totals.fields++;totals[f.assessment]++;assert(f.prompt.zh&&f.prompt.vi);if(f.targetRef)mapped.push(f.targetRef);
   if(f.assessment==='official'){assert(f.answerSource&&f.answerSource.document===`hsk${level}-answers`);assert([1,2].includes(f.answerSource.pdfPage));assert(f.options.some(o=>o.zh===f.answer));assert(!f.referenceAnswer)}
   else {assert(!('answer' in f));if(f.assessment==='reference')assert(f.referenceAnswer.zh&&f.referenceAnswer.vi);else assert(!f.referenceAnswer)}
   if(f.illustrationId)assert(images.has(f.illustrationId));
  }
  for(const id of a.illustrationIds??[])assert(images.has(id));
 }
 assert.deepEqual(mapped.sort(),qids.sort());totals.textQuestions+=qids.length;
 for(const m of l.illustrationManifest){totals.illustrations++;assert.equal(m.originalTextbookImage,false);assert.equal(m.publicationStatus,'approved');const svg=fs.readFileSync(path.join(root,'public',m.file));assert.equal(createHash('sha256').update(svg).digest('hex'),m.assetSha256);assert(!/<image\b|<script\b|https?:\/\//.test(svg.toString().replace('http://www.w3.org/2000/svg','')));assert.equal(m.authorVisualReview.independentReview,'pending');}
 assert.equal(l.coverageReview.independentReview,'pending');
}
assert.deepEqual(totals,{activities:51,fields:111,official:43,reference:53,open:15,illustrations:26,textQuestions:36,homework:60});
console.log(JSON.stringify({status:'passed',scope:'Pilot structure, source bindings, asset integrity and unchanged baseline content; not independent linguistic or browser review.',totals},null,2));
