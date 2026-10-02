import { test, expect } from '@playwright/test';
import { FEATURES } from '../../src/app/contracts.ts';
import { coreCopy } from '../../src/app/i18n/core.ts';

test('login, navigation, home, progress and help expose deliberate Chinese and Vietnamese labels', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#auth-title [lang="zh"]')).toHaveText(coreCopy.authTitle.zh);
  await expect(page.locator('#auth-title [lang="vi"]')).toHaveText(coreCopy.authTitle.vi);
  await expect(page.locator('label[for="class-password"]')).toContainText('课堂密码');
  await expect(page.locator('label[for="class-password"]')).toContainText('Mật khẩu');
  for (const selector of ['.auth-card > p:first-of-type', 'label[for="class-password"]', '#unlock-session']) {
    await expect(page.locator(`${selector} [lang="zh"]`)).toBeVisible();
    await expect(page.locator(`${selector} [lang="vi"]`)).toBeVisible();
  }
  await page.evaluate(() => sessionStorage.setItem('hsk_portal_unlocked_v2', '1'));
  await page.reload();
  await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'ready');
  await expect(page.locator('#feature-nav [lang="zh"]')).toHaveCount(FEATURES.length);
  await expect(page.locator('#feature-nav [lang="vi"]')).toHaveCount(FEATURES.length);
  await expect(page.locator('#home-module h1 [lang="zh"]')).toHaveText(coreCopy.homeTitle.zh);
  await expect(page.locator('#home-module h1 [lang="vi"]')).toHaveText(coreCopy.homeTitle.vi);
  await expect(page.locator('[data-lesson-section] [lang="zh"]')).toHaveCount(75);
  await page.locator('#feature-nav [data-feature="progress"]').click();
  await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'ready');
  await expect(page.locator('#open-data-manager [lang="zh"]')).toHaveText(coreCopy.backups.zh);
  await expect(page.locator('#progress-homework-submitted')).toContainText('已提交');
  await expect(page.locator('#progress-homework-submitted')).toContainText('Đã nộp');
  await page.goto('/help.html');
  await expect(page.locator('main h2 [lang="zh"]')).toHaveCount(7);
  await expect(page.locator('main p[lang="vi"]')).toHaveCount(7);
  await expect(page.locator('main')).toContainText('浏览器或系统自带');
  await expect(page.locator('main')).toContainText('Hộp thoại in');
});

for (const width of [320, 390, 1440]) test(`bilingual home and progress remain readable at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.addInitScript(() => sessionStorage.setItem('hsk_portal_unlocked_v2', '1'));
  for (const route of ['/#/home?lesson=1', '/#/progress?lesson=1']) {
    await page.goto(route);
    await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'ready');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    for (const selector of ['#feature-nav', '#module-host']) await expect(page.locator(selector)).toBeVisible();
    const active = await page.locator('#feature-nav [aria-current="page"]').boundingBox();
    expect(active!.x).toBeGreaterThanOrEqual(0);
    expect(active!.x + active!.width).toBeLessThanOrEqual(width);
  }
});
