import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createTextbookContent } from '../src/services/content/textbook.ts';

const read = name => JSON.parse(readFileSync(new URL(`../content/${name}.json`, import.meta.url), 'utf8'));
const book = read('textbook'); const media = read('media-references'); const catalog = read('stage3-catalog');
const revisions = read('textbook-display-revisions');
const create = (value = revisions, source = book) => createTextbookContent(source, media, catalog, undefined, value);
const original = createTextbookContent(book, media, catalog);
const displayed = create();
const byId = lessons => new Map(lessons.flatMap(lesson => [
  [`textbook-l${String(lesson.id).padStart(2, '0')}-title`, lesson],
  ...[...lesson.vocab, ...lesson.scenes, ...lesson.scenes.flatMap(scene => scene.lines),
    ...lesson.grammar, ...lesson.phonetics, lesson.hanzi, ...lesson.xiaoyuTips].map(item => [item.id, item])
]));

test('approved source corrections appear in the display with provenance while the frozen input stays unchanged', () => {
  const before = JSON.stringify([book, media, catalog, revisions]);
  const loaded = create(); const targets = byId(loaded.lessons);
  assert.equal(loaded.displayRevisions.revision, revisions.revision);
  assert.deepEqual(loaded.displayRevisions.sources, revisions.sources);
  for (const change of revisions.changes) {
    assert.deepEqual(targets.get(change.target)[change.field], change.value, `${change.target}:${change.field}`);
  }
  assert.equal(targets.get('textbook-l04-v002').pos, 'pron');
  assert.equal(targets.get('textbook-l06-v014').py, 'nàbiān');
  assert.match(targets.get('textbook-l06-text-1-line-02').py, /yāo sì jiǔ/);
  assert.deepEqual(targets.get('textbook-l06-grammar-02').examples.map(example => example.zh), [
    '我想去超市买东西。', '我们去西安饭店吃晚饭。', '我们坐出租车去西安饭店。', '她坐出租车去超市。'
  ]);
  assert.equal(JSON.stringify([book, media, catalog, revisions]), before);
  assert.throws(() => { loaded.lessons[3].vocab[1].pos = 'changed'; }, TypeError);
  assert.throws(() => { loaded.displayRevisions.changes[0].value = 'changed'; }, TypeError);
});

test('display repairs preserve every stable identity, catalog sense, scene and line audio boundary', () => {
  const oldTargets = byId(original.lessons); const newTargets = byId(displayed.lessons);
  assert.deepEqual([...newTargets.keys()], [...oldTargets.keys()]);
  for (const [id, source] of oldTargets) {
    const revised = newTargets.get(id);
    assert.equal(revised.fingerprint, source.fingerprint, id);
    assert.deepEqual(revised.source, source.source, id);
    assert.deepEqual(revised.catalogIds, source.catalogIds, id);
    assert.deepEqual(revised.sourceSenseIds, source.sourceSenseIds, id);
  }
  for (const lesson of original.lessons) {
    for (const word of lesson.vocab) {
      assert.deepEqual(displayed.wordSenses(lesson.id, word.id), original.wordSenses(lesson.id, word.id));
      for (const id of word.catalogIds) assert.deepEqual(displayed.resolveWord(lesson.id, word.id, id), original.resolveWord(lesson.id, word.id, id));
    }
    for (const scene of lesson.scenes) {
      assert.deepEqual(displayed.resolveScene(lesson.id, scene.id), original.resolveScene(lesson.id, scene.id));
      for (const line of scene.lines) assert.deepEqual(displayed.resolveLine(lesson.id, scene.id, line.id), original.resolveLine(lesson.id, scene.id, line.id));
    }
    assert.deepEqual(displayed.vocabPlaylist(lesson.id), original.vocabPlaylist(lesson.id));
  }
});

test('stale baselines, mistaken targets, forbidden fields and incomplete provenance reject the whole display revision', () => {
  for (const mutate of [
    copy => { copy.baseline = 'f'.repeat(40); },
    copy => { copy.changes[0].expected = 'stale text'; },
    copy => { copy.changes[0].target = 'constructor'; },
    copy => { copy.changes[0].lesson = 3; },
    copy => { copy.changes[0].field = 'fingerprint'; },
    copy => { copy.changes[0].field = 'catalogIds'; },
    copy => { copy.changes[0].value = ''; },
    copy => { copy.changes[0].unexpected = true; },
    copy => { copy.changes[0].source.id = 'unregistered'; },
    copy => { copy.changes[0].source.pdfPages = []; },
    copy => { copy.sources[0].sha256 = 'invalid'; },
    copy => { copy.changes.push(structuredClone(copy.changes[0])); },
    copy => { copy.changes.find(change => change.field === 'examples').value[0].zh = ''; },
    copy => { copy.changes.find(change => change.field === 'examples').value[0].answer = 'invented'; }
  ]) {
    const copy = structuredClone(revisions); mutate(copy); assert.throws(() => create(copy), /sửa hiển thị/);
  }
});

test('frozen book validation runs before display correction, so overlays cannot hide invalid source data', () => {
  const source = structuredClone(book);
  source.lessons[3].scenes[0].lines[2].py = '';
  const copy = structuredClone(revisions); copy.changes[0].expected = '';
  assert.throws(() => create(copy, source), /hội thoại/);
  source.lessons[3].scenes[0].lines[2].py = book.lessons[3].scenes[0].lines[2].py;
  source.lessons[0].vocab[0].catalogIds = [catalog.vocabulary[1].id];
  assert.throws(() => create(revisions, source), /khớp hàng/);
});

test('later approved Vietnamese copy can use the same narrow display mechanism without changing histories or audio', () => {
  const source = book.lessons[0].scenes[0].lines[0];
  const value = structuredClone(revisions);
  value.changes = [{ target: source.id, lesson: 1, field: 'vn', expected: source.vn, value: 'Bản dịch đã được đối chiếu.',
    reason: 'Test fixture only; no claim of official-textbook review.', source: { id: value.sources[0].id, printedPages: [1], pdfPages: [16] } }];
  const loaded = create(value);
  assert.equal(loaded.lessons[0].scenes[0].lines[0].vn, value.changes[0].value);
  assert.equal(loaded.lessons[0].scenes[0].lines[0].fingerprint, source.fingerprint);
  assert.deepEqual(loaded.resolveLine(1, book.lessons[0].scenes[0].id, source.id), original.resolveLine(1, book.lessons[0].scenes[0].id, source.id));
  assert.equal(book.lessons[0].scenes[0].lines[0].vn, source.vn);
});
