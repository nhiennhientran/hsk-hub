import { readFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';

const oldHomework = JSON.parse(await readFile(new URL('../fixtures/migration/stage2.json', import.meta.url), 'utf8'));
const oldPractice = JSON.parse(await readFile(new URL('../fixtures/migration/stage3.json', import.meta.url), 'utf8'));
const key = 'ran_hsk1_modular_v1';

test('four groups and compact lesson cards expose the new 30-question version without extra comprehensive work', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('hsk_portal_unlocked_v2', '1'));
  await page.goto('/');
  await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'ready');
  await expect(page.locator('#feature-nav a')).toHaveCount(4);
  await expect(page.locator('.lesson-card')).toHaveCount(15);
  await expect(page.locator('.lesson-card a:visible')).toHaveCount(15);
  await expect(page.locator('.lesson-card details[open]')).toHaveCount(0);
  await expect(page.locator('.lesson-card a[href^="#/exercises"]')).toHaveCount(0);
  const card = page.locator('.lesson-card[data-lesson="10"]');
  await card.locator('summary').focus(); await page.keyboard.press('Enter');
  await expect(card.locator('[data-lesson-section]:visible')).toHaveCount(5);
  await card.locator('a[href^="#/homework?"]').click();
  await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'ready');
  expect(new URLSearchParams(new URL(page.url()).hash.split('?')[1]).get('version')).toBe('30-v1');
  await expect(page.locator('#feature-nav [data-nav-group="homework"]')).toHaveAttribute('aria-current', 'page');
  await page.goBack();
  await expect(page.locator('#home-module')).toBeVisible();
  await page.locator('#feature-nav [data-feature="review"]').click();
  await expect(page.locator('#review-module a')).toHaveCount(3);
  await expect(page.locator('#review-module a[href^="#/exercises"]')).toHaveCount(0);
  await page.locator('#review-listening').click();
  await expect(page.locator('#feature-nav [data-nav-group="practice"]')).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('.lesson-picker')).toBeHidden();
});

test('nonempty historical records survive home, hub and progressive data-management disclosure without being rescaled', async ({ page }) => {
  const data = { reading: { lessons: { '1': { visited: true, complete: true } }, mastered: {}, modules: {} }, homework: oldHomework, practice: oldPractice,
    navigation: { feature: 'homework', lesson: 15, part: 'translation' }, legacyRaw: {} };
  await page.addInitScript(({ key, data }) => {
    sessionStorage.setItem('hsk_portal_unlocked_v2', '1');
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({ app: 'hsk1-modular', schema: 1, revision: 1, updatedAt: 1789891200000, data, recovery: null }));
  }, { key, data });
  await page.goto('/#/home?lesson=15');
  await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'ready');
  await expect(page.locator('#continue-learning-link')).toHaveAttribute('href', '#/homework?lesson=15&part=translation');
  await page.locator('#feature-nav [data-feature="progress"]').click();
  await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'ready');
  await expect(page.locator('#progress-current-homework-submitted')).toContainText('0/450');
  await expect(page.locator('#progress-homework-submitted')).toContainText('30/225');
  await expect(page.locator('[data-progress-lesson]')).toHaveCount(15);
  await expect(page.locator('[data-progress-lesson][open]')).toHaveCount(0);
  await page.locator('[data-progress-lesson="15"] > summary').click();
  await page.locator('#open-data-manager').click();
  await expect(page.locator('#progress-overview')).toBeHidden();
  await expect(page.locator('.data-panel')).toBeVisible();
  await expect(page.locator('#reset-lesson')).toHaveValue(''); await expect(page.locator('#reset-module')).toHaveValue('');
  await expect(page.locator('#preview-reset')).toBeDisabled();
  await page.locator('#close-data-manager').click();
  await expect(page.locator('#open-data-manager')).toBeFocused();
  await expect(page.locator('#progress-overview')).toBeVisible();
  await page.reload(); await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'ready');
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).data, key);
  expect(saved.homework).toEqual(data.homework); expect(saved.practice).toEqual(data.practice); expect(saved.reading).toEqual(data.reading);
  expect(saved.homework30).toBeUndefined();
});

for (const width of [320, 390, 768, 1440]) test(`bilingual hierarchy, reflow and disclosed lesson progress at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.addInitScript(() => sessionStorage.setItem('hsk_portal_unlocked_v2', '1'));
  for (const route of ['/#/home?lesson=15', '/#/review?lesson=15', '/#/progress?lesson=15']) {
    await page.goto(route); await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'ready');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    for (const link of await page.locator('#feature-nav a').all()) {
      await expect(link.locator('[lang="zh"]')).toBeVisible(); await expect(link.locator('[lang="vi"]')).toBeVisible();
      expect(await link.locator('[lang="vi"]').evaluate(node => parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(14);
      expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
    const sizes = await page.locator('#module-host h1').evaluate(node => ({ zh: parseFloat(getComputedStyle(node.querySelector('[lang="zh"]')!).fontSize), vi: parseFloat(getComputedStyle(node.querySelector('[lang="vi"]')!).fontSize) }));
    expect(sizes.zh).toBeGreaterThanOrEqual(sizes.vi); expect(sizes.vi).toBeGreaterThanOrEqual(16);
  }
  await page.addStyleTag({ content: 'html { font-size: 150%; }' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
});
