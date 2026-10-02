import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import legacy from '../src/domain/homework/engine.js';
import { getHomework30Bank, validateHomework30Bank, homework30Audio } from '../src/services/content/homework30.ts';
import { HOMEWORK30_PARTS, blankHomework30, homework30Group, submitHomework30, validateHomework30, homework30Check, homework30CourseTotals, restartHomework30 } from '../src/domain/homework30/engine.ts';
import { createHomework30Controller } from '../src/features/homework/controller30.ts';
import { createCompatibility } from '../src/services/storage/compatibility.ts';
import { createStore, STORAGE_KEY } from '../src/services/storage/index.ts';
import { summarizeHomework30 } from '../src/services/learning/homework30-progress.ts';
import { parseRoute, routeHref } from '../src/app/router.ts';
const json = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const oldBank = json('../content/stage2-bank.json');
const bank = getHomework30Bank();
const compatibility = createCompatibility(oldBank, json('../content/stage3-catalog.json'), json('../content/textbook.json'));
const at = 1790812800000;
function correctOrder(q) {
  const wanted = legacy.normal(q.answers[0]);
  const search = (indices, prefix, result) => {
    if (!indices.length) return prefix === wanted ? result : null;
    for (const i of indices) {
      const next = prefix + legacy.normal(q.tokens[i]); if (!wanted.startsWith(next)) continue;
      const found = search(indices.filter(j => j !== i), next, [...result, i]); if (found) return found;
    }
    return null;
  };
  return search(q.tokens.map((_, i) => i), '', []);
}
const answer = q => q.kind === 'translation' ? `中文写作\n${q.id}，未经自动评分。` : q.kind === 'sort' ? correctOrder(q) : q.answer;
function complete(state, lesson, parts = HOMEWORK30_PARTS, time = at) {
  for (const part of parts) {
    homework30Group(state, lesson.lesson, part).draft = Object.fromEntries(lesson[part].map(q => [q.id, answer(q)]));
    assert.equal(submitHomework30(state, lesson, part, time).ok, true);
  }
}
function setup(seed = compatibility.blank()) {
  const memory = new Map(); const store = createStore({ storage: { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value) }, blank: () => structuredClone(seed), validate: compatibility.validate, lock: async task => task(), now: () => at });
  let changes = 0;
  return { store, memory, changes: () => changes, controller: (lesson, part) => createHomework30Controller({ store, bank, lesson, part, now: () => at, onChange: () => changes++ }) };
}
test('all 450 distinct questions submit with 375 automatic results and 75 genuinely ungraded writing answers', () => {
  const state = blankHomework30();
  for (const lesson of bank) {
    complete(state, lesson);
    for (const part of HOMEWORK30_PARTS) {
      const group = state.lessons[lesson.lesson][part];
      assert.equal(group.first.total, part === 'choice' ? 10 : 5);
      assert.equal(group.first.correct, part === 'translation' ? null : group.first.total);
      assert.equal(group.first.results === null, part === 'translation');
      for (const q of lesson[part]) {
        assert.equal(group.first.questionFingerprints[q.id], q.fingerprint);
        if (q.kind === 'choice' || q.kind === 'listening') for (let i = 0; i < 4; i++) assert.equal(homework30Check(q, i), i === q.answer);
      }
    }
  }
  assert.deepEqual(validateHomework30(state, bank), state);
  assert.deepEqual(homework30CourseTotals(state).homework, { total: 450, submitted: 450, completedGroups: 75, completedLessons: 15, lessonCount: 15, done: true });
  assert.equal(homework30CourseTotals(state).automatic.firstCorrect, 375);
  assert.equal(homework30CourseTotals(state).manual.submitted, 75);
});
test('read, invalid answers, locked groups and incomplete submissions never dirty or create groups', () => {
  const ctx = setup();
  for (const lesson of bank) for (const part of HOMEWORK30_PARTS) {
    const controller = ctx.controller(lesson.lesson, part); controller.read();
    assert.equal(controller.read().locked, part !== 'choice');
    assert.equal(controller.submit().reason, part === 'choice' ? 'missing' : 'locked');
    assert.equal(controller.answer('__proto__', 0).reason, 'unknown');
    if (part === 'choice') assert.equal(controller.answer(lesson.choice[0].id, 9).reason, 'invalid');
  }
  assert.deepEqual(ctx.store.snapshot().data.homework30, blankHomework30()); assert.equal(ctx.changes(), 0);
});
test('zero-score completed section unlocks next; restart retains immutable first/latest/history and does not relock', () => {
  const ctx = setup(), controller = ctx.controller(1, 'choice'), lesson = bank[0];
  for (const q of lesson.choice) controller.answer(q.id, (q.answer + 1) % 4);
  const first = controller.submit(); assert.equal(first.correct, 0); assert.equal(controller.submit().reason, 'submitted');
  assert.equal(ctx.controller(1, 'sort').read().locked, false);
  assert.equal(controller.restart().ok, true); assert.equal(ctx.controller(1, 'sort').read().locked, false);
  for (const q of lesson.choice) controller.answer(q.id, q.answer);
  assert.equal(controller.submit().correct, 10);
  const group = controller.read().group;
  assert.deepEqual(group.first, first.attempt); assert.equal(group.latest.correct, 10); assert.equal(group.history.length, 2);
  assert.deepEqual(compatibility.validate(ctx.store.snapshot().data).homework30, ctx.store.snapshot().data.homework30);
});
test('new homework saves reloads exports imports and resets without relabeling any old submission', async () => {
  const seed = compatibility.blank(), old = oldBank.lessons[0];
  legacy.group(seed.homework, 1, 'choice').draft = Object.fromEntries(old.choice.map(q => [q.id, q.answer]));
  legacy.submit(seed.homework, 1, 'choice', old.choice, at);
  const legacyBefore = structuredClone(seed.homework);
  complete(seed.homework30, bank[0]); complete(seed.homework30, bank[1], ['choice']);
  seed.navigation = { feature: 'homework', lesson: 1, part: 'translationChoice', homeworkVersion: '30-v1' };
  const ctx = setup(seed); ctx.store.edit(data => { data.homework30.profile.name = 'Người học'; });
  assert.equal((await ctx.store.save()).ok, true);
  const saved = ctx.memory.get(STORAGE_KEY); const raw = JSON.parse(ctx.store.exportBackup());
  assert.deepEqual(raw.data.homework, legacyBefore);
  ctx.store.reloadDiscardingDraft(); assert.deepEqual(ctx.store.snapshot().data.homework, legacyBefore);
  assert.equal(ctx.store.snapshot().data.homework30.lessons['1'].choice.latest.correct, 10);
  const newOnly = compatibility.reset(ctx.store.snapshot().data, { module: 'homework', lesson: 1, homeworkVersion: '30-v1' });
  assert.deepEqual(newOnly.data.homework, legacyBefore); assert.equal(newOnly.data.homework30.lessons['1'], undefined); assert.ok(newOnly.data.homework30.lessons['2']);
  const oldOnly = compatibility.reset(seed, { module: 'homework', lesson: 1, homeworkVersion: 'legacy' });
  assert.deepEqual(oldOnly.data.homework30, seed.homework30); assert.equal(oldOnly.data.homework.lessons['1'], undefined);
  const both = compatibility.reset(seed, { module: 'homework', lesson: 1 });
  assert.equal(both.data.homework.lessons['1'], undefined); assert.equal(both.data.homework30.lessons['1'], undefined); assert.match(both.warnings.join(' '), /30.*15/);
  const preview = ctx.store.previewReplacement(both.data, 'reset'); assert.equal(ctx.memory.get(STORAGE_KEY), saved);
  assert.equal((await ctx.store.confirm(preview)).ok, true);
  const restored = ctx.store.previewBackup(JSON.stringify(raw)); assert.equal((await ctx.store.confirm(restored)).ok, true);
  assert.deepEqual(ctx.store.snapshot().data.homework, legacyBefore); assert.equal(ctx.store.snapshot().data.homework30.lessons['1'].choice.latest.correct, 10);
});
test('old modular backup extends with an empty new version and unchanged legacy route/history', () => {
  const old = compatibility.blank(); delete old.homework30;
  old.navigation = { feature: 'homework', lesson: 1, part: 'sort' };
  const loaded = compatibility.validate(old);
  assert.equal(loaded.homework30, undefined); assert.deepEqual(loaded.homework, old.homework); assert.deepEqual(loaded.navigation, old.navigation);
  assert.equal(summarizeHomework30(loaded).homework.submitted, 0);
});
test('legacy source imports supplement only old domains and cannot overwrite versioned progress', () => {
  const seed = compatibility.blank(); complete(seed.homework30, bank[0]);
  const before = structuredClone(seed.homework30);
  const result = compatibility.importLegacy(legacy.blank(), seed, at);
  assert.deepEqual(result.data.homework30, before);
});
test('new-state tampering and cross-version answers are rejected rather than accepted as grades', () => {
  const state = blankHomework30(); complete(state, bank[0]);
  const mutations = [
    s => s.version = 'stage2', s => s.lessons['1'].choice.latest.correct = 9,
    s => s.lessons['1'].choice.latest.questionFingerprints[bank[0].choice[0].id] = 'bad',
    s => s.lessons['1'].choice.draft[oldBank.lessons[0].choice[0].id] = 0,
    s => s.lessons['1'].translation.latest.correct = 5,
    s => s.lessons['1'].translation.latest.results = {},
    s => s.lessons['1'].choice.completed = false,
    s => delete s.lessons['1'].choice,
    s => s.lessons['1'].sort.orders[bank[0].sort[0].id] = [0, 0],
    s => s.lessons['16'] = {}, s => s.profile = { ...s.profile, admin: true },
    s => s.lessons['1'].choice.latest.answers.extra = 0,
    s => s.lessons['1'].choice.history = [],
  ];
  for (const mutate of mutations) { const bad = structuredClone(state); mutate(bad); assert.throws(() => validateHomework30(bad, bank)); }
});
test('twenty retained attempts preserve the real first attempt after the history window moves', () => {
  const state = blankHomework30(); complete(state, bank[0], ['choice']); const first = structuredClone(state.lessons['1'].choice.first);
  for (let i = 1; i <= 25; i++) { restartHomework30(state, 1, 'choice', at + i); complete(state, bank[0], ['choice'], at + i); }
  const group = validateHomework30(state, bank).lessons['1'].choice;
  assert.equal(group.history.length, 20); assert.deepEqual(group.first, first); assert.equal(group.latest.at, at + 25);
});
test('manual IME-sized drafts preserve exact text and rejected overflow never truncates accepted text', () => {
  const seed = compatibility.blank(); complete(seed.homework30, bank[0], HOMEWORK30_PARTS.slice(0, -1));
  const ctx = setup(seed), controller = ctx.controller(1, 'translation'), id = bank[0].translation[0].id;
  const text = '中'.repeat(11998) + '\n文'; assert.equal(controller.answer(id, text).ok, true);
  assert.equal(controller.answer(id, text + '字').reason, 'invalid'); assert.equal(controller.read().group.draft[id], text);
  assert.equal(controller.submit().reason, 'missing');
});
test('new and legacy route identity and totals remain separate; original audio is used unchanged', () => {
  const route = { feature: 'homework', lesson: 10, part: 'listening', homeworkVersion: '30-v1' };
  assert.deepEqual(parseRoute(routeHref(route)), route); assert.match(routeHref(route), /version=30-v1/);
  assert.deepEqual(parseRoute('#/homework?lesson=10&part=sort'), { feature: 'homework', lesson: 10, part: 'sort' });
  assert.deepEqual(parseRoute('learning.html?lesson=3&stage=translation'), { feature: 'homework', lesson: 3, part: 'translation' });
  const data = compatibility.blank(); complete(data.homework30, bank[0], ['choice']);
  const projection = summarizeHomework30(data); assert.equal(projection.homework.total, 450); assert.equal(projection.automatic.total, 375); assert.equal(projection.manual.total, 75); assert.equal(projection.lessons[0].nextRoute.part, 'sort');
  assert.deepEqual(data.practice.listening.records, {}); assert.deepEqual(data.exercises.records, {}); assert.deepEqual(data.homework.lessons, {});
  const audio = homework30Audio(bank[0].listening[0], 'https://example.org/course/'); assert.equal(audio.sourceKind, 'segment'); assert.equal(audio.start, bank[0].listening[0].audio.start); assert.match(audio.url, /course-assets\/audio\/1-1.mp3$/);
  const bad = json('../content/homework30-bank.json'); bad.lessons[0].choice.pop(); assert.throws(() => validateHomework30Bank(bad));
});
