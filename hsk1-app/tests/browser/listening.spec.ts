import { readFile } from 'node:fs/promises';
import { test, expect, type Page, type Route } from '@playwright/test';

const stateKey = 'ran_hsk1_modular_v1';
const sessionKey = 'hsk_portal_unlocked_v2';
type Question = { id: string; lesson: number; fingerprint: string; options: string[]; answer: number; explanationVi: string; optionFeedback: string[];
  transcript: Array<{ zh: string; py: string; vi: string }>; audio: { track: string; start: number; end: number } };
const catalog = JSON.parse(await readFile(new URL('../../content/stage3-catalog.json', import.meta.url), 'utf8')) as { listening: Question[] };
const questions = new Map(catalog.listening.map(question => [question.id, question]));
const fixtures = await Promise.all(['stage2.json', 'stage3.json'].map(file => readFile(new URL(`../fixtures/migration/${file}`, import.meta.url), 'utf8')));

function seededData(): any {
  const practice = JSON.parse(fixtures[1]!);
  practice.listening = { records: {}, session: null };
  return { reading: { lessons: { '1': { visited: true, complete: true } }, mastered: { '1-你好': true }, modules: { 'hsk1:1': { modules: ['vocab', 'text'], updatedAt: 1789891200000 } } },
    homework: JSON.parse(fixtures[0]!), practice, navigation: null, legacyRaw: {} };
}
function envelope(data: any): string {
  return JSON.stringify({ app: 'hsk1-modular', schema: 1, revision: 1, updatedAt: 1789891200000, data, recovery: null });
}
async function authenticate(page: Page, raw?: string): Promise<void> {
  await page.addInitScript(({ stateKey, sessionKey, raw }) => {
    sessionStorage.setItem(sessionKey, '1');
    if (raw && !localStorage.getItem(stateKey)) localStorage.setItem(stateKey, raw);
  }, { stateKey, sessionKey, raw });
}
async function ready(page: Page, lesson: number): Promise<void> {
  await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'ready');
  await expect(page.locator('#module-host')).toHaveAttribute('data-feature', 'listening');
  await expect(page.locator('#module-host')).toHaveAttribute('data-lesson', String(lesson));
  await expect(page.locator('#listening-module fieldset[data-module-controls]')).not.toHaveAttribute('disabled', '');
}
async function selectedLessons(page: Page, lessons: number[], shuffle = false, mode = 'all'): Promise<void> {
  await page.locator('#listening-none').click();
  for (const lesson of lessons) await page.locator(`[data-listening-lesson="${lesson}"]`).check();
  await page.locator('#listening-shuffle').setChecked(shuffle);
  await page.locator('#listening-mode').selectOption(mode);
}
async function start(page: Page, lessons: number[], shuffle = false, mode = 'all'): Promise<void> {
  await selectedLessons(page, lessons, shuffle, mode);
  await page.locator('#listening-start').click();
  await expect(page.locator('#listening-question')).toBeVisible();
}
async function saved(page: Page): Promise<void> { await expect(page.locator('#listening-save-status')).toHaveAttribute('data-state', 'saved'); }
async function data(page: Page): Promise<any> {
  await saved(page);
  return page.evaluate(key => JSON.parse(localStorage.getItem(key)!).data, stateKey);
}
async function current(page: Page): Promise<Question> {
  const id = await page.locator('#listening-question').getAttribute('data-question-id');
  const question = questions.get(id!);
  if (!question) throw new Error(`Unknown visible listening question ${id}`);
  return question;
}
async function hiddenTranscript(page: Page, question: Question): Promise<void> {
  await expect(page.locator('[data-listening-transcript], [data-listening-pinyin], #listening-feedback')).toHaveCount(0);
  const visible = await page.locator('#listening-question').innerText();
  for (const line of question.transcript) {
    expect(visible).not.toContain(line.zh);
    expect(visible).not.toContain(line.py);
  }
  await expect(page.locator('#listening-question [data-answer], #listening-question [data-correct]')).toHaveCount(0);
}
async function answer(page: Page, question: Question, correct = true): Promise<void> {
  await page.locator(`input[data-option-index="${correct ? question.answer : (question.answer + 1) % 4}"]`).check();
  await page.locator('#listening-submit').click();
  await expect(page.locator('#listening-feedback')).toBeVisible();
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

type NativeObservation = { src: string; time: number; duration: number; rate: number; paused: boolean; ended: boolean; count: number };
async function observeNative(page: Page): Promise<void> {
  await authenticate(page);
  await page.addInitScript(() => {
    const state = window as unknown as { __listeningMedia: HTMLMediaElement[]; __listeningEvents: Record<string, unknown>[]; __listeningEventCounts: Record<string, number> };
    state.__listeningMedia = []; state.__listeningEvents = []; state.__listeningEventCounts = {};
    const watched = new WeakSet<HTMLMediaElement>();
    let sequence = 0;
    const record = (event: string, audio: HTMLMediaElement, detail?: string) => {
      state.__listeningEventCounts[event] = (state.__listeningEventCounts[event] ?? 0) + 1;
      state.__listeningEvents.push({ sequence: ++sequence, atMs: Math.round(performance.now()), event, detail,
        src: audio.currentSrc, sourceAttribute: audio.getAttribute('src'), time: audio.currentTime, duration: audio.duration,
        rate: audio.playbackRate, paused: audio.paused, ended: audio.ended, readyState: audio.readyState,
        seeking: audio.seeking, errorCode: audio.error?.code, uiState: document.querySelector<HTMLElement>('#listening-audio-status')?.dataset.state,
        question: document.querySelector('#listening-question')?.getAttribute('data-question-id') });
      if (state.__listeningEvents.length > 240) state.__listeningEvents.shift();
    };
    const observe = (audio: HTMLMediaElement) => {
      if (watched.has(audio)) return;
      watched.add(audio);
      state.__listeningMedia.push(audio);
      for (const event of ['loadstart', 'loadedmetadata', 'loadeddata', 'canplay', 'play', 'playing', 'waiting', 'stalled', 'pause', 'seeking', 'seeked', 'timeupdate', 'ended', 'emptied', 'error', 'ratechange']) audio.addEventListener(event, () => record(event, audio));
    };
    const originalLoad = HTMLMediaElement.prototype.load;
    HTMLMediaElement.prototype.load = function () { observe(this); record('load-call', this); return originalLoad.call(this); };
    const originalPause = HTMLMediaElement.prototype.pause;
    HTMLMediaElement.prototype.pause = function () { observe(this); record('pause-call', this); return originalPause.call(this); };
    const originalPlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      observe(this); record('play-call', this);
      const real = originalPlay.call(this);
      void real.then(() => record('play-resolved', this), error => record('play-rejected', this, `${error?.name}: ${error?.message}`));
      return real;
    };
  });
}
async function native(page: Page): Promise<NativeObservation> {
  return page.evaluate(() => {
    const elements = (window as unknown as { __listeningMedia: HTMLMediaElement[] }).__listeningMedia;
    const audio = elements[0];
    return { src: audio?.currentSrc ?? '', time: audio?.currentTime ?? 0, duration: audio?.duration ?? 0, rate: audio?.playbackRate ?? 0,
      paused: audio?.paused ?? true, ended: audio?.ended ?? false, count: elements.length };
  });
}
async function playing(page: Page, question: Question): Promise<void> {
  await expect(page.locator('#listening-audio-status')).toHaveAttribute('data-state', 'playing');
  await expect.poll(async () => (await native(page)).src).toContain(`/course-assets/audio/${question.audio.track}.mp3`);
  await expect.poll(async () => (await native(page)).time).toBeGreaterThan(question.audio.start + .035);
  expect((await native(page)).paused).toBe(false);
  expect((await native(page)).duration).toBeGreaterThan(question.audio.end);
  expect((await native(page)).count).toBe(1);
}
test.afterEach(async ({ page }, testInfo) => {
  if (page.isClosed()) return;
  const observed = await page.evaluate(() => {
    const state = window as unknown as { __listeningEvents?: Record<string, unknown>[]; __listeningEventCounts?: Record<string, number> };
    return state.__listeningEvents ? { url: location.href, userAgent: navigator.userAgent, counts: state.__listeningEventCounts, history: state.__listeningEvents } : null;
  }).catch(() => null);
  if (!observed) return;
  const failed = testInfo.status !== testInfo.expectedStatus;
  if (!failed) observed.history = observed.history.slice(-80);
  await testInfo.attach(failed ? 'listening-native-failure-history' : 'listening-native-success-sample', { body: Buffer.from(JSON.stringify(observed, null, 2)), contentType: 'application/json' });
});

test.describe('complete independent listening course', () => {
  test.describe.configure({ timeout: 90_000 });
  test('all 75 real questions map four shuffled options, hide transcripts before submission and show exact feedback afterward', async ({ page }) => {
    await authenticate(page);
    await page.goto('/#/listening?lesson=1');
    await ready(page, 1);
    await page.locator('#listening-all').click();
    await page.locator('#listening-shuffle').uncheck();
    await page.locator('#listening-start').click();
    const seen: string[] = [];
    for (const [index, question] of catalog.listening.entries()) {
      await expect(page.locator('#listening-question')).toHaveAttribute('data-question-id', question.id);
      await expect(page.locator('#listening-position')).toContainText(String(index + 1));
      await hiddenTranscript(page, question);
      await expect(page.locator('#listening-question input[data-option-index]')).toHaveCount(4);
      for (const [optionIndex, option] of question.options.entries()) {
        const input = page.locator(`input[data-option-index="${optionIndex}"]`);
        await expect(input).toHaveValue(String(optionIndex));
        await expect(input.locator('..')).toContainText(option);
      }
      await expect(page.locator('#listening-next')).toBeDisabled();
      await answer(page, question, true);
      await expect(page.locator('#listening-feedback')).toContainText(question.explanationVi);
      const feedbackOptions = await page.locator('[data-feedback-option-index]').evaluateAll(rows => rows.map(row => ({ index: Number((row as HTMLElement).dataset.feedbackOptionIndex), text: row.textContent ?? '' })));
      expect(feedbackOptions).toHaveLength(4);
      for (const row of feedbackOptions) {
        expect(row.text).toContain(question.options[row.index]!);
        expect(row.text).toContain(question.optionFeedback[row.index]!);
      }
      for (const line of question.transcript) {
        await expect(page.locator('#listening-feedback')).toContainText(line.zh);
        await expect(page.locator('#listening-feedback')).toContainText(line.py);
        await expect(page.locator('#listening-feedback')).toContainText(line.vi);
      }
      await expect(page.locator('#listening-submit')).toBeDisabled();
      seen.push(question.id);
      if (index < catalog.listening.length - 1) await page.locator('#listening-next').click();
    }
    expect(new Set(seen).size).toBe(75);
    const stored = (await data(page)).practice.listening;
    expect(stored.session.questionIds).toEqual(seen);
    expect(stored.session.finishedAt).not.toBeNull();
    expect(Object.keys(stored.records)).toHaveLength(75);
    for (const question of catalog.listening) expect(stored.records[question.id]).toMatchObject({ first: { answer: question.answer, correct: true }, latest: { answer: question.answer, correct: true }, attempts: 1 });
    await expect(page.locator('#listening-summary')).toContainText('75');
    await expect(page.locator('#listening-summary')).toHaveAttribute('data-complete', 'true');
    await expect(page.locator('#listening-first-score')).toContainText('75 / 75');
    await expect(page.locator('#listening-latest-score')).toContainText('75 / 75');
    await expect(page.locator('#listening-summary')).toContainText(/hoàn tất|hoàn thành/i);
  });
});

test('mixed lessons preserve first and latest scores while wrong-only redoing hides feedback again and removes corrected mistakes', async ({ page }) => {
  await authenticate(page);
  await page.goto('/#/listening?lesson=1');
  await ready(page, 1);
  await start(page, [1, 7, 10, 15]);
  const wrongIds: string[] = [];
  for (let index = 0; index < 20; index++) {
    const question = await current(page);
    const correct = index % 5 !== 0;
    if (!correct) wrongIds.push(question.id);
    await answer(page, question, correct);
    if (index < 19) await page.locator('#listening-next').click();
  }
  const first = (await data(page)).practice.listening.records;
  expect(Object.keys(first)).toHaveLength(20);
  expect(Object.values(first).filter((record: any) => record.latest.correct)).toHaveLength(16);
  await page.locator('#listening-redo').click();
  const redo = (await data(page)).practice.listening.session;
  expect(redo.questionIds).toEqual(wrongIds);
  expect(redo.mode).toBe('wrong');
  for (const [index, id] of wrongIds.entries()) {
    const question = questions.get(id)!;
    await expect(page.locator('#listening-question')).toHaveAttribute('data-question-id', id);
    await hiddenTranscript(page, question);
    await answer(page, question, true);
    if (index < wrongIds.length - 1) await page.locator('#listening-next').click();
  }
  const corrected = (await data(page)).practice.listening;
  for (const id of wrongIds) expect(corrected.records[id]).toMatchObject({ first: first[id].first, latest: { correct: true }, attempts: 2 });
  expect(Object.values(corrected.records).filter((record: any) => record.first.correct)).toHaveLength(16);
  expect(Object.values(corrected.records).filter((record: any) => record.latest.correct)).toHaveLength(20);
  const retained = corrected.session;
  await expect(page.locator('#listening-redo')).toBeDisabled();
  await page.locator('#listening-redo').evaluate(button => (button as HTMLButtonElement).click());
  expect((await data(page)).practice.listening.session).toEqual(retained);
  await expect(page.locator('#listening-module')).toContainText(/không có|chưa có/i);
});

test('single, mixed and all lessons create exact queues; empty selection and an empty wrong filter preserve the saved round', async ({ page }) => {
  await authenticate(page);
  await page.goto('/#/listening?lesson=7');
  await ready(page, 7);
  await start(page, [7]);
  expect((await data(page)).practice.listening.session.questionIds).toEqual(catalog.listening.filter(q => q.lesson === 7).map(q => q.id));
  await start(page, [1, 7, 10, 15], true);
  const shuffled = (await data(page)).practice.listening.session;
  expect([...shuffled.questionIds].sort()).toEqual(catalog.listening.filter(q => [1, 7, 10, 15].includes(q.lesson)).map(q => q.id).sort());
  for (const order of Object.values(shuffled.optionOrders) as number[][]) expect([...order].sort()).toEqual([0, 1, 2, 3]);
  // Random output is checked as a persisted permutation; no probabilistic "must differ" assertion.
  await page.locator('#listening-none').click();
  await expect(page.locator('#listening-start')).toBeDisabled();
  await page.locator('#listening-start').evaluate(button => (button as HTMLButtonElement).click());
  expect((await data(page)).practice.listening.session).toEqual(shuffled);
  await selectedLessons(page, [1, 7, 10, 15], true, 'wrong');
  await expect(page.locator('#listening-start')).toBeDisabled();
  await page.locator('#listening-start').evaluate(button => (button as HTMLButtonElement).click());
  expect((await data(page)).practice.listening.session).toEqual(shuffled);
  await page.locator('#listening-all').click();
  await page.locator('#listening-mode').selectOption('all');
  await page.locator('#listening-start').click();
  expect((await data(page)).practice.listening.session.questionIds).toHaveLength(75);
});

test('reload retains queue, option orders, selected answer, listen count, rate and position without modifying homework, reading or cards', async ({ page }) => {
  const seeded = seededData();
  await authenticate(page, envelope(seeded));
  await observeNative(page);
  await page.goto('/#/listening?lesson=10');
  await ready(page, 10);
  await start(page, [1, 7, 10, 15], false);
  await answer(page, await current(page));
  await page.locator('#listening-next').click();
  const question = await current(page);
  const selected = (question.answer + 1) % 4;
  await page.locator(`input[data-option-index="${selected}"]`).check();
  await page.locator('#listening-rate').selectOption('0.75');
  await page.locator('#listening-play').click();
  await playing(page, question);
  await page.locator('#listening-pause').click();
  const before = await data(page);
  const order = await page.locator('input[data-option-index]').evaluateAll(inputs => inputs.map(input => input.getAttribute('data-option-index')));
  await page.reload();
  await ready(page, 10);
  await expect(page.locator('#listening-question')).toHaveAttribute('data-question-id', question.id);
  await expect(page.locator(`input[data-option-index="${selected}"]`)).toBeChecked();
  await expect(page.locator('#listening-rate')).toHaveValue('0.75');
  await hiddenTranscript(page, question);
  expect(await page.locator('input[data-option-index]').evaluateAll(inputs => inputs.map(input => input.getAttribute('data-option-index')))).toEqual(order);
  const after = await data(page);
  expect(after.practice.listening).toEqual(before.practice.listening);
  expect(after.practice.listening.session.responses[question.id].listenCount).toBe(1);
  expect(after.homework).toEqual(seeded.homework);
  expect(after.reading).toEqual(seeded.reading);
  expect(after.practice.cards).toEqual(seeded.practice.cards);
  expect(after.practice.preferences.direction).toBe(seeded.practice.preferences.direction);
  expect(after.practice.preferences.vocabularyFilter).toBe(seeded.practice.preferences.vocabularyFilter);
});

test('loading controls reject early activation, HTTP 503 retries the same route and retired media-map requests cannot mount or save late', async ({ page }) => {
  const pending: Route[] = [];
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await authenticate(page);
  // Media mapping has one feature request; the same catalog is also needed by the shared store.
  await page.route('**/*media-references*.json*', route => { pending.push(route); });
  await page.goto('/#/listening?lesson=10', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => pending.length).toBeGreaterThan(0);
  await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'loading');
  await expect(page.locator('#listening-module fieldset[data-module-controls]')).toHaveAttribute('disabled', '');
  await expect(page.locator('#listening-start')).toBeDisabled();
  await page.locator('#listening-start').evaluate(button => (button as HTMLButtonElement).click());
  await expect(page.locator('#listening-question')).toHaveCount(0);
  await pending[0]!.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"temporary"}' });
  await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'error');
  const before = await page.evaluate(() => ({ href: location.href, length: history.length }));
  await page.locator('#retry-module').click();
  await expect.poll(() => pending.length).toBeGreaterThan(1);
  await pending[1]!.continue();
  await ready(page, 10);
  expect(await page.evaluate(() => ({ href: location.href, length: history.length }))).toEqual(before);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect.poll(() => pending.length).toBeGreaterThan(2);
  await page.locator('#feature-nav [data-feature="homework"]').click();
  await expect(page.locator('#module-host')).toHaveAttribute('data-feature', 'homework');
  await pending[2]!.abort('failed');
  await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'ready');
  await expect(page.locator('#listening-module')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('native original MP3 segments in lessons 1, 10 and 15 advance, stop within their frozen boundaries and stop when changing questions', async ({ page }) => {
  await observeNative(page);
  await page.goto('/#/listening?lesson=1');
  for (const lesson of [1, 10, 15]) {
    if (lesson !== 1) await page.locator('#lesson-select').selectOption(String(lesson));
    await ready(page, lesson);
    await start(page, [lesson]);
    await page.locator('#listening-rate').selectOption('1.5');
    const question = await current(page);
    await page.locator('#listening-play').click();
    await playing(page, question);
    await expect(page.locator('#listening-audio-status')).toHaveAttribute('data-state', 'ended');
    const ended = await native(page);
    expect(ended.paused).toBe(true);
    expect(ended.time).toBeGreaterThanOrEqual(question.audio.end - .08);
    expect(ended.time).toBeLessThanOrEqual(question.audio.end + .15);
    expect((await data(page)).practice.listening.session.responses[question.id].listenCount).toBe(1);
    await page.locator('#listening-replay').click();
    await playing(page, question);
    await answer(page, question);
    await page.locator('#listening-next').click();
    expect((await native(page)).paused).toBe(true);
    expect((await current(page)).id).not.toBe(question.id);
  }
});

test('pausing a held real MP3 before first playing then resuming counts once; five speeds, ordinary resume and replay keep exact counts', async ({ page }) => {
  await observeNative(page);
  let held: Route | undefined;
  await page.route('**/course-assets/audio/10-1.mp3', route => {
    if (!held) held = route;
    else void route.continue();
  });
  await page.goto('/#/listening?lesson=10');
  await ready(page, 10);
  await start(page, [10]);
  for (let index = 0; index < 4; index++) { await answer(page, await current(page)); await page.locator('#listening-next').click(); }
  const question = await current(page);
  expect(question.id).toBe('l10-listen-05');
  await page.locator('#listening-rate').selectOption('0.65');
  await page.locator('#listening-play').click();
  await expect.poll(() => Boolean(held)).toBe(true);
  await expect(page.locator('#listening-audio-status')).toHaveAttribute('data-state', 'loading');
  expect((await data(page)).practice.listening.session.responses[question.id].listenCount).toBe(0);
  await page.locator('#listening-pause').click();
  await expect(page.locator('#listening-audio-status')).toHaveAttribute('data-state', 'paused');
  await held!.continue();
  expect((await native(page)).paused).toBe(true);
  expect((await data(page)).practice.listening.session.responses[question.id].listenCount).toBe(0);
  await page.locator('#listening-pause').click();
  await playing(page, question);
  expect((await data(page)).practice.listening.session.responses[question.id].listenCount).toBe(1);
  for (const rate of [.65, .75, 1, 1.25, 1.5]) {
    await page.locator('#listening-rate').selectOption(String(rate));
    expect((await native(page)).rate).toBe(rate);
  }
  await page.locator('#listening-pause').click();
  await expect(page.locator('#listening-audio-status')).toHaveAttribute('data-state', 'paused');
  const paused = await native(page);
  await page.waitForTimeout(150);
  expect((await native(page)).time).toBeCloseTo(paused.time, 2);
  await page.locator('#listening-pause').click();
  await playing(page, question);
  await expect.poll(async () => (await native(page)).time).toBeGreaterThan(paused.time + .035);
  expect((await data(page)).practice.listening.session.responses[question.id].listenCount).toBe(1);
  await page.locator('#listening-replay').click();
  await playing(page, question);
  expect((await native(page)).time).toBeLessThan(question.audio.start + 1);
  expect((await data(page)).practice.listening.session.responses[question.id].listenCount).toBe(2);
  await page.locator('#feature-nav [data-feature="textbook"]').click();
  await expect(page.locator('#module-host')).toHaveAttribute('data-feature', 'textbook');
  await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'ready');
  expect((await native(page)).paused).toBe(true);
  await page.locator('[data-section="text"]').click();
  await expect(page.locator('#scene-select')).toBeEnabled();
  await page.locator('[data-scene-audio]').click();
  await expect(page.locator('#audio-player')).toHaveAttribute('data-state', 'playing');
  await expect.poll(async () => (await native(page)).src).toContain('/course-assets/audio/10-1.mp3');
  expect((await native(page)).count).toBe(1);
});

test('an MP3 HTTP failure can retry; a superseded delayed response cannot count, start or stop the current native track', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await observeNative(page);
  let requests = 0;
  await page.route('**/course-assets/audio/10-2.mp3', async route => {
    if (requests++ === 0) await route.fulfill({ status: 404, body: 'Unavailable original track', contentType: 'text/plain' });
    else await route.continue();
  });
  await page.goto('/#/listening?lesson=10');
  await ready(page, 10);
  await start(page, [10]);
  const first = await current(page);
  await page.locator('#listening-play').click();
  await expect(page.locator('#listening-audio-status')).toHaveAttribute('data-state', 'error');
  expect((await native(page)).paused).toBe(true);
  expect((await data(page)).practice.listening.session.responses[first.id].listenCount).toBe(0);
  await page.locator('#listening-replay').click();
  await playing(page, first);
  let delayed: Route | undefined;
  await page.route('**/course-assets/audio/15-6.mp3', route => { delayed = route; });
  await page.locator('#lesson-select').selectOption('15');
  await ready(page, 15);
  await start(page, [15]);
  await page.locator('#listening-play').click();
  await expect.poll(() => Boolean(delayed)).toBe(true);
  await expect(page.locator('#listening-audio-status')).toHaveAttribute('data-state', 'loading');
  expect((await data(page)).practice.listening.session.responses['l15-listen-01'].listenCount).toBe(0);
  await page.locator('#lesson-select').selectOption('10');
  await ready(page, 10);
  await start(page, [10]);
  await page.locator('#listening-play').click();
  await playing(page, first);
  await delayed!.abort('failed');
  await playing(page, first);
  expect((await data(page)).practice.listening.session.responses[first.id].listenCount).toBe(1);
  expect(errors).toEqual([]);
});

test('quota failure preserves submitted listening in memory, exports it after navigation and recovers with a normal retry', async ({ page }) => {
  await authenticate(page, envelope(seededData()));
  await page.goto('/#/listening?lesson=7');
  await ready(page, 7);
  await start(page, [7]);
  await saved(page);
  const raw = await page.evaluate(key => localStorage.getItem(key), stateKey);
  await page.evaluate(({ stateKey }) => {
    const state = window as unknown as { __failListeningWrite: boolean };
    state.__failListeningWrite = true;
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (this === localStorage && key === stateKey && state.__failListeningWrite) throw new DOMException('Injected write failure', 'QuotaExceededError');
      return original.call(this, key, value);
    };
  }, { stateKey });
  const question = await current(page);
  await answer(page, question);
  await page.locator('#retry-listening-save').click();
  await expect(page.locator('#listening-save-status')).toHaveAttribute('data-state', /^(unsaved|unavailable)$/);
  expect(await page.evaluate(key => localStorage.getItem(key), stateKey)).toBe(raw);
  await page.locator('#feature-nav [data-feature="progress"]').click();
  await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'ready');
  await page.locator('#open-data-manager').click();
  await expect(page.locator('#data-status')).toHaveAttribute('data-state', /^(unsaved|unavailable)$/);
  const backup = await downloadBackup(page);
  const expected = backup.data.practice.listening;
  expect(expected.session.responses[question.id]).toMatchObject({ selected: question.answer, submission: { correct: true }, listenCount: 0 });
  expect(expected.records[question.id]).toMatchObject({ first: { correct: true }, latest: { correct: true }, attempts: 1 });
  await page.locator('#feature-nav [data-feature="listening"]').click();
  await ready(page, 7);
  await expect(page.locator('#listening-question')).toHaveAttribute('data-question-id', question.id);
  await expect(page.locator('#listening-feedback')).toBeVisible();
  await page.evaluate(() => { (window as unknown as { __failListeningWrite: boolean }).__failListeningWrite = false; });
  await page.locator('#retry-listening-save').click();
  expect((await data(page)).practice.listening).toEqual(expected);
});

test('listening settings, native controls and submitted feedback fit four viewport widths with readable Chinese and Vietnamese', async ({ page }, testInfo) => {
  await authenticate(page);
  await page.goto('/#/listening?lesson=15');
  await ready(page, 15);
  await start(page, [15]);
  const question = await current(page);
  await answer(page, question, false);
  for (const width of [320, 390, 768, 1104]) {
    await page.setViewportSize({ width, height: 800 });
    await expect(page.locator('#listening-settings')).toBeVisible();
    await expect(page.locator('#listening-question')).toBeVisible();
    await expect(page.locator('#listening-feedback')).toBeVisible();
    const layout = await page.evaluate(() => ({ width: innerWidth, documentWidth: document.documentElement.scrollWidth,
      boxes: ['#listening-settings', '#listening-question', '#listening-feedback', '#listening-summary', '#listening-rate'].map(selector => {
        const node = document.querySelector<HTMLElement>(selector)!;
        const box = node.getBoundingClientRect();
        return { selector, left: box.left, right: box.right, fontSize: Number.parseFloat(getComputedStyle(node).fontSize) };
      }) }));
    expect(layout.documentWidth, `overflow at ${width}px`).toBeLessThanOrEqual(width);
    for (const box of layout.boxes) {
      expect(box.left, `${box.selector} left at ${width}px`).toBeGreaterThanOrEqual(0);
      expect(box.right, `${box.selector} right at ${width}px`).toBeLessThanOrEqual(width + 1);
      expect(box.fontSize, `${box.selector} text at ${width}px`).toBeGreaterThanOrEqual(14);
    }
    await testInfo.attach(`listening-${testInfo.project.name}-${width}.png`, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  }
});
