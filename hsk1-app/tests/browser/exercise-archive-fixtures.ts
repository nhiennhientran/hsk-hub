import { readFileSync } from 'node:fs';
import { expect, type Page } from '@playwright/test';
import { createCompatibility, type AppData } from '../../src/services/storage/compatibility.ts';
import { createExerciseCatalogue, normal, type ExerciseTask } from '../../src/domain/exercises/catalogue.ts';
import { answerExercise, restartExercise, submitExercise } from '../../src/domain/exercises/engine.ts';

const json = (name: string) => JSON.parse(readFileSync(new URL(`../../content/${name}.json`, import.meta.url), 'utf8'));
export const bank = json('stage2-bank');
export const catalogue = createExerciseCatalogue(json('legacy-exercises'), bank);
export const compatibility = createCompatibility(bank, json('stage3-catalog'), json('textbook'));
export const storageKey = 'ran_hsk1_modular_v1';
export const stamp = 1_790_899_200_000;
export const initial = () => compatibility.blank();
export const task = (id: string) => catalogue.tasks.get(id)!;
export function submit(data: AppData, id: string, answer: number | number[] | string, at = stamp): void {
  const question = task(id);
  if (data.exercises.records[id]) restartExercise(data.exercises, question);
  answerExercise(data.exercises, question, answer); submitExercise(data.exercises, question, at);
}
export function correctAnswer(question: ExerciseTask): number | number[] | string {
  if (question.kind === 'manual') return '  已保存的原文\n这是我的练习。  ';
  if (question.kind === 'choice') return question.answer;
  function walk(used: number[], rest: string): number[] | null {
    if (question.kind !== 'sort') return null;
    if (used.length === question.tokens.length) return rest ? null : used;
    for (let i = 0; i < question.tokens.length; i++) if (!used.includes(i)) {
      const token = normal(question.tokens[i]!);
      if (rest.startsWith(token)) { const found = walk([...used, i], rest.slice(token.length)); if (found) return found; }
    }
    return null;
  }
  const found = walk([], normal(question.answers[0]!)); if (!found) throw Error(`Cannot construct ${question.id}`); return found;
}
export async function auth(page: Page): Promise<void> {
  await page.addInitScript(() => sessionStorage.setItem('hsk_portal_unlocked_v2', '1'));
}
export async function seed(page: Page, data: AppData): Promise<string> {
  const raw = JSON.stringify({ app: 'hsk1-modular', schema: 1, revision: 1, updatedAt: stamp, data: compatibility.validate(data), recovery: null });
  await auth(page);
  await page.addInitScript(({ key, raw }) => { if (localStorage.getItem(key) === null) localStorage.setItem(key, raw); }, { key: storageKey, raw });
  return raw;
}
export async function ready(page: Page): Promise<void> {
  await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'ready');
  await expect(page.locator('#exercises-module.exercise-archive')).toBeVisible();
}
export const rawState = (page: Page) => page.evaluate(key => localStorage.getItem(key), storageKey);
export async function readOnly(page: Page): Promise<void> {
  await expect(page.locator('#exercises-module input, #exercises-module textarea, #exercises-module select, #exercises-module button')).toHaveCount(0);
  await expect(page.locator('.exercise-navigator, .exercise-set-tabs, .exercise-group-tabs, #exercise-submit, .exercise-player')).toHaveCount(0);
  await expect(page.locator('#archive-homework-link')).toBeVisible();
  await expect(page.locator('#archive-backup-link')).toBeVisible();
}
