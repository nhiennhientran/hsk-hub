import { readFile } from 'node:fs/promises';
import { test, expect, type Page } from '@playwright/test';
import homework from '../../src/domain/homework/engine.js';
import review from '../../src/domain/practice/engine.js';
import { practiceQuestions } from '../../src/domain/textbook/practice.ts';

const book = JSON.parse(await readFile(new URL('../../content/textbook.json', import.meta.url), 'utf8')) as { lessons: any[] };
const bank = JSON.parse(await readFile(new URL('../../content/stage2-bank.json', import.meta.url), 'utf8')) as { lessons: any[] };
const stateKey = 'ran_hsk1_modular_v1';
const sessionKey = 'hsk_portal_unlocked_v2';
const sections = ['vocab', 'text', 'grammar', 'hanzi', 'practice'] as const;

async function authenticate(page: Page, data?: any): Promise<void> {
  await page.addInitScript(({ stateKey, sessionKey, data }) => {
    sessionStorage.setItem(sessionKey, '1');
    if (data && !localStorage.getItem(stateKey)) localStorage.setItem(stateKey, JSON.stringify({ app: 'hsk1-modular', schema: 1, revision: 1, updatedAt: 1789891200000, data, recovery: null }));
  }, { stateKey, sessionKey, data });
}
async function ready(page: Page, lesson: number, section: string): Promise<void> {
  await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'ready');
  await expect(page.locator('#module-host')).toHaveAttribute('data-feature', 'textbook');
  await expect(page.locator('#module-host')).toHaveAttribute('data-lesson', String(lesson));
  await expect(page.locator(`[data-textbook-sections] a[data-section="${section}"]`)).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('#reading-complete')).toBeEnabled();
}
async function section(page: Page, lesson: number, value: string): Promise<void> {
  await page.locator(`[data-textbook-sections] a[data-section="${value}"]`).click();
  await ready(page, lesson, value);
}
async function data(page: Page): Promise<any> {
  await expect(page.locator('#reading-save-status')).toHaveAttribute('data-state', 'saved');
  return page.evaluate(key => JSON.parse(localStorage.getItem(key)!).data, stateKey);
}

for (const start of [1, 6, 11]) {
  test(`all five textbook sections in lessons ${start}–${start + 4} render the frozen vocabulary, scenes, language and Hanzi`, async ({ page }) => {
    test.setTimeout(60_000);
    await authenticate(page);
    await page.goto(`/#/textbook?lesson=${start}&section=vocab`);
    let vocabulary = 0; let scenes = 0; let language = 0;
    for (let lesson = start; lesson < start + 5; lesson++) {
      const row = book.lessons.find(item => item.id === lesson)!;
      if (lesson !== start) await page.locator('#lesson-select').selectOption(String(lesson));
      await ready(page, lesson, 'vocab');
      await expect(page.locator('[data-textbook-sections] a')).toHaveCount(5);
      await expect(page.locator('.vocab-card[data-word-id]')).toHaveCount(row.vocab.length);
      for (const word of row.vocab) {
        const card = page.locator(`.vocab-card[data-word-id="${word.id}"]`);
        await expect(card).toContainText(word.zh);
        expect(await card.textContent()).toContain(word.py);
        expect(await card.textContent()).toContain(word.vn);
        expect(await card.textContent()).toContain(word.posLabel);
      }
      vocabulary += row.vocab.length;
      await section(page, lesson, 'text');
      await expect(page.locator('[data-scene-tab]')).toHaveCount(row.scenes.length);
      for (const [sceneIndex, scene] of row.scenes.entries()) {
        await page.locator('#scene-select').selectOption(String(sceneIndex));
        const view = page.locator(`[data-scene-id="${scene.id}"]`);
        await expect(view).toBeVisible();
        await expect(view.locator('[data-line-id]')).toHaveCount(scene.lines.length);
        for (const line of scene.lines) {
          const shown = view.locator(`[data-line-id="${line.id}"]`);
          for (const value of [line.s, line.zh, line.py, line.vn]) await expect(shown).toContainText(value);
          await expect(shown.locator('[data-line-audio]')).toBeEnabled();
        }
        await expect(view.locator('[data-scene-audio]')).toBeEnabled();
      }
      scenes += row.scenes.length;
      await section(page, lesson, 'grammar');
      const items = [...row.grammar, ...row.phonetics];
      await expect(page.locator('[data-language-item]')).toHaveCount(items.length);
      for (const item of items) {
        const shown = page.locator(`[data-language-item="${item.id}"]`);
        for (const value of [item.title, item.vn_title, item.desc, item.structure].filter(Boolean)) await expect(shown).toContainText(value);
        await expect(shown.locator('[data-language-example]')).toHaveCount(item.examples.length);
        for (const example of item.examples) for (const value of [example.zh, example.py, example.vn]) await expect(shown).toContainText(value);
      }
      language += items.length;
      await section(page, lesson, 'hanzi');
      for (const field of ['strokes', 'order', 'structure', 'radicals']) if (row.hanzi[field]) await expect(page.locator('#textbook-module')).toContainText(row.hanzi[field]);
      for (const char of [...new Set(row.hanzi.chars.match(/\p{Script=Han}/gu))]) await expect(page.locator(`[data-hanzi-char="${char}"]`)).toHaveCount(1);
      await section(page, lesson, 'practice');
      await expect(page.locator('[data-practice-question]')).toHaveCount(practiceQuestions(row).basic.length);
      await expect(page.locator('[data-practice-tier="advanced"]')).toBeEnabled();
      await section(page, lesson, 'vocab');
    }
    const rows = book.lessons.slice(start - 1, start + 4);
    expect(vocabulary).toBe(rows.reduce((count, row) => count + row.vocab.length, 0));
    expect(scenes).toBe(15);
    expect(language).toBe(rows.reduce((count, row) => count + row.grammar.length + row.phonetics.length, 0));
    // These corpus counts use distinct textbook and sense-card units.
    expect(book.lessons.reduce((count, row) => count + row.vocab.length, 0)).toBe(342);
    expect(book.lessons.reduce((count, row) => count + row.scenes.length, 0)).toBe(45);
    expect(book.lessons.reduce((count, row) => count + row.grammar.length, 0)).toBe(40);
    expect(book.lessons.reduce((count, row) => count + row.phonetics.length, 0)).toBe(3);
  });
}

test('vocabulary search, keyboard and all-card flips, saved stars, detail navigation and character linking work', async ({ page }) => {
  await authenticate(page);
  await page.goto('/#/textbook?lesson=10&section=vocab');
  await ready(page, 10, 'vocab');
  const words = book.lessons[9]!.vocab;
  const word = words[0]!;
  const flip = page.locator(`[data-vocab-flip="${word.id}"]`);
  const card = page.locator(`.vocab-card[data-word-id="${word.id}"]`);
  await card.focus();
  await page.keyboard.press('Enter');
  await expect(flip).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Space');
  await expect(flip).toHaveAttribute('aria-pressed', 'false');
  await page.locator('#vocab-flip-all').click();
  for (const item of words) await expect(page.locator(`[data-vocab-flip="${item.id}"]`)).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#vocab-flip-all').click();
  for (const item of words) await expect(page.locator(`[data-vocab-flip="${item.id}"]`)).toHaveAttribute('aria-pressed', 'false');
  for (const query of ['杯子', 'cái cốc', 'beizi']) {
    await page.locator('#vocab-search').fill(query);
    await expect(page.locator(`.vocab-card[data-word-id="${word.id}"]`)).toBeVisible();
    await expect(page.locator('.vocab-card:visible')).toHaveCount(1);
  }
  await page.locator('#vocab-search').fill('不存在的词 xyzxyz');
  await expect(page.locator('.vocab-card:visible')).toHaveCount(0);
  await page.locator('#vocab-search').fill('');
  await page.locator(`[data-vocab-star="${word.id}"]`).click();
  await expect(page.locator(`[data-vocab-star="${word.id}"]`)).toHaveAttribute('aria-pressed', 'true');
  const saved = await data(page);
  expect(Object.values(saved.reading.mastered)).toContain(true);
  await page.reload();
  await ready(page, 10, 'vocab');
  await expect(page.locator(`[data-vocab-star="${word.id}"]`)).toHaveAttribute('aria-pressed', 'true');
  await page.locator(`[data-vocab-detail="${word.id}"]`).click();
  await expect(page.locator('#word-detail')).toBeVisible();
  for (const value of [word.zh, word.py, word.vn, word.posLabel]) await expect(page.locator('#word-detail')).toContainText(value);
  const chars = [...new Set(word.zh.match(/\p{Script=Han}/gu))] as string[];
  for (const char of chars) await expect(page.locator(`#word-detail [data-hanzi-char="${char}"]`)).toBeVisible();
  await page.locator('#word-next').click();
  await expect(page.locator('#word-detail')).toContainText(words[1]!.zh);
  await page.locator('#word-prev').click();
  await expect(page.locator('#word-detail')).toContainText(word.zh);
  if (chars.length > 1) {
    await page.locator(`#word-detail [data-hanzi-char="${chars[1]}"]`).click();
    await expect(page.locator(`#word-detail [data-hanzi-char="${chars[1]}"]`)).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#word-detail [data-hanzi-canvas]')).toHaveAttribute('aria-label', `Bảng viết chữ ${chars[1]}`);
  }
  await page.locator('#word-close').click();
  await expect(page.locator('#word-detail')).toBeHidden();
});

test('reading visit, section marks and completion survive reload independently of the first homework submission', async ({ page }) => {
  const state = homework.blank();
  const choice = bank.lessons[0]!.choice;
  homework.group(state, 1, 'choice').draft = Object.fromEntries(choice.map((question: any) => [question.id, question.answer]));
  homework.submit(state, 1, 'choice', choice, 1789891200000);
  const first = structuredClone(homework.group(state, 1, 'choice').first);
  await authenticate(page, { reading: { lessons: {}, mastered: {}, modules: {} }, homework: state, practice: review.blank(), navigation: null, legacyRaw: {} });
  await page.goto('/#/textbook?lesson=1&section=text');
  await ready(page, 1, 'text');
  await expect(page.locator('#reading-complete')).not.toBeChecked();
  let current = await data(page);
  expect(current.reading.lessons['1']).toMatchObject({ visited: true });
  expect(current.reading.lessons['1'].complete).not.toBe(true);
  expect(current.reading.modules['hsk1:1'].modules).toEqual(['text']);
  await expect(page.locator('#reading-section-status')).toContainText('Đã mở 1 / 5');
  await page.locator('#reading-complete').check();
  current = await data(page);
  expect(current.reading.lessons['1']).toMatchObject({ visited: true, complete: true });
  expect(current.reading.modules['hsk1:1'].modules).toEqual(['text']);
  expect(current.homework.lessons['1'].choice.first).toEqual(first);
  await page.reload();
  await ready(page, 1, 'text');
  await expect(page.locator('#reading-complete')).toBeChecked();
  await expect(page.locator('#reading-section-status')).toContainText('Đã mở 1 / 5');
  await section(page, 1, 'grammar');
  await expect(page.locator('#reading-section-status')).toContainText('Đã mở 2 / 5');
  await expect(page.locator('#reading-complete')).toBeChecked();
  await page.locator('#reading-complete').uncheck();
  current = await data(page);
  expect(current.reading.lessons['1'].complete).toBe(false);
  expect(current.homework.lessons['1'].choice.first).toEqual(first);
});

test('all retained and restored practice questions in fifteen lessons submit through both tiers and reset independently', async ({ page }) => {
  test.setTimeout(60_000);
  await authenticate(page);
  await page.goto('/#/textbook?lesson=1&section=practice');
  let answered = 0;
  for (let lesson = 1; lesson <= 15; lesson++) {
    if (lesson !== 1) await page.locator('#lesson-select').selectOption(String(lesson));
    await ready(page, lesson, 'practice');
    const questions = practiceQuestions(book.lessons[lesson - 1]!);
    for (const tier of ['basic', 'advanced'] as const) {
      await page.locator(`[data-practice-tier="${tier}"]`).click();
      const rows = questions[tier];
      await expect(page.locator('[data-practice-question]')).toHaveCount(rows.length);
      if (lesson === 1 && tier === 'basic') {
        await page.locator('[data-practice-action="submit"]').click();
        await expect(page.locator('[data-practice-score]')).toContainText('0/7');
        await expect(page.locator('[data-practice-feedback="missing"]')).toHaveCount(7);
        await page.locator('[data-practice-action="reset"]').click();
      }
      for (const [index, row] of rows.entries()) {
        const card = page.locator(`[data-practice-question="${index}"]`);
        await expect(card).toContainText(row.prompt);
        await card.locator(`[data-practice-option="${row.options.indexOf(row.answer)}"]`).click();
      }
      await page.locator('[data-practice-action="submit"]').click();
      await expect(page.locator('[data-practice-score]')).toContainText(`${rows.length}/${rows.length}`);
      await expect(page.locator('[data-practice-feedback]')).toHaveCount(rows.length);
      answered += rows.length;
      if (lesson === 1 && tier === 'basic') continue;
      await page.locator('[data-practice-action="reset"]').click();
      await expect(page.locator('[data-practice-feedback]')).toHaveCount(0);
      await expect(page.locator('[data-practice-score]')).toContainText('Chọn đáp án');
      if (lesson === 1 && tier === 'advanced') {
        await page.locator('[data-practice-tier="basic"]').click();
        await expect(page.locator('[data-practice-score]')).toContainText('7/7');
        await expect(page.locator('[data-practice-feedback="correct"]')).toHaveCount(7);
        await page.locator('[data-practice-action="reset"]').click();
        await page.locator('[data-practice-tier="advanced"]').click();
        await expect(page.locator('[data-practice-score]')).toContainText('Chọn đáp án');
      }
    }
  }
  expect(answered).toBe(160);
});

test('Hanzi renders strokes, animates, accepts pen practice, resets and cancels a late character request when leaving', async ({ page }) => {
  await authenticate(page);
  await page.goto('/#/textbook?lesson=1&section=hanzi');
  await ready(page, 1, 'hanzi');
  await expect(page.locator('[data-hanzi-stroke-count]')).not.toHaveText('');
  await expect(page.locator('[data-hanzi-strokes] svg')).toHaveCount(1);
  await page.locator('[data-hanzi-action="animate"]').click();
  await expect(page.locator('[data-hanzi-mode="animation"]')).toHaveCount(1);
  await page.locator('[data-hanzi-action="practice"]').click();
  await expect(page.locator('[data-hanzi-mode="practice"]')).toHaveCount(1);
  const canvas = page.locator('[data-hanzi-canvas] svg').first();
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + box.width * .2, box.y + box.height * .5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * .8, box.y + box.height * .5, { steps: 8 });
  await page.mouse.up();
  await expect(page.locator('[data-hanzi-status]')).not.toHaveText('');
  await page.locator('[data-hanzi-action="reset"]').click();
  await expect(page.locator('[data-hanzi-mode="display"]')).toHaveCount(1);
  let blocked: any;
  await page.route('**/course-assets/hanzi/*.json*', route => { blocked = route; });
  await page.locator('[data-hanzi-char="二"]').click();
  await expect.poll(() => Boolean(blocked)).toBe(true);
  await section(page, 1, 'vocab');
  await blocked.abort('failed');
  await expect(page.locator('[data-hanzi-canvas]')).toHaveCount(0);
  await expect(page.locator('#vocab-search')).toBeEnabled();
});

test('a failed stroke-data request offers retry without leaving the lesson or damaging reading state', async ({ page }) => {
  await authenticate(page);
  let failed = false;
  await page.route('**/course-assets/hanzi/*.json*', async route => {
    if (!failed) { failed = true; await route.fulfill({ status: 404, body: 'Missing character', contentType: 'text/plain' }); }
    else await route.continue();
  });
  await page.goto('/#/textbook?lesson=15&section=hanzi');
  await ready(page, 15, 'hanzi');
  await expect(page.locator('[data-hanzi-action="retry"]')).toBeVisible();
  const route = page.url();
  await page.locator('[data-hanzi-action="retry"]').click();
  await expect(page.locator('[data-hanzi-stroke-count]')).not.toHaveText('');
  await expect(page.locator('[data-hanzi-canvas] svg')).toBeVisible();
  expect(page.url()).toBe(route);
  expect((await data(page)).reading.lessons['15']).toMatchObject({ visited: true });
});

test('textbook content and controls remain readable at four viewport widths with representative screenshots', async ({ page }, testInfo) => {
  await authenticate(page);
  await page.goto('/#/textbook?lesson=10&section=vocab');
  await ready(page, 10, 'vocab');
  const id = book.lessons[9]!.vocab[0]!.id;
  for (const width of [320, 390, 768, 1104]) {
    await page.setViewportSize({ width, height: 800 });
    for (const value of sections) {
      await section(page, 10, value);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${value} overflow at ${width}px`).toBe(true);
      await expect(page.locator('#module-host h1')).toBeVisible();
      await expect(page.locator('#reading-complete')).toBeVisible();
    }
    await section(page, 10, 'vocab');
    await page.locator(`[data-vocab-detail="${id}"]`).click();
    await expect(page.locator('#word-detail')).toBeVisible();
    await expect(page.locator('#word-detail [data-hanzi-canvas] svg')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `detail overflow at ${width}px`).toBe(true);
    const path = testInfo.outputPath(`textbook-detail-${width}.png`);
    await page.screenshot({ path, fullPage: true });
    await testInfo.attach(`textbook detail ${width}px`, { path, contentType: 'image/png' });
    await page.locator('#word-close').click();
  }
});
