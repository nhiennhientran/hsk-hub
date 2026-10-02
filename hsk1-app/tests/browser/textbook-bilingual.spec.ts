import { selectDialogueScene } from './active-view-helpers.ts';
import { readFile } from 'node:fs/promises';
import { test, expect, type Locator, type Page } from '@playwright/test';
import { practiceQuestions } from '../../src/domain/textbook/practice.ts';

const book = JSON.parse(await readFile(new URL('../../content/textbook.json', import.meta.url), 'utf8'));

async function paired(node: Locator): Promise<void> {
  await expect(node.locator('[lang="zh"]').first()).toBeVisible();
  await expect(node.locator('[lang="vi"]').first()).toBeVisible();
  await expect(node.locator('[lang="zh"]').first()).not.toHaveText('');
  await expect(node.locator('[lang="vi"]').first()).not.toHaveText('');
}
async function ready(page: Page, section: string): Promise<void> {
  await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'ready');
  await expect(page.locator('[data-textbook-section]')).toHaveAttribute('data-textbook-section', section);
}
async function selectSection(page: Page, section: string): Promise<void> {
  await page.locator(`[data-textbook-sections] [data-section="${section}"]`).click();
  await ready(page, section);
}
async function unobscured(control: Locator): Promise<void> {
  await control.scrollIntoViewIfNeeded();
  expect(await control.evaluate(node => {
    const box = node.getBoundingClientRect();
    const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
    return box.width > 0 && box.height > 0 && hit !== null && node.contains(hit);
  }), 'control center should be clickable without an overlapping layer').toBe(true);
}
async function noOverflow(page: Page): Promise<void> {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('hsk_portal_unlocked_v2', '1'));
});

for (const width of [320, 390, 1440]) {
  test(`paired textbook controls, content preservation and click targets at ${width}px`, async ({ page }, testInfo) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/#/textbook?lesson=1&section=text');
    await ready(page, 'text');
    const tabs = page.locator('[data-textbook-sections] a');
    await expect(tabs).toHaveCount(5);
    const tabBounds = [];
    for (const tab of await tabs.all()) {
      await paired(tab);
      await unobscured(tab);
      tabBounds.push((await tab.boundingBox())!);
    }
    for (let index = 1; index < tabBounds.length; index++) {
      if (Math.abs(tabBounds[index].y - tabBounds[index - 1].y) < 1) {
        expect(tabBounds[index].x).toBeGreaterThanOrEqual(tabBounds[index - 1].x + tabBounds[index - 1].width - 1);
      } else expect(tabBounds[index].y).toBeGreaterThanOrEqual(tabBounds[index - 1].y + tabBounds[index - 1].height - 1);
    }
    for (const node of ['#textbook-text h2', '#scene-slow', '[data-scene-audio]', '[data-line-audio]', width <= 600 ? '.textbook-scene-picker' : '[data-scene-tab]']) await paired(page.locator(node).first());
    for (const [index, scene] of book.lessons[0].scenes.entries()) {
      await expect(page.locator(`#scene-select option[value="${index}"]`)).toHaveText(`${index + 1}. ${scene.place} · ${scene.place_vn}`);
    }
    const line = book.lessons[0].scenes[0].lines[0];
    const original = page.locator(`[data-line-id="${line.id}"] [data-original-text]`);
    await expect(original.locator('p').nth(0)).toHaveText(line.zh);
    await expect(original.locator('p').nth(1)).toHaveText(line.py);
    await expect(original.locator('p').nth(2)).toHaveText(line.vn);
    await page.locator('#text-listen-mode').check();
    await expect(original).toBeHidden();
    await page.locator(`[data-line-audio="${line.id}"]`).click();
    await expect(page.locator('#audio-status')).toContainText('第 1 课 · 课文 1 · 第 1 句');
    await expect(page.locator('#audio-status')).toContainText('Bài 1 · Bài khoá 1 · Câu 1');
    await expect(page.locator('#audio-status')).not.toContainText(line.zh);
    await page.locator('#text-show-original').check();
    await expect(original).toBeVisible();
    await page.locator('#text-show-original').uncheck();
    await expect(original).toBeHidden();
    await expect(page.locator('#audio-status')).not.toContainText(line.zh);
    await page.locator('#audio-stop').click();
    await selectDialogueScene(page, 1);
    await expect(page.locator('[data-scene-tab]').nth(1)).toHaveAttribute('aria-selected', 'true');
    await noOverflow(page);

    await selectSection(page, 'grammar');
    await paired(page.locator('#textbook-language h2'));
    await expect(page.locator('#textbook-language h2')).toContainText('语音');
    await paired(page.locator('[data-tts]').first());
    await noOverflow(page);

    await selectSection(page, 'hanzi');
    for (const selector of ['[data-hanzi-stroke-count]', '[data-hanzi-status]', '[data-hanzi-action="animate"]', '[data-hanzi-action="practice"]', '[data-hanzi-action="reset"]']) await paired(page.locator(selector));
    await page.locator('[data-hanzi-action="practice"]').click();
    await expect(page.locator('[data-hanzi-mode="practice"]')).toHaveCount(1);
    await paired(page.locator('[data-hanzi-status]'));
    await unobscured(page.locator('[data-hanzi-action="reset"]'));
    await page.locator('[data-hanzi-action="reset"]').click();
    await expect(page.locator('[data-hanzi-mode="display"]')).toHaveCount(1);
    await noOverflow(page);

    await selectSection(page, 'practice');
    const questions = practiceQuestions(book.lessons[0]).basic;
    await expect(page.locator('[data-practice-feedback]')).toHaveCount(0);
    await expect(page.locator('[data-practice-option].correct')).toHaveCount(0);
    for (const [index, question] of questions.entries()) {
      const card = page.locator(`[data-practice-question="${index}"]`);
      await paired(card.locator('h3'));
      await expect(card.locator('h3 [lang="vi"]')).toHaveText(question.prompt);
      await expect(card.locator('[data-practice-option]')).toHaveText(question.options.map((value, option) => `${String.fromCharCode(65 + option)}. ${value}`));
      await expect(card.locator('.practice-stem')).toHaveText(question.stem);
    }
    await paired(page.locator('[data-practice-action="submit"]'));
    await page.locator('[data-practice-option]').first().click();
    await page.locator('[data-practice-action="submit"]').click();
    await expect(page.locator('[data-practice-feedback]')).toHaveCount(questions.length);
    await paired(page.locator('[data-practice-score]'));
    await unobscured(page.locator('[data-practice-action="reset"]'));
    await page.locator('[data-practice-action="reset"]').click();
    await expect(page.locator('[data-practice-feedback]')).toHaveCount(0);
    await page.locator('#reading-complete').check();
    await expect(page.locator('#reading-save-status')).toHaveAttribute('data-state', 'saved');
    await paired(page.locator('#reading-save-status'));
    await paired(page.locator('#reading-section-status'));
    await noOverflow(page);
    await testInfo.attach(`paired-practice-${width}`, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });

    // A real failed fetch exercises the active shared panel without faking playback.
    await selectSection(page, 'text');
    await page.route('**/course-assets/audio/*.mp3', route => route.abort('failed'));
    await page.locator('[data-scene-audio]').click();
    const player = page.locator('#audio-player');
    await expect(player).toHaveAttribute('data-state', 'error');
    await paired(page.locator('#audio-status'));
    for (const selector of ['#audio-pause', '#audio-resume', '#audio-replay', '#audio-stop']) await paired(page.locator(selector));
    const panelBounds = (await player.boundingBox())!;
    expect(panelBounds.y).toBeGreaterThanOrEqual(0);
    expect(panelBounds.y + panelBounds.height).toBeLessThanOrEqual(900);
    await unobscured(page.locator('#audio-stop'));
    await page.locator('#audio-stop').click();
    await expect(player).toHaveAttribute('data-state', 'idle');
    await noOverflow(page);
  });
}

test('stroke retry and saving failure stay bilingual and recover without changing answers or reading state', async ({ page }) => {
  let failedStroke = false;
  await page.route('**/course-assets/hanzi/*.json*', async route => {
    if (!failedStroke) { failedStroke = true; await route.fulfill({ status: 404, body: 'Missing character', contentType: 'text/plain' }); }
    else await route.continue();
  });
  await page.addInitScript(() => {
    const state = window as unknown as { __failReadingSave: boolean };
    state.__failReadingSave = true;
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'ran_hsk1_modular_v1' && state.__failReadingSave) throw new DOMException('Test quota failure', 'QuotaExceededError');
      return original.call(this, key, value);
    };
  });
  await page.goto('/#/textbook?lesson=1&section=hanzi');
  await ready(page, 'hanzi');
  await paired(page.locator('[data-hanzi-status]'));
  await paired(page.locator('[data-hanzi-action="retry"]'));
  await expect(page.locator('[data-hanzi-status] [lang="zh"]')).toContainText('未能加载');
  await page.locator('[data-hanzi-action="retry"]').click();
  await expect(page.locator('[data-hanzi-canvas] svg')).toBeVisible();
  await page.locator('#reading-complete').check();
  await expect(page.locator('#reading-save-status')).toHaveAttribute('data-state', 'unsaved');
  await expect(page.locator('#reading-save-status [lang="zh"]')).toContainText('存储空间已满');
  await expect(page.locator('#reading-save-status [lang="vi"]')).toContainText('Bộ nhớ đã đầy');
  await paired(page.locator('#retry-reading-save'));
  await page.evaluate(() => { (window as unknown as { __failReadingSave: boolean }).__failReadingSave = false; });
  await page.locator('#retry-reading-save').click();
  await expect(page.locator('#reading-save-status')).toHaveAttribute('data-state', 'saved');
  await expect(page.locator('#reading-complete')).toBeChecked();
});
