'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const E = require('../../new-hsk1/hsk1/stage2/engine.js');
const Step1 = require('../../new-hsk1/hsk1/stage1/engine.js');
const step1Bank = require('../../new-hsk1/hsk1/stage1/sample-bank.js');
const Old = require('../../new-hsk1/hsk1/learning-engine.js');
const {solveSort, wrongSort} = require('./question-helpers.cjs');
const clone = value => JSON.parse(JSON.stringify(value));
const actualBankFile = path.join(__dirname, '../../new-hsk1/hsk1/stage2/bank.js');

function makeLesson(lesson) {
  const row = {lesson, id: lesson, title: '测试课' + lesson};
  for (const kind of E.PATH) row[kind] = Array.from({length: 5}, (_, index) => {
    const q = {id: `s2-l${String(lesson).padStart(2, '0')}-${kind}-${index + 1}`, kind, legacyCompatible: false};
    if (kind === 'choice') return {...q, prompt: 'Chọn đáp án.', options: ['你好', '再见', '谢谢', '不客气'], answer: index % 4};
    if (kind === 'sort') return {...q, prompt: 'Ghép câu.', tokens: ['我', '明天', '去学校'], answers: ['我明天去学校。', '明天我去学校。']};
    return {...q, assessment: 'manual', prompt: 'Tôi là giáo viên.'};
  });
  return row;
}
const bank = Array.from({length: 15}, (_, i) => i === 2 ? clone(step1Bank[0]) : makeLesson(i + 1));
const row = (id, source = bank) => source.find(item => item.lesson === id);

function fill(state, id, kind, wrong = 0, source = bank, text = '  我是学生。\nTôi đang học tiếng Trung.  ') {
  const g = E.group(state, id, kind), qs = row(id, source)[kind];
  qs.forEach((q, index) => {
    g.draft[q.id] = kind === 'translation' ? text : kind === 'sort' ?
      (index < wrong ? wrongSort(q) : solveSort(q)) : (q.answer + (index < wrong ? 1 : 0)) % 4;
  });
  return g;
}
function submit(state, id, kind, wrong = 0, at = 1000, source = bank, text) {
  fill(state, id, kind, wrong, source, text);
  return E.submit(state, id, kind, row(id, source)[kind], at);
}
function finish(state, id, source = bank) {
  submit(state, id, 'choice', 1, id * 1000, source);
  submit(state, id, 'sort', 0, id * 1000 + 1, source);
  submit(state, id, 'translation', 0, id * 1000 + 2, source);
  return state;
}
function firstStepFixture() {
  const state = Step1.blank();
  for (const [position, kind] of Step1.PATH.entries()) {
    const qs = step1Bank[0][kind], g = Step1.group(state, 3, kind);
    for (const [index, q] of qs.entries()) g.draft[q.id] = kind === 'sort' ? solveSort(q) : kind === 'translation' ?
      '  第一步原始译文。\n保留空格和换行。  ' : (q.answer + (index === 0 ? 1 : 0)) % 4;
    Step1.submit(state, 3, kind, qs, 1000 + position);
  }
  state.profile = {name: 'Học sinh mẫu', className: 'CI · Step 1'};
  return state;
}
function legacyFixture() {
  const source = ['bank-01-05.json', 'bank-06-10.json', 'bank-11-15.json']
    .flatMap(file => require('../../new-hsk1/hsk1/question-bank/' + file));
  const state = Old.blank();
  for (const L of source) for (const [position, kind] of Old.KINDS.entries()) {
    const qs = L[kind].map(q => ({...q, kind})), g = Old.group(state, L.lesson, kind);
    for (const q of qs) g.draft[q.id] = kind === 'sort' ? solveSort(q) : q.answer;
    Old.submit(state, L.lesson, kind, qs, L.lesson * 1000 + position);
  }
  return state;
}

test('stage2 has a distinct storage/app identity and does not use browser storage', () => {
  assert.equal(E.APP, 'hsk1-stage2');
  assert.equal(E.KEY, 'ran_hsk1_stage2_v3');
  assert.equal(E.STEP1_KEY, Step1.KEY);
  assert.equal(E.LEGACY_KEY, Old.KEY);
  assert.equal(E.blank().schema, 3);
  assert.equal(E.blank().app, E.APP);
  assert.notEqual(E.KEY, Step1.KEY);
  const source = fs.readFileSync(path.join(__dirname, '../../new-hsk1/hsk1/stage2/engine.js'), 'utf8');
  const context = {window: {localStorage: new Proxy({}, {get() { throw new Error('No storage access'); }})}, TextEncoder};
  vm.runInNewContext(source, context);
  assert.equal(context.window.HSKStep2Engine.KEY, E.KEY);
  assert.equal(context.window.HSKStep1Engine, undefined);
  assert.equal(E.canOpen(Step1.blank(), 3, 'choice'), false);
  assert.throws(() => E.group(Step1.blank(), 3, 'choice'));
});

test('all fifteen lesson entries are independent; first and last lessons can start in any order', () => {
  const state = E.blank();
  for (let id = 1; id <= 15; id++) {
    assert.equal(E.canOpen(state, id, 'choice'), true);
    assert.equal(E.canOpen(state, id, 'sort'), false);
    assert.equal(E.canOpen(state, id, 'translation'), false);
  }
  submit(state, 15, 'choice', 5);
  assert.equal(E.canOpen(state, 15, 'sort'), true);
  assert.equal(E.canOpen(state, 1, 'sort'), false);
  assert.equal(E.canOpen(state, 14, 'sort'), false);
  submit(state, 1, 'choice', 5);
  assert.equal(E.canOpen(state, 1, 'sort'), true);
  assert.equal(E.canOpen(state, 15, 'translation'), false);
  assert.deepEqual(E.submit(state, 2, 'translation', row(2).translation), {ok: false, reason: 'locked'});
});

test('incomplete groups point to missing answers; a complete 0/5 submission opens the next group', () => {
  const state = E.blank(), qs = row(1).choice, g = E.group(state, 1, 'choice');
  g.draft[qs[0].id] = qs[0].answer;
  assert.deepEqual(E.submit(state, 1, 'choice', qs).missing, qs.slice(1).map(q => q.id));
  assert.equal(g.first, null);
  assert.equal(g.completed, false);
  const result = submit(state, 1, 'choice', 5);
  assert.equal(result.correct, 0);
  assert.equal(result.completed, true);
  assert.equal(E.canOpen(state, 1, 'sort'), true);
  submit(state, 1, 'sort', 5);
  assert.equal(E.canOpen(state, 1, 'translation'), true);
});

test('all 225 tasks finish with exactly 150 automatically assessed and 75 manual tasks', () => {
  const state = E.blank();
  for (let id = 1; id <= 15; id++) finish(state, id);
  const totals = E.courseTotals(state, bank);
  assert.deepEqual(totals.homework, {total: 225, submitted: 225, completedGroups: 45,
    completedLessons: 15, lessonCount: 15, done: true});
  assert.deepEqual(totals.automatic, {total: 150, submitted: 150,
    firstCorrect: 135, latestCorrect: 135, firstPercent: 90, latestPercent: 90});
  assert.deepEqual(totals.manual, {total: 75, submitted: 75, correct: null});
  assert.equal(totals.listening.available, false);
  assert.equal(totals.listening.total, 0);
  assert.equal(Object.keys(state.questionReviews).length, 150);
  for (const L of bank) for (const q of L.translation) assert.equal(state.questionReviews[q.id], undefined);
});

test('course percentages use only submitted objective answers and manual work never alters the denominator', () => {
  const state = E.blank();
  assert.equal(E.courseTotals(state, bank).automatic.firstPercent, null);
  submit(state, 15, 'choice', 1);
  let totals = E.courseTotals(state, bank);
  assert.equal(totals.automatic.total, 150);
  assert.equal(totals.automatic.submitted, 5);
  assert.equal(totals.automatic.firstCorrect, 4);
  assert.equal(totals.automatic.firstPercent, 80);
  submit(state, 15, 'sort'); submit(state, 15, 'translation');
  totals = E.courseTotals(state, bank);
  assert.equal(totals.automatic.submitted, 10);
  assert.equal(totals.homework.submitted, 15);
  assert.equal(totals.homework.completedLessons, 1);
});

test('redo preserves first scores, latest submitted snapshots, and all previously unlocked groups', () => {
  const state = finish(E.blank(), 15), g = E.group(state, 15, 'choice');
  const first = clone(g.first), latest = clone(g.latest);
  E.restart(state, 15, 'choice');
  assert.equal(g.attempt, null);
  assert.deepEqual(g.first, first);
  assert.deepEqual(g.latest, latest);
  assert.equal(E.canOpen(state, 15, 'translation'), true);
  submit(state, 15, 'choice', 5, 20000);
  assert.equal(g.first.correct, 4);
  assert.equal(g.latest.correct, 0);
  assert.equal(g.attempt.correct, 0);
  assert.equal(E.courseTotals(state, bank).automatic.firstCorrect, 9);
  assert.equal(E.courseTotals(state, bank).automatic.latestCorrect, 5);
  assert.deepEqual(E.submit(state, 15, 'choice', row(15).choice), {ok: false, reason: 'submitted'});
});

test('translations preserve original text, reject invisible-only completion, and always have null grades', () => {
  const state = E.blank(); submit(state, 1, 'choice'); submit(state, 1, 'sort');
  const qs = row(1).translation, q = qs[0], g = E.group(state, 1, 'translation');
  for (const blank of ['', '\n \t', '\u3000\u00a0', '\u200b\u200c\u200d\u2060\ufeff']) {
    assert.equal(E.isAnswered(q, blank), false); assert.equal(E.check(q, blank), null);
  }
  for (const value of ['我', 'Vietnamese only', '123', '<b>原文</b>']) {
    assert.equal(E.isAnswered(q, value), true); assert.equal(E.check(q, value), null);
  }
  const original = '  我是学生。\n\nTôi đang học.\n\u200b  ';
  fill(state, 1, 'translation', 0, bank, original);
  assert.equal(E.submit(state, 1, 'translation', qs).correct, null);
  for (const record of [g.first, g.latest, g.attempt, ...g.history]) {
    assert.equal(record.correct, null); assert.equal(record.results, null);
    assert.equal(record.assessment, 'manual'); assert.equal(record.answers[q.id], original);
  }
  E.restart(state, 1, 'translation'); g.draft[q.id] = '新草稿';
  assert.equal(g.latest.answers[q.id], original);
  assert.equal(g.first.answers[q.id], original);
  assert.equal(g.completed, true);
  assert.equal(E.isAnswered(q, '中'.repeat(12000)), true);
  assert.equal(E.isAnswered(q, '中'.repeat(12001)), false);
});

test('sorting supports reviewed alternative orders and duplicate token identities', () => {
  const q = row(1).sort[0];
  assert.equal(E.check(q, [0, 1, 2]), true);
  assert.equal(E.check(q, [1, 0, 2]), true);
  assert.equal(E.check(q, [2, 0, 1]), false);
  assert.equal(E.isAnswered(q, [0, 0, 2]), false);
  assert.equal(E.isAnswered(q, [0, 1]), false);
  const repeated = {kind: 'sort', tokens: ['我', '的', '书', '和', '你', '的', '书'], answers: ['我的书和你的书。']};
  assert.equal(E.check(repeated, [0, 5, 6, 3, 4, 1, 2]), true);
  assert.equal(E.check(repeated, [0, 1, 2, 3, 4, 1, 2]), false);
});

test('all-lesson backups preserve partial drafts, first/latest state, profile and display order', () => {
  const state = E.blank(); for (let id = 1; id <= 15; id++) finish(state, id);
  state.profile = {name: ' Trần Thị Nhiên ', className: 'HSK 1'};
  state.preferences = {currentLesson: 15, currentPart: 'translation'};
  E.restart(state, 1, 'sort');
  state.lessons[1].sort.draft[row(1).sort[0].id] = [1, 0];
  state.lessons[1].sort.orders[row(1).sort[0].id] = [2, 0, 1];
  E.restart(state, 15, 'translation');
  state.lessons[15].translation.draft[row(15).translation[0].id] = '\n新稿\n';
  const restored = E.importBackup(clone(state), bank);
  assert.deepEqual(restored.profile, state.profile);
  assert.deepEqual(restored.preferences, state.preferences);
  assert.deepEqual(restored.lessons[1].sort.draft, state.lessons[1].sort.draft);
  assert.deepEqual(restored.lessons[1].sort.orders, state.lessons[1].sort.orders);
  assert.deepEqual(restored.lessons[15].translation.latest, state.lessons[15].translation.latest);
  assert.equal(restored.lessons[15].translation.attempt, null);
  assert.equal(E.courseTotals(restored, bank).homework.completedLessons, 15);
});

test('backup grades are recalculated for every snapshot and cannot turn translation into a score', () => {
  const state = finish(E.blank(), 1);
  for (const kind of E.PATH) for (const a of [state.lessons[1][kind].first,
    state.lessons[1][kind].latest, state.lessons[1][kind].attempt, ...state.lessons[1][kind].history]) {
    a.correct = 999; a.total = 1; a.results = {forged: true}; a.assessment = 'automatic';
  }
  const restored = E.validateImport(state, bank);
  assert.equal(restored.lessons[1].choice.first.correct, 4);
  assert.equal(restored.lessons[1].sort.latest.correct, 5);
  assert.equal(restored.lessons[1].translation.first.correct, null);
  assert.equal(restored.lessons[1].translation.attempt.results, null);
});

test('corrupt IDs, types, gates, histories and same-ID changed questions are rejected', () => {
  const wrongLesson = E.blank(); E.group(wrongLesson, 1, 'choice').draft[row(15).choice[0].id] = 0;
  assert.throws(() => E.validateImport(wrongLesson, bank));
  const wrongType = E.blank(); E.group(wrongType, 1, 'choice').draft[row(1).choice[0].id] = '0';
  assert.throws(() => E.validateImport(wrongType, bank));
  const wrongManual = E.blank(); E.group(wrongManual, 1, 'translation').draft[row(1).translation[0].id] = 0;
  assert.throws(() => E.validateImport(wrongManual, bank));
  const wrongGate = finish(E.blank(), 1); delete wrongGate.lessons[1].choice;
  assert.throws(() => E.validateImport(wrongGate, bank));
  const wrongHistory = finish(E.blank(), 1); wrongHistory.lessons[1].choice.history[0].answers[row(1).choice[0].id] = 99;
  assert.throws(() => E.validateImport(wrongHistory, bank));
  const changed = clone(bank); changed[0].choice[0].prompt += ' changed';
  assert.throws(() => E.validateImport(finish(E.blank(), 1), changed));
});

test('prototype pollution, cyclic JSON, wrong app identities and forged completed flags fail safely', () => {
  const raw = E.blank(); raw.preferences = JSON.parse('{"__proto__":{"polluted":true}}');
  assert.throws(() => E.importBackup(raw, bank)); assert.equal({}.polluted, undefined);
  const cyclic = E.blank(); cyclic.preferences.self = cyclic;
  assert.throws(() => E.validateImport(cyclic, bank));
  const wrongApp = E.blank(); wrongApp.app = 'another-course';
  assert.throws(() => E.importBackup(wrongApp, bank));
  const forged = E.blank(); E.group(forged, 1, 'choice').completed = true;
  assert.throws(() => E.validateImport(forged, bank));
});

test('Step1 is accepted only through explicit import, preserving the identical L3 originals and source archive', () => {
  const source = firstStepFixture(), original = clone(source);
  assert.throws(() => E.validateImport(source, bank));
  const imported = E.importBackup(source, bank, 10000);
  assert.equal(imported.app, E.APP);
  assert.deepEqual(source, original);
  assert.deepEqual(imported.archive.step1, original);
  assert.equal(imported.lessons[3].choice.first.correct, 4);
  assert.equal(imported.lessons[3].sort.first.correct, 5);
  assert.equal(imported.lessons[3].translation.first.correct, null);
  assert.deepEqual(imported.lessons[3].translation.latest.answers, source.lessons[3].translation.latest.answers);
  assert.equal(E.courseTotals(imported, bank).homework.submitted, 15);
  for (const id of [1, 2, 4, 15]) assert.equal(imported.lessons[id], undefined);
  assert.doesNotThrow(() => E.validateImport(clone(imported), bank));
});

test('Step1 changed IDs/content, other courses and recursively wrapped Step1 archives cannot be misidentified', () => {
  const source = firstStepFixture(), changed = clone(bank);
  changed[2].choice[0].stem = 'changed';
  assert.throws(() => E.migrateStep1(source, changed));
  const wrongCourse = clone(source); wrongCourse.lessons[1] = {};
  assert.throws(() => E.importBackup(wrongCourse, bank));
  const wrapped = clone(source); wrapped.archive = {step1: clone(source)};
  assert.throws(() => E.migrateStep1(wrapped, bank));
  for (const archive of [null, [], 'malformed archive']) {
    const invalid = clone(source); invalid.archive = archive;
    assert.throws(() => E.migrateStep1(invalid, bank));
  }
  const revised = clone(bank); revised[2].translation[0].id += '-changed';
  assert.throws(() => E.migrateStep1(source, revised));
});

test('legacy-v2 all-course records retain old translations only as archive; new IDs never inherit old scores', () => {
  const source = legacyFixture(), original = clone(source);
  const imported = E.importBackup(source, bank, 10000);
  assert.deepEqual(source, original);
  assert.deepEqual(imported.archive.legacy, original);
  assert.equal(imported.lessons[3].choice.first.correct, 5);
  assert.equal(imported.lessons[3].sort.first.correct, 5);
  assert.equal(E.courseTotals(imported, bank).manual.submitted, 0);
  assert.equal(E.courseTotals(imported, bank).automatic.submitted, 10);
  for (let id = 1; id <= 15; id++) {
    assert.equal(imported.lessons[id]?.translation?.first ?? null, null);
    if (id !== 3) assert.equal(imported.lessons[id], undefined);
    assert.ok(imported.archive.legacy.lessons[id].translation.first);
  }
});

test('explicit false compatibility prevents a same-ID changed legacy item from restoring group completion', () => {
  const source = legacyFixture(), revised = clone(bank);
  revised[2].choice[0].legacyCompatible = false;
  const imported = E.migrateLegacy(source, revised);
  assert.equal(imported.lessons[3].choice.first, null);
  assert.equal(imported.lessons[3].choice.completed, false);
  assert.equal(Object.keys(imported.lessons[3].choice.draft).length, 4);
  assert.equal(imported.lessons[3].sort.first, null);
  assert.equal(E.canOpen(imported, 3, 'sort'), false);
  assert.deepEqual(imported.archive.legacy, source);
});

test('UTF-8 backup byte counting distinguishes Unicode, control escapes and string-length limits', () => {
  for (const value of ['中', 'Tiếng Việt', '😀', '\u0001', {text: '中\n😀\u0000'}, {a: [1, null, true]}]) {
    assert.equal(E.backupByteLength(value), Buffer.byteLength(JSON.stringify(value), 'utf8'));
  }
  assert.equal(E.backupByteLength('中'), 5);
  assert.equal(E.backupByteLength('\u0001'), 8);
  assert.equal(E.MAX_BACKUP_BYTES, 192 * 1024 * 1024);
  assert.equal(E.MAX_ARCHIVE_BYTES, 32 * 1024 * 1024);
  assert.equal(E.MAX_AUXILIARY_BYTES, 4 * 1024 * 1024);
  assert.equal(E.MAX_BACKUP_WARNING_BYTES, 8 * 1024 * 1024);
  const theoreticalText = 75 * 12000 * (20 + 4) * 6;
  assert.ok(E.MAX_BACKUP_BYTES > theoreticalText + E.MAX_ARCHIVE_BYTES + E.MAX_AUXILIARY_BYTES + 4 * 1024 * 1024);
});

test('five courses with 20 legal 12k-character translation submissions reproduce and fix the old >5MB failure', () => {
  const state = E.blank(), longText = ('汉语学习记录 Vietnamese learning draft.\n'.repeat(400)).slice(0, 12000);
  assert.equal(longText.length, 12000);
  for (let id = 1; id <= 5; id++) {
    submit(state, id, 'choice'); submit(state, id, 'sort');
    for (let attempt = 0; attempt < 20; attempt++) {
      if (attempt) E.restart(state, id, 'translation');
      submit(state, id, 'translation', 0, id * 1000 + attempt, bank, longText);
    }
  }
  const size = E.backupByteLength(state);
  assert.ok(size > 5 * 1024 * 1024, 'This fixture must exceed the old failing limit.');
  const imported = E.validateImport(state, bank);
  assert.equal(imported.lessons[5].translation.history.length, 20);
  assert.equal(imported.lessons[5].translation.first.answers[row(5).translation[0].id], longText);
  assert.equal(imported.lessons[5].translation.latest.answers[row(5).translation[4].id], longText);
  assert.equal(E.courseTotals(imported, bank).manual.submitted, 25);
});

test('archives and auxiliary values have independent size limits and deep recursion is rejected', () => {
  const oversizedAuxiliary = E.blank(); oversizedAuxiliary.preferences.large = 'x'.repeat(E.MAX_AUXILIARY_BYTES);
  assert.throws(() => E.validateImport(oversizedAuxiliary, bank), /4 MiB/);
  const oversizedArchive = E.blank(); oversizedArchive.archive.opaque = 'x'.repeat(E.MAX_ARCHIVE_BYTES);
  assert.throws(() => E.validateImport(oversizedArchive, bank), /32 MiB/);
  const nested = E.blank(); let target = nested.archive;
  for (let index = 0; index < 42; index++) { target.next = {}; target = target.next; }
  assert.throws(() => E.validateImport(nested, bank), /nhiều cấp/);
});

test('the actual 15-course bank has 225 tasks and every reviewed automatic answer runs through the engine',
  {skip: !fs.existsSync(actualBankFile) && 'Content bank is still being authored.'}, () => {
    const actual = require(actualBankFile), state = E.blank();
    assert.equal(actual.length, 15);
    assert.deepEqual(actual.map(L => L.lesson).sort((a, b) => a - b), Array.from({length: 15}, (_, i) => i + 1));
    for (const L of actual) {
      assert.equal(L.choice.length, 5); assert.equal(L.sort.length, 5); assert.equal(L.translation.length, 5);
      assert.ok(!L.listening || L.listening.length === 0);
      for (const kind of E.PATH) {
        if (kind === 'sort') for (const q of L.sort) for (const answer of q.answers) {
          const order = solveSort({...q, answers: [answer]});
          assert.equal(E.check(q, order), true, `${q.id}: every published alternative must use the supplied tokens and be accepted.`);
        }
        const result = submit(state, L.lesson, kind, 0, L.lesson * 1000 + E.PATH.indexOf(kind), actual);
        assert.equal(result.ok, true);
        assert.equal(result.correct, kind === 'translation' ? null : 5);
      }
    }
    const totals = E.courseTotals(E.validateImport(state, actual), actual);
    assert.equal(totals.homework.submitted, 225);
    assert.equal(totals.automatic.firstCorrect, 150);
    assert.equal(totals.manual.submitted, 75);
  });

test('actual 75 translation items with multiple long submissions export above 5MB and restore without truncation',
  {skip: !fs.existsSync(actualBankFile) && 'Content bank is still being authored.'}, () => {
    const actual = require(actualBankFile), state = E.blank();
    const longText = '这是完整的学生长稿。Đây là bài viết có dấu và xuống dòng.\n'.repeat(300).slice(0, 12000);
    assert.equal(longText.length, 12000);
    for (const L of actual) {
      submit(state, L.lesson, 'choice', 0, 1000, actual);
      submit(state, L.lesson, 'sort', 0, 1001, actual);
      for (let i = 0; i < 3; i++) {
        if (i) E.restart(state, L.lesson, 'translation');
        submit(state, L.lesson, 'translation', 0, 1002 + i, actual, longText);
      }
    }
    assert.ok(E.backupByteLength(state) > 5 * 1024 * 1024);
    const restored = E.validateImport(state, actual);
    for (const L of actual) for (const q of L.translation) {
      assert.equal(restored.lessons[L.lesson].translation.first.answers[q.id], longText);
      assert.equal(restored.lessons[L.lesson].translation.latest.answers[q.id], longText);
      assert.equal(restored.lessons[L.lesson].translation.history.length, 3);
    }
    assert.equal(E.courseTotals(restored, actual).homework.submitted, 225);
  });
