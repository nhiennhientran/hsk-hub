import { readFile } from 'node:fs/promises';
import { test, expect, type BrowserContext, type Page } from '@playwright/test';

const stateKey = 'ran_hsk1_modular_v1';
const writeLock = 'ran-hsk1-modular-write';
const sessionKey = 'hsk_portal_unlocked_v2';
const fixtureRoot = new URL('../fixtures/migration/', import.meta.url);
const fixtureMaps = await Promise.all(['reading-shared.json', 'navigation.json', 'manifest.json'].map(file => readFile(new URL(file, fixtureRoot), 'utf8')));
const manifest = JSON.parse(fixtureMaps[2]!) as { storageFiles: Record<string, string> };
const source = { rawByKey: { ...JSON.parse(fixtureMaps[0]!), ...JSON.parse(fixtureMaps[1]!) } as Record<string, string> };
for (const [key, file] of Object.entries(manifest.storageFiles)) source.rawByKey[key] = await readFile(new URL(file, fixtureRoot), 'utf8');
const legacyStage2 = JSON.parse(source.rawByKey.ran_hsk1_stage2_v3!);
const legacyStage3 = JSON.parse(source.rawByKey.ran_hsk1_stage3_v1!);

async function seedLegacy(page: Page): Promise<void> {
  await page.addInitScript(({ rawByKey, sessionKey }) => {
    sessionStorage.setItem(sessionKey, '1');
    localStorage.setItem('hsk_site_unlocked_v1', '1');
    for (const [key, raw] of Object.entries(rawByKey)) localStorage.setItem(key, raw);
  }, { rawByKey: source.rawByKey, sessionKey });
}

async function openManager(page: Page, visit = true): Promise<void> {
  if (visit) await page.goto('/#/progress?lesson=10');
  await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'ready');
  await page.locator('#open-data-manager').click();
  await expect(page.locator('#data-status')).toBeVisible();
  await expect(page.locator('#preview-migration')).toBeEnabled();
}

async function previewMigration(page: Page): Promise<void> {
  await page.locator('#preview-migration').click();
  await expect(page.locator('#migration-preview')).toBeVisible();
  await expect(page.locator('#confirm-data-import')).toBeEnabled();
}

async function migrate(page: Page): Promise<void> {
  await previewMigration(page);
  await page.locator('#confirm-data-import').click();
  await expect(page.locator('#data-status')).toHaveAttribute('data-state', 'saved');
}

async function currentRaw(page: Page): Promise<string | null> {
  return page.evaluate(key => localStorage.getItem(key), stateKey);
}

async function exportBackup(page: Page, selector = '#export-backup'): Promise<{ raw: string; parsed: any }> {
  const downloadPending = page.waitForEvent('download');
  await page.locator(selector).click();
  const download = await downloadPending;
  expect(await download.failure()).toBeNull();
  const stream = await download.createReadStream();
  expect(stream).not.toBeNull();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString('utf8');
  return { raw, parsed: JSON.parse(raw) };
}

async function previewFile(page: Page, content: string): Promise<void> {
  await page.locator('#backup-file').setInputFiles({ name: 'learning-backup.json', mimeType: 'application/json', buffer: Buffer.from(content) });
  await expect(page.locator('#backup-file')).toHaveValue('');
}

async function importBackup(page: Page, content: string): Promise<void> {
  await previewFile(page, content);
  await expect(page.locator('#migration-preview')).toBeVisible();
  await expect(page.locator('#confirm-data-import')).toBeEnabled();
  await page.locator('#confirm-data-import').click();
  await expect(page.locator('#data-status')).toHaveAttribute('data-state', 'saved');
}

async function holdWriteLock(page: Page): Promise<void> {
  await page.evaluate(async name => {
    const state = window as unknown as { __releaseDataLock?: () => void; __heldDataLock?: Promise<unknown> };
    let markEntered!: () => void;
    const entered = new Promise<void>(resolve => { markEntered = resolve; });
    state.__heldDataLock = navigator.locks.request(name, async () => {
      const release = new Promise<void>(resolve => { state.__releaseDataLock = resolve; });
      markEntered();
      await release;
    });
    await entered;
  }, writeLock);
}

async function releaseWriteLock(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const state = window as unknown as { __releaseDataLock?: () => void; __heldDataLock?: Promise<unknown> };
    state.__releaseDataLock?.();
    await state.__heldDataLock;
  });
}

async function authenticatedPage(context: BrowserContext, origin: string): Promise<Page> {
  await context.addInitScript(key => sessionStorage.setItem(key, '1'), sessionKey);
  const page = await context.newPage();
  await page.goto(`${origin}/#/progress?lesson=10`);
  await openManager(page, false);
  return page;
}

test('nonempty multi-key migration keeps submitted versions, drafts and exact old strings, and excludes authentication', async ({ page }) => {
  await seedLegacy(page);
  await openManager(page);
  await page.setViewportSize({ width: 320, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await migrate(page);
  const state = JSON.parse((await currentRaw(page))!);
  expect(state.app).toBe('hsk1-modular');
  expect(state.schema).toBe(1);
  expect(Object.keys(state.data.homework.lessons).length).toBeGreaterThanOrEqual(2);
  const translation = state.data.homework.lessons['15'].translation;
  expect(translation.draft).toEqual(legacyStage2.lessons['15'].translation.draft);
  expect(translation.first.answers).toEqual(legacyStage2.lessons['15'].translation.first.answers);
  expect(translation.latest.answers).toEqual(legacyStage2.lessons['15'].translation.latest.answers);
  expect(translation.draft).not.toEqual(translation.latest.answers);
  expect(Object.values(translation.latest.answers).some(value => typeof value === 'string' && value.includes('\n'))).toBe(true);
  expect(translation.latest.assessment).toBe('manual');
  expect(translation.latest.correct).toBeNull();
  expect(translation.latest.results).toBeNull();
  const choice = state.data.homework.lessons['1'].choice;
  expect(choice.first.answers).toEqual(legacyStage2.lessons['1'].choice.first.answers);
  expect(choice.latest.answers).toEqual(legacyStage2.lessons['1'].choice.latest.answers);
  expect(choice.first.correct).toBeLessThan(choice.latest.correct);
  expect(state.data.practice.listening.records).toEqual(legacyStage3.listening.records);
  expect(Object.keys(state.data.practice.cards.schedule).length).toBeGreaterThan(0);
  expect(state.data.reading.lessons['1']).toMatchObject({ visited: true });
  expect(state.data.navigation).toMatchObject({ feature: 'homework', lesson: 10, part: 'translation' });
  for (const [key, raw] of Object.entries(source.rawByKey)) {
    expect(await page.evaluate(key => localStorage.getItem(key), key), key).toBe(raw);
    expect(state.data.legacyRaw[key], key).toBe(raw);
  }
  const backup = await exportBackup(page);
  expect(backup.parsed.app).toBe('hsk1-modular-backup');
  expect(backup.parsed.data).toEqual(state.data);
  for (const key of [sessionKey, 'hsk1_ranteacher_unlocked', 'hsk_site_unlocked_v1']) {
    expect(Object.prototype.hasOwnProperty.call(backup.parsed.data.legacyRaw, key)).toBe(false);
    expect(backup.raw).not.toContain(`"${key}"`);
  }
});

test('a downloaded nonempty backup restores identical data in a new context and one import-before recovery', async ({ page, browser }) => {
  await seedLegacy(page);
  await openManager(page);
  await migrate(page);
  const backup = await exportBackup(page);
  const freshContext = await browser.newContext();
  try {
    const fresh = await freshContext.newPage();
    await fresh.goto(page.url());
    await expect(fresh.locator('#auth-gate')).toBeVisible();
    expect(await fresh.evaluate(key => sessionStorage.getItem(key), sessionKey)).toBeNull();
    expect(process.env.HSK_TEST_PASSWORD).toBeTruthy();
    await fresh.locator('#class-password').fill(process.env.HSK_TEST_PASSWORD!);
    await fresh.locator('#class-password').press('Enter');
    await openManager(fresh, false);
    await importBackup(fresh, backup.raw);
    expect(JSON.parse((await currentRaw(fresh))!).data).toEqual(backup.parsed.data);
    const changed = structuredClone(backup.parsed);
    changed.data.reading.lessons['2'] = { visited: true, complete: false };
    await importBackup(fresh, JSON.stringify(changed));
    const afterImport = JSON.parse((await currentRaw(fresh))!);
    expect(afterImport.data).toEqual(changed.data);
    expect(afterImport.recovery.data).toEqual(backup.parsed.data);
    expect(afterImport.recovery).not.toHaveProperty('recovery');
    await fresh.locator('#restore-data').click();
    await expect(fresh.locator('#data-status')).toHaveAttribute('data-state', 'saved');
    expect(JSON.parse((await currentRaw(fresh))!).data).toEqual(backup.parsed.data);
  } finally { await freshContext.close(); }
});

test('broken JSON, wrong schema, unknown IDs, forged fingerprints and scores cannot change saved data', async ({ page }) => {
  await seedLegacy(page);
  await openManager(page);
  await migrate(page);
  const backup = await exportBackup(page);
  const before = await currentRaw(page);
  const invalid: Array<[string, string]> = [['broken JSON', '{"app":']];
  const wrongApp = structuredClone(backup.parsed); wrongApp.app = 'unrelated-learning-app';
  invalid.push(['wrong app', JSON.stringify(wrongApp)]);
  const wrongSchema = structuredClone(backup.parsed); wrongSchema.schema = 99;
  invalid.push(['schema', JSON.stringify(wrongSchema)]);
  const unknownId = structuredClone(backup.parsed);
  const questionId = Object.keys(unknownId.data.practice.listening.records)[0]!;
  unknownId.data.practice.listening.records['unknown-listening-id'] = structuredClone(unknownId.data.practice.listening.records[questionId]);
  invalid.push(['unknown ID', JSON.stringify(unknownId)]);
  const fingerprint = structuredClone(backup.parsed);
  fingerprint.data.practice.listening.records[questionId].first.fingerprint = 'forged-question-fingerprint';
  invalid.push(['fingerprint', JSON.stringify(fingerprint)]);
  const score = structuredClone(backup.parsed);
  score.data.homework.lessons['1'].choice.first.correct = 5;
  invalid.push(['score', JSON.stringify(score)]);
  for (const [label, raw] of invalid) {
    await previewFile(page, raw);
    await expect(page.locator('#confirm-data-import'), label).toBeDisabled();
    await expect(page.locator('#data-status'), label).not.toHaveText('');
    expect(await currentRaw(page), label).toBe(before);
  }
});

test('two real tabs serialize competing imports and reject a preview after equal-revision raw changes', async ({ page, context }) => {
  await seedLegacy(page);
  await openManager(page);
  await migrate(page);
  const backup = await exportBackup(page);
  const other = await context.newPage();
  await other.addInitScript(key => sessionStorage.setItem(key, '1'), sessionKey);
  await openManager(other);
  const candidateA = structuredClone(backup.parsed);
  const candidateB = structuredClone(backup.parsed);
  candidateA.data.reading.lessons['2'] = { visited: true, complete: false };
  candidateB.data.reading.lessons['2'] = { visited: true, complete: true };
  await previewFile(page, JSON.stringify(candidateA));
  await previewFile(other, JSON.stringify(candidateB));
  await expect(page.locator('#confirm-data-import')).toBeEnabled();
  await expect(other.locator('#confirm-data-import')).toBeEnabled();
  const before = JSON.parse((await currentRaw(page))!);
  await holdWriteLock(page);
  try {
    await Promise.all([page.locator('#confirm-data-import').click(), other.locator('#confirm-data-import').click()]);
    await expect(page.locator('#data-status')).toHaveAttribute('data-state', 'saving');
    await expect(other.locator('#data-status')).toHaveAttribute('data-state', 'saving');
  } finally { await releaseWriteLock(page); }
  await expect.poll(async () => {
    return Promise.all([page.locator('#data-status').getAttribute('data-state'), other.locator('#data-status').getAttribute('data-state')]);
  }).toEqual(expect.arrayContaining(['saved', 'conflict']));
  const winnerRaw = (await currentRaw(page))!;
  const winner = JSON.parse(winnerRaw);
  expect(winner.revision).toBe(before.revision + 1);
  expect([candidateA.data, candidateB.data]).toContainEqual(winner.data);
  expect(winner.recovery.data).toEqual(before.data);
  await page.locator('#reload-data').click();
  await previewFile(page, backup.raw);
  await expect(page.locator('#confirm-data-import')).toBeEnabled();
  const equalRevision = structuredClone(winner);
  equalRevision.data.reading.lessons['2'].complete = !equalRevision.data.reading.lessons['2'].complete;
  const changedRaw = JSON.stringify(equalRevision);
  await other.evaluate(({ key, raw }) => localStorage.setItem(key, raw), { key: stateKey, raw: changedRaw });
  await expect(page.locator('#data-status')).toHaveAttribute('data-state', 'conflict');
  await expect(page.locator('#confirm-data-import')).toBeDisabled();
  expect(await currentRaw(page)).toBe(changedRaw);
  expect(JSON.parse(changedRaw).revision).toBe(winner.revision);
});

test('quota and denied-write browser exceptions preserve old data and export the unsaved nonempty candidate', async ({ browser, baseURL }) => {
  for (const failure of ['QuotaExceededError', 'SecurityError']) {
    const context = await browser.newContext();
    try {
      await context.addInitScript(({ rawByKey, stateKey, failure, sessionKey }) => {
        sessionStorage.setItem(sessionKey, '1');
        for (const [key, raw] of Object.entries(rawByKey)) localStorage.setItem(key, raw);
        const original = Storage.prototype.setItem;
        Storage.prototype.setItem = function (key, value) {
          if (this === localStorage && key === stateKey) throw new DOMException('Injected browser storage failure', failure);
          return original.call(this, key, value);
        };
      }, { rawByKey: source.rawByKey, stateKey, failure, sessionKey });
      const page = await authenticatedPage(context, baseURL!);
      await previewMigration(page);
      await page.locator('#confirm-data-import').click();
      await expect(page.locator('#data-status')).toHaveAttribute('data-state', /^(unsaved|unavailable)$/);
      expect(await currentRaw(page)).toBeNull();
      for (const [key, raw] of Object.entries(source.rawByKey)) expect(await page.evaluate(key => localStorage.getItem(key), key), failure).toBe(raw);
      const backup = await exportBackup(page, '#export-preview');
      expect(backup.parsed.data.homework.lessons['15'].translation.latest.answers).toEqual(legacyStage2.lessons['15'].translation.latest.answers);
      expect(backup.parsed.data.practice.listening.records).toEqual(legacyStage3.listening.records);
      await expect(page.locator('#data-status')).not.toHaveAttribute('data-state', 'saved');
    } finally { await context.close(); }
  }
});

test('leaving the manager while a real write lock is held cancels the queued import and all late UI writes', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await seedLegacy(page);
  await openManager(page);
  await previewMigration(page);
  await holdWriteLock(page);
  try {
    await page.locator('#confirm-data-import').click();
    await expect(page.locator('#data-status')).toHaveAttribute('data-state', 'saving');
    await page.locator('#feature-nav a[data-feature="home"]').click();
    await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'ready');
    await expect(page.locator('#module-host')).toHaveAttribute('data-feature', 'home');
  } finally { await releaseWriteLock(page); }
  // An exclusive barrier completes after every older request either finished or aborted.
  await page.evaluate(name => navigator.locks.request(name, () => undefined), writeLock);
  expect(await currentRaw(page)).toBeNull();
  await expect(page.locator('#data-status')).toHaveCount(0);
  await expect(page.locator('#module-host')).toHaveAttribute('data-feature', 'home');
  expect(errors).toEqual([]);
});

test('legacy source preview names every discovered source including unsupported pilot data and cancel writes nothing', async ({ page }) => {
  await seedLegacy(page);
  await page.addInitScript(() => localStorage.setItem('hsk1_lesson9_pilot_progress_v1', '  {"version":1,"bankVersion":"20260930-pilot9-v1","groups":{"words":{"draft":{"unknown-pilot-item":"answer"},"attempts":[]}},"words":{}}  '));
  await openManager(page);
  const before = await currentRaw(page);
  await previewMigration(page);
  await expect(page.locator('[data-source="hsk1_lesson9_pilot_progress_v1"]')).toContainText('0 mục đã hiểu');
  await expect(page.locator('[data-source="hsk1_lesson9_pilot_progress_v1"]')).toContainText('1 mục chỉ giữ bản gốc');
  await page.locator('#cancel-data-import').click();
  expect(await currentRaw(page)).toBe(before);
  await expect(page.locator('#migration-preview')).toBeHidden();
  expect(await page.evaluate(() => localStorage.getItem('hsk1_lesson9_pilot_progress_v1'))).toContain('unknown-pilot-item');
});

test('scoped reset requires preview confirmation, cancellation preserves data, and recovery restores the exact prior state', async ({ page }) => {
  await seedLegacy(page); await openManager(page); await migrate(page);
  const beforeRaw = (await currentRaw(page))!, before = JSON.parse(beforeRaw);
  await page.locator('#reset-lesson').selectOption('1');
  await page.locator('#reset-module').selectOption('homework');
  await page.locator('#preview-reset').click();
  await expect(page.locator('#migration-preview')).toHaveAttribute('data-reason', 'reset');
  await expect(page.locator('#migration-preview')).toContainText('Bài 1');
  await expect(page.locator('#migration-preview')).toContainText('Giữ nguyên');
  expect(await currentRaw(page)).toBe(beforeRaw);
  await page.locator('#cancel-data-import').click();
  expect(await currentRaw(page)).toBe(beforeRaw);
  await page.locator('#preview-reset').click();
  await page.locator('#reset-lesson').selectOption('15');
  await expect(page.locator('#migration-preview')).toBeHidden();
  await expect(page.locator('#confirm-data-import')).toBeDisabled();
  await page.locator('#reset-lesson').selectOption('1');
  await page.locator('#preview-reset').click();
  await page.locator('#confirm-data-import').click();
  await expect(page.locator('#data-status')).toHaveAttribute('data-state', 'saved');
  const after = JSON.parse((await currentRaw(page))!);
  expect(after.data.homework.lessons['1']).toBeUndefined();
  expect(after.data.homework.lessons['15']).toEqual(before.data.homework.lessons['15']);
  expect(after.data.practice).toEqual(before.data.practice);
  expect(after.data.reading).toEqual(before.data.reading);
  expect(after.data.legacyRaw).toEqual(before.data.legacyRaw);
  expect(after.recovery.data).toEqual(before.data);
  expect(after.recovery.reason).toBe('reset');
  expect(await page.evaluate(key => sessionStorage.getItem(key), sessionKey)).toBe('1');
  await page.locator('#restore-data').click();
  await expect(page.locator('#data-status')).toHaveAttribute('data-state', 'saved');
  expect(JSON.parse((await currentRaw(page))!).data).toEqual(before.data);
  await page.setViewportSize({ width: 320, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('failed reset preserves current state and previous recovery, and leaving aborts a queued reset', async ({ page }) => {
  await seedLegacy(page); await openManager(page); await migrate(page);
  const before = (await currentRaw(page))!;
  await page.locator('#preview-reset').click();
  await page.evaluate(stateKey => {
    const original = Storage.prototype.setItem;
    (window as any).__restoreStorage = () => { Storage.prototype.setItem = original; };
    Storage.prototype.setItem = function (key, value) {
      if (this === localStorage && key === stateKey) throw new DOMException('Full', 'QuotaExceededError');
      original.call(this, key, value);
    };
  }, stateKey);
  await page.locator('#confirm-data-import').click();
  await expect(page.locator('#data-status')).toContainText('Chưa đặt lại được dữ liệu');
  expect(await currentRaw(page)).toBe(before);
  await page.evaluate(() => (window as any).__restoreStorage());
  await page.locator('#cancel-data-import').click();
  await page.locator('#preview-reset').click();
  await holdWriteLock(page);
  try {
    await page.locator('#confirm-data-import').click();
    await expect(page.locator('#data-status')).toHaveAttribute('data-state', 'saving');
    await page.locator('#feature-nav a[data-feature="home"]').click();
    await expect(page.locator('#module-host')).toHaveAttribute('data-feature', 'home');
  } finally { await releaseWriteLock(page); }
  await page.evaluate(name => navigator.locks.request(name, () => undefined), writeLock);
  expect(await currentRaw(page)).toBe(before);
});

test('discovering old sources with nonempty current progress adds only missing lessons after explicit confirmation', async ({ page }) => {
  await seedLegacy(page); await openManager(page); await migrate(page);
  const backup = await exportBackup(page);
  delete backup.parsed.data.homework.lessons['15'];
  backup.parsed.data.homework.profile.name = 'Current preview learner';
  const group = backup.parsed.data.homework.lessons['1'].translation;
  group.draft[Object.keys(group.draft)[0]!] = '新的草稿保留。'; group.attempt = null;
  // Scores/reviews are derived; remove stale reviews for the deliberately absent lesson.
  for (const [id, review] of Object.entries(backup.parsed.data.homework.questionReviews)) if ((review as any).lesson === 15) delete backup.parsed.data.homework.questionReviews[id];
  await importBackup(page, JSON.stringify(backup.parsed));
  const current = JSON.parse((await currentRaw(page))!);
  await previewMigration(page);
  await expect(page.locator('#confirm-data-import')).toHaveText('Xác nhận bổ sung dữ liệu cũ');
  expect(JSON.parse((await currentRaw(page))!).data).toEqual(current.data);
  await page.locator('#confirm-data-import').click();
  await expect(page.locator('#data-status')).toHaveAttribute('data-state', 'saved');
  const after = JSON.parse((await currentRaw(page))!);
  expect(after.data.homework.lessons['1']).toEqual(current.data.homework.lessons['1']);
  expect(after.data.homework.profile).toEqual(current.data.homework.profile);
  expect(after.data.homework.lessons['15']).toEqual(legacyStage2.lessons['15']);
  expect(after.data.practice).toEqual(current.data.practice);
  expect(after.recovery.data).toEqual(current.data);
});
