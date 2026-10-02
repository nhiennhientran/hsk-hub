import { readFile } from 'node:fs/promises';
import { test, expect, type Locator, type Page } from '@playwright/test';
import { createExerciseCatalogue } from '../../src/domain/exercises/catalogue.ts';

const storageKey = 'ran_hsk1_modular_v1';
const legacy = JSON.parse(await readFile(new URL('../../content/legacy-exercises.json', import.meta.url), 'utf8'));
const bank = JSON.parse(await readFile(new URL('../../content/stage2-bank.json', import.meta.url), 'utf8'));
const catalogue = createExerciseCatalogue(legacy, bank);
async function auth(page: Page) { await page.addInitScript(() => sessionStorage.setItem('hsk_portal_unlocked_v2', '1')); }
async function ready(page: Page) { await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'ready'); }
async function pair(host: Locator, zh: string, vi: string) {
  await expect(host.locator(':scope > [lang=zh]')).toHaveText(zh);
  await expect(host.locator(':scope > [lang=vi]')).toHaveText(vi);
}
async function saved(page: Page) { await expect(page.locator('#exercise-save-status')).toHaveAttribute('data-state', 'saved'); }

test('restored exercise controls are bilingual at mobile width without changing question or option payloads', async ({ page }) => {
  await auth(page); await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/#/exercises?lesson=1&set=original&group=choice&filter=all'); await ready(page);
  await pair(page.locator('#exercises-module > h1'), '综合练习', 'Luyện tập tổng hợp');
  await pair(page.locator('[data-exercise-set=original]'), '综合练习 · 300题', 'Luyện tổng hợp · 300 câu');
  await pair(page.locator('[data-exercise-group=choice]'), '选择题', 'Chọn đáp án');
  await expect(page.locator('#exercise-filter')).toHaveAccessibleName('筛选题目 · Câu cần luyện');
  await expect(page.locator('#exercise-filter option')).toHaveText([
    '全部题目 · Tất cả câu', '最近答错的题目 · Câu gần nhất còn sai', '已到复习时间 · Câu đã đến hạn',
  ]);
  await expect(page.locator('.exercise-navigator button').first()).toHaveAccessibleName('打开第1题 · Mở câu 1');
  const entry = catalogue.entryById.get('original:l01-choice-01')!;
  const task = catalogue.tasks.get(entry.authorityId)!; expect(task.kind).toBe('choice'); if (task.kind !== 'choice') return;
  await expect(page.locator('.exercise-question > p').first()).toHaveText(entry.prompt ?? task.prompt);
  await expect(page.locator('.exercise-question fieldset label')).toHaveText((entry.optionOrder ?? task.options.map((_, index) => index)).map(index => task.options[index]!));
  await expect(page.locator('#exercise-feedback')).toBeEmpty();
  await page.locator('#exercise-submit').click();
  await pair(page.locator('#exercise-message'), '请完成作答后再提交', 'Hãy trả lời đầy đủ trước khi nộp.');
  await page.locator(`input[name=exercise-answer][value="${task.answer}"]`).check(); await page.locator('#exercise-submit').click();
  await expect(page.locator('#exercise-feedback')).toHaveAttribute('data-result', 'correct');
  await pair(page.locator('#exercise-feedback h3'), '回答正确', 'Đúng');
  await pair(page.locator('#exercise-submit'), '重做此题', 'Làm lại câu này');
  await pair(page.locator('#exercise-summary'), '已提交：1/5 · 首次答对：1 · 最近答对：1', 'Đã nộp: 1/5 · Đúng lần đầu: 1 · Đúng gần nhất: 1');
  await saved(page); await pair(page.locator('#exercise-save-status'), '已保存在此设备', 'Đã lưu trên thiết bị này');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  const heights = await page.locator('.exercise-actions button').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().height));
  expect(heights.every(height => height >= 44)).toBe(true);
  await page.reload(); await ready(page); await expect(page.locator('#exercise-submit')).toHaveAttribute('data-action', 'redo');
});

test('manual IME safeguards, writing receipt and copied text stay bilingual without automatic grades or altered answers', async ({ page }) => {
  await auth(page); await page.setViewportSize({ width: 320, height: 740 });
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text: string) => { (window as any).__exerciseCopiedText = text; } } }));
  await page.goto('/#/exercises?lesson=9&set=pilot&group=translation&filter=all'); await ready(page);
  const input = page.locator('#exercise-writing');
  await pair(page.locator('[data-exercise-group=translation]'), '翻译书写 · 教师批阅', 'Dịch tự viết · giáo viên xem');
  await input.evaluate(node => { node.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true })); (node as HTMLTextAreaElement).value = '字'.repeat(4001); });
  await page.locator('#exercise-submit').click();
  await pair(page.locator('#exercise-message'), '请先完成文字输入，再提交', 'Hãy hoàn tất nhập chữ rồi nộp bài.');
  await input.dispatchEvent('compositionend'); await page.locator('#exercise-next').click();
  await pair(page.locator('#exercise-message'), '书写内容超过4,000字，请缩短后再离开此题', 'Bài viết vượt 4.000 ký tự; hãy rút ngắn trước khi rời câu.');
  await expect(input).toHaveValue('字'.repeat(4001));
  const written = '我的原文\n  保留空格。'; await input.fill(written); await page.locator('#exercise-submit').click();
  await pair(page.locator('#exercise-feedback h3'), '书写已保存 · 等待教师批阅', 'Đã lưu bài viết · chờ giáo viên xem');
  await expect(page.locator('#exercise-feedback')).toHaveAttribute('data-result', 'manual');
  await expect(page.locator('#exercise-feedback p')).toHaveCount(0); await saved(page);
  await page.locator('#exercise-sheet-show').click();
  await pair(page.locator('#exercise-writing-sheet > h2'), '书写单 · 第9课 · 第9课拓展 · 30题', 'Phiếu bài viết · Bài 9 · Bài 9 mở rộng · 30 câu');
  expect(await page.locator('.exercise-written-answer').first().textContent()).toBe(written);
  await page.locator('#exercise-sheet-copy').click();
  await pair(page.locator('#exercise-message'), '书写内容已复制，可以发送给老师', 'Đã sao chép bài viết. Bạn có thể gửi cho giáo viên.');
  const copied = await page.evaluate(() => (window as any).__exerciseCopiedText);
  expect(copied).toContain(written); expect(copied).toContain('教师批阅'); expect(copied).toContain('giáo viên xem');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.locator('#exercise-sheet-close').click(); await expect(input).toHaveValue(written); await expect(input).toBeDisabled();
  const state = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).data.exercises, storageKey);
  expect(state.records['legacy:9-t1'].submissions[0]).toMatchObject({ correct: null, answer: written });
});

test('wrong and due review paths keep both languages and clarify submitted-only automatic queues', async ({ page }) => {
  await auth(page); await page.goto('/#/review?lesson=1'); await ready(page);
  const links = page.locator('.review-paths a'); await expect(links).toHaveCount(3);
  await pair(links.nth(0).locator('span.bilingual-stacked'), '作业错题', 'Câu bài tập còn sai');
  await pair(links.nth(1).locator('span.bilingual-stacked'), '作业到期复习', 'Câu bài tập đến hạn');
  await pair(links.nth(2).locator('span.bilingual-stacked'), '原题到期复习', 'Ôn bài tập gốc');
  await links.nth(0).click(); await ready(page); await expect(page).toHaveURL(/set=homework-review.*filter=wrong/);
  await pair(page.locator('.exercise-question h2'), '暂无符合条件的题目', 'Chưa có câu phù hợp');
  await pair(page.locator('.exercise-question p'), '错题和到期题目只根据已提交的答题记录生成；书写题不进入自动评分列表', 'Câu sai và câu đến hạn chỉ dựa trên bài đã nộp. Bài tự viết không vào danh sách tự chấm.');
  await page.locator('#exercise-filter').selectOption('due'); await ready(page);
  await expect(page.locator('.exercise-navigator button')).toHaveCount(0);
  await pair(page.locator('.exercise-question h2'), '暂无符合条件的题目', 'Chưa có câu phù hợp');
});

test('pending saves and real storage failures are distinct bilingual states and retry preserves the draft', async ({ page }) => {
  await auth(page); await page.goto('/#/exercises?lesson=9&set=pilot&group=translation&filter=all'); await ready(page); await saved(page);
  await page.evaluate(key => {
    const original = Storage.prototype.setItem;
    (window as any).__exerciseFailWrite = true;
    Storage.prototype.setItem = function (name, value) {
      if (this === localStorage && name === key && (window as any).__exerciseFailWrite) throw new DOMException('Test quota failure', 'QuotaExceededError');
      return original.call(this, name, value);
    };
  }, storageKey);
  const pending = await page.locator('#exercise-writing').evaluate(node => {
    (node as HTMLTextAreaElement).value = '未保存的原文'; node.dispatchEvent(new Event('input', { bubbles: true }));
    const status = document.querySelector('#exercise-save-status') as HTMLElement;
    return { state: status.dataset.state, issue: status.dataset.hasIssue, zh: status.querySelector('[lang=zh]')?.textContent, vi: status.querySelector('[lang=vi]')?.textContent };
  });
  expect(pending).toEqual({ state: 'unsaved', issue: 'false', zh: '正在等待保存到此设备…', vi: 'Đang chờ lưu trên thiết bị…' });
  await expect(page.locator('#exercise-save-status')).toHaveAttribute('data-has-issue', 'true');
  await pair(page.locator('#exercise-save-status'), '设备存储已满，尚未保存；草稿仍保留，可下载备份', 'Bộ nhớ đã đầy. Chưa lưu; bản nháp vẫn còn và có thể tải bản sao lưu.');
  await expect(page.locator('#exercise-save-retry')).toBeVisible();
  await page.evaluate(() => { (window as any).__exerciseFailWrite = false; }); await page.locator('#exercise-save-retry').click(); await saved(page);
  await expect(page.locator('#exercise-save-retry')).toBeHidden(); await page.reload(); await ready(page);
  await expect(page.locator('#exercise-writing')).toHaveValue('未保存的原文');
});

test('listening controls remain bilingual while transcripts stay hidden until submission', async ({ page }) => {
  await auth(page); await page.goto('/#/exercises?lesson=1&set=original&group=listening&filter=all'); await ready(page);
  await pair(page.locator('#exercise-audio-play'), '播放原音', 'Nghe audio gốc');
  await pair(page.locator('#exercise-audio-replay'), '重播', 'Nghe lại');
  await expect(page.locator('.exercise-player select')).toHaveAccessibleName('播放速度 · Tốc độ nghe');
  await pair(page.locator('.exercise-player [role=status]'), '可以播放', 'Sẵn sàng nghe');
  await expect(page.locator('#exercise-feedback')).toBeEmpty(); await expect(page.locator('.exercise-question')).not.toContainText('Wáng lǎoshī');
  await page.locator('input[name=exercise-answer][value="1"]').check(); await page.locator('#exercise-submit').click();
  await expect(page.locator('#exercise-feedback')).toContainText('王老师，你好！');
  await expect(page.locator('#exercise-feedback')).toContainText('Wáng lǎoshī');
});
