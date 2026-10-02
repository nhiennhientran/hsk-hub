import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import engine from '../src/domain/practice/engine.js';
import { createListeningController } from '../src/domain/listening/controller.ts';
import { createLearningSession } from '../src/services/learning/session.ts';
import { createStore, STORAGE_KEY } from '../src/services/storage/index.ts';
import { createCompatibility } from '../src/services/storage/compatibility.ts';

const json = name => JSON.parse(readFileSync(new URL(`../content/${name}.json`, import.meta.url)));
const catalog = json('stage3-catalog');
const book = json('textbook');
const compatibility = createCompatibility(json('stage2-bank'), catalog, book);
const stamp = 1790899200000;
function setup(memory = new Map(), random = () => 0.271) {
  const store = createStore({ storage: { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value) },
    blank: compatibility.blank, validate: compatibility.validate, lock: async task => task(), now: () => stamp });
  const session = createLearningSession({ store, compatibility, setTimer: () => 1, clearTimer: () => {} });
  let requests = 0;
  session.requestSave = () => { requests++; };
  const controller = () => createListeningController({ session, catalog, now: () => stamp, random });
  return { store, session, memory, controller, requests: () => requests };
}
const question = controller => catalog.listening.find(q => q.id === controller.read().current.id);
function fillRound(controller, correct) {
  const ids = [...controller.read().session.questionIds];
  for (const id of ids) {
    assert.equal(controller.read().current.id, id);
    const q = question(controller);
    assert.equal(controller.select(id, correct ? q.answer : (q.answer + 1) % 4).ok, true);
    assert.equal(controller.submit().ok, true);
    assert.equal(controller.next().ok, true);
  }
}
function assertNoChange(ctx, action, reason) {
  const before = ctx.store.snapshot(), count = ctx.requests();
  const result = action();
  assert.equal(result.ok, false); if (reason) assert.equal(result.reason, reason);
  assert.deepEqual(ctx.store.snapshot(), before); assert.equal(ctx.requests(), count);
}

test('construction, empty reads and rejected actions do not create a round or schedule writes', () => {
  const ctx = setup(), c = ctx.controller();
  assert.equal(c.read().current, null); assert.equal(c.read().session, null);
  assert.equal(c.read().availableCount, 5); assert.equal(c.read().summary.overall.total, 75);
  assertNoChange(ctx, () => c.select('l01-listen-01', 0), 'empty');
  assertNoChange(ctx, () => c.submit(), 'empty-session');
  assertNoChange(ctx, () => c.move(0), 'invalid-position');
  assertNoChange(ctx, () => c.redo(), 'empty');
  assert.equal(ctx.store.snapshot().status, 'empty'); assert.equal(ctx.requests(), 0);
});

test('first route initializes its lesson once; mixed or empty explicit selections survive visits and remounts', () => {
  const ctx = setup(), c = ctx.controller();
  assert.equal(c.visit(10).ok, true); assert.deepEqual(c.read().preferences.lessons, [10]);
  const requests = ctx.requests(); c.visit(10); assert.equal(ctx.requests(), requests);
  assert.equal(c.setPreferences({ lessons: [15, 3, 1, 3], shuffle: false }).ok, true);
  assert.deepEqual(c.read().preferences.lessons, [1, 3, 15]);
  assert.equal(c.start().ok, true); const original = c.read().session;
  c.visit(10); assert.deepEqual(c.read().session, original); assert.deepEqual(c.read().preferences.lessons, [1, 3, 15]);
  assert.equal(c.setPreferences({ lessons: [] }).ok, true);
  ctx.controller().visit(10); assert.deepEqual(c.read().preferences.lessons, []);
  assertNoChange(ctx, () => c.start(), 'empty'); assert.deepEqual(c.read().session, original);
  assertNoChange(ctx, () => c.visit(16), 'invalid');
});

test('only supported preferences change, five speeds remain exact and normalized same values do not resave', () => {
  const ctx = setup(), c = ctx.controller(), original = ctx.store.snapshot().data.practice;
  c.setPreferences({ lessons: [1, 5, 15], listeningMode: 'wrong', shuffle: false });
  for (const rate of [0.65, 0.75, 1, 1.25, 1.5]) {
    assert.equal(c.setPreferences({ rate }).ok, true); assert.equal(c.read().preferences.rate, rate);
    const count = ctx.requests(); c.setPreferences({ rate }); assert.equal(ctx.requests(), count);
  }
  const count = ctx.requests(); c.setPreferences({ lessons: [15, 5, 1, 5] }); c.setPreferences({});
  assert.equal(ctx.requests(), count);
  for (const patch of [{ lessons: [0] }, { lessons: [16] }, { lessons: ['1'] }, { rate: 0.5 }, { listeningMode: 'test' },
    { shuffle: 'yes' }, { module: 'vocabulary' }, { direction: 'vi-zh' }, { vocabularyFilter: 'wrong' }]) assertNoChange(ctx, () => c.setPreferences(patch));
  const after = ctx.store.snapshot().data.practice;
  assert.deepEqual(after.cards, original.cards); assert.deepEqual(after.listening, original.listening);
  for (const key of ['vocabularyFilter', 'direction', 'module']) assert.equal(after.preferences[key], original.preferences[key]);
});

test('all 75 canonical questions grade each of four original options correctly without trusting display order', () => {
  for (let option = 0; option < 4; option++) {
    const practice = engine.blank();
    engine.createListeningSession(practice, catalog, { lessons: Array.from({ length: 15 }, (_, i) => i + 1), shuffle: false }, stamp, () => 0);
    for (let position = 0; position < catalog.listening.length; position++) {
      const q = catalog.listening[position], round = practice.listening.session;
      assert.equal(round.questionIds[position], q.id);
      assert.equal(new Set(round.optionOrders[q.id]).size, 4);
      engine.selectListening(practice, catalog, q.id, option, stamp);
      assert.equal(engine.submitListening(practice, catalog, stamp).correct, option === q.answer, `${q.id}:${option}`);
      engine.nextListening(practice, stamp);
    }
    assert.equal(Object.keys(practice.listening.records).length, 75);
    assert.deepEqual(engine.importBackup(practice, catalog), practice);
  }
});

test('all 75 wrong-first then correct-redo answers retain first/latest separately and leave other domains intact', () => {
  const ctx = setup(), c = ctx.controller();
  ctx.store.edit(data => {
    data.reading.lessons['10'] = { visited: true, complete: true }; data.reading.mastered['10-' + book.lessons[9].vocab[0].zh] = true;
    data.legacyRaw.hsk1_ranteacher_progress_v1 = '{"10":{"complete":true}}';
  });
  const original = ctx.store.snapshot().data, beforeCatalog = JSON.stringify(catalog);
  c.setPreferences({ lessons: Array.from({ length: 15 }, (_, index) => index + 1), shuffle: false });
  assert.equal(c.start().ok, true); fillRound(c, false);
  assert.deepEqual(c.read().summary.session, { total: 75, answered: 75, unanswered: 0, correct: 0, percentAmongAnswered: 0, done: true });
  assert.equal(c.read().summary.wrongIds.length, 75); const firstRound = c.read().session.id;
  assert.equal(c.redo().ok, true); assert.notEqual(c.read().session.id, firstRound);
  assert.equal(c.read().current.feedback, null); assert.equal(c.read().current.listenCount, 0);
  fillRound(c, true);
  assert.deepEqual(c.read().summary.overall, { total: 75, answered: 75, firstCorrect: 0, latestCorrect: 75, firstPercentAmongAnswered: 0, latestPercentAmongAnswered: 100 });
  assert.equal(c.read().summary.session.done, true); assert.deepEqual(c.read().summary.wrongIds, []);
  assertNoChange(ctx, () => c.redo(), 'empty');
  const after = ctx.store.snapshot().data;
  for (const key of ['reading', 'homework', 'legacyRaw']) assert.deepEqual(after[key], original[key]);
  assert.deepEqual(after.practice.cards, original.practice.cards);
  for (const row of Object.values(after.practice.listening.records)) {
    assert.equal(row.first.correct, false); assert.equal(row.latest.correct, true); assert.equal(row.attempts, 2);
  }
  assert.equal(JSON.stringify(catalog), beforeCatalog);
});

test('selection, queue, shuffled option orders and exact engine fingerprints resume after actual save and refresh', async () => {
  const ctx = setup(), c = ctx.controller();
  c.visit(15); c.setPreferences({ lessons: [1, 10, 15] }); c.start();
  const first = question(c); c.select(first.id, first.answer); c.submit(); c.next();
  const second = question(c); c.select(second.id, 3);
  const before = c.read(); assert.equal(before.current.feedback, null);
  assert.equal((await ctx.session.flush()).ok, true); assert.ok(ctx.memory.has(STORAGE_KEY));
  const loaded = setup(ctx.memory, () => 0.999), resumed = loaded.controller();
  assert.deepEqual(resumed.read(), before); assert.equal(loaded.requests(), 0);
  resumed.visit(10); assert.deepEqual(resumed.read(), before); assert.equal(loaded.requests(), 0);
  assert.match(before.session.fingerprints[first.id], /^v1-[a-f0-9]{16}$/);
  assert.notEqual(before.session.fingerprints[first.id], first.fingerprint);
  await ctx.session.dispose(); await loaded.session.dispose();
});

test('submission gates feedback and forward navigation; invalid answers and repeated submissions leave saved draft unchanged', () => {
  const ctx = setup(), c = ctx.controller(); c.setPreferences({ shuffle: false }); c.start();
  const q = question(c), options = c.read().current.options;
  assert.deepEqual(options.map(option => option.index).sort(), [0, 1, 2, 3]);
  for (const option of options) assert.equal(option.text, q.options[option.index]);
  assert.equal(c.read().current.feedback, null);
  assertNoChange(ctx, () => c.submit(), 'answer-required'); assertNoChange(ctx, () => c.next(), 'answer-required');
  assertNoChange(ctx, () => c.move(3), 'answer-required');
  for (const answer of [-1, 4, 0.25, '0', null]) assertNoChange(ctx, () => c.select(q.id, answer), 'invalid-answer');
  assertNoChange(ctx, () => c.select('constructor', 0), 'not-current');
  c.select(q.id, q.answer); const count = ctx.requests(); c.select(q.id, q.answer); assert.equal(ctx.requests(), count);
  c.submit(); const feedback = c.read().current.feedback;
  assert.equal(feedback.correct, true); assert.deepEqual(feedback.transcript, q.transcript);
  assert.deepEqual(feedback.optionFeedback, q.optionFeedback); assert.equal(feedback.explanationVi, q.explanationVi);
  assertNoChange(ctx, () => c.submit(), 'already-submitted'); assertNoChange(ctx, () => c.select(q.id, 1), 'already-submitted');
  c.next(); assert.equal(c.read().current.feedback, null); c.move(0); assert.deepEqual(c.read().current.feedback, feedback);
  const writes = ctx.requests(); c.move(0); assert.equal(ctx.requests(), writes);
  assert.deepEqual(ctx.store.snapshot().data.navigation, { feature: 'listening', lesson: 1 });
});

test('successful playback tokens count once, repeated and slow listens do not change score, stale callbacks never write', () => {
  const ctx = setup(), c = ctx.controller(); c.setPreferences({ shuffle: false }); c.start();
  const q = question(c), token = { sessionId: c.read().session.id, questionId: q.id, playbackId: 'native-play-1' };
  c.setPreferences({ rate: 0.65 }); assert.equal(c.recordListen(token).ok, true);
  const count = ctx.requests(); c.recordListen(token); assert.equal(ctx.requests(), count); assert.equal(c.read().current.listenCount, 1);
  c.recordListen({ ...token, playbackId: 'native-replay-2' }); assert.equal(c.read().current.listenCount, 2);
  assert.equal(c.read().summary.overall.answered, 0);
  c.select(q.id, q.answer); c.submit(); assert.equal(c.read().summary.session.correct, 1);
  c.next(); assertNoChange(ctx, () => c.recordListen({ ...token, playbackId: 'late-old-question' }), 'not-current');
  c.start(); assertNoChange(ctx, () => c.recordListen({ ...token, playbackId: 'late-old-session' }), 'not-current');
  assertNoChange(ctx, () => c.recordListen({ ...token, playbackId: '' }), 'invalid');
  assert.equal(c.read().summary.overall.latestCorrect, 1);
});

test('wrong-only filter uses latest records in selected lessons, starting a fresh round preserves earlier records', () => {
  const ctx = setup(), c = ctx.controller(); c.setPreferences({ lessons: [1, 15], shuffle: false }); c.start();
  fillRound(c, false); assert.equal(c.read().summary.wrongIds.length, 10);
  c.setPreferences({ lessons: [15], listeningMode: 'wrong' }); c.start();
  assert.equal(c.read().session.questionIds.length, 5); assert.ok(c.read().session.questionIds.every(id => id.startsWith('l15-')));
  assert.equal(c.read().summary.overall.answered, 10); fillRound(c, true);
  assert.equal(c.read().summary.wrongIds.length, 5); assertNoChange(ctx, () => c.redo(), 'empty');
  c.setPreferences({ lessons: [1] }); assert.equal(c.redo().ok, true); assert.equal(c.read().session.questionIds.length, 5);
});

test('backup validation recalculates scores and rejects same IDs with changed question fingerprints', async () => {
  const ctx = setup(), c = ctx.controller(); c.setPreferences({ shuffle: false }); c.start();
  const q = question(c); c.select(q.id, q.answer); c.submit();
  const backup = JSON.parse(ctx.store.exportBackup());
  backup.data.practice.listening.records[q.id].first.correct = false;
  backup.data.practice.listening.records[q.id].latest.correct = false;
  backup.data.practice.listening.session.responses[q.id].submission.correct = false;
  // The legacy engine recalculates; the new container additionally rejects tampered snapshots.
  const recalculated = engine.importBackup(backup.data.practice, catalog);
  assert.equal(recalculated.listening.records[q.id].first.correct, true);
  assert.equal(recalculated.listening.records[q.id].latest.correct, true);
  const other = setup();
  assert.throws(() => other.store.previewBackup(JSON.stringify(backup)), /Điểm hoặc trạng thái nộp bị sửa/);
  assert.equal(other.store.snapshot().status, 'empty'); assert.equal(other.requests(), 0);
  assert.equal((await other.store.confirm(other.store.previewBackup(ctx.store.exportBackup()))).ok, true);
  assert.equal(other.controller().read().summary.overall.firstCorrect, 1);
  assert.equal(other.controller().read().summary.overall.latestCorrect, 1);
  assert.equal(other.controller().read().current.feedback.correct, true);
  const changedCatalog = structuredClone(catalog); changedCatalog.listening[0].options[0] += ' thay đổi';
  assert.throws(() => createListeningController({ session: ctx.session, catalog: changedCatalog }), error => error.code === 'CONTENT_CHANGED');
  const changedBackup = JSON.parse(ctx.store.exportBackup()); changedBackup.data.practice.listening.session.fingerprints[q.id] = q.fingerprint;
  assert.throws(() => other.store.previewBackup(JSON.stringify(changedBackup)), error => error.code === 'CONTENT_CHANGED');
  await ctx.session.dispose(); await other.session.dispose();
});

test('invalid random source and invalid clock fail before dirtying global data or overwriting a resumable round', () => {
  const ctx = setup(), c = ctx.controller(); c.start(); const previous = c.read().session;
  const badRandom = createListeningController({ session: ctx.session, catalog, now: () => stamp, random: () => 1 });
  assertNoChange(ctx, () => badRandom.start(), 'invalid-random'); assert.deepEqual(c.read().session, previous);
  const badClock = createListeningController({ session: ctx.session, catalog, now: () => -1 });
  assertNoChange(ctx, () => badClock.setPreferences({ rate: 0.75 }), 'invalid-time');
  assertNoChange(ctx, () => badClock.submit(), 'invalid-time');
});


test('5/10/all listening round sizes preserve fingerprints, exact saved queue and unrelated scores', async () => {
  const ctx = setup(), c = ctx.controller();
  c.setPreferences({ lessons: [1, 2, 3], shuffle: false });
  for (const [limit, size] of [[5, 5], [10, 10], ['all', 15]]) {
    assert.equal(c.start(limit).ok, true);
    assert.equal(c.read().session.questionIds.length, size);
    assert.equal(c.read().availableCount, 15);
    const before = c.read().session;
    await ctx.session.flush();
    const reopened = setup(ctx.memory).controller();
    assert.deepEqual(reopened.read().session, before);
    assert.equal(reopened.read().summary.overall.answered, 0);
  }
  c.setPreferences({ lessons: [1] });
  assert.equal(c.start(10).ok, true);
  assert.equal(c.read().session.questionIds.length, 5);
  assertNoChange(ctx, () => c.start(3));
  const tampered = structuredClone(ctx.store.snapshot().data.practice);
  tampered.listening.session.limit = 3;
  assert.throws(() => engine.importBackup(tampered, catalog));
});
