import { test, expect } from '@playwright/test';
import homework from '../../src/domain/homework/engine.js';
import { answerExercise, restartExercise } from '../../src/domain/exercises/engine.ts';
import { auth, bank, initial, rawState, readOnly, ready, seed, stamp, submit, task } from './exercise-archive-fixtures.ts';

for (const route of [
  '/#/exercises?lesson=1&set=original&group=choice&filter=all',
  '/#/exercises?lesson=9&set=pilot&group=reading&filter=all',
  '/#/exercises?lesson=1&set=homework-review&group=choice&filter=wrong',
  '/#/exercises?lesson=1&set=original&group=listening&filter=due',
]) test(`untouched retired URL exposes no bank or new attempt: ${route}`, async ({ page }) => {
  await auth(page); await page.goto(route); await ready(page); await readOnly(page);
  await expect(page.locator('#exercise-archive-records')).toContainText('此范围没有已保存的答题记录或草稿');
  await expect(page.locator('.archive-question, .archive-passage, .archive-original-content, .archive-timeline')).toHaveCount(0);
  await expect(page.locator('.archive-introduction')).toContainText('25题自动评分 + 5题书写由教师批阅');
  expect(await rawState(page)).toBeNull();
  await page.reload(); await ready(page); expect(await rawState(page)).toBeNull();
  await page.locator('#archive-homework-link').click();
  await expect(page.locator('#module-host')).toHaveAttribute('data-feature', 'homework');
  await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'ready');
});

test('saved first/latest/all answers, dates and grades survive read-only history, reload and old filters', async ({ page }) => {
  const data = initial(), q = task('legacy:l01-choice-01'); if (q.kind !== 'choice') throw Error('Choice fixture required');
  submit(data, q.id, (q.answer + 1) % 4, stamp + 2000); submit(data, q.id, q.answer, stamp);
  restartExercise(data.exercises, q); answerExercise(data.exercises, q, 0);
  data.exercises.positions['original:1:choice:all'] = 'original:l01-choice-03';
  const before = await seed(page, data);
  for (const filter of ['all', 'wrong', 'due']) {
    await page.goto(`/#/exercises?lesson=1&set=original&group=choice&filter=${filter}`); await ready(page); await readOnly(page);
    await expect(page.locator('.archive-question')).toHaveCount(1);
    await expect(page.locator('.archive-question')).toHaveAttribute('data-exercise-entry', 'original:l01-choice-01');
    const previews = page.locator('.archive-timeline > .archive-submission');
    await expect(previews).toHaveCount(2);
    await expect(previews.nth(0)).toHaveAttribute('data-result', 'incorrect');
    await expect(previews.nth(1)).toHaveAttribute('data-result', 'correct');
    await expect(previews.nth(0).locator('time')).toHaveAttribute('datetime', new Date(stamp + 2000).toISOString());
    await expect(previews.nth(1).locator('time')).toHaveAttribute('datetime', new Date(stamp).toISOString());
    await expect(page.locator('.archive-draft .archive-answer-text')).toHaveText(q.kind === 'choice' ? q.options[0]! : '');
    await page.locator('.archive-history > summary').focus(); await page.keyboard.press('Enter');
    await expect(page.locator('.archive-history .archive-submission')).toHaveCount(2);
    await expect(page.locator('.archive-history .archive-submission time')).toHaveText([new Date(stamp + 2000).toISOString(), new Date(stamp).toISOString()]);
    expect(await rawState(page)).toBe(before);
  }
  await page.reload(); await ready(page); expect(await rawState(page)).toBe(before);
});

test('manual history and drafts retain exact IME text, long content and whitespace without grades or answer keys', async ({ page }) => {
  const data = initial(); const written = '  我的原文\n\n保留空格。  '; const draft = `输入法原文\n${'学'.repeat(3980)}  `;
  submit(data, 'legacy:9-t1', written); restartExercise(data.exercises, task('legacy:9-t1')); answerExercise(data.exercises, task('legacy:9-t1'), draft);
  const before = await seed(page, data);
  await page.goto('/#/exercises?lesson=9&set=pilot&group=translation&filter=all'); await ready(page); await readOnly(page);
  await expect(page.locator('.archive-question')).toHaveCount(1);
  expect(await page.locator('.archive-submission .archive-answer-text').textContent()).toBe(written);
  expect(await page.locator('.archive-draft .archive-answer-text').textContent()).toBe(draft);
  await expect(page.locator('.archive-submission')).toHaveAttribute('data-result', 'manual');
  await expect(page.locator('.archive-submission')).toContainText('无自动分数');
  await expect(page.locator('.archive-original-content, [data-result=correct], [data-result=incorrect]')).toHaveCount(0);
  await page.locator('#archive-backup-link').click(); await expect(page.locator('#module-host')).toHaveAttribute('data-feature', 'progress');
  await page.goBack(); await ready(page); expect(await rawState(page)).toBe(before);
  await page.goForward(); await expect(page.locator('#module-host')).toHaveAttribute('data-feature', 'progress');
  await page.goBack(); await ready(page); await page.reload(); await ready(page);
  expect(await page.locator('.archive-draft .archive-answer-text').textContent()).toBe(draft); expect(await rawState(page)).toBe(before);
});

test('a draft unlocks only its recorded question and scope, including empty sort drafts', async ({ page }) => {
  const data = initial();
  answerExercise(data.exercises, task('legacy:l01-sort-01'), []);
  answerExercise(data.exercises, task('legacy:9-r1'), 0);
  const before = await seed(page, data);
  await page.goto('/#/exercises?lesson=1&set=original&group=sort&filter=all'); await ready(page);
  await expect(page.locator('.archive-question')).toHaveCount(1); await expect(page.locator('.archive-submission')).toHaveCount(0);
  await expect(page.locator('.archive-draft')).toContainText('草稿未保存提交日期');
  await page.locator('.archive-raw > summary').click(); await expect(page.locator('.archive-raw pre')).toHaveText('[]');
  await page.locator('#lesson-select').selectOption('2'); await ready(page); await expect(page.locator('.archive-question')).toHaveCount(0);
  await page.goBack(); await ready(page); await expect(page.locator('.archive-question')).toHaveCount(1);
  await page.goto('/#/exercises?lesson=9&set=pilot&group=reading&filter=all'); await ready(page);
  await expect(page.locator('.archive-question')).toHaveCount(1); await page.locator('.archive-passage > summary').click();
  await expect(page.locator('.archive-passage p')).toHaveCount(4);
  await expect(page.locator('.archive-passage')).toContainText('陈天中：我明天上午在学校学习。');
  expect(await rawState(page)).toBe(before);
});

test('original homework grades remain separate from saved review attempts without creating untouched questions', async ({ page }) => {
  const data = initial(), questions = bank.lessons[2].choice;
  for (const q of questions) homework.group(data.homework, 3, 'choice').draft[q.id] = q.answer;
  homework.submit(data.homework, 3, 'choice', questions, stamp);
  const reviewed = task(`homework:${questions[0].id}`); if (reviewed.kind !== 'choice') throw Error('Choice fixture required');
  submit(data, reviewed.id, (reviewed.answer + 1) % 4, stamp + 1000);
  const before = await seed(page, data);
  await page.goto('/#/exercises?lesson=3&set=homework-review&group=choice&filter=wrong'); await ready(page); await readOnly(page);
  await expect(page.locator('.archive-question')).toHaveCount(5);
  const first = page.locator('.archive-question').first();
  await expect(first.locator('[data-archive-source=homework] > .archive-submission').first()).toHaveAttribute('data-result', 'correct');
  await expect(first.locator('[data-archive-source=exercises] > .archive-submission')).toHaveAttribute('data-result', 'incorrect');
  await expect(first.locator('.archive-draft')).toHaveCount(0);
  await expect(page.locator('#exercises-module')).toContainText('不再生成练习队列');
  expect(await rawState(page)).toBe(before);
});

test('reset preview and Back do not mutate history; a confirmed scoped reset hides only that history and remains recoverable', async ({ page }) => {
  const data = initial(); submit(data, 'legacy:l01-choice-01', 0); answerExercise(data.exercises, task('legacy:9-t1'), '其他课的草稿');
  const before = await seed(page, data);
  await page.goto('/#/exercises?lesson=1&set=original&group=choice&filter=all'); await ready(page);
  const openReset = async () => {
    await page.locator('#archive-backup-link').click(); await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'ready');
    await page.locator('#open-data-manager').click(); await page.locator('#reset-module').selectOption('exercises'); await page.locator('#reset-lesson').selectOption('1');
    await page.locator('#preview-reset').click(); await expect(page.locator('#migration-preview')).toHaveAttribute('data-reason', 'reset');
  };
  await openReset(); expect(await rawState(page)).toBe(before); await page.goBack(); await ready(page); await expect(page.locator('.archive-question')).toHaveCount(1);
  expect(await rawState(page)).toBe(before); await openReset(); await page.locator('#confirm-data-import').click();
  await expect(page.locator('#data-status')).toHaveAttribute('data-state', 'saved');
  const reset = JSON.parse((await rawState(page))!);
  expect(reset.data.exercises.records['legacy:l01-choice-01']).toBeUndefined(); expect(reset.data.exercises.drafts['legacy:9-t1']).toBe('其他课的草稿');
  expect(reset.recovery.data.exercises).toEqual(JSON.parse(before).data.exercises);
  await page.goBack(); await ready(page); await expect(page.locator('.archive-question')).toHaveCount(0); await readOnly(page);
  expect(await rawState(page)).toBe(JSON.stringify(reset));
  await page.locator('#archive-backup-link').click(); await page.locator('#open-data-manager').click(); await page.locator('#restore-data').click();
  await expect(page.locator('#data-status')).toHaveAttribute('data-state', 'saved');
  await page.goBack(); await ready(page); await expect(page.locator('.archive-question')).toHaveCount(1);
  expect(JSON.parse((await rawState(page))!).data.exercises).toEqual(JSON.parse(before).data.exercises);
});
