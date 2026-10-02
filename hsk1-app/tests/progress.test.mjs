import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { summarizeProgress, progressResume } from '../src/services/learning/progress.ts';
import { createCompatibility } from '../src/services/storage/compatibility.ts';
import { createStore } from '../src/services/storage/index.ts';
import homework from '../src/domain/homework/engine.js';
import practice from '../src/domain/practice/engine.js';

const json = path => JSON.parse(readFileSync(new URL(path, import.meta.url)));
const bankFile = json('../content/stage2-bank.json'), catalog = json('../content/stage3-catalog.json');
const sources = { bank: bankFile.lessons, catalog };
const compatibility = createCompatibility(bankFile, catalog, json('../content/textbook.json'));
const now = 1789891210000;
const summarize = (data, at = now) => summarizeProgress(data, sources, at);
function nonempty() {
  const data = compatibility.blank();
  data.homework = json('fixtures/migration/stage2.json');
  data.practice = json('fixtures/migration/stage3.json');
  data.reading.lessons = { '1': { visited: true, complete: true }, '15': { visited: true, complete: false } };
  data.reading.modules = { 'hsk1:1': { modules: ['vocab', 'text'], updatedAt: now } };
  data.navigation = { feature: 'homework', lesson: 15, part: 'translation' };
  return compatibility.validate(data);
}
function submitGroup(state, lesson, part, correct, stamp) {
  const questions = sources.bank[lesson - 1][part];
  const group = homework.group(state, lesson, part);
  for (const question of questions) group.draft[question.id] = part === 'translation' ? '学生自己的作答\n不自动评分'
    : part === 'choice' ? correct ? question.answer : (question.answer + 1) % 4
    : question.tokens.map((_, index) => index);
  const result = homework.submit(state, lesson, part, questions, stamp);
  assert.equal(result.ok, true);
}

test('empty progress retains independent 225 homework / 150 objective / 75 translation / 75 listening / 344 sense denominators', () => {
  const data = compatibility.blank(), before = JSON.stringify(data), model = summarize(data);
  assert.deepEqual(model.reading, { total: 15, visited: 0, complete: 0, starred: 0 });
  assert.equal(model.homework.total, 225); assert.equal(model.homework.submitted, 0);
  assert.equal(model.automatic.total, 150); assert.equal(model.automatic.firstPercent, null);
  assert.equal(model.translation.total, 75); assert.equal(model.translation.submitted, 0);
  assert.equal(model.listening.overall.total, 75); assert.equal(model.listening.overall.answered, 0);
  assert.equal(model.vocabulary.records, 344); assert.equal(model.vocabulary.totalSenses, 344); assert.equal(model.vocabulary.distinctForms, 319);
  assert.equal(model.vocabulary.new, 344); assert.equal(model.vocabulary.due, 344); assert.equal(model.vocabulary.dueRated, 0);
  assert.equal(model.resume, null); assert.equal(model.listeningResume, null); assert.equal(model.vocabularyResume, null);
  assert.equal(model.lessons.length, 15); assert.equal(model.lessons[0].homework.total, 15); assert.equal(model.lessons[0].automatic.total, 10);
  assert.equal(JSON.stringify(data), before, 'read-only projection must not materialize empty groups');
});

test('nonempty cross-domain progress preserves first/latest scores, translation submission and a separate redo draft', () => {
  const data = nonempty(), before = JSON.stringify(data), model = summarize(data);
  assert.equal(model.homework.submitted, 30); assert.equal(model.homework.completedLessons, 2);
  assert.equal(model.automatic.submitted, 20); assert.equal(model.automatic.firstCorrect, 0); assert.equal(model.automatic.latestCorrect, 20);
  assert.deepEqual(model.translation, { total: 75, submitted: 10, draftAnswered: 1, draftLessons: 1 });
  assert.equal(model.lessons[0].translation.draftAnswered, 0, 'submitted answer copies are not pending drafts');
  assert.equal(model.lessons[14].translation.submitted, 5); assert.equal(model.lessons[14].translation.draftAnswered, 1);
  const records = Object.values(data.practice.listening.records);
  assert.equal(model.listening.overall.answered, records.length);
  assert.equal(model.listening.overall.firstCorrect, records.filter(row => row.first.correct).length);
  assert.equal(model.listening.overall.latestCorrect, records.filter(row => row.latest.correct).length);
  assert.equal(model.reading.complete, 1); assert.equal(model.reading.visited, 2);
  assert.equal(model.vocabulary.rated, 3); assert.equal(model.vocabulary.again, 1); assert.equal(model.vocabulary.hard, 1); assert.equal(model.vocabulary.good, 1);
  assert.equal(JSON.stringify(data), before);
});

test('partial homework completion reports full denominators and low-score redo does not replace the first score', () => {
  const data = compatibility.blank();
  submitGroup(data.homework, 1, 'choice', true, now);
  let model = summarize(data);
  assert.equal(model.homework.submitted, 5); assert.equal(model.homework.total, 225);
  assert.equal(model.automatic.submitted, 5); assert.equal(model.automatic.firstCorrect, 5); assert.equal(model.automatic.total, 150);
  assert.deepEqual(model.lessons[0].homeworkRoute, { feature: 'homework', lesson: 1, part: 'sort' });
  homework.restart(data.homework, 1, 'choice', now + 1);
  submitGroup(data.homework, 1, 'choice', false, now + 2);
  model = summarize(data);
  assert.equal(model.automatic.firstCorrect, 5); assert.equal(model.automatic.latestCorrect, 0);
  assert.equal(model.homework.submitted, 5); assert.equal(data.homework.lessons['1'].choice.history.length, 2);
});

test('reading marks, stars and vocabulary ratings never become homework completion or objective scores', () => {
  const data = nonempty(), initial = summarize(data);
  data.reading.lessons = Object.fromEntries(sources.bank.map(row => [row.lesson, { visited: true, complete: true }]));
  data.reading.mastered = { '1-你': true };
  data.practice.cards.schedule = {};
  data.practice.cards.review = null;
  const model = summarize(data);
  assert.equal(model.reading.complete, 15); assert.equal(model.reading.starred, 1); assert.equal(model.vocabulary.rated, 0);
  assert.deepEqual(model.homework, initial.homework); assert.deepEqual(model.automatic, initial.automatic);
  assert.deepEqual(model.translation, initial.translation); assert.deepEqual(model.listening, initial.listening);
});

test('due counts separate new cards from rated cards and include the exact due-time boundary', () => {
  const data = nonempty(), due = Math.min(...Object.values(data.practice.cards.schedule).map(row => row.dueAt));
  const before = summarize(data, due - 1), boundary = summarize(data, due);
  assert.equal(before.vocabulary.new, 341); assert.equal(before.vocabulary.dueRated, 0); assert.equal(before.vocabulary.due, 341);
  assert.equal(before.vocabulary.nextDueAt, due);
  assert.equal(boundary.vocabulary.dueRated, 1); assert.equal(boundary.vocabulary.due, 342);
  assert.ok(boundary.vocabulary.nextDueAt > due);
  const after = summarize(data, Math.max(...Object.values(data.practice.cards.schedule).map(row => row.dueAt)));
  assert.equal(after.vocabulary.dueRated, 3); assert.equal(after.vocabulary.due, 344); assert.equal(after.vocabulary.nextDueAt, null);
});

test('same written forms keep their different sense schedules and never reduce the 344 denominator to 319', () => {
  const data = compatibility.blank();
  practice.startReview(data.practice, catalog, { lessons: Array.from({ length: 15 }, (_, i) => i + 1), shuffle: false }, now);
  const first = catalog.vocabulary.find(item => catalog.vocabulary.some(other => item.zh === other.zh && item.senseId !== other.senseId));
  const second = catalog.vocabulary.find(item => item.zh === first.zh && item.senseId !== first.senseId);
  const fingerprints = data.practice.cards.review.fingerprints;
  data.practice.cards.schedule[first.senseId] = { fingerprint: fingerprints[first.senseId], level: 1, lastRating: 'good',
    dueAt: now + 86400000, ratedAt: now, reviewCount: 1 };
  data.practice.cards.schedule[second.senseId] = { fingerprint: fingerprints[second.senseId], level: 0, lastRating: 'again',
    dueAt: now + 600000, ratedAt: now, reviewCount: 1 };
  data.practice.cards.review = null;
  const model = summarize(compatibility.validate(data), now + 3);
  assert.equal(model.vocabulary.records, 344); assert.equal(model.vocabulary.distinctForms, 319);
  assert.equal(model.vocabulary.rated, 2); assert.equal(model.vocabulary.new, 342); assert.equal(model.vocabulary.totalSenses, 344);
  assert.equal(model.vocabulary.again, 1); assert.equal(model.vocabulary.good, 1);
});

test('continuation preserves textbook sections and homework parts, while practice resolves the actual saved item', () => {
  const data = nonempty();
  for (const route of [{ feature: 'textbook', lesson: 10, section: 'hanzi' }, { feature: 'homework', lesson: 15, part: 'translation' }]) {
    data.navigation = route; assert.deepEqual(progressResume(data, catalog).route, route);
  }
  data.navigation = { feature: 'listening', lesson: 1 };
  let resume = progressResume(data, catalog);
  assert.equal(resume.route.lesson, 7); assert.match(resume.label, /Câu 2\/15/);
  assert.match(resume.label, /第2\/15题/);
  for (const feature of ['vocabulary', 'review']) {
    data.navigation = { feature, lesson: 1 }; resume = progressResume(data, catalog);
    const round = data.practice.cards.review, card = catalog.vocabulary.find(row => row.senseId === round.senseIds[round.position]);
    assert.deepEqual(resume.route, { feature, lesson: card.lesson }); assert.match(resume.label, /Thẻ 4\/72/);
    assert.match(resume.label, /第4\/72张/);
  }
  assert.match(summarize(data).listeningResume.label, /Câu 2\/15/);
  assert.match(summarize(data).vocabularyResume.label, /Thẻ 4\/72/);
});

test('a saved module with no active round continues its selected route without inventing a position', () => {
  const data = compatibility.blank();
  data.navigation = { feature: 'listening', lesson: 10 };
  assert.deepEqual(progressResume(data, catalog).route, data.navigation);
  assert.doesNotMatch(progressResume(data, catalog).label, /Câu/);
  data.navigation = { feature: 'vocabulary', lesson: 15 };
  assert.deepEqual(progressResume(data, catalog).route, data.navigation);
  assert.doesNotMatch(progressResume(data, catalog).label, /Thẻ/);
  for (const feature of ['home', 'progress']) { data.navigation = { feature, lesson: 15 }; assert.equal(progressResume(data, catalog), null); }
});

test('validated backup export and restore reproduce the same progress and continuation without changing the schema', async () => {
  const memory = new Map(), store = createStore({ storage: { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value) },
    blank: compatibility.blank, validate: compatibility.validate, lock: async callback => callback() });
  const data = nonempty();
  const backup = JSON.stringify({ app: 'hsk1-modular-backup', schema: 1, exportedAt: now, data });
  assert.equal((await store.confirm(store.previewBackup(backup))).ok, true);
  assert.deepEqual(summarize(store.snapshot().data), summarize(data));
  const exported = JSON.parse(store.exportBackup());
  assert.equal(exported.schema, 1); assert.equal(exported.data.homework.schema, 3); assert.equal(exported.data.practice.schema, 1);
  store.dispose();
});
