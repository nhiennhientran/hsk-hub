import { readFile } from 'node:fs/promises';
import { test, expect, type Page } from '@playwright/test';
import homework from '../../src/domain/homework/engine.js';
import practice from '../../src/domain/practice/engine.js';

const key = 'ran_hsk1_modular_v1';
const auth = 'hsk_portal_unlocked_v2';
const lock = 'ran-hsk1-modular-write';
const bank = JSON.parse(await readFile(new URL('../../content/stage2-bank.json', import.meta.url), 'utf8'));
const question = bank.lessons[9].choice[0];
function initial(): any {
  return { app: 'hsk1-modular', schema: 1, revision: 1, updatedAt: 1789891200000,
    data: { reading: { lessons: { '7': { visited: true, complete: true } }, mastered: {}, modules: {} },
      homework: homework.blank(), practice: practice.blank(), navigation: null, legacyRaw: {} }, recovery: null };
}
async function ready(page: Page, feature = 'homework'): Promise<void> {
  await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'ready');
  await expect(page.locator('#module-host')).toHaveAttribute('data-feature', feature);
}
async function download(page: Page, selector = '#export-homework-backup'): Promise<any> {
  const pending = page.waitForEvent('download'); await page.locator(selector).click();
  const file = await pending; expect(await file.failure()).toBeNull();
  const stream = await file.createReadStream(); expect(stream).not.toBeNull();
  const chunks: Buffer[] = []; for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

test('denied localStorage reads preserve the inaccessible original and keep a new draft exportable across modules', async ({ page }) => {
  const raw = JSON.stringify(initial());
  await page.addInitScript(({ key, auth, raw }) => {
    sessionStorage.setItem(auth, '1'); localStorage.setItem(key, raw);
    const state = window as unknown as { __denyReads: boolean }; state.__denyReads = true;
    const get = Storage.prototype.getItem;
    Storage.prototype.getItem = function (name) {
      if (this === localStorage && state.__denyReads) throw new DOMException('Storage reads denied', 'SecurityError');
      return get.call(this, name);
    };
  }, { key, auth, raw });
  await page.goto('/#/homework?lesson=10&part=choice'); await ready(page);
  await expect(page.locator('#homework-save-status')).toHaveAttribute('data-state', 'unavailable');
  await page.locator(`input[data-answer-id="${question.id}"][value="0"]`).check();
  await expect(page.locator('#retry-homework-save')).toBeDisabled();
  const backup = await download(page);
  expect(backup.data.homework.lessons['10'].choice.draft[question.id]).toBe(0);
  const pendingExit = page.waitForEvent('dialog');
  await page.evaluate(() => { setTimeout(() => location.reload(), 0); });
  const exit = await pendingExit; expect(exit.type()).toBe('beforeunload');
  await exit.dismiss();
  await expect(page.locator(`input[data-answer-id="${question.id}"][value="0"]`)).toBeChecked();
  await expect(page.locator('#homework-save-status')).toHaveAttribute('data-state', 'unavailable');
  await page.locator('#feature-nav a[data-feature="progress"]').click(); await ready(page, 'progress');
  await page.locator('#open-data-manager').click();
  await expect(page.locator('#data-status')).toHaveAttribute('data-state', 'unavailable');
  expect((await download(page, '#export-backup')).data).toEqual(backup.data);
  await page.evaluate(() => { (window as unknown as { __denyReads: boolean }).__denyReads = false; });
  expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe(raw);
  // Explicit reload is the recovery action after the learner has exported the unsaved draft.
  await page.locator('#reload-data').click();
  await expect(page.locator('#data-status')).toHaveAttribute('data-state', 'saved');
  expect((await download(page, '#export-backup')).data).toEqual(initial().data);
});

test('two actual homework tabs serialize simultaneous edits without silently overwriting the winner or the losing draft', async ({ page, context }) => {
  const raw = JSON.stringify(initial());
  await context.addInitScript(({ auth, key, raw }) => {
    sessionStorage.setItem(auth, '1'); if (!localStorage.getItem(key)) localStorage.setItem(key, raw);
  }, { auth, key, raw });
  await page.goto('/#/homework?lesson=10&part=choice'); await ready(page);
  const other = await context.newPage(); await other.goto('/#/homework?lesson=10&part=choice'); await ready(other);
  await page.evaluate(async name => {
    const state = window as unknown as { __release?: () => void; __held?: Promise<unknown> };
    let entered!: () => void; const started = new Promise<void>(resolve => { entered = resolve; });
    state.__held = navigator.locks.request(name, async () => { const held = new Promise<void>(resolve => { state.__release = resolve; }); entered(); await held; });
    await started;
  }, lock);
  try {
    await page.locator(`input[data-answer-id="${question.id}"][value="0"]`).check();
    await other.locator(`input[data-answer-id="${question.id}"][value="1"]`).check();
    await expect(page.locator('#homework-save-status')).toHaveAttribute('data-state', 'saving');
    await expect(other.locator('#homework-save-status')).toHaveAttribute('data-state', 'saving');
  } finally {
    await page.evaluate(async () => { const state = window as unknown as { __release?: () => void; __held?: Promise<unknown> }; state.__release?.(); await state.__held; });
  }
  await page.evaluate(name => navigator.locks.request(name, () => undefined), lock);
  const statuses = await Promise.all([page, other].map(tab => tab.locator('#homework-save-status').getAttribute('data-state')));
  expect(statuses.sort()).toEqual(['conflict', 'saved']);
  const original = initial().data;
  const stored = JSON.parse((await page.evaluate(key => localStorage.getItem(key), key))!);
  expect(stored.revision).toBe(2); expect(stored.data.reading).toEqual(original.reading); expect(stored.data.practice).toEqual(original.practice);
  for (const [tab, value] of [[page, 0], [other, 1]] as const) {
    await expect(tab.locator(`input[data-answer-id="${question.id}"][value="${value}"]`)).toBeChecked();
    const backup = await download(tab); expect(backup.data.homework.lessons['10'].choice.draft[question.id]).toBe(value);
    expect(backup.data.reading).toEqual(original.reading); expect(backup.data.practice).toEqual(original.practice);
  }
  expect(await other.evaluate(key => localStorage.getItem(key), key)).toBe(JSON.stringify(stored));
});

test('an immediate refresh during a held save warns before discarding, retains the final answer on cancel, then reloads after saving', async ({ page }) => {
  await page.addInitScript(auth => sessionStorage.setItem(auth, '1'), auth);
  await page.goto('/#/homework?lesson=10&part=choice'); await ready(page);
  await page.evaluate(async name => {
    const state = window as unknown as { __release?: () => void; __held?: Promise<unknown> };
    let entered!: () => void; const started = new Promise<void>(resolve => { entered = resolve; });
    state.__held = navigator.locks.request(name, async () => { const held = new Promise<void>(resolve => { state.__release = resolve; }); entered(); await held; });
    await started;
  }, lock);
  try {
    await page.locator(`input[data-answer-id="${question.id}"][value="2"]`).check();
    await page.locator('#homework-module').evaluate(node => { (node as HTMLElement).dataset.exitIdentity = 'retained'; });
    const pending = page.waitForEvent('dialog');
    await page.evaluate(() => { setTimeout(() => location.reload(), 0); });
    const dialog = await pending; expect(dialog.type()).toBe('beforeunload');
    await dialog.dismiss();
    await expect(page.locator('#homework-module')).toHaveAttribute('data-exit-identity', 'retained');
    await expect(page.locator(`input[data-answer-id="${question.id}"][value="2"]`)).toBeChecked();
    expect(await page.evaluate(key => localStorage.getItem(key), key)).toBeNull();
    expect((await download(page)).data.homework.lessons['10'].choice.draft[question.id]).toBe(2);
  } finally {
    await page.evaluate(async () => { const state = window as unknown as { __release?: () => void; __held?: Promise<unknown> }; state.__release?.(); await state.__held; });
  }
  await expect(page.locator('#homework-save-status')).toHaveAttribute('data-state', 'saved');
  let extraDialogs = 0; page.on('dialog', dialog => { extraDialogs++; void dialog.dismiss(); });
  await page.reload(); await ready(page);
  expect(extraDialogs).toBe(0);
  await expect(page.locator(`input[data-answer-id="${question.id}"][value="2"]`)).toBeChecked();
  await expect(page.locator('#homework-save-status')).toHaveAttribute('data-state', 'saved');
});

test('rapid lesson switches during slow loading render only the newest lesson and ignore retired responses', async ({ page }) => {
  const pending: import('@playwright/test').Route[] = [];
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(auth => sessionStorage.setItem(auth, '1'), auth);
  await page.route('**/*course-index*.json*', route => { pending.push(route); });
  await page.goto('/#/homework?lesson=1&part=choice', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => pending.length).toBe(1);
  await page.locator('#lesson-select').selectOption('10');
  await expect.poll(() => pending.length).toBe(2);
  await page.locator('#lesson-select').selectOption('15');
  await expect.poll(() => pending.length).toBe(3);
  await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'loading');
  await expect(page.locator('#submit-homework')).toBeDisabled();
  await pending[2]!.continue(); await ready(page);
  await pending[0]!.abort('failed'); await pending[1]!.abort('failed');
  await expect(page.locator('#module-host')).toHaveAttribute('data-lesson', '15');
  expect(await page.locator('[data-question-id]').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-question-id')))).toEqual(bank.lessons[14].choice.map((row: any) => row.id));
  const row = bank.lessons[14].choice[0];
  await page.locator(`input[data-answer-id="${row.id}"][value="0"]`).check();
  await expect(page.locator('#homework-save-status')).toHaveAttribute('data-state', 'saved');
  const data = JSON.parse((await page.evaluate(key => localStorage.getItem(key), key))!).data;
  expect(Object.keys(data.homework.lessons)).toEqual(['15']);
  expect(data.homework.lessons['15'].choice.draft).toEqual({ [row.id]: 0 });
  expect(errors).toEqual([]);
});
