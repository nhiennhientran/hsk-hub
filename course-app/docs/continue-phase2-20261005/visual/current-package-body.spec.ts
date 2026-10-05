import {test,expect,type Locator,type Page} from '@playwright/test';

async function fits(page:Page) {
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
}
async function inside(node:Locator,container:Locator) {
  const box=await node.boundingBox(),parent=await container.boundingBox();
  if(!box||!parent)throw Error('Expected visible body control missing');
  expect(box.x).toBeGreaterThanOrEqual(parent.x-1);
  expect(box.x+box.width).toBeLessThanOrEqual(parent.x+parent.width+1);
  return {box,font:await node.evaluate(n=>({family:getComputedStyle(n).fontFamily,size:getComputedStyle(n).fontSize}))};
}

for(const level of [2,3] as const)for(const width of [320,1440])
test(`current packaged HSK${level} body, free lesson choice and five manually assessed writing fields at ${width}px`,async({page,baseURL},info)=>{
  await page.addInitScript(()=>sessionStorage.setItem('hsk_portal_unlocked_v2','1'));
  await page.setViewportSize({width,height:900});
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  const entry=new URL(`./new-hsk${level}/hsk${level}/index.html`,baseURL!);
  const last=level===2?15:18;
  entry.hash=`view=lesson&level=${level}&lesson=${last}&section=text&scene=1`;
  await page.goto(entry.href);
  await expect(page.locator('#app')).toHaveAttribute('data-level',String(level));
  await expect(page.locator('#lesson-select')).toHaveValue(String(last));
  const textModule=page.locator('.textbook-module[data-section="text"]');
  await expect(textModule).toBeVisible();
  expect(await textModule.locator('.dialogue-text .dialogue-line').count()).toBeGreaterThan(0);
  await page.evaluate(()=>document.fonts.ready);await fits(page);
  const levels=page.locator('.level-switch [data-level]');await expect(levels).toHaveCount(3);
  for(const link of await levels.all())await inside(link,page.locator('.level-switch'));
  const selected=page.locator('#lesson-select');
  await expect(selected.locator('option')).toHaveCount(last);
  expect(await selected.locator('option').evaluateAll(ns=>ns.every(n=>!(n as HTMLOptionElement).disabled))).toBe(true);
  await selected.selectOption('1');await expect(selected).toHaveValue('1');
  await selected.selectOption(String(last));await expect(selected).toHaveValue(String(last));
  await expect(textModule).toBeVisible();
  expect(await textModule.locator('.dialogue-text .dialogue-line').count()).toBeGreaterThan(0);
  await page.evaluate(()=>document.fonts.ready);await fits(page);
  const controls=[];
  controls.push({kind:'lesson-selector',...(await inside(selected,page.locator('.lesson-tools')))});
  const textButtons=textModule.locator('button');
  expect(await textButtons.count()).toBeGreaterThan(0);
  for(const button of await textButtons.all())await inside(button,page.locator('main'));
  for(const image of await page.locator('main img').all()){
    await image.scrollIntoViewIfNeeded();
    await expect.poll(()=>image.evaluate(n=>(n as HTMLImageElement).complete&&(n as HTMLImageElement).naturalWidth>0)).toBe(true);
  }
  await page.screenshot({path:info.outputPath(`hsk${level}-${width}-text-body.png`),fullPage:true,animations:'disabled'});
  await info.attach(`hsk${level}-${width}-text-body.png`,{path:info.outputPath(`hsk${level}-${width}-text-body.png`),contentType:'image/png'});

  // Navigate through the actual package shell, then return to the original grade.
  const other=level===2?3:2;
  await page.locator(`.level-switch [data-level="${other}"]`).click();
  await expect(page.locator('#app')).toHaveAttribute('data-level',String(other));
  await page.locator(`.level-switch [data-level="${level}"]`).click();
  await expect(page.locator('#app')).toHaveAttribute('data-level',String(level));
  await page.goto(new URL(`#view=homework&level=${level}&lesson=${last}&part=writing`,entry.href).href);
  await expect(page.locator('#lesson-select')).toHaveValue(String(last));
  const fields=page.locator('#assignment textarea');await expect(fields).toHaveCount(5);
  await expect(page.locator('#assignment fieldset')).toHaveCount(5);
  for(const [i,field] of (await fields.all()).entries()){
    controls.push({kind:`writing-${i+1}`,...(await inside(field,page.locator('main')))});
    await field.fill(`视觉回归答案 ${i+1}`);
  }
  await page.locator('#assignment button[type=submit]').click();
  await expect(page.locator('#receipt')).toContainText('不自动评分');
  await expect(page.locator('#receipt')).toContainText('Không chấm tự động');
  const record=await page.evaluate(({key,part})=>JSON.parse(localStorage.getItem(key)!).data.homework[part],{
    key:`ran_hsk${level}_fltrp_2026_v1`,part:`hsk${level}-fltrp-2026:l${String(last).padStart(2,'0')}:writing`,
  });
  expect(record.latest.assessment).toBe('manual');expect(record.latest.total).toBe(5);
  expect(record.latest.correct).toBeNull();expect(record.latest.questionIds).toHaveLength(5);
  await page.reload();await expect(page.locator('#receipt')).toContainText('不自动评分');
  await expect(page.locator('#assignment textarea')).toHaveCount(5);
  await page.evaluate(()=>document.fonts.ready);await fits(page);
  await page.screenshot({path:info.outputPath(`hsk${level}-${width}-writing-receipt.png`),fullPage:true,animations:'disabled'});
  await info.attach(`hsk${level}-${width}-writing-receipt.png`,{path:info.outputPath(`hsk${level}-${width}-writing-receipt.png`),contentType:'image/png'});
  expect(errors).toEqual([]);
  await info.attach('package-body-scope.json',{body:JSON.stringify({
    entry:entry.href,width,level,lastLesson:last,controls,manualAssessment:record.latest.assessment,
    questionCount:record.latest.total,pageErrors:errors,
    scope:'Compiled DRAFT package only: final-lesson text body, grade switch, free first/final selection, five writing fields and saved/reloaded manual receipt. Original PNG manual review separately pending. No48-lesson semantic acceptance.',
  },null,2),contentType:'application/json'});
});
