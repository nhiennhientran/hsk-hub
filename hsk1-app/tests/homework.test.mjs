import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import engine from '../src/domain/homework/engine.js';
import { createHomeworkController, HOMEWORK_LIMITS } from '../src/features/homework/controller.ts';
import { createStore, STORAGE_KEY } from '../src/services/storage/index.ts';
import { createCompatibility } from '../src/services/storage/compatibility.ts';

const json = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const bankFile = json('../content/stage2-bank.json');
const bank = bankFile.lessons;
const inventory = json('../review/corpus-inventory.json');
const accepted = inventory.sortAcceptedExpressions;
const compatibility = createCompatibility(bankFile, json('../content/stage3-catalog.json'), json('../content/textbook.json'));
const at = 1790812800000;
function setup() {
  const memory = new Map();
  const store = createStore({ storage: { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value) },
    blank: compatibility.blank, validate: compatibility.validate, lock: async task => task(), now: () => at });
  let edits = 0;
  const controller = (lesson, part, stamp = at) => createHomeworkController({ store, bank, lesson, part, now: () => stamp,
    onChange: () => { edits++; } });
  return { store, memory, controller, changes: () => edits };
}
const correctOrder = q => accepted.find(item => item.taskId === q.id).order;
// The baseline intentionally shuffles L12's first token list; reversing it would be correct.
const wrongOrder = q => q.id === 'l12-s2-sort-01' ? [0, 2, 1] : q.tokens.map((_, index) => index).reverse();
function fill(controller, answer) {
  for (const q of controller.read().questions) assert.equal(controller.answer(q.id, answer(q)).ok, true, q.id);
}
function unlockTranslation(ctx, lesson = 1) {
  const choice = ctx.controller(lesson, 'choice'); fill(choice, q => q.answer); assert.equal(choice.submit().ok, true);
  const sort = ctx.controller(lesson, 'sort'); fill(sort, correctOrder); assert.equal(sort.submit().ok, true);
  return ctx.controller(lesson, 'translation');
}

test('view reads and rejected actions do not create or dirty empty lesson groups', () => {
  const ctx = setup();
  for (let lesson = 1; lesson <= 15; lesson++) {
    const choice = ctx.controller(lesson, 'choice'); const sort = ctx.controller(lesson, 'sort');
    assert.equal(choice.read().group, null); assert.equal(choice.read().locked, false);
    assert.equal(sort.read().group, null); assert.equal(sort.read().locked, true);
    assert.equal(sort.ensureSortOrders().reason, 'locked'); assert.equal(sort.submit().reason, 'locked');
    assert.equal(choice.submit().reason, 'missing'); assert.equal(choice.submit().missing.length, 5);
    assert.equal(choice.answer('constructor', 0).reason, 'unknown');
    assert.equal(choice.restart().reason, 'invalid');
  }
  assert.deepEqual(ctx.store.snapshot().data.homework.lessons, {});
  assert.equal(ctx.store.snapshot().status, 'empty'); assert.equal(ctx.changes(), 0);
});

test('all 75 choice questions accept only the calibrated option among four choices', () => {
  const ctx = setup(); let checked = 0;
  for (const lesson of bank) {
    const controller = ctx.controller(lesson.lesson, 'choice');
    for (const q of lesson.choice) {
      for (let index = 0; index < 4; index++) {
        assert.equal(controller.answer(q.id, index).ok, true);
        assert.equal(controller.check(q.id), index === q.answer, `${q.id}:${index}`); checked++;
      }
      for (const invalid of [-1, 4, 0.5, '0', null]) assert.equal(controller.answer(q.id, invalid).reason, 'invalid');
    }
  }
  assert.equal(checked, 300);
});

test('all 95 frozen accepted sorting variants score correctly and each of 75 wrong orders is rejected', () => {
  assert.equal(accepted.length, 95);
  for (const variant of accepted) {
    const q = bank.find(row => row.lesson === variant.lesson).sort.find(row => row.id === variant.taskId);
    assert.equal(engine.check(q, variant.order), true, `${variant.taskId}:${variant.index}`);
  }
  let wrong = 0;
  for (const lesson of bank) for (const q of lesson.sort) {
    assert.equal(engine.check(q, wrongOrder(q)), false, q.id); wrong++;
    assert.equal(engine.isAnswered(q, correctOrder(q).slice(1)), false, q.id);
  }
  assert.equal(wrong, 75);
});

test('15 complete lessons retain first zero scores, latest full scores and 75 ungraded manual submissions', async () => {
  const ctx = setup(); const bankBefore = JSON.stringify(bank);
  for (const lesson of bank) {
    const choice = ctx.controller(lesson.lesson, 'choice');
    fill(choice, q => (q.answer + 1) % 4);
    assert.equal(choice.submit().correct, 0); assert.equal(choice.submit().reason, 'submitted');
    const sort = ctx.controller(lesson.lesson, 'sort'); assert.equal(sort.read().locked, false);
    fill(sort, wrongOrder); assert.equal(sort.submit().correct, 0);
    const manual = ctx.controller(lesson.lesson, 'translation'); assert.equal(manual.read().locked, false);
    fill(manual, q => `学生自由回答 ${q.id}\nTôi đang học tiếng Trung.`);
    const submission = manual.submit(); assert.equal(submission.manual, true); assert.equal(submission.correct, null);
    assert.equal(submission.attempt.results, null); assert.equal(submission.attempt.total, 5);
    for (const controller of [choice, sort]) {
      assert.equal(controller.restart().ok, true); assert.equal(manual.read().locked, false);
      fill(controller, q => q.kind === 'choice' ? q.answer : correctOrder(q));
      assert.equal(controller.submit().correct, 5);
      const group = controller.read().group; assert.equal(group.first.correct, 0); assert.equal(group.latest.correct, 5);
      assert.equal(group.history.length, 2); assert.equal(group.completed, true);
    }
  }
  const totals = ctx.controller(15, 'translation').read().courseTotals;
  assert.deepEqual(totals.homework, { total: 225, submitted: 225, completedGroups: 45, completedLessons: 15, lessonCount: 15, done: true });
  assert.deepEqual(totals.automatic, { total: 150, submitted: 150, firstCorrect: 0, latestCorrect: 150, firstPercent: 0, latestPercent: 100 });
  assert.deepEqual(totals.manual, { total: 75, submitted: 75, correct: null });
  assert.equal(totals.listening.submitted, 0); assert.equal(JSON.stringify(bank), bankBefore);
  assert.equal((await ctx.store.save()).ok, true);
  const loaded = JSON.parse(ctx.memory.get(STORAGE_KEY)); assert.deepEqual(loaded.data, ctx.store.snapshot().data);
});

test('manual original text and new draft stay separate through redo, save and backup import', async () => {
  const ctx = setup(); const manual = unlockTranslation(ctx);
  const original = '老师，您好！\n\nTiếng Việt có dấu. '.repeat(65);
  assert.ok(original.length > 1500);
  fill(manual, () => original); const submitted = manual.submit().attempt;
  assert.equal(manual.answer(manual.read().questions[0].id, '不能覆盖').reason, 'submitted');
  assert.equal(manual.restart().ok, true); assert.equal(manual.restart().reason, 'invalid');
  const firstId = manual.read().questions[0].id;
  assert.equal(manual.answer(firstId, '新草稿 B\nChưa nộp').ok, true);
  assert.equal(manual.submit().reason, 'missing');
  assert.equal(manual.read().group.attempt, null); assert.deepEqual(manual.read().group.latest, submitted);
  assert.equal(manual.read().group.first.answers[firstId], original); assert.equal(manual.check(firstId), null);
  assert.equal((await ctx.store.save()).ok, true);
  const restored = setup(); assert.equal((await restored.store.confirm(restored.store.previewBackup(ctx.store.exportBackup()))).ok, true);
  const group = restored.controller(1, 'translation').read().group;
  assert.equal(group.draft[firstId], '新草稿 B\nChưa nộp'); assert.equal(group.latest.answers[firstId], original);
  assert.equal(group.first.correct, null); assert.equal(group.first.results, null); assert.equal(group.completed, true);
});

test('blank invisible translations fail completion, long limits do not truncate drafts and profile remains bounded', () => {
  const ctx = setup(); const manual = unlockTranslation(ctx); const q = manual.read().questions[0];
  for (const blank of ['', '\n\t ', '\u200b\u200d\ufeff']) {
    assert.equal(manual.answer(q.id, blank).ok, true); assert.equal(manual.isAnswered(q.id), false);
  }
  const boundary = '汉'.repeat(engine.MAX_TRANSLATION_LENGTH);
  assert.equal(manual.answer(q.id, boundary).ok, true); assert.equal(manual.isAnswered(q.id), true);
  assert.equal(manual.answer(q.id, boundary + '字').reason, 'invalid'); assert.equal(manual.read().group.draft[q.id], boundary);
  assert.equal(manual.profile('name', 'Nguyễn 学生\n原文').ok, true);
  assert.equal(manual.profile('className', 'Lớp 01').ok, true);
  assert.equal(manual.profile('name', 'a'.repeat(201)).reason, 'invalid');
  assert.deepEqual(manual.read().profile, { name: 'Nguyễn 学生\n原文', className: 'Lớp 01' });
});

test('sorting orders survive remount, duplicates and partial drafts cannot submit, submitted order remains immutable', () => {
  const ctx = setup(); const choice = ctx.controller(1, 'choice'); fill(choice, q => q.answer); choice.submit();
  const sort = ctx.controller(1, 'sort'); assert.equal(sort.ensureSortOrders().ok, true);
  const before = sort.read().group.orders; const count = ctx.changes();
  assert.equal(ctx.controller(1, 'sort').ensureSortOrders().ok, true); assert.equal(ctx.changes(), count);
  for (const q of sort.read().questions) {
    assert.equal(new Set(before[q.id]).size, q.tokens.length);
    assert.notDeepEqual(before[q.id], q.tokens.map((_, index) => index));
    assert.equal(sort.answer(q.id, [0, 0]).reason, 'invalid');
    assert.equal(sort.answer(q.id, [q.tokens.length]).reason, 'invalid');
    assert.equal(sort.answer(q.id, Array(1)).reason, 'invalid');
    assert.equal(sort.answer(q.id, [0]).ok, true);
  }
  assert.equal(sort.submit().reason, 'missing');
  fill(sort, correctOrder); assert.equal(sort.submit().correct, 5);
  const completed = sort.read().group; const previousChanges = ctx.changes();
  assert.equal(sort.ensureSortOrders().reason, 'submitted'); assert.equal(sort.answer(sort.read().questions[0].id, []).reason, 'submitted');
  assert.equal(ctx.changes(), previousChanges); assert.deepEqual(sort.read().group, completed);
  assert.equal(sort.restart().ok, true); assert.deepEqual(sort.read().group.draft, {});
  assert.equal(Object.keys(sort.read().group.orders).length, 5); assert.equal(sort.read().group.latest.correct, 5);
});

test('retained history stays bounded while first attempt and unrelated learning domains remain intact', () => {
  const ctx = setup();
  ctx.store.edit(data => { data.reading.lessons['7'] = { visited: true, complete: true }; data.navigation = { feature: 'vocabulary', lesson: 7 };
    data.legacyRaw['hsk1_ranteacher_progress_v1'] = '{"7":true}'; });
  const unrelated = ctx.store.snapshot().data;
  for (let attempt = 0; attempt < 23; attempt++) {
    const choice = ctx.controller(1, 'choice', at + attempt);
    if (attempt) assert.equal(choice.restart().ok, true);
    fill(choice, q => attempt ? q.answer : (q.answer + 1) % 4); assert.equal(choice.submit().ok, true);
  }
  const after = ctx.store.snapshot().data; const group = after.homework.lessons['1'].choice;
  assert.equal(group.history.length, 20); assert.equal(group.history[0].at, at + 3);
  assert.equal(group.first.at, at); assert.equal(group.first.correct, 0); assert.equal(group.latest.correct, 5);
  for (const key of ['reading', 'practice', 'navigation', 'legacyRaw']) assert.deepEqual(after[key], unrelated[key]);
});


test('view limits and navigation availability reuse the canonical homework rules', () => {
  assert.deepEqual(HOMEWORK_LIMITS, { text: engine.MAX_TRANSLATION_LENGTH, profile: engine.MAX_PROFILE_LENGTH });
  assert.equal(Object.isFrozen(HOMEWORK_LIMITS), true);
  const ctx = setup();
  const choice = ctx.controller(1, 'choice');
  for (const part of ['choice', 'sort', 'translation']) assert.equal(choice.canOpen(part), engine.canOpen(ctx.store.snapshot().data.homework, 1, part));
  unlockTranslation(ctx);
  for (const part of ['choice', 'sort', 'translation']) assert.equal(choice.canOpen(part), true);
});
