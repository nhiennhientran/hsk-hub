import {test,expect,type Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
import legacy from '../../../hsk1-app/src/domain/homework/engine.js';
const h1=JSON.parse(readFileSync(new URL('../../../hsk1-app/content/homework30-bank.json',import.meta.url),'utf8')).lessons;
const mapping=[['vocabGrammar','choice'],['ordering','sort'],['listening','listening'],['translationChoice','translationChoice'],['writing','translation']] as const;
const h1Vocabulary=JSON.parse(readFileSync(new URL('../../../hsk1-app/content/stage3-catalog.json',import.meta.url),'utf8')).vocabulary;
const lexicons=Object.fromEntries([2,3].map(level=>[level,JSON.parse(readFileSync(new URL(`../../content/hsk${level}-lexicon.json`,import.meta.url),'utf8'))]));
const oldKey='hsk4_upper_ranteacher_progress_v1',oldBytes=' { "1": { "complete": true, "note": "retained QA legacy bytes" } } ';
test.beforeEach(async({page})=>{
  await page.addInitScript(({key,bytes})=>{sessionStorage.setItem('hsk_portal_unlocked_v2','1');if(localStorage.getItem(key)===null)localStorage.setItem(key,bytes);},{key:oldKey,bytes:oldBytes});
});
async function ready(page:Page,level:number){
  if(level===1)await expect(page.locator('main')).toHaveAttribute('data-module-state','ready');
  else {
    await expect(page.locator('.save-status')).toHaveAttribute('data-status',/^(empty|saved)$/);
    await expect(page.locator('.save-status')).toHaveAttribute('data-problem','false');
  }
}
async function accessible(page:Page,level:number){
  await ready(page,level);
  await expect(page.locator('main')).not.toHaveAttribute('data-lesson-state','locked');
  expect(await page.evaluate(k=>localStorage.getItem(k),oldKey)).toBe(oldBytes);
}
const storageKey=(level:number)=>level===1?'ran_hsk1_modular_v1':`ran_hsk${level}_fltrp_2026_v1`;
async function savedData(page:Page,level:number){
  return page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).data,storageKey(level));
}
function completionAndHomework(data:any,level:number){
  return level===1?{completed:Object.entries(data.reading.lessons).filter(([,row]:[string,any])=>row.complete),homework:data.homework,homework30:data.homework30}
    :{completed:data.completed,homework:data.homework};
}
function order(q:any):number[]{
  const target=legacy.normal(q.answers[0]);
  const walk=(indices:number[],remaining:string):number[]|null=>{if(indices.length===q.tokens.length)return remaining?null:indices;for(let i=0;i<q.tokens.length;i++)if(!indices.includes(i)){const text=legacy.normal(q.tokens[i]);if(remaining.startsWith(text)){const found=walk([...indices,i],remaining.slice(text.length));if(found)return found;}}return null;};
  const found=walk([],target);if(!found)throw Error('Invalid sort fixture '+q.id);return found;
}
for(const level of [1,2,3]){
  test(`HSK${level} every course entry and practice selector is enabled for a new learner`,async({page})=>{
    const count=level===3?18:15;
    await page.goto(`./#view=courses&level=${level}`);await ready(page,level);
    await expect(page.locator('.lesson-card[data-lesson]')).toHaveCount(count);
    for(let n=1;n<=count;n++){
      const card=page.locator(`.lesson-card[data-lesson="${n}"]`);await expect(card).toHaveAttribute('data-lesson-state','unlocked');
      expect(await card.locator('a[href]').count(),`lesson ${n} has live entry links`).toBeGreaterThan(0);
      await expect(card.locator('a[aria-disabled="true"]')).toHaveCount(0);
    }
    for(const view of ['lesson','homework','listening']){
      await page.goto(`./#view=${view}&level=${level}&lesson=${count}&section=text&part=writing`);await accessible(page,level);
    }
    await page.reload();await accessible(page,level);
    await page.goto(`./#view=practice&level=${level}&lesson=1`);await ready(page,level);
    const choices=level===1?page.locator('input[data-vocabulary-lesson]'):page.locator('.lesson-choices input');
    await expect(choices).toHaveCount(count);for(const choice of await choices.all())await expect(choice).toBeEnabled();
    await page.goto(`./#view=listening&level=${level}&lesson=1`);await ready(page,level);
    const listeningChoices=level===1?page.locator('input[data-listening-lesson]'):page.locator('.listening-module .lesson-choices input');
    await expect(listeningChoices).toHaveCount(count);for(const choice of await listeningChoices.all())await expect(choice).toBeEnabled();
    if(level===1){await page.locator('#listening-all').click();for(const choice of await listeningChoices.all())await expect(choice).toBeChecked();}
    const data=await savedData(page,level);expect(completionAndHomework(data,level).completed).toEqual([]);
    expect(Object.keys(level===1?data.homework30.lessons:data.homework)).toHaveLength(0);
    expect(await page.evaluate(k=>localStorage.getItem(k),oldKey)).toBe(oldBytes);
  });
  test(`HSK${level} an unsubmitted draft stays incomplete while any later lesson is accessible`,async({page})=>{
    await page.goto(`./#view=homework&level=${level}&lesson=1&part=vocabGrammar&version=30-v1`);await ready(page,level);
    await page.locator('input[type=radio]').first().check();
    if(level===1)await expect(page.locator('#homework-save-status')).toHaveAttribute('data-state','saved');else await expect(page.locator('.save-status')).toHaveAttribute('data-status','saved');
    const before=await savedData(page,level),count=level===3?18:15;
    await page.goto(`./#view=lesson&level=${level}&lesson=${count}&section=vocab`);await accessible(page,level);
    await page.reload();await accessible(page,level);
    const after=await savedData(page,level);expect(completionAndHomework(after,level)).toEqual(completionAndHomework(before,level));
    if(level===1)expect(after.homework30.lessons['1'].choice.first).toBeNull();else expect(after.drafts).toEqual(before.drafts);
  });
  test(`HSK${level} actual submissions including manual writing retain real completion records while all courses stay accessible`,async({page},info)=>{
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
      if(part!=='writing'){await page.goto(`./#view=lesson&level=${level}&lesson=2&section=vocab`);await accessible(page,level);}
    }
    await page.goto(`./#view=lesson&level=${level}&lesson=2&section=vocab`);await ready(page,level);await expect(page.locator('main')).not.toHaveAttribute('data-lesson-state','locked');
    await page.reload();await ready(page,level);
    const data=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).data,level===1?'ran_hsk1_modular_v1':`ran_hsk${level}_fltrp_2026_v1`);
    const records=level===1?data.homework30.lessons['1']:Object.fromEntries(mapping.map(([part])=>[part,data.homework[`hsk${level}-fltrp-2026:l01:${part}`]]));
    for(const [part,p1]of mapping){const attempt=records[level===1?p1:part].first;expect(attempt).toBeTruthy();if(part==='writing'){expect(attempt.assessment).toBe('manual');expect(attempt.correct).toBeNull();}else expect(attempt.correct).toBe(0);}
    expect(await page.evaluate(k=>localStorage.getItem(k),oldKey)).toBe(oldBytes);
    await info.attach('completion-without-perfect-score.json',{body:JSON.stringify({level,allFiveSubmitted:true,manualNotAutoScored:true,automaticScoresZero:true,lesson2AccessibleAfterReload:true,oldBytesPreserved:true}),contentType:'application/json'});
  });
  test(`HSK${level} single lessons, arbitrary nonconsecutive combinations and all lessons produce the complete selected vocabulary pool`,async({page},info)=>{
    const count=level===3?18:15,all=Array.from({length:count},(_,i)=>i+1),scopes=[[count],[1,5,12],[2,8,count],all];
    const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(`./#view=practice&level=${level}&lesson=1`);await ready(page,level);
    const settings=page.locator(level===1?'#vocabulary-settings':'.lesson-selection');
    const choices=level===1?page.locator('input[data-vocabulary-lesson]'):page.locator('.lesson-choices input');
    const evidence:unknown[]=[];
    for(const selected of scopes){
      if(await settings.getAttribute('open')===null)await settings.locator('summary').click();
      if(selected.length===count){await page.locator(level===1?'#vocabulary-all':'.lesson-selection > button').click();}
      else for(let index=0;index<count;index++)await choices.nth(index).setChecked(selected.includes(index+1));
      for(let index=0;index<count;index++){await expect(choices.nth(index)).toBeEnabled();await expect(choices.nth(index)).toHaveJSProperty('checked',selected.includes(index+1));}
      await page.locator(level===1?'#vocabulary-start':'.practice-setup button').click();
      if(level===1){await expect(page.locator('#vocabulary-grid .mixed-card-toggle').first()).toBeVisible();await expect(page.locator('#vocabulary-save-status')).toHaveAttribute('data-state','saved');}
      else {await expect(page.locator('.mixed-flip').first()).toBeVisible();await expect(page.locator('.save-status')).toHaveAttribute('data-status','saved');}
      const data=await savedData(page,level),round=level===1?data.mixedVocabulary.round:data.mixed;
      expect(level===1?round.lessons:round.selected).toEqual(selected);
      const senseByWord=new Map<string,string>(level===1?[]:lexicons[level].senses.flatMap((sense:any)=>sense.sources.map((source:any)=>[source.wordId,sense.id])));
      const actual:string[]=level===1?round.senseIds:round.queue.map((id:string)=>senseByWord.get(id));
      const expected:string[]=level===1?[...new Set<string>(h1Vocabulary.filter((row:any)=>selected.includes(row.lesson)).map((row:any)=>row.senseId))]
        :lexicons[level].senses.filter((sense:any)=>sense.sources.some((source:any)=>selected.includes(source.lesson))).map((sense:any)=>sense.id);
      expect(actual.length).toBeGreaterThan(0);expect(new Set(actual).size).toBe(actual.length);expect([...actual].sort()).toEqual([...expected].sort());
      expect(completionAndHomework(data,level).completed).toEqual([]);expect(Object.keys(level===1?data.homework30.lessons:data.homework)).toHaveLength(0);
      await page.reload();await ready(page,level);expect(level===1?(await savedData(page,level)).mixedVocabulary.round:(await savedData(page,level)).mixed).toEqual(round);
      evidence.push({selected,uniqueWords:actual.length,retainedAfterRefresh:true});
    }
    expect(errors).toEqual([]);expect(await page.evaluate(k=>localStorage.getItem(k),oldKey)).toBe(oldBytes);
    await info.attach('free-selection-vocabulary-pools.json',{body:JSON.stringify({level,scopes:evidence,completionInvented:false,oldBytesPreserved:true}),contentType:'application/json'});
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
