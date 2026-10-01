import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createTextbookContent, validateTextbook } from '../src/services/content/textbook.ts';

const json = file => JSON.parse(readFileSync(new URL(`../content/${file}.json`, import.meta.url), 'utf8'));
const book = json('textbook'); const media = json('media-references'); const catalog = json('stage3-catalog');
const course = createTextbookContent(book, media, catalog, id => `https://course.example/course-assets/audio/${id}.mp3`);
const create = (b = book, m = media, c = catalog) => createTextbookContent(b, m, c);

test('frozen textbook keeps 15 lessons, 342 rows, 45 scenes and 40 grammar plus 3 phonetics', () => {
  assert.deepEqual(course.lessons, book.lessons);
  assert.deepEqual(course.lessons.map(lesson => lesson.id), Array.from({ length: 15 }, (_, i) => i + 1));
  const count = field => course.lessons.reduce((sum, lesson) => sum + lesson[field].length, 0);
  assert.equal(count('vocab'), 342); assert.equal(count('scenes'), 45);
  assert.equal(count('grammar'), 40); assert.equal(count('phonetics'), 3);
  assert.equal(course.lessons[0].phonetics.length, 3);
  for (const lesson of course.lessons) {
    assert.ok(lesson.hanzi.chars); assert.equal(lesson.xiaoyuTips.length, 2);
    for (const word of lesson.vocab) assert.ok(word.posLabel && word.py && word.vn);
    for (const scene of lesson.scenes) for (const line of scene.lines) assert.ok(line.s && line.py && line.vn);
  }
});

test('all 344 declared senses resolve exact catalog audio and provenance without merging 342 rows', () => {
  let senses = 0; let playable = 0; let missing = 0;
  for (const lesson of course.lessons) for (const word of lesson.vocab) {
    const entries = course.wordSenses(lesson.id, word.id);
    assert.deepEqual(entries.map(entry => entry.catalogId), word.catalogIds);
    for (const entry of entries) {
      const original = catalog.vocabulary.find(item => item.id === entry.catalogId);
      assert.equal(entry.senseId, original.senseId); assert.equal(entry.senseZh, original.senseZh);
      assert.equal(entry.vi, original.vi); assert.equal(entry.py, original.py); senses++;
      const resolved = course.resolveWord(lesson.id, word.id, entry.catalogId);
      assert.deepEqual(resolved, entry.audio);
      if (!original.audio) { assert.equal(resolved.available, false); missing++; continue; }
      assert.equal(resolved.available, true); playable++;
      assert.equal(resolved.track.id, original.audio.track);
      assert.equal(resolved.track.lesson, lesson.id);
      assert.equal(resolved.request.start, original.audio.start); assert.equal(resolved.request.end, original.audio.end);
      assert.equal(resolved.request.sourceKind, 'segment');
      assert.equal(resolved.request.url, `https://course.example/course-assets/audio/${original.audio.track}.mp3`);
      assert.equal(resolved.track.path, `new-hsk1/hsk1/audio/${original.audio.track}.mp3`);
      assert.equal(resolved.track.sha256, media.originalTracks.find(track => track.id === original.audio.track).sha256);
    }
  }
  assert.equal(senses, 344); assert.equal(playable, 330); assert.equal(missing, 14);
});

test('14 unsupported lesson 4 words stay unavailable with accurate original-audio explanation', () => {
  const unavailable = course.lessons.flatMap(lesson => lesson.vocab.filter(word => !course.resolveWord(lesson.id, word.id).available)
    .map(word => ({ lesson: lesson.id, zh: word.zh })));
  assert.deepEqual(unavailable.sort((a, b) => a.zh.localeCompare(b.zh)), media.missingWordAudio.map(item => ({ lesson: item.lesson, zh: item.zh })).sort((a, b) => a.zh.localeCompare(b.zh)));
  for (const item of media.missingWordAudio) {
    const lesson = course.lessons.find(lesson => lesson.id === item.lesson);
    const word = lesson.vocab.find(word => word.catalogIds.includes(item.id));
    const audio = course.resolveWord(item.lesson, word.id);
    assert.match(audio.reason, /không thay bằng giọng máy/); assert.equal('request' in audio, false);
  }
});

test('multi-sense 天 and 上 retain separate declared clips while same-form 在 stays in its lesson', () => {
  for (const [lessonId, zh] of [[12, '天'], [14, '上']]) {
    const word = course.lessons[lessonId - 1].vocab.find(word => word.zh === zh);
    const entries = course.wordSenses(lessonId, word.id);
    assert.equal(entries.length, 2);
    assert.notEqual(entries[0].senseId, entries[1].senseId);
    assert.notEqual(entries[0].audio.track.id, entries[1].audio.track.id);
    assert.deepEqual(course.resolveWord(lessonId, word.id), entries[0].audio);
  }
  const zai = course.lessons.flatMap(lesson => lesson.vocab.filter(word => word.zh === '在').map(word => ({ lesson, word })));
  assert.equal(zai.length, 3);
  const entries = zai.map(({ lesson, word }) => course.wordSenses(lesson.id, word.id)[0]);
  assert.equal(new Set(entries.map(entry => entry.senseId)).size, 3);
  for (const { lesson, word } of zai) {
    assert.equal(course.resolveWord(lesson.id, word.id).track.lesson, lesson.id);
    const foreign = zai.find(item => item.lesson.id !== lesson.id);
    assert.equal(course.resolveWord(lesson.id, word.id, foreign.word.catalogIds[0]).available, false);
  }
});

test('all 45 whole scenes and every line use frozen original tracks and unmodified segment ranges', () => {
  let lines = 0; let scenes = 0;
  for (const lesson of course.lessons) for (const scene of lesson.scenes) {
    const whole = course.resolveScene(lesson.id, scene.id);
    assert.equal(whole.available, true); assert.equal(whole.track.id, scene.source.audioTrack);
    assert.equal(whole.request.sourceKind, 'original'); assert.equal(whole.request.start, undefined); assert.equal(whole.request.end, undefined);
    for (const [index, line] of scene.lines.entries()) {
      const resolved = course.resolveLine(lesson.id, scene.id, line.id);
      const range = media.textbookSegments.text[scene.source.audioTrack][index];
      assert.equal(resolved.available, true); assert.equal(resolved.track.id, whole.track.id);
      assert.deepEqual([resolved.request.start, resolved.request.end], range, line.id);
      assert.ok(resolved.request.end <= resolved.track.duration_s); lines++;
    }
    scenes++;
  }
  assert.equal(scenes, 45);
  assert.equal(lines, book.lessons.reduce((sum, lesson) => sum + lesson.scenes.reduce((sum, scene) => sum + scene.lines.length, 0), 0));
  // Original annotations intentionally overlap; do not trim or re-time them.
  const scene = course.lessons[2].scenes[0];
  assert.ok(course.resolveLine(3, scene.id, scene.lines[1].id).request.start < course.resolveLine(3, scene.id, scene.lines[0].id).request.end);
});

test('all lesson vocabulary playlists preserve three whole tracks and only lessons 1–3 have tongue tracks', () => {
  for (const lesson of course.lessons) {
    const requests = course.vocabPlaylist(lesson.id);
    assert.equal(requests.length, 3);
    assert.deepEqual(requests.map(request => request.url), [2, 4, 6].map(track => `https://course.example/course-assets/audio/${lesson.id}-${track}.mp3`));
    for (const request of requests) { assert.equal(request.sourceKind, 'original'); assert.equal(request.end, undefined); }
    const tongue = course.tongue(lesson.id);
    assert.equal(tongue.available, lesson.id <= 3);
    if (tongue.available) {
      assert.equal(tongue.track.id, `${lesson.id}-7`); assert.equal(tongue.track.kind, 'shadow');
      assert.equal(tongue.request.end, undefined); assert.equal(tongue.request.sourceKind, 'original');
    }
  }
});

test('foreign lesson IDs, scene/line IDs and unknown words never resolve arbitrary clips', () => {
  const word = course.lessons[0].vocab[0]; const scene = course.lessons[0].scenes[0];
  assert.equal(course.resolveWord(2, word.id).available, false); assert.equal(course.resolveWord(1, 'constructor').available, false);
  assert.equal(course.resolveScene(2, scene.id).available, false); assert.equal(course.resolveLine(1, scene.id, 'constructor').available, false);
  assert.equal(course.resolveLine(1, scene.id, course.lessons[0].scenes[1].lines[0].id).available, false);
  assert.deepEqual(course.vocabPlaylist(0), []); assert.deepEqual(course.wordSenses(1, 'missing'), []);
});

test('validation rejects missing or duplicate content, wrong phonetics placement and mixed baselines', () => {
  for (const mutate of [
    copy => { copy.lessons.pop(); }, copy => { copy.lessons[1].id = 1; },
    copy => { copy.lessons[0].vocab.pop(); }, copy => { copy.lessons[0].scenes[0].lines[0].py = ''; },
    copy => { copy.lessons[0].vocab[1].id = copy.lessons[0].vocab[0].id; },
    copy => { copy.lessons[1].phonetics = copy.lessons[0].phonetics; copy.lessons[0].phonetics = []; }
  ]) { const copy = structuredClone(book); mutate(copy); assert.throws(() => validateTextbook(copy)); }
  const copy = structuredClone(catalog); copy.baseline = 'f'.repeat(40);
  assert.throws(() => create(book, media, copy), /cùng phiên bản/);
});

test('invalid boundaries, source paths, swapped scenes and undeclared foreign audio fail instead of clamping', () => {
  for (const mutate of [
    copy => { copy.originalTracks[0].path = '../../wrong.mp3'; },
    copy => { copy.textbookSegments.text['1-1'][0][0] = -1; },
    copy => { copy.textbookSegments.text['1-1'][0][1] = 999; },
    copy => { copy.textbookSegments.text['1-1'][0][1] = copy.textbookSegments.text['1-1'][0][0]; },
    copy => { copy.originalTracks[0].scene = 2; }
  ]) { const copy = structuredClone(media); mutate(copy); assert.throws(() => create(book, copy)); }
  const wrongScene = structuredClone(book); wrongScene.lessons[0].scenes[0].source.audioTrack = '1-3';
  assert.throws(() => create(wrongScene), /hội thoại/);
  const foreignAudio = structuredClone(catalog);
  const zai = foreignAudio.vocabulary.find(word => word.lesson === 7 && word.zh === '在');
  zai.audio = { ...foreignAudio.vocabulary.find(word => word.lesson === 8 && word.zh === '在').audio };
  assert.throws(() => create(book, media, foreignAudio), /bài khác/);
});

test('wrong catalog identity, missing declaration and off-by-one word timing reject the complete load', () => {
  const identity = structuredClone(book); identity.lessons[0].vocab[0].catalogIds = [catalog.vocabulary[1].id];
  assert.throws(() => create(identity), /khớp hàng/);
  const unsupported = structuredClone(media); unsupported.textbookSegments.unsupported['4'].pop();
  assert.throws(() => create(book, unsupported), /thiếu âm thanh/);
  const timing = structuredClone(catalog); timing.vocabulary[0].audio.end -= 0.001;
  assert.throws(() => create(book, media, timing), /khớp đoạn/);
});

test('immutable loaded content is isolated from caller mutations and does not alter frozen inputs', () => {
  const b = structuredClone(book); const m = structuredClone(media); const c = structuredClone(catalog);
  const before = JSON.stringify([b, m, c]); const loaded = create(b, m, c);
  assert.equal(JSON.stringify([b, m, c]), before);
  b.lessons[0].vocab[0].zh = 'changed'; m.originalTracks[0].path = 'changed'; c.vocabulary[0].senseZh = 'changed';
  assert.equal(loaded.lessons[0].vocab[0].zh, '不客气');
  assert.equal(loaded.wordSenses(1, loaded.lessons[0].vocab[0].id)[0].senseZh, '回答感谢的客套话');
  assert.throws(() => { loaded.lessons[0].vocab[0].zh = 'changed'; }, TypeError);
});
