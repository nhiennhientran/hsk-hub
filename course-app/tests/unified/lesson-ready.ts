import {expect, type Page, type Locator} from '@playwright/test';

export interface ActivityFixture {
  id: string;
  kind: string;
  targetRef: string;
  illustrationIds?: string[];
  fields: {id: string; input: string; optional?: boolean; answer?: unknown; illustrationId?: string}[];
}
export interface LessonFixture {
  number: number;
  id: string;
  warmup: {id: string}[];
  texts: {id: string; number: number}[];
  grammar: {id: string}[];
  sections: {id: string; kind: string}[];
  illustrationManifest: {id: string; textbookRelation?: {owner: string}}[];
  courseId: string;
  title: {zh: string};
  activities: ActivityFixture[];
}
export function sourceActivity(lesson: LessonFixture, suffix: string): ActivityFixture {
  const matches = lesson.activities.filter(a => a.id.endsWith(':' + suffix));
  expect(matches, `One source activity for ${suffix}`).toHaveLength(1);
  return matches[0];
}
export async function expectLessonReady(page: Page, lesson: LessonFixture, section: string, scene = 1) {
  const level = lesson.courseId.startsWith('hsk2') ? 2 : 3;
  await expect(page.locator('main h1')).toContainText(lesson.title.zh);
  await expect(page.locator('.textbook-module')).toHaveAttribute('data-section', section);
  await expect(page.locator(`.level-switch a[data-level="${level}"]`)).toHaveAttribute('aria-current', 'true');
  if (section === 'text') {
    const activeScene = page.locator('.scene-tabs a[aria-current="page"]');
    await expect(activeScene).toHaveCount(1);
    await expect(activeScene).toContainText('课文' + scene);
    await expect(activeScene).toHaveAttribute('href', new RegExp('(?:[&#])scene=' + scene + '(?:&|$)'));
  }
  const inventory = sourceViewInventory(lesson, section, scene);
  await expect(page.locator('[data-activity-id]')).toHaveCount(inventory.activities.length);
  await expect.poll(() => page.locator('[data-activity-id]').evaluateAll(nodes => nodes.map(n => (n as HTMLElement).dataset.activityId!).sort())).toEqual(inventory.activities);
  await expect(page.locator('main figure[data-illustration-id]')).toHaveCount(inventory.illustrations.length);
  await expect.poll(() => page.locator('main figure[data-illustration-id]').evaluateAll(nodes => nodes.map(n => (n as HTMLElement).dataset.illustrationId!).sort())).toEqual(inventory.illustrations);
  await expect(page.locator('main img')).toHaveCount(inventory.illustrations.length);
  await expect(page.locator('.save-status')).toHaveAttribute('data-status', 'saved');
}
export async function openLesson(page: Page, lesson: LessonFixture, section: string, scene = 1) {
  const level = lesson.courseId.startsWith('hsk2') ? 2 : 3;
  await page.goto(`/#view=lesson&level=${level}&lesson=${lesson.number}&section=${section}&scene=${scene}`);
  await expectLessonReady(page, lesson, section, scene);
}
export function submitLabel(activity: ActivityFixture) {
  return ['survey', 'self-assessment'].includes(activity.kind) ? '保存本次记录' : '提交并查看反馈';
}
export async function activityReady(page: Page, activity: ActivityFixture): Promise<Locator> {
  const group = page.locator(`[data-activity-id="${activity.id}"]`);
  await expect(group).toHaveCount(1);
  await expect(group.locator('input, textarea, select')).toHaveCount(activity.fields.length);
  for (const field of activity.fields) {
    const tag = field.input === 'select' ? 'select' : field.input === 'textarea' ? 'textarea' : 'input';
    const control = group.locator(`${tag}[id="${field.id}"]`);
    await expect(control).toHaveCount(1);
    if (tag === 'input') await expect(control).toHaveAttribute('type', field.input === 'checkbox' ? 'checkbox' : 'text');
  }
  await expect(group.getByRole('button', {name: submitLabel(activity)})).toBeVisible();
  return group;
}
// Normal save only. Deliberately delayed/racing flows must use their explicit lock protocol instead.
export async function submitSaved(page: Page, lesson: LessonFixture, activity: ActivityFixture) {
  const group = await activityReady(page, activity);
  const expected: Record<string, string | boolean> = {};
  for (const field of activity.fields) {
    const control = group.locator(`[id="${field.id}"]`);
    expected[field.id] = field.input === 'checkbox' ? await control.isChecked() : await control.inputValue();
    if (field.input !== 'checkbox' && field.optional !== true) expect(String(expected[field.id]).trim(), field.id + ' must be filled').not.toBe('');
  }
  await group.getByRole('button', {name: submitLabel(activity)}).click();
  await expect(page.locator('.save-status')).toHaveAttribute('data-status', 'saved');
  const key = lesson.courseId.startsWith('hsk2') ? 'ran_hsk2_fltrp_2026_v1' : 'ran_hsk3_fltrp_2026_v1';
  await expect.poll(() => page.evaluate(({key, id, fields}) => {
    const record = JSON.parse(localStorage.getItem(key) ?? 'null')?.data.activities[id];
    return {checked: Number(record?.checkedAt) > 0, values: Object.fromEntries(fields.map(field => [field.id, record?.values[field.id] ?? (field.input === 'checkbox' ? false : '')]))};
  }, {key, id: activity.id, fields: activity.fields})).toEqual({checked: true, values: expected});
  await expect(group.locator('.activity-feedback')).not.toBeEmpty();
}
export async function submitIncomplete(page: Page, activity: ActivityFixture) {
  const group = await activityReady(page, activity);
  await group.getByRole('button', {name: submitLabel(activity)}).click();
  await expect(group.locator('.activity-feedback')).toContainText('请先完成本组输入');
  await expect(group.locator('.activity-feedback')).toContainText('Hãy điền hết nhóm này trước');
  await expect(group.locator('.feedback-correct,.feedback-retry')).toHaveCount(0);
}

export function singleAnswerFields(activity: ActivityFixture) {
  return activity.fields.map(field => {
    expect(typeof field.answer, field.id + ' must have one official string answer').toBe('string');
    if (typeof field.answer !== 'string') throw Error('Not a single-answer field: ' + field.id);
    return {...field, answer: field.answer};
  });
}

// Expected inventory comes from independently reviewed source bindings, before any DOM enumeration.
export function sourceViewInventory(lesson: LessonFixture, section: string, scene = 1) {
  const matches = (target: string, owner: string) => target === owner || target.startsWith(owner + ':') || target.startsWith(owner + '/');
  let activities: ActivityFixture[] = [];
  if (section === 'overview') activities = lesson.activities.filter(a => a.targetRef === 'objectives' || lesson.warmup.some(w => matches(a.targetRef, w.id)));
  else if (section === 'text') {
    const text = lesson.texts.find(t => t.number === scene);
    expect(text, 'Requested source scene exists').toBeDefined();
    activities = lesson.activities.filter(a => matches(a.targetRef, text!.id));
  } else if (section === 'grammar') activities = lesson.activities.filter(a => lesson.grammar.some(g => matches(a.targetRef, g.id)));
  else if (section === 'practice' || section === 'culture') {
    const sections = lesson.sections.filter(s => section === 'practice' ? ['practice', 'activity'].includes(s.kind) : !['practice', 'activity'].includes(s.kind));
    activities = lesson.activities.filter(a => sections.some(s => matches(a.targetRef, s.id)));
  }
  const ids = new Set(activities.flatMap(a => [...(a.illustrationIds ?? []), ...a.fields.flatMap(f => f.illustrationId ? [f.illustrationId] : [])]));
  const owner = section === 'text' ? lesson.texts.find(t => t.number === scene)?.id : section === 'culture' ? lesson.id + ':culture' : null;
  if (owner) for (const image of lesson.illustrationManifest) if (image.textbookRelation?.owner === owner) ids.add(image.id);
  return {activities: activities.map(a => a.id).sort(), illustrations: [...ids].sort()};
}
