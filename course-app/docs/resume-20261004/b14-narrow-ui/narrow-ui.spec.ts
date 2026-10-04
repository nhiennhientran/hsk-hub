import {test,expect,type Locator,type Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
import type {SourceLesson} from '../../../../hsk1-app/src/services/source-activities/content.ts';

type Surface='shared'|'standalone';
const source=JSON.parse(readFileSync(new URL('../../../../hsk1-app/content/source-activities/lesson-06.json',import.meta.url),'utf8')) as SourceLesson;
const activity=source.activities.find(row=>row.id==='hsk1-original-2026-l06-p042-classroom-table-01')!;
if(!activity?.table)throw Error('Missing actual original table fixture');
const book=JSON.parse(readFileSync(new URL('../../../../hsk1-app/content/textbook.json',import.meta.url),'utf8')) as {lessons:{scenes:{id:string;lines:{id:string;s:string;zh:string;py:string;vn:string}[]}[]}[]};
const scene=book.lessons[0].scenes[2];
const display=JSON.parse(readFileSync(new URL('../../../../hsk1-app/content/textbook-display-revisions.json',import.meta.url),'utf8')) as {changes:{lesson:number}[]};
if(display.changes.some(row=>row.lesson===1))throw Error('L1 expected copy must account for an actual display revision');
const route=(surface:Surface,lesson:number,section:string)=>surface==='shared'
  ?`/#view=lesson&level=1&lesson=${lesson}&section=${section}${section==='text'?'&scene=3':''}`
  :`/#/textbook?lesson=${lesson}&section=${section}${section==='text'?'&scene=3':''}`;

async function pageFits(page:Page){
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
}
async function glyphsInside(label:Locator,container:Locator){
  const bounds=await container.boundingBox();if(!bounds)throw Error('Missing visible container');
  const rectangles=await label.evaluate(node=>{
    const range=document.createRange();range.selectNodeContents(node);
    return [...range.getClientRects()].filter(r=>r.width>0&&r.height>0).map(r=>({x:r.x,y:r.y,width:r.width,height:r.height}));
  });
  expect(rectangles.length).toBeGreaterThan(0);
  for(const r of rectangles){
    expect(r.x).toBeGreaterThanOrEqual(bounds.x-1);expect(r.x+r.width).toBeLessThanOrEqual(bounds.x+bounds.width+1);
    expect(r.y).toBeGreaterThanOrEqual(bounds.y-1);expect(r.y+r.height).toBeLessThanOrEqual(bounds.y+bounds.height+1);
  }
  return {bounds,rectangles};
}
async function bilingualExact(node:Locator,copy:{zh:string;vi:string}){
  expect(await node.locator(':scope > [lang=zh]').textContent()).toBe(copy.zh);
  expect(await node.locator(':scope > [lang=vi]').textContent()).toBe(copy.vi);
}

for(const width of [320,390,768,1280,1440])test(`${width}px full nav captions, separated hidden roles and complete native table hints`,async({page},info)=>{
  const surface=info.project.metadata.surface as Surface;
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.setViewportSize({width,height:900});
  await page.addInitScript(()=>sessionStorage.setItem('hsk_portal_unlocked_v2','1'));
  await page.goto(route(surface,1,'text'));
  await expect(page.locator('#module-host')).toHaveAttribute('data-state','ready');
  await expect(page.locator('#scene-content')).toHaveAttribute('data-scene-id',scene.id);
  await page.evaluate(()=>document.fonts.ready);await pageFits(page);
  const nav=page.locator('nav.feature-nav'),links=nav.locator(':scope > a');await expect(links).toHaveCount(4);
  const copies=surface==='shared'?[
    {zh:'课程',vi:'Bài học'},{zh:'课后作业',vi:'Bài tập về nhà'},
    {zh:'练习与复习',vi:'Luyện tập & ôn tập'},{zh:'学习进度',vi:'Tiến độ học tập'},
  ]:[
    {zh:'课程',vi:'Bài học'},{zh:'课后作业',vi:'Bài tập'},
    {zh:'练习与复习',vi:'Luyện & ôn tập'},{zh:'进度',vi:'Tiến độ'},
  ];
  const navMetrics=[];
  for(const [index,copy]of copies.entries()){
    const link=links.nth(index);await bilingualExact(link,copy);
    const box=await link.boundingBox(),outer=await nav.boundingBox();if(!box||!outer)throw Error('Navigation is not visible');
    expect(box.x).toBeGreaterThanOrEqual(outer.x-1);expect(box.x+box.width).toBeLessThanOrEqual(outer.x+outer.width+1);
    navMetrics.push({copy,zh:await glyphsInside(link.locator(':scope > [lang=zh]'),link),vi:await glyphsInside(link.locator(':scope > [lang=vi]'),link)});
  }
  expect(await nav.evaluate(node=>node.scrollWidth<=node.clientWidth+1)).toBe(true);
  await page.screenshot({path:info.outputPath(`${surface}-${width}-shown-scene.png`),fullPage:true,animations:'disabled'});
  const cards=page.locator('#scene-content .textbook-line[data-line-id]');await expect(cards).toHaveCount(scene.lines.length);
  const originalRows=[];
  for(const [index,line]of scene.lines.entries()){
    const card=cards.nth(index);await expect(card).toHaveAttribute('data-line-id',line.id);
    expect(await card.locator(':scope > strong').textContent()).toBe(line.s);
    expect(await card.locator(':scope > [data-original-text] > p').allTextContents()).toEqual([line.zh,line.py,line.vn]);
    originalRows.push(await card.evaluate(node=>({children:[...node.children].map(child=>({tag:child.tagName,text:child.textContent,lineAudio:child.getAttribute('data-line-audio'),original:child.hasAttribute('data-original-text')}))})));
  }
  await page.locator('#text-show-original').uncheck();await expect(page.locator('#scene-content [data-original-text]:visible')).toHaveCount(0);
  const roleMetrics=[];
  for(const [index,line]of scene.lines.entries()){
    const card=cards.nth(index),role=card.locator(':scope > strong'),button=card.locator(':scope > button[data-line-audio]');
    await expect(button).toBeEnabled();await expect(button).toHaveAttribute('data-line-audio',line.id);
    const roleBounds=(await glyphsInside(role,card)).rectangles;
    const audio=await button.boundingBox();if(!audio)throw Error('Hidden-mode audio button is missing');
    const container=await card.boundingBox();if(!container)throw Error('Role card missing');
    expect(audio.x).toBeGreaterThanOrEqual(container.x-1);expect(audio.x+audio.width).toBeLessThanOrEqual(container.x+container.width+1);
    for(const r of roleBounds){
      const gap=Math.max(audio.x-r.x-r.width,r.x-audio.x-audio.width,audio.y-r.y-r.height,r.y-audio.y-audio.height);
      expect(gap,`${line.id}: role glyphs must not touch or overlap the audio control`).toBeGreaterThanOrEqual(6);
    }
    await bilingualExact(button,{zh:'听本句 · 教材原声',vi:'Nghe câu này · âm thanh gốc'});
    await glyphsInside(button.locator(':scope > [lang=zh]'),button);await glyphsInside(button.locator(':scope > [lang=vi]'),button);
    expect(await card.evaluate(node=>({children:[...node.children].map(child=>({tag:child.tagName,text:child.textContent,lineAudio:child.getAttribute('data-line-audio'),original:child.hasAttribute('data-original-text')}))}))).toEqual(originalRows[index]);
    roleMetrics.push({lineId:line.id,roleBounds,audio});
  }
  await pageFits(page);
  await page.screenshot({path:info.outputPath(`${surface}-${width}-hidden-scene.png`),fullPage:true,animations:'disabled'});
  await page.locator('#text-show-original').check();
  for(const [index,line]of scene.lines.entries()){
    await expect(cards.nth(index).locator(':scope > [data-original-text]')).toBeVisible();
    expect(await cards.nth(index).locator(':scope > [data-original-text] > p').allTextContents()).toEqual([line.zh,line.py,line.vn]);
  }
  await page.goto(route(surface,6,'practice'));
  await expect(page.locator('#module-host')).toHaveAttribute('data-state','ready');
  const card=page.locator(`[data-source-lesson="6"] [data-activity-id="${activity.id}"]`),table=card.locator('.source-activity-table'),scroll=card.locator('.source-table-scroll');
  await expect(card).toHaveAttribute('data-activity-version',activity.version);
  await page.evaluate(()=>document.fonts.ready);await card.scrollIntoViewIfNeeded();await pageFits(page);
  const headers=table.locator('thead > tr > th');await expect(headers).toHaveCount(activity.table!.columns.length);
  for(const [index,column]of activity.table!.columns.entries()){
    await expect(headers.nth(index)).toHaveAttribute('scope','col');
    if(column.zh||column.vi)await bilingualExact(headers.nth(index),column);
    else expect(await headers.nth(index).evaluate(node=>({text:node.textContent,children:node.childNodes.length}))).toEqual({text:'',children:0});
  }
  const rows=table.locator('tbody > tr');await expect(rows).toHaveCount(activity.table!.rows.length);
  for(const [index,row]of activity.table!.rows.entries()){
    const node=rows.nth(index);await expect(node).toHaveAttribute('data-source-row',row.id);
    const cells=node.locator(':scope > th,:scope > td');await expect(cells).toHaveCount(row.cells.length);
    for(const [column,cell]of row.cells.entries()){
      if(cell.text)await bilingualExact(cells.nth(column).locator(':scope > p'),cell.text);
      if(cell.fieldId)await expect(cells.nth(column).locator(`[data-source-field="${cell.fieldId}"]`)).toHaveCount(1);
      if(!cell.text&&!cell.fieldId)expect(await cells.nth(column).textContent()).toBe('');
    }
  }
  await expect(card.locator('[data-source-field]')).toHaveCount(activity.fields.length);
  const selectMetrics=[];
  for(const field of activity.fields){
    const control=card.locator(`[data-source-field="${field.id}"]`),fieldRow=control.locator('..');
    await bilingualExact(fieldRow.locator(':scope > label'),field.label);
    await expect(control).toHaveAttribute('id',`${activity.id}-${field.id}`);
    expect(await fieldRow.locator(':scope > .source-field-pinyin').allTextContents()).toEqual(field.pinyin?[field.pinyin]:[]);
    expect(await control.evaluate(node=>node.tagName.toLowerCase())).toBe(field.input==='text'?'input':field.input);
    if(field.input!=='select')continue;
    expect(await control.locator('option').evaluateAll(nodes=>nodes.map(node=>({value:(node as HTMLOptionElement).value,text:node.textContent})))).toEqual([
      {value:'',text:'请选择 · Hãy chọn'},...(field.options??[]).map(option=>({value:option.id,text:`${option.id}. ${option.zh} · ${option.py} · ${option.vi}`})),
    ]);
    const metrics=await control.evaluate(node=>{
      const input=node as HTMLSelectElement,css=getComputedStyle(input),canvas=document.createElement('canvas'),ctx=canvas.getContext('2d')!;
      ctx.font=`${css.fontStyle} ${css.fontWeight} ${css.fontSize} ${css.fontFamily}`;
      const hint=input.options[0].text,measuredTextWidth=ctx.measureText(hint).width;
      const usableWidth=input.clientWidth-parseFloat(css.paddingLeft)-parseFloat(css.paddingRight);
      return {hint,measuredTextWidth,usableWidth,clientWidth:input.clientWidth,font:ctx.font,fontSize:css.fontSize,paddingLeft:css.paddingLeft,paddingRight:css.paddingRight,nativeArrowReserve:32};
    });
    // Native select scrollWidth does not measure its painted selected label.
    // Font width + padding + arrow reserve is a geometric guard, followed by original native PNG review.
    await info.attach(`${surface}-${width}-${field.id}-native-font-width.json`,{body:JSON.stringify({fieldId:field.id,...metrics},null,2),contentType:'application/json'});
    expect(metrics.hint).toBe('请选择 · Hãy chọn');expect(parseFloat(metrics.fontSize)).toBeGreaterThanOrEqual(16);
    expect(metrics.usableWidth).toBeGreaterThanOrEqual(metrics.measuredTextWidth+metrics.nativeArrowReserve+2);
    await control.scrollIntoViewIfNeeded();await pageFits(page);
    await control.screenshot({path:info.outputPath(`${surface}-${width}-${field.id}-closed-select.png`),animations:'disabled'});
    selectMetrics.push({fieldId:field.id,...metrics});
  }
  expect(await scroll.evaluate(node=>getComputedStyle(node).overflowX)).toBe('auto');
  const region=await scroll.boundingBox(),owner=await card.boundingBox();if(!region||!owner)throw Error('Table region missing');
  expect(region.x).toBeGreaterThanOrEqual(owner.x-1);expect(region.x+region.width).toBeLessThanOrEqual(owner.x+owner.width+1);
  await scroll.evaluate(node=>{node.scrollLeft=0;});
  await card.screenshot({path:info.outputPath(`${surface}-${width}-table.png`),animations:'disabled'});
  await pageFits(page);expect(errors).toEqual([]);
  await info.attach('layout-and-source-binding.json',{body:JSON.stringify({surface,width,sourceActivity:activity.id,navMetrics,roleMetrics,selectMetrics,fieldCount:activity.fields.length,columns:activity.table!.columns,rowIds:activity.table!.rows.map(row=>row.id),pageErrors:errors},null,2),contentType:'application/json'});
});
