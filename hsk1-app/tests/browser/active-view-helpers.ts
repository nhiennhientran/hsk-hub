import { expect, type Page } from '@playwright/test';

/** Exercise the native summary control rather than mutating the open attribute. */
export async function openLearningSettings(page: Page, feature: 'vocabulary' | 'listening'): Promise<void> {
  const details = page.locator(`#${feature}-settings`);
  await expect(details).toBeVisible();
  if (!await details.evaluate(node => (node as HTMLDetailsElement).open)) await details.locator(':scope > summary').click();
  await expect(details).toHaveAttribute('open', '');
}

/** Student navigation uses the practice hub while feature URLs remain compatible. */
export async function openPracticeFeature(page: Page, feature: 'vocabulary' | 'listening' | 'textbook'): Promise<void> {
  await page.locator('#feature-nav [data-feature="review"]').click();
  await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'ready');
  await expect(page.locator('#review-module')).toBeVisible();
  await page.locator(`#review-${feature}`).click();
}

export async function selectDialogueScene(page: Page, index: number): Promise<void> {
  if (await page.locator('#scene-select').isVisible()) await page.locator('#scene-select').selectOption(String(index));
  else await page.locator('[data-scene-tab]').nth(index).click();
}
