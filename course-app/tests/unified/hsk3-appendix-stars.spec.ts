import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import report from '../../docs/hsk3-appendix-stars/crosswalk.json' with {type:'json'};
import {openLesson,type LessonFixture} from './lesson-ready.ts';
const lessons=Array.from({length:18},(_,i)=>JSON.parse(fs.readFileSync(new URL(`../../content/hsk3/lesson-${String(i+1).padStart(2,'0')}.json`,import.meta.url),'utf8'))) as LessonFixture[];
test('HSK3 all sixteen reconciled glossary stars show bilingual supplement labels without altering progress',async({page})=>{
 await page.addInitScript(()=>sessionStorage.setItem('hsk_portal_unlocked_v2','1'));await page.setViewportSize({width:390,height:900});
 for(const n of [...new Set(report.edits.map(e=>e.lesson))]){
  const lesson=lessons.find(l=>l.number===n)!;await openLesson(page,lesson,'vocab');const before=await page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).filter(k=>!k.includes('route')).map(k=>[k,localStorage.getItem(k)])));
  for(const e of report.edits.filter(e=>e.lesson===n)){
   await page.locator(`[data-word-id="${e.id}"] button`).first().click();const dialog=page.getByRole('dialog');await expect(dialog).toContainText('★ 教材拓展词（本级超纲）');await expect(dialog).toContainText('ngoài phạm vi cấp này');await expect(dialog.locator('h2')).toHaveText(e.word);if(e.id===report.edits.find(x=>x.lesson===n)!.id)await dialog.screenshot({path:`test-results/unified-hsk3-glossary-stars-l${n}-${test.info().project.name}.png`});await dialog.getByRole('button',{name:/关闭/}).click();await expect(dialog).not.toBeVisible();
  }
  expect(await page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).filter(k=>!k.includes('route')).map(k=>[k,localStorage.getItem(k)])))).toEqual(before);
 }
});
