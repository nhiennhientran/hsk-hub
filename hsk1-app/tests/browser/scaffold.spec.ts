import { test, expect, type Page } from '@playwright/test';

const sessionKey = 'hsk_portal_unlocked_v2';
const features = ['home', 'textbook', 'homework', 'listening', 'vocabulary', 'review', 'progress'] as const;

async function useExistingTabSession(page: Page): Promise<void> {
  await page.addInitScript(key => sessionStorage.setItem(key, '1'), sessionKey);
}

async function expectReady(page: Page, feature: string, lesson: number): Promise<void> {
  const host = page.locator('#module-host');
  await expect(host).toHaveAttribute('data-state', 'ready');
  await expect(host).toHaveAttribute('data-feature', feature);
  await expect(host).toHaveAttribute('data-lesson', String(lesson));
  await expect(host.locator('h1')).toBeVisible();
  if (feature === 'homework') await expect(host.locator('#submit-homework')).toBeEnabled();
  else if (feature === 'textbook') await expect(host.locator('#reading-complete')).toBeEnabled();
  else await expect(host.locator('[data-module-action="preview"]')).toBeEnabled();
}

test('a fresh localhost session stays gated despite old flags and rejects empty or wrong passwords', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('hsk_site_unlocked_v1', '1');
    for (const key of ['hsk1_ranteacher_unlocked', 'hsk_portal_unlocked', 'hsk2_ranteacher_unlocked',
      'hsk3_ranteacher_unlocked', 'hsk4_upper_ranteacher_unlocked', 'hsk4_lower_ranteacher_unlocked']) {
      sessionStorage.setItem(key, '1');
    }
  });
  await page.goto('/');
  await expect(page.locator('#auth-gate')).toBeVisible();
  await expect(page.locator('#auth-form')).toBeVisible();
  await page.locator('#unlock-session').click();
  await expect(page.locator('#auth-gate')).toBeVisible();
  expect(await page.evaluate(key => sessionStorage.getItem(key), sessionKey)).toBeNull();
  await page.locator('#class-password').fill('incorrect-auth-input');
  await page.locator('#class-password').press('Enter');
  await expect(page.locator('#auth-message')).not.toHaveText('');
  await expect(page.locator('#auth-gate')).toBeVisible();
  await expect(page.locator('#module-host[data-state="ready"]')).toHaveCount(0);
  expect(await page.evaluate(key => sessionStorage.getItem(key), sessionKey)).toBeNull();
});

test('the real password works with Enter, reload reuses this tab session, and a new context is locked', async ({ page, browser }) => {
  const password = process.env.HSK_TEST_PASSWORD;
  test.skip(!password, 'Set HSK_TEST_PASSWORD to run the correct-password browser acceptance.');
  await page.goto('/#/textbook?lesson=10&section=text');
  await expect(page.locator('#auth-gate')).toBeVisible();
  await page.locator('#class-password').fill(password!);
  await page.locator('#class-password').press('Enter');
  await expect(page.locator('#auth-gate')).toBeHidden();
  await expectReady(page, 'textbook', 10);
  expect(await page.evaluate(key => sessionStorage.getItem(key), sessionKey)).toBe('1');
  await page.reload();
  await expect(page.locator('#auth-gate')).toBeHidden();
  await expectReady(page, 'textbook', 10);
  const freshContext = await browser.newContext();
  try {
    const freshPage = await freshContext.newPage();
    await freshPage.goto(page.url());
    await expect(freshPage.locator('#auth-gate')).toBeVisible();
    expect(await freshPage.evaluate(key => sessionStorage.getItem(key), sessionKey)).toBeNull();
  } finally {
    await freshContext.close();
  }
});

test('all seven module entries and all fifteen lesson choices remain reachable as textbook and homework become interactive', async ({ page }) => {
  await useExistingTabSession(page);
  await page.goto('/');
  await expectReady(page, 'home', 1);
  await expect(page.locator('#feature-nav a[data-feature]')).toHaveCount(features.length);
  await expect(page.locator('#lesson-select option')).toHaveCount(15);
  await expect(page.locator('#module-host .lesson-card[data-lesson]')).toHaveCount(15);
  for (let lesson = 1; lesson <= 15; lesson++) {
    const card = page.locator(`#module-host .lesson-card[data-lesson="${lesson}"]`);
    for (const feature of ['textbook', 'homework', 'listening']) {
      await expect(card.locator(`a[href^="#/${feature}?lesson=${lesson}"]`)).toHaveCount(1);
    }
  }
  for (const feature of features) {
    await page.locator(`#feature-nav a[data-feature="${feature}"]`).click();
    await expectReady(page, feature, 1);
    if (feature === 'homework') await expect(page.locator('#module-host [data-question-id]')).toHaveCount(5);
    else if (feature !== 'home' && feature !== 'textbook') await expect(page.locator('#module-host')).toContainText('chưa mở để làm bài');
  }
  await page.locator('#feature-nav a[data-feature="textbook"]').click();
  for (let lesson = 1; lesson <= 15; lesson++) {
    await page.locator('#lesson-select').selectOption(String(lesson));
    await expectReady(page, 'textbook', lesson);
    await expect(page.locator('#lesson-select')).toHaveValue(String(lesson));
    await expect(page.locator('#module-host')).toContainText(`Bài ${lesson} ·`);
  }
});

test('the shell and metadata preview remain readable without horizontal overflow at four viewport widths', async ({ page }) => {
  await useExistingTabSession(page);
  await page.goto('/');
  await expectReady(page, 'home', 1);
  await page.locator('[data-module-action="preview"]').click();
  for (const width of [320, 390, 768, 1104]) {
    await page.setViewportSize({ width, height: 800 });
    await expect(page.locator('#feature-nav')).toBeVisible();
    await expect(page.locator('#lesson-select')).toBeVisible();
    await expect(page.locator('#module-host h1')).toBeVisible();
    await expect(page.locator('#entry-details')).toBeVisible();
    const layout = await page.evaluate(() => ({
      viewport: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      boxes: ['#feature-nav', '#lesson-select', '#module-host', '#module-host h1', '#entry-details'].map(selector => {
        const node = document.querySelector<HTMLElement>(selector)!;
        const box = node.getBoundingClientRect();
        return { selector, left: box.left, right: box.right, fontSize: Number.parseFloat(getComputedStyle(node).fontSize) };
      }),
    }));
    expect(layout.documentWidth, `document overflow at ${width}px`).toBeLessThanOrEqual(layout.viewport);
    for (const box of layout.boxes) {
      expect(box.left, `${box.selector} left edge at ${width}px`).toBeGreaterThanOrEqual(0);
      expect(box.right, `${box.selector} right edge at ${width}px`).toBeLessThanOrEqual(width + 1);
      expect(box.fontSize, `${box.selector} text size at ${width}px`).toBeGreaterThanOrEqual(14);
    }
  }
});

test('repeated mounts keep one preview listener and load only ESM without legacy app globals', async ({ page }) => {
  const errors: string[] = [];
  const scripts: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (request.resourceType() === 'script') scripts.push(request.url()); });
  await useExistingTabSession(page);
  await page.goto('/');
  await expectReady(page, 'home', 1);
  for (const feature of [...features, ...features]) {
    await page.locator(`#feature-nav a[data-feature="${feature}"]`).click();
    await expectReady(page, feature, 1);
  }
  await expect(page.locator('#entry-details')).toHaveAttribute('data-click-count', '0');
  await page.locator('[data-module-action="preview"]').click();
  await expect(page.locator('#entry-details')).toBeVisible();
  await expect(page.locator('#entry-details')).toHaveAttribute('data-click-count', '1');
  const runtime = await page.evaluate(() => ({
    scripts: [...document.querySelectorAll<HTMLScriptElement>('script[src]')].map(script => ({ type: script.type, src: script.src })),
    legacyGlobals: ['HSK1_LESSONS', '__NEW_HSK1_3_DATA', '__NEW_HSK1_ENRICHMENT', 'HSKStep3Entry', 'initGate'].filter(key => key in window),
  }));
  expect(runtime.scripts).toHaveLength(1);
  expect(runtime.scripts[0]?.type).toBe('module');
  expect(runtime.legacyGlobals).toEqual([]);
  expect(scripts.some(url => /(?:app-core|learning-integrated|new-data|new-enrichment|auth-patch|stage[23]\/app)\.js(?:\?|$)/.test(url))).toBe(false);
  expect(errors).toEqual([]);
});
