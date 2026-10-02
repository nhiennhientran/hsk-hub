import { readFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';
import { createExerciseCatalogue, normal } from '../../src/domain/exercises/catalogue.ts';
import type { SortTask } from '../../src/domain/exercises/catalogue.ts';
const legacy = JSON.parse(await readFile(new URL('../../content/legacy-exercises.json', import.meta.url), 'utf8'));
const bank = JSON.parse(await readFile(new URL('../../content/stage2-bank.json', import.meta.url), 'utf8'));
const catalogue = createExerciseCatalogue(legacy, bank);
function order(task: SortTask): number[] {
  const target = normal(task.answers[0]!);
  function walk(used: number[], rest: string): number[] | null {
    if (used.length === task.tokens.length) return rest ? null : used;
    for (let i = 0; i < task.tokens.length; i++) if (!used.includes(i)) {
      const token = normal(task.tokens[i]!);
      if (rest.startsWith(token)) { const found = walk([...used, i], rest.slice(token.length)); if (found) return found; }
    }
    return null;
  }
  const found = walk([], target); if (!found) throw Error(`Cannot construct ${task.id}`); return found;
}

test('every one of the 330 legacy question entries renders its retained task and accepts a real submission', async ({ page }) => {
  test.setTimeout(240_000);
  await page.addInitScript(() => sessionStorage.setItem('hsk_portal_unlocked_v2', '1'));
  let count = 0;
  for (const set of ['original', 'pilot'] as const) {
    for (const lesson of set === 'pilot' ? [9] : Array.from({ length: 15 }, (_, i) => i + 1)) {
      const groups = [...new Set(catalogue.entries.filter(entry => entry.set === set && entry.lesson === lesson).map(entry => entry.group))];
      for (const group of groups) {
        await page.goto(`/#/exercises?lesson=${lesson}&set=${set}&group=${group}&filter=all`);
        await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'ready');
        const entries = catalogue.entries.filter(entry => entry.set === set && entry.lesson === lesson && entry.group === group);
        await expect(page.locator('.exercise-navigator button')).toHaveCount(entries.length);
        for (const entry of entries) {
          const task = catalogue.tasks.get(entry.authorityId)!;
          await page.locator(`.exercise-navigator [data-exercise-entry="${entry.id}"]`).click();
          await expect(page.locator('.exercise-question')).toHaveAttribute('data-exercise-entry', entry.id);
          await expect(page.locator('.exercise-question')).toContainText(entry.prompt ?? task.prompt);
          if (await page.locator('#exercise-submit').getAttribute('data-action') === 'redo') await page.locator('#exercise-submit').click();
          if (task.kind === 'choice') await page.locator(`input[name="exercise-answer"][value="${task.answer}"]`).check();
          else if (task.kind === 'sort') {
            for (const index of order(task)) await page.locator('[data-exercise-tokens="available"]').getByRole('button', { name: task.tokens[index], exact: true }).first().click();
          } else await page.locator('#exercise-writing').fill('这是我的学习练习。');
          await page.locator('#exercise-submit').click();
          await expect(page.locator('#exercise-feedback h3 [lang=vi]')).toHaveText(task.kind === 'manual' ? 'Đã lưu bài viết · chờ giáo viên xem' : 'Đúng');
          count++;
        }
        await expect(page.locator('#exercise-save-status')).toHaveAttribute('data-state', 'saved');
      }
    }
  }
  expect(count).toBe(330);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('ran_hsk1_modular_v1')!).data);
  expect(Object.keys(saved.exercises.records)).toHaveLength(new Set(catalogue.entries.filter(entry => entry.set !== 'homework-review').map(entry => entry.authorityId)).size);
  expect(saved.homework.lessons).toEqual({});
  expect(saved.practice.listening.records).toEqual({});
  for (const record of Object.values(saved.exercises.records) as any[]) expect(record.submissions.at(-1).correct).not.toBe(false);
});
