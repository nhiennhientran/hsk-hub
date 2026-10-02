import { test, expect, type Page } from '@playwright/test';
const storageKey='ran_hsk1_modular_v1';
async function auth(page:Page){await page.addInitScript(()=>sessionStorage.setItem('hsk_portal_unlocked_v2','1'));}
async function ready(page:Page){await expect(page.locator('#module-host')).toHaveAttribute('data-state','ready');await expect(page.locator('#exercises-module')).toBeVisible();}
async function saved(page:Page){await expect(page.locator('#exercise-save-status')).toHaveAttribute('data-state','saved');}

test('original choice reload, wrong queue, redo, keyboard navigation and first-grade preservation',async({page})=>{
 await auth(page);await page.goto('/#/exercises?lesson=1&set=original&group=choice&filter=all');await ready(page);
 await expect(page.locator('.exercise-navigator button')).toHaveCount(5);await page.locator('input[name=exercise-answer][value="0"]').check();await page.locator('#exercise-submit').click();await expect(page.locator('#exercise-feedback')).toContainText('Chưa đúng');await saved(page);
 await page.reload();await ready(page);await expect(page.locator('#exercise-submit')).toHaveAttribute('data-action','redo');await expect(page.locator('#exercise-summary')).toContainText('Đúng lần đầu: 0');
 await page.locator('#exercise-filter').selectOption('wrong');await ready(page);await expect(page.locator('.exercise-navigator button')).toHaveCount(1);await page.locator('#exercise-submit').click();await page.locator('input[name=exercise-answer][value="2"]').check();await page.locator('#exercise-submit').click();await saved(page);
 const state=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).data.exercises,storageKey);expect(state.records['legacy:l01-choice-01'].submissions.map((x:any)=>x.correct)).toEqual([false,true]);
 await page.locator('#exercise-refresh').click();await expect(page.locator('.exercise-question')).toContainText('Chưa có câu phù hợp');
 await page.locator('#exercise-filter').selectOption('all');await ready(page);await page.locator('.exercise-navigator [data-exercise-entry="original:l01-choice-03"]').focus();await page.keyboard.press('Enter');await expect(page.locator('.exercise-question')).toHaveAttribute('data-exercise-entry','original:l01-choice-03');await saved(page);
 await page.reload();await ready(page);await expect(page.locator('.exercise-question')).toHaveAttribute('data-exercise-entry','original:l01-choice-03');
});
test('pilot full reading passage, manual draft, IME, receipt and reload never reveal answers',async({page})=>{
 await auth(page);await page.goto('/#/exercises?lesson=9&set=pilot&group=reading&filter=all');await ready(page);await expect(page.locator('.exercise-passage p')).toHaveCount(4);await expect(page.locator('.exercise-passage')).toContainText('陈天中：我明天上午在学校学习。');
 await page.locator('[data-exercise-group=translation]').click();await ready(page);const input=page.locator('#exercise-writing');await input.fill('我明天上午在学校学习。');await page.locator('#exercise-next').click();await expect(page.locator('.exercise-question')).toHaveAttribute('data-exercise-entry','pilot:9-t2');await page.locator('#exercise-previous').click();await expect(page.locator('#exercise-writing')).toHaveValue('我明天上午在学校学习。');
 await page.locator('#exercise-writing').evaluate(el=>{el.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true}));(el as HTMLTextAreaElement).value='输入法草稿';});
 await page.locator('[data-exercise-group=reading]').click();await ready(page);await page.locator('[data-exercise-group=translation]').click();await ready(page);await expect(page.locator('#exercise-writing')).toHaveValue('输入法草稿');
 await page.locator('#exercise-submit').click();await expect(page.locator('#exercise-feedback h3 [lang=vi]')).toHaveText('Đã lưu bài viết · chờ giáo viên xem');await expect(page.locator('#exercise-feedback')).not.toContainText('Đáp án:');await saved(page);
 await page.locator('#exercise-sheet-show').click();await expect(page.locator('#exercise-writing-sheet')).toContainText('输入法草稿');await expect(page.locator('#exercise-writing-sheet')).toContainText('Chưa viết');await page.locator('#exercise-sheet-close').click();
 const state=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).data.exercises,storageKey);expect(state.records['legacy:9-t1'].submissions[0].correct).toBeNull();
 await page.reload();await ready(page);await expect(page.locator('#exercise-writing')).toHaveValue('输入法草稿');await expect(page.locator('#exercise-writing')).toBeDisabled();await expect(page.locator('#exercise-summary')).toContainText('giáo viên xem, không tự chấm điểm');
});
test('original translations are automatic and listening transcript waits for submission',async({page})=>{
 await auth(page);await page.goto('/#/exercises?lesson=1&set=original&group=translation&filter=all');await ready(page);await expect(page.locator('input[name=exercise-answer]')).toHaveCount(4);await expect(page.locator('textarea')).toHaveCount(0);await page.locator('input[name=exercise-answer][value="2"]').check();await page.locator('#exercise-submit').click();await expect(page.locator('#exercise-feedback h3 [lang=vi]')).toHaveText('Đúng');
 await page.locator('[data-exercise-group=listening]').click();await ready(page);await expect(page.locator('.exercise-player')).toBeVisible();await expect(page.locator('#exercise-feedback')).toBeEmpty();await expect(page.locator('.exercise-question')).not.toContainText('Wáng lǎoshī');
 await page.locator('input[name=exercise-answer][value="1"]').check();await page.locator('#exercise-submit').click();await expect(page.locator('#exercise-feedback')).toContainText('王老师，你好！');await expect(page.locator('#exercise-feedback')).toContainText('Wáng lǎoshī');
});
test('mobile layout, back/forward and empty due queue',async({page})=>{
 await page.setViewportSize({width:375,height:812});await auth(page);await page.goto('/#/exercises?lesson=9&set=pilot&group=words&filter=all');await ready(page);await page.locator('[data-exercise-group=reading]').click();await ready(page);await expect(page.locator('.exercise-passage')).toBeVisible();await page.goBack();await ready(page);await expect(page.locator('.exercise-passage')).toHaveCount(0);await page.goForward();await ready(page);await expect(page.locator('.exercise-passage')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);await page.locator('#exercise-filter').selectOption('due');await ready(page);await expect(page.locator('.exercise-question')).toContainText('Chưa có câu phù hợp');
});
test('manual IME tails are not truncated and block submission and internal navigation until fixed',async({page})=>{
 await auth(page);await page.goto('/#/exercises?lesson=9&set=pilot&group=translation&filter=all');await ready(page);const input=page.locator('#exercise-writing');
 await input.evaluate(el=>{el.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true}));(el as HTMLTextAreaElement).value='字'.repeat(4001);el.dispatchEvent(new InputEvent('input',{bubbles:true,isComposing:true}));});
 await expect(input).not.toHaveAttribute('maxlength');await page.locator('#exercise-submit').click();await expect(page.locator('#exercise-message')).toContainText('hoàn tất nhập chữ');
 await input.dispatchEvent('compositionend');await expect(input).toHaveValue('字'.repeat(4001));await page.locator('#exercise-next').click();await expect(input).toHaveValue('字'.repeat(4001));
 await page.locator('#exercise-refresh').click();await expect(input).toHaveValue('字'.repeat(4001));await page.locator('#exercise-filter').selectOption('wrong');await expect(page.locator('#exercise-filter')).toHaveValue('all');await expect(input).toHaveValue('字'.repeat(4001));
 await page.locator('[data-exercise-group=reading]').click();await expect(input).toHaveValue('字'.repeat(4001));await input.fill('修正后的草稿');await page.locator('[data-exercise-group=reading]').click();await ready(page);await expect(page.locator('.exercise-passage')).toBeVisible();
});
test('replay before first playback of the next listening question uses its own original track',async({page})=>{
 await auth(page);await page.goto('/#/exercises?lesson=1&set=original&group=listening&filter=all');await ready(page);
 const first=page.waitForRequest(request=>request.url().includes('/course-assets/audio/1-1.mp3'));await page.locator('#exercise-audio-play').click();await first;
 await page.locator('#exercise-next').click();const second=page.waitForRequest(request=>request.url().includes('/course-assets/audio/1-3.mp3'));await page.locator('#exercise-audio-replay').click();await second;await expect(page.locator('.exercise-question')).toHaveAttribute('data-exercise-entry','original:l01-listening-02');
});


test('global navigation and browser Back retain an invalid writing tail until it can be saved', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('hsk_portal_unlocked_v2', '1'));
  await page.goto('/#/home?lesson=9');
  await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'ready');
  await page.locator('#feature-nav [data-feature="exercises"]').click();
  await page.locator('a[href="#/exercises?lesson=9&set=pilot&group=words&filter=all"]').click();
  await page.locator('a[href="#/exercises?lesson=9&set=pilot&group=translation&filter=all"]').click();
  const field = page.locator('#exercise-writing');
  await field.evaluate(node => { (node as HTMLTextAreaElement).value = '学'.repeat(4001); node.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.locator('#feature-nav [data-feature="home"]').click();
  await expect(field).toHaveValue('学'.repeat(4001));
  await expect(page.locator('#navigation-message')).toBeVisible();
  await page.locator('#lesson-select').selectOption('10');
  await expect(field).toHaveValue('学'.repeat(4001));
  await page.goBack();
  await expect(field).toHaveValue('学'.repeat(4001));
  await expect(page).toHaveURL(/set=pilot&group=translation/);
  await field.fill('我学习汉语。');
  await page.locator('#feature-nav [data-feature="home"]').click();
  await expect(page.locator('#module-host')).toHaveAttribute('data-feature', 'home');
});
