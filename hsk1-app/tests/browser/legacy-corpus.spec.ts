import { test, expect } from '@playwright/test';
import { catalogue, correctAnswer, initial, rawState, readOnly, ready, seed, submit } from './exercise-archive-fixtures.ts';

test('all 330 retained legacy entries can show their existing history without reopening an extra bank or accepting submissions', async ({ page }) => {
  test.setTimeout(240_000);
  const data = initial();
  const oldEntries = catalogue.entries.filter(entry => entry.set !== 'homework-review');
  for (const id of new Set(oldEntries.map(entry => entry.authorityId))) submit(data, id, correctAnswer(catalogue.tasks.get(id)!));
  const before = await seed(page, data);
  let count = 0;
  for (const set of ['original', 'pilot'] as const) {
    for (const lesson of set === 'pilot' ? [9] : Array.from({ length: 15 }, (_, i) => i + 1)) {
      const groups = [...new Set(oldEntries.filter(entry => entry.set === set && entry.lesson === lesson).map(entry => entry.group))];
      for (const group of groups) {
        await page.goto(`/#/exercises?lesson=${lesson}&set=${set}&group=${group}&filter=all`); await ready(page); await readOnly(page);
        const entries = oldEntries.filter(entry => entry.set === set && entry.lesson === lesson && entry.group === group);
        await expect(page.locator('.archive-question')).toHaveCount(entries.length);
        for (const entry of entries) {
          const task = catalogue.tasks.get(entry.authorityId)!;
          const question = page.locator(`.archive-question[data-exercise-entry="${entry.id}"]`);
          await expect(question.locator('.archive-prompt')).toHaveText(entry.prompt ?? task.prompt);
          await expect(question.locator('.archive-identity')).toHaveText(`${entry.id} · ${entry.authorityId}`);
          await expect(question.locator('.archive-timeline > .archive-submission')).toHaveAttribute('data-result', task.kind === 'manual' ? 'manual' : 'correct');
          if (task.kind === 'manual') {
            expect(await question.locator('.archive-answer-text').textContent()).toBe(correctAnswer(task));
            await expect(question.locator('.archive-original-content')).toHaveCount(0);
          }
          count++;
        }
        expect(await rawState(page)).toBe(before);
      }
    }
  }
  expect(count).toBe(330);
  const saved = JSON.parse((await rawState(page))!).data;
  expect(Object.keys(saved.exercises.records)).toHaveLength(new Set(oldEntries.map(entry => entry.authorityId)).size);
  expect(saved.homework.lessons).toEqual({}); expect(saved.practice.listening.records).toEqual({});
  expect(saved.exercises).toEqual(JSON.parse(before).data.exercises);
});
