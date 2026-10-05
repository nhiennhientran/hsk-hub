import {test, expect, type Page} from '@playwright/test';
import raw2 from '../../content/hsk2/lesson-01.json' with {type: 'json'};
import raw3 from '../../content/hsk3/lesson-01.json' with {type: 'json'};
import {configs} from '../../src/config.ts';
import {blank, captureDraftAnswer, captureListeningDraftAnswer, questionRevision, type State} from '../../src/state.ts';
import type {Lesson} from '../../src/types.ts';

// All edited texts below are synthetic ownership probes, never textbook acceptance.
const lessons = {2: raw2 as unknown as Lesson, 3: raw3 as unknown as Lesson};
async function seed(page: Page, level: 2 | 3, data: State) {
  await page.addInitScript(({key, app, data}) => {
    sessionStorage.setItem('hsk_portal_unlocked_v2', '1');
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({app, schema: 1, revision: 7, updatedAt: 1000, data, recovery: null}));
  }, {key: configs[level].storageKey, app: configs[level].id, data});
}
const stored = (page: Page, level: 2 | 3): Promise<State> =>
  page.evaluate(key => JSON.parse(localStorage.getItem(key)!).data, configs[level].storageKey);

for (const level of [2, 3] as const) {
  test(`HSK${level} inactive legacy draft can repair an answer and captures only the current shown questions`, async ({page}) => {
    const lesson = lessons[level], questions = lesson.homework.filter(q => q.part === 'vocabGrammar'), q = questions[0]!, key = lesson.id + ':vocabGrammar';
    const initial = blank(configs[level]); initial.drafts[key] = {answers: {[q.id]: 99}, updatedAt: 500};
    await seed(page, level, initial); await page.goto(`/#view=homework&level=${level}&lesson=1&part=vocabGrammar`);
    const form = page.locator('#assignment'); await expect(form).toHaveAttribute('data-draft-question-snapshot', 'current');
    await expect(form.locator('fieldset').first()).toBeEnabled();
    await expect(page.getByRole('button', {name: '按当前题目继续草稿'})).toHaveCount(0);
    await form.locator(`input[name="${q.id}"][value="${q.answer}"]`).check();
    await expect(form).toHaveAttribute('data-draft-question-snapshot', 'saved');
    await expect(page.locator('.save-status')).toHaveAttribute('data-status', 'saved');
    const after = await stored(page, level); expect(after.drafts[key]!.questions).toEqual(questions);
    expect(after.drafts[key]!.answers[q.id]).toBe(q.answer); expect(after.homework).toEqual({});
    await page.reload(); await expect(form).toHaveAttribute('data-draft-question-snapshot', 'saved');
    await expect(form.locator(`input[name="${q.id}"][value="${q.answer}"]`)).toBeChecked();
    expect((await stored(page, level)).drafts[key]).toEqual(after.drafts[key]);
  });
  test(`HSK${level} VI-only saved draft keeps its old prompt through actual submit and reload`, async ({page}) => {
    const lesson = lessons[level], current = lesson.homework.filter(q => q.part === 'vocabGrammar'), earlier = structuredClone(current), key = lesson.id + ':vocabGrammar';
    earlier[0]!.prompt.vi = 'SYNTHETIC earlier saved draft wording';
    let draft; for (const q of earlier) draft = captureDraftAnswer(draft, earlier, q.id, q.answer!, 1000);
    const initial = blank(configs[level]); initial.drafts[key] = draft!;
    await seed(page, level, initial); await page.goto(`/#view=homework&level=${level}&lesson=1&part=vocabGrammar`);
    const form = page.locator('#assignment'); await expect(form).toHaveAttribute('data-draft-question-snapshot', 'saved');
    await expect(form.locator('legend').first()).toContainText(earlier[0]!.prompt.vi);
    await form.getByRole('button', {name: '提交并查看结果'}).click();
    await expect(page.locator('#receipt')).toBeVisible();
    const history = (await stored(page, level)).homework[key]!;
    expect(history.first!.questions).toEqual(earlier); expect(history.latest!.correct).toBe(earlier.length);
    expect(history.latest!.contentRevision).toBe(questionRevision(earlier));
    expect((await stored(page, level)).drafts[key]).toBeUndefined();
    await page.reload(); await expect(page.locator('#receipt ol')).toContainText(earlier[0]!.prompt.vi);
    expect((await stored(page, level)).homework[key]).toEqual(history);
  });
  test(`HSK${level} changed sealed question remains read-only and the original draft is exportable`, async ({page}) => {
    const lesson = lessons[level], earlier = structuredClone(lesson.homework.filter(q => q.part === 'vocabGrammar')), key = lesson.id + ':vocabGrammar';
    earlier[0]!.prompt.zh += '（SYNTHETIC earlier sealed question）';
    const initial = blank(configs[level]); initial.drafts[key] = captureDraftAnswer(undefined, earlier, earlier[0]!.id, earlier[0]!.answer!, 1000);
    await seed(page, level, initial); await page.goto(`/#view=homework&level=${level}&lesson=1&part=vocabGrammar`);
    const form = page.locator('#assignment'); await expect(form).toHaveAttribute('data-draft-question-snapshot', 'incompatible');
    await expect(form.locator('legend').first()).toContainText(earlier[0]!.prompt.zh);
    for (const field of await form.locator('fieldset').all()) {
      expect(await field.evaluate(node => (node as HTMLFieldSetElement).disabled)).toBe(true);
      for (const control of await field.locator('input,textarea,button,select').all()) await expect(control).toBeDisabled();
    }
    await expect(form.getByRole('button', {name: '提交并查看结果'})).toBeDisabled();
    expect(await stored(page, level)).toEqual(initial);
    await page.goto(`/#view=progress&level=${level}`);
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', {name: '下载完整备份'}).click()]);
    const stream = await download.createReadStream(); expect(stream).not.toBeNull();
    const chunks: Buffer[] = []; for await (const chunk of stream!) chunks.push(chunk);
    expect(JSON.parse(Buffer.concat(chunks).toString('utf8')).current.data.drafts[key]).toEqual(initial.drafts[key]);
  });
  test(`HSK${level} listening captures an actual choice without invalidating its submit closure`, async ({page}) => {
    const lesson = lessons[level], q = lesson.listening[0]!, initial = blank(configs[level]);
    initial.listeningRound = {selected: [1], limit: 5, wrongOnly: false, queue: [q.id], index: 0,
      answers: {}, submitted: {}, playCounts: {}, startedAt: 1000};
    await seed(page, level, initial); await page.goto(`/#view=listening&level=${level}`);
    const card = page.locator('.listening-module .activity-card'); await expect(card).toHaveAttribute('data-draft-question-snapshot', 'current');
    await page.screenshot({path: test.info().outputPath(`hsk${level}-whole-passage-listening.png`), fullPage: true});
    await card.locator(`input[value="${q.answer}"]`).check();
    await expect(page.locator('.save-status')).toHaveAttribute('data-status', 'saved');
    expect((await stored(page, level)).listeningRound!.questionSnapshots![q.id]!.question).toEqual(q);
    await card.getByRole('button', {name: '提交本题'}).click();
    await expect(card).toHaveAttribute('data-question-snapshot', 'saved');
    const attempt = (await stored(page, level)).listeningRound!.submitted[q.id]!;
    expect(attempt.questions).toEqual([q]); expect(attempt.correct).toBe(1);
    await page.reload(); await expect(card).toHaveAttribute('data-question-snapshot', 'saved');
    expect((await stored(page, level)).listeningRound!.submitted[q.id]).toEqual(attempt);
  });
  test(`HSK${level} saved listening VI draft uses its captured wording when answers and receipt are saved`, async ({page}) => {
    const q = structuredClone(lessons[level].listening[0]!); q.prompt.vi = 'SYNTHETIC earlier unsubmitted listening wording';
    const initial = blank(configs[level]); initial.listeningRound = captureListeningDraftAnswer({selected: [1], limit: 5,
      wrongOnly: false, queue: [q.id], index: 0, answers: {}, submitted: {}, playCounts: {}, startedAt: 1000}, q, q.answer! as number);
    await seed(page, level, initial); await page.goto(`/#view=listening&level=${level}`);
    const card = page.locator('.listening-module .activity-card'); await expect(card).toHaveAttribute('data-draft-question-snapshot', 'saved');
    await expect(card.locator('h2')).toContainText(q.prompt.vi); await card.getByRole('button', {name: '提交本题'}).click();
    await expect(card).toHaveAttribute('data-question-snapshot', 'saved');
    expect((await stored(page, level)).listeningRound!.submitted[q.id]!.questions).toEqual([q]);
  });
}
