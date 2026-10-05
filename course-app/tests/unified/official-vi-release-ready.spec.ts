import {test, expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {currentViLesson} from './official-vi-expectations.ts';
import {loadActiveHsk1ForTests} from '../../../hsk1-app/tests/browser/active-official-vi.ts';
import type {Lesson} from '../../src/types.ts';

test.beforeEach(async ({page}) => {
  await page.addInitScript(() => sessionStorage.setItem('hsk_portal_unlocked_v2', '1'));
  await page.setViewportSize({width: 390, height: 900});
});
for (const level of [2, 3] as const) for (let number = 1; number <= (level === 2 ? 15 : 18); number++) {
  const raw = JSON.parse(readFileSync(new URL(`../../content/hsk${level}/lesson-${String(number).padStart(2, '0')}.json`, import.meta.url), 'utf8')) as Lesson;
  const lesson = currentViLesson(raw);
  test(`accepted HSK${level} lesson ${number} uses current VI in every dialogue and vocabulary item`, async ({page}) => {
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    for (const scene of lesson.texts) {
      await page.goto(`/#view=lesson&level=${level}&lesson=${number}&section=text&scene=${scene.number}`);
      await expect(page.locator('.dialogue-line .vietnamese-line')).toHaveText(scene.lines.map(line => line.vi));
      await expect(page.locator('.scene-tabs [aria-current="page"]')).toContainText(scene.title.vi);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    }
    await page.goto(`/#view=lesson&level=${level}&lesson=${number}&section=vocab`);
    await expect(page.locator('.vocabulary-item')).toHaveCount(lesson.vocabulary.length);
    for (const word of lesson.vocabulary) await expect(page.locator(`[data-word-id="${word.id}"] .word-open`)).toContainText(word.vi);
    await page.goto(`/#view=lesson&level=${level}&lesson=${number}&section=grammar`);
    const grammar = page.locator('.lesson-section.grammar');
    await expect(grammar).toHaveCount(lesson.grammar.length);
    for (const [index, item] of lesson.grammar.entries()) {
      await expect(grammar.nth(index)).toContainText(item.explanation.vi);
      const source = lesson.grammarSourceExplanations?.find(source => source.grammarId === item.id);
      if (source) await expect(grammar.nth(index).locator('.grammar-source-explanation')).toContainText(source.explanation.vi);
      const presentation = lesson.grammarPresentations?.find(presentation => presentation.grammarId === item.id);
      for (const [groupIndex, group] of (presentation?.groups ?? []).entries()) await expect(grammar.nth(index).locator('.grammar-explanation-group').nth(groupIndex)).toContainText(group.explanation.vi);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    expect(errors).toEqual([]);
  });
}
for (let number = 1; number <= 15; number++) test(`accepted HSK1 lesson ${number} uses current VI in every dialogue and vocabulary card`, async ({page}) => {
  const {content, registry} = await loadActiveHsk1ForTests();
  expect(registry.revisionId).not.toBeNull();
  const lesson = content.lessons.find(lesson => lesson.id === number)!;
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  for (const [index, scene] of lesson.scenes.entries()) {
    await page.goto(`/#view=lesson&level=1&lesson=${number}&section=text&scene=${index + 1}`);
    await expect(page.locator('main')).toHaveAttribute('data-module-state', 'ready');
    await expect(page.locator('#scene-content .textbook-line')).toHaveCount(scene.lines.length);
    for (const line of scene.lines) await expect(page.locator(`[data-line-id="${line.id}"]`)).toContainText(line.vn);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
  await page.goto(`/#view=lesson&level=1&lesson=${number}&section=vocab`);
  await expect(page.locator('.textbook-vocab-grid .vocab-card')).toHaveCount(lesson.vocab.length);
  for (const word of lesson.vocab) await expect(page.locator(`[data-word-id="${word.id}"] .vocab-back`)).toContainText(word.vn);
  await page.goto(`/#view=lesson&level=1&lesson=${number}&section=grammar`);
  for (const grammar of [...lesson.phonetics, ...lesson.grammar]) await expect(page.locator(`[data-language-item="${grammar.id}"]`)).toContainText(grammar.desc);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  expect(errors).toEqual([]);
});
for (const width of [320, 390, 768, 1440]) for (const [level, number] of [[1, 1], [2, 2], [3, 10]]) test(`official VI grammar HSK${level} at ${width}px keeps all explanations readable`, async ({page}) => {
  await page.setViewportSize({width, height: 900});
  await page.goto(`/#view=lesson&level=${level}&lesson=${number}&section=grammar`);
  if (level === 1) {
    const {content, registry} = await loadActiveHsk1ForTests();
    expect(registry.revisionId).not.toBeNull();
    const lesson = content.lessons.find(lesson => lesson.id === number)!;
    await expect(page.locator('main')).toHaveAttribute('data-module-state', 'ready');
    for (const item of [...lesson.phonetics, ...lesson.grammar]) {
      await expect(page.locator(`[data-language-item="${item.id}"]`)).toContainText(item.desc);
    }
  } else {
    const raw = JSON.parse(readFileSync(new URL(`../../content/hsk${level}/lesson-${String(number).padStart(2, '0')}.json`, import.meta.url), 'utf8')) as Lesson;
    const lesson = currentViLesson(raw);
    const sections = page.locator('.lesson-section.grammar');
    await expect(sections).toHaveCount(lesson.grammar.length);
    for (const [index, item] of lesson.grammar.entries()) {
      await expect(sections.nth(index)).toContainText(item.explanation.vi);
    }
  }
  await expect(page.locator('main')).not.toContainText('暂时无法打开');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({path: test.info().outputPath(`official-vi-hsk${level}-grammar-${width}.png`), fullPage: true});
});
