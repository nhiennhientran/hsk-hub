import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {currentViLesson} from './unified/official-vi-expectations.ts';
import {appendReviewedTranslationChoices,validateTranslationChoiceOverlay} from '../src/translation-choice-overlay.ts';
import {applyTeachingClarifications,validateTeachingClarifications} from '../src/teaching-clarifications.ts';
const read=file=>readFileSync(new URL(file,import.meta.url),'utf8'),sha=s=>createHash('sha256').update(s).digest('hex');
const raw=read('../content/teaching-clarifications-20261006.json'),overlay=await validateTeachingClarifications(raw);
const d=await validateTranslationChoiceOverlay(read('../content/translation-choice-distractors-20261006.json'),read('../docs/final-quality-20261006/qa/abcd-distractor-independent-review.json'));
function lesson(e){const text=read('../../'+e.sourceFile),source=JSON.parse(text);return {text,source,projected:appendReviewedTranslationChoices(currentViLesson(source),d)};}
test('all seven independently reviewed clarifications change only the intended displayed field',()=>{
 for(const e of overlay.entries){const f=lesson(e),before=structuredClone(f.projected),after=applyTeachingClarifications(before,e.sourceFile,sha(f.text),overlay);
  const list=e.kind==='grammar'?'grammar':'homework',item=after[list].find(x=>x.id===e.id);assert.deepEqual(item[e.field],e.newValue);
  for(const changed of overlay.entries.filter(x=>x.sourceFile===e.sourceFile)){const a=after[changed.kind==='grammar'?'grammar':'homework'].find(x=>x.id===changed.id);a[changed.field]=changed.expectedValue;}
  assert.deepEqual(after,before);assert.deepEqual(f.source,JSON.parse(f.text));
 }
});
test('changed projected wording, source bytes or answer keys cannot receive the old review',()=>{
 for(const e of overlay.entries){const f=lesson(e);
  assert.throws(()=>applyTeachingClarifications(f.projected,e.sourceFile,'f'.repeat(64),overlay),/source changed/);
  const item=f.projected[e.kind==='grammar'?'grammar':'homework'].find(x=>x.id===e.id);item[e.field].vi+=' changed';
  assert.throws(()=>applyTeachingClarifications(f.projected,e.sourceFile,sha(f.text),overlay),/baseline changed/);
 }
 const e=overlay.entries.find(x=>x.kind==='homework'),f=lesson(e);f.projected.homework.find(x=>x.id===e.id).answer=99;
 assert.throws(()=>applyTeachingClarifications(f.projected,e.sourceFile,sha(f.text),overlay),/baseline changed/);
});
test('changing one accepted bilingual replacement invalidates the exact reviewed vector',async()=>{const m=JSON.parse(raw);m.entries[0].newValue.vi='A different translation';await assert.rejects(validateTeachingClarifications(JSON.stringify(m)),/审查不匹配/);});
