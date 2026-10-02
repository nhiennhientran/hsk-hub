import { navigateFeature } from './ui-actions.ts';
import { readFile } from 'node:fs/promises';
import { test, expect, type Page } from '@playwright/test';
import homework from '../../src/domain/homework/engine.js';
import practice from '../../src/domain/practice/engine.js';

const stateKey = 'ran_hsk1_modular_v1';
const sessionKey = 'hsk_portal_unlocked_v2';
const writeLock = 'ran-hsk1-modular-write';
const fixedTime = 1789891200000;
type Question = { id: string; kind: 'choice' | 'sort' | 'translation'; prompt: string; options?: string[]; answer?: number; tokens?: string[]; answers?: string[]; fingerprint: string };
type Lesson = { id: number; lesson: number; title: string; choice: Question[]; sort: Question[]; translation: Question[] };
const bank = JSON.parse(await readFile(new URL('../../content/stage2-bank.json', import.meta.url), 'utf8')) as { lessons: Lesson[] };

function normalize(text: string): string { return text.normalize('NFKC').replace(/[\p{P}\p{Z}\s]/gu, ''); }
/** Solve from the fixed bank with token indexes, so equal token text remains distinct. */
function orderFor(question: Question): number[] {
  const wanted = normalize(question.answers![0]!);
  const search = (remaining: number[], prefix: string, order: number[]): number[] | undefined => {
    if (!remaining.length) return prefix === wanted ? order : undefined;
    for (const index of remaining) {
      const next = prefix + normalize(question.tokens![index]!);
      if (!wanted.startsWith(next)) continue;
      const result = search(remaining.filter(value => value !== index), next, [...order, index]);
      if (result) return result;
    }
    return undefined;
  };
  const order = search(question.tokens!.map((_, index) => index), '', []);
  if (!order) throw new Error(`No token order found for ${question.id}`);
  return order;
}

function seedData(lesson = 1): any {
  const state = homework.blank();
  const row = bank.lessons.find(value => value.id === lesson)!;
  for (const kind of ['choice', 'sort'] as const) {
    const group = homework.group(state, lesson, kind);
    group.draft = Object.fromEntries(row[kind].map(question => [question.id, kind === 'choice' ? question.answer : orderFor(question)]));
    const result = homework.submit(state, lesson, kind, row[kind], fixedTime);
    if (!result.ok) throw new Error('Could not create the fixed prerequisite state.');
  }
  return { reading: { lessons: {}, mastered: {}, modules: {} }, homework: state, practice: practice.blank(), navigation: null, legacyRaw: {} };
}
function envelope(data: any): string {
  return JSON.stringify({ app: 'hsk1-modular', schema: 1, revision: 1, updatedAt: fixedTime, data, recovery: null });
}
async function authenticate(page: Page, raw?: string): Promise<void> {
  await page.addInitScript(({ key, stateKey, raw }) => {
    sessionStorage.setItem(key, '1');
    if (raw && !localStorage.getItem(stateKey)) localStorage.setItem(stateKey, raw);
  }, { key: sessionKey, stateKey, raw });
}
async function ready(page: Page, lesson: number, part: string): Promise<void> {
  await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'ready');
  await expect(page.locator('#module-host')).toHaveAttribute('data-feature', 'homework');
  await expect(page.locator('#module-host')).toHaveAttribute('data-lesson', String(lesson));
  await expect(page.locator(`[data-homework-part="${part}"]`)).toHaveAttribute('aria-current', 'page');
}
async function part(page: Page, lesson: number, kind: string): Promise<void> {
  await page.locator(`[data-homework-part="${kind}"]`).click();
  await ready(page, lesson, kind);
}
async function saved(page: Page): Promise<void> { await expect(page.locator('#homework-save-status')).toHaveAttribute('data-state', 'saved'); }
async function savedGroup(page: Page, lesson: number, kind: string): Promise<any> {
  await saved(page);
  return page.evaluate(({ stateKey, lesson, kind }) => JSON.parse(localStorage.getItem(stateKey)!).data.homework.lessons[String(lesson)][kind], { stateKey, lesson, kind });
}
async function fillChoice(page: Page, row: Lesson, wrong = false): Promise<void> {
  for (const question of row.choice) {
    const answer = wrong ? (question.answer! + 1) % question.options!.length : question.answer!;
    await page.locator(`input[data-answer-id="${question.id}"][value="${answer}"]`).check();
  }
}
async function fillSort(page: Page, row: Lesson): Promise<void> {
  for (const question of row.sort) {
    for (const index of orderFor(question)) await page.locator(`button[data-sort-add="${question.id}"][data-token-index="${index}"]`).click();
  }
}
async function fillTranslation(page: Page, row: Lesson, tag: string): Promise<Record<string, string>> {
  const answers = Object.fromEntries(row.translation.map((question, index) => [question.id, `${tag} · 中文回答 ${index + 1}\n第二行，保留换行。`]));
  for (const [id, value] of Object.entries(answers)) await page.locator(`textarea[data-answer-id="${id}"]`).fill(value);
  return answers;
}
async function downloadBackup(page: Page, selector = '#export-homework-backup'): Promise<any> {
  const pending = page.waitForEvent('download');
  await page.locator(selector).click();
  const download = await pending;
  expect(await download.failure()).toBeNull();
  const stream = await download.createReadStream();
  expect(stream).not.toBeNull();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

test.describe('complete homework course', () => {
  // The existing 60-second course budget must apply before page-fixture setup.
  test.describe.configure({ timeout: 60_000 });
  for (const start of [1, 6, 11]) {
    test(`all 75 fixed questions in lessons ${start}–${start + 4} submit through real controls and retain correct assessment`, async ({ page }) => {
      await authenticate(page);
      await page.goto(`/#/homework?lesson=${start}&part=choice`);
      let submitted = 0;
      for (let lesson = start; lesson < start + 5; lesson++) {
        const row = bank.lessons.find(value => value.id === lesson)!;
        if (lesson !== start) await page.locator('#lesson-select').selectOption(String(lesson));
        await ready(page, lesson, 'choice');
        await expect(page.locator('[data-question-id]')).toHaveCount(5);
        await expect(page.locator('[data-homework-part="sort"]')).toHaveAttribute('data-locked', 'true');
        // Every answer can be wrong: submission, rather than a passing score, opens the next part.
        await fillChoice(page, row, true);
        await page.locator('#submit-homework').click();
        const choice = await savedGroup(page, lesson, 'choice');
        expect(choice.latest).toMatchObject({ assessment: 'automatic', correct: 0, total: 5 });
        expect(choice.completed).toBe(true);
        await expect(page.locator('[data-homework-part="sort"]')).toHaveAttribute('data-locked', 'false');
        await part(page, lesson, 'sort');
        await expect(page.locator('[data-question-id]')).toHaveCount(5);
        await fillSort(page, row);
        await page.locator('#submit-homework').click();
        const sort = await savedGroup(page, lesson, 'sort');
        expect(sort.latest).toMatchObject({ assessment: 'automatic', correct: 5, total: 5 });
        expect(Object.values(sort.latest.results)).toEqual(Array(5).fill(true));
        await expect(page.locator('[data-homework-part="translation"]')).toHaveAttribute('data-locked', 'false');
        await part(page, lesson, 'translation');
        await expect(page.locator('[data-question-id]')).toHaveCount(5);
        const answers = await fillTranslation(page, row, `Bài ${lesson}`);
        await page.locator('#submit-homework').click();
        const translation = await savedGroup(page, lesson, 'translation');
        expect(translation.latest).toMatchObject({ assessment: 'manual', correct: null, results: null, total: 5, answers });
        expect(translation.completed).toBe(true);
        await page.locator('#receipt-latest').click();
        const receipt = page.locator('#homework-receipt');
        await expect(receipt).toBeVisible();
        await expect(receipt).toContainText(`Bài ${lesson} · ${row.title}`);
        await expect(receipt.locator('[data-receipt-answer-id]')).toHaveCount(5);
        for (const [id, answer] of Object.entries(answers)) expect(await receipt.locator(`[data-receipt-answer-id="${id}"]`).textContent()).toBe(answer);
        await expect(receipt.locator('[data-receipt-score]')).toHaveCount(0);
        await page.locator('#close-receipt').click();
        submitted += Object.keys(choice.latest.answers).length + Object.keys(sort.latest.answers).length + Object.keys(translation.latest.answers).length;
        // The lesson selector preserves the current part. Return to choice before selecting the next lesson.
        if (lesson < start + 4) await part(page, lesson, 'choice');
      }
      expect(submitted).toBe(75);
      expect(bank.lessons.reduce((total, row) => total + row.choice.length + row.sort.length + row.translation.length, 0)).toBe(225);
    });
  }
});

test('choice redoing keeps first and latest submissions, feedback and history separate from the unfinished draft after reload', async ({ page }) => {
  await authenticate(page);
  await page.goto('/#/homework?lesson=1&part=choice');
  await ready(page, 1, 'choice');
  const row = bank.lessons[0]!;
  await fillChoice(page, row, true);
  await page.locator('#submit-homework').click();
  const first = (await savedGroup(page, 1, 'choice')).first;
  expect(first.correct).toBe(0);
  await expect(page.locator('[data-question-id]').first()).toContainText(row.choice[0]!.options![row.choice[0]!.answer!]!);
  await expect(page.locator('[data-question-id]').first()).toContainText((row.choice[0] as any).explanation);
  await page.locator('#restart-homework').click();
  await fillChoice(page, row);
  await page.locator('#submit-homework').click();
  const latest = await savedGroup(page, 1, 'choice');
  expect(latest.first).toEqual(first);
  expect(latest.latest.correct).toBe(5);
  expect(latest.history).toHaveLength(2);
  await page.locator('#restart-homework').click();
  const id = row.choice[0]!.id;
  const draftAnswer = (row.choice[0]!.answer! + 2) % row.choice[0]!.options!.length;
  await page.locator(`input[data-answer-id="${id}"][value="${draftAnswer}"]`).check();
  await saved(page);
  await page.reload();
  await ready(page, 1, 'choice');
  await expect(page.locator(`input[data-answer-id="${id}"][value="${draftAnswer}"]`)).toBeChecked();
  const restored = await savedGroup(page, 1, 'choice');
  expect(restored.attempt).toBeNull();
  expect(restored.first).toEqual(first);
  expect(restored.latest).toEqual(latest.latest);
  expect(restored.history).toHaveLength(2);
  expect(restored.draft).toEqual({ [id]: draftAnswer });
});

test('manual Chinese multiline composition and receipts preserve submitted answers while a new draft remains unsubmitted', async ({ page }, testInfo) => {
  await authenticate(page, envelope(seedData()));
  await page.goto('/#/homework?lesson=1&part=translation');
  await ready(page, 1, 'translation');
  const row = bank.lessons[0]!;
  await page.locator('#homework-name').fill('Nguyễn An 中文');
  await page.locator('#homework-class').fill('HSK1 – tối thứ tư');
  const answers = await fillTranslation(page, row, '提交 A');
  const id = row.translation[0]!.id;
  const longAnswer = '你好，谢谢！\n'.repeat(220) + '末尾输入中文';
  expect(longAnswer.length).toBeGreaterThan(1200);
  const textarea = page.locator(`textarea[data-answer-id="${id}"]`);
  await textarea.focus();
  await textarea.evaluate((element, value) => {
    const input = element as HTMLTextAreaElement;
    input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, data: '' }));
    input.value = value;
    input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertCompositionText', data: value, isComposing: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter', code: 'Enter', isComposing: true }));
  }, longAnswer);
  await expect(textarea).toBeFocused();
  await expect(textarea).toHaveValue(longAnswer);
  expect((await savedGroup(page, 1, 'translation')).latest).toBeNull();
  await page.locator('#submit-homework').click();
  await expect(page.locator('#homework-message')).toContainText('Hãy hoàn tất nhập chữ');
  expect((await savedGroup(page, 1, 'translation')).latest).toBeNull();
  await textarea.evaluate((element, value) => {
    element.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: value }));
    element.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: value }));
  }, longAnswer);
  answers[id] = longAnswer;
  await page.locator('#submit-homework').click();
  const first = (await savedGroup(page, 1, 'translation')).first;
  expect(first).toMatchObject({ assessment: 'manual', correct: null, results: null, answers });
  await expect(page.locator('[data-homework-feedback]')).toHaveCount(0);
  await expect(page.locator('#homework-module')).not.toContainText('Đáp án tham khảo');
  await page.locator('#receipt-first').click();
  await expect(page.locator('#homework-receipt')).toBeVisible();
  await expect(page.locator('#homework-receipt')).toContainText('Nguyễn An 中文');
  await expect(page.locator('#homework-receipt')).toContainText('HSK1 – tối thứ tư');
  await expect(page.locator(`[data-receipt-answer-id="${id}"]`)).toHaveText(longAnswer);
  expect(await page.locator(`[data-receipt-answer-id="${id}"]`).textContent()).toBe(longAnswer);
  expect(await page.locator(`[data-receipt-answer-id="${id}"]`).evaluate(node => getComputedStyle(node).whiteSpace)).toBe('pre-wrap');
  await expect(page.locator('[data-receipt-score]')).toHaveCount(0);
  await page.locator('#close-receipt').click();
  await page.locator('#restart-homework').click();
  const draftB = '草稿 B 尚未提交\n换行继续写';
  await page.locator(`textarea[data-answer-id="${id}"]`).fill(draftB);
  await saved(page);
  await page.reload();
  await ready(page, 1, 'translation');
  await expect(page.locator(`textarea[data-answer-id="${id}"]`)).toHaveValue(draftB);
  const current = await savedGroup(page, 1, 'translation');
  expect(current.first).toEqual(first);
  expect(current.latest).toEqual(first);
  expect(current.attempt).toBeNull();
  expect(current.history).toHaveLength(1);
  await page.locator('#receipt-latest').click();
  await expect(page.locator(`[data-receipt-answer-id="${id}"]`)).toHaveText(longAnswer);
  await expect(page.locator('#homework-receipt')).not.toContainText(draftB);
  await page.locator('#close-receipt').click();
  const secondAnswers = await fillTranslation(page, row, '提交 C');
  await page.locator('#submit-homework').click();
  const submitted = await savedGroup(page, 1, 'translation');
  expect(submitted.first).toEqual(first);
  expect(submitted.latest.answers).toEqual(secondAnswers);
  expect(submitted.history).toHaveLength(2);
  await page.locator('#receipt-first').click();
  await expect(page.locator(`[data-receipt-answer-id="${id}"]`)).toHaveText(longAnswer);
  await page.locator('#receipt-version').selectOption('latest');
  await expect(page.locator(`[data-receipt-answer-id="${id}"]`)).toHaveText(secondAnswers[id]!);
  await expect(page.locator('[data-receipt-score]')).toHaveCount(0);
  await page.locator('#receipt-version').selectOption('first');
  for (const width of [320, 390, 768, 1104]) {
    await page.setViewportSize({ width, height: 800 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `receipt overflow at ${width}px`).toBe(true);
    expect(await page.locator(`[data-receipt-answer-id="${id}"]`).textContent()).toBe(longAnswer);
    await expect(page.locator('#homework-receipt')).toBeVisible();
  }
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('#homework-receipt')).toBeVisible();
  await expect(page.locator(`[data-receipt-answer-id="${id}"]`)).toBeVisible();
  expect(await page.locator(`[data-receipt-answer-id="${id}"]`).textContent()).toBe(longAnswer);
  await expect(page.locator('.receipt-toolbar')).toBeHidden();
  await expect(page.locator('#feature-nav')).toBeHidden();
  await expect(page.locator('#homework-module > h1')).toBeHidden();
  await page.emulateMedia({ media: 'screen' });
  await page.locator('#receipt-version').selectOption('latest');
  await page.setViewportSize({ width: 320, height: 800 });
  await page.screenshot({ path: testInfo.outputPath('manual-receipt-320.png'), fullPage: true });
});

test('an unfinished composition tail in the actual textarea is captured before module unmount', async ({ page }) => {
  await authenticate(page, envelope(seedData()));
  await page.goto('/#/homework?lesson=1&part=translation');
  await ready(page, 1, 'translation');
  const id = bank.lessons[0]!.translation[0]!.id;
  const textarea = page.locator(`textarea[data-answer-id="${id}"]`);
  await textarea.fill('已触发 input 的前文');
  const draft = '已触发 input 的前文\n组合输入最后一个中文字';
  await textarea.evaluate((element, value) => {
    element.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, data: '' }));
    (element as HTMLTextAreaElement).value = value;
    // Deliberately omit input and compositionend: teardown must read the displayed value.
  }, draft);
  await navigateFeature(page, 'textbook', Number(await page.locator('#lesson-select').inputValue()));
  await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'ready');
  await expect(page.locator('#module-host')).toHaveAttribute('data-feature', 'textbook');
  await navigateFeature(page, 'homework', Number(await page.locator('#lesson-select').inputValue()));
  await ready(page, 1, 'choice');
  await part(page, 1, 'translation');
  await expect(page.locator(`textarea[data-answer-id="${id}"]`)).toHaveValue(draft);
  const group = await savedGroup(page, 1, 'translation');
  expect(group.draft[id]).toBe(draft);
  expect(group.latest).toBeNull();
  await page.reload();
  await ready(page, 1, 'translation');
  await expect(page.locator(`textarea[data-answer-id="${id}"]`)).toHaveValue(draft);
});

test('repeated sort token text has independent indexes and draft, profile and token order survive cross-module navigation', async ({ page }) => {
  const data = seedData(15);
  homework.restart(data.homework, 15, 'sort', fixedTime);
  await authenticate(page, envelope(data));
  await page.goto('/#/homework?lesson=15&part=sort');
  await ready(page, 15, 'sort');
  const question = bank.lessons[14]!.sort[0]!;
  await page.setViewportSize({ width: 320, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(question.tokens!.filter(token => token === '喜欢')).toHaveLength(2);
  await page.locator('#homework-name').fill('An');
  await page.locator('#homework-class').fill('Lớp 15');
  for (const index of [0, 5, 2]) await page.locator(`button[data-sort-add="${question.id}"][data-token-index="${index}"]`).click();
  await expect(page.locator(`button[data-sort-remove="${question.id}"]`)).toHaveCount(3);
  await page.locator(`button[data-sort-remove="${question.id}"][data-token-index="0"]`).click();
  await expect(page.locator(`button[data-sort-remove="${question.id}"][data-token-index="5"]`)).toBeVisible();
  await expect(page.locator(`button[data-sort-add="${question.id}"][data-token-index="0"]`)).toBeEnabled();
  await navigateFeature(page, 'textbook', Number(await page.locator('#lesson-select').inputValue()));
  await expect(page.locator('#module-host')).toHaveAttribute('data-feature', 'textbook');
  await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'ready');
  await page.locator('#lesson-select').selectOption('3');
  await navigateFeature(page, 'homework', Number(await page.locator('#lesson-select').inputValue()));
  await ready(page, 3, 'choice');
  await expect(page.locator('#homework-name')).toHaveValue('An');
  await expect(page.locator('#homework-class')).toHaveValue('Lớp 15');
  await page.locator('#lesson-select').selectOption('15');
  await part(page, 15, 'sort');
  await expect(page.locator(`button[data-sort-remove="${question.id}"]`)).toHaveCount(2);
  expect((await savedGroup(page, 15, 'sort')).draft[question.id]).toEqual([5, 2]);
  await page.reload();
  await ready(page, 15, 'sort');
  expect((await savedGroup(page, 15, 'sort')).draft[question.id]).toEqual([5, 2]);
  const availableBefore = await page.locator(`button[data-sort-add="${question.id}"]`).evaluateAll(elements => elements.map(element => element.getAttribute('data-token-index')));
  await page.reload();
  await ready(page, 15, 'sort');
  expect(await page.locator(`button[data-sort-add="${question.id}"]`).evaluateAll(elements => elements.map(element => element.getAttribute('data-token-index')))).toEqual(availableBefore);
});

test('quota and denied writes keep manual edits in the app session, export them after navigation and recover with retry', async ({ browser, baseURL }) => {
  for (const failure of ['QuotaExceededError', 'SecurityError']) {
    const context = await browser.newContext();
    try {
      const raw = envelope(seedData());
      await context.addInitScript(({ stateKey, sessionKey, raw, failure }) => {
        sessionStorage.setItem(sessionKey, '1');
        localStorage.setItem(stateKey, raw);
        const state = window as unknown as { __failHomeworkWrite: boolean };
        state.__failHomeworkWrite = true;
        const original = Storage.prototype.setItem;
        Storage.prototype.setItem = function (key, value) {
          if (this === localStorage && key === stateKey && state.__failHomeworkWrite) throw new DOMException('Injected storage failure', failure);
          return original.call(this, key, value);
        };
      }, { stateKey, sessionKey, raw, failure });
      const page = await context.newPage();
      await page.goto(`${baseURL}/#/homework?lesson=1&part=translation`);
      await ready(page, 1, 'translation');
      const id = bank.lessons[0]!.translation[0]!.id;
      const draft = `${failure} 中文草稿\n切换后仍在内存`;
      await page.locator(`textarea[data-answer-id="${id}"]`).fill(draft);
      await expect(page.locator('#homework-save-status')).toHaveAttribute('data-state', /^(unsaved|unavailable)$/);
      // A real write attempt, including the injected exception, must finish before checking the warning.
      await page.locator('#retry-homework-save').click();
      await expect(page.locator('#homework-save-status')).toHaveAttribute('data-state', /^(unsaved|unavailable)$/);
      expect(await page.evaluate(key => localStorage.getItem(key), stateKey)).toBe(raw);
      await page.locator('#feature-nav a[data-feature="progress"]').click();
      await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'ready');
      await page.locator('#open-data-manager').click();
      await expect(page.locator('#data-status')).toHaveAttribute('data-state', /^(unsaved|unavailable)$/);
      const backup = await downloadBackup(page, '#export-backup');
      expect(backup.data.homework.lessons['1'].translation.draft[id]).toBe(draft);
      expect(backup.data.homework.lessons['1'].translation.latest).toBeNull();
      await navigateFeature(page, 'homework', Number(await page.locator('#lesson-select').inputValue()));
      await ready(page, 1, 'choice');
      await part(page, 1, 'translation');
      await expect(page.locator(`textarea[data-answer-id="${id}"]`)).toHaveValue(draft);
      await page.evaluate(() => { (window as unknown as { __failHomeworkWrite: boolean }).__failHomeworkWrite = false; });
      await page.locator('#retry-homework-save').click();
      await saved(page);
      expect((await savedGroup(page, 1, 'translation')).draft[id]).toBe(draft);
    } finally { await context.close(); }
  }
});

test('a competing tab cannot overwrite the unsaved manual draft, which stays downloadable after the conflict', async ({ page, context }) => {
  const raw = envelope(seedData());
  await authenticate(page, raw);
  await page.goto('/#/homework?lesson=1&part=translation');
  await ready(page, 1, 'translation');
  const other = await context.newPage();
  await other.goto('/');
  await page.evaluate(async name => {
    const state = window as unknown as { __releaseHomeworkLock?: () => void; __heldHomeworkLock?: Promise<unknown> };
    let entered!: () => void;
    const started = new Promise<void>(resolve => { entered = resolve; });
    state.__heldHomeworkLock = navigator.locks.request(name, async () => {
      const held = new Promise<void>(resolve => { state.__releaseHomeworkLock = resolve; });
      entered();
      await held;
    });
    await started;
  }, writeLock);
  const id = bank.lessons[0]!.translation[0]!.id;
  const draft = '未保存的中文草稿\n不应被另一标签覆盖';
  let winnerRaw = '';
  try {
    await page.locator(`textarea[data-answer-id="${id}"]`).fill(draft);
    await expect(page.locator('#homework-save-status')).toHaveAttribute('data-state', 'saving');
    const winner = JSON.parse(raw);
    winner.revision++;
    winner.updatedAt++;
    winner.data.reading.lessons['1'] = { visited: true };
    winnerRaw = JSON.stringify(winner);
    await other.evaluate(({ key, raw }) => localStorage.setItem(key, raw), { key: stateKey, raw: winnerRaw });
    await expect(page.locator('#homework-save-status')).toHaveAttribute('data-state', 'conflict');
  } finally {
    await page.evaluate(async () => {
      const state = window as unknown as { __releaseHomeworkLock?: () => void; __heldHomeworkLock?: Promise<unknown> };
      state.__releaseHomeworkLock?.();
      await state.__heldHomeworkLock;
    });
  }
  await page.evaluate(name => navigator.locks.request(name, () => undefined), writeLock);
  expect(await page.evaluate(key => localStorage.getItem(key), stateKey)).toBe(winnerRaw);
  await expect(page.locator(`textarea[data-answer-id="${id}"]`)).toHaveValue(draft);
  const backup = await downloadBackup(page);
  expect(backup.data.homework.lessons['1'].translation.draft[id]).toBe(draft);
  expect(backup.data.reading.lessons).toEqual({});
  await expect(page.locator('#homework-save-status')).toHaveAttribute('data-state', 'conflict');
});
