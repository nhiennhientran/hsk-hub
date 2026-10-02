import { mkdir } from 'node:fs/promises';
import { test, expect } from '@playwright/test';
import { tongueTwisters } from '../../src/services/content/textbook-supplements.ts';

for (const viewport of [{ name: 'desktop', width: 1440, height: 1024 }, { name: 'mobile', width: 390, height: 844 }]) {
  test(`legacy design preview and direct lesson navigation · ${viewport.name}`, async ({ page }, testInfo) => {
    test.setTimeout(60_000);
    await page.setViewportSize(viewport);
    await page.addInitScript(() => sessionStorage.setItem('hsk_portal_unlocked_v2', '1'));
    const folder = `.repro-output/legacy-preview/${testInfo.project.name}`;
    await mkdir(folder, { recursive: true });
    const routes = [
      ['home', '/#/home?lesson=1'], ['vocabulary', '/#/textbook?lesson=1&section=vocab'],
      ['dialogue', '/#/textbook?lesson=1&section=text'], ['grammar', '/#/textbook?lesson=10&section=grammar'],
      ['hanzi', '/#/textbook?lesson=4&section=hanzi'], ['practice', '/#/textbook?lesson=4&section=practice'],
      ['homework', '/#/homework?lesson=1&part=choice'], ['listening', '/#/listening?lesson=1'],
      ['mixed-vocabulary', '/#/vocabulary?lesson=1'], ['progress', '/#/progress?lesson=1'], ['original-exercises', '/#/exercises?lesson=1&set=original&group=translation&filter=all'], ['pilot-reading', '/#/exercises?lesson=9&set=pilot&group=reading&filter=all'],
    ];
    for (const [name, route] of routes) {
      await page.goto(route);
      await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'ready');
      if (name === 'home') {
        await expect(page.locator('.lesson-card')).toHaveCount(15);
        await expect(page.locator('.lesson-card [data-lesson-section]')).toHaveCount(75);
        await expect(page.locator('.course-hero')).toHaveCSS('background-image', /linear-gradient/);
      }
      if (name === 'dialogue') await expect(page.locator('[data-tongue-text="1"]')).toHaveText(tongueTwisters[1].zh);
      if (name === 'listening') { await page.locator('#listening-start').click(); await expect(page.locator('#listening-question')).toBeVisible(); }
      if (name === 'mixed-vocabulary') { await page.locator('#vocabulary-start').click(); await expect(page.locator('#vocabulary-prompt')).toBeVisible(); }
      const width = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, viewport: innerWidth }));
      expect(width.scroll).toBeLessThanOrEqual(width.viewport);
      await page.screenshot({ path: `${folder}/${viewport.name}-${name}.png`, fullPage: true });
      await page.screenshot({ path: `${folder}/${viewport.name}-${name}-viewport.png` });
    }
    await page.goto('/#/home?lesson=1');
    await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'ready');
    await page.locator('#lesson-search').fill('AI小语');
    await expect(page.locator('.lesson-card:visible')).toHaveCount(1);
    await page.locator('#lesson-search').fill('');
    await expect(page.locator('.lesson-card:visible')).toHaveCount(15);
    for (const section of ['vocab', 'text', 'grammar', 'hanzi', 'practice']) {
      await page.locator(`.lesson-card[data-lesson="1"] [data-lesson-section="${section}"]`).click();
      await expect(page.locator('[data-textbook-section]')).toHaveAttribute('data-textbook-section', section);
      await page.goBack();
      await expect(page.locator('.lesson-card')).toHaveCount(15);
    }
  });
}

test('all three original tongue-twister texts and pinyin remain available with the shared audio player', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('hsk_portal_unlocked_v2', '1'));
  for (const lesson of [1, 2, 3]) {
    await page.goto(`/#/textbook?lesson=${lesson}&section=text`);
    await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'ready');
    await expect(page.locator(`[data-tongue-text="${lesson}"]`)).toHaveText(tongueTwisters[lesson].zh);
    await expect(page.locator('#textbook-text')).toContainText(tongueTwisters[lesson].py);
    await expect(page.locator(`[data-tongue-audio="${lesson}"]`)).toBeEnabled();
    await expect(page.locator('#audio-player')).toHaveCount(1);
  }
});


test('listening offers 5/10/all and resumes a sized round without resetting score domains', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('hsk_portal_unlocked_v2', '1'));
  await page.goto('/#/listening?lesson=1');
  await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'ready');
  await page.locator('#listening-all').click();
  for (const [value, count] of [['5', 5], ['10', 10], ['all', 75]] as const) {
    await page.locator('#listening-count').selectOption(value);
    await page.locator('#listening-start').click();
    await expect(page.locator('#listening-position')).toHaveText(`Câu 1 / ${count}`);
  }
  await page.locator('#listening-count').selectOption('10');
  await page.locator('#listening-start').click();
  await expect(page.locator('#listening-save-status')).toHaveAttribute('data-state', 'saved');
  await page.reload();
  await expect(page.locator('#listening-position')).toHaveText('Câu 1 / 10');
  await expect(page.locator('#listening-count')).toHaveValue('10');
  await expect(page.locator('#listening-first-score')).toContainText('Đã nộp 0 / 75');
});
