import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {buildFixtures, engines, FIXTURE_ROOT, FIXTURE_TIME, persistFixtures, sources} from '../tools/migration-fixtures.mjs';

const fixtures = buildFixtures(), data = sources();
const clone = value => JSON.parse(JSON.stringify(value));

test('all committed fixtures reproduce byte-for-byte with fixed timestamps and no private or media payload', () => {
  assert.equal(persistFixtures(fixtures), 12);
  assert.equal(fixtures['manifest.json'].synthetic, true);
  assert.equal(fixtures['manifest.json'].fixedTime, FIXTURE_TIME);
  for (const value of Object.values(fixtures)) {
    const text = JSON.stringify(value);
    assert.equal(text.includes('data:audio/'), false);
    assert.equal(text.includes('class-password'), false);
  }
  assert.equal(fs.readdirSync(FIXTURE_ROOT).filter(name => name.endsWith('.json')).length, 12);
});

test('reading, shared and navigation fixtures preserve distinct raw strings and non-HSK1 rows', () => {
  const raw = fixtures['reading-shared.json'];
  const progress = JSON.parse(raw.hsk1_ranteacher_progress_v1);
  assert.deepEqual(progress['1'], {visited: true, complete: false});
  assert.deepEqual(progress['15'], {visited: true, complete: true});
  assert.equal(Object.values(JSON.parse(raw.hsk1_ranteacher_mastered_v1)).filter(Boolean).length, 2);
  assert.deepEqual(JSON.parse(raw.hsk_module_progress_v1)['hsk2:4'].modules, ['text']);
  const nav = JSON.parse(fixtures['navigation.json'].ran_hsk1_integrated_nav_v1);
  assert.equal(nav.lesson, 10);
  assert.equal(nav.homeworkParts['10'], 'translation');
  assert.match(raw.hsk1_ranteacher_progress_v1, /\n/);
  assert.equal(fixtures['gate.json'].unlockedSession.hsk_portal_unlocked_v2, '1');
  assert.deepEqual(fixtures['gate.json'].lockedSession, {});
});

test('learning_v2 contains real old objective and translation submissions but no invented complete current group', () => {
  const legacy = fixtures['learning-v2.json'];
  const validated = engines.learning.validateImport(legacy, data.oldBank);
  for (const kind of ['choice', 'sort', 'translation', 'listening']) {
    const group = validated.lessons[1][kind];
    assert.ok(group.first.correct < 5);
    assert.equal(group.history.length, 2);
    assert.equal(group.first.total, 5);
  }
  assert.equal(typeof legacy.lessons[1].translation.first.answers[Object.keys(legacy.lessons[1].translation.first.answers)[0]], 'number');
  for (const kind of ['choice', 'sort']) {
    assert.equal(legacy.lessons[3][kind].first, null);
    assert.equal(legacy.lessons[3][kind].attempt, null);
    assert.equal(Object.keys(legacy.lessons[3][kind].draft).length, 1);
  }
  const migrated = engines.stage2.migrateLegacy(legacy, data.bank, FIXTURE_TIME);
  assert.deepEqual(migrated.archive.legacy, legacy);
  assert.deepEqual(migrated.archive.migration.restoredGroups, []);
  assert.deepEqual(migrated.archive.migration.draftOnlyGroups, ['3:choice', '3:sort']);
  assert.equal(migrated.lessons[1], undefined);
  assert.equal(migrated.lessons[3].translation, undefined);
  assert.equal(Object.keys(legacy.words).length, 2);
  assert.equal(legacy.preferences.listenSession.index, 1);
});

test('stage1 missing and explicit app fixtures migrate L3 and separate submitted translation A from redo B', () => {
  for (const name of ['stage1-default.json', 'stage1-explicit.json']) {
    const input = fixtures[name], state = engines.stage2.migrateStep1(input, data.bank, FIXTURE_TIME);
    assert.deepEqual(Object.keys(state.lessons), ['3']);
    const group = state.lessons[3].translation, id = Object.keys(group.draft)[0];
    assert.match(group.latest.answers[id], /匿名样本 A/);
    assert.match(group.draft[id], /匿名样本 B/);
    assert.equal(group.attempt, null);
    assert.equal(group.completed, true);
    assert.equal(group.first.correct, null);
    assert.equal(group.first.results, null);
    assert.equal(group.history.length, 1);
    assert.deepEqual(state.archive.step1, input);
  }
});

test('stage2 fixtures are valid nonempty states with both histories, long raw text, distinct drafts and recovery', () => {
  const current = engines.stage2.validateImport(fixtures['stage2.json'], data.bank);
  const previous = engines.stage2.validateImport(fixtures['stage2-recovery.json'], data.bank);
  assert.deepEqual(Object.keys(current.lessons), ['1', '15']);
  for (const lesson of [1, 15]) for (const kind of ['choice', 'sort']) {
    const group = current.lessons[lesson][kind];
    assert.ok(group.first.correct < 5);
    assert.equal(group.latest.correct, 5);
    assert.equal(group.history.length, 2);
  }
  const manual = current.lessons[15].translation, id = Object.keys(manual.latest.answers)[0];
  assert.ok(manual.latest.answers[id].length > 1200);
  assert.match(manual.latest.answers[id], /\n  /);
  assert.match(manual.draft[id], /匿名样本 B/);
  assert.equal(manual.attempt, null);
  assert.equal(manual.latest.correct, null);
  assert.equal(manual.latest.results, null);
  assert.equal(previous.lessons[15].translation.attempt.assessment, 'manual');
  assert.deepEqual(current.archive.legacy, fixtures['learning-v2.json']);
});

test('stage3 fixtures retain first/latest, unsubmitted listening selection/count, three schedules and partial review', () => {
  const state = engines.stage3.importBackup(fixtures['stage3.json'], data.catalog);
  const previous = engines.stage3.importBackup(fixtures['stage3-previous.json'], data.catalog);
  const record = Object.values(state.listening.records)[0];
  assert.equal(record.first.correct, false);
  assert.equal(record.latest.correct, true);
  assert.equal(record.attempts, 2);
  assert.equal(Object.values(previous.listening.records)[0].latest.correct, false);
  const session = state.listening.session, pending = session.responses[session.questionIds[session.position]];
  assert.equal(pending.selected, 2);
  assert.equal(pending.submission, null);
  assert.equal(pending.listenCount, 2);
  assert.deepEqual(state.preferences.lessons, [7, 11, 15]);
  assert.equal(state.preferences.rate, 0.75);
  assert.equal(state.preferences.direction, 'vi-zh');
  assert.deepEqual(Object.values(state.cards.schedule).map(item => item.lastRating), ['again', 'hard', 'good']);
  assert.equal(state.cards.review.position, 3);
  assert.equal(Object.keys(state.cards.review.ratings).length, 3);
  assert.equal(state.cards.review.finishedAt, null);
  for (const zh of ['在', '要']) {
    const senses = [...new Set(data.catalog.vocabulary.filter(item => item.zh === zh && [7, 11, 15].includes(item.lesson)).map(item => item.senseId))];
    assert.equal(senses.length, 2);
    assert.ok(senses.every(id => state.cards.review.senseIds.includes(id)));
  }
});

test('nonempty fixtures support meaningful bad identity, fingerprint and answer mutations without rewriting source', () => {
  const mutate = change => {const value = clone(fixtures['stage2.json']); change(value); return value;};
  assert.throws(() => engines.stage2.validateImport(mutate(value => {value.app = 'other-app';}), data.bank));
  assert.throws(() => engines.stage2.validateImport(mutate(value => {value.schema = 999;}), data.bank));
  assert.throws(() => engines.stage2.validateImport(mutate(value => {value.lessons[1].choice.draft.unknown = 1;}), data.bank));
  assert.throws(() => engines.stage2.validateImport(mutate(value => {
    const group = value.lessons[1].choice, id = Object.keys(group.first.answers)[0];
    group.first.questionFingerprints[id] = 'q1-deadbeef';
  }), data.bank));
  assert.throws(() => engines.stage2.validateImport(mutate(value => {
    const group = value.lessons[1].choice, id = Object.keys(group.first.answers)[0]; group.first.answers[id] = 99;
  }), data.bank));
  assert.throws(() => JSON.parse(fs.readFileSync(path.join(FIXTURE_ROOT, 'stage2.json'), 'utf8').slice(0, -4)));
});
