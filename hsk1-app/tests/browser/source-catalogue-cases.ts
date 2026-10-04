import type {test as Test,expect as Expect,Page,Locator} from '@playwright/test';
import {sourceLessons,sourceRecordKey,type SourceActivity,type SourceLesson} from '../../src/services/source-activities/content.ts';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
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
 // A tall table can start above the viewport after scrollIntoViewIfNeeded.
 // Use its keyboard-accessible region, rather than a potentially off-screen mouse point.
 await wrap.scrollIntoViewIfNeeded();await wrap.focus();
 for(let i=0;i<Math.max(40,Math.ceil(size.max/20));i++)await page.keyboard.press('ArrowRight',{delay:10});
 await expect.poll(()=>wrap.evaluate(e=>e.scrollLeft)).toBeGreaterThan(0);
 await expect.poll(()=>wrap.evaluate(e=>{const last=e.querySelector('tbody tr')?.lastElementChild;return !!last&&last.getBoundingClientRect().right<=e.getBoundingClientRect().right+2;})).toBe(true);
}
async function assertRenderedLesson(page:Page,lesson:SourceLesson,expect:typeof Expect){
 const host=scope(page,lesson.lesson),ids=lesson.activities.map(a=>a.id);await expect(host.locator('.activity-card')).toHaveCount(ids.length);
 const rendered=await host.locator('.activity-card').evaluateAll(cards=>cards.map(node=>({
  id:node.getAttribute('data-activity-id'),version:node.getAttribute('data-activity-version'),kind:node.getAttribute('data-kind'),readonly:node.hasAttribute('data-readonly'),
  fields:[...node.querySelectorAll<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>('[data-source-field]')].map(input=>({id:input.dataset.sourceField,domId:input.id,tag:input.tagName.toLowerCase(),required:input.required,labels:[...node.querySelectorAll('label')].filter(label=>label.htmlFor===input.id).map(label=>label.textContent??''),options:input.tagName==='SELECT'?[...(input as HTMLSelectElement).options].map(o=>({id:o.value,text:o.textContent??''})):undefined})),
  submitCount:[...node.querySelectorAll('button')].filter(button=>button.textContent?.includes('保存并查看反馈')).length,
  table:node.querySelector('.source-activity-table')?{headers:[...node.querySelectorAll('.source-activity-table thead>tr>th')].map(cell=>cell.textContent??''),rows:[...node.querySelectorAll('.source-activity-table tbody>tr')].map(row=>({id:row.getAttribute('data-source-row'),cells:[...row.children].map(cell=>({fields:[...cell.querySelectorAll<HTMLElement>('[data-source-field]')].map(input=>input.dataset.sourceField),text:cell.textContent??''}))}))}:null,
  imageCount:node.querySelectorAll('img').length
 })));
 expect(rendered.map(a=>a.id)).toEqual(ids);expect(new Set(rendered.map(a=>a.id)).size).toBe(ids.length);
 const domIds=rendered.flatMap(a=>a.fields.map(f=>f.domId));expect(new Set(domIds).size).toBe(domIds.length);expect(domIds.length).toBe(lesson.activities.reduce((n,a)=>n+a.fields.length,0));
 for(const [index,actual]of rendered.entries()){
  const expected=lesson.activities[index]!;expect(actual.version,expected.id).toBe(expected.version);expect(actual.kind,expected.id).toBe(expected.kind);
  const node=card(page,lesson.lesson,expected.id);
  await expect(node.locator('h3')).toHaveText(`${expected.title.zh} · ${expected.title.vi}`);
  await expect(node).toContainText(expected.instruction.zh);await expect(node).toContainText(expected.instruction.vi);
  await expect(node).toContainText(expected.prompt.zh);await expect(node).toContainText(expected.prompt.vi);
  expect(actual.readonly,expected.id).toBe(expected.fields.length===0);expect(actual.submitCount,expected.id).toBe(expected.fields.length?1:0);
  expect(actual.fields.map(f=>f.id).sort(),expected.id).toEqual(expected.fields.map(f=>f.id).sort());
  for(const f of expected.fields){const input=actual.fields.find(row=>row.id===f.id)!;expect(input.labels,`${expected.id}/${f.id}`).toEqual([`${f.label.zh} · ${f.label.vi}`]);expect(input.required).toBe(f.required!==false);expect(input.tag).toBe(f.input==='text'?'input':f.input);if(f.input==='select')expect(input.options).toEqual([{id:'',text:'请选择 · Hãy chọn'},...(f.options??[]).map(o=>({id:o.id,text:`${o.id}. ${o.zh} · ${o.py} · ${o.vi}`}))]);if('pinyin'in f&&typeof f.pinyin==='string')await expect(node.locator('.activity-field').filter({has:page.locator(`[data-source-field="${f.id}"]`)})).toContainText(f.pinyin);}
  const figures=[...(expected.figure?[expected.figure]:[]),...(expected.figures??[])];
  expect(actual.imageCount,expected.id).toBe(figures.length);
  for(const [index,id]of figures.entries()){
   const source=lesson.figures.find(figure=>figure.id===id);if(!source)throw Error(`Missing trusted source figure ${expected.id}/${id}`);
   const figure=node.locator('figure').nth(index),img=figure.locator('img');
   await expect(img).toHaveAttribute('alt',`${source.alt.zh} · ${source.alt.vi}`);
   await expect(figure.locator('figcaption')).toHaveText(`${source.note.zh} · ${source.note.vi}`);
   const src=await img.getAttribute('src');if(!src)throw Error(`Source image has no URL: ${expected.id}/${id}`);
   let bytes:Buffer|undefined;
   if(src.startsWith('data:')){
    // Vite may inline SVGs as base64 or with equivalent XML quoting/whitespace.
    expect(source.kind).toBe('original-schematic');const encoded=src.match(/^data:image\/svg\+xml;base64,(.+)$/)?.[1];
    if(encoded)bytes=Buffer.from(encoded,'base64');
    else{
     const encodedXML=src.match(/^data:image\/svg\+xml,(.+)$/)?.[1];if(!encodedXML)throw Error(`Unexpected inline source image format: ${expected.id}/${id}`);
     const original=readFileSync(new URL('../../content/source-activities/'+source.file,import.meta.url),'utf8');expect(createHash('sha256').update(original).digest('hex')).toBe(source.sha256);
     const representations=await page.evaluate(({rendered,original})=>{
      const normalize=(xml:string)=>{
       const root=new DOMParser().parseFromString(xml,'image/svg+xml').documentElement;
       if(root.tagName==='parsererror')throw Error('Invalid rendered source SVG');
       const canonical=(node:Node):unknown=>node.nodeType===Node.TEXT_NODE?(node.textContent?.trim()||null):node instanceof Element?{tag:node.tagName,attrs:[...node.attributes].map(a=>[a.name,a.value]).sort((a,b)=>a[0]!.localeCompare(b[0]!)),children:[...node.childNodes].map(canonical).filter(value=>value!==null)}:null;
       return canonical(root);
      };return [normalize(rendered),normalize(original)];
     },{rendered:decodeURIComponent(encodedXML),original});expect(representations[0],`${expected.id}/${id}: delivered SVG semantics`).toEqual(representations[1]);
    }
   }else{
    const url=new URL(src,page.url()),path=url.pathname;
    if(source.kind==='original-crop')expect(path,`${expected.id}/${id}`).toBe(new URL(`./source-activities/${source.file}`,page.url()).pathname);
    else {const stem=source.file.split('/').at(-1)!.replace(/\.svg$/,'');expect(path.split('/').at(-1)!,`${expected.id}/${id}`).toMatch(new RegExp(`^${stem}(?:-[^/]+)?\\.svg$`));}
    const response=await page.request.get(url.href);expect(response.ok(),`${expected.id}/${id}`).toBe(true);bytes=await response.body();
   }
   if(bytes)expect(createHash('sha256').update(bytes).digest('hex'),`${expected.id}/${id}: delivered figure bytes`).toBe(source.sha256);
   await img.scrollIntoViewIfNeeded();await expect.poll(()=>img.evaluate((e:HTMLImageElement)=>e.complete&&e.naturalWidth>0&&e.naturalHeight>0)).toBe(true);
   const box=await img.boundingBox(),cardBox=await node.boundingBox();if(!box||!cardBox)throw Error(`Source image is not displayed: ${expected.id}/${id}`);
   expect(box.width).toBeGreaterThan(0);expect(box.height).toBeGreaterThan(0);expect(box.x+box.width).toBeLessThanOrEqual(cardBox.x+cardBox.width+1);
  }
  if(expected.table){
   expect(actual.table,expected.id).not.toBeNull();const headerless=(expected.table as typeof expected.table&{headerless?:true}).headerless;
   expect(actual.table!.headers).toEqual(headerless?[]:expected.table.columns.map(column=>column.zh||column.vi?`${column.zh} · ${column.vi}`:''));expect(actual.table!.rows.map(r=>r.id)).toEqual(expected.table.rows.map(r=>r.id));
   await expect(node.locator('.source-table-scroll')).toHaveAttribute('aria-label',`${(expected.table.caption??expected.title).zh} · ${(expected.table.caption??expected.title).vi}`);
   await expect(node.locator('.source-table-scroll')).toHaveAttribute('tabindex','0');
   for(const [r,row]of expected.table.rows.entries()){expect(actual.table!.rows[r]!.cells.length).toBe(expected.table.columns.length);for(const [c,cell]of row.cells.entries()){const actualCell=actual.table!.rows[r]!.cells[c]!;expect(actualCell.fields).toEqual(cell.fieldId?[cell.fieldId]:[]);if(cell.text){expect(actualCell.text).toContain(cell.text.zh);expect(actualCell.text).toContain(cell.text.vi);}}}
  }else expect(actual.table,expected.id).toBeNull();
 }
 if(lesson.numberTables){const numbers=host.locator('[data-source-numbers]');await expect(numbers).toBeVisible();if(!await numbers.evaluate((e:HTMLDetailsElement)=>e.open))await numbers.locator('summary').click();}
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
 test(`${hostName} HSK1 source catalogue optional self assessment permits blanks without grading`,async({page})=>{
  const lesson=requiredLesson(9),activity=lesson.activities.find(a=>a.fields.length>0&&a.fields.every(f=>f.required===false&&f.assessment==='ungraded'));
  if(!activity)throw Error('Lesson 9 must retain an optional ungraded self-assessment from the textbook.');
  await page.goto(route(9));await ready(page,9,expect);const primary=await primaryDomains(page),node=card(page,9,activity.id);
  for(const field of activity.fields)await expect(node.locator(`[data-source-field="${field.id}"]`)).not.toHaveAttribute('required','');
  await node.getByRole('button',{name:'保存并查看反馈'}).click();await expect(node.locator('.source-history summary')).toContainText('1次');
  await expect(node.locator('.activity-feedback')).toBeEmpty();
  const empty=(await sourceRecords(page))[sourceRecordKey(activity)];expect(empty.history).toHaveLength(1);expect(empty.history[0].values).toEqual({});
  const field=activity.fields[0]!,input=node.locator(`[data-source-field="${field.id}"]`),value=field.input==='select'?field.options![0]!.id:'需要复习 · Cần ôn tập';
  if(field.input==='select')await input.selectOption(value);else await input.fill(value);
  await node.getByRole('button',{name:'保存并查看反馈'}).click();await expect(node.locator('.source-history summary')).toContainText('2次');await expect(node.locator('.activity-feedback')).toContainText('不计分');await expect(node.locator('.activity-feedback')).not.toContainText('本空正确');
  await page.reload();await ready(page,9,expect);await expect(card(page,9,activity.id).locator(`[data-source-field="${field.id}"]`)).toHaveValue(value);await expect(card(page,9,activity.id).locator('.source-history summary')).toContainText('2次');expect(await primaryDomains(page)).toEqual(primary);
 });
 test(`${hostName} HSK1 source catalogue headerless month and weekday examples remain read only`,async({page})=>{
  requiredLesson(5);await page.setViewportSize({width:320,height:900});await page.goto(route(5));await ready(page,5,expect);const primary=await primaryDomains(page);
  const examples=[
   {id:'hsk1-original-2026-l05-p029-months-table-01',rows:2,words:['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月']},
   {id:'hsk1-original-2026-l05-p029-weekdays-table-row-01',rows:1,words:['星期一','星期二','星期三','星期四']},
   {id:'hsk1-original-2026-l05-p029-weekdays-table-row-02',rows:1,words:['星期五','星期六','星期日/星期天']}
  ];
  for(const example of examples){
   const node=card(page,5,example.id);await expect(node).toHaveAttribute('data-readonly','');await expect(node.locator('thead')).toHaveCount(0);await expect(node.locator('tbody>tr')).toHaveCount(example.rows);await expect(node.locator('[data-source-field],.source-history')).toHaveCount(0);await expect(node.getByRole('button',{name:'保存并查看反馈'})).toHaveCount(0);
   const words=await node.locator('tbody>tr>.bilingual-zh,tbody>tr>td>p>.bilingual-zh,tbody>tr>th>p>.bilingual-zh').allTextContents();expect(words.map(text=>text.split('\n')[1])).toEqual(example.words);await assertTableScroll(node.locator('.source-table-scroll'),page,expect);
  }
  expect(await sourceRecords(page)).toEqual({});await navigateWithinApp(page,route(9));await ready(page,9,expect);expect(await sourceRecords(page)).toEqual({});await navigateWithinApp(page,route(5));await ready(page,5,expect);await page.reload();await ready(page,5,expect);expect(await sourceRecords(page)).toEqual({});expect(await primaryDomains(page)).toEqual(primary);
 });
}
