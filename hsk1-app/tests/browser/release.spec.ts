import { navigateFeature, revealControl } from './ui-actions.ts';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect, type Page, type TestInfo } from '@playwright/test';
import { HOMEWORK30_PARTS, HOMEWORK30_COUNTS } from '../../src/domain/homework30/engine.ts';
import type { Homework30Lesson } from '../../src/services/content/homework30.ts';
import type { HomeworkLesson, SortQuestion } from '../../src/services/content/homework.ts';
import type { BookLesson } from '../../src/services/content/textbook.ts';
import type { ListeningCatalog } from '../../src/services/content/listening.ts';
import type { AppData } from '../../src/services/storage/compatibility.ts';

// Run only through playwright.release.config.ts. No existing browser profile,
// auth bypass, seeded answers, request mocking, or media-clock mocking is used.
// Live acceptance writes synthetic learning data only inside disposable contexts.
test.use({ storageState: { cookies: [], origins: [] }, trace: 'off', video: 'off', screenshot: 'off' });
test.describe.configure({ timeout: 180_000 });
const productionBase = '/hsk-hub/new-hsk1/hsk1/';
const stateKey = 'ran_hsk1_modular_v1';
const sessionKey = 'hsk_portal_unlocked_v2';
const dist = resolve(process.env.HSK_RELEASE_DIST ?? fileURLToPath(new URL('../../dist/', import.meta.url)));
const digest = (bytes: Buffer | string): string => createHash('sha256').update(bytes).digest('hex');
const book = JSON.parse(await readFile(new URL('../../content/textbook.json', import.meta.url), 'utf8')) as { lessons: BookLesson[] };
const bank = JSON.parse(await readFile(new URL('../../content/stage2-bank.json', import.meta.url), 'utf8')) as { lessons: HomeworkLesson[] };
const bank30 = JSON.parse(await readFile(new URL('../../content/homework30-bank.json', import.meta.url), 'utf8')) as { lessons: Homework30Lesson[] };
const catalog = JSON.parse(await readFile(new URL('../../content/stage3-catalog.json', import.meta.url), 'utf8')) as ListeningCatalog;
const homeworkLesson = bank.lessons.find(row => row.id === 10)!;
const textbookLesson = book.lessons.find(row => row.id === 10)!;
type ReleaseFile = { path: string; bytes: number; sha256: string };
type ReleaseManifest = { schema: number; sourceCommit: string; buildId: string; productionBase: string; productionRecoveryCommit: string; files: ReleaseFile[] };

function deployment(baseURL: string | undefined): URL {
  if (!baseURL) throw new Error('Use playwright.release.config.ts with a production-path baseURL.');
  const base = new URL(baseURL);
  if (!base.pathname.endsWith('/')) base.pathname += '/';
  if (base.pathname !== productionBase || base.search || base.hash || base.username || base.password || !['http:', 'https:'].includes(base.protocol)) {
    throw new Error('Release acceptance requires an HTTP(S) URL ending in /hsk-hub/new-hsk1/hsk1/.');
  }
  return base;
}

async function login(page: Page): Promise<void> {
  const password = process.env.HSK_TEST_PASSWORD;
  if (!password) throw new Error('HSK_TEST_PASSWORD is required; run via npm run test:release. Login acceptance must not be skipped.');
  await expect(page.locator('#auth-gate')).toBeVisible();
  expect(await page.evaluate(key => sessionStorage.getItem(key), sessionKey)).toBeNull();
  // The field receives the real environment password, then normal Enter submits
  // the unmodified gate. Passing the value through evaluate keeps locator action
  // error messages from echoing the secret. Trace/video/screenshots are disabled.
  await page.locator('#class-password').evaluate((element, value) => {
    const field = element as HTMLInputElement;
    field.value = value;
    field.dispatchEvent(new Event('input', { bubbles: true }));
  }, password);
  await page.locator('#class-password').press('Enter');
  await expect(page.locator('#auth-gate')).toBeHidden();
  expect(await page.evaluate(key => sessionStorage.getItem(key), sessionKey)).toBe('1');
}

async function ready(page: Page, feature: string, lesson = 10, hash?: string): Promise<void> {
  const host = page.locator('#module-host');
  await expect(host).toHaveAttribute('data-state', 'ready');
  await expect(host).toHaveAttribute('data-feature', feature);
  await expect(host).toHaveAttribute('data-lesson', String(lesson));
  await expect(page.locator('#lesson-select')).toHaveValue(String(lesson));
  const location = new URL(page.url());
  expect(location.pathname.startsWith(productionBase)).toBe(true);
  expect(location.search).toBe('');
  // An explicit legacy-version link is equivalent to an old unversioned bookmark.
  if (hash) expect(location.hash.replace(/&version=legacy(?=&|$)/, '')).toBe(hash);
}

async function navigate(page: Page, feature: string): Promise<void> {
  if (feature === 'vocabulary') {
    await page.locator('#feature-nav [data-feature="review"]').click();
    await ready(page, 'review');
  } else if (feature === 'listening') {
    await page.locator('#feature-nav [data-feature="home"]').click();
    await ready(page, 'home');
    const selector = '.lesson-card[data-lesson="10"] a[href^="#/listening?"]';
    await revealControl(page, selector);
    await page.locator(selector).click();
    await ready(page, 'listening');
  } else {
    await navigateFeature(page, feature, 10);
    await ready(page, feature);
  }
}

async function saved(page: Page, feature: 'reading' | 'homework' | 'listening' | 'vocabulary' | 'progress'): Promise<AppData> {
  await expect(page.locator(`#${feature}-save-status`)).toHaveAttribute('data-state', 'saved');
  return page.evaluate(key => JSON.parse(localStorage.getItem(key)!).data, stateKey);
}

function networkEvidence(page: Page, base: URL) {
  const failures: string[] = [];
  const loaded = new Set<string>();
  page.on('pageerror', error => failures.push(`Runtime: ${error.message}`));
  page.on('response', response => {
    const url = new URL(response.url());
    if (!['http:', 'https:'].includes(url.protocol) || url.pathname.endsWith('/favicon.ico')) return;
    if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) failures.push(`Outside deployment base: ${url.origin}${url.pathname}`);
    if (response.status() >= 400) failures.push(`HTTP ${response.status()}: ${url.pathname}`);
    loaded.add(url.pathname);
  });
  page.on('requestfailed', request => {
    // Navigation/media cancellation is expected when changing views. Real fetch
    // failures still fail the ready/native playback assertions and this audit.
    if (!/abort|cancel|interrupted/i.test(request.failure()?.errorText ?? '')) failures.push(`Request failed: ${new URL(request.url()).pathname}`);
  });
  return async (testInfo: TestInfo) => {
    await testInfo.attach('production-path-runtime-assets.json', { body: Buffer.from(JSON.stringify({ base: base.href, loaded: [...loaded].sort(), failures }, null, 2)), contentType: 'application/json' });
    expect(failures).toEqual([]);
    expect([...loaded].some(path => path.startsWith(`${productionBase}assets/`) && path.endsWith('.js'))).toBe(true);
  };
}

async function observeNativeAudio(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const state = window as unknown as { __releaseMedia: HTMLMediaElement[] };
    state.__releaseMedia = [];
    const nativePlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      if (!state.__releaseMedia.includes(this)) state.__releaseMedia.push(this);
      return nativePlay.call(this);
    };
  });
}

async function nativeAudio(page: Page) {
  return page.evaluate(() => {
    const audio = (window as unknown as { __releaseMedia: HTMLMediaElement[] }).__releaseMedia.at(-1);
    return { source: audio?.currentSrc ?? '', time: audio?.currentTime ?? 0, duration: audio?.duration ?? 0, paused: audio?.paused ?? true };
  });
}

async function playing(page: Page, base: URL, status: string, track: string, start: number, end: number): Promise<void> {
  await expect(page.locator(status)).toHaveAttribute('data-state', 'playing');
  await expect.poll(async () => (await nativeAudio(page)).source).toBe(new URL(`course-assets/audio/${track}.mp3`, base).href);
  await expect.poll(async () => (await nativeAudio(page)).time).toBeGreaterThan(start + .035);
  expect((await nativeAudio(page)).duration).toBeGreaterThan(end);
  expect((await nativeAudio(page)).paused).toBe(false);
}

function orderFor(question: SortQuestion): number[] {
  const normalized = (text: string) => text.normalize('NFKC').replace(/[\p{P}\p{Z}\s]/gu, '');
  const wanted = normalized(question.answers[0]!);
  function search(remaining: number[], prefix: string, order: number[]): number[] | undefined {
    if (!remaining.length) return prefix === wanted ? order : undefined;
    for (const index of remaining) {
      const next = prefix + normalized(question.tokens[index]!);
      if (!wanted.startsWith(next)) continue;
      const found = search(remaining.filter(value => value !== index), next, [...order, index]);
      if (found) return found;
    }
    return undefined;
  }
  const order = search(question.tokens.map((_, index) => index), '', []);
  if (!order) throw new Error(`No accepted token order for ${question.id}`);
  return order;
}

async function receipt(page: Page, answers: Record<string, string>): Promise<void> {
  await expect(page.locator('#homework-receipt')).toBeVisible();
  await expect(page.locator('[data-receipt-answer-id]')).toHaveCount(5);
  for (const [id, answer] of Object.entries(answers)) expect(await page.locator(`[data-receipt-answer-id="${id}"]`).textContent()).toBe(answer);
  await expect(page.locator('[data-receipt-score]')).toHaveCount(0);
}

test('every deployed file matches the exact release manifest, all 93 audio tracks and 267 Hanzi assets exist, and missing files are real 404s', async ({ request, baseURL }, testInfo) => {
  const base = deployment(baseURL);
  const live = Boolean(process.env.HSK_LIVE_URL);
  const expectedManifest = live ? fileURLToPath(new URL('../../docs/release-manifest.json', import.meta.url)) : resolve(dist, 'release-manifest.json');
  const manifestBytes = await readFile(expectedManifest);
  const manifest = JSON.parse(manifestBytes.toString('utf8')) as ReleaseManifest;
  expect(manifest.schema).toBe(1);
  expect(manifest.productionBase).toBe(productionBase);
  expect(manifest.sourceCommit).toMatch(/^[a-f0-9]{40}$/);
  if (process.env.HSK_EXPECTED_COMMIT) expect(manifest.sourceCommit).toBe(process.env.HSK_EXPECTED_COMMIT);
  expect(manifest.buildId).toBe(digest(JSON.stringify(manifest.files)));
  // Live identity must be explicitly pinned to the approved frozen candidate.
  // The checked-in manifest and every deployed byte are still compared below.
  if (live && !process.env.HSK_EXPECTED_COMMIT) throw new Error('HSK_EXPECTED_COMMIT is required for live release acceptance.');
  if (process.env.HSK_EXPECTED_BUILD_ID) expect(manifest.buildId).toBe(process.env.HSK_EXPECTED_BUILD_ID);
  if (process.env.HSK_EXPECTED_RECOVERY_COMMIT) expect(manifest.productionRecoveryCommit).toBe(process.env.HSK_EXPECTED_RECOVERY_COMMIT);
  expect(manifest.productionRecoveryCommit).toMatch(/^[a-f0-9]{40}$/);
  expect(manifest.files.filter(file => /^course-assets\/audio\/.+\.mp3$/.test(file.path))).toHaveLength(93);
  expect(manifest.files.filter(file => /^course-assets\/hanzi\/.+\.json$/.test(file.path))).toHaveLength(267);
  expect(new Set(manifest.files.map(file => file.path)).size).toBe(manifest.files.length);
  expect(manifest.files.map(file => file.path)).toEqual(expect.arrayContaining(['index.html', 'lesson.html', 'learning.html', 'lesson9-pilot.html', 'help.html']));
  async function walk(directory = ''): Promise<string[]> {
    const entries = await readdir(resolve(dist, directory), { withFileTypes: true });
    const nested = await Promise.all(entries.map(entry => {
      const path = directory ? `${directory}/${entry.name}` : entry.name;
      if (entry.isSymbolicLink()) throw new Error('Release contains an unexpected symlink.');
      return entry.isDirectory() ? walk(path) : Promise.resolve([path]);
    }));
    return nested.flat();
  }
  if (!live) expect((await walk()).sort()).toEqual([...manifest.files.map(file => file.path), 'release-manifest.json'].sort());
  const manifestResponse = await request.get(new URL('release-manifest.json', base).href);
  expect(manifestResponse.status()).toBe(200);
  const deployedManifest = await manifestResponse.body();
  expect(JSON.parse(deployedManifest.toString('utf8'))).toEqual(manifest);
  expect(digest(deployedManifest)).toBe(digest(manifestBytes));
  await manifestResponse.dispose();
  // Bounded parallel reads verify actual bytes, not an HTML fallback's 200 or a
  // manifest's claim. This runs against localhost and HSK_LIVE_URL unchanged.
  for (let offset = 0; offset < manifest.files.length; offset += 6) {
    await Promise.all(manifest.files.slice(offset, offset + 6).map(async file => {
      expect(file.path).not.toMatch(/(^\/|\\|(^|\/)\.\.(\/|$))/);
      if (!live) {
        const local = await readFile(resolve(dist, file.path));
        expect(local.length, file.path).toBe(file.bytes);
        expect(digest(local), file.path).toBe(file.sha256);
      }
      const url = new URL(file.path.split('/').map(encodeURIComponent).join('/'), base);
      const response = await request.get(url.href);
      expect(response.status(), file.path).toBe(200);
      const bytes = await response.body();
      expect(bytes.length, file.path).toBe(file.bytes);
      expect(digest(bytes), file.path).toBe(file.sha256);
      await response.dispose();
    }));
  }
  const missing = await request.get(new URL('assets/release-acceptance-missing-file.js', base).href);
  expect(missing.status()).toBe(404);
  await missing.dispose();
  // The exhaustive course suite remains the content acceptance; the release
  // gate verifies that its frozen corpora and exact shipped files are preserved.
  expect(bank.lessons.reduce((count, row) => count + row.choice.length + row.sort.length + row.translation.length, 0)).toBe(225);
  expect(catalog.listening).toHaveLength(75);
  expect(catalog.vocabulary).toHaveLength(344);
  expect(bank30.lessons).toHaveLength(15);
  for (const lesson of bank30.lessons) for (const part of HOMEWORK30_PARTS) expect(lesson[part]).toHaveLength(HOMEWORK30_COUNTS[part]);
  expect(bank30.lessons.reduce((total, lesson) => total + HOMEWORK30_PARTS.reduce((count, part) => count + lesson[part].length, 0), 0)).toBe(450);
  await testInfo.attach('verified-release-identity.json', { body: Buffer.from(JSON.stringify({ sourceCommit: manifest.sourceCommit, buildId: manifest.buildId, base: base.href, verifiedFiles: manifest.files.length, bytes: manifest.files.reduce((count, row) => count + row.bytes, 0) }, null, 2)), contentType: 'application/json' });
});

test('normal login, index/lesson/learning/pilot legacy entry parameters, refresh and browser history work at the real production path', async ({ page, browser, baseURL }, testInfo) => {
  const base = deployment(baseURL);
  const audit = networkEvidence(page, base);
  await page.goto(new URL('index.html?lesson=10', base).href);
  await expect(page.locator('#auth-gate')).toBeVisible();
  await page.locator('#unlock-session').click();
  await expect(page.locator('#auth-gate')).toBeVisible();
  await page.locator('#class-password').fill('invalid-release-acceptance-input');
  await page.locator('#class-password').press('Enter');
  await expect(page.locator('#auth-message')).not.toHaveText('');
  await login(page);
  await ready(page, 'home', 10, '#/home?lesson=10');
  const cases = [
    { url: '', feature: 'home', lesson: 1, hash: '#/home?lesson=1', pathname: '' },
    { url: 'index.html?mode=home&lesson=15', feature: 'home', lesson: 15, hash: '#/home?lesson=15', pathname: 'index.html' },
    { url: 'lesson.html?id=15&sec=hanzi', feature: 'textbook', lesson: 15, hash: '#/textbook?lesson=15&section=hanzi', pathname: 'lesson.html' },
    { url: 'lesson.html?lesson=10&section=text', feature: 'textbook', lesson: 10, hash: '#/textbook?lesson=10&section=text', pathname: 'lesson.html' },
    { url: 'learning.html?mode=vocab&lesson=7', feature: 'vocabulary', lesson: 7, hash: '#/vocabulary?lesson=7', pathname: 'learning.html' },
    { url: 'learning.html?mode=listening&lesson=12', feature: 'listening', lesson: 12, hash: '#/listening?lesson=12', pathname: 'learning.html' },
    { url: 'learning.html?mode=homework&lesson=2#lesson=10&part=sort', feature: 'homework', lesson: 10, hash: '#/homework?lesson=10&part=sort', pathname: 'learning.html' },
    { url: 'learning.html?mode=homework&lesson=1&stage=choice#lesson=15&part=translation', feature: 'homework', lesson: 15, hash: '#/homework?lesson=15&part=translation', pathname: 'learning.html' },
    { url: 'learning.html?mode=listening&lesson=1#/textbook?lesson=10&section=grammar', feature: 'textbook', lesson: 10, hash: '#/textbook?lesson=10&section=grammar', pathname: 'learning.html' },
    { url: 'lesson9-pilot.html', feature: 'exercises', lesson: 9, hash: '#/exercises?lesson=9&set=pilot&group=words&filter=all', pathname: 'lesson9-pilot.html' },
  ];
  for (const row of cases) {
    await page.goto(new URL(row.url, base).href);
    await ready(page, row.feature, row.lesson, row.hash);
    expect(new URL(page.url()).pathname).toBe(productionBase + row.pathname);
    await page.reload();
    await expect(page.locator('#auth-gate')).toBeHidden();
    await ready(page, row.feature, row.lesson, row.hash);
  }
  await page.goto(new URL('lesson.html?id=10&sec=text', base).href);
  await ready(page, 'textbook');
  await navigate(page, 'homework');
  await navigate(page, 'listening');
  await page.goBack(); await ready(page, 'home', 10, '#/home?lesson=10');
  await page.goBack(); await ready(page, 'homework', 10, '#/homework?lesson=10&part=choice');
  await page.goBack(); await ready(page, 'homework', 10, '#/homework?lesson=10&part=choice&version=30-v1');
  await page.goBack(); await ready(page, 'textbook', 10, '#/textbook?lesson=10&section=text');
  await page.goForward(); await ready(page, 'homework', 10, '#/homework?lesson=10&part=choice&version=30-v1');
  await page.goForward(); await ready(page, 'homework', 10, '#/homework?lesson=10&part=choice');
  const fresh = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  try {
    const locked = await fresh.newPage();
    await locked.goto(page.url());
    await expect(locked.locator('#auth-gate')).toBeVisible();
    expect(await locked.evaluate(key => sessionStorage.getItem(key), sessionKey)).toBeNull();
    expect(await locked.evaluate(key => localStorage.getItem(key), stateKey)).toBeNull();
  } finally { await fresh.close(); }
  await audit(testInfo);
});

test('production textbook, exact manual receipt, native listening and vocabulary, saved reload and downloaded backup restore work without touching another profile', async ({ page, browser, baseURL }, testInfo) => {
  const base = deployment(baseURL);
  const audit = networkEvidence(page, base);
  await observeNativeAudio(page);
  await page.goto(new URL('lesson.html?id=10&sec=vocab', base).href);
  await login(page);
  await ready(page, 'textbook');
  await expect(page.locator('.vocab-card[data-word-id]')).toHaveCount(textbookLesson.vocab.length);
  const word = textbookLesson.vocab[0]!;
  await page.locator(`[data-vocab-star="${word.id}"]`).click();
  await page.locator('#reading-complete').check();
  await saved(page, 'reading');
  for (const section of ['text', 'grammar', 'hanzi', 'practice']) {
    await page.locator(`[data-textbook-sections] [data-section="${section}"]`).click();
    await ready(page, 'textbook', 10, `#/textbook?lesson=10&section=${section}`);
    if (section === 'text') {
      await page.locator('[data-scene-audio]').click();
      await playing(page, base, '#audio-player', '10-1', 0, 1);
      await page.locator('#audio-stop').click();
    } else if (section === 'hanzi') {
      await expect(page.locator('[data-hanzi-canvas] svg')).toBeVisible();
      await expect(page.locator('[data-hanzi-stroke-count]')).not.toHaveText('');
    } else if (section === 'practice') await expect(page.locator('[data-practice-question]')).toHaveCount(7);
  }
  const reading = (await saved(page, 'reading')).reading;
  expect(reading.lessons['10']?.complete).toBe(true);
  expect(reading.modules['hsk1:10']?.modules).toHaveLength(5);

  await navigate(page, 'homework');
  for (const question of homeworkLesson.choice) await page.locator(`input[data-answer-id="${question.id}"][value="${question.answer}"]`).check();
  await page.locator('#submit-homework').click();
  expect((await saved(page, 'homework')).homework.lessons['10']!.choice!.latest!.correct).toBe(5);
  await page.locator('[data-homework-part="sort"]').click();
  await ready(page, 'homework', 10, '#/homework?lesson=10&part=sort');
  for (const question of homeworkLesson.sort) for (const index of orderFor(question)) await page.locator(`[data-sort-add="${question.id}"][data-token-index="${index}"]`).click();
  await page.locator('#submit-homework').click();
  expect((await saved(page, 'homework')).homework.lessons['10']!.sort!.latest!.correct).toBe(5);
  await page.locator('[data-homework-part="translation"]').click();
  await ready(page, 'homework', 10, '#/homework?lesson=10&part=translation');
  await page.locator('#homework-name').fill('Release acceptance · kiểm thử');
  await page.locator('#homework-class').fill('Synthetic isolated browser');
  const answers = Object.fromEntries(homeworkLesson.translation.map((question, index) => [question.id, `  第 ${index + 1} 题：杯子多少钱？\nBản kiểm thử: tiếng Việt e\u0301.\n\n  `]));
  for (const [id, answer] of Object.entries(answers)) await page.locator(`textarea[data-answer-id="${id}"]`).fill(answer);
  await page.locator('#submit-homework').click();
  const submitted = (await saved(page, 'homework')).homework;
  expect(submitted.lessons['10']!.translation!.latest).toMatchObject({ answers, assessment: 'manual', correct: null, results: null });
  await page.locator('#receipt-latest').click(); await receipt(page, answers);
  await page.locator('#close-receipt').click();
  await page.reload();
  await ready(page, 'homework', 10, '#/homework?lesson=10&part=translation');
  expect((await saved(page, 'homework')).homework).toEqual(submitted);
  await page.locator('#receipt-first').click(); await receipt(page, answers);
  await page.locator('#close-receipt').click();

  await navigate(page, 'listening');
  await revealControl(page, '#listening-none');
  await page.locator('#listening-none').click();
  await page.locator('[data-listening-lesson="10"]').check();
  await page.locator('#listening-mode').selectOption('all');
  await page.locator('#listening-shuffle').uncheck();
  await page.locator('#listening-start').click();
  const question = catalog.listening.find(row => row.lesson === 10)!;
  await expect(page.locator('#listening-question')).toHaveAttribute('data-question-id', question.id);
  await page.locator('#listening-play').click();
  await playing(page, base, '#listening-audio-status', question.audio.track, question.audio.start, question.audio.end);
  await page.locator('#listening-pause').click();
  await page.locator(`input[data-option-index="${question.answer}"]`).check();
  await page.locator('#listening-submit').click();
  await expect(page.locator('#listening-feedback')).toBeVisible();
  const listening = (await saved(page, 'listening')).practice.listening;
  expect(listening.records[question.id]!.latest.correct).toBe(true);

  const beforeMixed = await saved(page, 'listening');
  await navigate(page, 'vocabulary');
  await revealControl(page, '#vocabulary-none');
  await page.locator('#vocabulary-none').click();
  for (const lesson of [7, 10]) await page.locator(`[data-vocabulary-lesson="${lesson}"]`).check();
  await page.locator('#vocabulary-start').click();
  const mixedStart = (await saved(page, 'vocabulary')).mixedVocabulary!.round!;
  expect(mixedStart.lessons).toEqual([7, 10]);
  expect([...mixedStart.senseIds].sort()).toEqual(catalog.vocabulary.filter(row => [7, 10].includes(row.lesson)).map(row => row.senseId).sort());
  await expect(page.locator('#vocabulary-settings')).not.toHaveAttribute('open');
  await expect(page.locator('#vocabulary-grid .mixed-card-back, #vocabulary-grid [data-mixed-play]')).toHaveCount(0);
  const toggle = page.locator('#vocabulary-grid .mixed-card-toggle').first();
  const sense = catalog.vocabulary.find(row => row.senseId === mixedStart.senseIds[0])!;
  if (!sense.audio) throw new Error('Release representative vocabulary must have original audio.');
  await expect(toggle.locator('..')).toHaveAttribute('data-sense-id', sense.senseId);
  await expect(toggle.locator('.mixed-card-front')).toHaveText(sense.zh);
  const pageSize = page.viewportSize()!.width >= 1050 ? 6 : page.viewportSize()!.width >= 700 ? 4 : 1;
  await expect(page.locator('#vocabulary-grid .mixed-card-toggle')).toHaveCount(pageSize);
  await page.locator('#vocabulary-next').click();
  await expect(toggle.locator('..')).toHaveAttribute('data-sense-id', mixedStart.senseIds[pageSize]!);
  await page.locator('#vocabulary-prev').click();
  await expect(toggle.locator('..')).toHaveAttribute('data-sense-id', sense.senseId);
  await toggle.click();
  await expect(toggle.locator('.mixed-pinyin')).toHaveText(sense.py);
  await expect(toggle.locator('.mixed-meaning')).toHaveText(sense.vi);
  await expect(toggle.locator('.mixed-card-front, button')).toHaveCount(0);
  const play = page.locator(`[data-mixed-play="${sense.senseId}"]`);
  await expect(play.locator('..')).toHaveClass('mixed-card-audio');
  await play.click();
  await expect(play).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(async () => (await nativeAudio(page)).source).toBe(new URL(`course-assets/audio/${sense.audio!.track}.mp3`, base).href);
  await expect.poll(async () => (await nativeAudio(page)).time).toBeGreaterThan(sense.audio.start + .035);
  expect((await nativeAudio(page)).duration).toBeGreaterThan(sense.audio.end);
  expect((await nativeAudio(page)).paused).toBe(false);
  // Audio is an independent control and must neither flip nor mutate the round.
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await play.click();
  await expect.poll(async () => (await nativeAudio(page)).paused).toBe(true);
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  expect((await saved(page, 'vocabulary')).practice).toEqual(beforeMixed.practice);
  await page.locator('#vocabulary-next').click();
  await toggle.click();
  const vocabulary = (await saved(page, 'vocabulary')).mixedVocabulary!;
  expect(vocabulary.round).toMatchObject({ ...mixedStart, anchor: pageSize });
  const restoredSense = vocabulary.round!.senseIds[pageSize]!;
  await page.reload();
  await ready(page, 'review');
  await expect(toggle.locator('..')).toHaveAttribute('data-sense-id', restoredSense);
  await expect(page.locator('#vocabulary-grid .mixed-card-back, #vocabulary-grid [data-mixed-play]')).toHaveCount(0);
  const afterReload = await saved(page, 'vocabulary');
  expect(afterReload.reading).toEqual(reading);
  expect(afterReload.homework).toEqual(submitted);
  expect(afterReload.practice.listening).toEqual(listening);
  expect(afterReload.practice).toEqual(beforeMixed.practice);
  expect(afterReload.mixedVocabulary).toEqual(vocabulary);

  await navigate(page, 'progress');
  await page.locator('#open-data-manager').click();
  const pending = page.waitForEvent('download');
  await page.locator('#export-backup').click();
  const download = await pending;
  expect(await download.failure()).toBeNull();
  expect(download.suggestedFilename()).toMatch(/\.json$/);
  const stream = await download.createReadStream();
  if (!stream) throw new Error('Downloaded backup stream is unavailable.');
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const raw = Buffer.concat(chunks);
  const backup = JSON.parse(raw.toString('utf8')) as { app: string; schema: number; data: AppData };
  expect(backup.app).toBe('hsk1-modular-backup');
  expect(backup.schema).toBe(1);
  expect(backup.data).toEqual(await saved(page, 'progress'));
  expect(raw.toString('utf8')).not.toContain(sessionKey);

  const restoredContext = await browser.newContext({ storageState: { cookies: [], origins: [] }, acceptDownloads: true });
  try {
    const restored = await restoredContext.newPage();
    const restoredAudit = networkEvidence(restored, base);
    await restored.goto(new URL('index.html#/progress?lesson=10', base).href);
    expect(await restored.evaluate(key => localStorage.getItem(key), stateKey)).toBeNull();
    await login(restored);
    await ready(restored, 'progress');
    await restored.locator('#open-data-manager').click();
    await restored.locator('#backup-file').setInputFiles({ name: download.suggestedFilename(), mimeType: 'application/json', buffer: raw });
    await expect(restored.locator('#migration-preview')).toBeVisible();
    await restored.locator('#confirm-data-import').click();
    await expect(restored.locator('#data-status')).toHaveAttribute('data-state', 'saved');
    expect(await saved(restored, 'progress')).toEqual(backup.data);
    await restored.reload(); await ready(restored, 'progress');
    expect(await saved(restored, 'progress')).toEqual(backup.data);
    await navigate(restored, 'homework');
    await restored.locator('[data-homework-part="translation"]').click();
    await ready(restored, 'homework', 10, '#/homework?lesson=10&part=translation');
    await restored.locator('#receipt-latest').click(); await receipt(restored, answers);
    await restored.locator('#close-receipt').click();
    await navigate(restored, 'listening');
    await expect(restored.locator('#listening-question')).toHaveAttribute('data-question-id', question.id);
    await expect(restored.locator('#listening-feedback')).toBeVisible();
    await navigate(restored, 'vocabulary');
    await expect(restored.locator('#vocabulary-grid > .mixed-card').first()).toHaveAttribute('data-sense-id', restoredSense);
    await expect(restored.locator('#vocabulary-grid .mixed-card-back, #vocabulary-grid [data-mixed-play]')).toHaveCount(0);
    expect((await saved(restored, 'vocabulary')).mixedVocabulary).toEqual(vocabulary);
    expect((await saved(restored, 'vocabulary')).practice).toEqual(backup.data.practice);
    await restoredAudit(testInfo);
  } finally { await restoredContext.close(); }
  await audit(testInfo);
});

async function captureLayout(page: Page, testInfo: TestInfo, name: string): Promise<void> {
  await expect(page.locator('#auth-gate')).toBeHidden();
  await page.evaluate(() => document.fonts.ready);
  for (const [label, width, height] of [['desktop', 1440, 1000], ['mobile', 390, 844]] as const) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => window.scrollTo(0, 0));
    expect(await page.evaluate(() => document.documentElement.scrollWidth), `${name} ${label} must not overflow`).toBeLessThanOrEqual(width);
    await testInfo.attach(`live-simplified-${name}-${label}.png`, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
}

test('live simplified navigation, 30-question version, five real homework audio clips, separate 75-question listening pool and version-safe backup restore', async ({ page, browser, baseURL }, testInfo) => {
  const base = deployment(baseURL), audit = networkEvidence(page, base);
  const lesson = bank30.lessons.find(row => row.id === 10)!;
  const homeworkPlayback: Array<{ id: string; source: string; time: number; duration: number; paused: boolean }> = [];
  await observeNativeAudio(page);
  await page.goto(new URL('index.html?lesson=10', base).href);
  await login(page); await ready(page, 'home');
  await expect(page.locator('#feature-nav a')).toHaveCount(4);
  expect(await page.locator('#feature-nav a').evaluateAll(links => links.map(link => (link as HTMLElement).dataset.feature))).toEqual(['home', 'homework', 'review', 'progress']);
  await expect(page.locator('#feature-nav [lang="zh"]')).toHaveCount(4);
  await expect(page.locator('#feature-nav [lang="vi"]')).toHaveCount(4);
  await expect(page.locator('.lesson-card')).toHaveCount(15);
  await expect(page.locator('.lesson-card a:visible')).toHaveCount(15);
  await expect(page.locator('.lesson-card details[open]')).toHaveCount(0);
  await expect(page.locator('.lesson-card a[href^="#/exercises"]')).toHaveCount(0);
  await captureLayout(page, testInfo, 'home');
  const card = page.locator('.lesson-card[data-lesson="10"]');
  await card.locator('summary').focus(); await page.keyboard.press('Enter');
  await expect(card.locator('[data-lesson-section]:visible')).toHaveCount(5);
  await card.locator('a[href^="#/homework?"]').focus(); await page.keyboard.press('Enter');
  await ready(page, 'homework', 10, '#/homework?lesson=10&part=choice&version=30-v1');
  await expect(page.locator('[data-homework-part]')).toHaveCount(5);
  await expect(page.locator('[data-question-id]')).toHaveCount(10);
  await expect(page.locator('#homework-submission-details')).not.toHaveAttribute('open');
  await expect(page.locator('#homework-study-details')).not.toHaveAttribute('open');
  await captureLayout(page, testInfo, 'homework');

  // Produce nonempty legacy history through the existing form, never seed a
  // profile or rescale historical scores to the new version's denominator.
  await revealControl(page, '#homework-legacy-link');
  await page.locator('#homework-legacy-link').click();
  await ready(page, 'homework', 10, '#/homework?lesson=10&part=choice');
  for (const q of homeworkLesson.choice) await page.locator(`input[data-answer-id="${q.id}"][value="${q.answer}"]`).check();
  await page.locator('#submit-homework').click();
  const legacy = (await saved(page, 'homework')).homework;
  expect(legacy.lessons['10']!.choice!.latest).toMatchObject({ correct: 5, total: 5 });
  await page.locator('#feature-nav [data-feature="homework"]').click();
  await ready(page, 'homework', 10, '#/homework?lesson=10&part=choice&version=30-v1');
  const beforeNewWork = await saved(page, 'homework');
  const answers = Object.fromEntries(lesson.translation.map((q, index) => [q.id, `  新版第 ${index + 1} 题。\nBản thử độc lập, giữ nguyên e\u0301.\n\n  `]));
  await page.locator('#submit-homework').click();
  await expect(page.locator('.is-missing')).toHaveCount(10);
  for (const part of HOMEWORK30_PARTS) {
    if (part !== 'choice') await page.locator(`[data-homework-part="${part}"]`).click();
    await ready(page, 'homework', 10, `#/homework?lesson=10&part=${part}&version=30-v1`);
    await expect(page.locator('[data-question-id]')).toHaveCount(HOMEWORK30_COUNTS[part]);
    if (part === 'choice') {
      // The first and latest scores must remain different after an honest redo.
      for (const q of lesson.choice) await page.locator(`input[data-answer-id="${q.id}"][value="${(q.answer + 1) % 4}"]`).check();
      await page.locator('#submit-homework').click(); await saved(page, 'homework');
      await expect(page.locator('#homework-result')).toContainText('0 / 10');
      await page.locator('#restart-homework').click();
    }
    if (part === 'listening') {
      await expect(page.locator('[data-homework-audio]')).toHaveCount(5);
      await expect(page.locator('.homework-question details')).toHaveCount(0);
      const beforePlay = (await saved(page, 'homework')).homework30;
      for (const q of lesson.listening) {
        await page.locator(`[data-homework-audio="${q.id}"]`).click();
        await expect.poll(async () => (await nativeAudio(page)).source).toBe(new URL(`course-assets/audio/${q.audio.track}.mp3`, base).href);
        await expect.poll(async () => (await nativeAudio(page)).time).toBeGreaterThan(q.audio.start + .035);
        expect((await nativeAudio(page)).duration).toBeGreaterThan(q.audio.end);
        expect((await nativeAudio(page)).paused).toBe(false);
        homeworkPlayback.push({ id: q.id, ...await nativeAudio(page) });
        await page.locator(`[data-homework-audio="${q.id}"]`).locator('..').locator('button').nth(1).click();
        await expect.poll(async () => (await nativeAudio(page)).paused).toBe(true);
      }
      expect((await saved(page, 'homework')).homework30).toEqual(beforePlay);
      expect((await saved(page, 'homework')).practice).toEqual(beforeNewWork.practice);
    }
    for (const q of lesson[part]) {
      if (q.kind === 'sort') for (const index of orderFor(q)) await page.locator(`[data-sort-add="${q.id}"][data-token-index="${index}"]`).click();
      else if (q.kind === 'translation') await page.locator(`textarea[data-answer-id="${q.id}"]`).fill(answers[q.id]!);
      else await page.locator(`input[data-answer-id="${q.id}"][value="${q.answer}"]`).check();
    }
    await page.locator('#submit-homework').click();
    const state = await saved(page, 'homework');
    expect(state.homework).toEqual(legacy);
    expect(state.practice).toEqual(beforeNewWork.practice);
    expect(state.exercises).toEqual(beforeNewWork.exercises);
    const attempt = state.homework30!.lessons['10']![part]!.latest!;
    expect(attempt.total).toBe(HOMEWORK30_COUNTS[part]);
    expect(attempt.assessment).toBe(part === 'translation' ? 'manual' : 'automatic');
    expect(attempt.correct).toBe(part === 'translation' ? null : HOMEWORK30_COUNTS[part]);
    if (part === 'translation') expect(attempt).toMatchObject({ answers, results: null });
    else await expect(page.locator('#homework-result')).toContainText(`${HOMEWORK30_COUNTS[part]} / ${HOMEWORK30_COUNTS[part]}`);
    if (part === 'listening') await expect(page.locator('.homework-question details')).toHaveCount(5);
  }
  const complete = (await saved(page, 'homework')).homework30!;
  expect(HOMEWORK30_PARTS.filter(part => part !== 'translation').reduce((total, part) => total + complete.lessons['10']![part]!.latest!.correct!, 0)).toBe(25);
  expect(complete.lessons['10']!.choice!.first!.correct).toBe(0);
  expect(complete.lessons['10']!.choice!.latest!.correct).toBe(10);
  await page.locator('#receipt-latest').click(); await receipt(page, answers);
  await expect(page.locator('#homework-receipt')).toContainText('hsk1-homework-30-v1');
  await page.locator('#close-receipt').focus(); await page.keyboard.press('Enter');
  await expect(page.locator('#receipt-latest')).toBeFocused();
  await page.locator('#restart-homework').click();
  const draftId = lesson.translation[0]!.id, draft = '  尚未提交的新草稿\nGiữ nguyên bản nháp.  ';
  await page.locator(`textarea[data-answer-id="${draftId}"]`).fill(draft);
  await saved(page, 'homework');
  await page.reload(); await ready(page, 'homework');
  await expect(page.locator(`textarea[data-answer-id="${draftId}"]`)).toHaveValue(draft);
  await page.locator('#receipt-latest').click(); await receipt(page, answers);
  await page.locator('#close-receipt').click();
  const completedWithDraft = (await saved(page, 'homework')).homework30;

  await page.locator('#feature-nav [data-feature="review"]').focus(); await page.keyboard.press('Enter');
  await ready(page, 'review');
  await expect(page.locator('#vocabulary-module')).toBeVisible();
  await expect(page.locator('#vocabulary-settings')).toHaveAttribute('open');
  await expect(page.locator('#review-module, #review-listening')).toHaveCount(0);
  await navigate(page, 'listening');
  await expect(page.locator('#feature-nav [data-nav-group="courses"]')).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('.lesson-picker')).toBeHidden();
  await revealControl(page, '#listening-all');
  await page.locator('#listening-all').click();
  await page.locator('#listening-count').selectOption('all');
  await page.locator('#listening-mode').selectOption('all');
  await page.locator('#listening-shuffle').uncheck();
  await page.locator('#listening-start').click();
  const pool = (await saved(page, 'listening')).practice.listening;
  // Verify the entire actual saved queue, while the frozen smoke suite remains
  // the exhaustive 75-question answer/feedback acceptance (no redundant replay).
  expect(pool.session!.questionIds).toEqual(catalog.listening.map(q => q.id));
  expect(new Set(pool.session!.questionIds as string[]).size).toBe(75);
  expect(Object.keys(pool.records)).toHaveLength(0);
  const q = catalog.listening[0]!;
  await expect(page.locator('#listening-question')).toHaveAttribute('data-question-id', q.id);
  await expect(page.locator('[data-listening-transcript], [data-listening-pinyin], #listening-feedback')).toHaveCount(0);
  await page.locator('#listening-play').click();
  await playing(page, base, '#listening-audio-status', q.audio.track, q.audio.start, q.audio.end);
  await page.locator('#listening-pause').click();
  await page.locator(`input[data-option-index="${q.answer}"]`).check();
  await page.locator('#listening-submit').click();
  await expect(page.locator('#listening-feedback')).toBeVisible();
  const afterListening = await saved(page, 'listening');
  expect(Object.keys(afterListening.practice.listening.records)).toHaveLength(1);
  expect(afterListening.homework30).toEqual(completedWithDraft);
  expect(afterListening.homework).toEqual(legacy);

  await navigate(page, 'progress');
  await expect(page.locator('#progress-current-homework-submitted')).toContainText('30/450');
  await expect(page.locator('#progress-current-translation-submitted')).toContainText('5/75');
  await expect(page.locator('#progress-listening-submitted')).toContainText('1/75');
  await expect(page.locator('[data-progress-lesson]')).toHaveCount(15);
  await expect(page.locator('[data-progress-lesson][open]')).toHaveCount(0);
  await captureLayout(page, testInfo, 'progress');
  await revealControl(page, '#progress-homework-submitted');
  await expect(page.locator('#progress-homework-submitted')).toContainText('5/225');
  await page.locator('[data-progress-lesson="10"] > summary').focus(); await page.keyboard.press('Enter');
  await expect(page.locator('[data-progress-lesson="10"]')).toContainText('30/30');
  await expect(page.locator('[data-progress-lesson="10"]')).toContainText('25/25');
  await page.locator('#open-data-manager').click();
  await expect(page.locator('#reset-lesson')).toHaveValue('');
  await expect(page.locator('#reset-module')).toHaveValue('');
  await expect(page.locator('#preview-reset')).toBeDisabled();
  await page.locator('#close-data-manager').focus(); await page.keyboard.press('Enter');
  await expect(page.locator('#open-data-manager')).toBeFocused();
  await page.locator('#open-data-manager').click();
  const pending = page.waitForEvent('download'); await page.locator('#export-backup').click();
  const download = await pending;
  expect(await download.failure()).toBeNull();
  const stream = await download.createReadStream();
  if (!stream) throw new Error('Downloaded simplified-release backup stream is unavailable.');
  const chunks: Buffer[] = []; for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const raw = Buffer.concat(chunks), backup = JSON.parse(raw.toString('utf8')) as { data: AppData };
  expect(backup.data).toEqual(await saved(page, 'progress'));
  expect(raw.toString('utf8')).not.toContain(sessionKey);
  expect(backup.data.homework).toEqual(legacy);
  expect(backup.data.homework30).toEqual(completedWithDraft);

  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  try {
    const restored = await context.newPage(), restoredAudit = networkEvidence(restored, base);
    await restored.goto(new URL('index.html#/progress?lesson=10', base).href);
    expect(await restored.evaluate(key => localStorage.getItem(key), stateKey)).toBeNull();
    await login(restored); await ready(restored, 'progress');
    await restored.locator('#open-data-manager').click();
    await restored.locator('#backup-file').setInputFiles({ name: download.suggestedFilename(), mimeType: 'application/json', buffer: raw });
    await expect(restored.locator('#migration-preview')).toBeVisible();
    await restored.locator('#confirm-data-import').click();
    await expect(restored.locator('#data-status')).toHaveAttribute('data-state', 'saved');
    expect(await saved(restored, 'progress')).toEqual(backup.data);
    await restored.reload(); await ready(restored, 'progress');
    expect(await saved(restored, 'progress')).toEqual(backup.data);
    await restored.goto(new URL('index.html#/homework?lesson=10&part=translation&version=30-v1', base).href);
    await ready(restored, 'homework');
    await expect(restored.locator(`textarea[data-answer-id="${draftId}"]`)).toHaveValue(draft);
    await restored.locator('#receipt-latest').click(); await receipt(restored, answers);
    await restored.locator('#close-receipt').click();
    await restored.locator('[data-homework-part="choice"]').click(); await ready(restored, 'homework');
    await restored.locator('#receipt-first').click();
    await expect(restored.locator('[data-receipt-score]')).toContainText('0/10');
    await restored.locator('#receipt-version').selectOption('latest');
    await expect(restored.locator('[data-receipt-score]')).toContainText('10/10');
    await restored.locator('#close-receipt').click();
    await restored.goto(new URL('learning.html#/exercises?lesson=10&set=homework-review&group=choice&filter=wrong', base).href);
    await ready(restored, 'exercises');
    await expect(restored.locator('#exercises-module.exercise-archive')).toBeVisible();
    await expect(restored.locator('#exercises-module input, #exercises-module textarea, #exercises-module select, #exercises-module button')).toHaveCount(0);
    await expect(restored.locator('.archive-question')).toHaveCount(5);
    await expect(restored.locator('[data-archive-source="homework"] > [data-result="correct"]')).toHaveCount(10);
    expect((await restored.evaluate(key => JSON.parse(localStorage.getItem(key)!).data, stateKey)).homework).toEqual(legacy);
    await restoredAudit(testInfo);
  } finally { await context.close(); }
  await testInfo.attach('simplified-live-coverage.json', { body: Buffer.from(JSON.stringify({ lesson: 10, homeworkQuestions: 30, automatic: 25, manual: 5, originalHomeworkAudioClipsPlayed: homeworkPlayback, standaloneListeningQueue: catalog.listening.map(q => q.id), navigationGroups: 4, legacyHistoryDenominator: 225, newHistoryDenominator: 450, profiles: 'disposable synthetic only', screenshots: ['home', 'homework', 'progress'].flatMap(view => [`${view}-desktop`, `${view}-mobile`]) }, null, 2)), contentType: 'application/json' });
  await audit(testInfo);
});

test('production mixed cards preserve one shuffled round across responsive pages, keyboard flips, route aliases, lesson edits and all 344 senses', async ({ page, baseURL }, testInfo) => {
  const base = deployment(baseURL), audit = networkEvidence(page, base);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(new URL('index.html?lesson=10', base).href);
  await login(page); await ready(page, 'home');
  await page.locator('#feature-nav [data-feature="review"]').focus();
  await page.keyboard.press('Enter');
  await ready(page, 'review');
  await expect(page.locator('#feature-nav [data-nav-group="practice"]')).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('#vocabulary-module')).toBeVisible();
  await expect(page.locator('#vocabulary-settings')).toHaveAttribute('open');
  await expect(page.locator('#vocabulary-filter, #vocabulary-direction, #vocabulary-search, #vocabulary-shuffle, #vocabulary-good, #vocabulary-hard, #vocabulary-again')).toHaveCount(0);
  const before = await saved(page, 'vocabulary');
  await page.locator('#vocabulary-none').click();
  for (const lesson of [7, 10]) await page.locator(`[data-vocabulary-lesson="${lesson}"]`).check();
  await page.locator('#vocabulary-start').click();
  const initial = (await saved(page, 'vocabulary')).mixedVocabulary!;
  const initialRound = initial.round!;
  expect(initial.schema).toBe(1);
  expect(initialRound.lessons).toEqual([7, 10]);
  expect(initialRound.anchor).toBe(0);
  expect([...initialRound.senseIds].sort()).toEqual(catalog.vocabulary.filter(word => [7, 10].includes(word.lesson)).map(word => word.senseId).sort());
  expect(new Set(initialRound.senseIds).size).toBe(initialRound.senseIds.length);
  await expect(page.locator('#vocabulary-settings')).not.toHaveAttribute('open');
  const first = page.locator('#vocabulary-grid .mixed-card-toggle').first();
  const second = page.locator('#vocabulary-grid .mixed-card-toggle').nth(1);
  await expect(first).toBeFocused();
  const firstWord = catalog.vocabulary.find(word => word.senseId === initialRound.senseIds[0])!;
  await expect(first).toHaveText(firstWord.zh);
  await first.press('Space');
  await expect(first).toBeFocused();
  await expect(first).toHaveAttribute('aria-pressed', 'true');
  await expect(first.locator('.mixed-card-front')).toHaveCount(0);
  await expect(first.locator('.mixed-pinyin')).toHaveText(firstWord.py);
  await expect(first.locator('.mixed-meaning')).toHaveText(firstWord.vi);
  await expect(second).toHaveAttribute('aria-pressed', 'false');
  await second.click();
  await expect(page.locator('#vocabulary-grid .mixed-card-back')).toHaveCount(2);
  await first.press('Enter');
  await expect(first).toHaveText(firstWord.zh);
  await expect(second).toHaveAttribute('aria-pressed', 'true');
  expect((await saved(page, 'vocabulary')).mixedVocabulary).toEqual(initial);
  expect((await saved(page, 'vocabulary')).practice).toEqual(before.practice);
  await first.press('ArrowRight');
  await expect(first).toBeFocused();
  await expect(page.locator('#vocabulary-grid .mixed-card-back')).toHaveCount(0);
  const anchored = (await saved(page, 'vocabulary')).mixedVocabulary!;
  expect(anchored.round).toEqual({ ...initialRound, anchor: 6 });
  const responsiveEvidence: Array<{ width: number; cards: number; anchor: number }> = [];
  // Each width crosses a capacity boundary. Width changes preserve the first
  // visible anchor and the immutable order, while all visible faces reset.
  for (const width of [699, 700, 1050, 1049, 320, 1440]) {
    await first.click();
    await expect(first).toHaveAttribute('aria-pressed', 'true');
    await page.setViewportSize({ width, height: 1000 });
    const size = width >= 1050 ? 6 : width >= 700 ? 4 : 1;
    await expect(page.locator('#vocabulary-grid .mixed-card-toggle')).toHaveCount(size);
    await expect(page.locator('#vocabulary-grid')).toHaveAttribute('data-columns', String(size === 6 ? 3 : size === 4 ? 2 : 1));
    await expect(page.locator('#vocabulary-grid .mixed-card-back, #vocabulary-grid [data-mixed-play]')).toHaveCount(0);
    expect(await page.locator('#vocabulary-grid > .mixed-card').evaluateAll(cards => cards.map(card => (card as HTMLElement).dataset.senseId))).toEqual(initialRound.senseIds.slice(6, 6 + size));
    expect(await page.locator('#vocabulary-grid .mixed-card-front').allTextContents()).toEqual(initialRound.senseIds.slice(6, 6 + size).map(id => catalog.vocabulary.find(word => word.senseId === id)!.zh));
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    expect((await saved(page, 'vocabulary')).mixedVocabulary).toEqual(anchored);
    responsiveEvidence.push({ width, cards: size, anchor: 6 });
    if (width === 320 || width === 1440) await testInfo.attach(`mixed-production-${width}.png`, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  }
  await first.click();
  await page.reload(); await ready(page, 'review');
  await expect(page.locator('#vocabulary-grid .mixed-card-back')).toHaveCount(0);
  expect((await saved(page, 'vocabulary')).mixedVocabulary).toEqual(anchored);
  await first.click();
  await page.goto(new URL('index.html#/vocabulary?lesson=10', base).href);
  await ready(page, 'vocabulary');
  await expect(page.locator('#vocabulary-grid .mixed-card-back')).toHaveCount(0);
  expect((await saved(page, 'vocabulary')).mixedVocabulary).toEqual(anchored);
  await first.click();
  await navigate(page, 'progress'); await navigate(page, 'vocabulary');
  await expect(page.locator('#vocabulary-grid .mixed-card-back')).toHaveCount(0);
  expect((await saved(page, 'vocabulary')).mixedVocabulary).toEqual(anchored);

  await revealControl(page, '#vocabulary-none');
  await page.locator('#vocabulary-none').click();
  await expect(page.locator('#vocabulary-start')).toBeDisabled();
  await expect(page.locator('#vocabulary-pending')).toBeVisible();
  expect((await saved(page, 'vocabulary')).mixedVocabulary).toEqual(anchored);
  await page.locator('#vocabulary-cancel').click();
  await expect(page.locator('#vocabulary-settings')).not.toHaveAttribute('open');
  expect((await saved(page, 'vocabulary')).mixedVocabulary).toEqual(anchored);
  await revealControl(page, '#vocabulary-all');
  await page.locator('#vocabulary-all').click();
  expect((await saved(page, 'vocabulary')).mixedVocabulary).toEqual(anchored);
  await page.locator('#vocabulary-start').click();
  const all = (await saved(page, 'vocabulary')).mixedVocabulary!.round!;
  expect(all.lessons).toEqual(Array.from({ length: 15 }, (_, index) => index + 1));
  expect(all.senseIds).toHaveLength(344);
  expect([...all.senseIds].sort()).toEqual(catalog.vocabulary.map(word => word.senseId).sort());
  expect(all.id).not.toBe(initialRound.id);
  const visited: string[] = [];
  for (let anchor = 0; anchor < all.senseIds.length; anchor += 6) {
    const expected = all.senseIds.slice(anchor, anchor + 6);
    await expect(page.locator('#vocabulary-grid .mixed-card-toggle')).toHaveCount(expected.length);
    const ids = await page.locator('#vocabulary-grid > .mixed-card').evaluateAll(cards => cards.map(card => (card as HTMLElement).dataset.senseId!));
    expect(ids).toEqual(expected); visited.push(...ids);
    await expect(page.locator('#vocabulary-grid .mixed-card-back')).toHaveCount(0);
    expect((await saved(page, 'vocabulary')).mixedVocabulary!.round).toEqual({ ...all, anchor });
    if (anchor + 6 < all.senseIds.length) await page.locator('#vocabulary-next').click();
  }
  expect(visited).toEqual(all.senseIds);
  expect(new Set(visited).size).toBe(344);
  await expect(page.locator('#vocabulary-grid .mixed-card-toggle')).toHaveCount(2);
  await expect(page.locator('#vocabulary-next')).toBeDisabled();
  await expect(page.locator('#vocabulary-last')).toBeVisible();
  await first.click();
  await page.locator('#vocabulary-reshuffle').click();
  const reshuffled = (await saved(page, 'vocabulary')).mixedVocabulary!.round!;
  expect(reshuffled.id).not.toBe(all.id);
  expect(reshuffled.anchor).toBe(0);
  expect(reshuffled.lessons).toEqual(all.lessons);
  expect([...reshuffled.senseIds].sort()).toEqual([...all.senseIds].sort());
  expect(reshuffled.senseIds).not.toEqual(all.senseIds);
  await expect(first).toBeFocused();
  await expect(page.locator('#vocabulary-grid .mixed-card-back')).toHaveCount(0);
  const after = await saved(page, 'vocabulary');
  for (const domain of ['practice', 'homework', 'homework30', 'reading', 'exercises', 'legacyRaw'] as const) expect(after[domain]).toEqual(before[domain]);
  await testInfo.attach('mixed-production-round-evidence.json', { body: Buffer.from(JSON.stringify({ responsive: responsiveEvidence, selectedLessons: initialRound.lessons,
    selectedSenseIds: initialRound.senseIds, allSenseIds: visited, finalPageCards: 2, independentDomainsUnchanged: true }, null, 2)), contentType: 'application/json' });
  await audit(testInfo);
});
