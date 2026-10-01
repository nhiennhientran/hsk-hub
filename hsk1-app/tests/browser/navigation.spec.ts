import { test, expect, type Page, type Route } from '@playwright/test';

const metadataPattern = '**/*course-index*.json*';

async function useExistingTabSession(page: Page): Promise<void> {
  await page.addInitScript(() => sessionStorage.setItem('hsk_portal_unlocked_v2', '1'));
}

async function expectRoute(page: Page, feature: string, lesson: number, hash?: string): Promise<void> {
  const host = page.locator('#module-host');
  await expect(host).toHaveAttribute('data-state', 'ready');
  await expect(host).toHaveAttribute('data-feature', feature);
  await expect(host).toHaveAttribute('data-lesson', String(lesson));
  await expect(page.locator('#lesson-select')).toHaveValue(String(lesson));
  if (hash) await expect.poll(() => new URL(page.url()).hash).toBe(hash);
}

test('canonical routes and actual legacy HTML entries preserve feature, lesson, section and homework part', async ({ page }) => {
  await useExistingTabSession(page);
  const cases = [
    { url: '/#/textbook?lesson=10&section=text', feature: 'textbook', lesson: 10, hash: '#/textbook?lesson=10&section=text' },
    { url: '/lesson.html?id=15&sec=hanzi', feature: 'textbook', lesson: 15, hash: '#/textbook?lesson=15&section=hanzi' },
    { url: '/learning.html?mode=vocab&lesson=7', feature: 'vocabulary', lesson: 7, hash: '#/vocabulary?lesson=7' },
    { url: '/learning.html?mode=listening&lesson=12', feature: 'listening', lesson: 12, hash: '#/listening?lesson=12' },
    { url: '/learning.html?mode=homework&lesson=2#lesson=10&part=sort', feature: 'homework', lesson: 10, hash: '#/homework?lesson=10&part=sort' },
    { url: '/learning.html?mode=homework&lesson=1&stage=choice#lesson=15&part=translation', feature: 'homework', lesson: 15, hash: '#/homework?lesson=15&part=translation' },
    { url: '/learning.html?mode=listening&lesson=1#/textbook?lesson=10&section=grammar', feature: 'textbook', lesson: 10, hash: '#/textbook?lesson=10&section=grammar' },
    { url: '/#/unknown?lesson=99', feature: 'home', lesson: 1, hash: '#/home?lesson=1' },
  ];
  for (const route of cases) {
    await page.goto(route.url);
    await expectRoute(page, route.feature, route.lesson, route.hash);
    expect(new URL(page.url()).search).toBe('');
    if (route.feature === 'textbook' || route.feature === 'homework') {
      await expect(page.locator('#module-host a[aria-current="page"]')).toHaveAttribute('href', route.hash);
    }
  }
});

test('module changes preserve lesson and browser back, forward and refresh restore exact routes', async ({ page }) => {
  await useExistingTabSession(page);
  await page.goto('/#/textbook?lesson=10&section=text');
  await expectRoute(page, 'textbook', 10, '#/textbook?lesson=10&section=text');
  await page.locator('#feature-nav a[data-feature="homework"]').click();
  await expectRoute(page, 'homework', 10, '#/homework?lesson=10&part=choice');
  await page.locator('#lesson-select').selectOption('15');
  await expectRoute(page, 'homework', 15, '#/homework?lesson=15&part=choice');
  await page.locator('#module-host a[href="#/homework?lesson=15&part=sort"]').click();
  await expectRoute(page, 'homework', 15, '#/homework?lesson=15&part=sort');
  await page.locator('#feature-nav a[data-feature="vocabulary"]').click();
  await expectRoute(page, 'vocabulary', 15, '#/vocabulary?lesson=15');
  await page.goBack();
  await expectRoute(page, 'homework', 15, '#/homework?lesson=15&part=sort');
  await page.goBack();
  await expectRoute(page, 'homework', 15, '#/homework?lesson=15&part=choice');
  await page.goBack();
  await expectRoute(page, 'homework', 10, '#/homework?lesson=10&part=choice');
  await page.goBack();
  await expectRoute(page, 'textbook', 10, '#/textbook?lesson=10&section=text');
  await page.goForward();
  await page.goForward();
  await page.goForward();
  await expectRoute(page, 'homework', 15, '#/homework?lesson=15&part=sort');
  await page.reload();
  await expectRoute(page, 'homework', 15, '#/homework?lesson=15&part=sort');
  await page.goForward();
  await expectRoute(page, 'vocabulary', 15, '#/vocabulary?lesson=15');
});

test('pending controls ignore early clicks and rapid switching aborts old fetches while the newest view wins', async ({ page }) => {
  const errors: string[] = [];
  const pending: Route[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await useExistingTabSession(page);
  await page.addInitScript(() => {
    type FetchObservation = { signalPresent: boolean; aborted: boolean; settled: boolean };
    const state = window as unknown as { __metadataFetches: FetchObservation[] };
    state.__metadataFetches = [];
    const originalFetch = window.fetch.bind(window);
    window.fetch = (input, init) => {
      const url = input instanceof Request ? input.url : String(input);
      if (!url.includes('course-index') || !url.includes('.json')) return originalFetch(input, init);
      const signal = init?.signal ?? (input instanceof Request ? input.signal : undefined);
      const observation = { signalPresent: Boolean(signal), aborted: Boolean(signal?.aborted), settled: false };
      state.__metadataFetches.push(observation);
      signal?.addEventListener('abort', () => { observation.aborted = true; }, { once: true });
      return originalFetch(input, init).then(
        response => { observation.settled = true; return response; },
        error => { observation.settled = true; throw error; },
      );
    };
  });
  await page.route(metadataPattern, route => { pending.push(route); });
  await page.goto('/#/home?lesson=10', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => pending.length).toBe(1);
  const host = page.locator('#module-host');
  await expect(host).toHaveAttribute('data-state', 'loading');
  await expect(host.locator('h1')).toBeVisible();
  await expect(host.locator('fieldset[data-module-controls]')).toHaveAttribute('disabled', '');
  await expect(host.locator('[data-module-action="preview"]')).toBeDisabled();
  // Native disabled activation is a no-op; force-clicking would bypass the user contract.
  await host.locator('[data-module-action="preview"]').evaluate(button => (button as HTMLButtonElement).click());
  await expect(page.locator('#entry-details')).toBeHidden();
  await expect(page.locator('#entry-details')).toHaveAttribute('data-click-count', '0');
  await page.locator('#feature-nav a[data-feature="listening"]').click();
  await expect.poll(() => pending.length).toBe(2);
  await expect(host).toHaveAttribute('data-feature', 'listening');
  await page.locator('#feature-nav a[data-feature="homework"]').click();
  await expect.poll(() => pending.length).toBe(3);
  await expect(host).toHaveAttribute('data-feature', 'homework');
  await expect(host.locator('#submit-homework')).toBeDisabled();
  await host.locator('#submit-homework').evaluate(button => (button as HTMLButtonElement).click());
  await pending[2]!.continue();
  await expectRoute(page, 'homework', 10, '#/homework?lesson=10&part=choice');
  // Only retired requests fail; the current request has already succeeded.
  await pending[0]!.abort('failed');
  await pending[1]!.abort('failed');
  await expect.poll(() => page.evaluate(() => {
    const observations = (window as unknown as { __metadataFetches: Array<{ signalPresent: boolean; aborted: boolean; settled: boolean }> }).__metadataFetches;
    return observations.map(row => ({ ...row }));
  })).toEqual([
    { signalPresent: true, aborted: true, settled: true },
    { signalPresent: true, aborted: true, settled: true },
    { signalPresent: true, aborted: false, settled: true },
  ]);
  await expectRoute(page, 'homework', 10, '#/homework?lesson=10&part=choice');
  await expect(page.locator('#submit-homework')).toBeEnabled();
  await expect(page.locator('[data-question-id]')).toHaveCount(5);
  const hasSubmission = () => page.evaluate(() => {
    const raw = localStorage.getItem('ran_hsk1_modular_v1');
    return Boolean(raw && JSON.parse(raw).data.homework.lessons['10']?.choice?.latest);
  });
  expect(await hasSubmission()).toBe(false);
  await page.locator('#submit-homework').click();
  expect(await hasSubmission()).toBe(false);
  await expect(page.locator('#receipt-latest')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('metadata HTTP 503 exposes a usable retry that keeps the lesson, section and history position', async ({ page }) => {
  let requests = 0;
  await useExistingTabSession(page);
  await page.route(metadataPattern, async route => {
    requests++;
    if (requests === 1) await route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"temporarily unavailable"}' });
    else await route.continue();
  });
  await page.goto('/#/textbook?lesson=10&section=text');
  await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'error');
  await expect(page.locator('#module-host')).toHaveAttribute('data-lesson', '10');
  await expect(page.locator('#module-status')).toHaveAttribute('role', 'status');
  await expect(page.locator('#module-status')).not.toHaveText('');
  await expect(page.locator('#retry-module')).toBeVisible();
  await expect(page.locator('#retry-module')).toBeEnabled();
  await expect(page.locator('#lesson-select')).toHaveValue('10');
  const before = await page.evaluate(() => ({ href: location.href, length: history.length }));
  await page.locator('#retry-module').click();
  await expectRoute(page, 'textbook', 10, '#/textbook?lesson=10&section=text');
  await expect(page.locator('#module-host a[aria-current="page"]')).toHaveAttribute('href', '#/textbook?lesson=10&section=text');
  await expect(page.locator('[data-module-action="preview"]')).toBeEnabled();
  await expect(page.locator('#retry-module')).toBeHidden();
  expect(await page.evaluate(() => ({ href: location.href, length: history.length }))).toEqual(before);
  expect(requests).toBe(2);
});

test('five hundred clicks on the current module produce no history writes or remounts', async ({ page }) => {
  let metadataRequests = 0;
  page.on('request', request => { if (request.url().includes('course-index') && request.url().includes('.json')) metadataRequests++; });
  await useExistingTabSession(page);
  await page.goto('/#/textbook?lesson=10&section=text');
  await expectRoute(page, 'textbook', 10, '#/textbook?lesson=10&section=text');
  const result = await page.evaluate(() => {
    let pushes = 0;
    let replacements = 0;
    const originalPush = history.pushState;
    const originalReplace = history.replaceState;
    const before = { href: location.href, length: history.length };
    history.pushState = function (...args) { pushes++; return originalPush.apply(this, args); };
    history.replaceState = function (...args) { replacements++; return originalReplace.apply(this, args); };
    try {
      const anchor = document.querySelector<HTMLAnchorElement>('#feature-nav a[data-feature="textbook"]')!;
      for (let click = 0; click < 500; click++) anchor.click();
      return { pushes, replacements, before, after: { href: location.href, length: history.length } };
    } finally {
      history.pushState = originalPush;
      history.replaceState = originalReplace;
    }
  });
  await expectRoute(page, 'textbook', 10, '#/textbook?lesson=10&section=text');
  expect(result.pushes).toBe(0);
  expect(result.replacements).toBe(0);
  expect(result.after).toEqual(result.before);
  expect(metadataRequests).toBe(1);
  await page.locator('[data-module-action="preview"]').click();
  await expect(page.locator('#entry-details')).toHaveAttribute('data-click-count', '1');
});
