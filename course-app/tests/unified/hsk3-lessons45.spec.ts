import {test, expect} from '@playwright/test';
import lesson4 from '../../content/hsk3/lesson-04.json' with {type:'json'};
import lesson5 from '../../content/hsk3/lesson-05.json' with {type:'json'};
import {activityReady, expectLessonReady, openLesson, singleAnswerFields, sourceActivity, submitSaved} from './lesson-ready.ts';

test.beforeEach(async ({page}) => page.addInitScript(() => sessionStorage.setItem('hsk_portal_unlocked_v2', '1')));
for (const width of [320,390,768,1440]) for (const lesson of [lesson4,lesson5]) {
  test(`HSK3 lesson ${lesson.number} source-specific textbook views at ${width}`, async ({page}) => {
    const errors:string[] = [], seen = new Set<string>();
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({width,height:900});
    for (const section of ['overview','vocab','text','grammar','hanzi','practice','culture']) {
      for (const scene of section === 'text' ? [1,2,3,4] : [1]) {
        await openLesson(page,lesson,section,scene);
        if (section === 'hanzi') await expect(page.locator('[data-hanzi-mode]')).toHaveAttribute('data-hanzi-mode','display');
        for (const id of await page.locator('[data-activity-id]').evaluateAll(nodes => nodes.map(n => (n as HTMLElement).dataset.activityId!))) {
          expect(seen.has(id), 'Duplicate visible source activity ' + id).toBe(false); seen.add(id);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
        for (const image of await page.locator('main img').all()) {
          await image.scrollIntoViewIfNeeded();
          await expect.poll(() => image.evaluate((img:HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
        }
        if (section === 'overview') {
          const warmup = await activityReady(page,sourceActivity(lesson,'warmup1-matching'));
          await expect(warmup.locator('img')).toHaveCount(6);
          await expect(warmup.locator('select')).toHaveCount(6);
        }
        if (section === 'text') {
          const images = lesson.number === 4 ? [1,1,0,1] : [1,3,1,1];
          await expect(page.locator('main img')).toHaveCount(images[scene-1]);
          await activityReady(page,sourceActivity(lesson,`text${scene}-listening`));
          const reading = await activityReady(page,sourceActivity(lesson,`text${scene}-reading`));
          await expect(reading.locator('textarea')).toHaveCount(3);
        }
        if (section === 'practice') {
          const counts = lesson.number === 4 ? [3,4,4] : [3,3,4];
          for (const [i,count] of counts.entries()) {
            const group = await activityReady(page,sourceActivity(lesson,`picture-dialogue${i+1}`));
            await expect(group.locator('input')).toHaveCount(count);
            await expect(group.locator('img')).toHaveCount(1);
          }
          const hints = page.locator('.picture-editorial-hints');
          const paragraphs = lesson.sections.flatMap(s => ['practice','activity'].includes(s.kind) ? s.blocks.filter(b => b.source.provenance === 'supplemental' && /^图片(?:描述|说明)/.test(b.zh)) : []);
          expect(paragraphs).toHaveLength(2);
          await expect(hints).toHaveCount(1);
          await expect(hints.locator('p')).toHaveCount(2);
          await expect(hints).not.toHaveAttribute('open','');
          for (const p of await hints.locator('p').all()) await expect(p).toBeHidden();
          expect(await hints.evaluate(node => [...document.querySelectorAll('[data-activity-id*=picture-dialogue]')].every(card => !!(card.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING)))).toBe(true);
          await hints.locator('summary').click();
          for (const [i,p] of paragraphs.entries()) {await expect(hints.locator('p').nth(i)).toContainText(p.zh);await expect(hints.locator('p').nth(i)).toContainText(p.vi)}
          await hints.locator('summary').click();await expect(hints.locator('p').first()).toBeHidden();
        }
        if (section === 'culture' && lesson.number === 4) {
          await expect(page.locator('main')).toContainText('本课没有单独的拓展或学习小结页');
          await expect(page.locator('main img, main video, main audio')).toHaveCount(0);
        }
        if (section === 'culture' && lesson.number === 5) {
          await expect(page.locator('main')).toContainText('明天又是星期天');
          await expect(page.locator('main')).toContainText('5-1');
          await expect(page.locator('main')).toContainText('没有该文化视频');
          await expect(page.locator('main video, main audio')).toHaveCount(0);
          await expect(page.locator('main img')).toHaveCount(1);
        }
        if ((width === 390 || width === 1440) && scene === 1) {
          await page.evaluate(() => scrollTo(0,0));
          await page.screenshot({path:`test-results/unified-hsk3-lesson${lesson.number}-${section}-${width}.png`,fullPage:true});
        }
      }
    }
    expect([...seen].sort()).toEqual(lesson.activities.map(a => a.id).sort());
    expect(errors).toEqual([]);
  });
}

test('HSK3 lesson4 grouped source explanations preserve every original example and split answer pages', async ({page}) => {
  await page.setViewportSize({width:320,height:900});
  await openLesson(page,lesson4,'grammar');
  for (const index of [0,2]) {
    const grammar = lesson4.grammar[index], presentation = lesson4.grammarPresentations.find(p => p.grammarId === grammar.id)!;
    const section = page.locator('.lesson-section.grammar').nth(index);
    await expect(section).toContainText(grammar.explanation.zh);await expect(section).toContainText(grammar.explanation.vi);
    await expect(section.locator('.grammar-explanation-group')).toHaveCount(index === 0 ? 3 : 2);
    await expect(section.locator('.example')).toHaveCount(index === 0 ? 6 : 4);
    for (const [i,group] of presentation.groups.entries()) {
      const panel = section.locator('.grammar-explanation-group').nth(i);
      await expect(panel).toContainText(group.explanation.zh);await expect(panel).toContainText(group.explanation.vi);
      for (const [j,exampleIndex] of group.exampleIndices.entries()) {
        const example = grammar.examples[exampleIndex], visible = panel.locator('.example').nth(j);
        await expect(visible.locator('.chinese-line')).toHaveText(example.zh);
        await expect(visible.locator('.pinyin-visible')).toHaveText(example.py);
        await expect(visible).toContainText(example.vi);
      }
    }
  }
  const crossPage = page.locator('.lesson-section.grammar').nth(1);
  expect(lesson4.grammar[1].source).toMatchObject({pdfPage:44,printedPage:32});
  await expect(crossPage.locator(':scope > .source-note')).toContainText('教材第32页');
  await expect(crossPage.locator('.example > .source-note')).toHaveCount(3);
  for (const note of await crossPage.locator('.example > .source-note').all()) await expect(note).toContainText('教材第33页');
  await openLesson(page,lesson4,'text',3);
  const activity = sourceActivity(lesson4,'text3-listening'), fields = singleAnswerFields(activity), group = await activityReady(page,activity);
  expect(fields.map(f => f.answer)).toEqual(['同乐的司机','休息']);
  for (const field of fields) await page.locator(`[id="${field.id}"]`).selectOption(field.answer);
  await submitSaved(page,lesson4,activity);
  await expect(group.locator('.feedback-correct')).toHaveCount(2);
  await expect(group).toContainText('PDF第5页');await expect(group).toContainText('PDF第6页');
});

test('HSK3 lesson4 three picture dialogues retain eleven independent nonunique responses', async ({page}) => {
  await openLesson(page,lesson4,'practice');
  for (const [i,count] of [3,4,4].entries()) {
    const activity = sourceActivity(lesson4,`picture-dialogue${i+1}`), group = await activityReady(page,activity);
    expect(activity.fields).toHaveLength(count);
    for (const [j,field] of activity.fields.entries()) await page.locator(`[id="${field.id}"]`).fill(`自己的表达${i}-${j}`);
    await submitSaved(page,lesson4,activity);
    await expect(group).toContainText('不是唯一答案');await expect(group.locator('.feedback-correct,.feedback-retry')).toHaveCount(0);
  }
  const activity = sourceActivity(lesson4,'classroom-group'), group = await activityReady(page,activity);
  await expect(group.locator('textarea')).toHaveCount(1);
  await group.locator('textarea').fill('四人计划：去海边，坐火车，住宾馆，每天散步。');
  await submitSaved(page,lesson4,activity);await expect(group).toContainText('这是开放任务');
  await page.reload();await expectLessonReady(page,lesson4,'practice');
  for (const [i,count] of [3,4,4].entries()) for (let j=0;j<count;j++) await expect(page.locator(`[data-activity-id$=picture-dialogue${i+1}] input`).nth(j)).toHaveValue(`自己的表达${i}-${j}`);
  await expect(group.locator('textarea')).toHaveValue('四人计划：去海边，坐火车，住宾馆，每天散步。');
});

test('HSK3 lesson5 pair table keeps eight responses printed templates and keyboard scrolling', async ({page}) => {
  await page.setViewportSize({width:320,height:900});await openLesson(page,lesson5,'practice');
  const activity = sourceActivity(lesson5,'classroom-pair'), group = await activityReady(page,activity), table = group.locator('table');
  await expect(table.locator('thead th')).toHaveCount(3);await expect(table.locator('tbody tr')).toHaveCount(4);await expect(table.locator('textarea')).toHaveCount(8);
  await expect(table.locator('tbody tr').first()).toContainText('我对拍照感兴趣，因为……');
  await expect(table.locator('tbody tr').first()).toContainText('我也对拍照感兴趣，因为……');
  await expect(table.locator('tbody tr').first()).toContainText('我对拍照不感兴趣，因为……');
  await expect(table.locator('tbody tr').last()).toContainText('zuìjìn');
  const values = ['能留下回忆','喜欢风景','天气好去爬山','周末有时间','古典音乐','轻松的歌曲','看了电影','学了新菜'];
  for (const [i,value] of values.entries()) await table.locator('textarea').nth(i).fill(value);
  await submitSaved(page,lesson5,activity);await expect(group).toContainText('这是开放任务');
  await page.reload();await expectLessonReady(page,lesson5,'practice');
  for (const [i,value] of values.entries()) await expect(table.locator('textarea').nth(i)).toHaveValue(value);
  await page.getByRole('button',{name:'统一备份与恢复'}).click();
  const dialog = page.getByRole('dialog',{name:'学习记录备份'});
  await expect(dialog).toBeVisible();
  const [download] = await Promise.all([page.waitForEvent('download'), dialog.getByRole('button',{name:'下载全部三级备份'}).click()]);
  const path = await download.path();expect(path).not.toBeNull();
  const {readFileSync} = await import('node:fs'), bytes = readFileSync(path!);
  await dialog.getByRole('button',{name:'关闭',exact:false}).click();
  await table.locator('textarea').nth(0).fill('备份后的另一条记录');
  await submitSaved(page,lesson5,activity);
  await page.getByRole('button',{name:'统一备份与恢复'}).click();
  await expect(dialog).toBeVisible();
  await dialog.locator('#unified-backup-file').setInputFiles({name:'hsk3-pair-backup.json',mimeType:'application/json',buffer:bytes});
  await expect(dialog.getByRole('button',{name:'确认恢复HSK 3'})).toBeVisible();
  await dialog.getByRole('button',{name:'确认恢复HSK 3'}).click();
  await expect(dialog).toContainText('HSK 3已恢复');
  await dialog.getByRole('button',{name:'关闭',exact:false}).click();
  await expectLessonReady(page,lesson5,'practice');
  await activityReady(page,activity);
  for (const [i,value] of values.entries()) await expect(table.locator('textarea').nth(i)).toHaveValue(value);
  const scroll = group.locator('.matrix-scroll');await scroll.focus();await page.keyboard.press('ArrowRight');
  await expect.poll(() => scroll.evaluate(node => node.scrollLeft)).toBeGreaterThan(0);
  await expect(group.locator('.feedback-correct,.feedback-retry')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth+1)).toBe(true);
});

test('HSK3 lesson5 three portrait figures and cross-page word choices preserve source differences', async ({page}) => {
  await openLesson(page,lesson5,'text',2);await expect(page.locator('main img')).toHaveCount(3);
  const pictures = await page.locator('main figure').evaluateAll(nodes => nodes.map(n => (n as HTMLElement).dataset.illustrationId));
  expect(new Set(pictures).size).toBe(3);
  await openLesson(page,lesson5,'grammar');await expect(page.locator('.lesson-section.grammar')).toHaveCount(4);
  const grammarFields = lesson5.activities.filter(a => a.id.includes(':activity:grammar')).flatMap(a => a.fields);
  expect(grammarFields).toHaveLength(13);
  for (const activity of lesson5.activities.filter(a => a.id.includes(':activity:grammar'))) await activityReady(page,activity);
  await openLesson(page,lesson5,'practice');
  for (const bank of [1,2]) {
    const activity = sourceActivity(lesson5,`comprehensive-words${bank}`), fields = singleAnswerFields(activity), group = await activityReady(page,activity);
    expect(fields.map(f => f.answer)).toEqual(bank === 1 ? ['水平','收到','干','照','难看'] : ['终于','总是','结束','比较','感兴趣']);
    for (const field of fields) await page.locator(`[id="${field.id}"]`).selectOption(field.answer);
    await submitSaved(page,lesson5,activity);await expect(group.locator('.feedback-correct')).toHaveCount(5);
    await expect(group).toContainText('PDF第7页');
    if (bank === 1) {await expect(group).toContainText('教材第44、45页');for (const [i,pageNumber] of [44,44,45,45,45].entries()) await expect(group.locator('.activity-field .source-note').nth(i)).toContainText(String(pageNumber))}
  }
  await page.reload();await expectLessonReady(page,lesson5,'practice');await expect(page.locator('[data-activity-id*=comprehensive-words] .feedback-correct')).toHaveCount(10);
});
