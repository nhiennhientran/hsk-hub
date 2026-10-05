import {test, expect} from '@playwright/test';

test.beforeEach(async ({page}) => {
  await page.addInitScript(() => sessionStorage.setItem('hsk_portal_unlocked_v2', '1'));
});

for (const level of [2, 3]) {
  test(`HSK${level} rejected lesson change retains the current selector and composing draft`, async ({page}) => {
    await page.goto(`/#view=homework&level=${level}&lesson=1&part=writing`);
    const input = page.locator('#assignment textarea').first();
    const select = page.locator('#lesson-select');
    const key = `ran_hsk${level}_fltrp_2026_v1`;
    const draft = '  正在输入的中文\n保留原始换行  ';
    await input.dispatchEvent('compositionstart');
    await input.fill(draft);
    await select.selectOption('2');

    // A rejected navigation must agree with both the displayed lesson and URL.
    await expect(select).toHaveValue('1');
    await expect(page).toHaveURL(new RegExp(`level=${level}&lesson=1&part=writing$`));
    await expect(input).toHaveValue(draft);
    await expect(page.locator('#assignment textarea')).toHaveCount(5);

    await input.dispatchEvent('compositionend');
    await select.selectOption('2');
    await expect(select).toHaveValue('2');
    await expect(page).toHaveURL(new RegExp(`level=${level}&lesson=2&part=writing$`));
    await expect(page.locator('#assignment textarea').first()).toHaveValue('');
    const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).data, key);
    const firstLesson = `hsk${level}-fltrp-2026:l01:writing`;
    expect(Object.values(saved.drafts[firstLesson].answers)).toContain(draft);
    expect(saved.homework).toEqual({});

    await select.selectOption('1');
    await expect(page.locator('#assignment textarea').first()).toHaveValue(draft);
    await page.reload();
    await expect(page.locator('#assignment textarea').first()).toHaveValue(draft);
  });

  test(`HSK${level} failed draft save rejects lesson change without misleading the selector`, async ({page}) => {
    await page.goto(`/#view=homework&level=${level}&lesson=1&part=writing`);
    const input = page.locator('#assignment textarea').first();
    const select = page.locator('#lesson-select');
    const key = `ran_hsk${level}_fltrp_2026_v1`;
    await input.fill('先前已保存的草稿');
    await expect(page.locator('.save-status')).toHaveAttribute('data-status', 'saved');
    const originalRaw = await page.evaluate(key => localStorage.getItem(key), key);
    expect(originalRaw).not.toBeNull();
    await page.evaluate(key => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function (name, value) {
        if (name === key) throw new DOMException('Fixture quota failure', 'QuotaExceededError');
        original.call(this, name, value);
      };
      (window as typeof window & {restoreContinueFlowStorage?: () => void}).restoreContinueFlowStorage = () => {
        Storage.prototype.setItem = original;
      };
    }, key);
    const draft = '保存失败后仍保留的答案';
    await input.fill(draft);
    await select.selectOption('2');

    await expect(select).toHaveValue('1');
    await expect(page).toHaveURL(new RegExp(`level=${level}&lesson=1&part=writing$`));
    await expect(page.locator('.global-message')).toContainText('未确认保存');
    await expect(input).toHaveValue(draft);
    expect(await page.evaluate(key => localStorage.getItem(key), key)).toEqual(originalRaw);

    await page.evaluate(() => (window as typeof window & {restoreContinueFlowStorage?: () => void}).restoreContinueFlowStorage?.());
    await select.selectOption('2');
    await expect(page).toHaveURL(new RegExp(`level=${level}&lesson=2&part=writing$`));
    await select.selectOption('1');
    await expect(page.locator('#assignment textarea').first()).toHaveValue(draft);
    await page.reload();
    await expect(page.locator('#assignment textarea').first()).toHaveValue(draft);
  });
}
