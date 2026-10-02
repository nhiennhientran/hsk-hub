import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import homework from '../src/domain/homework/engine.js';
import practice from '../src/domain/practice/engine.js';
import { createCompatibility, LEGACY_KEYS } from '../src/services/storage/compatibility.ts';

const json = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const text = name => readFileSync(new URL(`./fixtures/migration/${name}.json`, import.meta.url), 'utf8');
const fixture = name => JSON.parse(text(name));
const copy = value => JSON.parse(JSON.stringify(value));
const bank = json('../content/stage2-bank.json');
const catalog = json('../content/stage3-catalog.json');
const book = json('../content/textbook.json');
const compatibility = createCompatibility(bank, catalog, book);
const at = 1790812800000;
const raw = () => ({ ...fixture('reading-shared'), ...fixture('navigation'),
  [homework.KEY]: text('stage2'), [`${homework.KEY}_recovery`]: text('stage2-recovery'),
  [practice.KEY]: text('stage3'), [`${practice.KEY}_previous`]: text('stage3-previous') });
const migrated = () => compatibility.migrate(raw(), at).data;

// This equivalence check makes future changes to rule behavior explicit; it is not a copied grading test.
test('domain rules match pinned original bodies except the explicitly approved navigation and listening-size changes', () => {
  const manifest = json('../src/domain/provenance.json');
  for (const item of manifest.engines) {
    const source = readFileSync(new URL(`../../${item.source}`, import.meta.url), 'utf8');
    assert.equal(createHash('sha256').update(source).digest('hex'), item.sha256);
    const start = source.indexOf("  'use strict';", source.indexOf('})(typeof window')) + "  'use strict';\n".length;
    let expected = source.slice(start, source.lastIndexOf('\n});')).replace(/^  return \{/m, '  export default {');
    if (item.module === 'src/domain/practice/engine.js') {
      // Keep the full-body guard. Only these exact approved differences are allowed;
      // listening gates, scheduling calculations and every other validation stay pinned.
      const changes = [
        ["    if (!['all', 'wrong'].includes(mode) || typeof shuffle !== 'boolean') fail('INVALID_OPTIONS', 'Kiểu luyện nghe không hợp lệ.');", "    const limit = options.limit ?? 'all';\n    if (!['all', 5, 10].includes(limit)) fail('INVALID_OPTIONS', 'Số câu nghe cần là 5, 10 hoặc tất cả.');\n    if (!['all', 'wrong'].includes(mode) || typeof shuffle !== 'boolean') fail('INVALID_OPTIONS', 'Kiểu luyện nghe không hợp lệ.');"],
        ["    if (shuffle) ids = shuffled(ids, random);\n    const optionOrders", "    if (shuffle) ids = shuffled(ids, random);\n    if (limit !== 'all') ids = ids.slice(0, limit);\n    const optionOrders"],
        ["const session = {id: sequenceId(state, 'listen', now), lessons: selected, mode, questionIds: ids,", "const session = {id: sequenceId(state, 'listen', now), lessons: selected, mode, ...(limit !== 'all' ? {limit} : {}), questionIds: ids,"],
        ["      if (source.mode === 'all' && !sameSet(ids, allIds)) fail('INVALID_SESSION', 'Lượt nghe thiếu câu của các bài đã chọn.');", "      const limit = source.limit ?? 'all';\n      if (!['all', 5, 10].includes(limit) || (limit !== 'all' && ids.length > limit)) fail('INVALID_SESSION', 'Số câu trong lượt nghe không hợp lệ.');\n      if (source.mode === 'all' && (limit === 'all' ? !sameSet(ids, allIds) : ids.length !== Math.min(limit, allIds.length))) fail('INVALID_SESSION', 'Lượt nghe thiếu câu của các bài đã chọn.');"],
        ["state.listening.session = {...common, mode: source.mode, questionIds: ids.slice(),", "state.listening.session = {...common, mode: source.mode, ...(limit !== 'all' ? {limit} : {}), questionIds: ids.slice(),"],
        ["    if (review.senseIds.slice(0, position).some(id => !own(review.ratings, id))) fail('RATING_REQUIRED', 'Hãy tự đánh giá thẻ hiện tại trước khi chuyển tiếp.');", '    // Browsing does not reveal, rate, complete, or reschedule any card.'],
        ["    const {review, id} = currentReview(state);\n    if (!own(review.ratings, id)) fail('RATING_REQUIRED', 'Hãy tự đánh giá thẻ hiện tại trước khi chuyển tiếp.');", '    const {review} = currentReview(state);'],
        ["      if (ids.slice(0, common.position).some(id => !own(ratings, id))) fail('INVALID_SESSION', 'Lượt ôn đã bỏ qua thẻ chưa tự đánh giá.');\n", ''],
        ["? ratings[ids.at(-1)].at : null", '? Math.max(...ids.map(id => ratings[id].at)) : null'],
      ];
      for (const [before, after] of changes) {
        assert.equal(expected.split(before).length - 1, 1, `Approved difference must match exactly once: ${before}`);
        expected = expected.replace(before, after);
      }
    }
    const output = readFileSync(new URL(`../${item.module}`, import.meta.url), 'utf8');
    assert.equal(output.slice(output.indexOf(' */\n') + 4).trimEnd(), expected.trimEnd());
    assert.equal(/window\.|module\.exports|localStorage|document\./.test(expected), false);
  }
  assert.equal(homework.MAX_BACKUP_BYTES, 192 * 1024 * 1024);
  assert.equal(practice.MAX_BACKUP_BYTES, 4 * 1024 * 1024);
});

test('real nonempty old records retain reading, first/latest, submitted translations, redo drafts and recovery raw', () => {
  const input = raw(), result = compatibility.migrate(input, at), state = result.data;
  assert.deepEqual(result.warnings, []);
  assert.deepEqual(state.reading.lessons, fixture('reading-shared').hsk1_ranteacher_progress_v1 ?
    JSON.parse(fixture('reading-shared').hsk1_ranteacher_progress_v1) : {});
  const original = fixture('stage2');
  for (const id of ['1', '15']) for (const kind of ['choice', 'sort', 'translation']) {
    const group = state.homework.lessons[id][kind], old = original.lessons[id][kind];
    assert.deepEqual(group.first, old.first); assert.deepEqual(group.latest, old.latest);
    assert.deepEqual(group.history, old.history); assert.deepEqual(group.draft, old.draft);
    assert.equal(group.completed, true);
  }
  const translation = state.homework.lessons['15'].translation;
  assert.equal(translation.attempt, null);
  assert.notDeepEqual(translation.draft, translation.latest.answers);
  assert.ok(Object.values(translation.latest.answers).some(value => value.includes('\n') && value.length > 1200));
  assert.deepEqual(state.legacyRaw, input);
  assert.equal(state.navigation.feature, 'homework'); assert.equal(state.navigation.lesson, 10);
  assert.equal(state.navigation.part, 'translation');
  assert.deepEqual(compatibility.summary(state), {
    readingVisited: 2, readingCompleted: 1, masteredWords: 2, homeworkSubmitted: 30,
    automaticSubmitted: 20, automaticFirstCorrect: 0, automaticLatestCorrect: 20, manualSubmitted: 10,
    listeningSubmitted: 1, listeningFirstCorrect: 0, listeningLatestCorrect: 1, scheduledSenses: 3, legacySources: 9,
  });
});

test('shared records of other HSK levels stay byte-for-byte in raw and never become HSK1 progress', () => {
  const input = raw(), data = compatibility.migrate(input, at).data;
  assert.ok(Object.keys(JSON.parse(input.hsk_module_progress_v1)).some(key => !key.startsWith('hsk1:')));
  assert.ok(Object.keys(data.reading.modules).every(key => key.startsWith('hsk1:')));
  assert.equal(data.legacyRaw.hsk_module_progress_v1, input.hsk_module_progress_v1);
  const state = compatibility.migrate({ hsk_recent_lesson_v1: JSON.stringify({ code: 'hsk2', id: 7, sec: 'text' }) }, at).data;
  assert.equal(state.navigation, null);
});

test('stage2 takes precedence; corrupt main does not silently activate stage1, learning or recovery', () => {
  const input = { ...raw(), [homework.STEP1_KEY]: text('stage1-default'), [homework.LEGACY_KEY]: text('learning-v2') };
  assert.equal(compatibility.migrate(input, at).data.homework.profile.name, fixture('stage2').profile.name);
  input[homework.KEY] = '{ invalid';
  const result = compatibility.migrate(input, at);
  assert.deepEqual(result.data.homework.lessons, {});
  assert.ok(result.warnings.some(value => value.includes(homework.KEY) && value.includes('Bản gốc')));
  assert.deepEqual(result.data.legacyRaw, input);
  assert.ok(Object.keys(result.data.practice.listening.records).length > 0);
});

test('stage1 app missing or explicit migrates only lesson3 and avoids a new nested archive copy', () => {
  for (const name of ['stage1-default', 'stage1-explicit']) {
    const result = compatibility.migrate({ [homework.STEP1_KEY]: text(name) }, at);
    assert.deepEqual(result.warnings, []); assert.deepEqual(Object.keys(result.data.homework.lessons), ['3']);
    assert.equal(compatibility.summary(result.data).homeworkSubmitted, 15);
    assert.equal(result.data.legacyRaw[homework.STEP1_KEY], text(name));
    assert.equal('step1' in result.data.homework.archive, false);
    assert.equal(result.data.homework.lessons['3'].translation.attempt, null);
    assert.notDeepEqual(result.data.homework.lessons['3'].translation.draft, result.data.homework.lessons['3'].translation.latest.answers);
  }
  const invalid = fixture('stage1-default'); invalid.lessons['1'] = invalid.lessons['3'];
  assert.throws(() => compatibility.importLegacy(invalid, compatibility.blank(), at));
});

function identity(q) {
  return JSON.stringify([q.id, q.kind, q.prompt || '', q.stem || '', q.meaning || '', q.options || [], q.tokens || [],
    q.answer ?? null, q.answers || [], q.assessment || 'automatic', q.transcript || '', q.audio || null]);
}
test('legacy compatibility verifies actual original identities rather than trusting same-ID flags', () => {
  const manifest = json('../src/domain/homework/legacy-identities.json');
  const source = readFileSync(new URL(`../../${manifest.source}`, import.meta.url), 'utf8');
  assert.equal(createHash('sha256').update(source).digest('hex'), manifest.sha256);
  const context = { window: {} }; vm.runInNewContext(source, context);
  const previous = context.window.HSK1_NEW_BANK.flatMap(row => ['choice', 'sort', 'listening'].flatMap(kind => row[kind] || []));
  for (const [id, value] of Object.entries(manifest.identities)) assert.equal(identity(previous.find(q => q.id === id)), value);
  const marked = bank.lessons.flatMap(row => ['choice', 'sort', 'listening'].flatMap(kind => row[kind] || [])).filter(q => q.legacyCompatible);
  assert.equal(marked.length, 10);
  assert.equal(marked.filter(q => identity(q) === manifest.identities[q.id]).length, 8);
  const result = compatibility.migrate({ [homework.LEGACY_KEY]: text('learning-v2') }, at);
  assert.equal(compatibility.summary(result.data).homeworkSubmitted, 0);
  assert.ok(Object.keys(result.data.homework.lessons['3'].choice.draft).length > 0);
  assert.ok(Object.keys(result.data.homework.lessons['3'].sort.draft).length > 0);
  assert.equal(result.data.homework.lessons['3'].choice.first, null);
  assert.equal(result.data.homework.lessons['3'].sort.first, null);
  assert.equal('translation' in (result.data.homework.lessons['1'] || {}), false);
  assert.equal(result.data.legacyRaw[homework.LEGACY_KEY], text('learning-v2'));
  assert.equal('legacy' in result.data.homework.archive, false);
  assert.ok(result.warnings.some(value => value.includes('dịch')));
});

test('a full old L3 group with one changed identity keeps only verified partial drafts and no grade', () => {
  const context = { window: {} };
  vm.runInNewContext(readFileSync(new URL('../../new-hsk1/hsk1/learning-bank.js', import.meta.url), 'utf8'), context);
  const old = context.window.HSK1_NEW_BANK.find(row => row.lesson === 3);
  const input = fixture('learning-v2');
  for (const kind of ['choice', 'sort']) {
    const answers = Object.fromEntries(old[kind].map(q => [q.id, kind === 'choice' ? q.answer : q.tokens.map((_, index) => index)]));
    input.lessons['3'][kind].draft = answers;
    input.lessons['3'][kind].first = { answers, results: Object.fromEntries(old[kind].map(q => [q.id, true])), correct: 5, total: 5, at };
    input.lessons['3'][kind].attempt = copy(input.lessons['3'][kind].first);
  }
  const result = compatibility.importLegacy(input, compatibility.blank(), at);
  for (const kind of ['choice', 'sort']) {
    const state = result.data.homework.lessons['3'][kind];
    assert.equal(state.first, null); assert.equal(state.completed, false);
    assert.equal(Object.keys(state.draft).length, 4);
    assert.equal(Object.keys(state.draft).some(id => id.endsWith('03')), false);
  }
});

test('listening and vocabulary state restore real sessions, unsubmitted choices, rating queues and distinct senses', () => {
  const state = compatibility.importLegacy(text('stage3'), compatibility.blank(), at).data.practice;
  const source = fixture('stage3'); assert.deepEqual(state, source);
  assert.notDeepEqual(state.preferences.lessons, [1, 2, 3]);
  const pending = Object.values(state.listening.session.responses).find(row => row.selected !== null && row.submission === null);
  assert.ok(pending); assert.equal(pending.listenCount, 2);
  assert.ok(Object.keys(state.cards.review.ratings).length > 0);
  const ids = state.cards.review.senseIds;
  const formIds = new Map();
  for (const id of ids) {
    const item = catalog.vocabulary.find(word => word.senseId === id);
    if (!formIds.has(item.zh)) formIds.set(item.zh, new Set()); formIds.get(item.zh).add(id);
  }
  assert.ok([...formIds.values()].some(senses => senses.size > 1));
});

test('new backup import refuses changed grades, boolean results and manual scores instead of trusting them', () => {
  const original = migrated();
  const mutate = update => { const value = copy(original); update(value); assert.throws(() => compatibility.validate(value), /bị sửa/); };
  mutate(data => { data.homework.lessons['1'].choice.first.correct = 5; });
  mutate(data => { const result = data.homework.lessons['1'].sort.latest.results; result[Object.keys(result)[0]] = false; });
  mutate(data => { data.homework.lessons['15'].translation.latest.correct = 5; });
  mutate(data => { data.homework.lessons['1'].choice.completed = false; });
  mutate(data => { const record = Object.values(data.practice.listening.records)[0]; record.first.correct = true; });
  mutate(data => { const response = Object.values(data.practice.listening.session.responses).find(item => item.submission); response.submission.correct = !response.submission.correct; });
  assert.deepEqual(original, migrated());
});

test('valid old backups recompute modified grades and report the policy explicitly', () => {
  const old = fixture('stage2'); old.lessons['1'].choice.first.correct = 5;
  const result = compatibility.importLegacy(old, compatibility.blank(), at);
  assert.equal(result.data.homework.lessons['1'].choice.first.correct, 0);
  assert.ok(result.warnings.some(value => value.includes('tính lại')));
  const listen = fixture('stage3'); Object.values(listen.listening.records)[0].first.correct = true;
  const listening = compatibility.importLegacy(listen, compatibility.blank(), at);
  assert.equal(Object.values(listening.data.practice.listening.records)[0].first.correct, false);
  assert.ok(listening.warnings.some(value => value.includes('tính lại')));
});

test('wrong app/schema, unknown IDs, altered fingerprints, incomplete answers and invalid timestamps are rejected', () => {
  for (const input of [{}, { app: 'hsk2-stage2', schema: 3, lessons: {} }, { schema: 2, app: 'wrong', lessons: {} },
    { ...fixture('stage3'), schema: 2 }, { ...fixture('stage2'), schema: 4 }]) {
    assert.throws(() => compatibility.importLegacy(input, compatibility.blank(), at));
  }
  const original = migrated();
  const changes = [
    value => { value.homework.lessons['1'].choice.draft.unknown = 0; },
    value => { const fp = value.homework.lessons['1'].choice.first.questionFingerprints; fp[Object.keys(fp)[0]] = 'changed'; },
    value => { const answers = value.homework.lessons['1'].choice.latest.answers; delete answers[Object.keys(answers)[0]]; },
    value => { value.homework.lessons['1'].choice.latest.at = -1; },
    value => { value.practice.cards.schedule.unknown = Object.values(value.practice.cards.schedule)[0]; },
    value => { Object.values(value.practice.listening.records)[0].latest.fingerprint = 'changed'; },
  ];
  for (const change of changes) { const value = copy(original); change(value); assert.throws(() => compatibility.validate(value)); }
});

test('importing one legacy domain preserves every unrelated domain and original source string', () => {
  const base = migrated();
  const incoming = ` \n${text('stage1-default')}\n `;
  const result = compatibility.importLegacy(incoming, base, at);
  assert.deepEqual(result.data.reading, base.reading); assert.deepEqual(result.data.practice, base.practice);
  assert.deepEqual(result.data.navigation, base.navigation);
  assert.equal(result.data.legacyRaw[homework.STEP1_KEY], incoming);
  assert.equal(result.data.legacyRaw[homework.KEY], base.legacyRaw[homework.KEY]);
  const practiceResult = compatibility.importLegacy(text('stage3-previous'), result.data, at);
  assert.deepEqual(practiceResult.data.homework, result.data.homework);
  assert.deepEqual(base, migrated());
});

test('repeated new-format validation and migration round trips add no archive layers or identity changes', () => {
  const state = migrated();
  let next = state;
  for (let i = 0; i < 5; i++) next = compatibility.validate(JSON.parse(JSON.stringify(next)));
  assert.deepEqual(next, state);
  assert.equal(JSON.stringify(next).length, JSON.stringify(state).length);
});

test('access gates are excluded from migration and forbidden in new learning backups', () => {
  const keys = ['hsk_portal_unlocked_v2', 'hsk_site_unlocked_v1', 'hsk1_ranteacher_unlocked'];
  assert.equal(LEGACY_KEYS.length, 11);
  assert.ok(keys.every(key => !LEGACY_KEYS.includes(key)));
  const result = compatibility.migrate({ ...raw(), ...Object.fromEntries(keys.map(key => [key, '1'])) }, at);
  assert.ok(keys.every(key => !(key in result.data.legacyRaw)));
  const invalid = copy(result.data); invalid.legacyRaw.hsk_portal_unlocked_v2 = '1';
  assert.throws(() => compatibility.validate(invalid));
});

test('malformed reading or previous sources produce visible warnings while retaining source bytes', () => {
  const input = raw(); input.hsk1_ranteacher_progress_v1 = JSON.stringify({ 99: { visited: true } });
  input[`${practice.KEY}_previous`] = 'not JSON';
  const result = compatibility.migrate(input, at);
  assert.equal(result.warnings.length, 2);
  assert.equal(result.data.legacyRaw.hsk1_ranteacher_progress_v1, input.hsk1_ranteacher_progress_v1);
  assert.equal(result.data.legacyRaw[`${practice.KEY}_previous`], 'not JSON');
  assert.equal(compatibility.summary(result.data).homeworkSubmitted, 30);
});

test('clock rollback does not redefine semantic first/latest or reject an otherwise valid old record', () => {
  const data = migrated(), group = data.homework.lessons['1'].choice;
  // The latest submission remains latest by its field/history role even if the device clock moved backwards.
  const moved = group.first.at - 1;
  group.latest.at = moved; group.attempt.at = moved; group.history.at(-1).at = moved;
  const result = Object.values(data.practice.listening.records)[0];
  result.first.at = result.latest.at + 1000;
  const normalized = compatibility.validate(data);
  assert.equal(normalized.homework.lessons['1'].choice.latest.correct, 5);
  assert.equal(normalized.homework.lessons['1'].choice.first.correct, 0);
  assert.equal(Object.values(normalized.practice.listening.records)[0].latest.correct, true);
  assert.equal(Object.values(normalized.practice.listening.records)[0].first.correct, false);
});
