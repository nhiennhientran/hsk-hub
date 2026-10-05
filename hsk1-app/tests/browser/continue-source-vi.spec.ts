import {test,expect} from '@playwright/test';
import type {Page} from '@playwright/test';
const read=(page:Page)=>page.evaluate(()=>{const h=(window as unknown as {sourceViHarness:{activityId:string;oldVersion:string;newVersion:string;oldValue:string;newValue:string;historical:Record<string,string>;snapshot:()=>unknown}}).sourceViHarness;return {...h,snapshot:h.snapshot(),backup:undefined};});

test('accepted VI activity display archives its saved original and keeps both versions through reload',async({page})=>{
  await page.goto('/tests/browser/fixtures/official-vi-source-activities.html');await expect(page.locator('body')).toHaveAttribute('data-ready','true');
  const initial=await read(page),card=page.locator(`[data-activity-id="${initial.activityId}"]`);
  await expect(card).toHaveAttribute('data-activity-version',initial.newVersion);await expect(card).toContainText(initial.newValue);
  const archive=page.locator('.source-archive');await expect(archive).toBeVisible();await archive.locator('summary').click();await expect(archive).toContainText(initial.oldValue);await expect(archive).toContainText(initial.oldVersion);
  const input=card.locator('[data-source-field]').first();
  if(await input.evaluate(node=>node.tagName)==='SELECT')await input.selectOption({index:1});else await input.fill('新的草稿');
  await expect(page.locator('[data-source-save-status]')).toHaveAttribute('data-state','saved');
  const before=await read(page);await page.reload();await expect(page.locator('body')).toHaveAttribute('data-ready','true');const after=await read(page);
  expect(after.snapshot).toEqual(before.snapshot);await expect(page.locator('.source-archive')).toContainText(initial.oldValue);
});
