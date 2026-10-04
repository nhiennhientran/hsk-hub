import {test, expect, type Locator, type Page} from '@playwright/test';
import {writeFileSync} from 'node:fs';
import {sourceLessons, type SourceActivity, type SourceField} from '../../../hsk1-app/src/services/source-activities/content.ts';

interface BoxEvidence {x:number; y:number; width:number; height:number; clientWidth:number; scrollWidth:number}
interface FieldEvidence {
  lesson:number; activityId:string; activityVersion:string; fieldId:string;
  label:SourceField['label']; pinyin:string; source:SourceActivity['source'];
  box:BoxEvidence; fontFamily:string;
}
interface TableEvidence {
  lesson:number; activityId:string; activityVersion:string; source:SourceActivity['source'];
  columns:NonNullable<SourceActivity['table']>['columns']; blankHeaderIndexes:number[];
  rowCount:number; blankBodyCells:number; wrapper:BoxEvidence;
}

async function box(node:Locator):Promise<BoxEvidence> {
  return node.evaluate(element=>{
    const rect=element.getBoundingClientRect();
    return {x:rect.x,y:rect.y,width:rect.width,height:rect.height,
      clientWidth:element.clientWidth,scrollWidth:element.scrollWidth};
  });
}
async function wholePageFits(page:Page):Promise<void> {
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
}
async function visibleWithinCard(node:Locator,card:Locator):Promise<BoxEvidence> {
  await expect(node).toBeVisible();
  const current=await box(node),parent=await box(card);
  expect(current.width).toBeGreaterThan(0);expect(current.height).toBeGreaterThan(0);
  expect(current.x).toBeGreaterThanOrEqual(parent.x-1);
  expect(current.x+current.width).toBeLessThanOrEqual(parent.x+parent.width+1);
  // Inline bilingual spans can have clientWidth=0; their visible box is checked above.
  if(current.clientWidth>0)expect(current.scrollWidth).toBeLessThanOrEqual(current.clientWidth+1);
  return current;
}

for(const width of [320,1440])test(`HSK1 printed field pinyin and original empty table headers visual evidence at ${width}`,async({page},testInfo)=>{
  test.setTimeout(120_000);
  const stemLessons=sourceLessons.filter(lesson=>[12,13,14,15].includes(lesson.lesson));
  const tableLessons=sourceLessons.filter(lesson=>[3,6,7].includes(lesson.lesson));
  const expectedFields=stemLessons.flatMap(lesson=>lesson.activities.flatMap(activity=>activity.fields.filter(field=>field.pinyin)));
  const expectedTables=tableLessons.flatMap(lesson=>lesson.activities.filter(activity=>activity.table?.columns.some(column=>column.zh===''&&column.vi==='')));
  expect(stemLessons.map(lesson=>lesson.lesson)).toEqual([12,13,14,15]);
  expect(tableLessons.map(lesson=>lesson.lesson)).toEqual([3,6,7]);
  expect(expectedFields).toHaveLength(24);expect(expectedTables).toHaveLength(5);
  await page.addInitScript(()=>sessionStorage.setItem('hsk_portal_unlocked_v2','1'));
  await page.setViewportSize({width,height:900});
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  const fields:FieldEvidence[]=[],tables:TableEvidence[]=[],screenshots:string[]=[];
  const visit=async(lesson:number)=>{
    await page.goto(`/#view=lesson&level=1&lesson=${lesson}&section=practice`);
    await expect(page.locator('#module-host')).toHaveAttribute('data-state','ready');
    await expect(page.locator(`[data-source-lesson="${lesson}"]`)).toBeVisible();
    await page.evaluate(()=>document.fonts.ready);
    await wholePageFits(page);
  };
  const capture=async(card:Locator,name:string)=>{
    await card.scrollIntoViewIfNeeded();await wholePageFits(page);
    const file=`${testInfo.project.name}-${width}-${name}.png`;
    await card.screenshot({path:testInfo.outputPath(file),animations:'disabled'});
    screenshots.push(file);
  };
  for(const lesson of stemLessons){
    await visit(lesson.lesson);
    const host=page.locator(`[data-source-lesson="${lesson.lesson}"]`);
    for(const activity of lesson.activities.filter(activity=>activity.fields.some(field=>field.pinyin))){
      const card=host.locator(`[data-activity-id="${activity.id}"]`);
      await card.scrollIntoViewIfNeeded();await expect(card).toHaveAttribute('data-activity-version',activity.version);
      await expect(card.locator('.source-field-pinyin')).toHaveCount(activity.fields.filter(field=>field.pinyin).length);
      for(const field of activity.fields){
        if(!field.pinyin)continue;
        const row=card.locator('.activity-field').filter({has:page.locator(`[data-source-field="${field.id}"]`)});
        await expect(row).toHaveCount(1);
        const label=row.locator('label'),zh=label.locator('.bilingual-zh'),vi=label.locator('.bilingual-vi'),pinyin=row.locator('.source-field-pinyin');
        expect(await zh.textContent()).toBe(field.label.zh);expect(await vi.textContent()).toBe(field.label.vi);
        expect(await pinyin.textContent()).toBe(field.pinyin);
        await visibleWithinCard(label,card);await visibleWithinCard(zh,card);await visibleWithinCard(vi,card);
        const pinyinBox=await visibleWithinCard(pinyin,card);
        await wholePageFits(page);
        fields.push({lesson:lesson.lesson,activityId:activity.id,activityVersion:activity.version,
          fieldId:field.id,label:field.label,pinyin:field.pinyin,source:field.source??activity.source,
          box:pinyinBox,fontFamily:await pinyin.evaluate(element=>getComputedStyle(element).fontFamily)});
      }
      await capture(card,activity.id);
    }
  }
  for(const lesson of tableLessons){
    await visit(lesson.lesson);
    const host=page.locator(`[data-source-lesson="${lesson.lesson}"]`);
    for(const activity of lesson.activities.filter(activity=>activity.table?.columns.some(column=>column.zh===''&&column.vi===''))){
      const sourceTable=activity.table!;
      expect(sourceTable.headerless).toBeUndefined();
      const card=host.locator(`[data-activity-id="${activity.id}"]`),table=card.locator('.source-activity-table'),wrap=card.locator('.source-table-scroll');
      await card.scrollIntoViewIfNeeded();await expect(card).toHaveAttribute('data-activity-version',activity.version);
      await expect(table).toHaveCount(1);await expect(table.locator('thead>tr')).toHaveCount(1);
      const headers=table.locator('thead>tr>th');await expect(headers).toHaveCount(sourceTable.columns.length);
      const blankHeaderIndexes:number[]=[];
      for(const [index,column]of sourceTable.columns.entries()){
        const header=headers.nth(index);await expect(header).toHaveAttribute('scope','col');
        if(column.zh===''&&column.vi===''){
          blankHeaderIndexes.push(index);await expect(header).toBeVisible();
          expect(await header.textContent()).toBe('');
          expect(await header.evaluate(element=>element.childNodes.length)).toBe(0);
          await expect(header.locator('.bilingual-separator')).toHaveCount(0);
          expect((await box(header)).width).toBeGreaterThan(0);
        }else{
          expect(await header.locator('.bilingual-zh').textContent()).toBe(column.zh);
          expect(await header.locator('.bilingual-vi').textContent()).toBe(column.vi);
        }
      }
      const rows=table.locator('tbody>tr');await expect(rows).toHaveCount(sourceTable.rows.length);
      let blankBodyCells=0;
      for(const [index,sourceRow]of sourceTable.rows.entries()){
        const row=rows.nth(index);await expect(row).toHaveAttribute('data-source-row',sourceRow.id);
        const cells=row.locator(':scope>th,:scope>td');await expect(cells).toHaveCount(sourceTable.columns.length);
        for(const [cellIndex,sourceCell]of sourceRow.cells.entries())if(!sourceCell.text&&!sourceCell.fieldId){
          blankBodyCells++;expect(await cells.nth(cellIndex).textContent()).toBe('');
          expect(await cells.nth(cellIndex).evaluate(element=>element.childNodes.length)).toBe(0);
        }
      }
      // Original wide tables scroll inside their region on mobile, never the document.
      const wrapper=await box(wrap),cardBox=await box(card);
      expect(wrapper.width).toBeGreaterThan(0);expect(wrapper.x).toBeGreaterThanOrEqual(cardBox.x-1);
      expect(wrapper.x+wrapper.width).toBeLessThanOrEqual(cardBox.x+cardBox.width+1);
      expect(await wrap.evaluate(element=>getComputedStyle(element).overflowX)).toBe('auto');
      await wholePageFits(page);await capture(card,activity.id);
      tables.push({lesson:lesson.lesson,activityId:activity.id,activityVersion:activity.version,source:activity.source,
        columns:sourceTable.columns,blankHeaderIndexes,rowCount:sourceTable.rows.length,blankBodyCells,wrapper});
    }
  }
  expect(fields).toHaveLength(24);expect(tables).toHaveLength(5);expect(screenshots).toHaveLength(17);expect(errors).toEqual([]);
  const evidence={viewport:{width,height:900},project:testInfo.project.name,
    userAgent:await page.evaluate(()=>navigator.userAgent),fieldCount:fields.length,tableCount:tables.length,
    fields,tables,screenshots,scope:'Exact current source strings, visible boxes, empty-cell topology and Chromium/WebKit viewport PNG evidence; glyph correctness requires separate visual review of actual remote Noto PNGs.',
    glyphFontCertification:false};
  const path=testInfo.outputPath('source-font-evidence.json');writeFileSync(path,JSON.stringify(evidence,null,2)+'\n');
  await testInfo.attach('source-font-evidence.json',{path,contentType:'application/json'});
});
