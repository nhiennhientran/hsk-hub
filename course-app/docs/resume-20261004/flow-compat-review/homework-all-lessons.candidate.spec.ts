import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import legacy from '../../../../hsk1-app/src/domain/homework/engine.js';
import {allReadingCompletedFixture} from '../../../tests/final-quality/unlocked-fixtures.ts';
import {currentViLesson} from '../../../tests/unified/official-vi-expectations.ts';
import {appendReviewedTranslationChoices,validateTranslationChoiceOverlay} from '../../../src/translation-choice-overlay.ts';
const unlocked=allReadingCompletedFixture();
const overlay=validateTranslationChoiceOverlay(readFileSync(new URL('../../../content/translation-choice-distractors-20261006.json',import.meta.url),'utf8'),readFileSync(new URL('../../final-quality-20261006/qa/abcd-distractor-independent-review.json',import.meta.url),'utf8'));
const bank1=JSON.parse(readFileSync(new URL('../../../../hsk1-app/content/homework30-bank.json',import.meta.url),'utf8')).lessons;
const mappedParts=[['vocabGrammar','choice'],['ordering','sort'],['listening','listening'],['translationChoice','translationChoice'],['writing','translation']] as const;
const oldBytes={'hsk2_ranteacher_progress_v1':' {"15":{"score":7}} ','hsk3_ranteacher_progress_v1':' {"20":{"score":8}} ','hsk4_upper_ranteacher_progress_v1':' {"1":{"complete":true}} ','hsk4_lower_ranteacher_progress_v1':' {"20":{"complete":true}} '};
test.beforeEach(async({page})=>page.addInitScript(({old,fixtures})=>{
 sessionStorage.setItem('hsk_portal_unlocked_v2','1');
 for(const [k,v]of Object.entries(old))if(localStorage.getItem(k)===null)localStorage.setItem(k,v);
 for(const [k,v]of Object.entries(fixtures))if(localStorage.getItem(k)===null)localStorage.setItem(k,v);
},{old:oldBytes,fixtures:unlocked}));
function ordered(q:any):number[]{
 const target=legacy.normal(q.answers[0]);
 const walk=(indices:number[],remaining:string):number[]|null=>{
  if(indices.length===q.tokens.length)return remaining?null:indices;
  for(let i=0;i<q.tokens.length;i++)if(!indices.includes(i)){
   const token=legacy.normal(q.tokens[i]);if(remaining.startsWith(token)){const found=walk([...indices,i],remaining.slice(token.length));if(found)return found;}
  }return null;
 };
 const result=walk([],target);if(!result)throw Error('Invalid sort fixture: '+q.id);return result;
}
for(const [level,number] of [...Array.from({length:15},(_,i)=>[1,i+1]),...Array.from({length:15},(_,i)=>[2,i+1]),...Array.from({length:18},(_,i)=>[3,i+1])])test(`actual unified HSK${level} lesson ${number} all five homework parts persist exact isolated receipts`,async({page})=>{
 const source=level===1?bank1.find((l:any)=>l.lesson===number):appendReviewedTranslationChoices(currentViLesson(JSON.parse(readFileSync(new URL(`../../../content/hsk${level}/lesson-${String(number).padStart(2,'0')}.json`,import.meta.url),'utf8'))),await overlay);
 for(const [part,hsk1part]of mappedParts){
  await page.goto(`/#view=homework&level=${level}&lesson=${number}&part=${part}&version=30-v1`);
  const questions=level===1?source[hsk1part]:source.homework.filter((q:any)=>q.part===part);
  if(level===1){
   await expect(page.locator('#module-host')).toHaveAttribute('data-state','ready');
   await expect(page.locator(`[data-homework-part="${hsk1part}"]`)).toHaveAttribute('aria-current','page');
   await expect(page.locator('[data-question-id]')).toHaveCount(questions.length);
  }else await expect(page.locator('#assignment fieldset')).toHaveCount(questions.length);
  for(const [index,q]of questions.entries()){
   if(level===1){
    if(q.kind==='sort')for(const n of ordered(q))await page.locator(`[data-sort-add="${q.id}"][data-token-index="${n}"]`).click();
    else if(q.kind==='translation')await page.locator(`textarea[data-answer-id="${q.id}"]`).fill(`  独立写作 ${number}-${index}\n第二行  `);
    else await page.locator(`input[data-answer-id="${q.id}"][value="${q.answer}"]`).check();
   }else{
    const field=page.locator(`[data-question-id="${q.id}"]`);
    if(part==='writing')await field.locator('textarea').fill(`  独立写作 ${number}-${index}\n第二行  `);
    else if(part==='ordering')for(const n of q.answer)await field.locator('.ordering-tokens button').nth(n).click();
    else await field.locator(`input[value="${q.answer}"]`).check();
   }
  }
  if(level===1){
   await page.locator('#submit-homework').click();
   await expect(page.locator('#homework-save-status')).toHaveAttribute('data-state','saved');
   await expect(page.locator('#homework-result')).toBeVisible();
  }else{
   await page.locator('#assignment button[type=submit]').click();
   await expect(page.locator('.save-status')).toHaveAttribute('data-status','saved');
   await expect(page.locator('#receipt')).toContainText(part==='writing'?'等待老师查看':`${questions.length}/${questions.length}`);
  }
 }
 await page.reload();
 const data=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).data,level===1?'ran_hsk1_modular_v1':`ran_hsk${level}_fltrp_2026_v1`);
 if(level===1){
  const records=data.homework30.lessons[String(number)];expect(Object.keys(records).sort()).toEqual(mappedParts.map(p=>p[1]).sort());
  for(const [,part]of mappedParts){const r=records[part];expect(r.first).toEqual(r.latest);expect(r.history).toHaveLength(1);expect(r.latest.questionFingerprints).toEqual(Object.fromEntries(source[part].map((q:any)=>[q.id,q.fingerprint])));expect(r.latest.correct).toBe(part==='translation'?null:source[part].length);}
  expect(records.translation.latest.answers[source.translation[0].id]).toBe(`  独立写作 ${number}-0\n第二行  `);
 }else{
  const prefix=`hsk${level}-fltrp-2026:l${String(number).padStart(2,'0')}:`;
  const records=Object.entries(data.homework).filter(([key])=>key.startsWith(prefix));expect(records).toHaveLength(5);
  for(const [part]of mappedParts){const r=data.homework[prefix+part];expect(r.first).toEqual(r.latest);expect(r.submissions).toBe(1);expect(r.latest.questions).toEqual(source.homework.filter((q:any)=>q.part===part));expect(r.latest.correct).toBe(part==='writing'?null:r.latest.total);}
  expect(data.homework[prefix+'writing'].latest.answers[source.homework.find((q:any)=>q.part==='writing').id]).toBe(`  独立写作 ${number}-0\n第二行  `);
 }
 expect(await page.evaluate(keys=>Object.fromEntries(keys.map(key=>[key,localStorage.getItem(key)])),Object.keys(oldBytes))).toEqual(oldBytes);
});
