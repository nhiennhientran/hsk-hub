import { mkdir, readFile } from 'node:fs/promises';
import { test, expect, type Locator, type Page } from '@playwright/test';
import { openLearningSettings } from './active-view-helpers.ts';

const stateKey = 'ran_hsk1_modular_v1';
const sessionKey = 'hsk_portal_unlocked_v2';
type Word = { senseId: string; lesson: number; zh: string; py: string; vi: string };
type Round = { id: string; lessons: number[]; senseIds: string[]; anchor: number; fingerprints: Record<string, string>; startedAt: number };
const catalog = JSON.parse(await readFile(new URL('../../content/stage3-catalog.json', import.meta.url), 'utf8')) as { vocabulary: Word[] };
const words = new Map(catalog.vocabulary.map(word => [word.senseId, word]));
const legacyPractice = JSON.parse(await readFile(new URL('../fixtures/migration/stage3.json', import.meta.url), 'utf8'));
const legacyHomework = JSON.parse(await readFile(new URL('../fixtures/migration/stage2.json', import.meta.url), 'utf8'));
const cards = (page: Page) => page.locator('#vocabulary-grid > [data-sense-id]');
const toggles = (page: Page) => page.locator('#vocabulary-grid .mixed-card-toggle');
const pageSize = (width: number) => width < 700 ? 1 : width < 1050 ? 4 : 6;
const lessonSenses = (lessons: number[]) => [...new Set(catalog.vocabulary.filter(word => lessons.includes(word.lesson)).map(word => word.senseId))];

async function authenticate(page: Page, data?: unknown): Promise<void> {
  await page.addInitScript(({ stateKey, sessionKey, data }) => {
    sessionStorage.setItem(sessionKey, '1');
    if (data && !localStorage.getItem(stateKey)) localStorage.setItem(stateKey, JSON.stringify({
      app: 'hsk1-modular', schema: 1, revision: 1, updatedAt: 1789891200000, data, recovery: null,
    }));
  }, { stateKey, sessionKey, data });
}
async function ready(page: Page, feature = 'vocabulary'): Promise<void> {
  await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'ready');
  await expect(page.locator('#module-host')).toHaveAttribute('data-feature', feature);
  await expect(page.locator('#vocabulary-module')).toBeVisible();
}
async function open(page: Page, width = 390, feature = 'vocabulary'): Promise<void> {
  await page.setViewportSize({ width, height: 900 });
  await authenticate(page);
  await page.goto(`/#/${feature}?lesson=1`);
  await ready(page, feature);
}
async function select(page: Page, lessons: number[]): Promise<void> {
  await openLearningSettings(page, 'vocabulary');
  await page.locator('#vocabulary-none').click();
  for (const lesson of lessons) await page.locator(`[data-vocabulary-lesson="${lesson}"]`).check();
}
async function start(page: Page, lessons: number[]): Promise<void> {
  await select(page, lessons);
  await page.locator('#vocabulary-start').click();
  await expect(cards(page).first()).toBeVisible();
  await expect(page.locator('#vocabulary-settings')).not.toHaveAttribute('open', '');
}
async function data(page: Page): Promise<any> {
  await expect(page.locator('#vocabulary-save-status')).toHaveAttribute('data-state', 'saved');
  return page.evaluate(key => JSON.parse(localStorage.getItem(key)!).data, stateKey);
}
async function round(page: Page): Promise<Round> {
  const saved = (await data(page)).mixedVocabulary;
  expect(saved?.schema).toBe(1);
  expect(saved?.round).not.toBeNull();
  return saved.round;
}
async function visibleIds(page: Page): Promise<string[]> {
  return cards(page).evaluateAll(nodes => nodes.map(node => node.getAttribute('data-sense-id')!));
}
async function expectFront(card: Locator): Promise<void> {
  const id = await card.getAttribute('data-sense-id');
  const word = words.get(id!);
  expect(word, `Catalog entry for ${id}`).toBeTruthy();
  await expect(card.locator('.mixed-card-toggle')).toHaveAttribute('aria-pressed', 'false');
  await expect(card.locator('.mixed-card-front')).toHaveText(word!.zh);
  await expect(card.locator('.mixed-card-back')).toHaveCount(0);
  // Absent answer nodes, rather than CSS-hidden answers, protect the accessible tree too.
  expect(await card.textContent()).not.toContain(word!.vi);
  expect(await card.ariaSnapshot()).not.toContain(word!.vi);
  await expect(card.locator('.mixed-card-toggle')).toHaveAccessibleName(word!.zh);
}
async function expectAllFronts(page: Page): Promise<void> {
  for (const card of await cards(page).all()) await expectFront(card);
}
async function expectSlice(page: Page, expected: Round, width: number): Promise<void> {
  const slice = expected.senseIds.slice(expected.anchor, expected.anchor + pageSize(width));
  await expect(cards(page)).toHaveCount(slice.length);
  expect(await visibleIds(page)).toEqual(slice);
  const numbers = (await page.locator('#vocabulary-position [lang="vi"]').innerText()).match(/\d+/g)?.map(Number);
  expect(numbers).toEqual(slice.length === 1 ? [expected.anchor + 1, expected.senseIds.length] : [expected.anchor + 1, expected.anchor + slice.length, expected.senseIds.length]);
}

for (const width of [320, 390, 768, 1440]) test(`mixed-card preview: direct review and responsive layout at ${width}px`, async ({ page }, testInfo) => {
  await open(page, width, 'review');
  await expect(page.locator('#review-module')).toHaveCount(0);
  await expect(page.locator('[data-vocabulary-lesson]')).toHaveCount(15);
  const folder = `.repro-output/mixed-preview/${testInfo.project.name}`;
  await mkdir(folder, { recursive: true });
  await page.screenshot({ path: `${folder}/${width}-selector.png`, fullPage: true });
  await start(page, [1, 15]);
  const active = await round(page);
  expect(active.lessons).toEqual([1, 15]);
  expect(active.senseIds.slice().sort()).toEqual(lessonSenses([1, 15]).sort());
  await expectSlice(page, active, width);
  await expectAllFronts(page);
  const boxes = await cards(page).evaluateAll(nodes => nodes.map(node => {
    const box = node.getBoundingClientRect(); return { x: Math.round(box.x), y: Math.round(box.y), width: box.width };
  }));
  expect(new Set(boxes.map(box => box.x)).size).toBe(width < 700 ? 1 : width < 1050 ? 2 : 3);
  expect(new Set(boxes.map(box => box.y)).size).toBe(width < 700 ? 1 : 2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  for (const control of await page.locator('#vocabulary-module button:visible').all()) {
    expect((await control.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }
  await testInfo.attach(`mixed-cards-front-${width}-${testInfo.project.name}`, { body: await page.screenshot({ path: `${folder}/${width}-front.png`, fullPage: true }), contentType: 'image/png' });
  await toggles(page).first().click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  await testInfo.attach(`mixed-cards-back-${width}-${testInfo.project.name}`, { body: await page.screenshot({ path: `${folder}/${width}-back.png`, fullPage: true }), contentType: 'image/png' });
});

test('all lessons show 344 sense cards and 319 written forms, deduplicate selection, and apply lesson drafts only on start', async ({ page }) => {
  await open(page);
  await select(page, []);
  await expect(page.locator('#vocabulary-start')).toBeDisabled();
  await expect(cards(page)).toHaveCount(0);
  await page.locator('#vocabulary-all').click();
  await page.locator('#vocabulary-all').click();
  await expect(page.locator('[data-vocabulary-lesson]:checked')).toHaveCount(15);
  await expect(page.locator('#vocabulary-available')).toContainText('344');
  await page.locator('#vocabulary-start').click();
  const all = await round(page);
  expect(all.senseIds).toHaveLength(344);
  expect(new Set(all.senseIds).size).toBe(344);
  expect(new Set(all.senseIds.map(id => words.get(id)!.zh)).size).toBe(319);
  expect(all.lessons).toEqual(Array.from({ length: 15 }, (_, index) => index + 1));
  await select(page, []);
  await expect(page.locator('#vocabulary-start')).toBeDisabled();
  expect(await round(page)).toEqual(all);
  expect(await visibleIds(page)).toEqual(all.senseIds.slice(0, 1));
  await page.locator('[data-vocabulary-lesson="15"]').check();
  await page.locator('[data-vocabulary-lesson="1"]').check();
  await page.locator('[data-vocabulary-lesson="1"]').uncheck();
  await page.locator('[data-vocabulary-lesson="1"]').check();
  expect(await round(page)).toEqual(all);
  await expect(page.locator('#vocabulary-available')).toContainText('33');
  await page.locator('#vocabulary-start').click();
  const subset = await round(page);
  expect(subset.lessons).toEqual([1, 15]);
  expect(subset.senseIds.slice().sort()).toEqual(lessonSenses([1, 15]).sort());
  expect(subset.anchor).toBe(0);
});

test('a card flips repeatedly with Enter and Space, retains focus and exposes no hidden answer on its front', async ({ page }) => {
  await open(page, 320);
  await start(page, [1]);
  const active = await round(page);
  const card = cards(page).first(), toggle = card.locator('.mixed-card-toggle');
  const word = words.get(active.senseIds[0]!)!;
  await expect(toggle).toHaveJSProperty('tagName', 'BUTTON');
  await expect(toggle).toHaveAccessibleName(word.zh);
  await expect(toggle).toHaveAttribute('aria-describedby', 'vocabulary-flip-hint');
  await expect(toggle.locator('button, a, input')).toHaveCount(0);
  await toggle.focus();
  for (const key of ['Enter', 'Space', 'Enter', 'Space']) {
    await expectFront(card);
    await page.keyboard.press(key);
    await expect(toggle).toBeFocused();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(card.locator('.mixed-card-front')).toHaveCount(0);
    await expect(card.locator('.mixed-card-back')).toContainText(word.py);
    await expect(card.locator('.mixed-card-back')).toContainText(word.vi);
    await expect(toggle).toHaveAccessibleName(`${word.py} ${word.vi}`);
    await page.keyboard.press(key);
    await expect(toggle).toBeFocused();
  }
  await expectFront(card);
  expect(await round(page)).toEqual(active);
});

test('desktop cards flip independently and their separate audio controls do not flip or advance another card', async ({ page }) => {
  await open(page, 1440);
  await start(page, [1]);
  const active = await round(page);
  const first = toggles(page).first(), last = toggles(page).last();
  await expect(first).toHaveAccessibleName(words.get(active.senseIds[0]!)!.zh);
  await expect(last).toHaveAccessibleName(words.get(active.senseIds[5]!)!.zh);
  await first.click();
  await last.click();
  await expect(first).toHaveAttribute('aria-pressed', 'true');
  await expect(last).toHaveAttribute('aria-pressed', 'true');
  for (let index = 1; index < 5; index++) await expectFront(cards(page).nth(index));
  const audio = cards(page).first().locator('.mixed-card-audio [data-mixed-play]');
  await expect(audio).toHaveCount(1);
  await expect(audio).toHaveJSProperty('tagName', 'BUTTON');
  expect(await audio.evaluate(node => !!node.closest('.mixed-card-toggle'))).toBe(false);
  await audio.click();
  await expect(first).toHaveAttribute('aria-pressed', 'true');
  await expect(last).toHaveAttribute('aria-pressed', 'true');
  expect(await visibleIds(page)).toEqual(active.senseIds.slice(0, 6));
  expect(await round(page)).toEqual(active);
  await first.click();
  await expectFront(cards(page).first());
  await expect(last).toHaveAttribute('aria-pressed', 'true');
});

test('mobile previous and next skip freely, return to fronts and never write mastery or legacy review data', async ({ page }) => {
  await open(page, 390);
  await start(page, [1]);
  const initial = await data(page), active = initial.mixedVocabulary.round as Round;
  await expect(page.locator('#vocabulary-prev')).toBeDisabled();
  await toggles(page).first().click();
  await page.locator('#vocabulary-next').click();
  await expectSlice(page, { ...active, anchor: 1 }, 390);
  await expectAllFronts(page);
  await page.locator('#vocabulary-prev').click();
  await expectSlice(page, active, 390);
  await expectAllFronts(page);
  for (let anchor = 1; anchor < active.senseIds.length; anchor++) {
    await page.locator('#vocabulary-next').click();
    await expectSlice(page, { ...active, anchor }, 390);
  }
  await expect(page.locator('#vocabulary-next')).toBeDisabled();
  expect((await data(page)).practice).toEqual(initial.practice);
  expect((await data(page)).reading).toEqual(initial.reading);
  expect((await round(page)).senseIds).toEqual(active.senseIds);
  await expect(page.locator('#vocabulary-good, #vocabulary-hard, #vocabulary-again')).toHaveCount(0);
});

test('resize preserves the exact anchor and shuffled order, resets fronts and uses the new page size on next', async ({ page }) => {
  await open(page, 390);
  await start(page, [1, 15]);
  const active = await round(page);
  for (let index = 0; index < 7; index++) await page.locator('#vocabulary-next').click();
  for (const width of [320, 390, 768, 1440, 1049, 1050, 699, 700, 390]) {
    await toggles(page).first().click();
    await page.setViewportSize({ width, height: 900 });
    await expectSlice(page, { ...active, anchor: 7 }, width);
    await expectAllFronts(page);
    expect(await round(page)).toEqual({ ...active, anchor: 7 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(cards(page)).toHaveCount(6);
  await page.locator('#vocabulary-next').click();
  await expectSlice(page, { ...active, anchor: 13 }, 1440);
  await page.setViewportSize({ width: 390, height: 900 });
  await expectSlice(page, { ...active, anchor: 13 }, 390);
  await page.locator('#vocabulary-next').click();
  await expectSlice(page, { ...active, anchor: 14 }, 390);
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(cards(page)).toHaveCount(6);
  await toggles(page).last().focus();
  await page.setViewportSize({ width: 320, height: 900 });
  await expectSlice(page, { ...active, anchor: 14 }, 320);
  await expect(toggles(page).first()).toBeFocused();
  await expectAllFronts(page);
});

test('reload, route aliases and browser back/forward keep order and anchor while discarding flips and unstarted lesson drafts', async ({ page }) => {
  await open(page, 768);
  await start(page, [1, 15]);
  await page.locator('#vocabulary-next').click();
  const active = await round(page);
  expect(active.anchor).toBe(4);
  await toggles(page).first().click();
  await select(page, [2]);
  expect(await round(page)).toEqual(active);
  await page.reload();
  await ready(page);
  await expectSlice(page, active, 768);
  await expectAllFronts(page);
  await expect(page.locator('#vocabulary-settings')).not.toHaveAttribute('open', '');
  await openLearningSettings(page, 'vocabulary');
  expect(await page.locator('[data-vocabulary-lesson]:checked').evaluateAll(nodes => nodes.map(node => Number(node.getAttribute('data-vocabulary-lesson'))))).toEqual([1, 15]);
  await page.locator('#vocabulary-settings > summary').click();
  await toggles(page).last().click();
  await page.locator('#feature-nav [data-feature="home"]').click();
  await expect(page.locator('#home-module')).toBeVisible();
  await page.goBack();
  await ready(page);
  await expectSlice(page, active, 768);
  await expectAllFronts(page);
  await page.goForward();
  await expect(page.locator('#home-module')).toBeVisible();
  await page.goBack();
  await ready(page);
  await page.locator('#feature-nav [data-feature="review"]').click();
  await ready(page, 'review');
  await expectSlice(page, active, 768);
  await expectAllFronts(page);
  expect(await round(page)).toEqual(active);
});

test('explicit reshuffle restarts the applied scope without applying a different lesson draft', async ({ page }) => {
  await open(page, 1440);
  await start(page, [1, 15]);
  await page.locator('#vocabulary-next').click();
  const before = await round(page);
  await toggles(page).first().click();
  await select(page, [2]);
  await page.locator('#vocabulary-reshuffle').click();
  const after = await round(page);
  expect(after.lessons).toEqual(before.lessons);
  expect(after.senseIds.slice().sort()).toEqual(before.senseIds.slice().sort());
  expect(after.senseIds).not.toEqual(before.senseIds);
  expect(after.anchor).toBe(0);
  await expectAllFronts(page);
});

for (const filter of ['all', 'due']) test(`a legacy ${filter}/reverse round stays historical and is never masqueraded as a new mixed round`, async ({ page }) => {
  const practice = structuredClone(legacyPractice);
  practice.preferences.vocabularyFilter = filter;
  practice.cards.review.filter = filter;
  const seed = { reading: { lessons: { '1': { visited: true, complete: true } }, mastered: { '1-你好': true }, modules: {} },
    homework: structuredClone(legacyHomework), practice, navigation: null, legacyRaw: {} };
  await page.setViewportSize({ width: 390, height: 900 });
  await authenticate(page, seed);
  await page.goto('/#/review?lesson=1');
  await ready(page, 'review');
  await expect(cards(page)).toHaveCount(0);
  expect((await data(page)).practice).toEqual(seed.practice);
  await start(page, [1, 15]);
  await toggles(page).first().click();
  await page.locator('#vocabulary-next').click();
  const active = await round(page);
  expect(active.senseIds.slice().sort()).toEqual(lessonSenses([1, 15]).sort());
  await page.reload();
  await ready(page, 'review');
  await expectAllFronts(page);
  expect((await data(page)).practice).toEqual(seed.practice);
  expect((await data(page)).reading).toEqual(seed.reading);
  expect((await data(page)).homework).toEqual(seed.homework);
});

test('a failed save keeps the active in-memory page usable and retries without losing the saved queue', async ({ page }) => {
  await open(page, 390);
  await start(page, [1, 15]);
  const before = await round(page);
  const savedRaw = await page.evaluate(key => localStorage.getItem(key), stateKey);
  await page.evaluate(key => {
    const original = Storage.prototype.setItem;
    (window as unknown as { restoreMixedWrite: () => void }).restoreMixedWrite = () => { Storage.prototype.setItem = original; };
    Storage.prototype.setItem = function (name, value) {
      if (this === localStorage && name === key) throw new DOMException('Full', 'QuotaExceededError');
      original.call(this, name, value);
    };
  }, stateKey);
  await page.locator('#vocabulary-next').click();
  await expect(page.locator('#vocabulary-save-status')).toHaveAttribute('data-state', 'unsaved');
  await expectSlice(page, { ...before, anchor: 1 }, 390);
  await toggles(page).first().click();
  await expect(toggles(page).first()).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(key => localStorage.getItem(key), stateKey)).toBe(savedRaw);
  await expect(page.locator('#vocabulary-retry-save')).toBeVisible();
  await page.evaluate(() => (window as unknown as { restoreMixedWrite: () => void }).restoreMixedWrite());
  await page.locator('#vocabulary-retry-save').click();
  expect(await round(page)).toEqual({ ...before, anchor: 1 });
  await page.reload();
  await ready(page);
  await expectSlice(page, { ...before, anchor: 1 }, 390);
  await expectAllFronts(page);
});

test('all 344 shuffled senses remain reachable once with exact Hanzi fronts and pinyin/Vietnamese backs', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  await open(page, 1440);
  await openLearningSettings(page, 'vocabulary');
  await page.locator('#vocabulary-all').click();
  await page.locator('#vocabulary-start').click();
  const active = await round(page), seen: string[] = [];
  for (let anchor = 0; anchor < active.senseIds.length; anchor += 6) {
    await expectSlice(page, { ...active, anchor }, 1440);
    for (const card of await cards(page).all()) {
      const id = (await card.getAttribute('data-sense-id'))!, word = words.get(id)!;
      await expect(card.locator('.mixed-card-front')).toHaveText(word.zh);
      await expect(card.locator('.mixed-card-back')).toHaveCount(0);
      await card.locator('.mixed-card-toggle').click();
      await expect(card.locator('.mixed-card-back')).toContainText(word.py);
      await expect(card.locator('.mixed-card-back')).toContainText(word.vi);
      seen.push(id);
    }
    if (anchor + 6 < active.senseIds.length) await page.locator('#vocabulary-next').click();
  }
  expect(seen).toEqual(active.senseIds);
  expect(new Set(seen).size).toBe(344);
  expect(new Set(seen.map(id => words.get(id)!.zh)).size).toBe(319);
  await expect(page.locator('#vocabulary-next')).toBeDisabled();
  await testInfo.attach('all-mixed-senses', { body: Buffer.from(JSON.stringify({ seen, forms: 319 }, null, 2)), contentType: 'application/json' });
});
