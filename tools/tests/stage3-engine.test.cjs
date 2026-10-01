'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const E = require('../../new-hsk1/hsk1/stage3/engine.js');
const clone = value => JSON.parse(JSON.stringify(value));
const code = expected => error => error.code === expected;
const source = {printPages: [1], pdfPages: [16], section: 'Test fixture, not curriculum content'};
const audio = {track: '1-6', start: 0, end: 1.5, timingBasis: 'test-fixture'};
const pad = n => String(n).padStart(2, '0');
function vocabulary(id, senseId, lesson, zh, vi, overrides = {}) {
  return {id, lexId: `lex-${senseId}`, senseId, lesson, zh, py: 'cè shì', vi,
    senseZh: `测试义项 ${senseId}`, category: 'ordinary', extension: false, source, audio, ...overrides};
}
function fixture() {
  return {
    listening: Array.from({length: 75}, (_, i) => ({id: `l${pad(Math.floor(i / 5) + 1)}-listen-${pad(i % 5 + 1)}`,
      lesson: Math.floor(i / 5) + 1, kind: 'word', promptVi: 'Nghe và chọn nghĩa đúng.',
      audio: {...audio, track: `${Math.floor(i / 5) + 1}-1`},
      transcript: [{zh: '你好。', py: 'Nǐ hǎo.', vi: 'Xin chào.'}],
      options: ['Xin chào.', 'Cảm ơn.', 'Tạm biệt.', 'Xin lỗi.'], answer: i % 4,
      explanationVi: 'Nội dung giả lập để kiểm tra chương trình.',
      optionFeedback: ['Một', 'Hai', 'Ba', 'Bốn'], keywords: [], skill: 'test', source})),
    vocabulary: [
      vocabulary('v-l01-ni', 'ni-s1', 1, '你', 'bạn'),
      vocabulary('v-l03-ni', 'ni-s1', 3, '你', 'bạn (người nghe)'),
      vocabulary('v-l03-xiang1', 'xiang-s1', 3, '想', 'nhớ'),
      vocabulary('v-l06-xiang2', 'xiang-s2', 6, '想', 'muốn'),
      vocabulary('v-l12-tian1', 'tian-s1', 12, '天', 'ngày'),
      vocabulary('v-l12-tian2', 'tian-s2', 12, '天', 'trời'),
      vocabulary('v-l09-shang1', 'shang-s1', 9, '上', 'ở trên'),
      vocabulary('v-l14-shang2', 'shang-s2', 14, '上', 'trước'),
      vocabulary('v-l14-shang3', 'shang-s3', 14, '上', 'đi học'),
      vocabulary('v-l04-number', 'number-s1', 4, '十五', 'mười lăm', {audio: null}),
      vocabulary('v-l06-place', 'place-s1', 6, '北京', 'Bắc Kinh', {category: 'proper_noun'}),
      vocabulary('v-l10-buy', 'buy-s1', 10, '买', 'mua', {extension: true})
    ]
  };
}
const catalog = fixture(), allLessons = Array.from({length: 15}, (_, i) => i + 1);
const single = {...catalog, vocabulary: [catalog.vocabulary[0]]};
function seeded(seed = 9) { return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }; }
function startListening(state, options = {}, now = 1000, data = catalog) {
  return E.createListeningSession(state, data, {lessons: [1], mode: 'all', shuffle: false, ...options}, now, seeded());
}
function currentQuestion(state, data = catalog) {
  return data.listening.find(q => q.id === state.listening.session.questionIds[state.listening.session.position]);
}
function answerCurrent(state, correct = true, now = 2000, data = catalog) {
  const q = currentQuestion(state, data);
  E.selectListening(state, data, q.id, (q.answer + (correct ? 0 : 1)) % 4, now);
  return E.submitListening(state, data, now);
}
function finishListening(state, options = {}, data = catalog, at = 1000) {
  const session = startListening(state, options, at, data);
  for (let i = 0; i < session.questionIds.length; i++) {
    answerCurrent(state, i !== 0, at + i + 1, data); E.nextListening(state, at + i + 1);
  }
  return session;
}
function rateSingle(state, rating, now, data = single) {
  const review = E.startReview(state, data, {lessons: [1], filter: 'all', direction: 'zh-vi', shuffle: false}, now, seeded());
  E.revealCard(state, review.senseIds[0], now);
  return E.rateCard(state, data, rating, now);
}

test('stage3 identity is isolated and the UMD module touches no storage, document or media', () => {
  assert.equal(E.APP, 'hsk1-stage3'); assert.equal(E.KEY, 'ran_hsk1_stage3_v1'); assert.equal(E.SCHEMA, 1);
  for (const older of ['stage1', 'stage2']) {
    const Old = require(`../../new-hsk1/hsk1/${older}/engine.js`);
    assert.notEqual(E.KEY, Old.KEY); assert.throws(() => E.importBackup(Old.blank(), catalog), code('WRONG_APP'));
  }
  const forbidden = new Proxy({}, {get() { throw new Error('DOM/storage/media are forbidden'); }});
  const context = {window: {document: forbidden, localStorage: forbidden, Audio: forbidden}, TextEncoder};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../../new-hsk1/hsk1/stage3/engine.js'), 'utf8'), context);
  assert.equal(context.window.HSKStep3Engine.blank().app, E.APP);
});

test('preferences validate lessons, module, direction, filters and exactly five rates', () => {
  const state = E.blank();
  const prefs = E.setPreferences(state, {lessons: [15, 1, 15, 3], direction: 'vi-zh', module: 'vocabulary'}, 10);
  assert.deepEqual(prefs.lessons, [1, 3, 15]); assert.equal(state.updatedAt, 10);
  for (const rate of [0.65, 0.75, 1, 1.25, 1.5]) assert.equal(E.setPreferences(state, {rate}, 11).rate, rate);
  for (const patch of [{rate: 2}, {module: 'old-homework'}, {lessons: [0]}, {lessons: ['1']},
    {direction: 'mixed'}, {vocabularyFilter: 'objective-wrong'}, {unknown: true}]) {
    assert.throws(() => E.setPreferences(state, patch, 12));
  }
  E.setPreferences(state, {lessons: []}, 13); assert.deepEqual(state.preferences.lessons, []);
});

test('listening sessions freeze mixed-course question IDs and source-option permutations across selection and restore', () => {
  const state = E.blank();
  const session = startListening(state, {lessons: [1, 15, 3], shuffle: true});
  const initialIds = session.questionIds.slice(), initialOrders = clone(session.optionOrders);
  assert.equal(initialIds.length, 15); assert.equal(new Set(initialIds).size, 15);
  for (const id of initialIds) assert.deepEqual(session.optionOrders[id].slice().sort(), [0, 1, 2, 3]);
  const q = currentQuestion(state); E.selectListening(state, catalog, q.id, q.answer, 1001);
  assert.equal(session.responses[q.id].submission, null); assert.equal(state.listening.records[q.id], undefined);
  const restored = E.importBackup(clone(state), catalog);
  assert.deepEqual(restored.listening.session.questionIds, initialIds);
  assert.deepEqual(restored.listening.session.optionOrders, initialOrders);
  assert.equal(restored.listening.session.responses[q.id].selected, q.answer);
  assert.equal(restored.listening.session.position, 0);
  assert.equal('autoplay' in restored.listening.session, false);
});

test('missing answers, premature navigation and re-submission are refused; selecting alone never reveals grading', () => {
  const state = E.blank(); startListening(state);
  assert.throws(() => E.submitListening(state, catalog), code('ANSWER_REQUIRED'));
  assert.throws(() => E.nextListening(state), code('ANSWER_REQUIRED'));
  assert.throws(() => E.moveListening(state, 2), code('ANSWER_REQUIRED'));
  const q = currentQuestion(state);
  assert.throws(() => E.selectListening(state, catalog, q.id, '0'), code('INVALID_ANSWER'));
  assert.throws(() => E.selectListening(state, catalog, 'l15-listen-01', 0), code('NOT_CURRENT'));
  const selected = E.selectListening(state, catalog, q.id, q.answer, 1002);
  assert.deepEqual(selected, {selected: q.answer, submission: null, listenCount: 0});
  assert.equal(E.submitListening(state, catalog, 1003).correct, true);
  assert.throws(() => E.submitListening(state, catalog), code('ALREADY_SUBMITTED'));
  assert.throws(() => E.selectListening(state, catalog, q.id, 1), code('ALREADY_SUBMITTED'));
  E.nextListening(state, 1004); assert.equal(state.listening.session.position, 1);
  E.moveListening(state, 0, 1005); assert.equal(state.listening.session.position, 0);
});

test('relistening before and after submission never deducts points and recovery retains only the question position', () => {
  const state = E.blank(); startListening(state); const q = currentQuestion(state);
  for (let i = 1; i <= 7; i++) assert.equal(E.recordListen(state, catalog, q.id, 1000 + i), i);
  answerCurrent(state, true, 2000); E.recordListen(state, catalog, q.id, 2001);
  assert.equal(state.listening.records[q.id].first.correct, true);
  assert.equal(state.listening.records[q.id].attempts, 1);
  E.nextListening(state, 2002);
  const restored = E.importBackup(state, catalog);
  assert.equal(restored.listening.session.position, 1);
  assert.equal(restored.listening.session.responses[q.id].listenCount, 8);
  assert.equal(E.listeningSummary(restored, catalog).session.correct, 1);
  assert.deepEqual(restored.cards, E.blank().cards);
});

test('first and latest listening results remain distinct; wrong mode follows latest and its queue stays frozen', () => {
  const state = E.blank(); const completed = finishListening(state); const wrong = completed.questionIds[0];
  let totals = E.listeningSummary(state, catalog);
  assert.deepEqual(totals.session, {total: 5, answered: 5, unanswered: 0, correct: 4, percentAmongAnswered: 80, done: true});
  const session = startListening(state, {mode: 'wrong'}, 3000);
  assert.deepEqual(session.questionIds, [wrong]); answerCurrent(state, true, 3001);
  assert.deepEqual(session.questionIds, [wrong]);
  totals = E.listeningSummary(state, catalog);
  assert.equal(totals.overall.firstCorrect, 4); assert.equal(totals.overall.latestCorrect, 5);
  assert.equal(state.listening.records[wrong].attempts, 2); assert.deepEqual(totals.wrongIds, []);
  assert.equal(startListening(state, {mode: 'wrong'}, 4000).questionIds.length, 0);
  assert.equal(E.listeningSummary(state, catalog).session.done, false);
  assert.throws(() => E.nextListening(state), code('EMPTY_SESSION'));
});

test('all 75 listening items use a separate denominator, and partial percentages identify answered counts', () => {
  const state = E.blank(); startListening(state, {lessons: allLessons});
  assert.equal(E.listeningSummary(state, catalog).session.percentAmongAnswered, null);
  answerCurrent(state, true, 1100);
  let totals = E.listeningSummary(state, catalog);
  assert.equal(totals.session.total, 75); assert.equal(totals.session.answered, 1);
  assert.equal(totals.session.percentAmongAnswered, 100); assert.equal(totals.overall.total, 75);
  finishListening(state, {lessons: allLessons}, catalog, 2000);
  totals = E.listeningSummary(state, catalog);
  assert.equal(totals.session.answered, 75); assert.equal(totals.session.correct, 74);
  assert.equal(totals.overall.answered, 75); assert.equal(totals.overall.firstCorrect, 75);
  assert.equal(totals.overall.latestCorrect, 74);
  assert.deepEqual(E.importBackup(E.exportBackup(state, catalog), catalog).listening.records, state.listening.records);
});

test('empty and non-contiguous lesson selections never silently include another course', () => {
  const state = E.blank(); startListening(state, {lessons: []});
  assert.equal(E.listeningSummary(state, catalog).session.total, 0);
  const deck = E.makeDeck(state, catalog, {lessons: [], shuffle: false}, 0);
  assert.equal(deck.mergedCount, 0); assert.equal(deck.distinctForms, 0); assert.equal(deck.selectedLessonCount, 0);
  const selected = E.makeDeck(state, catalog, {lessons: [1, 12, 15], shuffle: false}, 0);
  assert.equal(selected.selectedLessonCount, 3);
  assert.deepEqual(selected.cards.flatMap(card => card.lessons).sort((a, b) => a - b), [1, 12, 12]);
});

test('sense merging retains every selected source; polysemy and missing digit audio survive', () => {
  const state = E.blank();
  const deck = E.makeDeck(state, catalog, {lessons: allLessons, filter: 'all', shuffle: false}, 0);
  assert.equal(deck.mergedCount, 11); assert.equal(deck.distinctForms, 7);
  const ni = deck.cards.find(card => card.senseId === 'ni-s1');
  assert.deepEqual(ni.lessons, [1, 3]); assert.equal(ni.sourceRecords.length, 2);
  assert.deepEqual(ni.meanings, ['bạn', 'bạn (người nghe)']); assert.equal(ni.audioRecordId, 'v-l01-ni');
  assert.equal(deck.cards.filter(card => card.zh === '想').length, 2);
  assert.equal(deck.cards.filter(card => card.zh === '天').length, 2);
  assert.equal(deck.cards.filter(card => card.zh === '上').length, 3);
  const digit = deck.cards.find(card => card.zh === '十五');
  assert.equal(digit.audio, null); assert.equal(digit.audioRecordId, null);
  assert.equal(deck.cards.find(card => card.zh === '北京').category, 'proper_noun');
  assert.equal(deck.cards.find(card => card.zh === '买').extension, true);
  const oneSource = E.makeDeck(state, catalog, {lessons: [3], shuffle: false}, 0).cards.find(card => card.senseId === 'ni-s1');
  assert.deepEqual(oneSource.lessons, [3]); assert.equal(oneSource.sourceRecords.length, 1); assert.equal(oneSource.audioRecordId, 'v-l03-ni');
});

test('reveal, self-rating and queue position are separate; refresh and backtracking cannot rate twice', () => {
  const state = E.blank();
  const review = E.startReview(state, catalog, {lessons: [1, 3], filter: 'all', direction: 'vi-zh', shuffle: false}, 0);
  assert.equal(review.senseIds.length, 2); assert.equal(review.direction, 'vi-zh');
  assert.throws(() => E.rateCard(state, catalog, 'good', 1), code('REVEAL_REQUIRED'));
  assert.throws(() => E.nextCard(state, 1), code('RATING_REQUIRED'));
  E.revealCard(state, review.senseIds[0], 1);
  let restored = E.importBackup(state, catalog); assert.equal(restored.cards.review.revealed[review.senseIds[0]], true);
  assert.equal(Object.keys(restored.cards.schedule).length, 0);
  E.rateCard(restored, catalog, 'good', 2); restored = E.importBackup(restored, catalog);
  assert.throws(() => E.rateCard(restored, catalog, 'good', 3), code('ALREADY_RATED'));
  E.nextCard(restored, 3); E.moveCard(restored, 0, 4);
  assert.throws(() => E.rateCard(restored, catalog, 'hard', 5), code('ALREADY_RATED'));
  assert.equal(restored.cards.schedule[review.senseIds[0]].reviewCount, 1);
});

test('good uses 1/3/7/14/30 day stages, exact due is eligible, and stage five remains capped', () => {
  const state = E.blank(); let at = 0;
  for (let i = 0; i < 6; i++) {
    const result = rateSingle(state, 'good', at);
    assert.equal(result.schedule.level, Math.min(i + 1, 5));
    assert.equal(result.schedule.dueAt, at + [1, 3, 7, 14, 30, 30][i] * E.DAY);
    assert.equal(result.early, false); assert.equal(result.advanced, i < 5);
    at = result.schedule.dueAt;
    assert.doesNotThrow(() => E.importBackup(state, single));
  }
});

test('early good in newly started rounds neither advances a stage nor postpones the existing due date', () => {
  const state = E.blank(); const first = rateSingle(state, 'good', 0);
  for (const now of [1, 1000, E.DAY - 1]) {
    const result = rateSingle(state, 'good', now);
    assert.equal(result.early, true); assert.equal(result.advanced, false);
    assert.equal(result.schedule.level, 1); assert.equal(result.schedule.dueAt, first.schedule.dueAt);
    assert.doesNotThrow(() => E.importBackup(state, single));
  }
  const due = rateSingle(state, 'good', E.DAY);
  assert.equal(due.schedule.level, 2); assert.equal(due.schedule.dueAt, 4 * E.DAY);
});

test('again resets the stage for ten minutes; hard preserves stage and schedules one day', () => {
  const state = E.blank(); rateSingle(state, 'good', 0); rateSingle(state, 'good', E.DAY);
  const hard = rateSingle(state, 'hard', E.DAY + 1);
  assert.equal(hard.schedule.level, 2); assert.equal(hard.schedule.dueAt, 2 * E.DAY + 1);
  const again = rateSingle(state, 'again', E.DAY + 2);
  assert.equal(again.schedule.level, 0); assert.equal(again.schedule.dueAt, E.DAY + 2 + 10 * E.MINUTE);
  const early = rateSingle(state, 'good', E.DAY + 3);
  assert.equal(early.schedule.level, 0); assert.equal(early.schedule.dueAt, again.schedule.dueAt);
  assert.equal(rateSingle(state, 'good', again.schedule.dueAt).schedule.level, 1);
});

test('all/unfamiliar/wrong/due filters are explicit self-rating filters, unaffected by listening mistakes', () => {
  const state = E.blank(); finishListening(state);
  const options = {lessons: [1], shuffle: false};
  const size = (filter, now) => E.makeDeck(state, single, {...options, filter}, now).filteredCount;
  assert.equal(size('unfamiliar', 0), 1); assert.equal(size('wrong', 0), 0); assert.equal(size('due', 0), 1);
  rateSingle(state, 'again', 10);
  assert.equal(size('wrong', 11), 1); assert.equal(size('due', 10 + 10 * E.MINUTE - 1), 0);
  assert.equal(size('due', 10 + 10 * E.MINUTE), 1);
  rateSingle(state, 'hard', 20); assert.equal(size('wrong', 21), 0); assert.equal(size('unfamiliar', 21), 1);
  rateSingle(state, 'good', 21); assert.equal(size('unfamiliar', 22), 0); assert.equal(size('all', 22), 1);
  assert.equal(E.listeningSummary(state, single).wrongIds.length, 1);
});

test('due-review imports restore frozen membership even after its ratings change the due filter', () => {
  const state = E.blank(); const review = E.startReview(state, catalog,
    {lessons: [1, 3, 12], filter: 'due', direction: 'zh-vi', shuffle: true}, 0, seeded());
  const original = review.senseIds.slice();
  while (true) {
    E.revealCard(state, review.senseIds[review.position], 100);
    E.rateCard(state, catalog, 'good', 100);
    if (E.nextCard(state, 100).done) break;
  }
  assert.equal(E.makeDeck(state, catalog, {lessons: [1, 3, 12], filter: 'due'}, 101).filteredCount, 0);
  const restored = E.importBackup(state, catalog);
  assert.deepEqual(restored.cards.review.senseIds, original);
  assert.equal(E.cardSummary(restored, catalog, 101).review.done, true);
});

test('translation wording or an added same-sense source preserves schedule; changed sense identity is rejected', () => {
  const state = E.blank(); rateSingle(state, 'good', 0);
  const revised = clone(single); revised.vocabulary[0].vi = 'cách diễn đạt mới'; revised.vocabulary[0].py = 'pinyin clarified';
  assert.equal(E.importBackup(state, revised).cards.schedule['ni-s1'].level, 1);
  revised.vocabulary.push({...revised.vocabulary[0], id: 'v-l03-new', lesson: 3});
  assert.equal(E.importBackup(state, revised).cards.schedule['ni-s1'].level, 1);
  const changed = clone(single); changed.vocabulary[0].zh = '您';
  assert.throws(() => E.importBackup(state, changed), code('CONTENT_CHANGED'));
  const missing = clone(single); missing.vocabulary[0].senseId = 'different-sense';
  assert.throws(() => E.importBackup(state, missing), code('UNKNOWN_ID'));
});

test('backup scores are recomputed from answers and imported data never mutates its input', () => {
  const state = E.blank(); startListening(state); answerCurrent(state, false, 2000);
  const qid = state.listening.session.questionIds[0], raw = clone(state);
  raw.listening.records[qid].first.correct = true; raw.listening.records[qid].latest.correct = true;
  raw.listening.session.responses[qid].submission.correct = true;
  const original = clone(raw), restored = E.importBackup(raw, catalog);
  assert.equal(restored.listening.records[qid].first.correct, false);
  assert.equal(restored.listening.session.responses[qid].submission.correct, false);
  assert.deepEqual(raw, original);
});

test('backups reject changed listening content, unknown IDs, answer types and inconsistent queues', () => {
  const state = E.blank(); startListening(state); answerCurrent(state, true, 2000);
  const changed = clone(catalog); changed.listening[0].options[0] += ' changed';
  assert.throws(() => E.importBackup(state, changed), code('CONTENT_CHANGED'));
  const unknown = clone(state); unknown.listening.records.unknown = clone(Object.values(state.listening.records)[0]);
  assert.throws(() => E.importBackup(unknown, catalog), code('UNKNOWN_ID'));
  const qid = state.listening.session.questionIds[0];
  for (const mutate of [
    raw => { raw.listening.records[qid].first.answer = '0'; },
    raw => { raw.listening.session.optionOrders[qid] = [0, 0, 2, 3]; },
    raw => { raw.listening.session.responses[qid].selected = 99; },
    raw => { raw.listening.session.position = 4; },
    raw => { raw.listening.session.questionIds.pop(); },
    raw => { raw.listening.session.responses[qid].listenCount = -1; }
  ]) { const raw = clone(state); mutate(raw); assert.throws(() => E.importBackup(raw, catalog)); }
});

test('backup rating histories must match reveal state and computed current schedules', () => {
  const state = E.blank(); rateSingle(state, 'good', 0);
  for (const mutate of [
    raw => { raw.cards.review.revealed = {}; },
    raw => { raw.cards.schedule['ni-s1'].level = 5; },
    raw => { raw.cards.review.ratings['ni-s1'].schedule.dueAt += E.DAY; },
    raw => { raw.cards.review.ratings['ni-s1'].rating = 'unknown'; },
    raw => { raw.cards.review.position = 1; },
    raw => { raw.cards.schedule.unknown = raw.cards.schedule['ni-s1']; }
  ]) { const raw = clone(state); mutate(raw); assert.throws(() => E.importBackup(raw, single)); }
  const forged = clone(state); forged.cards.review.ratings['ni-s1'].advanced = false;
  assert.equal(E.importBackup(forged, single).cards.review.ratings['ni-s1'].advanced, true);
});

test('illegal objects, getters, unsafe keys, cycles, deep nesting and oversized JSON fail before use', () => {
  const polluted = E.blank(); polluted.extra = JSON.parse('{"__proto__":{"polluted":true}}');
  assert.throws(() => E.importBackup(polluted, catalog), code('INVALID_BACKUP')); assert.equal({}.polluted, undefined);
  const cyclic = E.blank(); cyclic.extra = cyclic;
  assert.throws(() => E.importBackup(cyclic, catalog), code('INVALID_BACKUP'));
  const getter = E.blank(); Object.defineProperty(getter, 'extra', {get() { throw new Error('Getter must never run'); }});
  assert.throws(() => E.importBackup(getter, catalog), code('INVALID_BACKUP'));
  const sparse = E.blank(); sparse.preferences.lessons = new Array(3);
  assert.throws(() => E.importBackup(sparse, catalog), code('INVALID_BACKUP'));
  const nested = E.blank(); let target = nested;
  for (let i = 0; i < 26; i++) { target.extra = {}; target = target.extra; }
  assert.throws(() => E.importBackup(nested, catalog), code('INVALID_BACKUP'));
  const huge = E.blank(); huge.extra = '中'.repeat(Math.ceil(E.MAX_BACKUP_BYTES / 3));
  assert.throws(() => E.importBackup(huge, catalog), code('BACKUP_TOO_LARGE'));
  assert.equal(E.backupByteLength('中'), Buffer.byteLength(JSON.stringify('中'), 'utf8'));
});

test('a complete 75-item listening record and 344 reviewed senses stay well below the budget and round-trip', () => {
  const realistic = {...catalog, vocabulary: Array.from({length: 344}, (_, i) =>
    vocabulary(`v-capacity-${i}`, `sense-${i}`, i % 15 + 1, `测试词${i}`, `nghĩa kiểm thử ${i}`))};
  const state = E.blank(); finishListening(state, {lessons: allLessons}, realistic);
  for (let round = 0; round < 2; round++) {
    const review = E.startReview(state, realistic, {lessons: allLessons, filter: 'all', shuffle: false}, round * E.DAY, seeded());
    for (const id of review.senseIds) {
      E.revealCard(state, id, round * E.DAY); E.rateCard(state, realistic, 'good', round * E.DAY); E.nextCard(state, round * E.DAY);
    }
  }
  const backup = E.exportBackup(state, realistic);
  assert.ok(E.backupByteLength(backup) < 512 * 1024);
  const restored = E.importBackup(JSON.parse(JSON.stringify(backup)), realistic);
  assert.equal(E.listeningSummary(restored, realistic).overall.answered, 75);
  assert.equal(E.cardSummary(restored, realistic, E.DAY).rated, 344);
  assert.equal(Object.values(restored.cards.schedule).every(entry => entry.level === 2), true);
});

const dataDirectory = path.join(__dirname, '../../new-hsk1/hsk1/stage3/data');
const actualFiles = ['01-05', '06-10', '11-15'].flatMap(range => [`listening-${range}.json`, `vocabulary-${range}.json`]);
test('the actual 75 listening questions and every authored sense run through submit, reveal, rate and backup',
  {skip: !actualFiles.every(file => fs.existsSync(path.join(dataDirectory, file))) && 'Third-step content is still being authored.'}, () => {
    const actual = {listening: [], vocabulary: []};
    for (const file of actualFiles) actual[file.startsWith('listening') ? 'listening' : 'vocabulary'].push(
      ...JSON.parse(fs.readFileSync(path.join(dataDirectory, file), 'utf8')));
    assert.equal(actual.listening.length, 75);
    for (const lesson of allLessons) assert.equal(actual.listening.filter(q => q.lesson === lesson).length, 5);
    const state = E.blank(); startListening(state, {lessons: allLessons}, 1000, actual);
    for (let i = 0; i < 75; i++) { assert.equal(answerCurrent(state, true, 2000 + i, actual).correct, true); E.nextListening(state, 2000 + i); }
    const review = E.startReview(state, actual, {lessons: allLessons, filter: 'all', shuffle: false}, 3000, seeded());
    assert.equal(review.senseIds.length, new Set(actual.vocabulary.map(item => item.senseId)).size);
    for (const id of review.senseIds) { E.revealCard(state, id, 3000); E.rateCard(state, actual, 'good', 3000); E.nextCard(state, 3000); }
    const restored = E.importBackup(E.exportBackup(state, actual), actual);
    assert.equal(E.listeningSummary(restored, actual).overall.firstCorrect, 75);
    assert.equal(E.cardSummary(restored, actual, 3001).review.rated, review.senseIds.length);
    assert.equal(E.makeDeck(restored, actual, {lessons: allLessons, filter: 'due'}, 3001).filteredCount, 0);
    assert.ok(E.backupByteLength(restored) < E.MAX_BACKUP_BYTES);
  });
