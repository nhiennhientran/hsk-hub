import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {canonicalWordPool,senseMap} from '../../../src/lexicon.ts';
const lessons=(level:2|3)=>Array.from({length:level===2?15:18},(_,i)=>JSON.parse(readFileSync(new URL(`../../../content/hsk${level}/lesson-${String(i+1).padStart(2,'0')}.json`,import.meta.url),'utf8')));
test.beforeEach(async({page})=>page.addInitScript(()=>sessionStorage.setItem('hsk_portal_unlocked_v2','1')));
for(const level of [2,3] as const){
 test(`actual HSK${level} all independent listening questions preserve immutable first latest and wrong retry`,async({page})=>{
  const sources=lessons(level),bank=new Map<string,any>(sources.flatMap(l=>l.listening.map((q:any)=>[q.id,q]))),storageKey=`ran_hsk${level}_fltrp_2026_v1`;
  await page.goto(`/#view=listening&level=${level}&lesson=1`);
  await page.locator('.listening-module select').selectOption('all');
  await page.locator('.listening-module').getByRole('button',{name:'开始听力',exact:false}).click();
  await expect(page.locator('.save-status')).toHaveAttribute('data-status','saved');
  const read=()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)!).data,storageKey);
  const queue=(await read()).listeningRound.queue as string[];
  expect([...queue].sort()).toEqual([...bank.keys()].sort());
  const firstWrong=queue[0]!;
  for(const id of queue){
   const q=bank.get(id),card=page.locator('.listening-module .activity-card');
   await expect(card.locator('h2 [lang=zh]')).toHaveText(q.prompt.zh);await expect(card.locator('h2 [lang=vi]')).toHaveText(q.prompt.vi);
   await expect(card.locator('.activity-feedback')).toHaveCount(0);
   await expect(card.locator('fieldset input')).toHaveCount(q.options.length);
   for(const [i,option]of q.options.entries())await expect(card.locator('.choice-option span').nth(i)).toHaveText(option);
   const chosen=id===firstWrong?(q.answer+1)%q.options.length:q.answer;
   await card.locator(`input[value="${chosen}"]`).check();await card.getByRole('button',{name:'提交本题',exact:false}).click();
   await expect(page.locator('.save-status')).toHaveAttribute('data-status','saved');await expect(card.locator('.activity-feedback')).toBeVisible();
   await expect(card.locator('.activity-feedback')).toContainText(q.options[q.answer]);
   const entry=(await read()).listening[id+':individual'];expect(entry.submissions).toBe(1);expect(entry.first).toEqual(entry.latest);expect(entry.latest.questions).toEqual([q]);expect(entry.latest.correct).toBe(id===firstWrong?0:1);
   if(id!==queue.at(-1))await page.locator('.listening-module').getByRole('button',{name:'下一题',exact:false}).click();
  }
  await expect(page.locator('.listening-module')).toContainText(`本组完成 · ${queue.length-1}/${queue.length}`);
  const original=(await read()).listening[firstWrong+':individual'].first;
  await page.reload();await expect(page.locator('.listening-module .activity-feedback')).toBeVisible();expect((await read()).listeningRound.queue).toEqual(queue);
  await page.locator('.listening-module .lesson-selection').evaluate((e:HTMLDetailsElement)=>e.open=true);
  await page.locator('.listening-module .lesson-selection').getByRole('checkbox',{name:'只练错题',exact:false}).check();
  await page.locator('.listening-module').getByRole('button',{name:'按当前设置开始新一组',exact:false}).click();
  expect((await read()).listeningRound.queue).toEqual([firstWrong]);await expect(page.locator('.listening-module .activity-feedback')).toHaveCount(0);
  await page.locator(`.listening-module input[name="${firstWrong}"][value="${bank.get(firstWrong).answer}"]`).check();
  await page.locator('.listening-module').getByRole('button',{name:'提交本题',exact:false}).click();await expect(page.locator('.listening-module .activity-feedback')).toBeVisible();
  const final=(await read()).listening[firstWrong+':individual'];expect(final.first).toEqual(original);expect(final.latest.correct).toBe(1);expect(final.submissions).toBe(2);
  await page.locator('.listening-module .lesson-selection').evaluate((e:HTMLDetailsElement)=>e.open=true);await page.locator('.listening-module').getByRole('button',{name:'按当前设置开始新一组',exact:false}).click();await expect(page.locator('.global-message')).toContainText('这个范围还没有可练的题目');
  const immutable=await read();await page.goto(`/#view=listening&level=${level===2?3:2}&lesson=1`);await page.goto(`/#view=listening&level=${level}&lesson=1`);expect(await read()).toEqual(immutable);
 });
 test(`actual HSK${level} complete canonical mixed queue renders all senses exact backs and survives responsive reload`,async({page})=>{
  const source=lessons(level),lexicon=JSON.parse(readFileSync(new URL(`../../../content/hsk${level}-lexicon.json`,import.meta.url),'utf8')),words=canonicalWordPool(source,new Set(source.map(l=>l.number)),lexicon),wordMap=new Map(words.map(w=>[w.id,w])),senses=senseMap(lexicon),key=`ran_hsk${level}_fltrp_2026_v1`;
  await page.setViewportSize({width:1440,height:900});await page.goto(`/#view=practice&level=${level}&lesson=1`);await page.locator('.practice-setup button').click();await expect(page.locator('.mixed-flip').first()).toBeVisible();await expect(page.locator('.save-status')).toHaveAttribute('data-status','saved');
  const read=()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)!).data.mixed,key);const queue=(await read()).queue as string[];
  expect([...queue].sort()).toEqual([...wordMap.keys()].sort());expect(new Set(queue.map(id=>senses.get(id)!.id)).size).toBe(lexicon.senses.length);
  const seen:string[]=[];
  for(let index=0;index<queue.length;index+=6){
   const ids=queue.slice(index,index+6);await expect(page.locator('.mixed-flip')).toHaveCount(ids.length);
   for(const id of ids){const w=wordMap.get(id)!;const card=page.locator(`.mixed-flip[data-word-id="${id}"]`);await expect(card).toHaveAttribute('data-sense-id',senses.get(id)!.id);await expect(card.locator('.card-hanzi')).toHaveText(w.zh);await card.click();await expect(card).toHaveAttribute('aria-pressed','true');await expect(card.locator('.card-pinyin')).toHaveText(w.py);await expect(card.locator('.card-meaning')).toHaveText(w.vi);await expect(card.locator('.card-pos')).toHaveText(w.pos);seen.push(id);}
   if(index+6<queue.length)await page.locator('.mixed-pager').getByRole('button',{name:'下一组',exact:false}).click();
  }
  expect(seen).toEqual(queue);const last=await read();await page.reload();expect(await read()).toEqual(last);await expect(page.locator('.mixed-flip')).toHaveCount(queue.length-last.index);
  for(const [width,count]of [[390,1],[768,4],[1440,6]]){await page.setViewportSize({width,height:900});await expect(page.locator('.mixed-flip')).toHaveCount(Math.min(count,queue.length-last.index));expect(await read()).toEqual(last);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
  await page.goto(`/#view=practice&level=${level===2?3:2}&lesson=1`);await page.goto(`/#view=practice&level=${level}&lesson=1`);expect(await read()).toEqual(last);
 });
}
