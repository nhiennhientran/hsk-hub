import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

export const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const FIXTURE_ROOT = path.join(APP_ROOT, 'tests/fixtures/migration');
export const FIXTURE_TIME = Date.UTC(2026, 8, 20, 8);
const require = createRequire(import.meta.url);
const legacyRoot = path.resolve(APP_ROOT, '../new-hsk1/hsk1');
export const engines = Object.freeze({
  learning: require(path.join(legacyRoot, 'learning-engine.js')),
  stage1: require(path.join(legacyRoot, 'stage1/engine.js')),
  stage2: require(path.join(legacyRoot, 'stage2/engine.js')),
  stage3: require(path.join(legacyRoot, 'stage3/engine.js'))
});
const copy = value => JSON.parse(JSON.stringify(value));
const serialize = value => JSON.stringify(value, null, 2) + '\n';
const sha256 = value => createHash('sha256').update(value).digest('hex');
const read = relative => fs.readFileSync(path.join(APP_ROOT, relative));

export function sources() {
  const sandbox = {window: {}};
  vm.runInNewContext(read('../new-hsk1/hsk1/learning-bank.js').toString(), sandbox, {timeout: 1000});
  return {
    oldBank: copy(sandbox.window.HSK1_NEW_BANK),
    sampleBank: copy(require(path.join(legacyRoot, 'stage1/sample-bank.js'))),
    bank: JSON.parse(read('content/stage2-bank.json')).lessons,
    catalog: JSON.parse(read('content/stage3-catalog.json')),
    textbook: JSON.parse(read('content/textbook.json'))
  };
}

function permutation(values, accept, prefix = []) {
  if (!values.length) return accept(prefix) ? prefix : null;
  for (let i = 0; i < values.length; i++) {
    const found = permutation(values.filter((_, index) => index !== i), accept, [...prefix, values[i]]);
    if (found) return found;
  }
  return null;
}
function answer(engine, q, correct) {
  if (q.kind !== 'sort') return correct ? q.answer : (q.answer + 1) % q.options.length;
  const result = permutation(q.tokens.map((_, i) => i), value => engine.check(q, value) === correct);
  // A few old two-token items accept every permutation; keep a legal answer.
  if (!correct && !result) return answer(engine, q, true);
  assert.ok(result, `Cannot create correct sort answer for ${q.id}`);
  return result;
}
function objective(engine, state, row, kind, now, redo = true) {
  const group = engine.group(state, row.lesson, kind);
  const fill = correct => {
    group.draft = Object.fromEntries(row[kind].map(q => [q.id, answer(engine, q, correct)]));
    group.orders = Object.fromEntries(row[kind].map(q => [q.id,
      (q.kind === 'sort' ? q.tokens : q.options).map((_, i) => i).reverse()]));
  };
  fill(false);
  assert.equal(engine.submit(state, row.lesson, kind, row[kind], now).ok, true);
  if (engine === engines.learning) {
    fill(true);
    assert.equal(engine.correct(state, row.lesson, kind, row[kind]).completed, true);
  }
  if (redo) {
    engine.restart(state, row.lesson, kind, now + 1000);
    fill(true);
    assert.equal(engine.submit(state, row.lesson, kind, row[kind], now + 2000).ok, true);
  }
}
function manual(engine, state, row, now, long = false) {
  const group = engine.group(state, row.lesson, 'translation');
  group.draft = Object.fromEntries(row.translation.map((q, i) => [q.id,
    `匿名样本 A：第${row.lesson}课，第${i + 1}题。\n  我是越南学生，我正在学习中文。\n` +
    (long && i === 0 ? '这是一份用于恢复验证的长答题稿，保留原文和换行。\n'.repeat(50) : '')]));
  assert.equal(engine.submit(state, row.lesson, 'translation', row.translation, now).ok, true);
}

function makeLearning({oldBank, bank, catalog}) {
  const state = engines.learning.blank(), row = oldBank.find(item => item.lesson === 1);
  objective(engines.learning, state, row, 'choice', FIXTURE_TIME);
  objective(engines.learning, state, row, 'sort', FIXTURE_TIME + 5000);
  // This format really submitted translation choices. Never manufacture free-text grades from it.
  objective(engines.learning, state, row, 'translation', FIXTURE_TIME + 10000);
  objective(engines.learning, state, row, 'listening', FIXTURE_TIME + 15000);
  engines.learning.restart(state, 1, 'translation');
  engines.learning.group(state, 1, 'translation').draft[row.translation[0].id] = row.translation[0].answer;
  const currentL3 = bank.find(item => item.lesson === 3), oldL3 = oldBank.find(item => item.lesson === 3);
  // Real legacy submissions are above. The current corpus only supports verified partial L3 drafts.
  for (const kind of ['choice', 'sort']) {
    const q = oldL3[kind][0], current = currentL3[kind][0];
    for (const key of ['id', 'kind', 'prompt', 'stem', 'meaning', 'options', 'tokens', 'answer', 'answers']) {
      assert.deepEqual(q[key] ?? null, current[key] ?? null);
    }
    engines.learning.group(state, 3, kind).draft[q.id] = kind === 'sort' ? [0] : q.answer;
  }
  const words = catalog.vocabulary.filter(item => [1, 3].includes(item.lesson)).slice(0, 2);
  const keys = words.map(item => JSON.stringify([item.zh.trim().toLowerCase(), item.py.replace(/\s+/g, '').toLowerCase(), item.vi.trim().toLowerCase()]));
  words.forEach((item, i) => {
    state.words[keys[i]] = {zh: item.zh, lastRating: i ? 'again' : 'known', level: i ? 0 : 1,
      due: FIXTURE_TIME + (i ? 0 : 86400000), reviewedAt: FIXTURE_TIME, reviews: i ? 2 : 1,
      lapses: i ? 1 : 0, source: 'self-assessment'};
  });
  const listens = oldBank.filter(item => [1, 3].includes(item.lesson)).flatMap(item => item.listening).slice(0, 3);
  state.preferences = {lastLesson: 3, rate: 0.75, listenLessons: [1, 3],
    vocab: {lessons: [1, 3], direction: 'vn-zh', pinyin: false, filter: 'due', search: '',
      session: {queue: keys, index: 1, direction: 'vn-zh', lessons: [1, 3], revealed: true,
        remembered: 1, retries: [], started: FIXTURE_TIME}},
    listenSession: {version: 1, ids: listens.map(q => q.id), index: 1,
      answers: {[listens[0].id]: listens[0].answer},
      orders: {[listens[0].id]: [1, 3, 0, 2], [listens[1].id]: [2, 0, 3, 1]},
      draft: {[listens[1].id]: (listens[1].answer + 1) % 4}}};
  state.updatedAt = FIXTURE_TIME + 18000;
  return state;
}
function makeStage1({sampleBank}) {
  const state = engines.stage1.blank(), row = sampleBank.find(item => item.lesson === 3);
  objective(engines.stage1, state, row, 'choice', FIXTURE_TIME);
  objective(engines.stage1, state, row, 'sort', FIXTURE_TIME + 5000);
  manual(engines.stage1, state, row, FIXTURE_TIME + 10000);
  engines.stage1.restart(state, 3, 'translation', FIXTURE_TIME + 11000);
  state.lessons[3].translation.draft[row.translation[0].id] = '匿名样本 B：正在重做，尚未提交。\n  保留空格和换行。';
  state.profile = {name: 'Học viên mẫu', className: 'Lớp kiểm thử'};
  state.preferences = {lastLesson: 3, lastPart: 'translation'};
  return state;
}
function makeStage2({bank}, legacy) {
  const state = engines.stage2.blank();
  for (const lesson of [1, 15]) {
    const row = bank.find(item => item.lesson === lesson), now = FIXTURE_TIME + lesson * 100000;
    objective(engines.stage2, state, row, 'choice', now);
    objective(engines.stage2, state, row, 'sort', now + 5000);
    manual(engines.stage2, state, row, now + 10000, lesson === 15);
  }
  state.profile = {name: 'Học viên mẫu', className: 'Lớp kiểm thử'};
  state.preferences = {lastLesson: 15, lastPart: 'translation', rate: 0.75};
  state.archive = {legacy: copy(legacy), migration: {sourceSchema: 2, at: FIXTURE_TIME,
    restoredGroups: [], draftOnlyGroups: ['3:choice', '3:sort'], heldGroups: [],
    archivedTranslationLessons: ['1'], warnings: []}};
  const recovery = copy(state), row = bank.find(item => item.lesson === 15);
  engines.stage2.restart(state, 15, 'translation', FIXTURE_TIME + 1600000);
  state.lessons[15].translation.draft[row.translation[0].id] = '匿名样本 B：新的未完成答题稿。\n  这段不是已提交稿 A。';
  state.lessons[15].translation.draft[row.translation[1].id] = '';
  return {state, recovery};
}
function makeStage3({catalog}) {
  const engine = engines.stage3, state = engine.blank();
  engine.setPreferences(state, {module: 'vocabulary', lessons: [7, 11, 15], listeningMode: 'all',
    vocabularyFilter: 'all', direction: 'vi-zh', shuffle: false, rate: 0.75}, FIXTURE_TIME);
  const options = {lessons: [7, 11, 15], mode: 'all', shuffle: false};
  let session = engine.createListeningSession(state, catalog, options, FIXTURE_TIME + 1000, () => 0.375);
  const firstId = session.questionIds[0], q = catalog.listening.find(item => item.id === firstId);
  engine.selectListening(state, catalog, firstId, (q.answer + 1) % 4, FIXTURE_TIME + 2000);
  engine.recordListen(state, catalog, firstId, FIXTURE_TIME + 2100);
  engine.submitListening(state, catalog, FIXTURE_TIME + 2200);
  const previous = copy(state);
  session = engine.createListeningSession(state, catalog, options, FIXTURE_TIME + 3000, () => 0.375);
  engine.selectListening(state, catalog, firstId, q.answer, FIXTURE_TIME + 4000);
  engine.recordListen(state, catalog, firstId, FIXTURE_TIME + 4100);
  engine.submitListening(state, catalog, FIXTURE_TIME + 4200);
  engine.nextListening(state, FIXTURE_TIME + 4300);
  const pendingId = session.questionIds[1];
  engine.selectListening(state, catalog, pendingId, 2, FIXTURE_TIME + 4400);
  engine.recordListen(state, catalog, pendingId, FIXTURE_TIME + 4500);
  engine.recordListen(state, catalog, pendingId, FIXTURE_TIME + 4600);
  engine.startReview(state, catalog, {lessons: [7, 11, 15], filter: 'all', direction: 'vi-zh', shuffle: false}, FIXTURE_TIME + 5000);
  for (const [i, rating] of ['again', 'hard', 'good'].entries()) {
    engine.revealCard(state, state.cards.review.senseIds[i], FIXTURE_TIME + 6000 + i * 1000);
    engine.rateCard(state, catalog, rating, FIXTURE_TIME + 6100 + i * 1000);
    engine.nextCard(state, FIXTURE_TIME + 6200 + i * 1000);
  }
  engine.revealCard(state, state.cards.review.senseIds[3], FIXTURE_TIME + 9000);
  return {state, previous};
}

export function buildFixtures() {
  const data = sources(), learning = makeLearning(data), stage1 = makeStage1(data);
  const stage2 = makeStage2(data, learning), stage3 = makeStage3(data);
  const progress = {'1': {visited: true, complete: false}, '15': {visited: true, complete: true}};
  const firstWord = data.textbook.lessons[0].vocab[0].zh, lastWord = data.textbook.lessons[14].vocab[0].zh;
  const reading = {
    hsk1_ranteacher_progress_v1: JSON.stringify(progress, null, 2),
    hsk1_ranteacher_mastered_v1: JSON.stringify({[`1-${firstWord}`]: true, [`15-${lastWord}`]: true}),
    hsk_module_progress_v1: JSON.stringify({'hsk1:1': {modules: ['vocab', 'text'], updatedAt: FIXTURE_TIME},
      'hsk1:15': {modules: ['grammar'], updatedAt: FIXTURE_TIME + 1000},
      'hsk2:4': {modules: ['text'], updatedAt: FIXTURE_TIME - 1000}}),
    hsk_recent_lesson_v1: JSON.stringify({code: 'hsk1', id: 15, sec: 'grammar', title: 'Bài 15',
      url: 'new-hsk1/hsk1/lesson.html?id=15&sec=grammar', updatedAt: FIXTURE_TIME + 1000})
  };
  const navigation = {ran_hsk1_integrated_nav_v1: JSON.stringify({mode: 'homework', lesson: 10,
    href: 'homework.html#lesson=10&part=translation', at: FIXTURE_TIME, extra: {part: 'translation'},
    homeworkLesson: 10, homeworkParts: {'3': 'sort', '10': 'translation'}})};
  const navVariants = Object.fromEntries(['listening', 'vocab'].map(mode => [mode, {
    ran_hsk1_integrated_nav_v1: JSON.stringify({mode, lesson: 15,
      href: `learning.html?mode=${mode}&lesson=15`, at: FIXTURE_TIME, extra: {lessons: [1, 3, 15]}})
  }]));
  const gate = {unlockedSession: {hsk_portal_unlocked_v2: '1', hsk1_ranteacher_unlocked: '1',
    hsk_portal_unlocked: '1', hsk2_ranteacher_unlocked: '1', hsk3_ranteacher_unlocked: '1',
    hsk4_upper_ranteacher_unlocked: '1', hsk4_lower_ranteacher_unlocked: '1'}, lockedSession: {},
    deprecatedLocal: {hsk_site_unlocked_v1: '1'}};
  const files = {
    'reading-shared.json': reading, 'navigation.json': navigation, 'navigation-variants.json': navVariants,
    'gate.json': gate, 'learning-v2.json': learning, 'stage1-default.json': stage1,
    'stage1-explicit.json': {...copy(stage1), app: 'hsk1-stage1'},
    'stage2.json': stage2.state, 'stage2-recovery.json': stage2.recovery,
    'stage3.json': stage3.state, 'stage3-previous.json': stage3.previous
  };
  const inputFiles = ['content/stage2-bank.json', 'content/stage3-catalog.json', 'content/textbook.json',
    '../new-hsk1/hsk1/learning-bank.js', '../new-hsk1/hsk1/learning-engine.js',
    '../new-hsk1/hsk1/stage1/sample-bank.js', '../new-hsk1/hsk1/stage1/engine.js',
    '../new-hsk1/hsk1/stage2/engine.js', '../new-hsk1/hsk1/stage3/engine.js'];
  files['manifest.json'] = {
    schemaVersion: 1, synthetic: true, fixedTime: FIXTURE_TIME, fixedTimeISO: new Date(FIXTURE_TIME).toISOString(),
    sources: Object.fromEntries(inputFiles.map(name => [name, sha256(read(name))])),
    files: Object.fromEntries(Object.entries(files).map(([name, value]) => [name,
      {sha256: sha256(serialize(value)), bytes: Buffer.byteLength(serialize(value))}])),
    storageFiles: {ran_hsk1_learning_v2: 'learning-v2.json', ran_hsk1_stage1_v3: 'stage1-default.json',
      ran_hsk1_stage2_v3: 'stage2.json', ran_hsk1_stage2_v3_recovery: 'stage2-recovery.json',
      ran_hsk1_stage3_v1: 'stage3.json', ran_hsk1_stage3_v1_previous: 'stage3-previous.json'},
    notes: [
      'Anonymous synthetic state generated by frozen pure engines; no real learner data or password.',
      'learning_v2 has complete old L1 submissions and only verified partial L3 drafts; current submissions must not be manufactured.',
      'Current L3 choice-03 and sort-03 legacyCompatible flags overstate prompt identity; compatibility masks must hold their submissions.',
      'Stage1/2 preserve submitted translation A separately from incomplete redo draft B; manual grades remain null.',
      'Stage3 includes first wrong/latest right, pending selected option with two listens, three rating schedules and partial multi-lesson review; 在 and 要 retain separate sense IDs.',
      'Domain files are old state objects; reading/navigation files map storage keys to exact raw strings; gate variants are never learning backup data.',
      'Invalid identity, fingerprint, answer and JSON scenarios are generated by mutation in tests instead of duplicating large fixtures.'
    ]
  };
  return files;
}
export function persistFixtures(files, check = true, root = FIXTURE_ROOT) {
  if (!check) fs.mkdirSync(root, {recursive: true});
  for (const [name, value] of Object.entries(files)) {
    const target = path.join(root, name), text = serialize(value);
    if (check) assert.equal(fs.readFileSync(target, 'utf8'), text, `Fixture is stale: ${name}; run --write explicitly`);
    else fs.writeFileSync(target, text);
  }
  return Object.keys(files).length;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  assert.ok(args.length <= 1 && (!args.length || ['--write', '--check'].includes(args[0])), 'Use --check or --write');
  const check = args[0] !== '--write';
  const count = persistFixtures(buildFixtures(), check);
  console.log(`${check ? 'Verified' : 'Wrote'} ${count} deterministic nonempty migration fixtures.`);
}
