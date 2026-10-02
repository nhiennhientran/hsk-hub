import { test, expect, type Locator } from '@playwright/test';
import { answerExercise } from '../../src/domain/exercises/engine.ts';
import { auth, initial, rawState, readOnly, ready, seed, storageKey, submit, task } from './exercise-archive-fixtures.ts';

async function pair(host: Locator, zh: string, vi: string) {
  await expect(host.locator(':scope > [lang=zh]')).toHaveText(zh);
  await expect(host.locator(':scope > [lang=vi]')).toHaveText(vi);
}
async function pairedInterface(host: Locator) {
  const nodes = host.locator('.bilingual-stacked');
  expect(await nodes.count()).toBeGreaterThan(5);
  for (const node of await nodes.all()) {
    await expect(node.locator(':scope > [lang=zh]')).not.toBeEmpty();
    await expect(node.locator(':scope > [lang=vi]')).not.toBeEmpty();
  }
}

for (const width of [320, 375, 768, 1280]) test(`retired exercise history is Chinese-primary/Vietnamese-subtitled and usable at ${width}px`, async ({ page }) => {
  const data = initial(); const text = '我的原文\n  保留空格。';
  submit(data, 'legacy:9-t1', text); answerExercise(data.exercises, task('legacy:9-t2'), '未提交的中文草稿');
  const before = await seed(page, data); await page.setViewportSize({ width, height: 812 });
  await page.goto('/#/exercises?lesson=9&set=pilot&group=translation&filter=all'); await ready(page); await readOnly(page);
  await pair(page.locator('#exercises-module > h1'), '旧练习记录', 'Lịch sử bài tập cũ');
  await pair(page.locator('#archive-homework-link'), '打开本课作业', 'Mở bài tập của bài này');
  await pair(page.locator('#archive-backup-link'), '数据与备份', 'Dữ liệu và sao lưu');
  await pair(page.locator('.archive-introduction h2'), '综合练习已并入每课作业', 'Bài luyện tổng hợp đã gộp vào bài tập từng bài');
  await pair(page.locator('#exercise-archive-status'), '已保存在此设备', 'Đã lưu trên thiết bị này');
  await pairedInterface(page.locator('#exercises-module'));
  await page.locator('.archive-history > summary').focus(); await page.keyboard.press('Enter');
  await expect(page.locator('.archive-history .archive-submission')).toHaveCount(1);
  expect(await page.locator('.archive-history .archive-answer-text').textContent()).toBe(text);
  await expect(page.locator('#exercises-module [data-result=correct], #exercises-module [data-result=incorrect]')).toHaveCount(0);
  const layout = await page.evaluate(() => ({ width: innerWidth, document: document.documentElement.scrollWidth,
    links: [...document.querySelectorAll('.archive-links a')].map(node => node.getBoundingClientRect().height),
    subtitles: [...document.querySelectorAll<HTMLElement>('#exercises-module [lang=vi]')].map(node => Number.parseFloat(getComputedStyle(node).fontSize)) }));
  expect(layout.document).toBeLessThanOrEqual(layout.width + 1);
  expect(layout.links.every(height => height >= 44)).toBe(true);
  expect(layout.subtitles.every(size => size >= 14)).toBe(true);
  expect(await rawState(page)).toBe(before);
});

test('empty and legacy filter explanations remain bilingual and do not offer hidden bank tabs', async ({ page }) => {
  await auth(page); await page.goto('/#/exercises?lesson=1&set=homework-review&group=choice&filter=wrong'); await ready(page);
  await pair(page.locator('#exercise-archive-records h2'), '此范围没有已保存的答题记录或草稿', 'Phạm vi này chưa có lịch sử trả lời hoặc bản nháp đã lưu');
  await pairedInterface(page.locator('#exercises-module')); await readOnly(page);
  await expect(page.locator('#exercises-module')).toContainText('Liên kết câu sai / đến hạn cũ nay chỉ mở lịch sử');
  expect(await rawState(page)).toBeNull();
});

test('corrupt stored history stays untouched with bilingual status and backup path, never masquerading as an empty history', async ({ page }) => {
  await auth(page);
  const raw = '{broken-original-history';
  await page.addInitScript(({ key, raw }) => localStorage.setItem(key, raw), { key: storageKey, raw });
  await page.goto('/#/exercises?lesson=1&set=original&group=choice&filter=all'); await ready(page); await readOnly(page);
  await expect(page.locator('#exercise-archive-status')).toHaveAttribute('data-state', 'corrupt');
  await expect(page.locator('#exercise-archive-status > [lang=zh]')).not.toBeEmpty();
  await expect(page.locator('#exercise-archive-status > [lang=vi]')).not.toBeEmpty();
  await expect(page.locator('#exercise-archive-records')).toBeEmpty();
  expect(await rawState(page)).toBe(raw);
});

test('read-only history needs no write lock, save retry, microphone or audio permission', async ({ page }) => {
  const data = initial(); submit(data, 'legacy:l01-listening-01', 1);
  const before = await seed(page, data);
  await page.addInitScript(() => Object.defineProperty(navigator, 'locks', { configurable: true, value: undefined }));
  await page.goto('/#/exercises?lesson=1&set=original&group=listening&filter=all'); await ready(page); await readOnly(page);
  await expect(page.locator('.archive-question')).toHaveCount(1); await pairedInterface(page.locator('#exercises-module'));
  await expect(page.locator('#exercise-save-retry, audio, .exercise-player')).toHaveCount(0);
  expect(await rawState(page)).toBe(before);
});
