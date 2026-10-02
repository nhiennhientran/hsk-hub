import { readFile } from 'node:fs/promises';
import { test, expect, type Page } from '@playwright/test';
import legacy from '../../src/domain/homework/engine.js';
import practice from '../../src/domain/practice/engine.js';
import { blankExercisesState } from '../../src/domain/exercises/engine.ts';
import { blankHomework30, HOMEWORK30_PARTS, homework30Group, submitHomework30 } from '../../src/domain/homework30/engine.ts';
import type { Homework30Lesson, Homework30Question } from '../../src/services/content/homework30.ts';
import type { Homework30Part } from '../../src/domain/homework30/engine.ts';
const bank = JSON.parse(await readFile(new URL('../../content/homework30-bank.json', import.meta.url), 'utf8')).lessons as Homework30Lesson[];
const oldBank = JSON.parse(await readFile(new URL('../../content/stage2-bank.json', import.meta.url), 'utf8')).lessons;
const key = 'ran_hsk1_modular_v1', at = 1790812800000;
function ordered(q: Homework30Question): number[] {
  if (q.kind !== 'sort') throw Error('Expected sort');
  const target = legacy.normal(q.answers[0]);
  function walk(order: number[], remaining: string): number[] | null {
    if (order.length === q.tokens.length) return remaining ? null : order;
    for (let i = 0; i < q.tokens.length; i++) if (!order.includes(i)) {
      const token = legacy.normal(q.tokens[i]); if (remaining.startsWith(token)) { const found = walk([...order, i], remaining.slice(token.length)); if (found) return found; }
    }
    return null;
  }
  const result = walk([], target); if (!result) throw Error(q.id); return result;
}
function seed(completeParts: readonly Homework30Part[] = []) {
  const homework30 = blankHomework30(), homework = legacy.blank(), lesson = bank[0]!;
  for (const part of completeParts) {
    homework30Group(homework30, 1, part).draft = Object.fromEntries(lesson[part].map(q => [q.id, q.kind === 'translation' ? '我的中文答案。' : q.kind === 'sort' ? ordered(q) : q.answer]));
    if (!submitHomework30(homework30, lesson, part, at).ok) throw Error(part);
  }
  legacy.group(homework, 1, 'choice').draft = Object.fromEntries(oldBank[0].choice.map((q: { id: string; answer: number }) => [q.id, q.answer])); legacy.submit(homework, 1, 'choice', oldBank[0].choice, at);
  return { reading: { lessons: {}, mastered: {}, modules: {} }, homework, homework30, practice: practice.blank(), exercises: blankExercisesState(), navigation: null, legacyRaw: {} };
}
async function login(page: Page, data = seed()) {
  await page.addInitScript(({ key, data, at }) => { sessionStorage.setItem('hsk_portal_unlocked_v2', '1'); if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({ app: 'hsk1-modular', schema: 1, revision: 1, updatedAt: at, data, recovery: null })); }, { key, data, at });
}
async function ready(page: Page, part: Homework30Part) {
  await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'ready');
  await expect(page.locator('[data-homework-version]')).toHaveAttribute('data-homework-version', '30-v1');
  await expect(page.locator(`[data-homework-part="${part}"]`)).toHaveAttribute('aria-current', 'page');
}
async function fill(page: Page, part: Homework30Part, wrong = false) {
  for (const q of bank[0]![part]) {
    if (q.kind === 'sort') for (const index of ordered(q)) await page.locator(`[data-sort-add="${q.id}"][data-token-index="${index}"]`).click();
    else if (q.kind === 'translation') await page.locator(`textarea[data-answer-id="${q.id}"]`).fill(`我的中文写作。\n${q.id}`);
    else await page.locator(`input[data-answer-id="${q.id}"][value="${wrong ? (q.answer + 1) % 4 : q.answer}"]`).check();
  }
}
async function saved(page: Page) { await expect(page.locator('#homework-save-status')).toHaveAttribute('data-state', 'saved'); }

test('five sections total exactly30 and submit25 automatic plus5 manual, with unchanged legacy and independent domains', async ({ page }) => {
  test.setTimeout(60_000); const initial = seed(); await login(page, initial);
  await page.goto('/#/homework?lesson=1&part=choice&version=30-v1'); await ready(page, 'choice');
  await expect(page.locator('[data-homework-part]')).toHaveCount(5);
  for (const part of HOMEWORK30_PARTS) {
    if (part !== 'choice') { await page.locator(`[data-homework-part="${part}"]`).click(); await ready(page, part); }
    await expect(page.locator('[data-question-id]')).toHaveCount(part === 'choice' ? 10 : 5);
    await fill(page, part); await page.locator('#submit-homework').click();
    await expect(page.locator('#homework-result')).toBeVisible();
    if (part === 'translation') await expect(page.locator('#homework-result')).toContainText('Không có điểm tự động');
    else await expect(page.locator('#homework-result')).toContainText(part === 'choice' ? '10 / 10' : '5 / 5');
    await saved(page);
  }
  const result = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).data, key);
  expect(result.homework).toEqual(initial.homework); expect(result.practice).toEqual(initial.practice); expect(result.exercises).toEqual(initial.exercises);
  expect(result.homework30.lessons['1'].translation.latest.correct).toBeNull();
  await page.locator('#receipt-latest').click(); await expect(page.locator('#homework-receipt')).toContainText('hsk1-homework-30-v1');
  await expect(page.locator('[data-receipt-score]')).toHaveCount(0); await expect(page.locator('[data-receipt-answer-id]')).toHaveCount(5);
  await page.locator('#close-receipt').click(); await expect(page.locator('#receipt-latest')).toBeFocused();
});

test('redo first/latest receipts, incomplete submission, reload and old-version history stay separate', async ({ page }) => {
  await login(page); await page.goto('/#/homework?lesson=1&part=choice&version=30-v1'); await ready(page, 'choice');
  await page.locator('#submit-homework').click(); await expect(page.locator('.is-missing')).toHaveCount(10);
  await fill(page, 'choice', true); await page.locator('#submit-homework').click(); await saved(page);
  await expect(page.locator('#homework-result')).toContainText('0 / 10');
  await page.locator('#restart-homework').click(); await fill(page, 'choice'); await page.locator('#submit-homework').click(); await saved(page);
  await page.reload(); await ready(page, 'choice');
  await page.locator('#receipt-first').click(); await expect(page.locator('[data-receipt-score]')).toContainText('0/10');
  await page.locator('#receipt-version').selectOption('latest'); await expect(page.locator('[data-receipt-score]')).toContainText('10/10');
  await page.locator('#close-receipt').click(); await page.locator('#homework-version-history-toggle').click(); await page.locator('#homework-legacy-link').click();
  await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'ready'); await expect(page.locator('[data-question-id]')).toHaveCount(5);
  await page.locator('#receipt-first').click(); await expect(page.locator('#homework-receipt')).toContainText('stage2'); await expect(page.locator('[data-receipt-score]')).toContainText('5/5');
  await page.goBack(); await ready(page, 'choice'); await expect(page.locator('#homework-result')).toContainText('10 / 10');
});

test('manual input survives navigation and a new version receipt never reads an unsent redo draft', async ({ page }) => {
  await login(page, seed(HOMEWORK30_PARTS.slice(0, -1))); await page.goto('/#/homework?lesson=1&part=translation&version=30-v1'); await ready(page, 'translation');
  await fill(page, 'translation'); await page.locator('#submit-homework').click(); await saved(page);
  const q = bank[0]!.translation[0]!; await page.locator('#restart-homework').click();
  const draft = `尚未提交的新草稿\n${'中'.repeat(1200)}`; await page.locator(`textarea[data-answer-id="${q.id}"]`).fill(draft); await saved(page);
  await page.locator('[data-homework-part="listening"]').click(); await ready(page, 'listening'); await page.goBack(); await ready(page, 'translation');
  await expect(page.locator(`textarea[data-answer-id="${q.id}"]`)).toHaveValue(draft);
  await page.locator('#receipt-latest').click(); await expect(page.locator(`[data-receipt-answer-id="${q.id}"]`)).not.toContainText('尚未提交'); await page.locator('#close-receipt').click();
  await expect(page.locator(`textarea[data-answer-id="${q.id}"]`)).toHaveValue(draft);
});

test('listening uses original audio, hides transcript until submission and leaves no scores on play', async ({ page }) => {
  await login(page, seed(['choice', 'sort'])); await page.goto('/#/homework?lesson=1&part=listening&version=30-v1'); await ready(page, 'listening');
  await expect(page.locator('[data-homework-audio]')).toHaveCount(5); await expect(page.locator('.homework-question details')).toHaveCount(0);
  const before = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).data.homework30, key);
  const requested = page.waitForRequest(request => request.url().includes('/course-assets/audio/1-1.mp3'));
  await page.locator('[data-homework-audio]').first().click(); await requested;
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).data.homework30, key)).toEqual(before);
  await fill(page, 'listening'); await page.locator('#submit-homework').click(); await saved(page); await expect(page.locator('.homework-question details')).toHaveCount(5);
  await page.locator('[data-homework-part="translationChoice"]').click(); await ready(page, 'translationChoice');
  await expect(page.locator('[data-homework-audio]')).toHaveCount(0);
});

test('mobile homework puts tasks first and keeps all five parts reachable in one scrolling row', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await login(page);
  await page.goto('/#/homework?lesson=1&part=choice&version=30-v1'); await ready(page, 'choice');
  await expect(page.locator('#homework-submission-details')).not.toHaveAttribute('open');
  await expect(page.locator('#homework-study-details')).not.toHaveAttribute('open');
  await expect(page.locator('#homework-name')).not.toBeVisible(); await expect(page.locator('#homework-save-status')).toBeVisible();
  const before = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).data.homework30, key);
  await page.locator('#homework-submission-details-toggle').click(); await expect(page.locator('#homework-name')).toBeVisible();
  await page.locator('#homework-submission-details-toggle').click();
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).data.homework30, key)).toEqual(before);
  const dimensions = await page.locator('[data-homework-parts]').evaluate(nav => ({ height: nav.getBoundingClientRect().height, row: getComputedStyle(nav).flexWrap, overflow: document.documentElement.scrollWidth > innerWidth, toolsAfterTask: !!(document.querySelector('.homework-exercise')!.compareDocumentPosition(document.querySelector('#homework-study-details')!) & Node.DOCUMENT_POSITION_FOLLOWING) }));
  expect(dimensions.height).toBeLessThan(100); expect(dimensions.row).toBe('nowrap'); expect(dimensions.overflow).toBe(false); expect(dimensions.toolsAfterTask).toBe(true);
  await page.locator('[data-homework-part="translation"]').click(); await ready(page, 'translation');
  await expect.poll(() => page.locator('[data-homework-part="translation"]').evaluate(anchor => { const item = anchor.getBoundingClientRect(), row = anchor.parentElement!.getBoundingClientRect(); return item.left >= row.left - 1 && item.right <= row.right + 1; })).toBe(true);
  await page.locator('#homework-study-details-toggle').click(); await expect(page.locator('#export-homework-backup')).toBeVisible(); await expect(page.locator('[data-homework-version]')).toContainText('25');
});
