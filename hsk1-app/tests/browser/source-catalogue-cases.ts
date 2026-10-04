import type {test as Test,expect as Expect,Page,Locator} from '@playwright/test';
import {sourceLessons,sourceRecordKey,type SourceActivity,type SourceLesson} from '../../src/services/source-activities/content.ts';
import {readFileSync} from 'node:fs';
import {createCompatibility} from '../../src/services/storage/compatibility.ts';
import {getHomework30Bank} from '../../src/services/content/homework30.ts';
import {homework30Group,submitHomework30,restartHomework30} from '../../src/domain/homework30/engine.ts';
const json=(name:string)=>JSON.parse(readFileSync(new URL('../../content/'+name,import.meta.url),'utf8'));
const compatibility=createCompatibility(json('stage2-bank.json'),json('stage3-catalog.json'),json('textbook.json'));
const stamp=1791093600000;

const sourceKey='ran_hsk1_textbook_source_v1',primaryKey='ran_hsk1_modular_v1',legacyKey='ran_hsk1_stage2_v3';
const legacyBytes=' { "synthetic": "source catalogue retention", "unicode": "中文 Việt" } ';
const scope=(page:Page,lesson:number)=>page.locator(`[data-hsk1-source-pilot="${lesson}"]`);
const card=(page:Page,lesson:number,id:string)=>scope(page,lesson).locator(`[data-activity-id="${id}"]`);
function requiredLesson(id:number):SourceLesson {
 const lesson=sourceLessons.find(row=>row.lesson===id);
 if(!lesson)throw Error(`Source lesson ${id} is not integrated; this acceptance case must not be skipped.`);
 return lesson;
}
async function seedNonemptyHistory(page:Page){
 const data=compatibility.blank(),lesson=getHomework30Bank()[0]!;
 for(let run=0;run<2;run++){homework30Group(data.homework30!,1,'choice').draft=Object.fromEntries(lesson.choice.map(q=>[q.id,q.answer]));if(!submitHomework30(data.homework30!,lesson,'choice',stamp+run).ok)throw Error('Invalid nonempty primary fixture');restartHomework30(data.homework30!,1,'choice',stamp+run+1);}
 data.legacyRaw={[legacyKey]:legacyBytes};const raw=JSON.stringify({app:'hsk1-modular',schema:1,revision:9,updatedAt:stamp,data:compatibility.validate(data),recovery:null});
 await page.addInitScript(({primaryKey,legacyKey,raw,bytes})=>{sessionStorage.setItem('hsk_portal_unlocked_v2','1');if(localStorage.getItem(primaryKey)===null)localStorage.setItem(primaryKey,raw);if(localStorage.getItem(legacyKey)===null)localStorage.setItem(legacyKey,bytes);},{primaryKey,legacyKey,raw,bytes:legacyBytes});
}
async function ready(page:Page,id:number,expect:typeof Expect){
 await expect(scope(page,id)).toBeVisible();await expect(page.locator('[data-hsk1-source-pilot]')).toHaveCount(1);
 await expect(page.locator('#reading-save-status')).toHaveAttribute('data-state','saved');
}
async function primaryDomains(page:Page){return page.evaluate(({primaryKey,legacyKey})=>{
 const raw=localStorage.getItem(primaryKey);if(!raw)throw Error('Primary data was removed.');const d=JSON.parse(raw).data;
 return {exercises:d.exercises,homework30:d.homework30,legacyRaw:d.legacyRaw,legacy:localStorage.getItem(legacyKey)};
},{primaryKey,legacyKey});}
async function sourceRecords(page:Page){return page.evaluate(key=>{const raw=localStorage.getItem(key);return raw?JSON.parse(raw).data.records:{};},sourceKey);}
async function navigateWithinApp(page:Page,route:string){
 // Address-bar hash changes run the normal router's disposal and mount without a reload.
 await page.evaluate(next=>{location.hash=next;},new URL(route,'http://fixture.invalid').hash);
}
async function assertTableScroll(wrap:Locator,page:Page,expect:typeof Expect){
 const size=await wrap.evaluate(e=>({width:e.clientWidth,max:e.scrollWidth-e.clientWidth}));expect(size.width).toBeGreaterThan(0);if(size.max<=1)return;
 await wrap.scrollIntoViewIfNeeded();const box=await wrap.boundingBox();if(!box)throw Error('Visible table has no bounding box.');
 await page.mouse.move(box.x+Math.min(box.width/2,100),box.y+Math.min(box.height/2,50));await page.mouse.wheel(5000,0);
 await expect.poll(()=>wrap.evaluate(e=>e.scrollLeft)).toBeGreaterThan(0);
 await expect.poll(()=>wrap.evaluate(e=>{const last=e.querySelector('tbody tr')?.lastElementChild;return !!last&&last.getBoundingClientRect().right<=e.getBoundingClientRect().right+2;})).toBe(true);
}
async function assertRenderedLesson(page:Page,lesson:SourceLesson,expect:typeof Expect){
 const host=scope(page,lesson.lesson),ids=lesson.activities.map(a=>a.id);await expect(host.locator('.activity-card')).toHaveCount(ids.length);
 const rendered=await host.locator('.activity-card').evaluateAll(cards=>cards.map(node=>({
  id:node.getAttribute('data-activity-id'),version:node.getAttribute('data-activity-version'),kind:node.getAttribute('data-kind'),readonly:node.hasAttribute('data-readonly'),
  fields:[...node.querySelectorAll<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>('[data-source-field]')].map(input=>({id:input.dataset.sourceField,domId:input.id,tag:input.tagName.toLowerCase(),required:input.required,labelCount:[...node.querySelectorAll('label')].filter(label=>label.htmlFor===input.id).length,optionIds:input.tagName==='SELECT'?[...(input as HTMLSelectElement).options].map(o=>o.value):undefined})),
  submitCount:[...node.querySelectorAll('button')].filter(button=>button.textContent?.includes('保存并查看反馈')).length,
  table:node.querySelector('.source-activity-table')?{columns:node.querySelectorAll('.source-activity-table thead>tr>th').length,rows:[...node.querySelectorAll('.source-activity-table tbody>tr')].map(row=>({id:row.getAttribute('data-source-row'),cells:[...row.children].map(cell=>({fields:[...cell.querySelectorAll<HTMLElement>('[data-source-field]')].map(input=>input.dataset.sourceField),text:cell.textContent??''}))}))}:null,
  imageCount:node.querySelectorAll('img').length
 })));
 expect(rendered.map(a=>a.id)).toEqual(ids);expect(new Set(rendered.map(a=>a.id)).size).toBe(ids.length);
 const domIds=rendered.flatMap(a=>a.fields.map(f=>f.domId));expect(new Set(domIds).size).toBe(domIds.length);expect(domIds.length).toBe(lesson.activities.reduce((n,a)=>n+a.fields.length,0));
 for(const [index,actual]of rendered.entries()){
  const expected=lesson.activities[index]!;expect(actual.version,expected.id).toBe(expected.version);expect(actual.kind,expected.id).toBe(expected.kind);
  expect(actual.readonly,expected.id).toBe(expected.fields.length===0);expect(actual.submitCount,expected.id).toBe(expected.fields.length?1:0);
  expect(actual.fields.map(f=>f.id).sort(),expected.id).toEqual(expected.fields.map(f=>f.id).sort());
  for(const f of expected.fields){const input=actual.fields.find(row=>row.id===f.id)!;expect(input.labelCount,`${expected.id}/${f.id}`).toBe(1);expect(input.required).toBe(f.required!==false);expect(input.tag).toBe(f.input==='text'?'input':f.input);if(f.input==='select')expect(input.optionIds).toEqual(['',...(f.options??[]).map(o=>o.id)]);}
  expect(actual.imageCount,expected.id).toBe((expected.figure?1:0)+(expected.figures?.length??0));
  if(expected.table){
   expect(actual.table,expected.id).not.toBeNull();const headerless=(expected.table as typeof expected.table&{headerless?:true}).headerless;
   expect(actual.table!.columns).toBe(headerless?0:expected.table.columns.length);expect(actual.table!.rows.map(r=>r.id)).toEqual(expected.table.rows.map(r=>r.id));
   for(const [r,row]of expected.table.rows.entries()){expect(actual.table!.rows[r]!.cells.length).toBe(expected.table.columns.length);for(const [c,cell]of row.cells.entries()){const actualCell=actual.table!.rows[r]!.cells[c]!;expect(actualCell.fields).toEqual(cell.fieldId?[cell.fieldId]:[]);if(cell.text){expect(actualCell.text).toContain(cell.text.zh);expect(actualCell.text).toContain(cell.text.vi);}}}
  }else expect(actual.table,expected.id).toBeNull();
 }
 for(const img of await host.locator('img').all()){await img.scrollIntoViewIfNeeded();await expect.poll(()=>img.evaluate((e:HTMLImageElement)=>e.complete&&e.naturalWidth>0)).toBe(true);await expect(img).toHaveAttribute('alt',/\S/);}
 for(const wrap of await host.locator('.source-table-scroll').all())await assertTableScroll(wrap,page,expect);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await expect(host).not.toContainText('本题原图暂不可用');
 // Merely visiting and reading, including read-only tables, must not create receipts.
 expect(await sourceRecords(page)).toEqual({});
}
function editableTable(lesson:SourceLesson):SourceActivity {
 const a=lesson.activities.filter(a=>a.table&&a.fields.length).sort((a,b)=>a.fields.length-b.fields.length)[0];
 if(!a)throw Error(`Lesson ${lesson.lesson} has no editable original table for the persistence scenario.`);return a;
}
async function fillAndSave(page:Page,lesson:number,a:SourceActivity,expect:typeof Expect){
 const node=card(page,lesson,a.id),values:Record<string,string>={};
 for(const [i,f]of a.fields.entries()){const input=node.locator(`[data-source-field="${f.id}"]`),value=f.input==='select'?f.options![0]!.id:`第${lesson}课 · 第${i+1}项 · 中文 Việt`;values[f.id]=value;if(f.input==='select')await input.selectOption(value);else await input.fill(value);}
 await node.getByRole('button',{name:'保存并查看反馈'}).click();await expect(scope(page,lesson).locator('[data-source-save-status]')).toHaveAttribute('data-state','saved');await expect(node.locator('.source-history summary')).toContainText('1次');await expect(node.locator('.activity-feedback')).not.toBeEmpty();return values;
}
export function sourceCatalogueCases(route:(lesson:number)=>string,hostName:string,lessonIds:readonly number[],test:typeof Test,expect:typeof Expect){
 test.beforeEach(async({page})=>seedNonemptyHistory(page));
 for(const id of lessonIds)for(const width of [320,390,768,1440])test(`${hostName} HSK1 source catalogue L${id} complete DOM at ${width}`,async({page})=>{
  test.setTimeout(90_000);const lesson=requiredLesson(id),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width,height:900});await page.goto(route(id));await ready(page,id,expect);const before=await primaryDomains(page);await assertRenderedLesson(page,lesson,expect);expect(await primaryDomains(page)).toEqual(before);expect(errors).toEqual([]);
 });
 test(`${hostName} HSK1 source catalogue tables persist across lessons refresh and isolate history`,async({page})=>{
  test.setTimeout(90_000);await page.setViewportSize({width:390,height:900});
  const l12=requiredLesson(12),l9=requiredLesson(9),a12=editableTable(l12),a9=editableTable(l9);
  await page.goto(route(12));await ready(page,12,expect);const primary=await primaryDomains(page),values12=await fillAndSave(page,12,a12,expect),record12=(await sourceRecords(page))[sourceRecordKey(a12)];
  expect(record12.lesson).toBe(12);expect(record12.context.table).toEqual(a12.table);
  await navigateWithinApp(page,route(9));await ready(page,9,expect);await expect(page.locator(`[data-activity-id="${a12.id}"]`)).toHaveCount(0);
  for(const summary of await scope(page,9).locator('.source-history summary').all())await expect(summary).toContainText('0次');await expect(scope(page,9).locator('.source-archive')).toBeHidden();
  const values9=await fillAndSave(page,9,a9,expect),saved=await sourceRecords(page);expect(saved[sourceRecordKey(a12)]).toEqual(record12);expect(Object.keys(saved).sort()).toEqual([sourceRecordKey(a12),sourceRecordKey(a9)].sort());expect(saved[sourceRecordKey(a9)].context.table).toEqual(a9.table);expect(await primaryDomains(page)).toEqual(primary);
  await navigateWithinApp(page,route(12));await ready(page,12,expect);await expect(page.locator(`[data-activity-id="${a9.id}"]`)).toHaveCount(0);
  for(const [id,value]of Object.entries(values12))await expect(card(page,12,a12.id).locator(`[data-source-field="${id}"]`)).toHaveValue(value);
  await expect(card(page,12,a12.id).locator('.source-history summary')).toContainText('1次');await expect(scope(page,12).locator('.source-archive')).toBeHidden();for(const a of l12.activities.filter(a=>!a.fields.length))expect(saved[sourceRecordKey(a)]).toBeUndefined();
  await page.reload();await ready(page,12,expect);expect(await sourceRecords(page)).toEqual(saved);for(const [id,value]of Object.entries(values12))await expect(card(page,12,a12.id).locator(`[data-source-field="${id}"]`)).toHaveValue(value);await expect(card(page,12,a12.id).locator('.source-history summary')).toContainText('1次');
  await navigateWithinApp(page,route(9));await ready(page,9,expect);for(const [id,value]of Object.entries(values9))await expect(card(page,9,a9.id).locator(`[data-source-field="${id}"]`)).toHaveValue(value);await expect(card(page,9,a9.id).locator('.source-history summary')).toContainText('1次');expect(await sourceRecords(page)).toEqual(saved);expect(await primaryDomains(page)).toEqual(primary);
 });
}
