import { readFile } from 'node:fs/promises';
import { test, expect, type Page, type Locator } from '@playwright/test';
import { dataCopy, dataStatusCopy, dataModuleCopy, dataSourceCountCopy } from '../../src/services/storage/copy.ts';
import type { BilingualCopy } from '../../src/app/bilingual.ts';
const stateKey = 'ran_hsk1_modular_v1';
const sessionKey = 'hsk_portal_unlocked_v2';
const stage2 = await readFile(new URL('../fixtures/migration/stage2.json', import.meta.url), 'utf8');

async function openManager(page: Page): Promise<void> {
  await page.addInitScript(key => sessionStorage.setItem(key, '1'), sessionKey);
  await page.goto('/#/progress?lesson=10');
  await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'ready');
  await page.locator('#open-data-manager').click();
  await expect(page.locator('#data-status')).toBeVisible();
}
async function pair(locator: Locator, copy: BilingualCopy): Promise<void> {
  await expect(locator.locator(':scope > [lang="zh"]')).toHaveText(copy.zh);
  await expect(locator.locator(':scope > [lang="vi"]')).toHaveText(copy.vi);
}
const currentRaw = (page: Page) => page.evaluate(key => localStorage.getItem(key), stateKey);
async function importStage2(page: Page): Promise<void> {
  await page.locator('#backup-file').setInputFiles({ name: 'hsk1-backup.json', mimeType: 'application/json', buffer: Buffer.from(stage2) });
  await expect(page.locator('#migration-preview')).toBeVisible();
  await page.locator('#confirm-data-import').click();
  await expect(page.locator('#data-status')).toHaveAttribute('data-state', 'saved');
}
async function noOverflow(page: Page): Promise<void> {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const panel = page.locator('.data-panel');
  expect(await panel.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
}

for (const width of [320, 390]) {
  test(`data manager empty, import preview and cancel have paired copy at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 }); await openManager(page);
    await expect(page.locator('#data-status')).toHaveAttribute('data-state', 'empty');
    await pair(page.locator('.data-panel > h2'), dataCopy.panelTitle);
    await pair(page.locator('#data-status > .data-status-message').first(), dataStatusCopy.empty);
    await pair(page.locator('#choose-backup-file'), dataCopy.chooseFile);
    for (const button of await page.locator('.data-panel button:visible').all()) {
      await expect(button.locator('[lang="zh"]')).toHaveCount(1);
      await expect(button.locator('[lang="vi"]')).toHaveCount(1);
    }
    await expect(page.locator('#reset-module option[value="vocabulary"]')).toContainText(dataModuleCopy.vocabulary.zh);
    await expect(page.locator('#reset-module option[value="vocabulary"]')).toContainText(dataModuleCopy.vocabulary.vi);
    await noOverflow(page);
    await page.locator('#preview-migration').click();
    await expect(page.locator('#data-status')).toContainText(dataCopy.noLegacy.zh);
    await expect(page.locator('#data-status')).toContainText(dataCopy.noLegacy.vi);
    const before = await currentRaw(page);
    const raw = '  {"version":1,"bankVersion":"pilot","groups":{"words":{"draft":{"unknown":"<img src=x onerror=alert(1)>"},"attempts":[]}},"words":{}}  ';
    const filename = '<img src=x onerror=alert(1)>.json';
    await page.locator('#backup-file').setInputFiles({ name: filename, mimeType: 'application/json', buffer: Buffer.from(raw) });
    await expect(page.locator('#migration-preview')).toBeVisible();
    await expect(page.locator('#migration-preview h3')).toContainText(filename);
    await expect(page.locator('#migration-preview img, #migration-preview script')).toHaveCount(0);
    const source = page.locator('[data-source="hsk1_lesson9_pilot_progress_v1"]');
    await expect(source).toHaveAttribute('data-understood', '0'); await expect(source).toHaveAttribute('data-unsupported', '1');
    const counts = dataSourceCountCopy(0, 1, Buffer.byteLength(raw));
    await expect(source).toContainText(counts.zh); await expect(source).toContainText(counts.vi);
    await pair(page.locator('#confirm-data-import'), dataCopy.confirmSave);
    await noOverflow(page);
    await page.locator('#cancel-data-import').click();
    await expect(page.locator('#migration-preview')).toBeHidden();
    await expect(page.locator('#data-status')).toContainText(dataCopy.cancelled.zh);
    await expect(page.locator('#data-status')).toContainText(dataCopy.cancelled.vi);
    expect(await currentRaw(page)).toBe(before);
    await page.locator('#backup-file').setInputFiles({ name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from('{broken') });
    await expect(page.locator('#data-status')).toContainText(dataCopy.invalidFile.zh);
    await expect(page.locator('#data-status')).toContainText(dataCopy.invalidFile.vi);
    await expect(page.locator('#confirm-data-import')).toBeDisabled();
    expect(await currentRaw(page)).toBe(before); await noOverflow(page);
  });

  test(`failed scoped reset and successful recovery keep paired warnings and exact data at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 }); await openManager(page); await importStage2(page);
    const before = (await currentRaw(page))!, original = JSON.parse(before);
    await page.locator('#reset-lesson').selectOption('1'); await page.locator('#reset-module').selectOption('homework');
    if (!await page.locator('#reset-lesson').inputValue()) await page.locator('#reset-lesson').selectOption('all');
  if (!await page.locator('#reset-module').inputValue()) await page.locator('#reset-module').selectOption('all');
  await page.locator('#preview-reset').click();
    await expect(page.locator('#migration-preview')).toHaveAttribute('data-reason', 'reset');
    await expect(page.locator('#migration-preview h3')).toContainText('第1课');
    await expect(page.locator('#migration-preview h3')).toContainText('Bài 1');
    await pair(page.locator('#confirm-data-import'), dataCopy.confirmReset);
    await expect(page.locator('#migration-preview')).toContainText(dataCopy.resetPreserved.zh);
    await expect(page.locator('#migration-preview')).toContainText(dataCopy.resetPreserved.vi);
    await noOverflow(page);
    await page.evaluate(key => {
      const original = Storage.prototype.setItem;
      (window as unknown as { restoreDataWrite: () => void }).restoreDataWrite = () => { Storage.prototype.setItem = original; };
      Storage.prototype.setItem = function (name, value) {
        if (this === localStorage && name === key) throw new DOMException('Full', 'QuotaExceededError');
        original.call(this, name, value);
      };
    }, stateKey);
    await page.locator('#confirm-data-import').click();
    await expect(page.locator('#data-status')).toHaveAttribute('data-state', 'unsaved');
    await expect(page.locator('#data-status')).toContainText(dataCopy.resetFailed.zh);
    await expect(page.locator('#data-status')).toContainText(dataCopy.resetFailed.vi);
    expect(await currentRaw(page)).toBe(before); await noOverflow(page);
    await page.evaluate(() => (window as unknown as { restoreDataWrite: () => void }).restoreDataWrite());
    await page.locator('#cancel-data-import').click();
    if (!await page.locator('#reset-lesson').inputValue()) await page.locator('#reset-lesson').selectOption('all');
  if (!await page.locator('#reset-module').inputValue()) await page.locator('#reset-module').selectOption('all');
  await page.locator('#preview-reset').click(); await page.locator('#confirm-data-import').click();
    await expect(page.locator('#data-status')).toHaveAttribute('data-state', 'saved');
    const reset = JSON.parse((await currentRaw(page))!);
    expect(reset.data.homework.lessons['1']).toBeUndefined();
    expect(reset.data.homework.lessons['15']).toEqual(original.data.homework.lessons['15']);
    expect(reset.recovery.data).toEqual(original.data);
    await pair(page.locator('#restore-data'), dataCopy.restore); await page.locator('#restore-data').click();
    await expect(page.locator('#data-status')).toHaveAttribute('data-state', 'saved');
    await expect(page.locator('#data-status')).toContainText(dataCopy.completed.zh);
    await expect(page.locator('#data-status')).toContainText(dataCopy.completed.vi);
    expect(JSON.parse((await currentRaw(page))!).data).toEqual(original.data); await noOverflow(page);
  });
}
