import {fileURLToPath} from 'node:url';
import {test,expect} from '@playwright/test';
const path='/tests/browser/fixtures/official-vi-history.html';
const run=(page: import('@playwright/test').Page, expression:string)=>page.evaluate(source=>(0,eval)(source),expression);
test.beforeEach(async({page})=>{await page.goto(path);await expect(page.locator('body')).toHaveAttribute('data-ready','true');});
test('synthetic same-clock receipt survives reload and shows first/latest immutable text with original answer indices',async({page})=>{
 await run(page,'viHarness.homework()');await page.reload();await expect(page.locator('body')).toHaveAttribute('data-ready','true');const raw=await run(page,'viHarness.receipt()');
 await expect(page.locator('.receipt-prompt').first()).toHaveText('Văn bản native A.');await expect(page.locator('[data-receipt-answer-id="hw30-v1-l01-choice-01"]')).toHaveText(raw.raw.options[raw.raw.answer]);
 await page.locator('#receipt-version').selectOption('latest');await expect(page.locator('.receipt-prompt').first()).toHaveText('Văn bản native B.');
 const before=await run(page,'viHarness.snapshot().data');await page.locator('#receipt-version').selectOption('first');expect(await run(page,'viHarness.snapshot().data')).toEqual(before);
 await page.screenshot({path:fileURLToPath(new URL('../../../course-app/docs/resume-20261004/b10-hsk1-adapter/native-ci-receipt-first.png',import.meta.url)),fullPage:true});
});
test('legacy archive shows each saved display binding and keeps raw task and answer visible',async({page})=>{
 await run(page,'viHarness.homework("legacy")');await run(page,'viHarness.archive()');const record=page.locator('[data-exercise-entry]').filter({has:page.locator('.archive-identity', {hasText:'l01-s2-choice-01'})}).first();
 await expect(record.locator('.archive-prompt')).toHaveText('Bạn vừa gặp cô Vương. Chọn lời chào có dùng cách xưng hô kính trọng.');await expect(record.locator('.archive-saved-display').nth(0)).toContainText('Văn bản native A.');await expect(record.locator('.archive-saved-display').nth(1)).toContainText('Văn bản native B.');
 const bindings=await record.locator('.archive-saved-display').evaluateAll(nodes=>nodes.map(n=>(n as HTMLElement).dataset.displayBinding));expect(bindings[0]).not.toEqual(bindings[1]);
 await page.screenshot({path:fileURLToPath(new URL('../../../course-app/docs/resume-20261004/b10-hsk1-adapter/native-ci-archive.png',import.meta.url)),fullPage:true});
});
test('listening shuffled labels use original indices and fixed round text after native reload',async({page})=>{
 const initial=await run(page,'viHarness.listening()');expect(initial.dto.options.map((o:{index:number})=>o.index)).toEqual(initial.raw.options.map((o:{index:number})=>o.index));expect(initial.dto.options.find((o:{index:number})=>o.index===0).text).toEqual('Nghĩa native riêng.');expect(initial.raw.feedback.correct).toBe(true);
 await page.reload();await expect(page.locator('body')).toHaveAttribute('data-ready','true');const reloaded=await run(page,'viHarness.listeningRead()');expect(reloaded.dto).toEqual(initial.dto);expect(reloaded.raw).toEqual(initial.raw);
});
