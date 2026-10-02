import { readFile } from 'node:fs/promises';
import { test, expect, type Locator, type Page, type TestInfo } from '@playwright/test';
import homework from '../../src/domain/homework/engine.js';
import practice from '../../src/domain/practice/engine.js';
import type { AppData } from '../../src/services/storage/compatibility.ts';
import type { HomeworkLesson, SortQuestion } from '../../src/services/content/homework.ts';
import type { ListeningCatalog, ListeningQuestion } from '../../src/services/content/listening.ts';
import type { ListeningSession } from '../../src/domain/listening/types.ts';
import type { VocabularyReview, VocabularySchedule } from '../../src/domain/vocabulary/types.ts';

const stateKey = 'ran_hsk1_modular_v1';
const sessionKey = 'hsk_portal_unlocked_v2';
const fixedTime = 1789891200000;
const bank = JSON.parse(await readFile(new URL('../../content/stage2-bank.json', import.meta.url), 'utf8')) as { lessons: HomeworkLesson[] };
const catalog = JSON.parse(await readFile(new URL('../../content/stage3-catalog.json', import.meta.url), 'utf8')) as ListeningCatalog;
const lesson = bank.lessons.find(row => row.id === 10)!;
const listeningQuestions = catalog.listening.filter(question => question.lesson === 10);
const fixtureRoot = new URL('../fixtures/migration/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('manifest.json', fixtureRoot), 'utf8')) as { storageFiles: Record<string, string> };
const legacyRaw: Record<string, string> = {
  ...JSON.parse(await readFile(new URL('reading-shared.json', fixtureRoot), 'utf8')),
  ...JSON.parse(await readFile(new URL('navigation.json', fixtureRoot), 'utf8')),
};
for (const [key, file] of Object.entries(manifest.storageFiles)) legacyRaw[key] = await readFile(new URL(file, fixtureRoot), 'utf8');

// Preserve leading/trailing spaces, Vietnamese combining marks, Hanzi, blank lines and a long unbroken run.
const longAnswer = `  草稿 B · Tiếng Việt: tôi muốn mua hai chiếc áo.\n\n${'这儿的苹果真便宜！ Giá táo ở đây thật rẻ.\n'.repeat(48)}${'中文长句'.repeat(40)}\n末尾 không được mất chữ e\u0301。  `;
const answersFor = (tag: string): Record<string, string> => Object.fromEntries(lesson.translation.map((question, index) =>
  [question.id, `${tag} · 第 ${index + 1} 题\nTiếng Việt có dấu: Nguyễn, áo, táo.\n学生自己的回答。`]));

function orderFor(question: SortQuestion): number[] {
  const normalize = (text: string) => text.normalize('NFKC').replace(/[\p{P}\p{Z}\s]/gu, '');
  const wanted = normalize(question.answers[0]!);
  const search = (remaining: number[], prefix: string, order: number[]): number[] | undefined => {
    if (!remaining.length) return prefix === wanted ? order : undefined;
    for (const index of remaining) {
      const next = prefix + normalize(question.tokens[index]!);
      if (!wanted.startsWith(next)) continue;
      const result = search(remaining.filter(value => value !== index), next, [...order, index]);
      if (result) return result;
    }
    return undefined;
  };
  const order = search(question.tokens.map((_, index) => index), '', []);
  if (!order) throw new Error(`No accepted token order for ${question.id}`);
  return order;
}

/** Only the two prerequisites are seeded in the focused layout/input tests. The full journey submits both in the UI. */
function unlockedData(): AppData {
  const state = homework.blank();
  for (const kind of ['choice', 'sort'] as const) {
    homework.group(state, 10, kind).draft = Object.fromEntries(lesson[kind].map(question =>
      [question.id, question.kind === 'choice' ? question.answer : orderFor(question)]));
    if (!homework.submit(state, 10, kind, lesson[kind], fixedTime).ok) throw new Error(`Could not unlock ${kind}`);
  }
  return { reading: { lessons: {}, mastered: {}, modules: {} }, homework: state, practice: practice.blank(), navigation: null, legacyRaw: {} };
}

async function authenticate(page: Page, data?: AppData, rawByKey?: Record<string, string>): Promise<void> {
  const raw = data ? JSON.stringify({ app: 'hsk1-modular', schema: 1, revision: 1, updatedAt: fixedTime, data, recovery: null }) : undefined;
  await page.addInitScript(({ sessionKey, stateKey, raw, rawByKey }) => {
    sessionStorage.setItem(sessionKey, '1');
    // Never overwrite a later saved value on reload; doing so could conceal a lost-write regression.
    if (raw && localStorage.getItem(stateKey) === null) localStorage.setItem(stateKey, raw);
    for (const [key, raw] of Object.entries(rawByKey ?? {})) if (localStorage.getItem(key) === null) localStorage.setItem(key, raw);
  }, { sessionKey, stateKey, raw, rawByKey });
}

async function ready(page: Page, feature: string, part?: string): Promise<void> {
  await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'ready');
  await expect(page.locator('#module-host')).toHaveAttribute('data-feature', feature);
  await expect(page.locator('#module-host')).toHaveAttribute('data-lesson', '10');
  if (part) await expect(page.locator(`[data-homework-part="${part}"]`)).toHaveAttribute('aria-current', 'page');
}

async function savedData(page: Page, feature: 'homework' | 'listening' | 'vocabulary' | 'progress'): Promise<AppData> {
  await expect(page.locator(`#${feature}-save-status`)).toHaveAttribute('data-state', 'saved');
  return page.evaluate(key => JSON.parse(localStorage.getItem(key)!).data, stateKey);
}

async function navigate(page: Page, feature: string): Promise<void> {
  await page.locator(`#feature-nav [data-feature="${feature}"]`).click();
  await ready(page, feature);
}

async function translations(page: Page, answers: Record<string, string>): Promise<void> {
  for (const [id, answer] of Object.entries(answers)) await page.locator(`textarea[data-answer-id="${id}"]`).fill(answer);
}

async function exactDraft(page: Page, answers: Record<string, string>): Promise<void> {
  for (const [id, answer] of Object.entries(answers)) await expect(page.locator(`textarea[data-answer-id="${id}"]`)).toHaveValue(answer);
}

async function receipt(page: Page, answers: Record<string, string>): Promise<void> {
  await expect(page.locator('#homework-receipt')).toBeVisible();
  await expect(page.locator('[data-receipt-answer-id]')).toHaveCount(5);
  for (const [id, answer] of Object.entries(answers)) {
    // textContent is deliberately exact: normalized text assertions alone hide whitespace loss.
    expect(await page.locator(`[data-receipt-answer-id="${id}"]`).textContent()).toBe(answer);
  }
  await expect(page.locator('[data-receipt-score]')).toHaveCount(0);
}

async function startListening(page: Page): Promise<void> {
  await page.locator('#listening-none').click();
  await page.locator('[data-listening-lesson="10"]').check();
  await page.locator('#listening-mode').selectOption('all');
  await page.locator('#listening-shuffle').uncheck();
  await page.locator('#listening-start').click();
  await expect(page.locator('#listening-question')).toHaveAttribute('data-question-id', listeningQuestions[0]!.id);
}

async function startVocabulary(page: Page): Promise<void> {
  await page.locator('#vocabulary-none').click();
  for (const id of [7, 10]) await page.locator(`[data-vocabulary-lesson="${id}"]`).check();
  await page.locator('#vocabulary-filter').selectOption('all');
  await page.locator('#vocabulary-direction').selectOption('vi-zh');
  await page.locator('#vocabulary-shuffle').uncheck();
  await page.locator('#vocabulary-start').click();
  await expect(page.locator('#vocabulary-card')).toBeVisible();
  await expect(page.locator('#vocabulary-queue-scope')).toContainText('7, 10');
}

async function submitListening(page: Page, question: ListeningQuestion, correct: boolean): Promise<void> {
  await page.locator(`input[data-option-index="${correct ? question.answer : (question.answer + 1) % 4}"]`).check();
  await page.locator('#listening-submit').click();
  await expect(page.locator('#listening-feedback')).toBeVisible();
}

async function downloadBackup(page: Page): Promise<{ raw: string; data: AppData }> {
  const pending = page.waitForEvent('download');
  await page.locator('#export-backup').click();
  const download = await pending;
  expect(await download.failure()).toBeNull();
  expect(download.suggestedFilename()).toMatch(/\.json$/);
  const stream = await download.createReadStream();
  expect(stream).not.toBeNull();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString('utf8');
  const backup = JSON.parse(raw) as { app: string; schema: number; data: AppData };
  expect(backup.app).toBe('hsk1-modular-backup');
  expect(backup.schema).toBe(1);
  return { raw, data: backup.data };
}

async function observeNativeAudio(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const state = window as unknown as { __integrationMedia: HTMLMediaElement[] };
    state.__integrationMedia = [];
    const load = HTMLMediaElement.prototype.load;
    HTMLMediaElement.prototype.load = function () {
      if (!state.__integrationMedia.includes(this)) state.__integrationMedia.push(this);
      return load.call(this);
    };
  });
}

async function nativeAudio(page: Page): Promise<{ source: string; time: number; duration: number; paused: boolean }> {
  return page.evaluate(() => {
    const media = (window as unknown as { __integrationMedia: HTMLMediaElement[] }).__integrationMedia[0];
    return { source: media?.currentSrc ?? '', time: media?.currentTime ?? 0, duration: media?.duration ?? 0, paused: media?.paused ?? true };
  });
}

test.describe('step 8 cross-module acceptance', () => {
  // Applies before page-fixture setup and accommodates real media plus independent-context restoration.
  test.describe.configure({ timeout: 120_000 });

  test('L10 translation → real listening → mixed L7+10 vocabulary → exact draft and manual submission → downloaded backup restores every independent domain', async ({ page, browser }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await authenticate(page, undefined, legacyRaw);
    await observeNativeAudio(page);
    await page.goto('/#/progress?lesson=10');
    await ready(page, 'progress');
    await page.locator('#open-data-manager').click();
    await page.locator('#preview-migration').click();
    await expect(page.locator('#migration-preview')).toBeVisible();
    await page.locator('#confirm-data-import').click();
    await expect(page.locator('#data-status')).toHaveAttribute('data-state', 'saved');
    const migrated = await savedData(page, 'progress');
    expect(migrated.legacyRaw).toEqual(legacyRaw);

    await navigate(page, 'homework');
    await ready(page, 'homework', 'choice');
    for (const question of lesson.choice) await page.locator(`input[data-answer-id="${question.id}"][value="${(question.answer + 1) % 4}"]`).check();
    await page.locator('#submit-homework').click();
    expect((await savedData(page, 'homework')).homework.lessons['10']!.choice!.latest!.correct).toBe(0);
    await expect(page.locator('[data-homework-part="sort"]')).toHaveAttribute('data-locked', 'false');
    await page.locator('[data-homework-part="sort"]').click();
    await ready(page, 'homework', 'sort');
    for (const question of lesson.sort) for (const index of orderFor(question))
      await page.locator(`[data-sort-add="${question.id}"][data-token-index="${index}"]`).click();
    await page.locator('#submit-homework').click();
    expect((await savedData(page, 'homework')).homework.lessons['10']!.sort!.latest!.correct).toBe(5);
    await page.locator('[data-homework-part="translation"]').click();
    await ready(page, 'homework', 'translation');
    await page.locator('#homework-name').fill('Nguyễn An 中文');
    await page.locator('#homework-class').fill('Lớp HSK 1 · tối thứ tư');
    const firstAnswers = answersFor('提交 A');
    await translations(page, firstAnswers);
    await page.locator('#submit-homework').click();
    const firstTranslation = (await savedData(page, 'homework')).homework.lessons['10']!.translation!.first;
    await page.locator('#restart-homework').click();
    const secondAnswers = { ...answersFor('提交 B'), [lesson.translation[0]!.id]: longAnswer };
    expect(longAnswer.length).toBeGreaterThan(1500);
    expect(longAnswer.length).toBeLessThan(homework.MAX_TRANSLATION_LENGTH);
    await translations(page, secondAnswers);
    const draftBeforeLeaving = await savedData(page, 'homework');
    expect(draftBeforeLeaving.homework.lessons['10']!.translation).toMatchObject({ draft: secondAnswers, attempt: null, first: firstTranslation, latest: firstTranslation });

    await navigate(page, 'listening');
    await startListening(page);
    const question = listeningQuestions[0]!;
    await expect(page.locator('#listening-feedback, [data-listening-transcript], [data-listening-pinyin]')).toHaveCount(0);
    await submitListening(page, question, false);
    const firstListening = (await savedData(page, 'listening')).practice.listening.records[question.id]!.first;
    await startListening(page);
    await page.locator('#listening-rate').selectOption('0.75');
    await page.locator('#listening-play').click();
    await expect(page.locator('#listening-audio-status')).toHaveAttribute('data-state', 'playing');
    await expect.poll(async () => (await nativeAudio(page)).source).toContain(`/course-assets/audio/${question.audio.track}.mp3`);
    await expect.poll(async () => (await nativeAudio(page)).time).toBeGreaterThan(question.audio.start + .035);
    expect((await nativeAudio(page)).duration).toBeGreaterThan(question.audio.end);
    expect((await nativeAudio(page)).paused).toBe(false);
    await page.locator('#listening-pause').click();
    await submitListening(page, question, true);
    await page.locator('#listening-next').click();
    const pendingQuestion = listeningQuestions[1]!;
    const pendingOption = (pendingQuestion.answer + 1) % 4;
    await page.locator(`input[data-option-index="${pendingOption}"]`).check();
    const afterListening = await savedData(page, 'listening');
    expect(afterListening.homework).toEqual(draftBeforeLeaving.homework);
    expect(afterListening.reading).toEqual(migrated.reading);
    expect(afterListening.practice.cards).toEqual(migrated.practice.cards);
    expect(afterListening.practice.listening.records[question.id]).toMatchObject({ first: firstListening, latest: { correct: true }, attempts: 2 });
    expect(firstListening.correct).toBe(false);
    expect((afterListening.practice.listening.session as unknown as ListeningSession).responses[question.id]!.listenCount).toBe(1);

    await navigate(page, 'vocabulary');
    expect((await nativeAudio(page)).paused).toBe(true);
    await startVocabulary(page);
    const reviewStart = (await savedData(page, 'vocabulary')).practice.cards.review as unknown as VocabularyReview;
    expect(reviewStart.lessons).toEqual([7, 10]);
    expect(reviewStart.senseIds).toEqual(catalog.vocabulary.filter(word => [7, 10].includes(word.lesson)).map(word => word.senseId));
    for (const rating of ['again', 'hard', 'good']) {
      const id = await page.locator('#vocabulary-card').getAttribute('data-sense-id');
      await page.locator('#vocabulary-reveal').click();
      await page.locator(`#vocabulary-${rating}`).click();
      const rated = await savedData(page, 'vocabulary');
      const schedule = rated.practice.cards.schedule[id!] as unknown as VocabularySchedule;
      expect(schedule.lastRating).toBe(rating);
      expect(schedule.reviewCount).toBeGreaterThan(0);
      expect(schedule.dueAt).toBeGreaterThan(schedule.ratedAt);
      await page.locator('#vocabulary-next').click();
    }
    await page.locator('#vocabulary-reveal').click();
    const restoredSense = await page.locator('#vocabulary-card').getAttribute('data-sense-id');
    const afterVocabulary = await savedData(page, 'vocabulary');
    expect(afterVocabulary.homework).toEqual(draftBeforeLeaving.homework);
    expect(afterVocabulary.reading).toEqual(migrated.reading);
    expect(afterVocabulary.practice.listening).toEqual(afterListening.practice.listening);

    await navigate(page, 'homework');
    await page.locator('[data-homework-part="translation"]').click();
    await ready(page, 'homework', 'translation');
    await exactDraft(page, secondAnswers);
    await page.locator('#submit-homework').click();
    const secondSubmission = (await savedData(page, 'homework')).homework.lessons['10']!.translation!;
    expect(secondSubmission.first).toEqual(firstTranslation);
    expect(secondSubmission.latest).toMatchObject({ answers: secondAnswers, assessment: 'manual', correct: null, results: null });
    expect(secondSubmission.history).toHaveLength(2);
    await page.reload();
    await ready(page, 'homework', 'translation');
    expect((await savedData(page, 'homework')).homework.lessons['10']!.translation).toEqual(secondSubmission);
    await page.locator('#receipt-first').click();
    await receipt(page, firstAnswers);
    await page.locator('#receipt-version').selectOption('latest');
    await receipt(page, secondAnswers);
    await page.locator('#close-receipt').click();
    await page.locator('#restart-homework').click();
    const unfinished = '未提交 C：还在修改。\nBản nháp mới, không thay bản đã nộp.  ';
    await page.locator(`textarea[data-answer-id="${lesson.translation[0]!.id}"]`).fill(unfinished);
    await savedData(page, 'homework');
    await page.reload();
    await ready(page, 'homework', 'translation');
    const beforeExport = await savedData(page, 'homework');
    expect(beforeExport.homework.lessons['10']!.translation).toMatchObject({ draft: { [lesson.translation[0]!.id]: unfinished }, attempt: null,
      first: firstTranslation, latest: secondSubmission.latest, history: secondSubmission.history });
    expect(beforeExport.practice).toEqual(afterVocabulary.practice);
    await navigate(page, 'progress');
    await expect(page.locator('[data-progress-lesson="10"]')).toContainText('Bài tập đã nộp 15/15');
    await expect(page.locator('[data-progress-lesson="10"]')).toContainText('Dịch: đã nộp 5/5 · nháp chưa nộp 1/5 · không chấm điểm');
    await expect(page.locator('[data-progress-lesson="10"]')).toContainText('Khách quan: lần đầu 5/10 · gần nhất 5/10');
    await expect(page.locator('[data-progress-lesson="10"]')).toContainText('Nghe: lần đầu 0/5 · gần nhất 1/5');
    await page.locator('#open-data-manager').click();
    const backup = await downloadBackup(page);
    expect(backup.data).toEqual(await savedData(page, 'progress'));
    expect(backup.data.reading).toEqual(migrated.reading);
    expect(backup.data.legacyRaw).toEqual(legacyRaw);
    for (const [key, raw] of Object.entries(legacyRaw)) expect(await page.evaluate(key => localStorage.getItem(key), key), key).toBe(raw);
    expect(backup.raw).not.toContain(`"${sessionKey}"`);
    await testInfo.attach('cross-module-downloaded-backup.json', { body: Buffer.from(backup.raw), contentType: 'application/json' });

    const freshContext = await browser.newContext();
    try {
      const fresh = await freshContext.newPage();
      fresh.on('pageerror', error => errors.push(error.message));
      // A new device is still gated, even though its backup will contain all learning data.
      await fresh.goto(page.url());
      await expect(fresh.locator('#auth-gate')).toBeVisible();
      expect(await fresh.evaluate(key => localStorage.getItem(key), stateKey)).toBeNull();
      await authenticate(fresh);
      await fresh.reload();
      await ready(fresh, 'progress');
      await fresh.locator('#open-data-manager').click();
      await fresh.locator('#backup-file').setInputFiles({ name: 'downloaded-cross-module-backup.json', mimeType: 'application/json', buffer: Buffer.from(backup.raw) });
      await expect(fresh.locator('#migration-preview')).toBeVisible();
      await expect(fresh.locator('#confirm-data-import')).toBeEnabled();
      await fresh.locator('#confirm-data-import').click();
      await expect(fresh.locator('#data-status')).toHaveAttribute('data-state', 'saved');
      // Compare the actual downloaded bytes' parsed data before visiting any route can legitimately change navigation/preferences.
      expect(await savedData(fresh, 'progress')).toEqual(backup.data);
      await fresh.reload();
      await ready(fresh, 'progress');
      expect(await savedData(fresh, 'progress')).toEqual(backup.data);
      // Import preserves archived legacy strings, rather than writing old application keys on the new device.
      for (const key of Object.keys(legacyRaw)) expect(await fresh.evaluate(key => localStorage.getItem(key), key), key).toBeNull();

      await navigate(fresh, 'homework');
      await fresh.locator('[data-homework-part="translation"]').click();
      await ready(fresh, 'homework', 'translation');
      await expect(fresh.locator(`textarea[data-answer-id="${lesson.translation[0]!.id}"]`)).toHaveValue(unfinished);
      await expect(fresh.locator('#homework-name')).toHaveValue('Nguyễn An 中文');
      await expect(fresh.locator('#homework-class')).toHaveValue('Lớp HSK 1 · tối thứ tư');
      expect((await savedData(fresh, 'homework')).homework).toEqual(backup.data.homework);
      await fresh.locator('#receipt-first').click();
      await receipt(fresh, firstAnswers);
      await fresh.locator('#receipt-version').selectOption('latest');
      await receipt(fresh, secondAnswers);
      await fresh.locator('#close-receipt').click();
      await navigate(fresh, 'listening');
      await expect(fresh.locator('#listening-question')).toHaveAttribute('data-question-id', pendingQuestion.id);
      await expect(fresh.locator(`input[data-option-index="${pendingOption}"]`)).toBeChecked();
      await expect(fresh.locator('#listening-feedback')).toHaveCount(0);
      await expect(fresh.locator('#listening-rate')).toHaveValue('0.75');
      expect((await savedData(fresh, 'listening')).practice.listening).toEqual(backup.data.practice.listening);
      await navigate(fresh, 'vocabulary');
      await expect(fresh.locator('#vocabulary-card')).toHaveAttribute('data-sense-id', restoredSense!);
      await expect(fresh.locator('#vocabulary-answer')).toBeVisible();
      await expect(fresh.locator('#vocabulary-direction')).toHaveValue('vi-zh');
      const restored = await savedData(fresh, 'vocabulary');
      expect(restored.practice.cards).toEqual(backup.data.practice.cards);
      expect(restored.practice.listening).toEqual(backup.data.practice.listening);
      expect(restored.homework).toEqual(backup.data.homework);
      expect(restored.reading).toEqual(backup.data.reading);
      expect(restored.legacyRaw).toEqual(backup.data.legacyRaw);
      for (const row of Object.values(restored.homework.lessons)) {
        const translation = row.translation;
        if (!translation) continue;
        for (const attempt of [translation.first, translation.latest, translation.attempt, ...translation.history])
          if (attempt) expect(attempt).toMatchObject({ assessment: 'manual', correct: null, results: null });
      }
      await fresh.reload();
      await ready(fresh, 'vocabulary');
      expect((await savedData(fresh, 'vocabulary')).practice.cards).toEqual(backup.data.practice.cards);
    } finally { await freshContext.close(); }
    expect(errors).toEqual([]);
  });
});

async function layoutEvidence(page: Page, testInfo: TestInfo, label: string, selectors: string[]): Promise<void> {
  const width = page.viewportSize()!.width;
  for (const selector of selectors) await expect(page.locator(selector)).toBeVisible();
  const boxes = await page.evaluate(selectors => ({ documentWidth: document.documentElement.scrollWidth,
    boxes: selectors.map(selector => {
      const element = document.querySelector<HTMLElement>(selector)!;
      const box = element.getBoundingClientRect(), style = getComputedStyle(element);
      return { selector, left: box.left, right: box.right, width: box.width, height: box.height, fontSize: parseFloat(style.fontSize),
        clippedX: element.scrollWidth > element.clientWidth + 1 && ['hidden', 'clip'].includes(style.overflowX) };
    }) }), selectors);
  expect(boxes.documentWidth, `${label}: page overflow at ${width}px`).toBeLessThanOrEqual(width);
  for (const box of boxes.boxes) {
    expect(box.left, `${label}: ${box.selector} left`).toBeGreaterThanOrEqual(0);
    expect(box.right, `${label}: ${box.selector} right`).toBeLessThanOrEqual(width + 1);
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);
    expect(box.fontSize, `${label}: ${box.selector} readable text`).toBeGreaterThanOrEqual(14);
    expect(box.clippedX, `${label}: ${box.selector} clipped content`).toBe(false);
  }
  await testInfo.attach(`step8-${label}-${testInfo.project.name}-${width}.png`, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
}

test.describe('step 8 responsive cross-module evidence', () => {
  test.describe.configure({ timeout: 60_000 });
  for (const width of [320, 390, 768, 1104]) {
    test(`long Chinese/Vietnamese translation controls, complete receipt and independent practice remain usable at ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 800 });
      await authenticate(page, unlockedData());
      await page.goto('/#/homework?lesson=10&part=translation');
      await ready(page, 'homework', 'translation');
      await page.locator('#homework-name').fill('Nguyễn Thị Minh Anh 中文');
      await page.locator('#homework-class').fill('Lớp buổi tối · 第十课');
      const answers = { ...answersFor('布局原文'), [lesson.translation[0]!.id]: longAnswer };
      await translations(page, answers);
      await exactDraft(page, answers);
      const textarea = page.locator(`textarea[data-answer-id="${lesson.translation[0]!.id}"]`);
      await textarea.focus();
      await textarea.press('ControlOrMeta+End');
      await expect(textarea).toBeFocused();
      const textareaLayout = await textarea.evaluate(node => ({ font: parseFloat(getComputedStyle(node).fontSize), client: node.clientHeight, scroll: node.scrollHeight, top: node.scrollTop }));
      expect(textareaLayout.font).toBeGreaterThanOrEqual(16);
      expect(textareaLayout.scroll).toBeGreaterThan(textareaLayout.client);
      expect(textareaLayout.top).toBeGreaterThan(0);
      await layoutEvidence(page, testInfo, 'long-translation-controls', ['#feature-nav', '#lesson-select', '#homework-name', '#homework-class',
        `textarea[data-answer-id="${lesson.translation[0]!.id}"]`, '#submit-homework']);
      await page.locator('#submit-homework').click();
      await savedData(page, 'homework');
      await page.locator('#receipt-latest').click();
      await receipt(page, answers);
      await expect(page.locator('#homework-receipt')).toContainText('Nguyễn Thị Minh Anh 中文');
      await expect(page.locator('#homework-receipt')).toContainText(`Bài 10 · ${lesson.title}`);
      await expect(page.locator('.receipt-submission')).toContainText('Nộp lúc');
      for (const id of Object.keys(answers)) {
        const answer = page.locator(`[data-receipt-answer-id="${id}"]`);
        const style = await answer.evaluate(node => ({ whiteSpace: getComputedStyle(node).whiteSpace, height: node.clientHeight, scroll: node.scrollHeight, overflowY: getComputedStyle(node).overflowY }));
        expect(style.whiteSpace).toBe('pre-wrap');
        expect(style.scroll).toBeLessThanOrEqual(style.height + 1);
        expect(style.overflowY).not.toMatch(/hidden|clip/);
      }
      await layoutEvidence(page, testInfo, 'long-submitted-receipt', ['#homework-receipt', '.receipt-identity', '.receipt-submission',
        ...Object.keys(answers).map(id => `[data-receipt-answer-id="${id}"]`), '#close-receipt']);
      await page.emulateMedia({ media: 'print' });
      await receipt(page, answers);
      await expect(page.locator('.receipt-toolbar')).toBeHidden();
      await expect(page.locator('#feature-nav')).toBeHidden();
      await page.emulateMedia({ media: 'screen' });
      await page.locator('#close-receipt').click();
      await navigate(page, 'listening');
      await startListening(page);
      await submitListening(page, listeningQuestions[0]!, false);
      await layoutEvidence(page, testInfo, 'listening-feedback', ['#listening-settings', '#listening-question', '#listening-feedback', '#listening-rate', '#listening-play']);
      await navigate(page, 'vocabulary');
      await startVocabulary(page);
      await page.locator('#vocabulary-reveal').click();
      await page.locator('#vocabulary-hard').click();
      await layoutEvidence(page, testInfo, 'mixed-vocabulary', ['#vocabulary-settings', '#vocabulary-card', '#vocabulary-answer', '#vocabulary-rating-result', '#vocabulary-next']);
      await navigate(page, 'progress');
      await expect(page.locator('[data-progress-lesson="10"]')).toContainText('Dịch: đã nộp 5/5');
      await layoutEvidence(page, testInfo, 'independent-progress', ['#progress-overview', '#progress-translation-submitted', '#progress-listening-objective', '#progress-vocabulary-ratings', '[data-progress-lesson="10"]']);
    });
  }
});

async function keyboardActivate(locator: Locator, key = 'Enter'): Promise<void> {
  await locator.focus();
  await expect(locator).toBeFocused();
  await locator.press(key);
}

test('keyboard activation and synthetic composition/paste preserve exact multilingual input across modules; this is not physical-device IME evidence', async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  await authenticate(page, unlockedData());
  await page.goto('/#/homework?lesson=10&part=translation');
  await ready(page, 'homework', 'translation');
  const answers = answersFor('键盘');
  await translations(page, answers);
  await page.locator('#homework-name').focus();
  await page.keyboard.insertText('Nguyễn An 中文');
  await page.keyboard.press('Tab');
  await expect(page.locator('#homework-class')).toBeFocused();
  await page.keyboard.insertText('Lớp 10 · bàn phím');
  const id = lesson.translation[0]!.id;
  const textarea = page.locator(`textarea[data-answer-id="${id}"]`);
  await textarea.focus();
  await textarea.press('ControlOrMeta+A');
  await page.keyboard.insertText('我想买苹果。 Giá táo thật rẻ.');
  await page.keyboard.press('Enter');
  await page.keyboard.insertText('第二行 Tiếng Việt');
  let exact = '我想买苹果。 Giá táo thật rẻ.\n第二行 Tiếng Việt';
  await expect(textarea).toHaveValue(exact);
  const pasted = '\n\n粘贴原文：越南语 e\u0301 và 你好。\n  保留空格  ';
  // Scripted clipboard/input events test the app's paste path. They do not impersonate a real OS clipboard or IME.
  await textarea.evaluate((node, text) => {
    const input = node as HTMLTextAreaElement;
    const clipboardData = new DataTransfer(); clipboardData.setData('text/plain', text);
    input.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData }));
    input.setRangeText(text, input.selectionStart, input.selectionEnd, 'end');
    input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertFromPaste', data: text }));
  }, pasted);
  exact += pasted;
  const composing = '\n拼音组合输入：苹果';
  await textarea.evaluate((node, text) => {
    const input = node as HTMLTextAreaElement;
    input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, data: '' }));
    input.setRangeText(text, input.selectionStart, input.selectionEnd, 'end');
    input.dispatchEvent(new InputEvent('input', { bubbles: true, data: text, inputType: 'insertCompositionText', isComposing: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter', code: 'Enter', isComposing: true }));
  }, composing);
  exact += composing;
  await expect(textarea).toHaveValue(exact);
  await keyboardActivate(page.locator('#submit-homework'));
  await expect(page.locator('#homework-message')).toContainText('Hãy hoàn tất nhập chữ');
  expect((await savedData(page, 'homework')).homework.lessons['10']!.translation!.latest).toBeNull();
  await textarea.evaluate((node, text) => node.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: text })), composing);
  const tail = '\n尚未触发 input 的最后一个字：字';
  await textarea.evaluate((node, text) => {
    node.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, data: '' }));
    (node as HTMLTextAreaElement).value += text;
    // No final input/compositionend: unmount must capture the current visible textarea value.
  }, tail);
  exact += tail;
  answers[id] = exact;
  await keyboardActivate(page.locator('#feature-nav [data-feature="listening"]'));
  await ready(page, 'listening');
  await keyboardActivate(page.locator('#listening-none'), 'Space');
  await keyboardActivate(page.locator('[data-listening-lesson="10"]'), 'Space');
  await expect(page.locator('[data-listening-lesson="10"]')).toBeChecked();
  if (await page.locator('#listening-shuffle').isChecked()) await keyboardActivate(page.locator('#listening-shuffle'), 'Space');
  await expect(page.locator('#listening-shuffle')).not.toBeChecked();
  await keyboardActivate(page.locator('#listening-start'));
  await expect(page.locator('#listening-question')).toHaveAttribute('data-question-id', listeningQuestions[0]!.id);
  await keyboardActivate(page.locator(`input[data-option-index="${listeningQuestions[0]!.answer}"]`), 'Space');
  await keyboardActivate(page.locator('#listening-submit'));
  await expect(page.locator('#listening-feedback')).toBeVisible();
  await keyboardActivate(page.locator('#feature-nav [data-feature="vocabulary"]'));
  await ready(page, 'vocabulary');
  await keyboardActivate(page.locator('#vocabulary-start'));
  await keyboardActivate(page.locator('#vocabulary-reveal'), 'Space');
  await expect(page.locator('#vocabulary-answer')).toBeVisible();
  await keyboardActivate(page.locator('#vocabulary-good'));
  await expect(page.locator('#vocabulary-next')).toBeFocused();
  await keyboardActivate(page.locator('#feature-nav [data-feature="homework"]'));
  await ready(page, 'homework', 'choice');
  await keyboardActivate(page.locator('[data-homework-part="translation"]'));
  await ready(page, 'homework', 'translation');
  await exactDraft(page, answers);
  expect((await savedData(page, 'homework')).homework.lessons['10']!.translation!.latest).toBeNull();
  await page.reload();
  await ready(page, 'homework', 'translation');
  await exactDraft(page, answers);
  await keyboardActivate(page.locator('#submit-homework'));
  const submitted = (await savedData(page, 'homework')).homework.lessons['10']!.translation!.latest;
  expect(submitted).toMatchObject({ answers, assessment: 'manual', correct: null, results: null });
  await keyboardActivate(page.locator('#receipt-latest'));
  await receipt(page, answers);
  await expect(page.locator('#receipt-title')).toBeFocused();
  await testInfo.attach('synthetic-input-scope.txt', { body: Buffer.from('Keyboard activation, scripted ClipboardEvent/InputEvent and CompositionEvent coverage only. Real phone keyboard, physical Chinese IME, touch and human language review remain manual acceptance.'), contentType: 'text/plain' });
  await keyboardActivate(page.locator('#close-receipt'));
  await expect(page.locator('#receipt-latest')).toBeFocused();
});

test('exit protection captures an unreported composition tail before refresh, preserving it after cancel and confirmed save', async ({ page }) => {
  await authenticate(page, unlockedData());
  await page.goto('/#/homework?lesson=10&part=translation'); await ready(page, 'homework', 'translation');
  const id = lesson.translation[0]!.id;
  const textarea = page.locator(`textarea[data-answer-id="${id}"]`);
  await textarea.fill('已保存的前文'); await savedData(page, 'homework');
  const exact = '已保存的前文\n尚未发出input事件的中文尾字：字';
  await textarea.evaluate((node, value) => {
    node.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    (node as HTMLTextAreaElement).value = value;
  }, exact);
  const pending = page.waitForEvent('dialog');
  const refresh = page.reload().catch(error => String(error));
  const dialog = await pending; expect(dialog.type()).toBe('beforeunload');
  await dialog.dismiss(); await refresh;
  await expect(textarea).toHaveValue(exact);
  await savedData(page, 'homework');
  await page.reload(); await ready(page, 'homework', 'translation');
  await expect(textarea).toHaveValue(exact);
  expect((await savedData(page, 'homework')).homework.lessons['10']!.translation!.latest).toBeNull();
  // Even rejected over-limit composition remains visible only in the DOM and must not silently disappear.
  const oversized = '字'.repeat(homework.MAX_TRANSLATION_LENGTH + 1);
  await textarea.evaluate((node, value) => {
    node.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    (node as HTMLTextAreaElement).value = value;
    node.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertCompositionText', isComposing: true }));
  }, oversized);
  const invalidExit = page.waitForEvent('dialog');
  const invalidRefresh = page.reload().catch(error => String(error));
  const invalidDialog = await invalidExit; expect(invalidDialog.type()).toBe('beforeunload');
  await invalidDialog.dismiss(); await invalidRefresh;
  await expect(textarea).toHaveValue(oversized);
  expect((await savedData(page, 'homework')).homework.lessons['10']!.translation!.draft[id]).toBe(exact);
  await expect(page.locator('#homework-message')).toContainText('vượt giới hạn');
});
