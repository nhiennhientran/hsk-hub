import { test, expect, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
const output = resolve(process.env.HSK_L01_OUTPUT ?? `.repro-output/continue-phase5/${process.env.HSK_L01_BROWSER ?? 'chromium'}`);
const run = <T>(page: Page, expression: string): Promise<T> => page.evaluate(source => (0, eval)(source), expression) as Promise<T>;
const shot = async (page: Page, name: string) => { await mkdir(resolve(output, 'native-targets'), { recursive: true }); await page.screenshot({ path: resolve(output, 'native-targets', name + '.png'), fullPage: true }); };
test.beforeEach(async ({ page }) => { await page.goto('/tests/browser/fixtures/official-vi-l01-candidate.html'); await expect(page.locator('body')).toHaveAttribute('data-ready', 'true'); });
test('real reviewed L01 words and dialogue bodies appear through compiled application renderers', async ({ page }) => {
  const data = await run<{ words: { ownerId: string; newValue: string }[]; lines: { ownerId: string; newValue: string }[] }>(page, 'officialViL01Candidate.render()');
  await expect(page.locator('[data-candidate-title]')).toHaveText('Xin chào AI Tiểu Ngữ!');
  for (const word of data.words) {
    const card = page.locator(`.vocab-card[data-word-id="${word.ownerId}"]`); await card.locator('[data-vocab-flip]').click();
    await expect(card.locator('.vocab-back p').last()).toHaveText(word.newValue);
  }
  for (const scene of [1, 2, 3]) {
    await page.locator(`#scene-tab-${scene - 1}`).click();
    for (const line of data.lines.filter(line => line.ownerId.includes(`-text-${scene}-`))) await expect(page.locator(`[data-line-id="${line.ownerId}"] [data-original-text] p`).last()).toHaveText(line.newValue);
    for (const image of await page.locator('.textbook-scene-figures img').all()) { await expect(image).toHaveJSProperty('complete', true); await expect.poll(() => image.evaluate(node => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0); }
    await shot(page, `l01-candidate-real-words-dialogue-scene-${scene}`);
  }
});
test('real candidate preserves old submitted homework and backup while fresh display snapshots use reviewed values', async ({ page }) => {
  const history = await run<{ firstBeforeCandidate: unknown; group: { first: unknown }; data: { viPresentation?: unknown }; backup: { data: unknown }; freshSnapshot: { fields: unknown[] }; expectedSnapshot: unknown; cards: { expected: string; shown: string; rawFingerprint: string; displayFingerprint: string }[]; question: { prompt: string }; defaultRevision: null }>(page, 'officialViL01Candidate.history()');
  expect(history.group.first).toEqual(history.firstBeforeCandidate); expect(history.data.viPresentation).toBeUndefined(); expect(history.backup.data).toEqual(history.data);
  expect(history.freshSnapshot).toEqual(history.expectedSnapshot); expect(history.freshSnapshot.fields).toHaveLength(24); expect(history.defaultRevision).toBeNull();
  for (const card of history.cards) { expect(card.shown).toBe(card.expected); expect(card.displayFingerprint).toBe(card.rawFingerprint); }
  await expect(page.locator('.receipt-prompt').first()).toHaveText(history.question.prompt);
  await page.locator('#receipt-version').selectOption('latest'); await expect(page.locator('.receipt-prompt').first()).toHaveText(history.question.prompt);
  const imported = await run<{ result: { ok: boolean }; original: unknown; restored: unknown; diskRestored: unknown }>(page, 'officialViL01Candidate.roundTrip()'); expect(imported.result.ok).toBe(true); expect(imported.restored).toEqual(imported.original); expect(imported.diskRestored).toEqual(imported.original);
  await shot(page, 'l01-candidate-retained-history-backup');
});
test('compiled real candidate rejects manifest and independent proof byte tampering before display projection', async ({ page }) => {
  const result = await run<{ rejected: string[]; defaultRevision: null }>(page, 'officialViL01Candidate.rejectedBytes()'); expect(result.rejected).toEqual(['manifest bytes', 'review bytes']); expect(result.defaultRevision).toBeNull();
  await expect(page.locator('#candidate-rejection')).toBeVisible(); await shot(page, 'l01-candidate-rejected-tampered-evidence');
});
