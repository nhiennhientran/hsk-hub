import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect, type Page, type TestInfo } from '@playwright/test';
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
const catalog = JSON.parse(await readFile(new URL('../../content/stage3-catalog.json', import.meta.url), 'utf8')) as ListeningCatalog;
const homeworkLesson = bank.lessons.find(row => row.id === 10)!;
const textbookLesson = book.lessons.find(row => row.id === 10)!;
type ReleaseFile = { path: string; bytes: number; sha256: string };
type ReleaseManifest = { schema: number; sourceCommit: string; buildId: string; productionBase: string; files: ReleaseFile[] };

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
  if (hash) expect(location.hash).toBe(hash);
}

async function navigate(page: Page, feature: string): Promise<void> {
  await page.locator(`#feature-nav [data-feature="${feature}"]`).click();
  await ready(page, feature);
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
    { url: 'lesson9-pilot.html', feature: 'textbook', lesson: 9, hash: '#/textbook?lesson=9&section=vocab', pathname: 'lesson.html' },
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
  await page.goBack(); await ready(page, 'homework', 10, '#/homework?lesson=10&part=choice');
  await page.goBack(); await ready(page, 'textbook', 10, '#/textbook?lesson=10&section=text');
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

  await navigate(page, 'vocabulary');
  await page.locator('#vocabulary-none').click();
  await page.locator('[data-vocabulary-lesson="10"]').check();
  await page.locator('#vocabulary-filter').selectOption('all');
  await page.locator('#vocabulary-direction').selectOption('zh-vi');
  await page.locator('#vocabulary-shuffle').uncheck();
  await page.locator('#vocabulary-start').click();
  const sense = catalog.vocabulary.find(row => row.lesson === 10)!;
  await expect(page.locator('#vocabulary-card')).toHaveAttribute('data-sense-id', sense.senseId);
  if (!sense.audio) throw new Error('Release representative vocabulary must have original audio.');
  await expect(page.locator('#vocabulary-play')).toBeDisabled();
  await page.locator('#vocabulary-reveal').click();
  await expect(page.locator('#vocabulary-answer')).toBeVisible();
  await page.locator('#vocabulary-play').click();
  await playing(page, base, '#vocabulary-audio-status', sense.audio.track, sense.audio.start, sense.audio.end);
  await page.locator('#vocabulary-pause').click();
  await page.locator('#vocabulary-good').click();
  const vocabulary = (await saved(page, 'vocabulary')).practice.cards;
  expect(vocabulary.schedule[sense.senseId]).toMatchObject({ lastRating: 'good', reviewCount: 1 });
  await page.reload();
  await ready(page, 'vocabulary');
  const afterReload = await saved(page, 'vocabulary');
  expect(afterReload.reading).toEqual(reading);
  expect(afterReload.homework).toEqual(submitted);
  expect(afterReload.practice.listening).toEqual(listening);
  expect(afterReload.practice.cards).toEqual(vocabulary);

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
    await expect(restored.locator('#vocabulary-card')).toHaveAttribute('data-sense-id', sense.senseId);
    expect((await saved(restored, 'vocabulary')).practice.cards).toEqual(vocabulary);
    await restoredAudit(testInfo);
  } finally { await restoredContext.close(); }
  await audit(testInfo);
});
