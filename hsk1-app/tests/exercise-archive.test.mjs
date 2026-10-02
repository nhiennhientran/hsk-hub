import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createExerciseCatalogue } from '../src/domain/exercises/catalogue.ts';
import { blankExercisesState, answerExercise, submitExercise, restartExercise, resetExercises } from '../src/domain/exercises/engine.ts';
import homework from '../src/domain/homework/engine.js';
import { archivedExercises, archivedAnswerText } from '../src/features/exercises/archive-data.ts';

const json = name => JSON.parse(readFileSync(new URL(`../content/${name}.json`, import.meta.url), 'utf8'));
const bank = json('stage2-bank');
const catalogue = createExerciseCatalogue(json('legacy-exercises'), bank);
const scope = (changes = {}) => ({ feature: 'exercises', lesson: 1, exerciseSet: 'original', exerciseGroup: 'choice', exerciseFilter: 'all', ...changes });
const task = id => catalogue.tasks.get(id);
const q = task('legacy:l01-choice-01');
const manual = task('legacy:9-t1');
const freeze = value => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
const record = (state, question, answer, at) => { answerExercise(state, question, answer); submitExercise(state, question, at); };

test('a retired URL cannot enumerate an untouched bank, even with a remembered position', () => {
  const state = blankExercisesState(); state.positions['original:1:choice:all'] = 'original:l01-choice-01';
  for (const filter of ['all', 'wrong', 'due']) assert.deepEqual(archivedExercises(catalogue, state, scope({ exerciseFilter: filter })), []);
  assert.equal(catalogue.entries.filter(entry => entry.set === 'original').length, 300);
  assert.equal(catalogue.entries.filter(entry => entry.set === 'pilot').length, 30);
});

test('projection is restricted to the exact set, lesson and group and preserves entry/authority identity', () => {
  const state = blankExercisesState(); record(state, q, q.answer, 2000);
  answerExercise(state, manual, '  我学习。\n原文  ');
  const entries = archivedExercises(catalogue, state, scope());
  assert.deepEqual(entries.map(item => [item.entry.id, item.task.id]), [['original:l01-choice-01', q.id]]);
  for (const changes of [{ lesson: 2 }, { exerciseGroup: 'translation' }, { exerciseSet: 'homework-review' }]) assert.equal(archivedExercises(catalogue, state, scope(changes)).length, 0);
  const pilot = archivedExercises(catalogue, state, scope({ exerciseSet: 'pilot', exerciseGroup: 'translation' }));
  assert.deepEqual(pilot.map(item => item.entry.id), ['pilot:9-t1']);
  assert.equal(pilot[0].timelines[0].draft, '  我学习。\n原文  ');
});

test('explicit zero, empty token and empty writing drafts remain drafts without synthetic scores or dates', () => {
  const state = blankExercisesState(); state.drafts[q.id] = 0; state.drafts['legacy:l01-sort-01'] = []; state.drafts[manual.id] = '';
  for (const route of [scope(), scope({ exerciseGroup: 'sort' }), scope({ exerciseSet: 'pilot', exerciseGroup: 'translation' })]) {
    const timeline = archivedExercises(catalogue, state, route)[0].timelines[0];
    assert.ok(Object.hasOwn(timeline, 'draft')); assert.equal(timeline.first, undefined); assert.equal(timeline.latest, undefined); assert.deepEqual(timeline.submissions, []);
  }
  assert.deepEqual(archivedExercises(catalogue, state, scope())[0].timelines[0].draft, 0);
});

test('first/latest/all submissions preserve saved order, timestamps, grades, fingerprints and retry drafts', () => {
  const state = blankExercisesState(); record(state, q, (q.answer + 1) % 4, 2000); restartExercise(state, q); record(state, q, q.answer, 1000); restartExercise(state, q); answerExercise(state, q, 0);
  const before = structuredClone(state); freeze(state);
  for (const filter of ['all', 'wrong', 'due']) {
    const timeline = archivedExercises(catalogue, state, scope({ exerciseFilter: filter }))[0].timelines[0];
    assert.deepEqual(timeline.submissions, before.records[q.id].submissions);
    assert.equal(timeline.first.at, 2000); assert.equal(timeline.latest.at, 1000);
    assert.equal(timeline.first.correct, false); assert.equal(timeline.latest.correct, true);
    assert.equal(timeline.draft, 0);
    timeline.submissions[0].answer = 99;
  }
  assert.deepEqual(state, before);
});

test('archiving never grades against an answer key or changes a stored result', () => {
  const state = blankExercisesState(); record(state, q, q.answer, 1000);
  // Storage validation remains the authority for validity. The read-only UI must not
  // become a second grading engine, even if a task key changes in a future release.
  const changedTask = { ...q, answer: (q.answer + 1) % 4 };
  const changed = { ...catalogue, tasks: new Map(catalogue.tasks).set(q.id, changedTask) };
  assert.equal(archivedExercises(changed, state, scope())[0].timelines[0].latest.correct, true);
  assert.deepEqual(state.records[q.id].submissions[0].answer, q.answer);
});

test('manual saved text, empty lines and Unicode remain exact and never acquire an automatic grade', () => {
  const written = '  我的原文\n\n保留空格。\u200b  ';
  const state = blankExercisesState(); record(state, manual, written, 3000); restartExercise(state, manual); answerExercise(state, manual, '新草稿\n  ');
  const timeline = archivedExercises(catalogue, state, scope({ exerciseSet: 'pilot', exerciseGroup: 'translation' }))[0].timelines[0];
  assert.equal(timeline.latest.answer, written); assert.equal(timeline.latest.correct, null); assert.equal(timeline.draft, '新草稿\n  ');
  assert.equal(archivedAnswerText(manual, written), written);
  assert.equal(archivedAnswerText(q, 0), q.options[0]);
  const sort = task('legacy:l01-sort-01'); assert.equal(archivedAnswerText(sort, [1, 0]), `${sort.tokens[1]} ${sort.tokens[0]}`);
});

test('shared authority data appears only under an entry in the selected scope', () => {
  const entry = catalogue.entries.find(entry => entry.set === 'original' && entry.authorityId.startsWith('homework:'));
  const question = task(entry.authorityId); const state = blankExercisesState(); state.drafts[question.id] = question.kind === 'sort' ? [] : 0;
  const result = archivedExercises(catalogue, state, scope({ lesson: entry.lesson, exerciseGroup: entry.group }));
  assert.equal(result.length, 1); assert.equal(result[0].entry.id, entry.id); assert.equal(result[0].task.id, entry.authorityId);
});

test('original homework receipts are separate from review attempts and never expose untouched aliases', () => {
  const old = homework.blank(); const questions = bank.lessons[2].choice;
  for (const question of questions) homework.group(old, 3, 'choice').draft[question.id] = question.answer;
  homework.submit(old, 3, 'choice', questions, 2000);
  const state = blankExercisesState(); const reviewed = task(`homework:${questions[0].id}`);
  record(state, reviewed, (reviewed.answer + 1) % 4, 1000);
  const before = structuredClone({ old, state }); freeze(old); freeze(state);
  const result = archivedExercises(catalogue, state, scope({ lesson: 3, exerciseSet: 'homework-review' }), old);
  assert.equal(result.length, 5); assert.deepEqual(result[0].timelines.map(value => value.source), ['homework', 'exercises']);
  assert.equal(result[0].timelines[0].first.correct, true); assert.equal(result[0].timelines[1].latest.correct, false);
  assert.equal(Object.hasOwn(result[0].timelines[0], 'draft'), false, 'submitted homework draft is not an unsubmitted draft');
  assert.equal(archivedExercises(catalogue, blankExercisesState(), scope({ lesson: 3 }), old).length, 0);
  assert.deepEqual({ old, state }, before);
});

test('capped original homework histories keep first and latest separate without fabricating lost attempts', () => {
  const old = homework.blank(); const questions = bank.lessons[0].choice;
  for (let i = 0; i < 25; i++) {
    if (i) homework.restart(old, 1, 'choice', 1000 + i);
    for (const question of questions) homework.group(old, 1, 'choice').draft[question.id] = question.answer;
    homework.submit(old, 1, 'choice', questions, 1000 + i);
  }
  const group = old.lessons['1'].choice;
  const timeline = archivedExercises(catalogue, blankExercisesState(), scope({ exerciseSet: 'homework-review' }), old)[0].timelines[0];
  assert.equal(timeline.first.at, group.first.at); assert.equal(timeline.latest.at, group.latest.at);
  assert.equal(timeline.submissions.length, group.history.length); assert.equal(timeline.submissions.length, 20);
  assert.ok(timeline.first.at < timeline.submissions[0].at);
});

test('a confirmed reset empties the projected scope while preserving the source and other lessons', () => {
  const state = blankExercisesState(); record(state, q, q.answer, 1000); answerExercise(state, manual, '保留');
  const candidate = resetExercises(state, catalogue, 1);
  assert.equal(archivedExercises(catalogue, candidate, scope()).length, 0);
  assert.equal(archivedExercises(catalogue, state, scope()).length, 1);
  assert.equal(archivedExercises(catalogue, candidate, scope({ exerciseSet: 'pilot', exerciseGroup: 'translation' })).length, 1);
});

test('archive view has no write, retry, grading, audio, or draft-exit owner and leaves maintenance module intact', () => {
  const archive = readFileSync(new URL('../src/features/exercises/archive.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(archive, /(?:\.edit\(|\.save\(|\.flush\(|requestSave\(|registerExitDraft\(|submitExercise\(|restartExercise\(|answerExercise\(|exerciseQueue\(|context\.audio)/);
  assert.doesNotMatch(archive, /element\(['"](?:input|textarea|button|select)['"]/);
  const maintenance = readFileSync(new URL('../src/features/exercises/index.ts', import.meta.url), 'utf8');
  assert.match(maintenance, /registerExitDraft/); assert.match(maintenance, /submitExercise/); assert.match(maintenance, /isComposing/);
});
