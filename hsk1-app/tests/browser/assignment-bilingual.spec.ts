import { readFile } from 'node:fs/promises';
import { test, expect, type Page, type Locator } from '@playwright/test';
import homework from '../../src/domain/homework/engine.js';
import practice from '../../src/domain/practice/engine.js';

const stateKey = 'ran_hsk1_modular_v1';
const bank = JSON.parse(await readFile(new URL('../../content/stage2-bank.json', import.meta.url), 'utf8'));
const catalog = JSON.parse(await readFile(new URL('../../content/stage3-catalog.json', import.meta.url), 'utf8'));
const lesson = bank.lessons.find((row: { id: number }) => row.id === 1);
async function open(page: Page, feature: 'homework' | 'listening', raw?: string, part = 'choice'): Promise<void> {
  await page.addInitScript(({ stateKey, raw }) => {
    sessionStorage.setItem('hsk_portal_unlocked_v2', '1');
    if (raw && !localStorage.getItem(stateKey)) localStorage.setItem(stateKey, raw);
  }, { stateKey, raw });
  await page.goto(`/#/${feature}?lesson=1${feature === 'homework' ? `&part=${part}` : ''}`);
  await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'ready');
}
async function paired(node: Locator): Promise<void> {
  await expect(node.locator(':scope > [lang="zh"]')).toContainText(/\p{Script=Han}/u);
  await expect(node.locator(':scope > [lang="vi"]')).not.toBeEmpty();
}
async function fits(page: Page, selectors: string[], width: number): Promise<void> {
  await page.setViewportSize({ width, height: 850 });
  const boxes = await page.evaluate(selectors => ({ width: document.documentElement.scrollWidth,
    boxes: selectors.map(selector => {
      const bounds = document.querySelector(selector)!.getBoundingClientRect();
      return { selector, left: bounds.left, right: bounds.right };
    }) }), selectors);
  expect(boxes.width, `document overflow at ${width}px`).toBeLessThanOrEqual(width);
  for (const box of boxes.boxes) {
    expect(box.left, box.selector).toBeGreaterThanOrEqual(0);
    expect(box.right, box.selector).toBeLessThanOrEqual(width + 1);
  }
}
function manualReady(): string {
  const state = homework.blank();
  for (const part of ['choice', 'sort'] as const) {
    const group = homework.group(state, 1, part);
    group.draft = Object.fromEntries(lesson[part].map((question: { id: string; answer: number; tokens: string[] }) =>
      [question.id, part === 'choice' ? question.answer : question.tokens.map((_, index) => index)]));
    if (!homework.submit(state, 1, part, lesson[part], 1789891200000).ok) throw new Error('Cannot prepare prerequisite submissions');
  }
  return JSON.stringify({ app: 'hsk1-modular', schema: 1, revision: 1, updatedAt: 1789891200000, recovery: null,
    data: { reading: { lessons: {}, mastered: {}, modules: {} }, homework: state, practice: practice.blank(), navigation: null, legacyRaw: {} } });
}

test('homework labels, locked instructions and validation are paired without translating question content', async ({ page }) => {
  await open(page, 'homework');
  await expect(page.locator('#homework-module h1')).toHaveAccessibleName('课后作业 · Bài tập');
  await expect(page.locator('#homework-name')).toHaveAccessibleName('姓名 · Họ và tên');
  await expect(page.locator('#homework-class')).toHaveAccessibleName('班级 · Lớp');
  await paired(page.locator('[data-homework-part="sort"]'));
  await expect(page.locator('[data-homework-part="sort"]')).toContainText('未解锁');
  await expect(page.locator('[data-homework-part="sort"]')).toContainText('Chưa mở');
  await page.locator('#submit-homework').click();
  await paired(page.locator('#homework-message'));
  await expect(page.locator('#homework-message')).toContainText('请回答全部 5 题');
  await expect(page.locator('#homework-message')).toContainText('trả lời đủ 5 câu');
  await expect(page.locator('[data-homework-feedback]')).toHaveCount(0);
  const first = lesson.choice[0];
  await expect(page.locator(`[data-question-id="${first.id}"] h3`)).toContainText(first.prompt);
  for (const [index, text] of first.options.entries()) await expect(page.locator(`input[data-answer-id="${first.id}"][value="${index}"]`).locator('..')).toContainText(text as string);
  for (const width of [320, 390, 768]) await fits(page, ['#homework-module', '.homework-profile', '.homework-question', '#submit-homework'], width);
  await page.locator('[data-homework-part="sort"]').click();
  await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'ready');
  await expect(page.locator('.homework-exercise')).toContainText('无需满分');
  await expect(page.locator('.homework-exercise')).toContainText('Không cần đạt điểm tối đa');
});

test('manual receipt has paired profile, status and print controls while preserving original typed answers without scores', async ({ page }, testInfo) => {
  await open(page, 'homework', manualReady(), 'translation');
  await page.locator('#homework-name').fill('Nguyễn An 中文');
  await page.locator('#homework-class').fill('HSK 1 · 越南班');
  const answers: Record<string, string> = {};
  for (const [index, question] of lesson.translation.entries()) {
    const answer = `我的回答 ${index + 1}。\nTiếng Việt giữ nguyên <>& · 中文`;
    answers[question.id] = answer;
    await page.locator(`textarea[data-answer-id="${question.id}"]`).fill(answer);
  }
  await page.locator('#submit-homework').click();
  await paired(page.locator('#homework-result'));
  await expect(page.locator('#homework-result')).toContainText('不自动评分');
  await page.locator('#receipt-latest').click();
  await expect(page.locator('#receipt-title')).toHaveAccessibleName('作业提交单 · Phiếu bài tập đã nộp');
  await expect(page.locator('#print-receipt')).toHaveAccessibleName('打印 / 存为 PDF · In / lưu PDF');
  await expect(page.locator('#receipt-version option')).toHaveText(['首次 · Lần đầu', '最近 · Gần nhất']);
  await paired(page.locator('.receipt-submission'));
  await expect(page.locator('#homework-receipt [data-receipt-score], #homework-receipt [data-homework-feedback]')).toHaveCount(0);
  for (const [id, answer] of Object.entries(answers)) expect(await page.locator(`[data-receipt-answer-id="${id}"]`).textContent()).toBe(answer);
  for (const width of [320, 390, 768]) await fits(page, ['#homework-receipt', '.receipt-identity', '.receipt-answer', '#print-receipt'], width);
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.receipt-toolbar')).toBeHidden();
  await expect(page.locator('#receipt-title [lang="zh"]')).toBeVisible();
  await expect(page.locator('#receipt-title [lang="vi"]')).toBeVisible();
  await testInfo.attach('bilingual-manual-receipt.png', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  await page.emulateMedia({ media: 'screen' });
  await page.locator('#close-receipt').click();
  await expect(page.locator('#receipt-latest')).toBeFocused();
});

for (const feature of ['homework', 'listening'] as const) test(`${feature} pending autosave is neutral and only a real failure exposes paired Retry`, async ({ page }) => {
  await open(page, feature);
  if (feature === 'listening') await expect(page.locator('#listening-save-status')).toHaveAttribute('data-state', 'saved');
  const pending = await page.evaluate(({ feature, stateKey }) => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (this === localStorage && key === stateKey) throw new DOMException('Injected failure', 'QuotaExceededError');
      return original.call(this, key, value);
    };
    if (feature === 'homework') {
      const input = document.querySelector<HTMLInputElement>('#homework-name')!;
      input.value = 'Test'; input.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      const input = document.querySelector<HTMLInputElement>('#listening-shuffle')!;
      input.checked = !input.checked; input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    const status = document.querySelector<HTMLElement>(`#${feature}-save-status`)!;
    return { state: status.dataset.state, failed: status.dataset.failed, retryHidden: document.querySelector<HTMLButtonElement>(`#retry-${feature}-save`)!.hidden };
  }, { feature, stateKey });
  expect(pending).toEqual({ state: 'unsaved', failed: 'false', retryHidden: true });
  await expect(page.locator(`#${feature}-save-status`)).toHaveAttribute('data-failed', 'true');
  await paired(page.locator(`#${feature}-save-status`));
  await expect(page.locator(`#${feature}-save-status`)).toContainText('存储空间已满');
  await expect(page.locator(`#${feature}-save-status`)).toContainText('Bộ nhớ đã đầy');
  await expect(page.locator(`#retry-${feature}-save`)).toHaveAccessibleName('重试保存 · Thử lưu lại');
  await expect(page.locator(`#retry-${feature}-save`)).toBeVisible();
});

test('listening 5/10/all controls, empty states and first/latest scores remain paired and independent', async ({ page }, testInfo) => {
  await open(page, 'listening');
  await expect(page.locator('#listening-module h1')).toHaveAccessibleName('听力练习 · Luyện nghe');
  await expect(page.locator('#listening-count')).toHaveAccessibleName('每轮题数 · Số câu mỗi lượt');
  await expect(page.locator('#listening-count option')).toHaveText(['5 题 · 5 câu', '10 题 · 10 câu', '全部题目 · Tất cả câu']);
  await page.locator('#listening-none').click();
  await paired(page.locator('#listening-available'));
  await expect(page.locator('#listening-start')).toBeDisabled();
  await page.locator('#listening-all').click();
  await page.locator('#listening-shuffle').uncheck();
  for (const count of ['5', '10', 'all']) {
    await page.locator('#listening-count').selectOption(count);
    await page.locator('#listening-start').click();
    await expect(page.locator('#listening-position [lang="zh"]')).toHaveText(`第 1 / ${count === 'all' ? 75 : count} 题`);
    await expect(page.locator('#listening-feedback, [data-listening-transcript]')).toHaveCount(0);
  }
  const first = catalog.listening[0];
  await expect(page.locator('#listening-question')).toHaveAttribute('data-question-id', first.id);
  await page.locator(`input[data-option-index="${(first.answer + 1) % 4}"]`).check();
  await page.locator('#listening-submit').click();
  await page.locator('#listening-redo').click();
  await expect(page.locator('#listening-feedback, [data-listening-transcript]')).toHaveCount(0);
  await page.locator(`input[data-option-index="${first.answer}"]`).check();
  await page.locator('#listening-submit').click();
  await paired(page.locator('#listening-first-score'));
  await paired(page.locator('#listening-latest-score'));
  await expect(page.locator('#listening-first-score [lang="zh"]')).toContainText('0 / 1');
  await expect(page.locator('#listening-first-score [lang="vi"]')).toContainText('0 / 1');
  await expect(page.locator('#listening-latest-score [lang="zh"]')).toContainText('1 / 1');
  await expect(page.locator('#listening-latest-score [lang="vi"]')).toContainText('1 / 1');
  await expect(page.locator('#listening-feedback')).toContainText(first.explanationVi);
  await expect(page.locator('#listening-feedback h4')).toHaveAccessibleName('录音内容 · Nội dung đã nghe');
  for (const width of [320, 390, 768]) await fits(page, ['#listening-settings', '#listening-question', '#listening-feedback', '#listening-summary', '#listening-rate'], width);
  await testInfo.attach('bilingual-listening.png', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
});
