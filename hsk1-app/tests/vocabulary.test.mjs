import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import engine from '../src/domain/practice/engine.js';
import { createVocabularyController } from '../src/domain/vocabulary/controller.ts';
import { createLearningSession } from '../src/services/learning/session.ts';
import { createStore, STORAGE_KEY } from '../src/services/storage/index.ts';
import { createCompatibility } from '../src/services/storage/compatibility.ts';

const json = name => JSON.parse(readFileSync(new URL(`../content/${name}.json`, import.meta.url)));
const catalog = json('stage3-catalog'), book = json('textbook'), bank = json('stage2-bank');
const stamp = 1790899200000, day = 86400000;
const allLessons = Array.from({ length: 15 }, (_, index) => index + 1);
function setup({ memory = new Map(), content = catalog, random = () => 0.271, write } = {}) {
  const compatibility = createCompatibility(bank, content, book);
  let time = stamp, requests = 0;
  const store = createStore({ storage: { getItem: key => memory.get(key) ?? null,
    setItem: write ?? ((key, value) => memory.set(key, value)) },
    blank: compatibility.blank, validate: compatibility.validate, lock: async task => task(), now: () => time });
  const session = createLearningSession({ store, compatibility, setTimer: () => 1, clearTimer: () => {} });
  session.requestSave = () => { requests++; };
  const controller = () => createVocabularyController({ session, catalog: content, now: () => time, random });
  return { store, session, memory, controller, requests: () => requests, setTime: value => { time = value; } };
}
function noChange(ctx, action, reason) {
  const before = ctx.store.snapshot(), requests = ctx.requests(), result = action();
  assert.equal(result.ok, false); if (reason) assert.equal(result.reason, reason);
  assert.deepEqual(ctx.store.snapshot(), before); assert.equal(ctx.requests(), requests);
}
function rate(c, rating) { assert.equal(c.reveal().ok, true); assert.equal(c.rate(rating).ok, true); }
const oneCard = { ...catalog, vocabulary: catalog.vocabulary.slice(0, 1) };
const threeCards = { ...catalog, vocabulary: catalog.vocabulary.slice(0, 3) };

test('construction and reads do not create reviews; rejected empty actions do not schedule saves', () => {
  const ctx = setup(), c = ctx.controller();
  assert.equal(c.read().current, null); assert.equal(c.read().review, null);
  assert.equal(c.read().summary.totalSenses, 344); assert.equal(c.read().summary.due, 344);
  assert.equal(c.read().availableCount, catalog.vocabulary.filter(item => item.lesson === 1).length);
  noChange(ctx, () => c.reveal(), 'empty-review'); noChange(ctx, () => c.rate('good'), 'empty-review');
  noChange(ctx, () => c.move(0), 'empty-review'); noChange(ctx, () => c.next(), 'empty-review');
  assert.equal(ctx.store.snapshot().status, 'empty'); assert.equal(ctx.requests(), 0);
});

test('first route selects its lesson once, review visit never replaces the queue or enables due automatically', () => {
  const ctx = setup(), c = ctx.controller();
  assert.equal(c.visit(10).ok, true); assert.deepEqual(c.read().preferences.lessons, [10]);
  const requests = ctx.requests(); c.visit(10); assert.equal(ctx.requests(), requests);
  c.setPreferences({ lessons: [15, 3, 1, 3], shuffle: false }); c.start();
  const round = c.read().review;
  assert.equal(c.visit(15, 'review').ok, true);
  assert.deepEqual(c.read().review, round); assert.equal(c.read().preferences.vocabularyFilter, 'all');
  assert.deepEqual(ctx.store.snapshot().data.navigation, { feature: 'review', lesson: 1 });
  assert.deepEqual(c.read().preferences.lessons, [1, 3, 15]);
  c.setPreferences({ lessons: [] }); ctx.controller().visit(10);
  assert.deepEqual(c.read().preferences.lessons, []); noChange(ctx, () => c.start('due'), 'empty');
  assert.deepEqual(c.read().review, round);
  noChange(ctx, () => c.visit(16), 'invalid'); noChange(ctx, () => c.visit(1, 'homework'), 'invalid');
});

test('supported preferences normalize with no-op saves; invalid values cannot corrupt any practice field', () => {
  const ctx = setup(), c = ctx.controller(), original = ctx.store.snapshot().data.practice;
  c.setPreferences({ lessons: [1, 5, 15], vocabularyFilter: 'wrong', shuffle: false, direction: 'vi-zh' });
  for (const rate of [0.65, 0.75, 1, 1.25, 1.5]) {
    assert.equal(c.setPreferences({ rate }).ok, true); assert.equal(c.read().preferences.rate, rate);
    const requests = ctx.requests(); c.setPreferences({ rate }); assert.equal(ctx.requests(), requests);
  }
  const requests = ctx.requests(); c.setPreferences({}); c.setPreferences({ lessons: [15, 5, 1, 5] });
  assert.equal(ctx.requests(), requests);
  for (const patch of [{ lessons: [0] }, { lessons: [16] }, { lessons: ['1'] }, { rate: 0.5 }, { vocabularyFilter: 'new' },
    { direction: 'zh-vn' }, { shuffle: 'yes' }, { module: 'listening' }, { listeningMode: 'all' }, { pinyin: true }]) {
    noChange(ctx, () => c.setPreferences(patch));
  }
  const after = ctx.store.snapshot().data.practice;
  assert.deepEqual(after.cards, original.cards); assert.deepEqual(after.listening, original.listening);
  assert.equal(after.preferences.listeningMode, original.preferences.listeningMode);
});

test('all lessons expose exactly 344 distinct sense cards and 319 forms while preserving every source', () => {
  const ctx = setup(), c = ctx.controller(); c.setPreferences({ lessons: allLessons, shuffle: false });
  const { available } = c.read();
  assert.equal(available.selectedLessonCount, 15); assert.equal(available.mergedCount, 344);
  assert.equal(available.distinctForms, 319); assert.equal(available.filteredCount, 344);
  assert.equal(new Set(available.senseIds).size, 344);
  assert.deepEqual(available.cards.flatMap(card => card.sourceRecords), catalog.vocabulary);
  assert.equal(available.cards.filter(card => card.audio).length, 330);
  assert.equal(available.cards.filter(card => card.audio === null).length, 14);
  for (const card of available.cards) {
    assert.deepEqual(card.meanings, [card.vi]);
    if (card.audioRecordId) assert.ok(card.sourceRecords.some(source => source.id === card.audioRecordId && source.audio));
    assert.equal(card.category, card.sourceRecords[0].category);
    assert.equal(card.extension, card.sourceRecords.some(source => source.extension));
  }
  c.setPreferences({ lessons: [1, 7, 15] });
  assert.deepEqual(c.read().available.cards.flatMap(card => card.sourceRecords), catalog.vocabulary.filter(item => [1, 7, 15].includes(item.lesson)));
});

test('same sense merges across selected lessons only and never borrows audio from an unselected source', () => {
  const first = catalog.vocabulary[0], foreign = { ...structuredClone(first), id: `v-l02-${first.senseId}`, lesson: 2, audio: null,
    vi: 'cùng nghĩa ở bài khác', source: structuredClone(catalog.vocabulary.find(item => item.lesson === 2).source) };
  const content = { ...catalog, vocabulary: [first, foreign, catalog.vocabulary[1]] };
  const ctx = setup({ content }), c = ctx.controller();
  c.setPreferences({ lessons: [1, 2], shuffle: false });
  const deck = c.read().available;
  assert.equal(deck.mergedCount, 2); assert.equal(deck.distinctForms, 2);
  const merged = deck.cards.find(card => card.senseId === first.senseId);
  assert.deepEqual(merged.lessons, [1, 2]); assert.deepEqual(merged.sourceRecords, [first, foreign]);
  assert.deepEqual(merged.meanings, [first.vi, foreign.vi]); assert.equal(merged.audioRecordId, first.id);
  c.setPreferences({ lessons: [2] }); c.start();
  assert.deepEqual(c.read().current.sourceRecords, [foreign]); assert.equal(c.read().current.audio, null);
  assert.equal(c.read().current.audioRecordId, null);
  c.setPreferences({ lessons: [1] });
  assert.deepEqual(c.read().current.sourceRecords, [foreign]); assert.equal(c.read().current.audioRecordId, null);
});

test('homographs 家 在 天 上 retain separate sense identities and schedules', () => {
  const ctx = setup(), c = ctx.controller(); c.setPreferences({ lessons: allLessons, shuffle: false });
  for (const [zh, count] of [['家', 3], ['在', 3], ['天', 2], ['上', 3]]) {
    const cards = c.read().available.cards.filter(card => card.zh === zh);
    assert.equal(cards.length, count, zh); assert.equal(new Set(cards.map(card => card.senseId)).size, count, zh);
  }
  const pairs = catalog.vocabulary.filter(item => item.zh === '天');
  const separate = setup({ content: { ...catalog, vocabulary: pairs } }), d = separate.controller();
  d.setPreferences({ lessons: [12], shuffle: false }); d.start(); rate(d, 'good'); d.next(); rate(d, 'again');
  assert.equal(d.read().summary.rated, 2); assert.equal(d.read().summary.wrong, 1);
  const schedules = separate.store.snapshot().data.practice.cards.schedule;
  assert.equal(schedules[pairs[0].senseId].lastRating, 'good'); assert.equal(schedules[pairs[1].senseId].lastRating, 'again');
});

test('all, unfamiliar, wrong and due use selected senses and latest self-ratings without changing the active queue', () => {
  const ctx = setup({ content: threeCards }), c = ctx.controller(); c.setPreferences({ shuffle: false }); c.start();
  const ids = [...c.read().review.senseIds]; rate(c, 'good'); c.next(); rate(c, 'hard'); c.next(); rate(c, 'again');
  const original = c.read().review;
  for (const [filter, expected] of [['all', ids], ['unfamiliar', ids.slice(1)], ['wrong', ids.slice(2)], ['due', []]]) {
    c.setPreferences({ vocabularyFilter: filter }); assert.deepEqual(c.read().available.senseIds, expected);
    assert.deepEqual(c.read().review, original); assert.equal(c.read().current.senseId, ids[2]);
  }
  noChange(ctx, () => c.start(), 'empty');
  ctx.setTime(stamp + 10 * 60000); assert.deepEqual(c.read().available.senseIds, [ids[2]]);
  ctx.setTime(stamp + day); assert.deepEqual(c.read().available.senseIds, ids);
  assert.equal(c.start('wrong').ok, true); assert.deepEqual(c.read().review.senseIds, [ids[2]]);
  assert.equal(c.read().preferences.vocabularyFilter, 'wrong');
});

test('free movement preserves each card while reveal still gates rating and repeated actions do not duplicate writes', () => {
  const ctx = setup({ content: threeCards }), c = ctx.controller(); c.setPreferences({ shuffle: false }); c.start();
  assert.equal(c.read().current.revealed, false); assert.equal(c.read().current.rating, null);
  noChange(ctx, () => c.rate('good'), 'reveal-required');
  assert.equal(c.next().ok, true); assert.equal(c.read().review.position, 1);
  assert.equal(c.move(2).ok, true); assert.equal(c.read().review.position, 2);
  assert.deepEqual(ctx.store.snapshot().data.practice.cards.schedule, {});
  assert.deepEqual(c.read().review.revealed, {}); assert.deepEqual(c.read().review.ratings, {});
  assert.equal(c.read().summary.review.done, false); assert.equal(c.read().review.finishedAt, null);
  const skippedSaves = ctx.requests(); ctx.setTime(stamp + 1); c.next();
  assert.equal(ctx.requests(), skippedSaves); assert.equal(c.read().review.position, 2);
  ctx.setTime(stamp); c.move(0);
  c.reveal(); const requests = ctx.requests(); c.reveal(); c.move(0); assert.equal(ctx.requests(), requests);
  for (const rating of ['known', '', null, 1]) noChange(ctx, () => c.rate(rating), 'invalid-rating');
  c.rate('good'); noChange(ctx, () => c.rate('again'), 'already-rated'); c.next();
  assert.equal(c.read().current.revealed, false); c.move(0); assert.equal(c.read().current.revealed, true);
  assert.equal(c.read().current.rating.rating, 'good'); c.next(); rate(c, 'hard'); c.next(); rate(c, 'again');
  const finished = c.read(); assert.equal(finished.summary.review.done, true); assert.equal(finished.review.finishedAt, stamp);
  const saves = ctx.requests(); c.next(); c.move(2); assert.equal(ctx.requests(), saves);
  for (const position of [-1, 3, 0.25, '0']) noChange(ctx, () => c.move(position), 'invalid-position');
});

test('skipping preserves existing schedules and all queue options, including due cards with an earlier unrated gap', () => {
  const ctx = setup({ content: threeCards }), c = ctx.controller();
  c.setPreferences({ shuffle: false }); c.start(); rate(c, 'again');
  ctx.setTime(stamp + 10 * 60000);
  c.setPreferences({ direction: 'vi-zh', vocabularyFilter: 'due' }); c.start();
  const before = ctx.store.snapshot().data.practice, queue = c.read().review;
  assert.equal(c.next().ok, true); c.reveal(); assert.equal(c.next().ok, true);
  assert.equal(c.read().current.revealed, false); assert.equal(c.read().current.rating, null);
  c.setPreferences({ lessons: [], direction: 'zh-vi', vocabularyFilter: 'wrong', shuffle: true });
  assert.equal(c.move(1).ok, true); assert.equal(c.read().current.revealed, true);
  assert.equal(c.read().current.rating, null); assert.equal(c.read().current.direction, 'vi-zh');
  assert.deepEqual(c.read().review.senseIds, queue.senseIds); assert.deepEqual(c.read().review.lessons, queue.lessons);
  assert.equal(c.read().review.filter, 'due'); assert.equal(c.read().review.startedAt, queue.startedAt);
  assert.deepEqual(ctx.store.snapshot().data.practice.cards.schedule, before.cards.schedule);
  assert.equal(c.read().summary.review.rated, 0); assert.equal(c.read().summary.review.done, false);
  assert.equal(c.read().review.finishedAt, null); assert.equal(c.read().summary.due, 3);
});

test('unrated gaps and the exact saved position survive reload and backup import without losing skipped cards', async () => {
  const ctx = setup(), c = ctx.controller(); c.visit(1, 'review');
  c.setPreferences({ lessons: [1, 10, 15], direction: 'vi-zh', vocabularyFilter: 'due' }); c.start();
  const ids = [...c.read().review.senseIds];
  c.next(); c.reveal(); c.next(); rate(c, 'hard'); c.next();
  const before = c.read(); assert.equal(before.review.position, 3);
  assert.equal(before.summary.review.rated, 1); assert.equal(before.review.finishedAt, null);
  assert.equal((await ctx.session.flush()).ok, true);
  const loaded = setup({ memory: ctx.memory }), resumed = loaded.controller();
  assert.deepEqual(resumed.read(), before); assert.equal(loaded.requests(), 0);
  const imported = setup(); assert.equal((await imported.store.confirm(imported.store.previewBackup(ctx.store.exportBackup()))).ok, true);
  const restored = imported.controller(); assert.deepEqual(restored.read(), before);
  for (const d of [resumed, restored]) {
    assert.equal(d.move(0).ok, true); assert.equal(d.read().current.senseId, ids[0]);
    assert.equal(d.read().current.revealed, false); assert.equal(d.read().current.schedule, null);
    assert.equal(d.next().ok, true); assert.equal(d.read().current.senseId, ids[1]);
    assert.equal(d.read().current.revealed, true); assert.equal(d.read().current.rating, null);
    assert.equal(d.next().ok, true); assert.equal(d.read().current.rating.rating, 'hard');
    assert.equal(d.read().review.position, 2); // Rating itself never auto-advances.
  }
  await ctx.session.dispose(); await loaded.session.dispose(); await imported.session.dispose();
});

test('out-of-order self-ratings complete only after every card is rated and preserve the true completion time', async () => {
  const ctx = setup({ content: threeCards }), c = ctx.controller(); c.setPreferences({ shuffle: false }); c.start();
  c.move(2); rate(c, 'good'); assert.equal(c.read().review.position, 2);
  assert.equal(c.read().summary.review.done, false); assert.equal(c.read().review.finishedAt, null);
  ctx.setTime(stamp + 1000); c.move(0); rate(c, 'again');
  assert.equal(c.read().summary.review.done, false);
  ctx.setTime(stamp + 2000); c.move(1); rate(c, 'hard');
  assert.equal(c.read().review.position, 1); assert.equal(c.read().summary.review.done, true);
  assert.equal(c.read().review.finishedAt, stamp + 2000);
  assert.equal((await ctx.session.flush()).ok, true);
  const loaded = setup({ content: threeCards, memory: ctx.memory });
  assert.equal(loaded.controller().read().review.finishedAt, stamp + 2000);
  assert.equal(JSON.parse(ctx.store.exportBackup()).data.practice.cards.review.finishedAt, stamp + 2000);
  await ctx.session.dispose(); await loaded.session.dispose();
});

test('single-card and last-card next calls are no-ops even without revealing or rating', () => {
  const ctx = setup({ content: oneCard }), c = ctx.controller(); c.start();
  const before = ctx.store.snapshot(), requests = ctx.requests(); ctx.setTime(stamp + day);
  assert.equal(c.next().ok, true); assert.equal(c.move(0).ok, true);
  assert.deepEqual(ctx.store.snapshot(), before); assert.equal(ctx.requests(), requests);
  assert.equal(c.read().current.revealed, false); assert.equal(c.read().current.rating, null);
  assert.equal(c.read().summary.review.done, false);
  for (const position of [-1, 1, 0.25, '0']) noChange(ctx, () => c.move(position), 'invalid-position');
});

test('again, hard, good and early good exactly preserve the existing simple schedule semantics', () => {
  const ctx = setup({ content: oneCard }), c = ctx.controller(); c.setPreferences({ shuffle: false }); c.start();
  rate(c, 'good'); const first = c.read().current;
  assert.equal(first.schedule.level, 1); assert.equal(first.schedule.dueAt, stamp + day);
  assert.equal(first.rating.advanced, true); assert.equal(first.rating.early, false);
  ctx.setTime(stamp + 3600000); c.start('all'); rate(c, 'good');
  let model = c.read().current; assert.equal(model.schedule.level, 1); assert.equal(model.schedule.dueAt, first.schedule.dueAt);
  assert.equal(model.rating.early, true); assert.equal(model.rating.advanced, false); assert.equal(model.schedule.reviewCount, 2);
  ctx.setTime(stamp + day); c.start('due'); rate(c, 'good');
  model = c.read().current; assert.equal(model.schedule.level, 2); assert.equal(model.schedule.dueAt, stamp + 4 * day);
  assert.equal(model.rating.advanced, true); assert.equal(model.rating.early, false);
  ctx.setTime(stamp + 2 * day); c.start('all'); rate(c, 'hard');
  model = c.read().current; assert.equal(model.schedule.level, 2); assert.equal(model.schedule.dueAt, stamp + 3 * day);
  ctx.setTime(stamp + 2 * day + 1); c.start('all'); rate(c, 'again');
  model = c.read().current; assert.equal(model.schedule.level, 0); assert.equal(model.schedule.dueAt, stamp + 2 * day + 1 + 10 * 60000);
  assert.equal(model.schedule.reviewCount, 5); assert.equal(c.read().summary.wrong, 1);
});

test('a rated card stays current in a due round even when current preferences change lesson, direction and filter', () => {
  const ctx = setup(), c = ctx.controller(); c.setPreferences({ lessons: [1, 3], vocabularyFilter: 'due', direction: 'vi-zh', shuffle: false });
  c.start(); const before = c.read(); rate(c, 'good');
  assert.equal(c.read().current.senseId, before.current.senseId); assert.equal(c.read().current.direction, 'vi-zh');
  c.setPreferences({ lessons: [15], direction: 'zh-vi', vocabularyFilter: 'wrong', shuffle: true });
  const after = c.read(); assert.equal(after.availableCount, 0);
  assert.equal(after.current.senseId, before.current.senseId); assert.equal(after.current.direction, 'vi-zh');
  assert.deepEqual(after.current.sourceRecords, before.current.sourceRecords); assert.equal(after.current.revealed, true);
  assert.deepEqual(after.review.senseIds, before.review.senseIds); assert.deepEqual(after.review.lessons, [1, 3]);
  assert.equal(c.next().ok, true); assert.equal(c.read().current.senseId, before.review.senseIds[1]);
  assert.equal(c.read().current.direction, 'vi-zh');
});

test('shuffled order, position, reveal, self-ratings, preferences and source selection resume after actual save and backup import', async () => {
  const ctx = setup(), c = ctx.controller(); c.visit(15, 'review');
  c.setPreferences({ lessons: [1, 10, 15], direction: 'vi-zh' }); c.start(); rate(c, 'again'); c.next(); c.reveal();
  c.setPreferences({ lessons: [], direction: 'zh-vi', vocabularyFilter: 'wrong' });
  const before = c.read(); assert.equal((await ctx.session.flush()).ok, true); assert.ok(ctx.memory.has(STORAGE_KEY));
  const loaded = setup({ memory: ctx.memory, random: () => 0.999 }), resumed = loaded.controller();
  assert.deepEqual(resumed.read(), before); assert.equal(loaded.requests(), 0);
  resumed.visit(2, 'review'); assert.deepEqual(resumed.read(), before); assert.equal(loaded.requests(), 0);
  const imported = setup(); assert.equal((await imported.store.confirm(imported.store.previewBackup(ctx.store.exportBackup()))).ok, true);
  assert.deepEqual(imported.controller().read(), before);
  assert.match(before.review.fingerprints[before.current.senseId], /^v1-[a-f0-9]{16}$/);
  assert.notEqual(before.review.fingerprints[before.current.senseId], before.current.sourceRecords[0].fingerprint);
  await ctx.session.dispose(); await loaded.session.dispose(); await imported.session.dispose();
});

test('vocabulary edits preserve homework, listening, reading stars and legacy original bytes', () => {
  const ctx = setup(), c = ctx.controller(); ctx.store.edit(data => {
    data.reading.lessons['10'] = { visited: true, complete: true }; data.reading.mastered[`10-${book.lessons[9].vocab[0].zh}`] = true;
    data.legacyRaw.hsk1_ranteacher_progress_v1 = '{"10":{"complete":true}}';
    engine.createListeningSession(data.practice, catalog, { lessons: [10] }, stamp, () => 0);
    engine.selectListening(data.practice, catalog, data.practice.listening.session.questionIds[0], 1, stamp);
  });
  const original = ctx.store.snapshot().data, content = JSON.stringify(catalog);
  c.visit(3); c.setPreferences({ lessons: [3], shuffle: false }); c.start(); rate(c, 'good'); c.next();
  const after = ctx.store.snapshot().data;
  for (const key of ['reading', 'homework', 'legacyRaw']) assert.deepEqual(after[key], original[key]);
  assert.deepEqual(after.practice.listening, original.practice.listening); assert.equal(JSON.stringify(catalog), content);
});

test('invalid clock or shuffle source cannot replace an existing round; changed sense identity cannot inherit self-ratings', () => {
  const ctx = setup(), c = ctx.controller(); c.start(); rate(c, 'good'); const original = c.read().review;
  const badRandom = createVocabularyController({ session: ctx.session, catalog, now: () => stamp, random: () => 1 });
  noChange(ctx, () => badRandom.start(), 'invalid-random'); assert.deepEqual(c.read().review, original);
  const badClock = createVocabularyController({ session: ctx.session, catalog, now: () => -1 });
  noChange(ctx, () => badClock.start(), 'invalid-time'); noChange(ctx, () => badClock.setPreferences({ rate: 0.75 }), 'invalid-time');
  const changed = structuredClone(catalog); changed.vocabulary.find(item => item.senseId === c.read().current.senseId).zh += '变';
  assert.throws(() => createVocabularyController({ session: ctx.session, catalog: changed }), error => error.code === 'CONTENT_CHANGED');
  const tampered = JSON.parse(ctx.store.exportBackup()); const id = c.read().current.senseId;
  tampered.data.practice.cards.schedule[id].dueAt++;
  assert.throws(() => ctx.store.previewBackup(JSON.stringify(tampered)), error => error.code === 'INVALID_SCHEDULE');
});

test('quota failure and cross-tab conflict preserve the self-rating in exportable memory without pretending to save', async () => {
  const quota = setup({ write: () => { throw Object.assign(new Error('quota'), { name: 'QuotaExceededError' }); } }), c = quota.controller();
  c.start(); rate(c, 'hard'); assert.equal((await quota.session.flush()).ok, false);
  assert.equal(quota.store.snapshot().status, 'unsaved'); assert.equal(JSON.parse(quota.store.exportBackup()).data.practice.cards.review.ratings[c.read().current.senseId].rating, 'hard');
  assert.equal(quota.memory.has(STORAGE_KEY), false);
  const left = setup(), l = left.controller(); l.start(); await left.session.flush();
  const right = setup({ memory: left.memory }), r = right.controller();
  rate(l, 'good'); await left.session.flush(); rate(r, 'again');
  assert.equal((await right.session.flush()).ok, false); assert.equal(right.store.snapshot().status, 'conflict');
  assert.equal(r.read().current.rating.rating, 'again');
  assert.equal(JSON.parse(right.memory.get(STORAGE_KEY)).data.practice.cards.review.ratings[l.read().current.senseId].rating, 'good');
  await quota.session.dispose(); await left.session.dispose(); await right.session.dispose();
});

test('mixed search matches Chinese, Vietnamese and unaccented/spaceless pinyin without merging senses', () => {
  const ctx = setup(), c = ctx.controller(); c.setPreferences({ lessons: allLessons, shuffle: false });
  const requests = ctx.requests(), original = ctx.store.snapshot();
  for (const [query, id] of [['你好', 'lex-'], ['NǏ HǍO', 'lex-'], ['nihao', 'lex-'], ['xin chao', 'lex-']]) {
    assert.equal(c.setSearch(query).ok, true);
    assert.ok(c.read().available.cards.some(card => card.zh === '你好' && card.senseId.startsWith(id)), query);
    assert.equal(c.read().availableCount, c.read().available.cards.length);
  }
  c.setSearch('gia dinh'); assert.ok(c.read().available.cards.some(card => card.zh === '家' && card.vi === 'gia đình'));
  c.setSearch('đúng'); const accented = c.read().available.senseIds;
  c.setSearch('DUNG'); assert.deepEqual(c.read().available.senseIds, accented);
  c.setSearch('shang');
  assert.equal(c.read().available.cards.filter(card => card.zh === '上').length, 3);
  c.setSearch('lượng từ'); assert.ok(c.read().available.cards.some(card => card.zh === '家' && card.senseId.endsWith('s3')));
  c.setSearch('   '); assert.equal(c.read().availableCount, 344);
  assert.deepEqual(ctx.store.snapshot(), original); assert.equal(ctx.requests(), requests);
  for (const invalid of [null, 1, {}, 'x'.repeat(121)]) noChange(ctx, () => c.setSearch(invalid), 'invalid-search');
  assert.equal(c.read().search, '');
});

test('search intersects lesson and rating filters; empty searches cannot replace a saved round', () => {
  const ctx = setup(), c = ctx.controller(); c.setPreferences({ lessons: allLessons, shuffle: false });
  c.setSearch('nhớ nhung'); assert.equal(c.read().availableCount, 1); c.start();
  const id = c.read().current.senseId; rate(c, 'again');
  c.setPreferences({ vocabularyFilter: 'wrong' }); assert.deepEqual(c.read().available.senseIds, [id]);
  assert.equal(c.read().dueCount, 0); noChange(ctx, () => c.start('due'), 'empty');
  c.setPreferences({ lessons: [6] }); assert.equal(c.read().availableCount, 0);
  noChange(ctx, () => c.start(), 'empty');
  assert.equal(c.read().current.senseId, id); assert.equal(c.read().review.search, 'nhớ nhung');
  c.setSearch('no-such-word'); noChange(ctx, () => c.start(), 'empty');
  c.setSearch(''); c.setPreferences({ lessons: [3], vocabularyFilter: 'all' });
  assert.equal(c.read().availableCount, catalog.vocabulary.filter(item => item.lesson === 3).length);
  assert.equal(c.read().review.search, 'nhớ nhung');
  c.start(); assert.equal('search' in c.read().review, false);
});

test('searched queues retain exact ordering, saved scope and unrated gaps through reload and backup import', async () => {
  const ctx = setup(), c = ctx.controller(); c.setPreferences({ lessons: [4, 7, 9], direction: 'vi-zh', shuffle: false });
  c.setSearch('家'); const expected = c.read().available.senseIds; assert.ok(expected.length >= 3);
  c.start(); assert.deepEqual(c.read().review.senseIds, expected);
  c.next(); c.reveal(); c.next(); rate(c, 'hard');
  assert.equal(c.read().review.position, 2); assert.equal(c.read().review.finishedAt, null);
  const round = c.read().review, schedules = ctx.store.snapshot().data.practice.cards.schedule;
  c.setSearch('无匹配词'); c.setPreferences({ lessons: [15], vocabularyFilter: 'wrong', direction: 'zh-vi' });
  assert.deepEqual(c.read().review, round); assert.equal(c.read().current.direction, 'vi-zh');
  assert.equal((await ctx.session.flush()).ok, true);
  const loaded = setup({ memory: ctx.memory }), resumed = loaded.controller();
  assert.deepEqual(resumed.read().review, round); assert.equal(resumed.read().search, '家');
  const imported = setup(); assert.equal((await imported.store.confirm(imported.store.previewBackup(ctx.store.exportBackup()))).ok, true);
  const restored = imported.controller(); assert.deepEqual(restored.read().review, round);
  for (const d of [resumed, restored]) {
    d.move(0); assert.equal(d.read().current.revealed, false); assert.equal(d.read().current.rating, null);
    d.next(); assert.equal(d.read().current.revealed, true); assert.equal(d.read().current.rating, null);
    d.next(); assert.equal(d.read().current.rating.rating, 'hard');
  }
  assert.deepEqual(loaded.store.snapshot().data.practice.cards.schedule, schedules);
  await ctx.session.dispose(); await loaded.session.dispose(); await imported.session.dispose();
});

test('saved search never permits foreign, omitted, or substituted queue members', () => {
  const ctx = setup(), c = ctx.controller(); c.setPreferences({ lessons: allLessons, shuffle: false }); c.setSearch('家'); c.start();
  const original = ctx.store.snapshot().data.practice;
  for (const mutate of [
    state => { state.cards.review.search = ''; },
    state => { state.cards.review.search = 'x'.repeat(121); },
    state => { state.cards.review.search = null; },
    state => { state.cards.review.search = 4; },
    state => { const id = state.cards.review.senseIds.pop(); delete state.cards.review.fingerprints[id]; },
    state => { const id = state.cards.review.senseIds[0]; state.cards.review.senseIds[0] = catalog.vocabulary[0].senseId; state.cards.review.fingerprints[catalog.vocabulary[0].senseId] = state.cards.review.fingerprints[id]; delete state.cards.review.fingerprints[id]; },
  ]) { const changed = structuredClone(original); mutate(changed); assert.throws(() => engine.importBackup(changed, catalog)); }
  assert.deepEqual(engine.importBackup(original, catalog), original);
});
