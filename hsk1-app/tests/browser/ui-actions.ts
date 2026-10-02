import { expect, type Page } from '@playwright/test';

/** Open real native disclosures with their keyboard/click targets, never by bypassing hidden controls. */
export async function revealControl(page: Page, selector: string): Promise<void> {
  const control = page.locator(selector).first();
  const ancestors = await control.locator('xpath=ancestor::details').all();
  for (const details of ancestors) {
    if (!await details.evaluate(node => (node as HTMLDetailsElement).open)) await details.locator(':scope > summary').click();
  }
}
export async function navigateFeature(page: Page, feature: string, lesson = 10, legacyHomework = true): Promise<void> {
  if (feature === 'listening' || feature === 'vocabulary' || feature === 'textbook') {
    if (feature === 'textbook') {
      await page.locator('#feature-nav [data-feature="home"]').click();
      await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'ready');
      await page.locator(`.lesson-card[data-lesson="${lesson}"] h2 a`).click();
    } else if (feature === 'listening') {
      await page.locator('#feature-nav [data-feature="home"]').click();
      await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'ready');
      const selector = `.lesson-card[data-lesson="${lesson}"] a[href^="#/listening?"]`;
      await revealControl(page, selector);
      await page.locator(selector).click();
    } else {
      await page.locator('#feature-nav [data-feature="review"]').click();
    }
  } else {
    await page.locator(`#feature-nav [data-feature="${feature}"]`).click();
    await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'ready');
    if (feature === 'homework' && legacyHomework && await page.locator('#homework-legacy-link').count()) { await revealControl(page, '#homework-legacy-link'); await page.locator('#homework-legacy-link').click(); }
  }
  await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'ready');
}

/** Stacked bilingual text retains both languages; the visual separator is optional in its accessible name. */
export const pairedAccessibleName = (value: string): RegExp => new RegExp('^' + value.split(' · ').map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s*(?:·\\s*)?') + '$');
