import { readFile } from 'node:fs/promises';
import { test, expect, type Page, type Route } from '@playwright/test';
import practiceEngine from '../../src/domain/practice/engine.js';

const stateKey = 'ran_hsk1_modular_v1';
const sessionKey = 'hsk_portal_unlocked_v2';
const now = Date.parse('2026-10-02T08:00:00Z');
const day = 86_400_000;
type Word = { id: string; senseId: string; lexId: string; lesson: number; zh: string; py: string; vi: string;
  senseZh: string; cueZh: string; category: string; extension: boolean; fingerprint: string;
  source: { printPages: number[]; pdfPages: number[]; section: string };
  audio: { track: string; start: number; end: number } | null };
const catalog = JSON.parse(await readFile(new URL('../../content/stage3-catalog.json', import.meta.url), 'utf8')) as { vocabulary: Word[] };
const words = new Map(catalog.vocabulary.map(word => [word.senseId, word]));
const fixtures = await Promise.all(['stage2.json', 'stage3.json'].map(file => readFile(new URL(`../fixtures/migration/${file}`, import.meta.url), 'utf8')));

function seededData(): any {
  const practice = JSON.parse(fixtures[1]!);
  practice.cards = { schedule: {}, review: null };
  return { reading: { lessons: { '1': { visited: true, complete: true } }, mastered: { '1-你好': true },
    modules: { 'hsk1:1': { modules: ['vocab', 'text'], updatedAt: 1789891200000 } } },
  homework: JSON.parse(fixtures[0]!), practice, navigation: null, legacyRaw: {} };
}
function envelope(data: any): string {
  return JSON.stringify({ app: 'hsk1-modular', schema: 1, revision: 1, updatedAt: now, data, recovery: null });
}
async function authenticate(page: Page, raw?: string): Promise<void> {
  await page.addInitScript(({ stateKey, sessionKey, raw }) => {
    sessionStorage.setItem(sessionKey, '1');
    if (raw && !localStorage.getItem(stateKey)) localStorage.setItem(stateKey, raw);
  }, { stateKey, sessionKey, raw });
}
async function ready(page: Page, feature = 'vocabulary', lesson = 1): Promise<void> {
  await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'ready');
  await expect(page.locator('#module-host')).toHaveAttribute('data-feature', feature);
  await expect(page.locator('#module-host')).toHaveAttribute('data-lesson', String(lesson));
  await expect(page.locator('#vocabulary-settings')).toBeVisible();
}
async function select(page: Page, lessons: number[], filter = 'all', direction = 'zh-vi', shuffle = false): Promise<void> {
  await page.locator('#vocabulary-none').click();
  for (const lesson of lessons) await page.locator(`[data-vocabulary-lesson="${lesson}"]`).check();
  await page.locator('#vocabulary-filter').selectOption(filter);
  await page.locator('#vocabulary-direction').selectOption(direction);
  await page.locator('#vocabulary-shuffle').setChecked(shuffle);
}
async function start(page: Page, lessons: number[], filter = 'all', direction = 'zh-vi', shuffle = false): Promise<void> {
  await select(page, lessons, filter, direction, shuffle);
  await page.locator('#vocabulary-start').click();
  await expect(page.locator('#vocabulary-card')).toBeVisible();
}
async function saved(page: Page): Promise<void> { await expect(page.locator('#vocabulary-save-status')).toHaveAttribute('data-state', 'saved'); }
async function data(page: Page): Promise<any> {
  await saved(page);
  return page.evaluate(key => JSON.parse(localStorage.getItem(key)!).data, stateKey);
}
async function current(page: Page): Promise<Word> {
  const id = await page.locator('#vocabulary-card').getAttribute('data-sense-id');
  const word = words.get(id!);
  if (!word) throw new Error(`Unknown visible vocabulary sense ${id}`);
  return word;
}
async function rate(page: Page, rating = 'good'): Promise<void> {
  await page.locator('#vocabulary-reveal').click();
  await expect(page.locator('#vocabulary-answer')).toBeVisible();
  await page.locator(`#vocabulary-${rating}`).click();
}
async function downloadBackup(page: Page): Promise<{ raw: string; data: any }> {
  const pending = page.waitForEvent('download');
  await page.locator('#export-backup').click();
  const download = await pending;
  expect(await download.failure()).toBeNull();
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString('utf8');
  return { raw, data: JSON.parse(raw).data };
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
        at: performance.now(), card: document.querySelector('#vocabulary-card')?.getAttribute('data-sense-id') });
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
  await expect(page.locator('#vocabulary-audio-status')).toHaveAttribute('data-state', 'playing');
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

test('all 344 senses reveal exact meanings, distinguish homographs, retain sources and rate once; 330 have audio and 14 explicitly do not', async ({ page }) => {
  test.setTimeout(240_000);
  await authenticate(page);
  await page.goto('/#/vocabulary?lesson=1');
  await ready(page);
  await page.locator('#vocabulary-all').click();
  await page.locator('#vocabulary-shuffle').uncheck();
  await page.locator('#vocabulary-direction').selectOption('zh-vi');
  await page.locator('#vocabulary-start').click();
  await page.locator('#vocabulary-pinyin').check();
  const seen: string[] = [];
  let audio = 0, noAudio = 0;
  for (const [index, word] of catalog.vocabulary.entries()) {
    await expect(page.locator('#vocabulary-card')).toHaveAttribute('data-sense-id', word.senseId);
    await expect(page.locator('#vocabulary-position')).toContainText(`${index + 1}`);
    await expect(page.locator('#vocabulary-card')).toContainText(word.zh);
    await expect(page.locator('#vocabulary-answer')).toHaveCount(0);
    await expect(page.locator('#vocabulary-good')).toBeDisabled();
    await expect(page.locator('#vocabulary-next')).toBeDisabled();
    await expect(page.locator('#vocabulary-play')).toBeDisabled();
    await page.locator('#vocabulary-reveal').click();
    if (word.audio) { await expect(page.locator('#vocabulary-play')).toBeEnabled(); audio++; }
    else {
      await expect(page.locator('#vocabulary-play')).toBeDisabled();
      await expect(page.locator('#vocabulary-audio-status')).toContainText(/chưa có|không có/i);
      noAudio++;
    }
    await expect(page.locator('#vocabulary-answer')).toContainText(word.vi);
    await expect(page.locator('#vocabulary-answer')).toContainText(word.category === 'proper_noun' ? 'Tên riêng' : 'Từ thông dụng');
    await expect(page.locator('#vocabulary-answer')).toContainText(word.extension ? 'Từ mở rộng' : 'Từ trong giáo trình');
    await expect(page.locator('#vocabulary-card')).toContainText(word.senseZh);
    if (word.cueZh) await expect(page.locator('#vocabulary-card')).toContainText(word.cueZh);
    await expect(page.locator('#vocabulary-card')).toContainText(word.source.section);
    for (const sourcePage of [...word.source.printPages, ...word.source.pdfPages]) await expect(page.locator('#vocabulary-card')).toContainText(String(sourcePage));
    await page.locator('#vocabulary-good').click();
    await expect(page.locator('#vocabulary-good')).toBeDisabled();
    seen.push(word.senseId);
    if (index < catalog.vocabulary.length - 1) await page.locator('#vocabulary-next').click();
  }
  expect(new Set(seen).size).toBe(344);
  expect({ audio, noAudio }).toEqual({ audio: 330, noAudio: 14 });
  const stored = (await data(page)).practice.cards;
  expect(stored.review.senseIds).toEqual(seen);
  expect(stored.review.finishedAt).not.toBeNull();
  expect(Object.keys(stored.schedule)).toHaveLength(344);
  for (const word of catalog.vocabulary) expect(stored.schedule[word.senseId]).toMatchObject({ level: 1, lastRating: 'good', reviewCount: 1 });
  const families = new Map<string, Word[]>();
  for (const word of catalog.vocabulary) families.set(word.zh, [...(families.get(word.zh) ?? []), word]);
  for (const homographs of [...families.values()].filter(group => group.length > 1)) {
    expect(new Set(homographs.map(word => word.senseId)).size).toBe(homographs.length);
    for (const word of homographs) expect(stored.review.ratings).toHaveProperty(word.senseId);
  }
});

test('non-contiguous lessons 7 and 10 yield exactly 50 cards, shuffled order persists, and empty settings cannot erase the queue', async ({ page }) => {
  await authenticate(page);
  await page.goto('/#/vocabulary?lesson=7');
  await ready(page, 'vocabulary', 7);
  await start(page, [7, 10]);
  const exact = catalog.vocabulary.filter(word => [7, 10].includes(word.lesson)).map(word => word.senseId);
  expect(exact).toHaveLength(50);
  expect((await data(page)).practice.cards.review.senseIds).toEqual(exact);
  await start(page, [7, 10], 'all', 'zh-vi', true);
  const shuffled = (await data(page)).practice.cards.review;
  expect([...shuffled.senseIds].sort()).toEqual([...exact].sort());
  await page.locator('#vocabulary-none').click();
  await expect(page.locator('#vocabulary-start')).toBeDisabled();
  await page.locator('#vocabulary-start').evaluate(button => (button as HTMLButtonElement).click());
  expect((await data(page)).practice.cards.review).toEqual(shuffled);
  await select(page, [7, 10], 'wrong');
  await expect(page.locator('#vocabulary-start')).toBeDisabled();
  expect((await data(page)).practice.cards.review).toEqual(shuffled);
  await page.reload();
  await ready(page, 'vocabulary', 7);
  await expect(page.locator('#vocabulary-card')).toHaveAttribute('data-sense-id', shuffled.senseIds[0]);
  expect((await data(page)).practice.cards.review).toEqual(shuffled);
  await page.locator('#vocabulary-all').click();
  await page.locator('#vocabulary-filter').selectOption('all');
  await page.locator('#vocabulary-start').click();
  expect((await data(page)).practice.cards.review.senseIds).toHaveLength(344);
});

test('both card directions hide the answer before reveal and pinyin can be toggled without leaking the Vietnamese-to-Chinese answer', async ({ page }) => {
  await authenticate(page);
  await page.goto('/#/vocabulary?lesson=1');
  await ready(page);
  for (const direction of ['zh-vi', 'vi-zh']) {
    await start(page, [1], 'all', direction);
    const word = await current(page);
    await page.locator('#vocabulary-pinyin').uncheck();
    await expect(page.locator('#vocabulary-answer')).toHaveCount(0);
    const before = await page.locator('#vocabulary-card').innerText();
    expect(before).toContain(direction === 'zh-vi' ? word.zh : word.vi);
    expect(before).not.toContain(direction === 'zh-vi' ? word.vi : word.zh);
    expect(before).not.toContain(word.py);
    await page.locator('#vocabulary-pinyin').check();
    if (direction === 'vi-zh') {
      expect(await page.locator('#vocabulary-card').innerText()).not.toContain(word.zh);
      expect(await page.locator('#vocabulary-card').innerText()).not.toContain(word.py);
    } else await expect(page.locator('#vocabulary-card')).toContainText(word.py);
    await page.locator('#vocabulary-reveal').click();
    await expect(page.locator('#vocabulary-answer')).toContainText(direction === 'zh-vi' ? word.vi : word.zh);
    await expect(page.locator('#vocabulary-card')).toContainText(word.py);
    await page.locator('#vocabulary-pinyin').uncheck();
    expect(await page.locator('#vocabulary-card').innerText()).not.toContain(word.py);
  }
});

test('again, hard and good create the exact schedule; filters update immediately and an early good does not advance the level', async ({ page }) => {
  await authenticate(page);
  await page.clock.setFixedTime(new Date(now));
  await page.goto('/#/vocabulary?lesson=1');
  await ready(page);
  await start(page, [1]);
  const rated: Word[] = [];
  for (const [index, rating] of ['again', 'hard', 'good'].entries()) {
    rated.push(await current(page));
    await rate(page, rating);
    if (index < 2) await page.locator('#vocabulary-next').click();
  }
  const stored = (await data(page)).practice.cards;
  expect(stored.schedule[rated[0]!.senseId]).toMatchObject({ level: 0, lastRating: 'again', dueAt: now + 600_000, reviewCount: 1 });
  expect(stored.schedule[rated[1]!.senseId]).toMatchObject({ level: 0, lastRating: 'hard', dueAt: now + day, reviewCount: 1 });
  expect(stored.schedule[rated[2]!.senseId]).toMatchObject({ level: 1, lastRating: 'good', dueAt: now + day, reviewCount: 1 });
  await start(page, [1], 'wrong');
  expect((await data(page)).practice.cards.review.senseIds).toEqual([rated[0]!.senseId]);
  await rate(page, 'good');
  await start(page, [1], 'unfamiliar');
  const unfamiliar = (await data(page)).practice.cards.review.senseIds;
  expect(unfamiliar).not.toContain(rated[0]!.senseId);
  expect(unfamiliar).not.toContain(rated[2]!.senseId);
  expect(unfamiliar).toContain(rated[1]!.senseId);
  await start(page, [1], 'due');
  const due = (await data(page)).practice.cards.review.senseIds;
  for (const word of rated) expect(due).not.toContain(word.senseId);
  await start(page, [1]);
  await rate(page, 'good');
  const early = (await data(page)).practice.cards;
  expect(early.schedule[rated[0]!.senseId]).toMatchObject({ level: 0, dueAt: now + 600_000, reviewCount: 3 });
  expect(early.review.ratings[rated[0]!.senseId]).toMatchObject({ early: true, advanced: false });
});

test('reload and review keep the saved queue, ratings, position and scope when current filter membership and selected lessons change', async ({ page }) => {
  const seeded = seededData();
  await authenticate(page, envelope(seeded));
  await page.goto('/#/vocabulary?lesson=7');
  await ready(page, 'vocabulary', 7);
  await start(page, [7, 10], 'unfamiliar', 'vi-zh', true);
  const first = await current(page);
  await rate(page, 'good');
  await page.locator('#vocabulary-next').click();
  const second = await current(page);
  await page.locator('#vocabulary-reveal').click();
  const before = (await data(page)).practice.cards;
  expect(before.review.senseIds).toContain(first.senseId);
  expect(before.review.position).toBe(1);
  // Current selection no longer contains either the queue's range or its filter.
  await select(page, [1], 'wrong', 'zh-vi');
  await expect(page.locator('#vocabulary-start')).toBeDisabled();
  await expect(page.locator('#vocabulary-queue-scope')).toContainText('7, 10');
  await page.reload();
  await ready(page, 'vocabulary', 7);
  await expect(page.locator('#vocabulary-card')).toHaveAttribute('data-sense-id', second.senseId);
  await expect(page.locator('#vocabulary-prompt')).toHaveText(second.vi);
  await expect(page.locator('#vocabulary-answer')).toContainText(second.zh);
  expect((await data(page)).practice.cards).toEqual(before);
  await page.locator('#vocabulary-resume').click();
  expect((await data(page)).practice.cards).toEqual(before);
  await page.locator('#feature-nav [data-feature="review"]').click();
  await ready(page, 'review', 7);
  await expect(page.locator('#module-host h1')).toContainText('Ôn tập');
  await expect(page.locator('#vocabulary-card')).toHaveAttribute('data-sense-id', second.senseId);
  await expect(page.locator('#vocabulary-queue-scope')).toContainText('7, 10');
  const after = await data(page);
  expect(after.practice.cards).toEqual(before);
  expect(after.reading).toEqual(seeded.reading);
  expect(after.homework).toEqual(seeded.homework);
  expect(after.practice.listening).toEqual(seeded.practice.listening);
  await select(page, [7, 10], 'all');
  await page.locator('#vocabulary-due').click();
  const due = (await data(page)).practice.cards.review;
  expect(due.filter).toBe('due');
  expect(due.senseIds).not.toContain(first.senseId);
  expect(due.senseIds).toHaveLength(49);
});

test('native original MP3 clips play, pause, replay and stop at their boundaries in lessons 1, 10 and 15 and stop on route exit', async ({ page }) => {
  test.setTimeout(70_000);
  await authenticate(page);
  await observeNative(page);
  await page.goto('/#/vocabulary?lesson=1');
  await ready(page);
  for (const lesson of [1, 10, 15]) {
    await start(page, [lesson]);
    const word = await current(page);
    expect(word.audio).not.toBeNull();
    await page.locator('#vocabulary-reveal').click();
    await page.locator('#vocabulary-play').click();
    await playing(page, word);
    await page.locator('#vocabulary-pause').click();
    await expect(page.locator('#vocabulary-audio-status')).toHaveAttribute('data-state', 'paused');
    const paused = await native(page);
    expect(paused.paused).toBe(true);
    await page.locator('#vocabulary-pause').click();
    await playing(page, word);
    await expect(page.locator('#vocabulary-audio-status')).toHaveAttribute('data-state', 'ended', { timeout: 15_000 });
    const ended = await native(page);
    expect(ended.paused).toBe(true);
    expect(ended.time).toBeGreaterThanOrEqual(word.audio!.end - .12);
    expect(ended.time).toBeLessThanOrEqual(word.audio!.end + .3);
    await page.locator('#vocabulary-replay').click();
    await playing(page, word);
    await page.locator('#vocabulary-good').click();
    await page.locator('#vocabulary-next').click();
    await expect.poll(async () => (await native(page)).paused).toBe(true);
    await expect(page.locator('#vocabulary-answer')).toHaveCount(0);
  }
  await page.locator('#vocabulary-reveal').click();
  const word = await current(page);
  await page.locator('#vocabulary-play').click();
  await playing(page, word);
  await page.locator('#feature-nav [data-feature="home"]').click();
  await expect(page.locator('#module-host')).toHaveAttribute('data-feature', 'home');
  await expect.poll(async () => (await native(page)).paused).toBe(true);
  await expect(page.locator('#vocabulary-module')).toHaveCount(0);
});

test('an MP3 HTTP failure retries successfully and a late superseded MP3 cannot restart after changing the round', async ({ page }) => {
  await authenticate(page);
  await observeNative(page);
  let fail = true;
  await page.route('**/course-assets/audio/1-6.mp3', async route => {
    if (fail) await route.fulfill({ status: 503, body: 'temporary unavailable' });
    else await route.continue();
  });
  await page.goto('/#/vocabulary?lesson=1');
  await ready(page);
  await start(page, [1]);
  const first = await current(page);
  await page.locator('#vocabulary-reveal').click();
  await page.locator('#vocabulary-play').click();
  await expect(page.locator('#vocabulary-audio-status')).toHaveAttribute('data-state', 'error');
  fail = false;
  await page.locator('#vocabulary-replay').click();
  await playing(page, first);
  await page.unroute('**/course-assets/audio/1-6.mp3');
  await start(page, [10]);
  const held: Route[] = [];
  const pendingWord = await current(page);
  await page.route(`**/course-assets/audio/${pendingWord.audio!.track}.mp3`, route => { held.push(route); });
  await page.locator('#vocabulary-reveal').click();
  await page.locator('#vocabulary-play').click();
  await expect.poll(() => held.length).toBeGreaterThan(0);
  await start(page, [15]);
  const latest = await current(page);
  await page.locator('#vocabulary-reveal').click();
  await page.locator('#vocabulary-play').click();
  await playing(page, latest);
  for (const route of held) await route.abort('failed');
  await expect(page.locator('#vocabulary-card')).toHaveAttribute('data-sense-id', latest.senseId);
  await expect(page.locator('#vocabulary-audio-status')).toHaveAttribute('data-state', /playing|ended/);
  expect((await native(page)).src).toContain(`/course-assets/audio/${latest.audio!.track}.mp3`);
  const stored = (await data(page)).practice.cards;
  expect(stored.review.lessons).toEqual([15]);
  expect(stored.schedule).toEqual({});
});

test('quota failure keeps revealed ratings available across modules, exports the memory copy and supports an explicit save retry', async ({ page }) => {
  await authenticate(page, envelope(seededData()));
  await page.goto('/#/vocabulary?lesson=7');
  await ready(page, 'vocabulary', 7);
  await start(page, [7]);
  await saved(page);
  const raw = await page.evaluate(key => localStorage.getItem(key), stateKey);
  await page.evaluate(({ stateKey }) => {
    const state = window as unknown as { __failVocabularyWrite: boolean };
    state.__failVocabularyWrite = true;
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (this === localStorage && key === stateKey && state.__failVocabularyWrite) throw new DOMException('Injected write failure', 'QuotaExceededError');
      return original.call(this, key, value);
    };
  }, { stateKey });
  const word = await current(page);
  await rate(page, 'again');
  await page.locator('#vocabulary-retry-save').click();
  await expect(page.locator('#vocabulary-save-status')).toHaveAttribute('data-state', /^(unsaved|unavailable)$/);
  expect(await page.evaluate(key => localStorage.getItem(key), stateKey)).toBe(raw);
  await page.locator('#feature-nav [data-feature="progress"]').click();
  await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'ready');
  await page.locator('#open-data-manager').click();
  const backup = await downloadBackup(page);
  const expected = backup.data.practice.cards;
  expect(expected.review.revealed[word.senseId]).toBe(true);
  expect(expected.schedule[word.senseId]).toMatchObject({ lastRating: 'again', reviewCount: 1 });
  await page.locator('#feature-nav [data-feature="vocabulary"]').click();
  await ready(page, 'vocabulary', 7);
  await expect(page.locator('#vocabulary-card')).toHaveAttribute('data-sense-id', word.senseId);
  await expect(page.locator('#vocabulary-answer')).toBeVisible();
  await page.evaluate(() => { (window as unknown as { __failVocabularyWrite: boolean }).__failVocabularyWrite = false; });
  await page.locator('#vocabulary-retry-save').click();
  expect((await data(page)).practice.cards).toEqual(expected);
});

test('vocabulary loading rejects early interaction, failed metadata retries, and a retired load cannot replace a newer route', async ({ page }) => {
  await authenticate(page);
  const pending: Route[] = [];
  await page.route(/media-references[^/]*\.json(?:\?.*)?$/, route => { pending.push(route); });
  await page.goto('/#/vocabulary?lesson=7', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => pending.length).toBe(1);
  await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'loading');
  await expect(page.locator('#vocabulary-module fieldset[data-module-controls]')).toHaveAttribute('disabled', '');
  await expect(page.locator('#vocabulary-card')).toHaveCount(0);
  await pending[0]!.fulfill({ status: 503, body: 'temporary unavailable' });
  await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'error');
  await page.locator('#retry-module').click();
  await expect.poll(() => pending.length).toBe(2);
  await pending[1]!.continue();
  await ready(page, 'vocabulary', 7);
  await page.locator('#feature-nav [data-feature="home"]').click();
  await expect(page.locator('#module-host')).toHaveAttribute('data-feature', 'home');
  await page.locator('#feature-nav [data-feature="vocabulary"]').click();
  await expect.poll(() => pending.length).toBe(3);
  await page.locator('#feature-nav [data-feature="homework"]').click();
  await expect(page.locator('#module-host')).toHaveAttribute('data-feature', 'homework');
  await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'ready');
  await pending[2]!.abort('failed');
  await expect(page.locator('#vocabulary-module')).toHaveCount(0);
  await expect(page.locator('#submit-homework')).toBeEnabled();
});

test('Chinese and Vietnamese cards, settings, source metadata and review controls fit mobile and desktop viewports', async ({ page }, testInfo) => {
  await authenticate(page);
  await page.goto('/#/vocabulary?lesson=15');
  await ready(page, 'vocabulary', 15);
  await start(page, [7, 10, 15], 'all', 'vi-zh');
  await page.locator('#vocabulary-pinyin').check();
  await rate(page, 'hard');
  for (const width of [320, 390, 768, 1104]) {
    await page.setViewportSize({ width, height: 850 });
    const layout = await page.evaluate(() => ({ documentWidth: document.documentElement.scrollWidth,
      boxes: ['#vocabulary-settings', '#vocabulary-card', '#vocabulary-prompt', '#vocabulary-answer', '#vocabulary-summary', '#vocabulary-sources'].map(selector => {
        const node = document.querySelector<HTMLElement>(selector)!;
        const box = node.getBoundingClientRect();
        return { selector, left: box.left, right: box.right, fontSize: Number.parseFloat(getComputedStyle(node).fontSize) };
      }), chinese: [...document.querySelectorAll<HTMLElement>('#vocabulary-card [lang="zh-CN"]')].map(node => ({ text: node.textContent, fontSize: Number.parseFloat(getComputedStyle(node).fontSize) })) }));
    expect(layout.documentWidth, `overflow at ${width}px`).toBeLessThanOrEqual(width);
    for (const box of layout.boxes) {
      expect(box.left, `${box.selector} left at ${width}px`).toBeGreaterThanOrEqual(0);
      expect(box.right, `${box.selector} right at ${width}px`).toBeLessThanOrEqual(width + 1);
      expect(box.fontSize, `${box.selector} size at ${width}px`).toBeGreaterThanOrEqual(14);
    }
    expect(layout.chinese.length).toBeGreaterThan(0);
    for (const text of layout.chinese) expect(text.fontSize).toBeGreaterThanOrEqual(24);
    if ([390, 1104].includes(width)) await testInfo.attach(`vocabulary-${testInfo.project.name}-${width}.png`, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  }
  await page.locator('#feature-nav [data-feature="review"]').click();
  await ready(page, 'review', 15);
  await expect(page.locator('#vocabulary-answer')).toBeVisible();
  await testInfo.attach(`review-${testInfo.project.name}-1104.png`, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
});
test('home and progress keep objective scores, translations, reading marks and vocabulary self-ratings separate and resume the exact card', async ({ page }, testInfo) => {
  const seeded = seededData();
  await authenticate(page, envelope(seeded));
  await page.clock.setFixedTime(new Date(now));
  await page.goto('/#/vocabulary?lesson=7');
  await ready(page, 'vocabulary', 7);
  await start(page, [7, 10]);
  for (const rating of ['again', 'hard', 'good']) {
    await rate(page, rating);
    await page.locator('#vocabulary-next').click();
  }
  const card = await current(page);
  const before = await data(page);
  await page.locator('#feature-nav [data-feature="progress"]').click();
  await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'ready');
  await expect(page.locator('[data-progress-lesson]')).toHaveCount(15);
  await expect(page.locator('#progress-homework-submitted')).toContainText('30/225');
  await expect(page.locator('#progress-homework-objective')).toContainText('0/150');
  await expect(page.locator('#progress-homework-objective')).toContainText('20/150');
  await expect(page.locator('#progress-translation-submitted')).toContainText('10/75');
  await expect(page.locator('#progress-translation-submitted')).toContainText('Không chấm điểm');
  await expect(page.locator('#progress-listening-submitted')).toContainText('1/75');
  await expect(page.locator('#progress-listening-objective')).toContainText('0/75');
  await expect(page.locator('#progress-listening-objective')).toContainText('1/75');
  await expect(page.locator('#progress-reading')).toContainText('1/15');
  await expect(page.locator('#progress-vocabulary-counts')).toContainText('344');
  await expect(page.locator('#progress-vocabulary-counts')).toContainText('319');
  await expect(page.locator('#progress-vocabulary-ratings')).toContainText('3/344');
  await expect(page.locator('#progress-vocabulary-ratings')).toContainText('Cần luyện lại 1');
  await expect(page.locator('#progress-vocabulary-ratings')).toContainText('Khó 1');
  await expect(page.locator('#progress-vocabulary-ratings')).toContainText('Đã nhớ 1');
  await expect(page.locator('#progress-vocabulary-due')).toContainText('Đến hạn 0');
  await expect(page.locator('#progress-vocabulary-due')).toContainText('Chưa học 341');
  await expect(page.locator('#progress-resume-link')).toContainText('4/50');
  for (const width of [390, 1104]) {
    await page.setViewportSize({ width, height: 850 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await testInfo.attach(`progress-${testInfo.project.name}-${width}.png`, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  }
  await page.locator('#progress-resume-link').click();
  await ready(page, 'vocabulary', card.lesson);
  await expect(page.locator('#vocabulary-card')).toHaveAttribute('data-sense-id', card.senseId);
  expect((await data(page)).practice.cards).toEqual(before.practice.cards);
  await page.locator('#feature-nav [data-feature="home"]').click();
  await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'ready');
  await expect(page.locator('#home-vocabulary-ratings')).toContainText('3/344');
  await expect(page.locator('#continue-learning-link')).toContainText('4/50');
  const after = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).data, stateKey);
  expect(after.reading).toEqual(before.reading);
  expect(after.homework).toEqual(before.homework);
  expect(after.practice).toEqual(before.practice);
});

test('a rated mixed-lesson queue exports, imports into a new browser context and restores without recomputing current filter membership', async ({ page, browser }) => {
  await authenticate(page, envelope(seededData()));
  await page.goto('/#/vocabulary?lesson=7');
  await ready(page, 'vocabulary', 7);
  await start(page, [7, 10], 'unfamiliar', 'vi-zh', true);
  await rate(page, 'good');
  await page.locator('#vocabulary-next').click();
  await page.locator('#vocabulary-reveal').click();
  const word = await current(page);
  const before = await data(page);
  await page.locator('#feature-nav [data-feature="progress"]').click();
  await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'ready');
  await page.locator('#open-data-manager').click();
  const backup = await downloadBackup(page);
  const context = await browser.newContext();
  try {
    const fresh = await context.newPage();
    await authenticate(fresh);
    await fresh.goto(page.url());
    await expect(fresh.locator('#module-host')).toHaveAttribute('data-state', 'ready');
    await fresh.locator('#open-data-manager').click();
    await fresh.locator('#backup-file').setInputFiles({ name: 'vocabulary-round.json', mimeType: 'application/json', buffer: Buffer.from(backup.raw) });
    await expect(fresh.locator('#confirm-data-import')).toBeEnabled();
    await fresh.locator('#confirm-data-import').click();
    await expect(fresh.locator('#data-status')).toHaveAttribute('data-state', 'saved');
    await fresh.locator('#feature-nav [data-feature="vocabulary"]').click();
    await ready(fresh, 'vocabulary', 7);
    await expect(fresh.locator('#vocabulary-card')).toHaveAttribute('data-sense-id', word.senseId);
    await expect(fresh.locator('#vocabulary-answer')).toBeVisible();
    expect((await data(fresh)).practice.cards).toEqual(before.practice.cards);
    await fresh.reload();
    await ready(fresh, 'vocabulary', 7);
    expect((await data(fresh)).practice.cards).toEqual(before.practice.cards);
  } finally { await context.close(); }
});


test('an open due filter refreshes at the actual deadline without replacing or writing its saved queue', async ({ page }) => {
  const seeded = seededData();
  const practice = seeded.practice;
  const review = practiceEngine.startReview(practice, catalog as any, { lessons: [1], filter: 'all', direction: 'zh-vi', shuffle: false }, now - day);
  for (const [index, id] of review.senseIds.entries()) {
    const at = now - day + (index === 0 ? 1_000 : 60_000);
    practiceEngine.revealCard(practice, id, at);
    practiceEngine.rateCard(practice, catalog as any, 'good', at);
    if (index < review.senseIds.length - 1) practiceEngine.nextCard(practice, at);
  }
  practiceEngine.setPreferences(practice, { module: 'vocabulary', lessons: [1], vocabularyFilter: 'due', shuffle: false }, now);
  seeded.navigation = { feature: 'vocabulary', lesson: 1 };
  await authenticate(page, envelope(seeded));
  await page.clock.install({ time: new Date(now) });
  await page.clock.pauseAt(new Date(now));
  await page.goto('/#/vocabulary?lesson=1');
  await ready(page);
  await expect(page.locator('#vocabulary-start')).toBeDisabled();
  await expect(page.locator('#vocabulary-available')).toContainText('0 thẻ');
  const raw = await page.evaluate(key => localStorage.getItem(key), stateKey);
  await page.clock.runFor(1_010);
  await expect(page.locator('#vocabulary-start')).toBeEnabled();
  await expect(page.locator('#vocabulary-available')).toContainText('1 thẻ');
  expect(await page.evaluate(key => localStorage.getItem(key), stateKey)).toBe(raw);
  await expect(page.locator('#vocabulary-card')).toHaveAttribute('data-sense-id', review.senseIds.at(-1)!);
});
