import homework from '../src/domain/homework/engine.js';
import { createExerciseCatalogue } from '../src/domain/exercises/catalogue.ts';
import { answerExercise, submitExercise, exerciseReview } from '../src/domain/exercises/engine.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createCompatibility } from '../src/services/storage/compatibility.ts';
import { createStore, STORAGE_KEY } from '../src/services/storage/index.ts';
import practice from '../src/domain/practice/engine.js';
import { resetProgress } from '../src/domain/progress/reset.ts';
const json = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const bank = json('../content/stage2-bank.json'), catalog = json('../content/stage3-catalog.json'), book = json('../content/textbook.json');
const compatibility = createCompatibility(bank, catalog, book), at = 1790812800000;
function sample() {
  const data = compatibility.blank();
  data.homework = json('./fixtures/migration/stage2.json');
  data.practice = json('./fixtures/migration/stage3.json');
  data.reading.lessons = { 1: { visited: true, complete: true }, 15: { visited: true } };
  data.reading.modules = { 'hsk1:1': { modules: ['text'], updatedAt: at }, 'hsk1:15': { modules: ['text'], updatedAt: at } };
  data.legacyRaw.hsk1_lesson9_pilot_progress_v1 = '  {"preserved":"raw"}  ';
  return compatibility.validate(data);
}
function memory(data = sample()) {
  let raw = JSON.stringify({ app: 'hsk1-modular', schema: 1, revision: 1, updatedAt: at, recovery: null, data });
  const port = { getItem: key => key === STORAGE_KEY ? raw : null, setItem: (key, next) => { assert.equal(key, STORAGE_KEY); raw = next; } };
  const store = createStore({ storage: port, blank: compatibility.blank, validate: compatibility.validate, now: () => at + 1, lock: async task => task() });
  return { port, store, raw: () => raw };
}

test('lesson reset touches only selected active lesson and preserves profile, settings, raw and unrelated domains', () => {
  const original = sample();
  const result = compatibility.reset(original, { module: 'homework', lesson: 1 });
  assert.equal(result.data.homework.lessons['1'], undefined);
  assert.deepEqual(result.data.homework.lessons['15'], original.homework.lessons['15']);
  for (const key of ['reading', 'practice', 'legacyRaw', 'navigation']) assert.deepEqual(result.data[key], original[key]);
  for (const key of ['profile', 'preferences', 'words', 'archive']) assert.deepEqual(result.data.homework[key], original.homework[key]);
  assert.deepEqual(original, sample(), 'pure candidate never edits the current state');
  const reading = compatibility.reset(original, { module: 'textbook', lesson: 1 });
  assert.deepEqual(reading.data.reading.lessons, { 15: original.reading.lessons['15'] });
  assert.deepEqual(reading.data.homework, original.homework);
});

test('module and all-course reset clear active progress and keep safety copies and unrelated settings', () => {
  const original = sample();
  const listening = compatibility.reset(original, { module: 'listening', lesson: null });
  assert.deepEqual(listening.data.practice.listening, { records: {}, session: null });
  assert.deepEqual(listening.data.practice.cards, original.practice.cards);
  const all = compatibility.reset(original, { module: 'all', lesson: null });
  assert.deepEqual(all.data.reading, compatibility.blank().reading);
  assert.deepEqual(all.data.homework.lessons, {}); assert.deepEqual(all.data.homework.questionReviews, {});
  assert.deepEqual(all.data.practice.cards, { schedule: {}, review: null });
  assert.deepEqual(all.data.practice.listening, { records: {}, session: null });
  assert.deepEqual(all.data.homework.profile, original.homework.profile);
  assert.deepEqual(all.data.practice.preferences, original.practice.preferences);
  assert.deepEqual(all.data.legacyRaw, original.legacyRaw);
});

test('shared-sense lesson reset retains other lessons schedule and announces the exception', () => {
  const original = sample(), id = Object.keys(original.practice.cards.schedule)[0];
  const item = catalog.vocabulary.find(item => item.senseId === id);
  const shared = structuredClone(catalog); shared.vocabulary.push({ ...item, id: 'shared-row', lesson: item.lesson === 15 ? 1 : 15 });
  const result = resetProgress(original, { module: 'vocabulary', lesson: item.lesson }, shared);
  assert.deepEqual(result.data.practice.cards.schedule[id], original.practice.cards.schedule[id]);
  assert.ok(result.warnings.some(warning => warning.includes('dùng chung')));
});

test('preview, cancellation, stale confirmation, failed write and recovery never discard current data', async () => {
  const { port, store, raw } = memory(), originalRaw = raw(), original = store.snapshot().data;
  const reset = () => store.previewReplacement(compatibility.reset(store.snapshot().data, { module: 'all', lesson: null }).data, 'reset');
  const cancelled = reset(), signal = new AbortController(); signal.abort();
  assert.equal(raw(), originalRaw);
  assert.deepEqual(await store.confirm(cancelled, signal.signal), { ok: false, code: 'cancelled' });
  assert.equal(raw(), originalRaw); assert.deepEqual(store.snapshot().data, original);
  const failed = reset(), write = port.setItem; port.setItem = () => { throw new DOMException('Full', 'QuotaExceededError'); };
  assert.equal((await store.confirm(failed)).ok, false); assert.equal(raw(), originalRaw);
  assert.deepEqual(store.snapshot().data, original);
  port.setItem = write;
  assert.equal((await store.confirm(reset())).ok, true);
  assert.deepEqual(JSON.parse(raw()).recovery.data, original);
  assert.equal(JSON.parse(raw()).recovery.reason, 'reset');
  assert.equal((await store.confirm(failed)).code, 'stale-preview');
  assert.equal((await store.restore()).ok, true);
  assert.deepEqual(store.snapshot().data, original);
  const reload = createStore({ storage: port, blank: compatibility.blank, validate: compatibility.validate, lock: async task => task() });
  assert.equal(reload.snapshot().status, 'saved'); assert.deepEqual(reload.snapshot().data, original);
});

test('old backups default exercises to blank and scoped exercise resets preserve other lessons and original homework', () => {
  const original = sample();
  const old = structuredClone(original); delete old.exercises;
  assert.deepEqual(compatibility.validate(old).exercises, original.exercises);
  const legacy = json('../content/legacy-exercises.json');
  const one = legacy.tasks.find(task => task.lesson === 1 && task.kind === 'choice');
  const fifteen = legacy.tasks.find(task => task.lesson === 15 && task.kind === 'choice');
  for (const task of [one, fifteen]) original.exercises.records[task.id] = {
    submissions: [{ answer: task.answer, correct: true, at, fingerprint: task.fingerprint }],
  };
  const validated = compatibility.validate(original);
  const scoped = compatibility.reset(validated, { module: 'exercises', lesson: 1 });
  assert.equal(scoped.data.exercises.records[one.id], undefined);
  assert.deepEqual(scoped.data.exercises.records[fifteen.id], validated.exercises.records[fifteen.id]);
  assert.deepEqual(scoped.data.homework, validated.homework);
  assert.deepEqual(scoped.data.practice, validated.practice);
  const all = compatibility.reset(validated, { module: 'all', lesson: null });
  assert.deepEqual(all.data.exercises, compatibility.blank().exercises);
});


test('single-lesson reset removes only that lesson from mixed sessions and preserves other lesson drafts and revealed cards', () => {
  const data = compatibility.blank();
  const listening = practice.createListeningSession(data.practice, catalog, { lessons: [1, 2], shuffle: false }, at);
  while (catalog.listening.find(q => q.id === listening.questionIds[listening.position]).lesson === 1) {
    const id = listening.questionIds[listening.position], question = catalog.listening.find(q => q.id === id);
    practice.selectListening(data.practice, catalog, id, question.answer, at + 1);
    practice.submitListening(data.practice, catalog, at + 2);
    practice.nextListening(data.practice, at + 3);
  }
  const pendingId = listening.questionIds[listening.position];
  practice.selectListening(data.practice, catalog, pendingId, 2, at + 4);
  const resetOne = compatibility.reset(data, { module: 'listening', lesson: 1 }).data;
  assert.deepEqual(resetOne.practice.listening.session.lessons, [2]);
  assert.equal(resetOne.practice.listening.session.position, 0);
  assert.deepEqual(resetOne.practice.listening.session.responses[pendingId], data.practice.listening.session.responses[pendingId]);
  const resetTwo = compatibility.reset(data, { module: 'listening', lesson: 2 }).data;
  assert.deepEqual(resetTwo.practice.listening.records, data.practice.listening.records);
  assert.deepEqual(resetTwo.practice.listening.session.lessons, [1]);
  const cards = practice.startReview(data.practice, catalog, { lessons: [1, 2], shuffle: false, filter: 'all' }, at + 5);
  while (catalog.vocabulary.find(item => item.senseId === cards.senseIds[cards.position]).lesson === 1) {
    practice.revealCard(data.practice, cards.senseIds[cards.position], at + 6);
    practice.rateCard(data.practice, catalog, 'good', at + 7);
    practice.nextCard(data.practice, at + 8);
  }
  const pendingSense = cards.senseIds[cards.position];
  practice.revealCard(data.practice, pendingSense, at + 9);
  const resetCardsOne = compatibility.reset(data, { module: 'vocabulary', lesson: 1 }).data;
  assert.deepEqual(resetCardsOne.practice.cards.review.lessons, [2]);
  assert.equal(resetCardsOne.practice.cards.review.position, 0);
  assert.equal(resetCardsOne.practice.cards.review.revealed[pendingSense], true);
  const resetCardsTwo = compatibility.reset(data, { module: 'vocabulary', lesson: 2 }).data;
  assert.deepEqual(resetCardsTwo.practice.cards.schedule, data.practice.cards.schedule);
  assert.deepEqual(resetCardsTwo.practice.cards.review.lessons, [1]);
  assert.deepEqual(resetCardsTwo.practice.cards.review.ratings, data.practice.cards.review.ratings);
});


test('5/10 sized mixed listening reset preserves exact outside-scope answers through repeated reset and import', () => {
  for (const limit of [5, 10]) for (const shuffle of [false, true]) {
    const data = compatibility.blank();
    const active = practice.createListeningSession(data.practice, catalog, { lessons: [1, 2, 3], shuffle, limit }, at, () => .372);
    const before = structuredClone(active);
    const result = compatibility.reset(data, { module: 'listening', lesson: 1 }).data;
    const expected = before.questionIds.filter(id => catalog.listening.find(q => q.id === id).lesson !== 1);
    if (!expected.length) { assert.equal(result.practice.listening.session, null); continue; }
    assert.deepEqual(result.practice.listening.session.questionIds, expected);
    for (const id of expected) assert.deepEqual(result.practice.listening.session.responses[id], before.responses[id]);
    assert.deepEqual(compatibility.validate(result), result);
    const twice = compatibility.reset(result, { module: 'listening', lesson: 2 }).data;
    assert.deepEqual(twice.practice.listening.session?.questionIds ?? [], expected.filter(id => catalog.listening.find(q => q.id === id).lesson === 3));
    assert.deepEqual(compatibility.validate(twice), twice);
    const tampered = structuredClone(result);
    tampered.practice.listening.session.resetScope.removedLessons = [2];
    assert.throws(() => compatibility.validate(tampered));
  }
});


test('homework reset and replacement import rebase retained review witnesses without deleting exercise answers', () => {
  const data = compatibility.blank(), questions = bank.lessons[2].choice;
  const catalogue = createExerciseCatalogue(json('../content/legacy-exercises.json'), bank);
  const task = catalogue.tasks.get(`homework:${questions[0].id}`);
  const wrong = state => {
    homework.group(state, 3, 'choice').draft = Object.fromEntries(questions.map(q => [q.id, (q.answer + 1) % 4]));
    homework.submit(state, 3, 'choice', questions, at);
  };
  wrong(data.homework);
  answerExercise(data.exercises, task, task.answer); submitExercise(data.exercises, task, at + 1, data.homework);
  assert.equal(exerciseReview(data.exercises, task, data.homework).lastCorrect, true);
  const reset = compatibility.reset(data, { module: 'homework', lesson: 3 }).data;
  assert.equal(reset.exercises.records[task.id].submissions[0].answer, task.answer);
  assert.equal(reset.exercises.records[task.id].submissions[0].correct, true);
  assert.equal(reset.exercises.records[task.id].submissions[0].homeworkAttempts, 0);
  wrong(reset.homework);
  const revalidated = compatibility.validate(reset);
  assert.equal(exerciseReview(revalidated.exercises, task, revalidated.homework).lastCorrect, false);
  const incoming = homework.blank(); wrong(incoming);
  homework.restart(incoming, 3, 'choice');
  homework.group(incoming, 3, 'choice').draft = Object.fromEntries(questions.map(q => [q.id, q.answer]));
  homework.submit(incoming, 3, 'choice', questions, at + 2);
  const imported = compatibility.importLegacy(incoming, data, at + 3).data;
  assert.equal(imported.exercises.records[task.id].submissions[0].homeworkAttempts, 0);
  assert.equal(exerciseReview(imported.exercises, task, imported.homework).attempts, 2);
});
