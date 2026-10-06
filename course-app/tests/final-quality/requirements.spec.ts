import {test,expect,type Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
import legacy from '../../../hsk1-app/src/domain/homework/engine.js';
const h1=JSON.parse(readFileSync(new URL('../../../hsk1-app/content/homework30-bank.json',import.meta.url),'utf8')).lessons;
const mapping=[['vocabGrammar','choice'],['ordering','sort'],['listening','listening'],['translationChoice','translationChoice'],['writing','translation']] as const;
const oldKey='hsk4_upper_ranteacher_progress_v1',oldBytes=' { "1": { "complete": true, "note": "retained QA legacy bytes" } } ';
test.beforeEach(async({page})=>{
  await page.addInitScript(({key,bytes})=>{sessionStorage.setItem('hsk_portal_unlocked_v2','1');if(localStorage.getItem(key)===null)localStorage.setItem(key,bytes);},{key:oldKey,bytes:oldBytes});
});
async function ready(page:Page,level:number){
  if(level===1)await expect(page.locator('main')).toHaveAttribute('data-module-state','ready');
  else await expect(page.locator('.save-status')).toHaveAttribute('data-status','saved');
}
async function locked(page:Page){
  await expect(page.locator('main')).toHaveAttribute('data-lesson-state','locked');
  await expect(page.locator('main')).toHaveAttribute('data-locked-lesson','2');
  await expect(page.locator('#assignment,#scene-content')).toHaveCount(0);
  expect(await page.evaluate(k=>localStorage.getItem(k),oldKey)).toBe(oldBytes);
}
function order(q:any):number[]{
  const target=legacy.normal(q.answers[0]);
  const walk=(indices:number[],remaining:string):number[]|null=>{if(indices.length===q.tokens.length)return remaining?null:indices;for(let i=0;i<q.tokens.length;i++)if(!indices.includes(i)){const text=legacy.normal(q.tokens[i]);if(remaining.startsWith(text)){const found=walk([...indices,i],remaining.slice(text.length));if(found)return found;}}return null;};
  const found=walk([],target);if(!found)throw Error('Invalid sort fixture '+q.id);return found;
}
for(const level of [1,2,3]){
  test(`HSK${level} lesson2 direct textbook and homework URLs stay locked for a new learner`,async({page})=>{
    await page.goto(`./#view=lesson&level=${level}&lesson=2&section=text`);await locked(page);
    await page.reload();await locked(page);
    await page.goto(`./#view=homework&level=${level}&lesson=2&part=writing`);await locked(page);
    await page.goto(`./#view=listening&level=${level}&lesson=2`);await locked(page);
    await page.goto(`./#view=courses&level=${level}`);await ready(page,level);
    const card=page.locator('.lesson-card[data-lesson="2"]');await expect(card).toHaveAttribute('data-lesson-state','locked');await expect(card.locator('a[href]')).toHaveCount(0);
    await page.goto(`./#view=practice&level=${level}&lesson=1`);await ready(page,level);
    const choices=level===1?page.locator('input[data-vocabulary-lesson]'):page.locator('.lesson-choices input');
    await expect(choices).toHaveCount(level===3?18:15);await expect(choices.nth(0)).toBeEnabled();await expect(choices.nth(1)).toBeDisabled();
    await page.goto(`./#view=listening&level=${level}&lesson=1`);await ready(page,level);
    if(level===1){await expect(page.locator('input[data-listening-lesson="2"]')).toBeDisabled();await page.locator('#listening-all').click();await expect(page.locator('input[data-listening-lesson="2"]')).not.toBeChecked();}
    else await expect(page.locator('.listening-module .lesson-choices input')).toHaveCount(1);
  });
  test(`HSK${level} an unsubmitted lesson1 draft cannot unlock lesson2`,async({page})=>{
    await page.goto(`./#view=homework&level=${level}&lesson=1&part=vocabGrammar&version=30-v1`);await ready(page,level);
    await page.locator('input[type=radio]').first().check();
    if(level===1)await expect(page.locator('#homework-save-status')).toHaveAttribute('data-state','saved');else await expect(page.locator('.save-status')).toHaveAttribute('data-status','saved');
    await page.goto(`./#view=lesson&level=${level}&lesson=2&section=vocab`);await locked(page);
  });
  test(`HSK${level} submitted lesson1 work including manual writing unlocks lesson2 without a perfection requirement`,async({page},info)=>{
    test.setTimeout(180000);
    const source=level===1?h1.find((l:any)=>l.lesson===1):JSON.parse(readFileSync(new URL(`../../content/hsk${level}/lesson-01.json`,import.meta.url),'utf8'));
    for(const [part,p1]of mapping){
      await page.goto(`./#view=homework&level=${level}&lesson=1&part=${part}&version=30-v1`);await ready(page,level);
      const qs=level===1?source[p1]:source.homework.filter((q:any)=>q.part===part);
      for(const q of qs){
        if(level===1){
          if(q.kind==='sort')for(const n of order(q).reverse())await page.locator(`[data-sort-add="${q.id}"][data-token-index="${n}"]`).click();
          else if(q.kind==='translation')await page.locator(`textarea[data-answer-id="${q.id}"]`).fill('Synthetic QA submitted manual writing');
          else await page.locator(`input[data-answer-id="${q.id}"][value="${(q.answer+1)%q.options.length}"]`).check();
        }else{
          const field=page.locator(`[data-question-id="${q.id}"]`);
          if(part==='writing')await field.locator('textarea').fill('Synthetic QA submitted manual writing');
          else if(part==='ordering')for(const n of [...q.answer].reverse())await field.locator('.ordering-tokens button').nth(n).click();
          else await field.locator(`input[value="${(q.answer+1)%q.options.length}"]`).check();
        }
      }
      await page.locator(level===1?'#submit-homework':'#assignment button[type=submit]').click();
      if(level===1){await expect(page.locator('#homework-save-status')).toHaveAttribute('data-state','saved');await expect(page.locator('#homework-result')).toBeVisible();}
      else{await expect(page.locator('.save-status')).toHaveAttribute('data-status','saved');await expect(page.locator('#receipt')).toBeVisible();}
      if(part!=='writing'){await page.goto(`./#view=lesson&level=${level}&lesson=2&section=vocab`);await locked(page);}
    }
    await page.goto(`./#view=lesson&level=${level}&lesson=2&section=vocab`);await ready(page,level);await expect(page.locator('main')).not.toHaveAttribute('data-lesson-state','locked');
    await page.reload();await ready(page,level);
    const data=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).data,level===1?'ran_hsk1_modular_v1':`ran_hsk${level}_fltrp_2026_v1`);
    const records=level===1?data.homework30.lessons['1']:Object.fromEntries(mapping.map(([part])=>[part,data.homework[`hsk${level}-fltrp-2026:l01:${part}`]]));
    for(const [part,p1]of mapping){const attempt=records[level===1?p1:part].first;expect(attempt).toBeTruthy();if(part==='writing'){expect(attempt.assessment).toBe('manual');expect(attempt.correct).toBeNull();}else expect(attempt.correct).toBe(0);}
    expect(await page.evaluate(k=>localStorage.getItem(k),oldKey)).toBe(oldBytes);
    await info.attach('completion-without-perfect-score.json',{body:JSON.stringify({level,allFiveSubmitted:true,manualNotAutoScored:true,automaticScoresZero:true,lesson2AccessibleAfterReload:true,oldBytesPreserved:true}),contentType:'application/json'});
  });
}
for(const level of [2,3])test(`HSK${level} designated five translation choices render real ABCD options with preserved original answer positions`,async({page})=>{
  await page.goto(`./#view=homework&level=${level}&lesson=1&part=translationChoice`);await ready(page,level);
  const raw=JSON.parse(readFileSync(new URL(`../../content/hsk${level}/lesson-01.json`,import.meta.url),'utf8'));
  const questions=raw.homework.filter((q:any)=>q.part==='translationChoice');expect(questions).toHaveLength(5);
  for(const q of questions){const field=page.locator(`[data-question-id="${q.id}"]`);await expect(field.locator('input[type=radio]')).toHaveCount(4);for(const [i,text]of q.options.entries())await expect(field.locator('label').nth(i)).toContainText(String(text));await field.locator('input[value="3"]').check();}
  await page.locator('#assignment button[type=submit]').click();await expect(page.locator('#receipt')).toContainText('0/5');
  const history=await page.evaluate(level=>JSON.parse(localStorage.getItem(`ran_hsk${level}_fltrp_2026_v1`)!).data.homework[`hsk${level}-fltrp-2026:l01:translationChoice`].latest,level);
  for(const [i,q]of questions.entries()){expect(history.questions[i].options.slice(0,3)).toEqual(q.options);expect(history.questions[i].answer).toBe(q.answer);expect(history.questions[i].options).toHaveLength(4);}
});
