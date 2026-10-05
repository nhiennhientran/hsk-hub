import {test,expect,type Page} from '@playwright/test';
import raw2 from '../../content/hsk2/lesson-02.json' with {type:'json'};
import raw3 from '../../content/hsk3/lesson-10.json' with {type:'json'};
import {configs} from '../../src/config.ts';
import {blank,grade,recordAttempt,type State} from '../../src/state.ts';
import type {Lesson,Question} from '../../src/types.ts';
import {currentViLesson} from './official-vi-expectations.ts';

// Synthetic older display snapshots exercise history ownership, not official VI acceptance.
const lessons={2:currentViLesson(raw2 as unknown as Lesson),3:currentViLesson(raw3 as unknown as Lesson)};
function earlierQuestion(current:Question):Question{
 const old=structuredClone(current);old.prompt.vi='SYNTHETIC earlier saved question — not textbook text';
 old.explanation={zh:current.explanation?.zh??current.prompt.zh,vi:'SYNTHETIC earlier saved explanation — not textbook text'};return old;
}
async function seed(page:Page,level:2|3,data:State){
 const config=configs[level];
 await page.addInitScript(({key,app,data})=>{
  sessionStorage.setItem('hsk_portal_unlocked_v2','1');
  if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({app,schema:1,revision:7,updatedAt:1000,data,recovery:null}));
 },{key:config.storageKey,app:config.id,data});
}
async function stored(page:Page,level:2|3):Promise<State>{
 return page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).data,configs[level].storageKey);
}
for(const level of [2,3] as const)for(const snapshot of ['saved','missing'] as const){
 test(`HSK${level} listening ${snapshot} snapshot keeps saved answers/score and separates current transcript`,async({page})=>{
  const lesson=lessons[level],current=lesson.listening[0]!,old=earlierQuestion(current),answer=old.answer as number;
  const attempt=grade([old],{[old.id]:answer},1000,{name:'Earlier learner',className:'Earlier class'});
  if(snapshot==='missing')delete attempt.questions;
  const initial=blank(configs[level]);
  initial.listeningRound={selected:[lesson.number],limit:5,wrongOnly:false,queue:[current.id],index:0,
   answers:{[current.id]:(answer+1)%current.options!.length},submitted:{[current.id]:attempt},playCounts:{},startedAt:1000};
  await seed(page,level,initial);await page.goto(`/#view=listening&level=${level}`);
  const card=page.locator('.listening-module .activity-card');await expect(card).toHaveAttribute('data-question-snapshot',snapshot);
  const reference=card.locator('[data-current-transcript-reference="true"]');
  await expect(reference).toContainText('不是历史题目快照');await expect(reference).toContainText('không phải ảnh chụp câu hỏi cũ');
  const currentText=lesson.texts.find(t=>t.audioTrack===current.audioTrack)!;
  await expect(reference).toContainText(currentText.lines[0]!.vi);
  if(snapshot==='saved'){
   await expect(card.locator('h2')).toContainText(old.prompt.vi);await expect(card.locator('.activity-feedback')).toContainText(old.explanation!.vi);
   await expect(card.locator('h2')).not.toContainText(current.prompt.vi);
   await expect(card.locator(`input[type="radio"][value="${answer}"]`)).toBeChecked();
   for(const radio of await card.locator('input[type="radio"]').all())await expect(radio).toBeDisabled();
  }else{
   await expect(card.locator('[data-missing-question-snapshot="true"]')).toContainText('旧记录没有当时题目快照');
   await expect(card.locator('.submitted-answer')).toHaveText(`${current.id}: ${JSON.stringify(attempt.answers[current.id])}`);
   await expect(card.locator('.activity-feedback')).toContainText(`${attempt.correct}/${attempt.total}`);
   await expect(card.locator('fieldset,input[type="radio"]')).toHaveCount(0);
   await expect(card.getByRole('button',{name:'提交本题'})).toHaveCount(0);
   await expect(card.locator('h2')).not.toContainText(current.prompt.vi);
  }
  expect(await stored(page,level)).toEqual(initial);await page.reload();await expect(card).toHaveAttribute('data-question-snapshot',snapshot);
  expect((await stored(page,level)).listeningRound!.submitted[current.id]).toEqual(attempt);
 });
 test(`HSK${level} homework ${snapshot} first receipt stays original while latest uses its own saved snapshot`,async({page})=>{
  const lesson=lessons[level],current=lesson.homework.find(q=>q.part==='vocabGrammar')!,old=earlierQuestion(current),initial=blank(configs[level]);
  const first=grade([old],{[old.id]:old.answer!},1000,{name:'Earlier learner',className:'Earlier class'});
  if(snapshot==='missing')delete first.questions;
  const latest=grade([current],{[current.id]:current.answer!},2000,{name:'Current learner',className:'Current class'}),key=lesson.id+':vocabGrammar';
  recordAttempt(initial,key,first);recordAttempt(initial,key,latest);await seed(page,level,initial);
  await page.goto(`/#view=homework&level=${level}&lesson=${lesson.number}&part=vocabGrammar`);
  const receipt=page.locator('#receipt');await expect(receipt).toHaveAttribute('data-latest-id',latest.id);
  await expect(receipt).toContainText('Tiêu đề bài theo nội dung hiện tại');await expect(receipt.locator('ol')).toContainText(current.prompt.vi);
  await receipt.getByRole('combobox',{name:'选择记录'}).selectOption('first');
  await expect(receipt).toContainText('Earlier learner');
  if(snapshot==='saved'){
   await expect(receipt.locator('ol')).toContainText(old.prompt.vi);await expect(receipt.locator('ol')).toContainText(old.explanation!.vi);
   await expect(receipt.locator('ol')).not.toContainText(current.prompt.vi);
  }else{
   await expect(receipt.locator('ol')).toContainText('旧记录没有当时题目快照');
   await expect(receipt.locator('.submitted-answer')).toHaveText(`${old.id}: ${JSON.stringify(first.answers[old.id])}`);
   await expect(receipt.locator('ol')).not.toContainText(current.prompt.vi);
  }
  expect((await stored(page,level)).homework[key]).toEqual(initial.homework[key]);
  await receipt.getByRole('combobox',{name:'选择记录'}).selectOption('latest');await expect(receipt.locator('ol')).toContainText(current.prompt.vi);
  expect((await stored(page,level)).homework[key]).toEqual(initial.homework[key]);
 });
}
