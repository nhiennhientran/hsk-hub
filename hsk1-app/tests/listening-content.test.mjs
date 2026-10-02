import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createListeningContent, loadListening } from '../src/services/content/listening.ts';

const json = file => JSON.parse(readFileSync(new URL(`../content/${file}.json`, import.meta.url), 'utf8'));
const catalog = json('stage3-catalog'); const media = json('media-references');
const audioURL = id => `https://course.example/hsk-hub/hsk1/course-assets/audio/${id}.mp3`;
const create = (c = catalog, m = media, signal) => createListeningContent(c, m, audioURL, signal);
const canonical = value => Array.isArray(value) ? `[${value.map(canonical).join(',')}]`
  : value && typeof value === 'object' ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}` : JSON.stringify(value);
const rehash = value => {
  const { fingerprint: ignored, ...data } = value;
  value.fingerprint = createHash('sha256').update(canonical(data)).digest('hex');
};

test('listening content preserves the sole catalog, exactly 75 unique original questions and 15 × 5 quotas', async () => {
  const loaded = await create();
  assert.deepEqual(loaded.catalog, catalog);
  assert.deepEqual(loaded.lessons, catalog.lessons);
  assert.equal(loaded.items, loaded.catalog.listening);
  assert.equal(loaded.items.length, 75); assert.equal(new Set(loaded.items.map(q => q.id)).size, 75);
  for (let lesson = 1; lesson <= 15; lesson++) {
    assert.deepEqual(loaded.items.filter(q => q.lesson === lesson).map(q => q.id),
      Array.from({ length: 5 }, (_, index) => `l${String(lesson).padStart(2, '0')}-listen-0${index + 1}`));
  }
  for (const question of loaded.items) {
    assert.equal(question.options.length, 4); assert.equal(question.optionFeedback.length, 4);
    assert.ok(question.answer >= 0 && question.answer < 4);
    assert.ok(question.transcript.every(line => line.zh && line.py && line.vi));
    assert.ok(question.source.printPages.every((page, index) => question.source.pdfPages[index] === page + 15));
    const { fingerprint, ...data } = question;
    assert.equal(fingerprint, createHash('sha256').update(canonical(data)).digest('hex'), question.id);
  }
});

test('all 75 audio requests use exact declared original tracks and ranges, never clip duration or base64 media packs', async () => {
  const loaded = await create();
  for (const question of loaded.items) {
    const clip = media.clips.find(item => item.id === question.id);
    const track = media.originalTracks.find(item => item.id === question.audio.track);
    const request = loaded.resolveAudio(question.id);
    assert.deepEqual(question.audio, clip.audio, question.id);
    assert.equal(track.lesson, question.lesson);
    assert.equal(track.path, `new-hsk1/hsk1/audio/${question.audio.track}.mp3`);
    assert.deepEqual(request, { url: audioURL(question.audio.track), start: question.audio.start, end: question.audio.end,
      label: `Bài ${question.lesson} · Câu ${Number(question.id.slice(-2))}`, sourceKind: 'segment' });
    assert.ok(request.end <= track.duration_s);
    assert.ok(!request.url.includes('stage3/media/')); assert.ok(!request.url.startsWith('data:'));
    // MP3 padding in old embedded clips must not replace annotated original boundaries.
    assert.notEqual(request.end - request.start, clip.duration, question.id);
    for (const line of question.transcript) assert.ok(!request.label.includes(line.zh), question.id);
  }
  assert.equal(loaded.resolveAudio('l01-listen-06'), null);
  assert.equal(loaded.resolveAudio('constructor'), null);
  assert.equal(loaded.resolveAudio('v-l01-lex-bbc044d7ea-s1'), null);
});

test('missing, duplicated or misplaced questions and malformed choices, feedback or transcript fail the whole load', async () => {
  const mutations = [
    c => { c.listening.pop(); }, c => { c.listening[1].id = c.listening[0].id; },
    c => { c.listening[0].id = 'l01-listen-06'; }, c => { c.listening[0].lesson = 2; },
    c => { c.listening[0].kind = 'tts'; }, c => { c.listening[0].options[1] = c.listening[0].options[0]; },
    c => { c.listening[0].options[1] = ` ${c.listening[0].options[0]} `; },
    c => { c.listening[0].answer = 4; }, c => { c.listening[0].answer = 0.5; },
    c => { c.listening[0].optionFeedback.pop(); }, c => { c.listening[0].optionFeedback[0] = ''; },
    c => { c.listening[0].transcript[0].py = ''; }, c => { c.listening[0].transcript = []; },
    c => { c.listening[0].keywords = []; }, c => { c.listening[0].promptVi = ''; },
    c => { c.listening[0].explanationVi = ''; }, c => { c.listening[0].fingerprint = 'invalid'; },
  ];
  for (const mutate of mutations) { const copy = structuredClone(catalog); mutate(copy); await assert.rejects(create(copy)); }
});

test('lesson and source provenance rejects duplicate lessons, page offset drift, absent sections and mixed baselines', async () => {
  const mutations = [
    c => { c.lessons.pop(); }, c => { c.lessons[1].id = c.lessons[0].id; },
    c => { c.listening[0].source.pdfPages[0]++; }, c => { c.listening[0].source.printPages[0] = 0; },
    c => { c.listening[0].source.section = ''; },
    c => { c.listening[0].source.printPages = []; c.listening[0].source.pdfPages = []; },
  ];
  for (const mutate of mutations) { const copy = structuredClone(catalog); mutate(copy); await assert.rejects(create(copy)); }
  const copy = structuredClone(catalog); copy.baseline = 'f'.repeat(40);
  await assert.rejects(create(copy), /cùng phiên bản/);
});

test('missing, duplicate, orphan or different media identities cannot silently choose substitute audio', async () => {
  const mutations = [
    m => { m.clips = m.clips.filter(clip => clip.id !== catalog.listening[0].id); },
    m => { m.clips.push(structuredClone(m.clips[0])); },
    m => { const extra = structuredClone(m.clips[0]); extra.id = 'l01-listen-06'; m.clips.push(extra); },
    m => { m.clips[0].lesson = 2; }, m => { m.clips[0].audio.track = '1-2'; },
    m => { m.clips[0].audio.start += 0.001; }, m => { m.clips[0].audio.end += 0.001; },
    m => { m.clips[0].audio.timingBasis = 'invented'; },
    m => { m.clips[0].mediaFile = 'new-hsk1/hsk1/stage3/media/lesson-02.js'; },
    m => { m.originalTracks[0].path = '../../substitute.mp3'; },
  ];
  for (const mutate of mutations) { const copy = structuredClone(media); mutate(copy); await assert.rejects(create(catalog, copy)); }
  const foreign = structuredClone(catalog); const m = structuredClone(media);
  foreign.listening[0].audio = structuredClone(catalog.listening.find(q => q.lesson === 2).audio);
  m.clips[0].audio = structuredClone(foreign.listening[0].audio);
  await assert.rejects(create(foreign, m), /tệp gốc/);
});

test('range validation rejects negative, equal, nonfinite and beyond-track boundaries without clamping', async () => {
  for (const mutate of [
    q => { q.audio.start = -1; }, q => { q.audio.end = q.audio.start; },
    q => { q.audio.end = Infinity; }, q => { q.audio.start = NaN; },
    q => { q.audio.end = media.originalTracks.find(track => track.id === q.audio.track).duration_s + 0.001; },
  ]) {
    const c = structuredClone(catalog); const m = structuredClone(media); mutate(c.listening[0]);
    m.clips[0].audio = structuredClone(c.listening[0].audio);
    await assert.rejects(create(c, m));
  }
});

test('actual SHA256 verification detects valid-shaped question, clip and original metadata drift', async () => {
  for (const mutate of [
    c => { c.listening[0].options[0] += ' changed'; }, c => { c.listening[0].answer = 1; },
    c => { c.listening[0].explanationVi += ' changed'; }, c => { c.listening[0].transcript[0].zh += '变'; },
    c => { c.listening[0].source.section += ' changed'; },
  ]) { const copy = structuredClone(catalog); mutate(copy); await assert.rejects(create(copy), /Dấu kiểm tra/); }
  const clip = structuredClone(media); clip.clips[0].sha256 = 'f'.repeat(64);
  await assert.rejects(create(catalog, clip), /Dấu kiểm tra/);
  const track = structuredClone(media); track.originalTracks.find(t => t.id === catalog.listening[0].audio.track).duration_s += 0.01;
  await assert.rejects(create(catalog, track), /Dấu kiểm tra/);
  // A consistently re-fingerprinted data edit is accepted: content remains the editable source.
  const edited = structuredClone(catalog); edited.listening[0].explanationVi += ' Ghi chú.'; rehash(edited.listening[0]);
  assert.equal((await create(edited)).items[0].explanationVi, edited.listening[0].explanationVi);
});

test('loaded content is deeply readonly, isolates caller mutations and never alters inputs', async () => {
  const c = structuredClone(catalog); const m = structuredClone(media); const before = JSON.stringify([c, m]);
  const loaded = await create(c, m);
  assert.equal(JSON.stringify([c, m]), before);
  c.listening[0].answer = 3; c.listening[0].audio.end = 999; c.vocabulary[0].vi = 'changed';
  assert.equal(loaded.items[0].answer, catalog.listening[0].answer);
  assert.equal(loaded.resolveAudio(loaded.items[0].id).end, catalog.listening[0].audio.end);
  assert.equal(loaded.catalog.vocabulary[0].vi, catalog.vocabulary[0].vi);
  assert.throws(() => { loaded.items[0].options[0] = 'changed'; }, TypeError);
  assert.throws(() => { loaded.resolveAudio(loaded.items[0].id).end = 99; }, TypeError);
  const during = structuredClone(catalog); const pending = create(during);
  during.listening[0].answer = 3; during.listening[0].audio.end = 999;
  const stable = await pending;
  assert.equal(stable.items[0].answer, catalog.listening[0].answer);
  assert.equal(stable.resolveAudio(stable.items[0].id).end, catalog.listening[0].audio.end);
});

test('loader fetches only the two established content files with the view signal and reports HTTP failure', async t => {
  const seen = []; const controller = new AbortController();
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    seen.push({ path: url.pathname, signal: options.signal });
    return { ok: true, json: async () => url.pathname.endsWith('stage3-catalog.json') ? catalog : media };
  });
  const loaded = await loadListening(controller.signal);
  assert.equal(loaded.items.length, 75);
  assert.deepEqual(seen.map(entry => entry.path.split('/').at(-1)), ['stage3-catalog.json', 'media-references.json']);
  assert.ok(seen.every(entry => entry.signal === controller.signal));
  t.mock.method(globalThis, 'fetch', async () => ({ ok: false, status: 503 }));
  await assert.rejects(loadListening(controller.signal), /HTTP 503/);
});

test('pre-aborted, late JSON and in-flight fingerprint work never return content for a departed module', async t => {
  const early = new AbortController(); early.abort();
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => { calls++; throw new Error('fetch should not run'); });
  await assert.rejects(loadListening(early.signal), { name: 'AbortError' }); assert.equal(calls, 0);
  await assert.rejects(create(catalog, media, early.signal), { name: 'AbortError' });
  const late = new AbortController();
  t.mock.method(globalThis, 'fetch', async url => ({ ok: true, json: async () => {
    late.abort(); return url.pathname.endsWith('stage3-catalog.json') ? catalog : media;
  } }));
  await assert.rejects(loadListening(late.signal), { name: 'AbortError' });
  const digest = new AbortController(); const pending = create(catalog, media, digest.signal); digest.abort();
  await assert.rejects(pending, { name: 'AbortError' });
});
