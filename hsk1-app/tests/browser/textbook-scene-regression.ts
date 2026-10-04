import type { test as Test, expect as Expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { getHomework30Bank } from '../../src/services/content/homework30.ts';
import { homework30Group, submitHomework30 } from '../../src/domain/homework30/engine.ts';
import { createCompatibility } from '../../src/services/storage/compatibility.ts';
const stateKey = 'ran_hsk1_modular_v1';
const oldKey = 'ran_hsk1_stage2_v3';
const original = readFileSync(new URL('../fixtures/migration/stage2.json', import.meta.url), 'utf8');
const book = JSON.parse(readFileSync(new URL('../../content/textbook.json', import.meta.url), 'utf8'));

const json = (name: string) => JSON.parse(readFileSync(new URL(`../../content/${name}.json`, import.meta.url), 'utf8'));
const seedData = createCompatibility(json('stage2-bank'), json('stage3-catalog'), book).migrate({ [oldKey]: original }, 1790812800000).data;
const homeworkLesson = getHomework30Bank()[0];
homework30Group(seedData.homework30!, 1, 'choice').draft = Object.fromEntries(homeworkLesson.choice.map(q => [q.id, q.answer]));
if (!submitHomework30(seedData.homework30!, homeworkLesson, 'choice', 1790812800000).ok) throw Error('Could not prepare nonempty homework fixture');
const seed = JSON.stringify({ app: 'hsk1-modular', schema: 1, revision: 1, updatedAt: 1790812800000, data: seedData, recovery: null });

/** Shared native regression: run against both legacy lifecycle and unified bridge. */
export function sceneNavigationRegression(test: typeof Test, expect: typeof Expect, url: (lesson: number, section: string, scene?: number) => string) {
  for (const width of [390, 1280]) for (const mode of ['listen', 'hide'] as const) {
    test(`HSK1 ${mode} retains hidden dialogue across scene history at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(({ oldKey, original, stateKey, seed }) => {
        sessionStorage.setItem('hsk_portal_unlocked_v2', '1');
        if (!localStorage.getItem(stateKey)) localStorage.setItem(stateKey, seed);
        if (!localStorage.getItem(oldKey)) localStorage.setItem(oldKey, original);
      }, { oldKey, original, stateKey, seed });
      await page.goto(url(1, 'text', 1));
      const ready = async () => expect(page.locator('#module-host')).toHaveAttribute('data-state', 'ready');
      const saved = async () => {
        await expect(page.locator('#reading-save-status')).toHaveAttribute('data-state', 'saved');
        return page.evaluate(key => JSON.parse(localStorage.getItem(key)!).data, stateKey);
      };
      await ready(); const before = await saved();
      expect(Object.keys(before.homework.lessons).length).toBeGreaterThan(0);
      expect(before.homework30.lessons['1'].choice.first).toBeTruthy();
      await expect(page.locator('#text-listen-mode')).not.toBeChecked();
      await expect(page.locator('#text-show-original')).toBeChecked();
      if (mode === 'listen') await page.locator('#text-listen-mode').check();
      else await page.locator('#text-show-original').uncheck();
      expect(await saved()).toEqual(before); // Display choices cause no learning-state writes.
      async function hidden(scene: number) {
        const row = book.lessons[0].scenes[scene - 1];
        await expect(page.locator('#scene-content')).toHaveAttribute('data-scene-id', row.id);
        await expect(page.locator('#text-listen-mode')).toBeChecked({ checked: mode === 'listen' });
        await expect(page.locator('#text-show-original')).not.toBeChecked();
        await expect(page.locator('[data-original-text]:visible')).toHaveCount(0);
        expect(await page.locator('[data-original-text]').evaluateAll(nodes => nodes.every(n => (n as HTMLElement).hidden))).toBe(true);
        const accessible = await page.locator('#scene-content').ariaSnapshot();
        for (const line of row.lines) for (const text of [line.zh, line.py, line.vn]) expect(accessible).not.toContain(text);
        await expect(page.locator('[data-scene-audio]')).toBeEnabled();
        await expect(page.locator('#scene-slow')).toBeEnabled();
        expect((await saved()).navigation.scene).toBe(scene);
      }
      async function currentSection(scene: number) {
        const link=page.locator('[data-textbook-sections] a[data-section="text"]');
        await expect(link).toHaveAttribute('href',new RegExp('(?:[?&])scene='+scene+'(?:&|$)'));
        await link.click();await hidden(scene);
      }
      await hidden(1);
      await page.locator('[data-line-audio]').first().click();
      await expect(page.locator('#audio-player')).toHaveAttribute('data-state', /playing|ended/);
      for (const line of book.lessons[0].scenes[0].lines) expect(await page.locator('#audio-player').ariaSnapshot()).not.toContain(line.zh);
      if (width === 1280) {
        await page.locator('[data-scene-tab]').nth(1).click(); await hidden(2);
        await expect(page.locator('[data-scene-tab]').nth(1)).toBeFocused();await currentSection(2);
        await page.locator('[data-scene-tab]').nth(1).press('ArrowLeft'); await hidden(1);
        await expect(page.locator('[data-scene-tab]').first()).toBeFocused();
        await page.locator('[data-scene-tab]').first().press('End'); await hidden(book.lessons[0].scenes.length);
      } else {
        await page.locator('#scene-select').selectOption('1'); await hidden(2);
        await expect(page.locator('#scene-select')).toBeFocused();await currentSection(2);
        await page.locator('#scene-select').selectOption('0'); await hidden(1);
        await page.locator('#scene-select').selectOption(String(book.lessons[0].scenes.length - 1)); await hidden(book.lessons[0].scenes.length);
      }
      await expect(page.locator('#audio-player')).toHaveAttribute('data-state', 'idle');
      await page.goBack(); await hidden(1);
      await expect(width === 390 ? page.locator('#scene-select') : page.locator('[data-scene-tab]').first()).toBeFocused();
      await page.goForward(); await hidden(book.lessons[0].scenes.length);
      await page.screenshot({path:`test-results/hsk1-scene-${mode}-${width}-hidden-${test.info().project.name}.png`,fullPage:true});
      const after = await saved();
      for (const key of Object.keys(before).filter(key => !['navigation', 'reading'].includes(key))) expect(after[key]).toEqual(before[key]);
      expect(after.reading).toEqual(before.reading);
      expect(await page.evaluate(key => localStorage.getItem(key), oldKey)).toBe(original);
      // Full reload restores the route, never ephemeral display choices.
      await page.reload(); await ready();
      await expect(page.locator('#scene-select')).toHaveValue(String(book.lessons[0].scenes.length - 1));
      await expect(page.locator('#text-show-original')).toBeChecked();
      await expect(page.locator('#text-listen-mode')).not.toBeChecked();
      await page.screenshot({path:`test-results/hsk1-scene-${mode}-${width}-reload-${test.info().project.name}.png`,fullPage:true});
      await page.locator('#text-listen-mode').check();
      await page.locator('[data-textbook-sections] a[data-section="grammar"]').click(); await ready();
      await page.locator('[data-textbook-sections] a[data-section="text"]').click(); await ready();
      await expect(page.locator('#text-show-original')).toBeChecked();
      await expect(page.locator('#text-listen-mode')).not.toBeChecked();
    });
  }
}
