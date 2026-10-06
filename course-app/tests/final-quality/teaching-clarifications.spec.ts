import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {allReadingCompletedFixture} from './unlocked-fixtures.ts';
const manifest=JSON.parse(readFileSync(new URL('../../content/teaching-clarifications-20261006.json',import.meta.url),'utf8'));
const values=allReadingCompletedFixture();
test.beforeEach(async({page})=>{await page.addInitScript(values=>{sessionStorage.setItem('hsk_portal_unlocked_v2','1');for(const [key,value]of Object.entries(values))if(localStorage.getItem(key)===null)localStorage.setItem(key,value);},values);});
for(const e of manifest.entries)test(`${e.id} displays its independently reviewed bilingual clarification`,async({page},info)=>{
 const level=Number(e.courseId[3]),part=e.kind==='homework'?(e.id.endsWith('hw21')?'translationChoice':'vocabGrammar'):null;
 await page.goto(`./#view=${part?'homework':'lesson'}&level=${level}&lesson=${e.lesson}&${part?'part='+part:'section=grammar'}`);
 const item=page.locator(e.kind==='grammar'?`[data-grammar-id="${e.id}"]`:`[data-question-id="${e.id}"]`);
 await expect(item).toBeVisible();await expect(item).toContainText(e.newValue.zh);await expect(item).toContainText(e.newValue.vi);
 if(e.kind==='homework'){const options=item.locator('input[type=radio]');await expect(options).toHaveCount(e.originalOptions.length);for(const [i,text]of e.originalOptions.entries())await expect(item.locator('label').nth(i)).toContainText(String(text));}
 await info.attach('bounded-bilingual-clarification.json',{body:JSON.stringify({id:e.id,newValue:e.newValue,sourceFile:e.sourceFile,sourceSHA256:e.sourceSHA256,originalAnswer:e.originalAnswer}),contentType:'application/json'});
});
