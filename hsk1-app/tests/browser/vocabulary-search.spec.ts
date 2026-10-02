import { readFile } from 'node:fs/promises';
import { test, expect, type Page } from '@playwright/test';

const stateKey = 'ran_hsk1_modular_v1';
const catalog = JSON.parse(await readFile(new URL('../../content/stage3-catalog.json', import.meta.url), 'utf8')) as {
  vocabulary: { senseId: string; lesson: number; zh: string; py: string; vi: string }[];
};
const textbook = JSON.parse(await readFile(new URL('../../content/textbook.json', import.meta.url), 'utf8'));
async function open(page: Page, lesson = 1) {
  await page.addInitScript(() => sessionStorage.setItem('hsk_portal_unlocked_v2', '1'));
  await page.goto(`/#/vocabulary?lesson=${lesson}`);
  await expect(page.locator('#vocabulary-settings')).toBeVisible();
  await page.locator('#vocabulary-all').click();
  await page.locator('#vocabulary-shuffle').uncheck();
}
async function savedData(page: Page) {
  await expect(page.locator('#vocabulary-save-status')).toHaveAttribute('data-state', 'saved');
  return page.evaluate(key => JSON.parse(localStorage.getItem(key)!).data, stateKey);
}

test('Chinese, accent-insensitive Vietnamese and pinyin searches create only matching sense queues', async ({ page }) => {
  await open(page);
  for (const query of ['你好', 'NǏ HǍO', 'nihao', 'xin chao']) {
    await page.locator('#vocabulary-search').fill(query);
    await page.locator('#vocabulary-start').click();
    const state = await savedData(page), queue = state.practice.cards.review;
    expect(queue.search).toBe(query);
    expect(queue.senseIds).toContain(catalog.vocabulary.find(word => word.zh === '你好')!.senseId);
    expect(queue.senseIds.length).toBeLessThan(10);
    await expect(page.locator('#vocabulary-position')).toHaveText(`Thẻ 1 / ${queue.senseIds.length}`);
    await expect(page.locator('#vocabulary-available')).toContainText(`${queue.senseIds.length} thẻ`);
  }
  await page.locator('#vocabulary-clear-search').click();
  await expect(page.locator('#vocabulary-search')).toHaveValue('');
  await expect(page.locator('#vocabulary-available')).toContainText('344 thẻ');
  await page.locator('#vocabulary-start').click();
  expect((await savedData(page)).practice.cards.review.senseIds).toHaveLength(344);
  await expect(page.locator('#vocabulary-queue-scope')).not.toContainText('Tìm');
});

test('search, selected lessons, and self-rating filters intersect; zero results preserve the active round', async ({ page }) => {
  await open(page);
  await page.locator('#vocabulary-search').fill('nhớ nhung');
  await page.locator('#vocabulary-start').click();
  await expect(page.locator('#vocabulary-position')).toHaveText('Thẻ 1 / 1');
  await page.locator('#vocabulary-reveal').click(); await page.locator('#vocabulary-again').click();
  await page.locator('#vocabulary-filter').selectOption('wrong');
  await expect(page.locator('#vocabulary-available')).toContainText('1 thẻ');
  await expect(page.locator('#vocabulary-due')).toBeDisabled();
  const before = (await savedData(page)).practice.cards.review;
  await page.locator('#vocabulary-lesson-3').uncheck();
  await expect(page.locator('#vocabulary-available')).toContainText('0 thẻ');
  await expect(page.locator('#vocabulary-start')).toBeDisabled();
  expect((await savedData(page)).practice.cards.review).toEqual(before);
  await page.locator('#vocabulary-search').fill('no-such-word');
  await expect(page.locator('#vocabulary-start')).toBeDisabled();
  await page.locator('#vocabulary-lesson-3').check();
  await page.locator('#vocabulary-clear-search').click();
  await expect(page.locator('#vocabulary-start')).toBeEnabled();
  await expect(page.locator('#vocabulary-queue-scope')).toContainText('nhớ nhung');
});

test('searched skipped cards restore exactly after reload while changed draft settings never replace them', async ({ page }) => {
  await open(page); await page.locator('#vocabulary-direction').selectOption('vi-zh');
  await page.locator('#vocabulary-search').fill('家'); await page.locator('#vocabulary-start').click();
  await page.locator('#vocabulary-skip').click(); await page.locator('#vocabulary-reveal').click();
  await page.locator('#vocabulary-skip').click();
  const before = (await savedData(page)).practice;
  expect(before.cards.review.position).toBe(2); expect(before.cards.review.ratings).toEqual({});
  await page.locator('#vocabulary-search').fill('no-such-word');
  await page.locator('#vocabulary-none').click(); await page.locator('#vocabulary-lesson-15').check();
  await page.locator('#vocabulary-direction').selectOption('zh-vi'); await savedData(page);
  await page.reload(); await expect(page.locator('#vocabulary-card')).toBeVisible();
  await expect(page.locator('#vocabulary-search')).toHaveValue('家');
  const after = (await savedData(page)).practice;
  expect(after.cards).toEqual(before.cards);
  await page.locator('#vocabulary-prev').click(); await expect(page.locator('#vocabulary-answer')).toBeVisible();
  await page.locator('#vocabulary-prev').click(); await expect(page.locator('#vocabulary-answer')).toHaveCount(0);
  await expect(page.locator('#vocabulary-play')).toBeDisabled();
  await expect(page.locator('#vocabulary-position')).toHaveText(`Thẻ 1 / ${before.cards.review.senseIds.length}`);
});

test('Vietnamese fronts expose neither Chinese answers, pinyin, examples nor audio before reveal', async ({ page }) => {
  await open(page); await page.locator('#vocabulary-direction').selectOption('vi-zh');
  await page.locator('#vocabulary-search').fill('ngày (đơn vị thời gian)');
  await page.locator('#vocabulary-start').click(); await page.locator('#vocabulary-pinyin').check();
  await expect(page.locator('#vocabulary-prompt')).toHaveText('ngày (đơn vị thời gian)');
  await expect(page.locator('#vocabulary-card')).not.toContainText('天');
  await expect(page.locator('#vocabulary-examples')).toHaveCount(0);
  await expect(page.locator('[data-vocabulary-pinyin]')).toHaveCount(0);
  await expect(page.locator('#vocabulary-play')).toBeDisabled();
  await expect(page.locator('#vocabulary-good')).toBeDisabled();
  await page.locator('#vocabulary-reveal').click();
  await expect(page.locator('#vocabulary-examples')).toBeVisible();
  await page.locator('#vocabulary-examples summary').click();
  const exact = textbook.lessons.find((lesson: any) => lesson.id === 12).scenes[2].lines[3];
  const example = page.locator('[data-example-id="textbook-l12-text-3-line-04"]');
  await expect(example).toContainText(exact.zh); await expect(example).toContainText(exact.py); await expect(example).toContainText(exact.vn);
  await expect(example.locator('a')).toHaveAttribute('href', /textbook\?lesson=12&section=text/);
  await expect(page.locator('#vocabulary-examples')).not.toContainText('这里的天不太好');
  await page.locator('#vocabulary-good').click(); await expect(page.locator('#vocabulary-position')).toHaveText('Thẻ 1 / 1');
});

test('compact search and exact-sense textbook examples remain usable on a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 }); await open(page);
  await page.locator('#vocabulary-search').fill('lên (tàu, xe)'); await page.locator('#vocabulary-start').click();
  await page.locator('#vocabulary-reveal').click(); await page.locator('#vocabulary-examples summary').click();
  await expect(page.locator('#vocabulary-examples')).toContainText('上火车');
  await expect(page.locator('#vocabulary-examples')).not.toContainText('上中学');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.locator('#vocabulary-examples a').click();
  await expect(page.locator('#module-host')).toHaveAttribute('data-feature', 'textbook');
  await page.goBack(); await expect(page.locator('#vocabulary-card')).toBeVisible();
  await expect(page.locator('#vocabulary-search')).toHaveValue('lên (tàu, xe)');
});
