import { navigateFeature } from './ui-actions.ts';
import { expect, type Page } from '@playwright/test';

/** Exercise the native summary control rather than mutating the open attribute. */
export async function openLearningSettings(page: Page, feature: 'vocabulary' | 'listening'): Promise<void> {
  const details = page.locator(`#${feature}-settings`);
  await expect(details).toBeVisible();
  if (!await details.evaluate(node => (node as HTMLDetailsElement).open)) await details.locator(':scope > summary').click();
  await expect(details).toHaveAttribute('open', '');
}

/** Mixed cards open directly from practice; listening remains in course navigation. */
export async function openPracticeFeature(page: Page, feature: 'vocabulary' | 'listening' | 'textbook'): Promise<void> {
  const lesson = Number(await page.locator('#module-host').getAttribute('data-lesson')) || 1;
  await navigateFeature(page, feature, lesson);
  await expect(page.locator(feature === 'vocabulary' ? '#vocabulary-module' : `#${feature}-module`)).toBeVisible();
}

export async function selectDialogueScene(page: Page, index: number): Promise<void> {
  if (await page.locator('#scene-select').isVisible()) await page.locator('#scene-select').selectOption(String(index));
  else await page.locator('[data-scene-tab]').nth(index).click();
}
