import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createVocabularyContent, loadVocabulary } from '../src/services/content/vocabulary.ts';

const json = file => JSON.parse(readFileSync(new URL(`../content/${file}.json`, import.meta.url), 'utf8'));
const catalog = json('stage3-catalog'), media = json('media-references'), textbook = json('textbook');
const audioURL = id => `https://course.example/hsk-hub/hsk1/course-assets/audio/${id}.mp3`;
const create = (c = catalog, m = media, signal) => createVocabularyContent(c, m, audioURL, signal);
const canonical = value => Array.isArray(value) ? `[${value.map(canonical).join(',')}]`
  : value && typeof value === 'object' ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}` : JSON.stringify(value);
const rehash = value => { const { fingerprint: ignored, ...data } = value; value.fingerprint = createHash('sha256').update(canonical(data)).digest('hex'); };

test('vocabulary exposes exactly the frozen 344 sense records / 319 forms with all editorial source and category fields intact', async () => {
  const loaded = await create(); assert.deepEqual(loaded.catalog, catalog); assert.deepEqual(loaded.lessons, catalog.lessons);
  assert.equal(loaded.items, loaded.catalog.vocabulary); assert.equal(loaded.items.length, 344);
  assert.equal(new Set(loaded.items.map(item => item.senseId)).size, 344);
  assert.equal(new Set(loaded.items.map(item => item.zh.normalize('NFKC'))).size, 319);
  for (const item of loaded.items) {
    assert.equal(item.id, `v-l${String(item.lesson).padStart(2, '0')}-${item.senseId}`);
    assert.ok(item.senseZh && item.py && item.vi && item.source.section);
    assert.ok(['ordinary', 'proper_noun'].includes(item.category)); assert.equal(typeof item.extension, 'boolean');
    assert.ok(item.source.printPages.every((page, index) => item.source.pdfPages[index] === page + 15));
    const { fingerprint, ...data } = item; assert.equal(fingerprint, createHash('sha256').update(canonical(data)).digest('hex'));
  }
});

test('all 330 audio requests resolve exact same-lesson original word ranges with no answer-bearing label or synthetic clip', async () => {
  const loaded = await create(); let count = 0;
  for (const item of loaded.items.filter(item => item.audio)) {
    const clip = media.clips.find(clip => clip.id === item.id), track = media.originalTracks.find(track => track.id === item.audio.track);
    assert.equal(track.kind, 'vocab'); assert.equal(track.lesson, item.lesson); assert.deepEqual(item.audio, clip.audio);
    const request = loaded.resolveAudio(item.id);
    assert.deepEqual(request, { url: audioURL(item.audio.track), start: item.audio.start, end: item.audio.end,
      label: `Bài ${item.lesson} · Âm từ giáo trình`, sourceKind: 'segment' });
    assert.ok(request.end <= track.duration_s); assert.ok(!request.url.includes('stage3/media/')); assert.ok(!request.url.startsWith('data:'));
    assert.equal(loaded.resolveAudio(item.senseId), null); assert.equal(loaded.resolveAudio(item.zh), null);
    count++;
  }
  assert.equal(count, 330);
  for (const id of ['constructor', '__proto__', 'l01-listen-01', 'unknown']) assert.equal(loaded.resolveAudio(id), null);
});

test('all 14 no-audio records remain explicit null, correspond to the L4 numeric table, and never borrow another lesson clip', async () => {
  const loaded = await create(), missing = loaded.items.filter(item => item.audio === null);
  assert.equal(missing.length, 14); assert.equal(media.missingWordAudio.length, 14);
  for (const item of missing) {
    assert.equal(item.lesson, 4); assert.equal(item.source.section, '数字表'); assert.equal(loaded.resolveAudio(item.id), null);
    assert.equal(media.clips.find(clip => clip.id === item.id), undefined);
    const declaration = media.missingWordAudio.find(row => row.id === item.id);
    assert.equal(declaration.senseId, item.senseId); assert.equal(declaration.zh, item.zh); assert.deepEqual(declaration.source, item.source);
  }
});

test('record shape, stable identity, counts, sense separation and complete source provenance are validated', async () => {
  const mutations = [
    c => { c.vocabulary.pop(); }, c => { c.vocabulary[1].id = c.vocabulary[0].id; },
    c => { c.vocabulary[1].senseId = c.vocabulary[0].senseId; }, c => { c.vocabulary[0].lexId = 'lex-other'; },
    c => { c.vocabulary[0].id = 'v-l02-' + c.vocabulary[0].senseId; },
    c => { c.vocabulary[0].source.printPages = []; c.vocabulary[0].source.pdfPages = []; },
    c => { c.vocabulary[0].source.pdfPages[0]++; }, c => { c.vocabulary[0].source.section = ''; },
    c => { c.vocabulary[0].senseZh = ''; }, c => { c.vocabulary[0].cueZh = 2; },
    c => { c.vocabulary[0].py = ''; }, c => { c.vocabulary[0].vi = ''; },
    c => { c.vocabulary[0].category = 'required'; }, c => { c.vocabulary[0].extension = 'yes'; },
    c => { c.vocabulary[0].fingerprint = 'bad'; }, c => { c.vocabulary[0].audio = undefined; },
  ];
  for (const mutate of mutations) { const c = structuredClone(catalog); mutate(c); await assert.rejects(create(c)); }
  const forms = structuredClone(catalog); forms.vocabulary[0].zh = forms.vocabulary[1].zh; rehash(forms.vocabulary[0]);
  await assert.rejects(create(forms), /344 nghĩa \/ 319 dạng từ/);
});

test('missing, duplicated, orphan or substituted audio metadata is rejected before any resolver is returned', async () => {
  const id = catalog.vocabulary[0].id;
  for (const mutate of [
    m => { m.clips = m.clips.filter(clip => clip.id !== id); },
    m => { m.clips.push(structuredClone(m.clips.find(clip => clip.id === id))); },
    m => { m.clips.find(clip => clip.id === id).id = 'v-orphan'; },
    m => { m.clips.find(clip => clip.id === id).lesson = 2; },
    m => { m.clips.find(clip => clip.id === id).mediaFile = 'new-hsk1/hsk1/stage3/media/lesson-02.js'; },
    m => { m.clips.find(clip => clip.id === id).audio.track = '2-2'; },
    m => { m.clips.find(clip => clip.id === id).audio.start += 0.001; },
    m => { m.clips.find(clip => clip.id === id).audio.end += 0.001; },
    m => { m.clips.find(clip => clip.id === id).audio.timingBasis = 'invented'; },
    m => { m.originalTracks.find(track => track.id === catalog.vocabulary[0].audio.track).path = '../../unknown.mp3'; },
  ]) { const m = structuredClone(media); mutate(m); await assert.rejects(create(catalog, m)); }
  const c = structuredClone(catalog), m = structuredClone(media);
  c.vocabulary[0].audio = structuredClone(catalog.vocabulary.find(item => item.lesson === 2 && item.audio).audio);
  m.clips.find(clip => clip.id === id).audio = structuredClone(c.vocabulary[0].audio); rehash(c.vocabulary[0]); rehash(m.clips.find(clip => clip.id === id));
  await assert.rejects(create(c, m), /cùng bài học/);
});

test('no-audio declarations cannot disappear, duplicate, point at a different sense, or acquire a fabricated clip', async () => {
  for (const mutate of [
    m => { m.missingWordAudio.pop(); }, m => { m.missingWordAudio[1] = structuredClone(m.missingWordAudio[0]); },
    m => { m.missingWordAudio[0].senseId = catalog.vocabulary[0].senseId; },
    m => { m.missingWordAudio[0].zh = '假'; }, m => { m.missingWordAudio[0].lesson = 1; },
    m => { m.missingWordAudio[0].reason = ''; }, m => { m.missingWordAudio[0].source.section = '生词'; },
    m => { m.clips.find(clip => clip.id === catalog.vocabulary[0].id).id = m.missingWordAudio[0].id; },
  ]) { const m = structuredClone(media); mutate(m); await assert.rejects(create(catalog, m)); }
  const c = structuredClone(catalog); c.vocabulary.find(item => item.audio === null).audio = structuredClone(c.vocabulary[0].audio);
  await assert.rejects(create(c));
});

test('range validation rejects negative, zero, nonfinite, beyond-track and same-lesson non-vocabulary clips', async () => {
  for (const mutate of [
    item => { item.audio.start = -1; }, item => { item.audio.end = item.audio.start; },
    item => { item.audio.end = Infinity; }, item => { item.audio.start = NaN; },
    item => { item.audio.end = media.originalTracks.find(track => track.id === item.audio.track).duration_s + 0.001; },
    item => { item.audio.track = '1-1'; },
  ]) {
    const c = structuredClone(catalog), m = structuredClone(media); mutate(c.vocabulary[0]);
    m.clips.find(clip => clip.id === c.vocabulary[0].id).audio = structuredClone(c.vocabulary[0].audio);
    await assert.rejects(create(c, m));
  }
});

test('actual SHA256 verification rejects valid-shaped editorial, clip and original-track metadata drift', async () => {
  for (const mutate of [
    c => { c.vocabulary[0].vi += ' sửa'; }, c => { c.vocabulary[0].senseZh += '新'; },
    c => { c.vocabulary[0].py += ' py'; }, c => { c.vocabulary[0].extension = true; },
    c => { c.vocabulary[0].source.section += ' mới'; }, c => { c.vocabulary.find(item => item.audio === null).cueZh += '新'; },
  ]) { const c = structuredClone(catalog); mutate(c); await assert.rejects(create(c), /Dấu kiểm tra/); }
  const m = structuredClone(media); m.clips.find(clip => clip.id === catalog.vocabulary[0].id).sha256 = 'f'.repeat(64);
  await assert.rejects(create(catalog, m), /Dấu kiểm tra/);
  const tracks = structuredClone(media); tracks.originalTracks.find(track => track.id === catalog.vocabulary[0].audio.track).bytes++;
  await assert.rejects(create(catalog, tracks), /Dấu kiểm tra/);
  const edited = structuredClone(catalog); edited.vocabulary[0].vi += ' ghi chú'; rehash(edited.vocabulary[0]);
  assert.equal((await create(edited)).items[0].vi, edited.vocabulary[0].vi);
});

test('content snapshots are deeply readonly and stable across caller mutations during asynchronous validation', async () => {
  const c = structuredClone(catalog), m = structuredClone(media), before = JSON.stringify([c, m]);
  const loaded = await create(c, m); assert.equal(JSON.stringify([c, m]), before);
  c.vocabulary[0].audio.end = 999; m.clips[0].audio.end = 999;
  assert.deepEqual(loaded.items[0], catalog.vocabulary[0]);
  assert.throws(() => { loaded.items[0].source.printPages[0] = 999; }, TypeError);
  assert.throws(() => { loaded.resolveAudio(loaded.items[0].id).end = 999; }, TypeError);
  const during = structuredClone(catalog), duringMedia = structuredClone(media), pending = create(during, duringMedia);
  during.vocabulary[0].audio.end = 999; duringMedia.clips.find(clip => clip.id === during.vocabulary[0].id).audio.end = 999;
  const stable = await pending; assert.equal(stable.resolveAudio(stable.items[0].id).end, catalog.vocabulary[0].audio.end);
});

test('loader uses the three existing source JSON files and AbortSignal, with HTTP failure visible', async t => {
  const seen = [], controller = new AbortController();
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    seen.push({ path: url.pathname, signal: options.signal });
    return { ok: true, json: async () => url.pathname.endsWith('stage3-catalog.json') ? catalog : url.pathname.endsWith('textbook.json') ? textbook : media };
  });
  assert.equal((await loadVocabulary(controller.signal)).items.length, 344);
  assert.deepEqual(seen.map(entry => entry.path.split('/').at(-1)), ['stage3-catalog.json', 'media-references.json', 'textbook.json']);
  assert.ok(seen.every(entry => entry.signal === controller.signal));
  t.mock.method(globalThis, 'fetch', async () => ({ ok: false, status: 503 }));
  await assert.rejects(loadVocabulary(controller.signal), /HTTP 503/);
});

test('aborted loads and in-flight hashes cannot deliver content to a departed view', async t => {
  const early = new AbortController(); early.abort(); let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => { calls++; throw new Error('must not run'); });
  await assert.rejects(loadVocabulary(early.signal), { name: 'AbortError' }); assert.equal(calls, 0);
  await assert.rejects(create(catalog, media, early.signal), { name: 'AbortError' });
  const late = new AbortController();
  t.mock.method(globalThis, 'fetch', async url => ({ ok: true, json: async () => {
    late.abort(); return url.pathname.endsWith('stage3-catalog.json') ? catalog : media;
  } }));
  await assert.rejects(loadVocabulary(late.signal), { name: 'AbortError' });
  const digest = new AbortController(), pending = create(catalog, media, digest.signal); digest.abort();
  await assert.rejects(pending, { name: 'AbortError' });
});

test('current textbook examples preserve exact Chinese, pinyin, Vietnamese and lesson sources without copying audio', async () => {
  const loaded = await createVocabularyContent(catalog, media, audioURL, undefined, textbook);
  const source = new Map(textbook.lessons.flatMap(lesson => [
    ...lesson.scenes.flatMap(scene => scene.lines.map(line => [line.id, { lesson: lesson.id, section: 'text', sourceId: scene.id, line }])),
    ...lesson.grammar.flatMap(grammar => grammar.examples.map((line, index) => [`${grammar.id}:example:${index + 1}`, { lesson: lesson.id, section: 'grammar', sourceId: grammar.id, line }])),
  ]));
  let covered = 0;
  for (const item of loaded.items) {
    const examples = loaded.examplesForSense(item.senseId); assert.ok(examples.length <= 3);
    if (examples.length) covered++;
    assert.equal(new Set(examples.map(example => JSON.stringify([example.zh, example.py, example.vi]))).size, examples.length);
    for (const example of examples) {
      const exact = source.get(example.id); assert.ok(exact, example.id);
      assert.deepEqual(example, { id: example.id, lesson: item.lesson, section: exact.section, sourceId: exact.sourceId,
        zh: exact.line.zh, py: exact.line.py, vi: exact.line.vn });
      assert.ok(example.zh.includes(item.zh)); assert.equal(example.lesson, exact.lesson);
      assert.equal('audio' in example, false); assert.ok(Object.isFrozen(example));
    }
    assert.ok(Object.isFrozen(examples));
  }
  assert.ok(covered > 250, `Expected broad source-backed coverage, got ${covered}`);
  assert.deepEqual(loaded.examplesForSense('unknown'), []);
  assert.deepEqual(loaded.examplesForSense('__proto__'), []);
  assert.deepEqual((await create()).examplesForSense(catalog.vocabulary[0].senseId), []);
});

test('every polysemous sense has a reviewed same-lesson example; homographs never share the wrong use', async () => {
  const loaded = await createVocabularyContent(catalog, media, audioURL, undefined, textbook);
  const groups = Object.groupBy(catalog.vocabulary, item => item.zh);
  for (const items of Object.values(groups).filter(items => items.length > 1)) for (const item of items) {
    assert.ok(loaded.examplesForSense(item.senseId).length > 0, `${item.zh}: ${item.vi}`);
  }
  const sentences = sense => loaded.examplesForSense(sense).map(example => example.zh).join('\n');
  assert.match(sentences('lex-7de8177ce7-s3'), /一家/); assert.doesNotMatch(sentences('lex-7de8177ce7-s3'), /在家里/);
  assert.match(sentences('lex-686b703f41-s3'), /在读大学|正在上课/); assert.doesNotMatch(sentences('lex-686b703f41-s3'), /超市后边/);
  assert.match(sentences('lex-c3304d1e49-s1'), /的天不太好/); assert.doesNotMatch(sentences('lex-c3304d1e49-s1'), /半天/);
  assert.match(sentences('lex-c3304d1e49-s2'), /半天/); assert.doesNotMatch(sentences('lex-c3304d1e49-s2'), /天不太好/);
  assert.match(sentences('lex-b967ce841a-s2'), /上火车/); assert.doesNotMatch(sentences('lex-b967ce841a-s2'), /上中学|上小学/);
  assert.match(sentences('lex-b967ce841a-s3'), /上中学|上小学/); assert.doesNotMatch(sentences('lex-b967ce841a-s3'), /上火车/);
  assert.match(sentences('lex-a5933e2a9e-s2'), /看了|买了/); assert.doesNotMatch(sentences('lex-a5933e2a9e-s2'), /都会写了/);
});

test('examples reject another baseline and unverified text; asynchronous reads do not expose caller mutations', async () => {
  const wrong = structuredClone(textbook); wrong.baseline = '1'.repeat(40);
  await assert.rejects(createVocabularyContent(catalog, media, audioURL, undefined, wrong), /cùng phiên bản/);
  const changed = structuredClone(textbook); changed.lessons[0].scenes[0].lines[0].vn += ' changed';
  await assert.rejects(createVocabularyContent(catalog, media, audioURL, undefined, changed), /Dấu kiểm tra/);
  const source = structuredClone(textbook), pending = createVocabularyContent(catalog, media, audioURL, undefined, source);
  source.lessons[0].scenes[0].lines[0].zh = '改'; source.baseline = '1'.repeat(40);
  const stable = await pending; assert.ok(stable.examplesForSense(catalog.vocabulary.find(item => item.zh === '你好').senseId).every(example => example.zh.includes('你好')));
});
