import { bilingualText } from '../../src/app/bilingual.ts';
import { coreCopy } from '../../src/app/i18n/core.ts';
import { test, expect, type Page } from '@playwright/test';

test.use({ trace: 'off', video: 'off', screenshot: 'off' });

async function enterPassword(page: Page, value: string): Promise<void> {
  await page.locator('#class-password').evaluate((element, input) => {
    const field = element as HTMLInputElement; field.value = input;
    field.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
}

const sessionKey = 'hsk_portal_unlocked_v2';
const features = ['home', 'textbook', 'exercises', 'homework', 'listening', 'vocabulary', 'review', 'progress'] as const;

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
  else if (feature === 'listening') await expect(host.locator('#listening-start')).toBeEnabled();
  else if (feature === 'vocabulary') await expect(host.locator('#vocabulary-start')).toBeEnabled();
  else if (feature === 'review') await expect(host.locator('#review-vocabulary')).toBeVisible();
  else if (feature === 'progress') await expect(host.locator('#open-data-manager')).toBeEnabled();
  else if (feature === 'exercises') await expect(host.locator('#exercise-submit')).toHaveCount(0);
  else {
    await expect(host.locator('#home-module .lesson-card')).toHaveCount(15);
    await expect(host.locator('.home-progress-details > summary')).toBeVisible();
    await expect(host.locator('#home-progress')).toHaveCount(1);
  }
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
  await expect(page.locator('#auth-message')).toHaveText(bilingualText(coreCopy.incorrect));
  await expect(page.locator('#auth-gate')).toBeVisible();
  await expect(page.locator('#module-host[data-state="ready"]')).toHaveCount(0);
  expect(await page.evaluate(key => sessionStorage.getItem(key), sessionKey)).toBeNull();
});

test('the real password works with Enter, reload reuses this tab session, and a new context is locked', async ({ page, browser }) => {
  const password = process.env.HSK_TEST_PASSWORD;
  test.skip(!password, 'Set HSK_TEST_PASSWORD to run the correct-password browser acceptance.');
  await page.goto('/#/textbook?lesson=10&section=text');
  await expect(page.locator('#auth-gate')).toBeVisible();
  await enterPassword(page, password!);
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

for (const mode of ['unavailable', 'throws', 'rejects'] as const) {
  test(`the gate fails closed with a browser/HTTPS explanation when WebCrypto ${mode}`, async ({ page }) => {
    const password = process.env.HSK_TEST_PASSWORD;
    test.skip(!password, 'Set HSK_TEST_PASSWORD to run the correct-password browser acceptance.');
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(failure => {
      Object.defineProperty(globalThis, 'crypto', {
        configurable: true,
        value: failure === 'unavailable' ? undefined : {
          subtle: {
            digest() {
              if (failure === 'throws') throw new Error('Digest unavailable');
              return Promise.reject(new Error('Digest unavailable'));
            },
          },
        },
      });
    }, mode);
    await page.goto('/');
    await expect(page.locator('#auth-gate')).toBeVisible();
    for (const input of ['incorrect-auth-input', password!]) {
      await enterPassword(page, input);
      await page.locator('#class-password').press('Enter');
      await expect(page.locator('#auth-message')).toHaveText(
        bilingualText(coreCopy.unsupported),
      );
      await expect(page.locator('#unlock-session')).toBeEnabled();
      await expect(page.locator('#auth-gate')).toBeVisible();
      await expect(page.locator('#module-host[data-state="ready"]')).toHaveCount(0);
      expect(await page.evaluate(() => Object.keys(sessionStorage).filter(key => key.includes('unlocked')))).toEqual([]);
    }
    expect(errors).toEqual([]);
  });
}

test('four task groups, legacy routes and fifteen lessons remain reachable without extra assigned exercises', async ({ page }) => {
  await useExistingTabSession(page);
  await page.goto('/');
  await expectReady(page, 'home', 1);
  await expect(page.locator('#feature-nav a[data-feature]')).toHaveCount(4);
  await expect(page.locator('#lesson-select option')).toHaveCount(15);
  await expect(page.locator('#module-host .lesson-card[data-lesson]')).toHaveCount(15);
  for (let lesson = 1; lesson <= 15; lesson++) {
    const card = page.locator(`#module-host .lesson-card[data-lesson="${lesson}"]`);
    await expect(card.locator('[data-lesson-section]')).toHaveCount(5);
    for (const feature of ['homework', 'listening']) {
      await expect(card.locator(`a[href^="#/${feature}?lesson=${lesson}"]`)).toHaveCount(1);
    }
  }
  for (const feature of features) {
    await page.evaluate(feature => { location.hash = `#/${feature}?lesson=1`; }, feature);
    await expectReady(page, feature, 1);
    if (feature === 'homework') await expect(page.locator('#module-host [data-question-id]')).toHaveCount(5);
    else if (feature === 'listening') await expect(page.locator('#listening-settings [data-listening-lesson]')).toHaveCount(15);
    else if (feature === 'vocabulary') await expect(page.locator('[data-vocabulary-lesson]')).toHaveCount(15);
    else if (feature === 'review') await expect(page.locator('#review-module a')).toHaveCount(3);
    else if (feature === 'progress') await expect(page.locator('#module-host')).not.toContainText('chưa mở để làm bài');
  }
  await page.evaluate(() => { location.hash = '#/textbook?lesson=1&section=vocab'; });
  await expectReady(page, 'textbook', 1);
  for (let lesson = 1; lesson <= 15; lesson++) {
    await page.locator('#lesson-select').selectOption(String(lesson));
    await expectReady(page, 'textbook', lesson);
    await expect(page.locator('#lesson-select')).toHaveValue(String(lesson));
    await expect(page.locator('.lesson-hero .eyebrow')).toContainText(`Bài ${lesson}`);
  }
});

test('the shell and home course overview remain readable without horizontal overflow at four viewport widths', async ({ page }) => {
  await useExistingTabSession(page);
  await page.goto('/');
  await expectReady(page, 'home', 1);
  for (const width of [320, 390, 768, 1104]) {
    await page.setViewportSize({ width, height: 800 });
    await expect(page.locator('#feature-nav')).toBeVisible();
    await expect(page.locator('#lesson-search')).toBeVisible();
    await page.locator('.home-progress-details').evaluate(node => (node as HTMLDetailsElement).open = true);
    await expect(page.locator('#module-host h1')).toBeVisible();
    await expect(page.locator('#home-progress')).toBeVisible();
    await expect(page.locator('.lesson-grid')).toBeVisible();
    const layout = await page.evaluate(() => ({
      viewport: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      boxes: ['#feature-nav', '#lesson-search', '#module-host', '#module-host h1', '#home-progress', '.lesson-grid'].map(selector => {
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

test('repeated mounts keep one home view and route listener and load only ESM without legacy app globals', async ({ page }) => {
  const errors: string[] = [];
  const scripts: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (request.resourceType() === 'script') scripts.push(request.url()); });
  await useExistingTabSession(page);
  await page.goto('/');
  await expectReady(page, 'home', 1);
  for (const feature of [...features, ...features]) {
    await page.evaluate(feature => { location.hash = `#/${feature}?lesson=1`; }, feature);
    await expectReady(page, feature, 1);
  }
  await page.locator('#feature-nav a[data-feature="home"]').click();
  await expectReady(page, 'home', 1);
  await expect(page.locator('#home-module')).toHaveCount(1);
  await expect(page.locator('#home-progress')).toHaveCount(1);
  await expect(page.locator('.lesson-card')).toHaveCount(15);
  await expect(page.locator('[data-module-action="preview"], #entry-details')).toHaveCount(0);
  const before = await page.evaluate(() => history.length);
  await page.locator('.lesson-card[data-lesson="10"] h2 a').click();
  await expectReady(page, 'textbook', 10);
  expect(await page.evaluate(() => history.length)).toBe(before + 1);
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
