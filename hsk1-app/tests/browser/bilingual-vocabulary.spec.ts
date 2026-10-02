import { pairedAccessibleName } from './ui-actions.ts';
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
  await expect(page.locator('#vocab-tools')).not.toHaveAttribute('open', '');
  await expect(page.locator('.vocab-card').first()).toBeVisible();
  await paired(page.locator('#vocab-tools > summary'), '搜索与工具', 'Tìm và công cụ');
  await page.locator('#vocab-tools > summary').click();
  await expect(page.locator('#vocab-tools')).toHaveAttribute('open', '');
  await expect(page.getByRole('searchbox', { name: pairedAccessibleName('搜索汉字、越南语或拼音 · Tìm chữ Hán, tiếng Việt hoặc pinyin'), exact: true })).toBeVisible();
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

test('mixed bilingual controls describe lesson selection, responsive ranges and reversible flips', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 850 });
  await open(page, '/#/review?lesson=1');
  await paired(page.locator('#vocabulary-module h1'), '混课词卡', 'Thẻ từ vựng nhiều bài');
  await paired(page.locator('#vocabulary-start'), '开始练习', 'Bắt đầu luyện');
  await paired(page.locator('#vocabulary-all'), '全选', 'Chọn tất cả');
  await paired(page.locator('#vocabulary-none'), '清空', 'Bỏ chọn');
  await openLearningSettings(page, 'vocabulary'); await page.locator('#vocabulary-none').click();
  await page.locator('#vocabulary-lesson-1').check(); await page.locator('#vocabulary-lesson-15').check();
  await paired(page.locator('#vocabulary-available'), '已选 2 课 · 33 张词卡', 'Đã chọn 2 bài · 33 thẻ');
  await page.locator('#vocabulary-start').click();
  await paired(page.locator('#vocabulary-position'), '第 1 / 33 张', 'Thẻ 1 / 33');
  await paired(page.locator('#vocabulary-prev'), '上一张', 'Thẻ trước');
  await paired(page.locator('#vocabulary-next'), '下一张', 'Thẻ tiếp');
  await paired(page.locator('#vocabulary-reshuffle'), '打乱再练', 'Xáo trộn và luyện lại');
  await expect(page.locator('#vocabulary-retry-save')).toBeHidden();
  await expect(page.locator('.mixed-card-back')).toHaveCount(0);
  await page.locator('#vocabulary-next').click();
  await paired(page.locator('#vocabulary-position'), '第 2 / 33 张', 'Thẻ 2 / 33');
  const before = await saved(page);
  await page.locator('.mixed-card-toggle').click();
  await expect(page.locator('.mixed-card-back [lang="zh-Latn"]')).toBeVisible();
  await expect(page.locator('.mixed-card-back [lang="vi"]')).toBeVisible();
  await page.reload();
  await expect(page.locator('.mixed-card-front')).toBeVisible();
  expect((await saved(page)).mixedVocabulary).toEqual(before.mixedVocabulary);
  expect((await saved(page)).practice).toEqual(before.practice);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 850 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    const sizes = await page.locator('#vocabulary-module .bilingual-vi').evaluateAll(nodes => nodes.map(node => parseFloat(getComputedStyle(node).fontSize)));
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(14);
  }
  await paired(page.locator('#vocabulary-position'), '第 2–7 / 33 张', 'Thẻ 2–7 / 33');
  await paired(page.locator('#vocabulary-prev'), '上一组', 'Nhóm trước');
  await paired(page.locator('#vocabulary-next'), '下一组', 'Nhóm tiếp');
  await openLearningSettings(page, 'vocabulary');
  await paired(page.locator('#vocabulary-start'), '更新词卡', 'Cập nhật thẻ');
  await paired(page.locator('#vocabulary-cancel'), '保留当前词卡', 'Giữ lượt thẻ hiện tại');
  await page.locator('#vocabulary-none').click();
  await expect(page.locator('#vocabulary-pending [lang="zh"]')).toBeVisible();
  await expect(page.locator('#vocabulary-pending [lang="vi"]')).toBeVisible();
  await paired(page.locator('#vocabulary-available'), '请至少选择一课', 'Vui lòng chọn ít nhất một bài');
  await page.locator('#vocabulary-cancel').click();
  expect((await saved(page)).mixedVocabulary).toEqual(before.mixedVocabulary);
  await testInfo.attach(`bilingual-mixed-vocab-${testInfo.project.name}.png`, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
});
