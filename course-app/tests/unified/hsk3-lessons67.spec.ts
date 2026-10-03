import {test, expect} from '@playwright/test';
import lesson6 from '../../content/hsk3/lesson-06.json' with {type:'json'};
import lesson7 from '../../content/hsk3/lesson-07.json' with {type:'json'};
import {activityReady, expectLessonReady, openLesson, singleAnswerFields, sourceActivity, submitIncomplete, submitSaved} from './lesson-ready.ts';

test.beforeEach(async ({page}) => page.addInitScript(() => sessionStorage.setItem('hsk_portal_unlocked_v2','1')));
for (const width of [320,390,768,1440]) for (const lesson of [lesson6,lesson7]) {
  test(`HSK3 lesson ${lesson.number} source-specific textbook views at ${width}`, async ({page}) => {
    const errors:string[] = [], seen = new Set<string>();
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({width,height:900});
    for (const section of ['overview','vocab','text','grammar','hanzi','practice','culture']) {
      for (const scene of section === 'text' ? [1,2,3,4] : [1]) {
        await openLesson(page,lesson,section,scene);
        if (section === 'hanzi') await expect(page.locator('[data-hanzi-mode]')).toHaveAttribute('data-hanzi-mode','display');
        for (const id of await page.locator('[data-activity-id]').evaluateAll(nodes => nodes.map(n => (n as HTMLElement).dataset.activityId!))) {
          expect(seen.has(id),'Duplicate visible source activity '+id).toBe(false);seen.add(id);
          const activity = lesson.activities.find(a => a.id === id)!;
          await activityReady(page,activity);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth+1)).toBe(true);
        for (const image of await page.locator('main img').all()) {
          await image.scrollIntoViewIfNeeded();
          await expect.poll(() => image.evaluate((img:HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
        }
        if (section === 'overview') {
          const objectives = await activityReady(page,sourceActivity(lesson,'objectives'));
          await expect(objectives.locator('input[type=checkbox]')).toHaveCount(4);
          const warmup = await activityReady(page,sourceActivity(lesson,lesson.number === 6 ? 'warmup1-matching' : 'warmup1-measure-words'));
          await expect(warmup.locator('img')).toHaveCount(6);
          await expect(warmup.locator(lesson.number === 6 ? 'select' : 'input[type=text]')).toHaveCount(6);
        }
        if (section === 'text') {
          await expect(page.locator('main img')).toHaveCount(lesson.number === 6 && scene === 3 ? 0 : 1);
          const reading = await activityReady(page,sourceActivity(lesson,`text${scene}-reading`));
          await expect(reading.locator('textarea')).toHaveCount(3);
        }
        if (section === 'grammar') await expect(page.locator('main img')).toHaveCount(lesson.number === 6 ? 0 : 3);
        if (section === 'practice') {
          for (const [i,count] of (lesson.number === 6 ? [4,3,3] : [4,4,4]).entries()) {
            const group = await activityReady(page,sourceActivity(lesson,`picture-dialogue${i+1}`));
            await expect(group.locator('input')).toHaveCount(count);await expect(group.locator('img')).toHaveCount(1);
          }
          const group = await activityReady(page,sourceActivity(lesson,'classroom-group'));
          await expect(group.locator('textarea')).toHaveCount(lesson.number === 6 ? 5 : 1);
          await expect(group.locator('img')).toHaveCount(lesson.number === 6 ? 0 : 2);
        }
        if (section === 'culture') {
          await expect(page.locator('main')).toContainText(`${lesson.number}-1`);
          const unavailable=lesson.sections.filter(s=>s.kind==='culture').flatMap(s=>s.blocks).filter(b=>b.source.provenance==='supplemental'&&b.zh.includes('没有这个文化视频'));
          expect(unavailable).toHaveLength(1);
          await expect(page.locator('main')).toContainText(unavailable[0].zh);await expect(page.locator('main')).toContainText(unavailable[0].vi);
          await expect(page.locator('main img')).toHaveCount(1);await expect(page.locator('main video,main audio')).toHaveCount(0);
          if (lesson.number === 6) {const review=await activityReady(page,sourceActivity(lesson,'review-grammar'));await expect(review.locator('tbody tr')).toHaveCount(10);await expect(review.locator('input[type=checkbox]')).toHaveCount(20)}
          else {await expect(page.locator('[data-activity-id*=review-]')).toHaveCount(0);await expect(page.locator('main')).toContainText('买二送一');await expect(page.locator('main')).toContainText('不甜不要钱')}
        }
        if ((width === 390 || width === 1440) && scene === 1) {await page.evaluate(() => scrollTo(0,0));await page.screenshot({path:`test-results/unified-hsk3-lesson${lesson.number}-${section}-${width}.png`,fullPage:true})}
      }
    }
    expect([...seen].sort()).toEqual(lesson.activities.map(a => a.id).sort());expect(errors).toEqual([]);
  });
}

test('HSK3 lesson6 ten-row review keeps twenty independent checks and cross-page vocabulary', async ({page}) => {
  await page.setViewportSize({width:320,height:900});await openLesson(page,lesson6,'culture');
  const ga=sourceActivity(lesson6,'review-grammar'),va=sourceActivity(lesson6,'review-vocabulary'),ea=sourceActivity(lesson6,'review-effort');
  const g=await activityReady(page,ga),v=await activityReady(page,va),e=await activityReady(page,ea);
  await expect(g.locator('tbody tr')).toHaveCount(10);await expect(g.locator('input')).toHaveCount(20);
  await expect(g.locator(':scope > .source-note')).toContainText('56');await expect(v.locator(':scope > .source-note')).toContainText('55');
  for(let i=0;i<20;i++) await g.locator('input').nth(i).setChecked([0,3,18].includes(i));
  await v.locator('textarea').nth(0).fill('高铁、沙发');await v.locator('textarea').nth(1).fill('检票');await e.locator('textarea').fill('练习说明乘车步骤');
  await submitSaved(page,lesson6,ga);await submitSaved(page,lesson6,va);await submitSaved(page,lesson6,ea);
  await page.reload();await expectLessonReady(page,lesson6,'culture');await activityReady(page,ga);
  for(let i=0;i<20;i++) if([0,3,18].includes(i)) await expect(g.locator('input').nth(i)).toBeChecked();else await expect(g.locator('input').nth(i)).not.toBeChecked();
  await expect(v.locator('textarea').nth(0)).toHaveValue('高铁、沙发');await expect(v.locator('textarea').nth(1)).toHaveValue('检票');await expect(e.locator('textarea')).toHaveValue('练习说明乘车步骤');
  await expect(g.locator('.feedback-correct,.feedback-retry')).toHaveCount(0);
});

test('HSK3 lesson6 official word keys retain split source and answer boundaries', async ({page}) => {
  await openLesson(page,lesson6,'practice');
  for(const bank of [1,2]) {
    const a=sourceActivity(lesson6,`comprehensive-words${bank}`),fields=singleAnswerFields(a),group=await activityReady(page,a);
    expect(fields.map(f=>f.answer)).toEqual(bank===1?['刷','以前','该','急','后来']:['小心','检查','打算','选择','必须']);
    for(const field of fields) await page.locator(`[id="${field.id}"]`).selectOption(field.answer);
    await submitSaved(page,lesson6,a);await expect(group.locator('.feedback-correct')).toHaveCount(5);
    if(bank===1){await expect(group).toContainText('PDF第8页');await expect(group).toContainText('PDF第9页');for(const[i,p]of[53,53,53,53,54].entries())await expect(group.locator('.activity-field .source-note').nth(i)).toContainText(String(p))}
    else await expect(group).toContainText('PDF第9页');
  }
  await page.reload();await expectLessonReady(page,lesson6,'practice');await expect(page.locator('[data-activity-id*=comprehensive-words] .feedback-correct')).toHaveCount(10);
});

test('HSK3 lesson6 five travel topics enforce complete responses before durable open feedback', async ({page}) => {
  await openLesson(page,lesson6,'practice');const a=sourceActivity(lesson6,'classroom-group'),g=await activityReady(page,a);
  await expect(g.locator('textarea')).toHaveCount(5);await expect(g).toContainText('zěnme bàn');await expect(g).toContainText('仅用于语言练习');
  await g.locator('textarea').nth(0).fill('虚构旅行：通过购票窗口');await submitIncomplete(page,a);
  for(let i=1;i<5;i++) await g.locator('textarea').nth(i).fill(`虚构旅行讨论${i+1}`);
  await submitSaved(page,lesson6,a);await expect(g).toContainText('这是开放任务');await expect(g.locator('.feedback-correct,.feedback-retry')).toHaveCount(0);
  await page.reload();await expectLessonReady(page,lesson6,'practice');await activityReady(page,a);
  await expect(g.locator('textarea').nth(0)).toHaveValue('虚构旅行：通过购票窗口');for(let i=1;i<5;i++)await expect(g.locator('textarea').nth(i)).toHaveValue(`虚构旅行讨论${i+1}`);
});

test('HSK3 lesson7 typed measure words grade each image without converting to choice matching', async ({page}) => {
  await page.setViewportSize({width:320,height:900});await openLesson(page,lesson7,'overview');
  const a=sourceActivity(lesson7,'warmup1-measure-words'),fields=singleAnswerFields(a),g=await activityReady(page,a);
  expect(fields.map(f=>f.answer)).toEqual(['个','斤','辆','条','毛','条']);await expect(g.locator('select')).toHaveCount(0);await expect(g.locator('img')).toHaveCount(6);await expect(g).toContainText('1KG');
  await submitIncomplete(page,a);
  for(const f of fields)await page.locator(`[id="${f.id}"]`).fill(f.answer);
  await submitSaved(page,lesson7,a);await expect(g.locator('.feedback-correct')).toHaveCount(6);await expect(g).toContainText('PDF第9页');
  await page.locator(`[id="${fields[1].id}"]`).fill('公斤');await expect(g.locator('.activity-feedback')).toBeEmpty();await submitSaved(page,lesson7,a);
  await expect(g.locator('.feedback-correct')).toHaveCount(5);await expect(g.locator('.feedback-retry')).toHaveCount(1);
  await page.reload();await expectLessonReady(page,lesson7,'overview');await expect(page.locator(`[id="${fields[1].id}"]`)).toHaveValue('公斤');await expect(g.locator('.feedback-retry')).toHaveCount(1);
});

test('HSK3 lesson7 source explanation and subject groups preserve original grammar and exact pictures', async ({page}) => {
  await openLesson(page,lesson7,'grammar');
  for(let i=1;i<=3;i++){const g=await activityReady(page,sourceActivity(lesson7,`grammar1-practice${i}`));await expect(g.locator('img')).toHaveCount(1);await expect(g.locator('figure')).toHaveAttribute('data-illustration-id',`hsk3-fltrp-2026:l07:illustration:grammar1-${i}`)}
  const section=page.locator('.lesson-section.grammar').nth(1),literal=section.locator('.grammar-source-explanation');
  await expect(literal).toHaveCount(1);await expect(literal).toContainText('A和B差不多');await expect(literal).toContainText(lesson7.grammarSourceExplanations[0].explanation.vi);await expect(literal.locator('.source-note')).toContainText('61');
  await expect(section).toContainText(lesson7.grammar[1].explanation.zh);await expect(section).toContainText(lesson7.grammar[1].explanation.vi);await expect(section.locator('.example')).toHaveCount(3);
  const corrected=await activityReady(page,sourceActivity(lesson7,'grammar2-practice1'));await expect(corrected).toContainText('天中学中文的时间长');await expect(corrected).not.toContainText('时间更长');await expect(corrected).not.toContainText('lâu hơn');await expect(corrected).toContainText('cao hơn Gia Nguyệt');
  const grouped=page.locator('.lesson-section.grammar').nth(3);await expect(grouped.locator('.grammar-explanation-group')).toHaveCount(2);await expect(grouped.locator('.example')).toHaveCount(3);
  for(const[i,group]of lesson7.grammarPresentations[0].groups.entries()){const panel=grouped.locator('.grammar-explanation-group').nth(i);await expect(panel).toContainText(group.explanation.zh);await expect(panel).toContainText(group.explanation.vi);for(const[j,k]of group.exampleIndices.entries()){await expect(panel.locator('.example').nth(j).locator('.chinese-line')).toHaveText(lesson7.grammar[3].examples[k].zh)}}
  const cross=page.locator('.lesson-section.grammar').nth(2);await expect(cross.locator(':scope > .source-note')).toContainText('62');await expect(cross.locator('.example > .source-note')).toHaveCount(3);for(const note of await cross.locator('.example > .source-note').all())await expect(note).toContainText('63');
  await openLesson(page,lesson7,'text',2);
  const listening=sourceActivity(lesson7,'text2-listening'),fields=singleAnswerFields(listening),group=await activityReady(page,listening);
  expect(fields.map(f=>f.answer)).toEqual(['裙子','看看再说']);
  for(const field of fields)await page.locator(`[id="${field.id}"]`).selectOption(field.answer);
  await submitSaved(page,lesson7,listening);await expect(group.locator('.feedback-correct')).toHaveCount(2);
  await expect(group).toContainText('PDF第9页');await expect(group).toContainText('PDF第10页');

});

test('HSK3 lesson7 twelve picture blanks and two group scenes remain independent after reload', async ({page}) => {
  await openLesson(page,lesson7,'practice');
  const hintGroups=page.locator('.picture-editorial-hints');
  await expect(hintGroups).toHaveCount(3);
  const hintBlocks=lesson7.sections.filter(s=>['practice','activity'].includes(s.kind)).map(s=>s.blocks.filter(b=>b.kind==='paragraph'&&b.source.provenance==='supplemental'&&/^图片(?:描述|说明)/.test(b.zh))).filter(xs=>xs.length);
  expect(hintBlocks).toHaveLength(3);
  for(const[i,blocks]of hintBlocks.entries()){
    const details=hintGroups.nth(i);await expect(details).not.toHaveAttribute('open','');await expect(details.locator('p')).toHaveCount(blocks.length);
    for(const p of await details.locator('p').all())await expect(p).toBeHidden();
    await details.locator('summary').click();for(const[j,b]of blocks.entries()){await expect(details.locator('p').nth(j)).toContainText(b.zh);await expect(details.locator('p').nth(j)).toContainText(b.vi)}
    await details.locator('summary').click();await expect(details.locator('p').first()).toBeHidden();
  }
  expect(await hintGroups.nth(1).evaluate(node=>[...document.querySelectorAll('[data-activity-id*=picture-dialogue]')].every(card=>!!(card.compareDocumentPosition(node)&Node.DOCUMENT_POSITION_FOLLOWING)))).toBe(true);
  expect(await hintGroups.nth(2).evaluate(node=>!!(document.querySelector('[data-activity-id$=classroom-group]')!.compareDocumentPosition(node)&Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
  for(let i=1;i<=3;i++){const a=sourceActivity(lesson7,`picture-dialogue${i}`),g=await activityReady(page,a);await expect(g.locator('input')).toHaveCount(4);for(let j=0;j<4;j++)await g.locator('input').nth(j).fill(`自拟表达${i}-${j}`);await submitSaved(page,lesson7,a);await expect(g).toContainText('不是唯一答案');await expect(g.locator('.feedback-correct,.feedback-retry')).toHaveCount(0)}
  const a=sourceActivity(lesson7,'classroom-group'),g=await activityReady(page,a);await expect(g.locator('img')).toHaveCount(2);await expect(g).toContainText('他穿着一件白衣服');await expect(g).toContainText('他跟朋友一起坐着聊天儿');await g.locator('textarea').fill('他穿着白衣服。\n她跟朋友坐着聊天儿。');await submitSaved(page,lesson7,a);await expect(g).toContainText('这是开放任务');
  await page.reload();await expectLessonReady(page,lesson7,'practice');for(let i=1;i<=3;i++){const group=await activityReady(page,sourceActivity(lesson7,`picture-dialogue${i}`));for(let j=0;j<4;j++)await expect(group.locator('input').nth(j)).toHaveValue(`自拟表达${i}-${j}`)}await expect(g.locator('textarea')).toHaveValue('他穿着白衣服。\n她跟朋友坐着聊天儿。');
});
