import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import engine from '../src/domain/practice/engine.js';
import { createMixedVocabularyController } from '../src/domain/vocabulary/mixed-controller.ts';
import { createLearningSession } from '../src/services/learning/session.ts';
import { createCompatibility } from '../src/services/storage/compatibility.ts';
import { createStore, STORAGE_KEY } from '../src/services/storage/index.ts';
import { progressResume, summarizeProgress } from '../src/services/learning/progress.ts';

const json = name => JSON.parse(readFileSync(new URL(`../content/${name}.json`, import.meta.url)));
const catalog = json('stage3-catalog'), bank = json('stage2-bank'), book = json('textbook');
const stamp = 1790899200000, allLessons = Array.from({ length: 15 }, (_, index) => index + 1);
function setup({ memory = new Map(), content = catalog, random = () => .271, write } = {}) {
  const compatibility = createCompatibility(bank, content, book);
  let requests = 0, randomCalls = 0, time = stamp;
  const port = { getItem: key => memory.get(key) ?? null, setItem: write ?? ((key, value) => memory.set(key, value)) };
  const store = createStore({ storage: port, blank: compatibility.blank, validate: compatibility.validate,
    lock: async task => task(), now: () => time });
  const session = createLearningSession({ store, compatibility, setTimer: () => 1, clearTimer: () => {} });
  session.requestSave = () => { requests++; };
  const controller = () => createMixedVocabularyController({ session, catalog: content, now: () => time,
    random: () => { randomCalls++; return random(); } });
  return { store, session, compatibility, controller, memory, port, requests: () => requests,
    randomCalls: () => randomCalls, setTime: value => { time = value; } };
}
function rejected(ctx, action, reason) {
  const before = ctx.store.snapshot(), requests = ctx.requests(), result = action();
  assert.equal(result.ok, false); if (reason) assert.equal(result.reason, reason);
  assert.deepEqual(ctx.store.snapshot(), before); assert.equal(ctx.requests(), requests);
}
function legacy(ctx, options = {}) {
  ctx.store.edit(data => {
    engine.setPreferences(data.practice, { module: 'listening', lessons: [4, 15], vocabularyFilter: 'wrong',
      direction: 'vi-zh', shuffle: false, rate: .75 }, stamp);
    engine.startReview(data.practice, catalog, { lessons: [1, 3], filter: 'all', direction: 'zh-vi', shuffle: false, ...options }, stamp);
    engine.moveCard(data.practice, 2, stamp);
    engine.revealCard(data.practice, data.practice.cards.review.senseIds[2], stamp);
    engine.rateCard(data.practice, catalog, 'good', stamp);
  });
  return ctx.store.snapshot().data.practice;
}

test('mixed reads are pure, route scope starts at current lesson and draft scope never writes', () => {
  const ctx = setup(), c = ctx.controller(), practice = ctx.store.snapshot().data.practice;
  assert.equal(c.read().round, null); assert.equal(ctx.requests(), 0); assert.equal(ctx.randomCalls(), 0);
  assert.equal(c.visit(10, 'review').ok, true);
  assert.deepEqual(c.read().draftLessons, [10]); assert.deepEqual(c.read().appliedLessons, []);
  const snapshot = ctx.store.snapshot(), requests = ctx.requests();
  assert.equal(c.setLessons([15, 1, 3, 1]).ok, true);
  assert.deepEqual(c.read().draftLessons, [1, 3, 15]);
  assert.deepEqual(ctx.store.snapshot(), snapshot); assert.equal(ctx.requests(), requests);
  assert.equal(c.visit(10, 'review').ok, true); assert.equal(ctx.requests(), requests);
  assert.deepEqual(ctx.store.snapshot().data.practice, practice);
  rejected(ctx, () => c.move(0), 'empty-review');
  for (const lessons of [null, undefined, {}, [0], [16], ['1'], [1.5]]) {
    rejected(ctx, () => c.setLessons(lessons)); assert.deepEqual(c.read().draftLessons, [1, 3, 15]);
  }
  rejected(ctx, () => c.visit(16), 'invalid'); rejected(ctx, () => c.visit(1, 'homework'), 'invalid');
});

test('mixed all-course pool has 344 senses/319 forms and only start shuffles once', () => {
  const ctx = setup(), c = ctx.controller(); c.visit(1); c.setLessons(allLessons);
  const before = ctx.store.snapshot().data.practice;
  assert.equal(c.read().available.mergedCount, 344); assert.equal(c.read().available.distinctForms, 319);
  assert.equal(c.read().available.filter, 'all'); assert.equal(c.read().available.direction, 'zh-vi');
  assert.equal(ctx.randomCalls(), 0); assert.equal(c.start().ok, true); assert.equal(ctx.randomCalls(), 343);
  const first = c.read().round;
  assert.equal(first.senseIds.length, 344); assert.equal(new Set(first.senseIds).size, 344);
  assert.notDeepEqual(first.senseIds, c.read().available.senseIds);
  for (const [form, count] of [['家', 3], ['在', 3], ['天', 2], ['上', 3]]) {
    assert.equal(c.read().cards.filter(card => card.zh === form).length, count, form);
  }
  assert.deepEqual(c.read().cards.map(card => card.senseId), first.senseIds);
  for (const anchor of [5, 11, 23, 343, 0]) {
    assert.equal(c.move(anchor).ok, true); assert.equal(c.read().round.anchor, anchor);
    assert.deepEqual(c.read().round.senseIds, first.senseIds);
  }
  for (const pageSize of [1, 6, 12, 1]) {
    const view = c.read(); assert.equal(view.round.anchor, 0); assert.ok(pageSize > 0);
  }
  c.visit(15, 'review'); c.setLessons([10]); c.read();
  assert.equal(ctx.randomCalls(), 343); assert.deepEqual(c.read().round, first);
  assert.deepEqual(c.read().appliedLessons, allLessons); assert.equal(c.read().draftChanged, true);
  assert.deepEqual(ctx.store.snapshot().data.practice, before);
  assert.equal(c.start().ok, true); assert.deepEqual(c.read().appliedLessons, [10]);
  assert.equal(c.read().round.anchor, 0); assert.equal(c.read().draftChanged, false);
  assert.notEqual(c.read().round.id, first.id);
});

test('existing non-card preferences cannot replace the first route scope or affect browsing options', () => {
  const ctx = setup();
  ctx.store.edit(data => {
    engine.setPreferences(data.practice, { module: 'listening', lessons: [2, 15], vocabularyFilter: 'wrong',
      direction: 'vi-zh', shuffle: false }, stamp);
    data.navigation = { feature: 'listening', lesson: 15 };
  });
  const original = ctx.store.snapshot().data.practice, c = ctx.controller(); c.visit(10);
  assert.deepEqual(c.read().draftLessons, [10]); assert.equal(c.read().available.filter, 'all');
  assert.equal(c.read().available.direction, 'zh-vi'); assert.equal(c.start().ok, true);
  assert.deepEqual(c.read().round.lessons, [10]); assert.ok(ctx.randomCalls() > 0);
  assert.deepEqual(ctx.store.snapshot().data.practice, original);
});

test('empty draft cannot replace a round and invalid anchors never write', () => {
  const ctx = setup(), c = ctx.controller(); c.visit(1); c.start(); c.move(3);
  const round = c.read().round; c.setLessons([]);
  assert.equal(c.read().availableCount, 0); rejected(ctx, () => c.start(), 'empty');
  assert.deepEqual(c.read().round, round);
  for (const value of [-1, round.senseIds.length, 0.5, '0', NaN, Infinity]) rejected(ctx, () => c.move(value), 'invalid-position');
  const requests = ctx.requests(); c.move(3); assert.equal(ctx.requests(), requests);
});

test('shared senses merge only selected sources and never borrow outside-scope audio', () => {
  const first = catalog.vocabulary[0];
  const other = { ...structuredClone(first), id: `v-l02-${first.senseId}`, lesson: 2, audio: null, vi: 'cùng nghĩa ở bài khác' };
  const content = { ...catalog, vocabulary: [first, other, catalog.vocabulary[1]] };
  const ctx = setup({ content }), c = ctx.controller(); c.setLessons([1, 2]); c.start();
  assert.equal(c.read().cards.length, 2);
  assert.deepEqual(c.read().cards.find(card => card.senseId === first.senseId).sourceRecords, [first, other]);
  c.setLessons([2]); c.start();
  assert.equal(c.read().cards.length, 1); assert.equal(c.read().cards[0].audio, null);
  assert.equal(c.read().cards[0].audioRecordId, null);
  assert.deepEqual(c.read().cards[0].sourceRecords, [other]);
  c.setLessons([1]); assert.deepEqual(c.read().cards[0].sourceRecords, [other]);
});

test('compatible legacy all/zh-vi queue resumes its exact order/anchor without altering original data', async () => {
  const ctx = setup(), original = legacy(ctx), c = ctx.controller();
  assert.equal(c.read().round, null); assert.equal(c.visit(15, 'review').ok, true);
  assert.deepEqual(c.read().draftLessons, original.cards.review.lessons);
  assert.deepEqual(c.read().round.senseIds, original.cards.review.senseIds);
  assert.equal(c.read().round.anchor, original.cards.review.position);
  assert.equal(c.read().legacyPreserved, false); assert.equal(ctx.randomCalls(), 0);
  assert.deepEqual(ctx.store.snapshot().data.practice, original);
  c.move(5); c.setLessons([15]); c.start();
  assert.deepEqual(ctx.store.snapshot().data.practice, original);
  assert.equal((await ctx.session.flush()).ok, true);
  const loaded = setup({ memory: ctx.memory }), resumed = loaded.controller(); resumed.visit(1);
  assert.deepEqual(resumed.read().draftLessons, [15]); assert.deepEqual(loaded.store.snapshot().data.practice, original);
});

test('reverse, due, unfamiliar, and search-scoped legacy queues stay untouched and require a new round', () => {
  for (const options of [{ direction: 'vi-zh' }, { filter: 'due' }, { filter: 'unfamiliar' }, { search: 'n' }]) {
    const ctx = setup(), original = legacy(ctx, options), c = ctx.controller(); c.visit(10, 'review');
    assert.equal(c.read().round, null); assert.equal(c.read().legacyPreserved, true);
    assert.deepEqual(c.read().draftLessons, original.cards.review.lessons);
    assert.equal(c.start().ok, true); assert.deepEqual(c.read().round.lessons, original.cards.review.lessons);
    assert.deepEqual(ctx.store.snapshot().data.practice, original);
  }
});

test('saved order, anchor, scope and original practice roundtrip through reload/export/import', async () => {
  const ctx = setup(), original = legacy(ctx, { direction: 'vi-zh', filter: 'due' }), c = ctx.controller();
  c.visit(15); c.setLessons([1, 7, 15]); c.start(); c.move(17);
  const expected = c.read().round; c.setLessons([2]);
  assert.equal((await ctx.session.flush()).ok, true);
  const loaded = setup({ memory: ctx.memory }), resumed = loaded.controller(); resumed.visit(10, 'review');
  assert.deepEqual(resumed.read().round, expected); assert.deepEqual(resumed.read().draftLessons, [1, 7, 15]);
  assert.equal(loaded.randomCalls(), 0);
  const imported = setup(), preview = imported.store.previewBackup(ctx.store.exportBackup());
  assert.equal((await imported.store.confirm(preview)).ok, true);
  const restored = imported.controller(); restored.visit(2);
  assert.deepEqual(restored.read().round, expected); assert.deepEqual(restored.read().draftLessons, [1, 7, 15]);
  assert.deepEqual(imported.store.snapshot().data.practice, original);
  const old = ctx.compatibility.blank();
  assert.equal(Object.hasOwn(ctx.compatibility.validate(old), 'mixedVocabulary'), false);
  assert.deepEqual(ctx.compatibility.validate({ ...old, mixedVocabulary: { schema: 1, round: null } }).mixedVocabulary,
    { schema: 1, round: null });
});

test('malformed mixed state, order, pool, anchor and fingerprints are rejected before replacing valid state', () => {
  const ctx = setup(), c = ctx.controller(); c.visit(1); c.setLessons([1, 3]); c.start();
  const original = ctx.store.snapshot().data;
  const mutations = [
    data => { data.mixedVocabulary = null; },
    data => { data.mixedVocabulary.schema = 2; },
    data => { data.mixedVocabulary.extra = true; },
    data => { delete data.mixedVocabulary.round; },
    data => { data.mixedVocabulary.round.ratings = {}; },
    data => { data.mixedVocabulary.round.id = 'unknown'; },
    data => { data.mixedVocabulary.round.startedAt++; },
    data => { data.mixedVocabulary.round.anchor = -1; },
    data => { data.mixedVocabulary.round.anchor = data.mixedVocabulary.round.senseIds.length; },
    data => { data.mixedVocabulary.round.anchor = .5; },
    data => { data.mixedVocabulary.round.lessons = []; },
    data => { data.mixedVocabulary.round.lessons = [3, 1]; },
    data => { data.mixedVocabulary.round.lessons = [1, 1, 3]; },
    data => { data.mixedVocabulary.round.lessons.push(15); },
    data => { data.mixedVocabulary.round.senseIds[0] = 'unknown-id'; },
    data => { data.mixedVocabulary.round.senseIds[0] = data.mixedVocabulary.round.senseIds[1]; },
    data => { data.mixedVocabulary.round.senseIds.pop(); },
    data => { delete data.mixedVocabulary.round.senseIds[0]; },
    data => { delete data.mixedVocabulary.round.lessons[0]; },
    data => { delete data.mixedVocabulary.round.fingerprints[data.mixedVocabulary.round.senseIds[0]]; },
    data => { data.mixedVocabulary.round.fingerprints[data.mixedVocabulary.round.senseIds[0]] = 'stale'; },
    data => { data.mixedVocabulary.round.fingerprints.extra = 'unexpected'; },
  ];
  for (const mutate of mutations) {
    const bad = structuredClone(original); mutate(bad);
    assert.throws(() => ctx.compatibility.validate(bad)); assert.throws(() => ctx.store.previewReplacement(bad, 'import'));
    assert.deepEqual(ctx.store.snapshot().data, original);
  }
  for (const field of ['fingerprint', 'vi', 'py']) {
    const drift = structuredClone(catalog); drift.vocabulary[0][field] += 'changed';
    const changed = createCompatibility(bank, drift, book);
    assert.throws(() => changed.validate(original));
  }
  const missing = structuredClone(catalog); missing.vocabulary.shift();
  assert.throws(() => createCompatibility(bank, missing, book).validate(original));
});

test('scoped resets preserve retained mixed order and anchor; unrelated reset leaves mixed state unchanged', () => {
  const ctx = setup(), c = ctx.controller(); c.visit(1); c.setLessons([1, 3, 15]); c.start(); c.move(15);
  const original = ctx.store.snapshot().data, round = original.mixedVocabulary.round;
  for (const module of ['textbook', 'homework', 'listening', 'exercises']) {
    assert.deepEqual(ctx.compatibility.reset(original, { module, lesson: null }).data.mixedVocabulary, original.mixedVocabulary);
  }
  const scope = { module: 'vocabulary', lesson: 1 }, reset = ctx.compatibility.reset(original, scope);
  const expected = round.senseIds.filter(id => catalog.vocabulary.some(item => item.senseId === id && [3, 15].includes(item.lesson)));
  assert.deepEqual(reset.data.mixedVocabulary.round.lessons, [3, 15]);
  assert.deepEqual(reset.data.mixedVocabulary.round.senseIds, expected);
  assert.equal(reset.data.mixedVocabulary.round.anchor,
    Math.min(expected.length - 1, round.senseIds.slice(0, round.anchor).filter(id => expected.includes(id)).length));
  for (const field of ['reading', 'homework', 'homework30', 'exercises', 'navigation', 'legacyRaw']) assert.deepEqual(reset.data[field], original[field]);
  assert.deepEqual(ctx.compatibility.validate(reset.data), reset.data);
  assert.deepEqual(ctx.store.snapshot().data, original);
  for (const module of ['vocabulary', 'all']) {
    const cleared = ctx.compatibility.reset(original, { module, lesson: null }).data;
    assert.deepEqual(cleared.mixedVocabulary, { schema: 1, round: null });
  }
});

test('shared-sense scoped reset recalculates source fingerprint without removing retained sense', () => {
  const first = catalog.vocabulary[0], other = { ...structuredClone(first), id: `v-l02-${first.senseId}`, lesson: 2 };
  const content = { ...catalog, vocabulary: [first, other] };
  const ctx = setup({ content }), c = ctx.controller(); c.setLessons([1, 2]); c.start();
  const original = ctx.store.snapshot().data;
  const reset = ctx.compatibility.reset(original, { module: 'vocabulary', lesson: 1 }).data;
  assert.deepEqual(reset.mixedVocabulary.round.senseIds, [first.senseId]);
  assert.deepEqual(reset.mixedVocabulary.round.lessons, [2]);
  assert.notEqual(reset.mixedVocabulary.round.fingerprints[first.senseId], original.mixedVocabulary.round.fingerprints[first.senseId]);
  assert.deepEqual(ctx.compatibility.validate(reset), reset);
});

test('reset preview cancellation, failed write and restoration preserve mixed round atomically', async () => {
  const ctx = setup(), originalPractice = legacy(ctx), c = ctx.controller(); c.visit(1); c.move(5);
  await ctx.session.flush();
  const before = ctx.store.snapshot().data, raw = ctx.memory.get(STORAGE_KEY);
  const candidate = () => ctx.store.previewReplacement(ctx.compatibility.reset(ctx.store.snapshot().data,
    { module: 'vocabulary', lesson: null }).data, 'reset');
  const cancelled = new AbortController(); cancelled.abort();
  assert.equal((await ctx.store.confirm(candidate(), cancelled.signal)).code, 'cancelled');
  assert.deepEqual(ctx.store.snapshot().data, before);
  const write = ctx.port.setItem; ctx.port.setItem = () => { throw new DOMException('Full', 'QuotaExceededError'); };
  assert.equal((await ctx.store.confirm(candidate())).code, 'quota');
  assert.equal(ctx.memory.get(STORAGE_KEY), raw); assert.deepEqual(ctx.store.snapshot().data, before);
  ctx.port.setItem = write;
  assert.equal((await ctx.store.confirm(candidate())).ok, true);
  const resetController = ctx.controller(); resetController.visit(1);
  assert.equal(resetController.read().round, null, 'explicit empty state never re-adopts a legacy round');
  assert.equal((await ctx.store.restore()).ok, true);
  assert.deepEqual(ctx.store.snapshot().data, before); assert.deepEqual(ctx.store.snapshot().data.practice, originalPractice);
});

test('failed persistence keeps actual mixed memory round exportable and never writes legacy state', async () => {
  const ctx = setup(), originalPractice = legacy(ctx, { direction: 'vi-zh' });
  await ctx.session.flush(); const raw = ctx.memory.get(STORAGE_KEY);
  ctx.port.setItem = () => { throw new DOMException('Full', 'QuotaExceededError'); };
  const c = ctx.controller(); c.visit(10); c.setLessons([1, 7]); c.start(); c.move(9);
  const mixed = c.read().round;
  assert.equal((await ctx.session.flush()).code, 'quota'); assert.equal(ctx.store.snapshot().hasUnsavedChanges, true);
  assert.equal(ctx.memory.get(STORAGE_KEY), raw); assert.deepEqual(c.read().round, mixed);
  const backup = JSON.parse(ctx.store.exportBackup());
  assert.deepEqual(backup.data.mixedVocabulary.round, mixed); assert.deepEqual(backup.data.practice, originalPractice);
  const restored = setup(); assert.equal((await restored.store.confirm(restored.store.previewBackup(ctx.store.exportBackup()))).ok, true);
  assert.deepEqual(restored.controller().read().round, mixed);
});

test('progress resumes new mixed anchor before legacy position without changing historical rating summary', () => {
  const ctx = setup(), original = legacy(ctx, { direction: 'vi-zh', filter: 'due' });
  const sources = { bank: bank.lessons, catalog };
  const prior = summarizeProgress(ctx.store.snapshot().data, sources, stamp).vocabulary;
  const c = ctx.controller(); c.visit(15, 'review'); c.setLessons([7, 15]); c.start(); c.move(7);
  const data = ctx.store.snapshot().data, round = data.mixedVocabulary.round;
  const card = catalog.vocabulary.find(item => item.senseId === round.senseIds[round.anchor]);
  for (const feature of ['vocabulary', 'review']) {
    data.navigation = { feature, lesson: 1 };
    const resume = progressResume(data, catalog), summary = summarizeProgress(data, sources, stamp);
    assert.deepEqual(resume.route, { feature: 'vocabulary', lesson: card.lesson });
    assert.match(resume.label, new RegExp(`Thẻ 8/${round.senseIds.length}`));
    assert.deepEqual(summary.vocabularyResume.route, resume.route);
    assert.match(summary.vocabularyResume.label, new RegExp(`Thẻ 8/${round.senseIds.length}`));
    assert.deepEqual(summary.vocabulary, prior); assert.deepEqual(data.practice, original);
  }
});

test('progress only claims compatible old rounds and never resurrects old position after explicit mixed reset', () => {
  const sources = { bank: bank.lessons, catalog };
  for (const options of [{ direction: 'vi-zh' }, { filter: 'due' }, { search: 'n' }, {}]) {
    const ctx = setup(); legacy(ctx, options);
    const data = ctx.store.snapshot().data; data.navigation = { feature: 'review', lesson: 10 };
    let summary = summarizeProgress(data, sources, stamp);
    if (Object.keys(options).length) {
      assert.doesNotMatch(progressResume(data, catalog).label, /Thẻ|第\d+\/\d+张/);
      assert.deepEqual(progressResume(data, catalog).route, data.navigation);
      assert.equal(summary.vocabularyResume, null);
    } else {
      assert.match(progressResume(data, catalog).label, /Thẻ 3\//);
      assert.match(summary.vocabularyResume.label, /Thẻ 3\//);
    }
    const prior = structuredClone(summary.vocabulary);
    data.mixedVocabulary = { schema: 1, round: null };
    summary = summarizeProgress(data, sources, stamp);
    assert.equal(summary.vocabularyResume, null); assert.doesNotMatch(progressResume(data, catalog).label, /Thẻ/);
    assert.deepEqual(summary.vocabulary, prior);
  }
});
