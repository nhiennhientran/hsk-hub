import { openLearningSettings } from './active-view-helpers.ts';
import { readFile } from 'node:fs/promises';
import { test, expect, type Page, type Route } from '@playwright/test';

// The removed search/due/reverse/rating UI remains covered at the legacy domain level.
// Responsive mixed-card behavior and all344 sense faces live in mixed-cards.spec.ts.
// This suite retains native audio and interrupted loading coverage on the current UI.
const stateKey = 'ran_hsk1_modular_v1';
type Word = { senseId: string; lesson: number; zh: string; py: string; vi: string;
  audio: { track: string; start: number; end: number } | null };
const catalog = JSON.parse(await readFile(new URL('../../content/stage3-catalog.json', import.meta.url), 'utf8')) as { vocabulary: Word[] };
const words = new Map(catalog.vocabulary.map(word => [word.senseId, word]));
const card = (page: Page) => page.locator('#vocabulary-grid > [data-sense-id]').first();
async function authenticate(page: Page): Promise<void> {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.addInitScript(() => sessionStorage.setItem('hsk_portal_unlocked_v2', '1'));
}
async function ready(page: Page, feature = 'vocabulary'): Promise<void> {
  await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'ready');
  await expect(page.locator('#module-host')).toHaveAttribute('data-feature', feature);
  await expect(page.locator('#vocabulary-settings')).toBeVisible();
}
async function start(page: Page, lessons: number[]): Promise<void> {
  await openLearningSettings(page, 'vocabulary');
  await page.locator('#vocabulary-none').click();
  for (const lesson of lessons) await page.locator(`[data-vocabulary-lesson="${lesson}"]`).check();
  await page.locator('#vocabulary-start').click();
  await expect(card(page)).toBeVisible();
}
async function current(page: Page): Promise<Word> {
  const id = await card(page).getAttribute('data-sense-id'), word = words.get(id!);
  if (!word) throw new Error(`Unknown visible vocabulary sense ${id}`);
  return word;
}
async function audioWord(page: Page): Promise<Word> {
  for (let index = 0; index < 40; index++) {
    const word = await current(page);
    if (word.audio) return word;
    await page.locator('#vocabulary-next').click();
  }
  throw new Error('Selected lessons contain no reachable original clip');
}
async function reveal(page: Page): Promise<void> {
  await card(page).locator('.mixed-card-toggle').click();
  await expect(card(page).locator('.mixed-card-back')).toBeVisible();
}
async function data(page: Page): Promise<any> {
  await expect(page.locator('#vocabulary-save-status')).toHaveAttribute('data-state', 'saved');
  return page.evaluate(key => JSON.parse(localStorage.getItem(key)!).data, stateKey);
}

// Observe genuine HTMLMediaElement playback. No duration/currentTime/play mocks.
async function observeNative(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const state = window as unknown as { __vocabularyMedia: HTMLMediaElement[]; __vocabularyEvents: any[] };
    state.__vocabularyMedia = []; state.__vocabularyEvents = [];
    const watched = new WeakSet<HTMLMediaElement>();
    const record = (event: string, media: HTMLMediaElement, detail?: string) => {
      state.__vocabularyEvents.push({ event, detail, src: media.currentSrc, time: media.currentTime, duration: media.duration,
        paused: media.paused, ended: media.ended, readyState: media.readyState, seeking: media.seeking, errorCode: media.error?.code,
        uiState: document.querySelector<HTMLElement>('#vocabulary-audio-status')?.dataset.state,
        at: performance.now(), card: document.querySelector('#vocabulary-grid > [data-sense-id]')?.getAttribute('data-sense-id') });
      if (state.__vocabularyEvents.length > 200) state.__vocabularyEvents.shift();
    };
    const observe = (media: HTMLMediaElement) => {
      if (watched.has(media)) return;
      watched.add(media); state.__vocabularyMedia.push(media);
      for (const event of ['play', 'playing', 'pause', 'timeupdate', 'ended', 'error', 'loadedmetadata', 'loadeddata', 'canplay', 'waiting', 'stalled', 'seeking', 'seeked']) media.addEventListener(event, () => record(event, media));
    };
    const load = HTMLMediaElement.prototype.load;
    HTMLMediaElement.prototype.load = function () { observe(this); record('load-call', this); return load.call(this); };
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      observe(this); record('play-call', this);
      const real = play.call(this);
      void real.then(() => record('play-resolved', this), error => record('play-rejected', this, `${error?.name}: ${error?.message}`));
      return real;
    };
    const pause = HTMLMediaElement.prototype.pause;
    HTMLMediaElement.prototype.pause = function () { observe(this); record('pause-call', this); return pause.call(this); };
  });
}
async function native(page: Page): Promise<{ src: string; time: number; duration: number; paused: boolean; count: number }> {
  return page.evaluate(() => {
    const elements = (window as unknown as { __vocabularyMedia: HTMLMediaElement[] }).__vocabularyMedia;
    const audio = elements[0];
    return { src: audio?.currentSrc ?? '', time: audio?.currentTime ?? 0, duration: audio?.duration ?? 0,
      paused: audio?.paused ?? true, count: elements.length };
  });
}
async function playing(page: Page, word: Word): Promise<void> {
  await expect(page.locator('[data-mixed-play]')).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(async () => (await native(page)).src).toContain(`/course-assets/audio/${word.audio!.track}.mp3`);
  await expect.poll(async () => (await native(page)).time).toBeGreaterThan(word.audio!.start + .035);
  expect((await native(page)).paused).toBe(false);
  expect((await native(page)).duration).toBeGreaterThan(word.audio!.end);
  expect((await native(page)).count).toBe(1);
}
test.afterEach(async ({ page }, testInfo) => {
  if (page.isClosed()) return;
  const observed = await page.evaluate(() => (window as unknown as { __vocabularyEvents?: any[] }).__vocabularyEvents).catch(() => null);
  if (observed) await testInfo.attach('vocabulary-native-media-history', { body: Buffer.from(JSON.stringify(observed, null, 2)), contentType: 'application/json' });
});

test('mixed card native original clips play, stop, replay and end precisely in lessons1/10/15, then stop on route exit', async ({ page }) => {
  test.setTimeout(75_000);
  await authenticate(page); await observeNative(page);
  await page.goto('/#/vocabulary?lesson=1'); await ready(page);
  for (const lesson of [1, 10, 15]) {
    await start(page, [lesson]);
    const word = await audioWord(page);
    await expect(card(page).locator('[data-mixed-play]')).toHaveCount(0);
    await reveal(page);
    const play = card(page).locator('[data-mixed-play]');
    await expect(play).toBeEnabled();
    await play.click(); await playing(page, word);
    await play.click();
    await expect.poll(async () => (await native(page)).paused).toBe(true);
    await expect(play).toHaveAttribute('aria-pressed', 'false');
    await play.click(); await playing(page, word);
    await expect.poll(async () => (await native(page)).paused, { timeout: 15_000 }).toBe(true);
    const ended = await native(page);
    expect(ended.time).toBeGreaterThanOrEqual(word.audio!.end - .12);
    expect(ended.time).toBeLessThanOrEqual(word.audio!.end + .3);
    await play.click(); await playing(page, word);
    // Flipping to the Chinese face cancels pronunciation without saving a rating.
    await card(page).locator('.mixed-card-toggle').click();
    await expect.poll(async () => (await native(page)).paused).toBe(true);
    await expect(card(page).locator('.mixed-card-back, [data-mixed-play]')).toHaveCount(0);
    await reveal(page); await play.click(); await playing(page, word);
    await page.setViewportSize({ width: lesson === 10 ? 1440 : 768, height: 900 });
    await expect.poll(async () => (await native(page)).paused).toBe(true);
    await expect(page.locator('.mixed-card-back')).toHaveCount(0);
    await page.setViewportSize({ width: 390, height: 900 });
  }
  const word = await audioWord(page);
  await reveal(page); await card(page).locator('[data-mixed-play]').click(); await playing(page, word);
  const saved = await data(page);
  expect(saved.practice.cards).toEqual({ review: null, schedule: {} });
  await page.locator('#feature-nav [data-feature="home"]').click();
  await expect(page.locator('#module-host')).toHaveAttribute('data-feature', 'home');
  await expect.poll(async () => (await native(page)).paused).toBe(true);
  await expect(page.locator('#vocabulary-module')).toHaveCount(0);
});

test('a mixed-card MP3 failure can retry and a late superseded clip never restarts after a new round', async ({ page }) => {
  test.setTimeout(40_000);
  await authenticate(page); await observeNative(page);
  await page.goto('/#/vocabulary?lesson=1'); await ready(page); await start(page, [1]);
  const first = await audioWord(page), failedURL = `**/course-assets/audio/${first.audio!.track}.mp3`;
  let fail = true;
  await page.route(failedURL, async route => { if (fail) await route.fulfill({ status: 503, body: 'temporary unavailable' }); else await route.continue(); });
  await reveal(page); await card(page).locator('[data-mixed-play]').click();
  await expect(page.locator('#vocabulary-audio-status')).toBeVisible();
  await expect(card(page).locator('[data-mixed-play]')).toHaveAttribute('aria-pressed', 'false');
  fail = false;
  await card(page).locator('[data-mixed-play]').click(); await playing(page, first);
  await page.unroute(failedURL);
  await start(page, [10]);
  const pendingWord = await audioWord(page), held: Route[] = [];
  await page.route(`**/course-assets/audio/${pendingWord.audio!.track}.mp3`, route => { held.push(route); });
  await reveal(page); await card(page).locator('[data-mixed-play]').click();
  await expect.poll(() => held.length).toBeGreaterThan(0);
  await start(page, [15]);
  const latest = await audioWord(page);
  await reveal(page); await card(page).locator('[data-mixed-play]').click(); await playing(page, latest);
  for (const route of held) await route.abort('failed');
  await expect(card(page)).toHaveAttribute('data-sense-id', latest.senseId);
  expect((await native(page)).src).toContain(`/course-assets/audio/${latest.audio!.track}.mp3`);
  await expect(page.locator('#vocabulary-audio-status')).toBeHidden();
  const stored = await data(page);
  expect(stored.mixedVocabulary.round.lessons).toEqual([15]);
  expect(stored.practice.cards).toEqual({ schedule: {}, review: null });
});

test('words without original clips display a bilingual notice and never offer invented pronunciation audio', async ({ page }) => {
  test.setTimeout(40_000);
  await authenticate(page);
  await page.goto('/#/vocabulary?lesson=1'); await ready(page);
  const missing = catalog.vocabulary.filter(word => !word.audio), seen = new Set<string>();
  for (const lesson of [...new Set(missing.map(word => word.lesson))]) {
    await start(page, [lesson]);
    const saved = await data(page), ids: string[] = saved.mixedVocabulary.round.senseIds;
    for (let index = 0; index < ids.length; index++) {
      const word = await current(page);
      if (!word.audio) {
        await reveal(page);
        await expect(card(page).locator('[data-mixed-play]')).toHaveCount(0);
        await expect(card(page).locator('.mixed-card-audio [lang="zh"]')).toHaveText('此词暂无原音');
        await expect(card(page).locator('.mixed-card-audio [lang="vi"]')).toHaveText('Từ này chưa có âm thanh gốc');
        seen.add(word.senseId);
      }
      if (index + 1 < ids.length) await page.locator('#vocabulary-next').click();
    }
  }
  expect([...seen].sort()).toEqual(missing.map(word => word.senseId).sort());
  expect(seen.size).toBe(14);
});

test('mixed vocabulary blocks early input, retries failed metadata and ignores a retired loading route', async ({ page }) => {
  await authenticate(page);
  const pending: Route[] = [];
  await page.route(/media-references[^/]*\.json(?:\?.*)?$/, route => { pending.push(route); });
  await page.goto('/#/vocabulary?lesson=7', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => pending.length).toBe(1);
  await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'loading');
  await expect(page.locator('#vocabulary-module fieldset[data-module-controls]')).toHaveAttribute('disabled', '');
  await expect(page.locator('.mixed-card-toggle')).toHaveCount(0);
  await pending[0]!.fulfill({ status: 503, body: 'temporary unavailable' });
  await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'error');
  await page.locator('#retry-module').click();
  await expect.poll(() => pending.length).toBe(2);
  await pending[1]!.continue(); await ready(page);
  await page.locator('#feature-nav [data-feature="home"]').click();
  await expect(page.locator('#home-module')).toBeVisible();
  await page.locator('#feature-nav [data-feature="review"]').click();
  await expect.poll(() => pending.length).toBe(3);
  await page.locator('#feature-nav [data-feature="home"]').click();
  await expect(page.locator('#home-module')).toBeVisible();
  await pending[2]!.abort('failed');
  await expect(page.locator('#vocabulary-module')).toHaveCount(0);
  await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'ready');
});
