import { openLearningSettings } from './active-view-helpers.ts';
import { test, expect, type Locator, type Page } from '@playwright/test';

const stateKey = 'ran_hsk1_modular_v1';
async function paired(locator: Locator, zh: string, vi: string) {
  await expect(locator.locator(':scope > [lang="zh"]')).toHaveText(zh);
  await expect(locator.locator(':scope > [lang="vi"]')).toHaveText(vi);
}
async function open(page: Page, route: string) {
  await page.addInitScript(() => sessionStorage.setItem('hsk_portal_unlocked_v2', '1'));
  await page.goto(route); await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'ready');
}
async function saved(page: Page) {
  await expect(page.locator('#vocabulary-save-status')).toHaveAttribute('data-state', 'saved');
  return page.evaluate(key => JSON.parse(localStorage.getItem(key)!).data, stateKey);
}

test('textbook vocabulary toolbar, flip/star/detail controls and dynamic counts are Chinese–Vietnamese on mobile', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 850 });
  await open(page, '/#/textbook?lesson=1&section=vocab');
  await paired(page.locator('#textbook-vocabulary h2'), '生词', 'Từ vựng');
  await expect(page.getByRole('searchbox', { name: '搜索汉字、越南语或拼音 · Tìm chữ Hán, tiếng Việt hoặc pinyin', exact: true })).toBeVisible();
  await paired(page.locator('#vocab-flip-all'), '翻转全部', 'Lật tất cả thẻ');
  await paired(page.locator('#vocab-play-all'), '播放本课原音', 'Nghe toàn bộ từ có âm thanh gốc');
  await paired(page.locator('#vocab-count'), '本课显示 13 / 13 个词', '13 / 13 từ trong bài');
  await page.locator('#vocab-search').fill('你好');
  await expect(page.locator('.vocab-card')).toHaveCount(1);
  await paired(page.locator('#vocab-count'), '本课显示 1 / 13 个词', '1 / 13 từ trong bài');
  await paired(page.locator('[data-vocab-flip]'), '查看拼音和词义', 'Xem pinyin và nghĩa');
  await page.locator('[data-vocab-flip]').click();
  await paired(page.locator('[data-vocab-flip]'), '查看汉字', 'Xem tiếng Trung');
  await page.locator('[data-vocab-star]').click();
  await paired(page.locator('[data-vocab-star]'), '★ 已记住', 'Đã nhớ');
  await page.locator('[data-vocab-detail]').click();
  await paired(page.locator('#word-close'), '关闭详情', 'Đóng chi tiết');
  await paired(page.locator('#word-prev'), '← 上一个词', 'Từ trước');
  await paired(page.locator('#word-next'), '下一个词 →', 'Từ sau');
  await page.locator('#word-close').click(); await expect(page.locator('#word-detail')).toBeHidden();
  await page.locator('#vocab-search').fill('');
  await expect(page.locator('#reading-save-status')).toHaveAttribute('data-state', 'saved');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await testInfo.attach(`bilingual-textbook-vocab-${testInfo.project.name}.png`, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
});

test('mixed bilingual controls preserve 33-card free navigation, hidden answers, optional ratings and saved resume', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 360, height: 850 });
  await open(page, '/#/vocabulary?lesson=1');
  await paired(page.locator('#vocabulary-module h1'), '混课词汇', 'Từ vựng nhiều bài');
  await paired(page.locator('#vocabulary-start'), '开始新一轮', 'Bắt đầu lượt mới');
  await paired(page.locator('#vocabulary-search-note'), '可带声调或不带声调搜索；每个义项单独成卡。搜索仅用于新一轮。', 'Tìm có hoặc không dấu; mỗi nghĩa vẫn là một thẻ riêng. Từ khóa chỉ áp dụng khi bắt đầu lượt mới.');
  await expect(page.locator('#vocabulary-filter option[value="all"]')).toHaveText('全部词汇 · Tất cả từ');
  await openLearningSettings(page, 'vocabulary'); await page.locator('#vocabulary-none').click();
  await openLearningSettings(page, 'vocabulary'); await page.locator('#vocabulary-lesson-1').check(); await openLearningSettings(page, 'vocabulary'); await page.locator('#vocabulary-lesson-15').check();
  await openLearningSettings(page, 'vocabulary'); await page.locator('#vocabulary-shuffle').uncheck(); await openLearningSettings(page, 'vocabulary'); await page.locator('#vocabulary-direction').selectOption('vi-zh');
  await expect(page.locator('#vocabulary-available [lang="zh"]')).toContainText('33 张卡');
  await expect(page.locator('#vocabulary-available [lang="vi"]')).toContainText('33 thẻ');
  await openLearningSettings(page, 'vocabulary'); await page.locator('#vocabulary-start').click();
  await paired(page.locator('#vocabulary-position'), '第 1 / 33 张', 'Thẻ 1 / 33');
  await expect(page.locator('#vocabulary-retry-save')).toBeHidden();
  await expect(page.locator('#vocabulary-answer, #vocabulary-examples, [data-vocabulary-pinyin]')).toHaveCount(0);
  await expect(page.locator('#vocabulary-card')).not.toContainText('不客气');
  await expect(page.locator('#vocabulary-play')).toBeDisabled();
  await paired(page.locator('#vocabulary-reveal'), '查看答案', 'Xem đáp án');
  await paired(page.locator('#vocabulary-good'), '已记住', 'Đã nhớ');
  await page.locator('#vocabulary-next').click(); await page.locator('#vocabulary-skip').click();
  await paired(page.locator('#vocabulary-position'), '第 3 / 33 张', 'Thẻ 3 / 33');
  const unrated = await saved(page); expect(unrated.practice.cards.review.ratings).toEqual({}); expect(unrated.practice.cards.schedule).toEqual({});
  await page.locator('#vocabulary-prev').click(); await page.locator('#vocabulary-reveal').click();
  await expect(page.locator('#vocabulary-answer')).toBeVisible();
  await page.locator('#vocabulary-good').click();
  await paired(page.locator('#vocabulary-position'), '第 2 / 33 张', 'Thẻ 2 / 33');
  const rated = await saved(page); expect(Object.keys(rated.practice.cards.review.ratings)).toHaveLength(1);
  await page.reload(); await expect(page.locator('#vocabulary-answer')).toBeVisible();
  expect((await saved(page)).practice.cards).toEqual(rated.practice.cards);
  await expect(page.locator('#vocabulary-resume [lang="zh"]')).toContainText('第 2 张');
  for (const width of [320, 360, 390, 1104]) {
    await page.setViewportSize({ width, height: 850 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    const sizes = await page.locator('#vocabulary-module .bilingual-vi').evaluateAll(nodes => nodes.map(node => parseFloat(getComputedStyle(node).fontSize)));
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(14);
  }
  await page.setViewportSize({ width: 390, height: 850 });
  await testInfo.attach(`bilingual-mixed-vocab-${testInfo.project.name}.png`, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
});
