'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const E = require('../../new-hsk1/hsk1/stage1/engine.js');
const Old = require('../../new-hsk1/hsk1/learning-engine.js');

function makeLesson(lesson, listening = false) {
  const row = {lesson, title: '第' + lesson + '课'};
  for (const kind of E.PATH.concat(listening ? ['listening'] : [])) {
    row[kind] = Array.from({length: 5}, (_, index) => {
      const base = {id: `l${String(lesson).padStart(2, '0')}-${kind}-${index + 1}`, kind, lesson};
      if (kind === 'translation') return {...base, assessment: 'manual', prompt: 'Tôi là giáo viên.'};
      if (kind === 'sort') return {...base, tokens: ['我', '明天', '在学校', '学习'],
        answers: ['我明天在学校学习。', '明天我在学校学习。'], legacyCompatible: true};
      return {...base, prompt: 'Chọn đáp án.', options: ['你好', '再见', '谢谢', '不客气'],
        answer: index % 4, legacyCompatible: true};
    });
  }
  return row;
}

const bank = [makeLesson(1), makeLesson(3), makeLesson(15, true)];
const lesson = id => bank.find(row => row.lesson === id);
const clone = value => JSON.parse(JSON.stringify(value));

function fill(state, id, kind, wrong = 0, value = '  我是老师。\n我也是学生。  ') {
  const g = E.group(state, id, kind);
  lesson(id)[kind].forEach((q, index) => {
    g.draft[q.id] = kind === 'translation' ? value : kind === 'sort' ?
      (index < wrong ? [3, 2, 1, 0] : [0, 1, 2, 3]) : (q.answer + (index < wrong ? 1 : 0)) % 4;
  });
  return g;
}

function submit(state, id, kind, wrong = 0, now = 1000) {
  fill(state, id, kind, wrong);
  return E.submit(state, id, kind, lesson(id)[kind], now);
}

function finishHomework(state, id = 3) {
  submit(state, id, 'choice', 1, 1000);
  submit(state, id, 'sort', 1, 2000);
  submit(state, id, 'translation', 0, 3000);
  return state;
}

function oldFixture(id = 3, corrected = false) {
  const legacyBank = makeLesson(id, true);
  legacyBank.translation = legacyBank.choice.map((q, i) => ({...q,
    id: `l${String(id).padStart(2, '0')}-translation-${i + 1}`, kind: 'translation'}));
  const state = Old.blank();
  for (const kind of Old.KINDS) {
    const qs = legacyBank[kind], g = Old.group(state, id, kind);
    for (const [i, q] of qs.entries()) g.draft[q.id] = kind === 'sort' ? [0, 1, 2, 3] :
      (q.answer + (i === 0 ? 1 : 0)) % 4;
    Old.submit(state, id, kind, qs, 1000 + Old.KINDS.indexOf(kind) * 1000);
    if (kind !== 'sort') {
      for (const q of qs) g.draft[q.id] = q.answer;
      Old.correct(state, id, kind, qs);
    }
  }
  if (!corrected) {
    for (const kind of Old.KINDS) {
      const g = state.lessons[id][kind];
      g.draft = clone(g.attempt.answers);
    }
  }
  state.words['3|老师'] = {known: true, lastAt: 777};
  state.preferences.lastLesson = id;
  state.updatedAt = 5000;
  return state;
}

test('CommonJS and browser UMD expose an isolated schema without touching storage', () => {
  assert.equal(E.KEY, 'ran_hsk1_stage1_v3');
  assert.equal(E.LEGACY_KEY, Old.KEY);
  assert.notEqual(E.KEY, Old.KEY);
  assert.equal(E.blank().schema, 3);
  const source = fs.readFileSync(path.join(__dirname, '../../new-hsk1/hsk1/stage1/engine.js'), 'utf8');
  const context = {window: {localStorage: new Proxy({}, {get() { throw new Error('No storage access'); }})}};
  vm.runInNewContext(source, context);
  assert.equal(context.window.HSKStep1Engine.KEY, E.KEY);
  assert.equal(context.window.HSKStep1Engine.blank().schema, 3);
});

test('choice and listening are independent; only earlier homework in the same lesson gates a group', () => {
  const state = E.blank();
  for (let id = 1; id <= 15; id++) {
    assert.equal(E.canOpen(state, id, 'choice'), true);
    assert.equal(E.canOpen(state, id, 'listening'), true);
    assert.equal(E.canOpen(state, id, 'sort'), false);
    assert.equal(E.canOpen(state, id, 'translation'), false);
  }
  assert.deepEqual(E.submit(state, 3, 'sort', lesson(3).sort), {ok: false, reason: 'locked'});
  submit(state, 3, 'choice', 5);
  assert.equal(E.canOpen(state, 3, 'sort'), true);
  assert.equal(E.canOpen(state, 1, 'sort'), false);
  assert.equal(E.canOpen(state, 15, 'sort'), false);
  assert.equal(E.canOpen(state, 3, 'translation'), false);
});

test('missing answers return exact item IDs without changing draft, score, or unlock', () => {
  const state = E.blank(), qs = lesson(3).choice, g = E.group(state, 3, 'choice');
  g.draft[qs[3].id] = 2;
  const result = E.submit(state, 3, 'choice', qs, 1000);
  assert.deepEqual(result, {ok: false, reason: 'missing', missing: qs.filter((_, i) => i !== 3).map(q => q.id)});
  assert.equal(g.draft[qs[3].id], 2);
  assert.equal(g.first, null);
  assert.equal(g.attempt, null);
  assert.equal(g.history.length, 0);
  assert.equal(E.canOpen(state, 3, 'sort'), false);
});

test('zero correct still completes and unlocks; no correction or score threshold is required', () => {
  const state = E.blank();
  const result = submit(state, 3, 'choice', 5);
  assert.equal(result.correct, 0);
  assert.equal(result.completed, true);
  assert.equal(E.canOpen(state, 3, 'sort'), true);
  assert.equal(E.canOpen(state, 3, 'translation'), false);
  submit(state, 3, 'sort', 5, 2000);
  assert.equal(E.canOpen(state, 3, 'translation'), true);
});

test('redo preserves first/latest and every completed unlock, then updates only latest/current', () => {
  const state = finishHomework(E.blank());
  const g = E.group(state, 3, 'choice'), first = clone(g.first), latest = clone(g.latest);
  E.restart(state, 3, 'choice', 4000);
  assert.equal(g.attempt, null);
  assert.deepEqual(g.draft, {});
  assert.deepEqual(g.first, first);
  assert.deepEqual(g.latest, latest);
  assert.equal(E.canOpen(state, 3, 'sort'), true);
  assert.equal(E.canOpen(state, 3, 'translation'), true);
  submit(state, 3, 'choice', 5, 5000);
  assert.equal(g.first.correct, 4);
  assert.equal(g.latest.correct, 0);
  assert.equal(g.attempt.correct, 0);
  assert.equal(g.history.length, 2);
  assert.equal(E.totals(state, 3, lesson(3)).automatic.firstCorrect, 8);
  assert.equal(E.totals(state, 3, lesson(3)).automatic.latestCorrect, 4);
});

test('double submit cannot alter scores and returned snapshots do not alias stored snapshots', () => {
  const state = E.blank(), result = submit(state, 3, 'choice');
  result.attempt.correct = 0;
  result.attempt.answers[lesson(3).choice[0].id] = 99;
  assert.equal(E.group(state, 3, 'choice').first.correct, 5);
  assert.equal(E.group(state, 3, 'choice').attempt.answers[lesson(3).choice[0].id], 0);
  assert.deepEqual(E.submit(state, 3, 'choice', lesson(3).choice), {ok: false, reason: 'submitted'});
  assert.equal(E.group(state, 3, 'choice').history.length, 1);
});

test('sort accepts reviewed alternate word order and punctuation; token identities handle duplicate text', () => {
  const q = lesson(3).sort[0];
  assert.equal(E.check(q, [0, 1, 2, 3]), true);
  assert.equal(E.check(q, [1, 0, 2, 3]), true);
  assert.equal(E.check(q, [0, 3, 2, 1]), false);
  const duplicate = {kind: 'sort', tokens: ['我', '的', '书', '和', '你', '的', '书'], answers: ['我的书和你的书。']};
  assert.equal(E.check(duplicate, [0, 1, 2, 3, 4, 5, 6]), true);
  assert.equal(E.check(duplicate, [0, 5, 6, 3, 4, 1, 2]), true);
  assert.equal(E.isAnswered(duplicate, [0, 1, 2, 3, 4, 1, 2]), false);
  assert.equal(E.isAnswered(duplicate, [0, 1, 2]), false);
  assert.equal(E.isAnswered(duplicate, [0, 1, 2, 3, 4, 5, 9]), false);
  assert.equal(E.normal('「ＨＳＫ」，\u200b我\u3000是老师！'), 'HSK我是老师');
});

test('objective selections use source option indexes, never displayed ABCD position or coerced strings', () => {
  const q = lesson(3).choice[2];
  assert.equal(E.check(q, 2), true);
  for (const invalid of ['2', -1, 4, 2.1, null, undefined, true, NaN]) assert.equal(E.isAnswered(q, invalid), false);
});

test('manual completion rejects Unicode/invisible-only blanks but does not judge language or rewrite text', () => {
  const q = lesson(3).translation[0];
  const blanks = ['', ' \t\r\n', '\u00a0\u3000', '\u200b\u200c\u200d\u2060\ufeff', '\uFE0F\u034F'];
  for (const value of blanks) {
    assert.equal(E.isAnswered(q, value), false);
    assert.equal(E.check(q, value), null);
  }
  for (const value of ['我', ' Tôi là học sinh. ', '🙂', '123', '<b>我是老师</b>', '  我是老师。\n\n我也是学生。  ']) {
    assert.equal(E.isAnswered(q, value), true);
    assert.equal(E.check(q, value), null);
  }
  for (const invalid of [0, 1, ['我'], {}, null]) assert.equal(E.isAnswered(q, invalid), false);
  assert.equal(E.isAnswered(q, '中'.repeat(12000)), true);
  assert.equal(E.isAnswered(q, '中'.repeat(12001)), false);
});

test('manual submissions never have automatic results, scores, or wrong-question review records', () => {
  const state = E.blank();
  submit(state, 3, 'choice');
  submit(state, 3, 'sort');
  const raw = '  我 是老师。\n\nTôi đang viết.\n\u200b  ';
  const g = fill(state, 3, 'translation', 0, raw);
  const result = E.submit(state, 3, 'translation', lesson(3).translation, 3000);
  assert.equal(result.manual, true);
  assert.equal(result.correct, null);
  assert.equal(result.total, 5);
  assert.equal(result.completed, true);
  for (const attempt of [g.first, g.attempt, g.latest, ...g.history]) {
    assert.equal(attempt.assessment, 'manual');
    assert.equal(attempt.results, null);
    assert.equal(attempt.correct, null);
    assert.equal(attempt.answers[lesson(3).translation[0].id], raw);
  }
  for (const q of lesson(3).translation) assert.equal(state.questionReviews[q.id], undefined);
  const saved = clone(g.latest);
  E.restart(state, 3, 'translation');
  g.draft[lesson(3).translation[0].id] = '新草稿';
  assert.deepEqual(g.latest, saved);
  assert.equal(g.completed, true);
});

test('manual empty fields block submission and identify all missing questions', () => {
  const state = E.blank(); submit(state, 3, 'choice'); submit(state, 3, 'sort');
  const qs = lesson(3).translation, g = E.group(state, 3, 'translation');
  g.draft[qs[0].id] = '我是老师。';
  g.draft[qs[1].id] = '\u3000\u200b';
  g.draft[qs[2].id] = '';
  assert.deepEqual(E.submit(state, 3, 'translation', qs).missing, qs.slice(1).map(q => q.id));
  assert.equal(g.completed, false);
});

test('totals use 15 homework tasks, exactly 10 automatic, and a separate optional listening result', () => {
  let state = E.blank();
  assert.deepEqual(E.totals(state, 3, lesson(3)), {
    homework: {total: 15, submitted: 0, completedGroups: 0, done: false},
    automatic: {total: 10, submitted: 0, firstCorrect: 0, latestCorrect: 0, firstPercent: null, latestPercent: null},
    manual: {total: 5, submitted: 0, correct: null},
    listening: {available: false, total: 0, submitted: 0, firstCorrect: 0, latestCorrect: 0, firstPercent: null, latestPercent: null}
  });
  submit(state, 3, 'choice', 1);
  let totals = E.totals(state, 3, lesson(3));
  assert.equal(totals.homework.submitted, 5);
  assert.equal(totals.automatic.submitted, 5);
  assert.equal(totals.automatic.firstPercent, 80); // 4/5 submitted, not 4/10 completed.
  assert.equal(totals.homework.done, false);
  submit(state, 3, 'sort', 1); submit(state, 3, 'translation');
  totals = E.totals(state, 3, lesson(3));
  assert.equal(totals.homework.submitted, 15);
  assert.equal(totals.automatic.firstCorrect, 8);
  assert.equal(totals.automatic.submitted, 10);
  assert.equal(totals.automatic.firstPercent, 80);
  assert.equal(totals.manual.submitted, 5);
  assert.equal(totals.homework.done, true);
  submit(state, 15, 'listening', 1);
  totals = E.totals(state, 15, lesson(15));
  assert.equal(totals.homework.submitted, 0);
  assert.equal(totals.automatic.firstCorrect, 0);
  assert.equal(totals.listening.firstCorrect, 4);
  assert.equal(totals.listening.submitted, 5);
});

test('backup round-trip retains partial drafts, display order, submitted text, profile, and redo snapshots', () => {
  const state = finishHomework(E.blank());
  state.profile = {name: ' Trần Thị Nhiên ', className: '汉语 A\n1'};
  state.preferences = {lastStage: 'translation', fontSize: 20, highContrast: false};
  E.restart(state, 3, 'sort');
  const sort = E.group(state, 3, 'sort');
  sort.draft[lesson(3).sort[0].id] = [1, 0];
  sort.orders[lesson(3).sort[0].id] = [3, 1, 0, 2];
  E.restart(state, 3, 'translation');
  const translation = E.group(state, 3, 'translation');
  translation.draft[lesson(3).translation[0].id] = '\n新草稿\n';
  translation.draft[lesson(3).translation[1].id] = ' \u200b ';
  const imported = E.validateImport(clone(state), bank);
  assert.deepEqual(imported.profile, state.profile);
  assert.deepEqual(imported.preferences, state.preferences);
  assert.deepEqual(imported.lessons[3].sort.draft, sort.draft);
  assert.deepEqual(imported.lessons[3].sort.orders, sort.orders);
  assert.deepEqual(imported.lessons[3].translation.draft, translation.draft);
  assert.deepEqual(imported.lessons[3].translation.latest, translation.latest);
  assert.equal(imported.lessons[3].sort.attempt, null);
  assert.equal(imported.lessons[3].sort.first.correct, 4);
  assert.equal(E.canOpen(imported, 3, 'translation'), true);
});

test('backup recomputes first/current/latest/history scores and forcibly removes manual scores', () => {
  const state = finishHomework(E.blank());
  for (const kind of E.PATH) {
    const g = state.lessons[3][kind];
    for (const a of [g.first, g.attempt, g.latest, ...g.history]) {
      a.correct = 999; a.total = 1; a.results = {forged: true}; a.assessment = 'automatic';
    }
  }
  state.questionReviews[lesson(3).translation[0].id] = {mistakes: 100, dueAt: 0};
  const imported = E.validateImport(state, bank);
  for (const kind of ['choice', 'sort']) {
    for (const a of [imported.lessons[3][kind].first, imported.lessons[3][kind].attempt,
      imported.lessons[3][kind].latest, ...imported.lessons[3][kind].history]) {
      assert.equal(a.correct, 4); assert.equal(a.total, 5);
    }
  }
  for (const a of [imported.lessons[3].translation.first, imported.lessons[3].translation.attempt,
    imported.lessons[3].translation.latest, ...imported.lessons[3].translation.history]) {
    assert.equal(a.correct, null); assert.equal(a.results, null); assert.equal(a.assessment, 'manual');
  }
  assert.equal(imported.questionReviews[lesson(3).translation[0].id], undefined);
});

test('backup rejects cross-lesson/group answers, invalid choice types, partial submissions, and extra IDs', () => {
  const wrongLesson = E.blank(); E.group(wrongLesson, 3, 'choice').draft[lesson(1).choice[0].id] = 0;
  assert.throws(() => E.validateImport(wrongLesson, bank));
  const wrongKind = E.blank(); E.group(wrongKind, 3, 'sort').draft[lesson(3).choice[0].id] = [0];
  assert.throws(() => E.validateImport(wrongKind, bank));
  const wrongType = E.blank(); E.group(wrongType, 3, 'choice').draft[lesson(3).choice[0].id] = '0';
  assert.throws(() => E.validateImport(wrongType, bank));
  const partial = finishHomework(E.blank()); delete partial.lessons[3].choice.first.answers[lesson(3).choice[0].id];
  assert.throws(() => E.validateImport(partial, bank));
  const extra = finishHomework(E.blank()); extra.lessons[3].choice.first.answers['foreign-id'] = 0;
  assert.throws(() => E.validateImport(extra, bank));
  const sort = E.blank(); E.group(sort, 3, 'sort').draft[lesson(3).sort[0].id] = [0, 0];
  assert.throws(() => E.validateImport(sort, bank));
});

test('backup rejects manual old indexes, huge text, bad profile/time, forged completion and invalid gates', () => {
  const oldValue = E.blank(); E.group(oldValue, 3, 'translation').draft[lesson(3).translation[0].id] = 1;
  assert.throws(() => E.validateImport(oldValue, bank));
  const huge = E.blank(); E.group(huge, 3, 'translation').draft[lesson(3).translation[0].id] = '中'.repeat(12001);
  assert.throws(() => E.validateImport(huge, bank));
  const badProfile = E.blank(); badProfile.profile.name = 'a'.repeat(201);
  assert.throws(() => E.validateImport(badProfile, bank));
  const badTime = E.blank(); badTime.updatedAt = '2026-10-01';
  assert.throws(() => E.validateImport(badTime, bank));
  const forged = E.blank(); E.group(forged, 3, 'choice').completed = true;
  assert.throws(() => E.validateImport(forged, bank));
  const gap = finishHomework(E.blank()); delete gap.lessons[3].choice;
  assert.throws(() => E.validateImport(gap, bank));
});

test('backup rejects stale same-ID question content and invalid shuffled orders', () => {
  const state = finishHomework(E.blank()), changedBank = clone(bank);
  changedBank[1].choice[0].options[0] = '你好吗';
  assert.throws(() => E.validateImport(state, changedBank), /Nội dung câu hỏi đã thay đổi/);
  const invalid = E.blank(); E.group(invalid, 3, 'choice').orders[lesson(3).choice[0].id] = [0, 1, 1, 3];
  assert.throws(() => E.validateImport(invalid, bank));
  const manualOrder = E.blank(); E.group(manualOrder, 3, 'translation').orders[lesson(3).translation[0].id] = [0, 1, 2, 3];
  assert.throws(() => E.validateImport(manualOrder, bank));
});

test('backup rejects unsafe object keys, cyclic values, unsupported lessons, and wrong schema without mutation', () => {
  const pollution = JSON.parse('{"schema":3,"lessons":{},"preferences":{"__proto__":{"polluted":true}}}');
  assert.throws(() => E.validateImport(pollution, bank));
  assert.equal({}.polluted, undefined);
  const constructor = E.blank(); constructor.preferences = JSON.parse('{"constructor":{"prototype":{"polluted":true}}}');
  assert.throws(() => E.validateImport(constructor, bank));
  const cycle = E.blank(); cycle.preferences.self = cycle;
  assert.throws(() => E.validateImport(cycle, bank));
  const unsupported = E.blank(); E.group(unsupported, 2, 'choice');
  assert.throws(() => E.validateImport(unsupported, bank));
  const old = oldFixture(); const snapshot = clone(old);
  assert.throws(() => E.validateImport(old, bank));
  assert.deepEqual(old, snapshot);
});

test('submission refuses malformed banks, fewer than five items, duplicate IDs and embedded manual answers', () => {
  const state = E.blank();
  assert.throws(() => E.submit(state, 3, 'choice', []));
  assert.throws(() => E.submit(state, 3, 'choice', lesson(3).choice.slice(0, 1)));
  const duplicate = clone(lesson(3).choice); duplicate[1].id = duplicate[0].id;
  assert.throws(() => E.submit(state, 3, 'choice', duplicate));
  const threeOptions = clone(bank); threeOptions[1].choice[0].options.pop();
  assert.throws(() => E.validateImport(E.blank(), threeOptions));
  const manualAnswers = clone(bank); manualAnswers[1].translation[0].answer = '我是老师。';
  assert.throws(() => E.validateImport(E.blank(), manualAnswers));
  assert.equal(Object.keys(state.lessons).length, 0);
});

test('retained history is bounded while the immutable first result and latest result survive backup', () => {
  const state = E.blank();
  for (let i = 0; i < 27; i++) {
    if (i) E.restart(state, 3, 'choice');
    submit(state, 3, 'choice', i === 0 ? 2 : i === 26 ? 5 : 0, 1000 + i);
  }
  assert.equal(state.lessons[3].choice.history.length, 20);
  const imported = E.validateImport(clone(state), bank);
  assert.equal(imported.lessons[3].choice.first.correct, 3);
  assert.equal(imported.lessons[3].choice.latest.correct, 0);
  assert.equal(imported.lessons[3].choice.history.length, 20);
});

test('real legacy-v2 records migrate compatible objective groups but archive every old translation untouched', () => {
  const legacy = oldFixture(), snapshot = clone(legacy);
  const migrated = E.migrateLegacy(legacy, bank, 10000);
  assert.equal(migrated.schema, 3);
  assert.deepEqual(legacy, snapshot);
  assert.deepEqual(migrated.archive.legacy, snapshot);
  assert.equal(migrated.lessons[3].choice.first.correct, 4);
  assert.equal(migrated.lessons[3].choice.latest.correct, 4);
  assert.equal(migrated.lessons[3].sort.first.correct, 5);
  assert.equal(migrated.lessons[3].translation, undefined);
  assert.equal(E.totals(migrated, 3, lesson(3)).homework.submitted, 10);
  assert.equal(E.totals(migrated, 3, lesson(3)).manual.submitted, 0);
  assert.equal(E.canOpen(migrated, 3, 'translation'), true);
  assert.equal(migrated.words['3|老师'].known, true);
  assert.equal(migrated.preferences.lastLesson, 3);
  assert.equal(migrated.archive.legacy.lessons[3].translation.first.answers['l03-translation-1'], 1);
  assert.equal(migrated.questionReviews['l03-translation-1'], undefined);
});

test('legacy corrected drafts remain an unsubmitted redo, preserving original first/last score and unlock', () => {
  const legacy = oldFixture(3, true);
  const migrated = E.migrateLegacy(legacy, bank, 10000), g = migrated.lessons[3].choice;
  assert.equal(g.first.correct, 4);
  assert.equal(g.latest.correct, 4);
  assert.equal(g.attempt, null);
  assert.equal(g.draft[lesson(3).choice[0].id], 0);
  assert.equal(g.completed, true);
  assert.equal(E.canOpen(migrated, 3, 'sort'), true);
  assert.equal(E.submit(migrated, 3, 'choice', lesson(3).choice, 11000).correct, 5);
  assert.equal(g.first.correct, 4);
});

test('changed/free-writing IDs cannot inherit completion; incompatible objective records remain archived', () => {
  const legacy = oldFixture(), revised = clone(bank);
  revised[1].choice[0].legacyCompatible = false;
  revised[1].choice[0].stem = 'Changed prompt';
  revised[1].translation = revised[1].translation.map(q => ({...q, id: q.id + '-free'}));
  const migrated = E.migrateLegacy(legacy, revised, 10000);
  assert.equal(migrated.lessons[3].choice.first, null);
  assert.equal(migrated.lessons[3].choice.completed, false);
  assert.equal(migrated.lessons[3].choice.draft[revised[1].choice[0].id], undefined);
  assert.equal(Object.keys(migrated.lessons[3].choice.draft).length, 4);
  assert.equal(migrated.lessons[3].sort.first, null);
  assert.equal(migrated.lessons[3].sort.completed, false);
  assert.equal(migrated.lessons[3].translation, undefined);
  assert.deepEqual(migrated.archive.legacy.lessons[3].translation, legacy.lessons[3].translation);
  assert.ok(migrated.archive.migration.heldGroups.includes('3:sort'));
  assert.equal(E.canOpen(migrated, 3, 'sort'), false);
  assert.doesNotThrow(() => E.validateImport(clone(migrated), revised));
});

test('legacy items without explicit compatibility never inherit and old listening remains independent', () => {
  const legacy = oldFixture(15), revised = clone(bank);
  for (const q of revised[2].choice) delete q.legacyCompatible;
  for (const q of revised[2].sort) delete q.legacyCompatible;
  const migrated = E.migrateLegacy(legacy, revised, 10000);
  assert.equal(migrated.lessons[15].choice, undefined);
  assert.equal(migrated.lessons[15].sort, undefined);
  assert.equal(migrated.lessons[15].listening.first.correct, 4);
  assert.equal(migrated.lessons[15].listening.completed, true);
  assert.equal(E.totals(migrated, 15, revised[2]).listening.firstCorrect, 4);
  assert.equal(E.totals(migrated, 15, revised[2]).automatic.submitted, 0);
});

test('bad legacy answers cannot fabricate completion and partial valid drafts are retained safely', () => {
  const legacy = oldFixture();
  legacy.lessons[3].choice.first.answers[lesson(3).choice[0].id] = 99;
  legacy.lessons[3].choice.draft[lesson(3).choice[1].id] = '1';
  const migrated = E.migrateLegacy(legacy, bank, 10000);
  assert.equal(migrated.lessons[3].choice.first, null);
  assert.equal(migrated.lessons[3].choice.completed, false);
  assert.equal(Object.keys(migrated.lessons[3].choice.draft).length, 4);
  assert.ok(migrated.archive.migration.warnings.length > 0);
  assert.deepEqual(migrated.archive.legacy, legacy);
});

test('every imported snapshot is copied; mutating an imported object cannot alter caller input or first snapshots', () => {
  const state = finishHomework(E.blank()), imported = E.validateImport(state, bank);
  const id = lesson(3).translation[0].id;
  imported.lessons[3].translation.attempt.answers[id] = 'changed';
  assert.notEqual(imported.lessons[3].translation.first.answers[id], 'changed');
  assert.notEqual(imported.lessons[3].translation.latest.answers[id], 'changed');
  assert.notEqual(state.lessons[3].translation.attempt.answers[id], 'changed');
});

test('the actual lesson-3 sample runs all 15 tasks and restores its real IDs without grading translation', () => {
  const realBank = require('../../new-hsk1/hsk1/stage1/sample-bank.js');
  const realLesson = realBank[0], state = E.blank();
  assert.equal(realBank.length, 1);
  assert.equal(realLesson.lesson, 3);
  assert.equal(realLesson.listening, undefined);
  for (const kind of E.PATH) {
    const qs = realLesson[kind], g = E.group(state, 3, kind);
    assert.equal(qs.length, 5);
    for (const q of qs) g.draft[q.id] = kind === 'choice' ? q.answer :
      kind === 'sort' ? q.tokens.map((_, i) => i) : '  我是学生。\n学生自己的译文。  ';
    const result = E.submit(state, 3, kind, qs, 1000 + E.PATH.indexOf(kind));
    assert.equal(result.ok, true);
    assert.equal(result.correct, kind === 'translation' ? null : 5);
  }
  const restored = E.validateImport(clone(state), realBank);
  const totals = E.totals(restored, 3, realLesson);
  assert.equal(totals.homework.total, 15);
  assert.equal(totals.homework.submitted, 15);
  assert.equal(totals.automatic.total, 10);
  assert.equal(totals.automatic.firstCorrect, 10);
  assert.equal(totals.manual.correct, null);
  assert.equal(totals.listening.available, false);
  assert.equal(Object.keys(restored.questionReviews).length, 10);
});

test('actual deployed v2 lesson-3 IDs are explicitly matched; old option-based translations stay archived', () => {
  const realBank = require('../../new-hsk1/hsk1/stage1/sample-bank.js');
  const legacyRow = require('../../new-hsk1/hsk1/question-bank/bank-01-05.json').find(row => row.lesson === 3);
  const state = Old.blank();
  for (const kind of Old.KINDS) {
    const qs = legacyRow[kind].map(q => ({...q, kind})), g = Old.group(state, 3, kind);
    for (const q of qs) g.draft[q.id] = kind === 'sort' ? q.tokens.map((_, i) => i) : q.answer;
    assert.equal(Old.submit(state, 3, kind, qs, 1000 + Old.KINDS.indexOf(kind)).correct, 5);
  }
  const migrated = E.migrateLegacy(state, realBank, 10000);
  assert.equal(migrated.lessons[3].choice.first.correct, 5);
  for (const q of realBank[0].sort) if (q.legacyCompatible === true) {
    assert.deepEqual(migrated.lessons[3].sort.draft[q.id], state.lessons[3].sort.draft[q.id]);
  }
  assert.equal(migrated.lessons[3].translation, undefined);
  assert.deepEqual(migrated.archive.legacy.lessons[3].translation, state.lessons[3].translation);
  assert.equal(E.totals(migrated, 3, realBank[0]).manual.submitted, 0);
  assert.equal(migrated.archive.legacy.lessons[3].listening.first.correct, 5);
  assert.doesNotThrow(() => E.validateImport(clone(migrated), realBank));
});

test('actual lesson-1 short and lesson-15 longer sort items accept full answers and reject omitted tokens', () => {
  const {solveSort} = require('./question-helpers.cjs');
  const first = require('../../new-hsk1/hsk1/question-bank/bank-01-05.json').find(row => row.lesson === 1);
  const last = require('../../new-hsk1/hsk1/question-bank/bank-11-15.json').find(row => row.lesson === 15);
  assert.ok(first.sort.some(q => q.tokens.length === 2), 'Use actual two-token beginner items.');
  assert.ok(last.sort.some(q => q.tokens.length >= 5), 'Use actual longer final-lesson items.');
  for (const item of [...first.sort, ...last.sort]) {
    const q = {...item, kind: 'sort'}, answer = solveSort(q);
    assert.equal(E.isAnswered(q, answer), true, q.id);
    assert.equal(E.check(q, answer), true, q.id);
    assert.equal(E.isAnswered(q, answer.slice(0, -1)), false, q.id + ' missing token');
    assert.equal(E.check(q, answer.slice(0, -1)), false, q.id + ' incomplete cannot score');
  }
});
