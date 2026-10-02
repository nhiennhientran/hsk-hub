/** Stable screenshots of the published artifact in disposable browser contexts. */
import { readFile, mkdir } from 'node:fs/promises';
import { chromium, webkit, expect } from '@playwright/test';
const name = process.env.HSK_BROWSER;
if (!['chromium', 'webkit'].includes(name)) throw new Error('Choose a verified browser.');
const base = process.env.HSK_LIVE_URL;
if (base !== 'https://nhiennhientran.github.io/hsk-hub/new-hsk1/hsk1/') throw new Error('Unexpected live target.');
const signature = (await readFile(new URL('../../new-hsk1/hsk1/auth-patch.js', import.meta.url), 'utf8')).match(/const SIG='([0-9a-f.]+)'/)?.[1];
if (!signature) throw new Error('Classroom gate reference unavailable.');
const password = signature.split('.').map(hex => String.fromCodePoint(Number.parseInt(hex, 16))).join('');
const browser = await ({ chromium, webkit }[name]).launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(15000);
  await page.goto(base + '#/review?lesson=1');
  await expect(page.locator('#auth-gate')).toBeVisible();
  await page.locator('#class-password').evaluate((field, value) => {
    field.value = value; field.dispatchEvent(new Event('input', { bubbles: true }));
  }, password);
  await page.locator('#class-password').press('Enter');
  await expect(page.locator('#auth-gate')).toBeHidden();
  await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'ready');
  await page.locator('#vocabulary-none').click();
  await page.locator('[data-vocabulary-lesson="1"]').check();
  await page.locator('[data-vocabulary-lesson="15"]').check();
  await page.locator('#vocabulary-start').click();
  await expect(page.locator('#vocabulary-save-status')).toHaveAttribute('data-state', 'saved');
  const directory = `.repro-output/mixed-live/${name}`;
  await mkdir(directory, { recursive: true });
  for (const width of [1440, 390, 768, 320]) {
    await page.setViewportSize({ width, height: width > 1000 ? 1000 : 900 });
    const size = width < 700 ? 1 : width < 1050 ? 4 : 6;
    await expect(page.locator('.mixed-card-toggle')).toHaveCount(size);
    await expect(page.locator('.mixed-card-back')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.screenshot({ path: `${directory}/${width}-front.png`, fullPage: true, animations: 'disabled' });
    await page.locator('.mixed-card-toggle').first().click();
    await expect(page.locator('.mixed-card-back')).toHaveCount(1);
    await page.screenshot({ path: `${directory}/${width}-back.png`, fullPage: true, animations: 'disabled' });
    await page.locator('.mixed-card-toggle').first().click();
    await page.locator('#vocabulary-settings > summary').click();
    await page.screenshot({ path: `${directory}/${width}-settings.png`, fullPage: true, animations: 'disabled' });
    await page.locator('#vocabulary-settings > summary').click();
  }
  console.log(JSON.stringify({ browser: name, widths: [1440, 390, 768, 320], screenshots: 12, normalLogin: true, syntheticProfile: true }));
} finally { await browser.close(); }
