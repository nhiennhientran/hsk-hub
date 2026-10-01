'use strict';
// Stage 3 is an independent review page. This builds local artifacts; it does not deploy production.
// Usage: node tools/build-stage3.cjs [output-directory] [--catalog-only]
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const APP = path.join(ROOT, 'new-hsk1/hsk1/stage3');
const VERSION = 'stage3-20261001';
const SUFFIXES = ['01-05', '06-10', '11-15'];
const DATA_FILES = ['listening', 'vocabulary'].flatMap(kind => SUFFIXES.map(suffix => `data/${kind}-${suffix}.json`));
const COUNT = Object.freeze({lessons:15, listeningQuestions:75, vocabularyRecords:344, vocabularySenses:344,
  distinctWordForms:319, lessonIndexOccurrences:342, vocabularyAudioRecords:330, vocabularyWithoutAudio:14, mediaClips:405});
const digest = data => crypto.createHash('sha256').update(data).digest('hex');
const presentText = value => typeof value === 'string' && value.trim().length > 0;
const record = value => value && typeof value === 'object' && !Array.isArray(value);
const idOkay = value => typeof value === 'string' && /^[a-z0-9][a-z0-9-]*$/.test(value);
const shaOkay = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const hasChinese = value => /[\u3400-\u9fff]/u.test(value);
const range = (first, last) => Array.from({length:last-first+1}, (_, i) => first+i);

function validateCatalog(listening, vocabulary, courseMap) {
  assert.ok(Array.isArray(listening) && Array.isArray(vocabulary), 'Both catalog collections must be arrays.');
  assert.equal(listening.length, COUNT.listeningQuestions, 'Expected 75 listening questions.');
  assert.equal(vocabulary.length, COUNT.vocabularyRecords, 'Expected 344 vocabulary sense records.');
  assert.deepEqual(courseMap.lessons.map(l => l.id), range(1, 15), 'Expected 15 verified textbook lessons.');
  const lessonMap = new Map(courseMap.lessons.map(l => [l.id, l]));
  const occurrences = new Map(), expectedSenses = new Set();
  const poly = new Map(courseMap.repeated_or_polysemous_terms.map(t => [t.entry_id, t]));
  for (const lesson of courseMap.lessons) for (const entry of lesson.vocabulary) {
    const key = `${lesson.id}:${entry.entry_id}`;
    assert.ok(!occurrences.has(key), `Duplicate course-map occurrence: ${key}`);
    occurrences.set(key, {lesson, entry});
    const term = poly.get(entry.entry_id);
    const senses = term ? term.senses.map((sense, i) => ({...sense, number:i+1})).filter(sense => sense.lesson === lesson.id) : [{number:1}];
    assert.ok(senses.length, `Course-map sense missing: ${key}`);
    for (const sense of senses) expectedSenses.add(`${lesson.id}:${entry.entry_id}-s${sense.number}`);
  }
  assert.equal(occurrences.size, COUNT.lessonIndexOccurrences, 'Expected 342 textbook lesson-word occurrences.');
  assert.equal(expectedSenses.size, COUNT.vocabularySenses, 'Expected 344 textbook lesson-sense occurrences.');
  const allIds = new Set(), actualOccurrences = new Set(), actualSenses = new Set(), senseIds = new Set();
  const checkId = item => {
    assert.ok(record(item) && idOkay(item.id), 'Missing or malformed catalog ID.');
    assert.ok(!allIds.has(item.id), `Duplicate catalog ID: ${item.id}`); allIds.add(item.id);
    assert.ok(Number.isInteger(item.lesson) && lessonMap.has(item.lesson), `Invalid lesson: ${item.id}`);
  };
  const checkSource = item => {
    const source = item.source, lesson = lessonMap.get(item.lesson);
    assert.ok(record(source) && presentText(source.section), `Missing source section: ${item.id}`);
    assert.ok(Array.isArray(source.printPages) && source.printPages.length && Array.isArray(source.pdfPages), `Missing source pages: ${item.id}`);
    assert.equal(new Set(source.printPages).size, source.printPages.length, `Duplicate source page: ${item.id}`);
    assert.ok(source.printPages.every(n => Number.isInteger(n) && n >= lesson.source.printed_pages[0] && n <= lesson.source.printed_pages.at(-1)), `Source outside lesson pages: ${item.id}`);
    assert.deepEqual(source.pdfPages, source.printPages.map(n => n + 15), `PDF page must equal printed page + 15: ${item.id}`);
  };
  const checkAudio = item => {
    const a = item.audio;
    assert.ok(record(a) && new RegExp(`^${item.lesson}-[1-6]$`).test(a.track), `Wrong or borrowed audio track: ${item.id}`);
    assert.ok(Number.isFinite(a.start) && Number.isFinite(a.end) && a.start >= 0 && a.end > a.start, `Invalid audio interval: ${item.id}`);
    assert.ok(presentText(a.timingBasis), `Missing timing basis: ${item.id}`);
  };
  for (const q of listening) {
    checkId(q); checkSource(q); checkAudio(q);
    assert.match(q.id, new RegExp(`^l${String(q.lesson).padStart(2, '0')}-listen-0[1-5]$`), `Unexpected listening ID: ${q.id}`);
    assert.ok(['word', 'sentence', 'dialogue'].includes(q.kind), `Invalid listening kind: ${q.id}`);
    assert.ok(presentText(q.promptVi) && !hasChinese(q.promptVi), `Listening prompt must be Vietnamese: ${q.id}`);
    assert.ok(Array.isArray(q.options) && q.options.length === 4 && q.options.every(v => presentText(v) && !hasChinese(v)), `Need four Vietnamese options: ${q.id}`);
    assert.equal(new Set(q.options.map(x => x.trim().normalize('NFC'))).size, 4, `Duplicate options: ${q.id}`);
    assert.ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4, `Invalid answer index: ${q.id}`);
    assert.ok(Array.isArray(q.transcript) && q.transcript.length && q.transcript.every(line => record(line) && ['zh', 'py', 'vi'].every(k => presentText(line[k]))), `Missing transcript: ${q.id}`);
    assert.ok(presentText(q.explanationVi) && presentText(q.skill), `Missing explanation or skill: ${q.id}`);
    assert.ok(Array.isArray(q.optionFeedback) && q.optionFeedback.length === 4 && q.optionFeedback.every(presentText), `Need four feedback entries: ${q.id}`);
    assert.ok(Array.isArray(q.keywords) && q.keywords.length && q.keywords.every(word => record(word) && ['zh', 'py', 'vi'].every(k => presentText(word[k]))), `Missing keywords: ${q.id}`);
  }
  for (const lesson of range(1, 15)) assert.equal(listening.filter(q => q.lesson === lesson).length, 5, `Lesson ${lesson} needs five listening questions.`);
  for (const item of vocabulary) {
    checkId(item); checkSource(item);
    assert.ok(idOkay(item.lexId) && idOkay(item.senseId), `Invalid vocabulary identity: ${item.id}`);
    const occurrence = `${item.lesson}:${item.lexId}`, expected = occurrences.get(occurrence);
    assert.ok(expected, `Word is absent from the textbook lesson index: ${item.id}`);
    assert.equal(item.zh, expected.entry.zh, `Word differs from course-map entry: ${item.id}`);
    assert.equal(item.category, expected.entry.category, `Incorrect textbook category: ${item.id}`);
    assert.equal(item.extension, expected.entry.is_textbook_extension, `Incorrect extension flag: ${item.id}`);
    assert.ok(['py', 'vi', 'senseZh'].every(k => presentText(item[k])), `Missing vocabulary text: ${item.id}`);
    assert.ok(!hasChinese(item.vi), `Vietnamese card face reveals target Chinese: ${item.id}`);
    assert.ok(item.cueZh === undefined || presentText(item.cueZh), `Invalid context cue: ${item.id}`);
    assert.equal(item.id, `v-l${String(item.lesson).padStart(2, '0')}-${item.senseId}`, `Vocabulary ID must retain lesson and stable sense: ${item.id}`);
    const senseKey = `${item.lesson}:${item.senseId}`;
    assert.ok(expectedSenses.has(senseKey), `Incorrect textbook sense number: ${item.id}`);
    assert.ok(!actualSenses.has(senseKey), `Repeated lesson-sense record: ${item.id}`);
    actualSenses.add(senseKey); actualOccurrences.add(occurrence); senseIds.add(item.senseId);
    if (item.audio === null) {
      assert.equal(item.lesson, 4, `Missing audio is reserved for the lesson 4 numeral table: ${item.id}`);
      assert.ok(expected.entry.textbook_locations.every(loc => loc.track_id === null), `A word with a recorded vocabulary row cannot silently lose audio: ${item.id}`);
    } else checkAudio(item);
  }
  assert.deepEqual([...actualOccurrences].sort(), [...occurrences.keys()].sort(), 'Missing textbook word occurrences.');
  assert.deepEqual([...actualSenses].sort(), [...expectedSenses].sort(), 'Missing textbook sense records.');
  assert.equal(senseIds.size, COUNT.vocabularySenses, 'Expected 344 distinct stable senses.');
  assert.equal(new Set(vocabulary.map(v => v.zh.normalize('NFC'))).size, COUNT.distinctWordForms, 'Expected 319 distinct word forms.');
  assert.equal(vocabulary.filter(v => v.audio !== null).length, COUNT.vocabularyAudioRecords, 'Expected 330 vocabulary records with audio.');
  assert.equal(vocabulary.filter(v => v.audio === null).length, COUNT.vocabularyWithoutAudio, 'Expected 14 numeral cards without a standalone recording.');
  assert.equal(vocabulary.filter(v => v.category === 'proper_noun').length, 12, 'Expected 12 textbook proper nouns.');
  assert.equal(vocabulary.filter(v => v.extension).length, 8, 'Expected eight textbook extension words.');
  return {version:VERSION, lessons:courseMap.lessons.map(l => ({id:l.id, title:l.title})), listening, vocabulary};
}

function catalogSource(catalog) {
  const json = JSON.stringify(catalog, null, 2).replace(/[<\u2028\u2029]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
  return `/* Generated from six reviewed Stage 3 JSON files. Independent review catalog. */\n(function(root,factory){'use strict';const catalog=factory();if(typeof module==='object'&&module.exports)module.exports=catalog;if(root)root.HSKStep3Catalog=catalog;})(typeof window==='object'?window:null,function(){'use strict';return ${json};});\n`;
}

function main(args = process.argv.slice(2)) {
  if (args.includes('--help')) { console.log('Usage: node tools/build-stage3.cjs [output-directory] [--catalog-only]\nBuild an independent Stage 3 review page; no production deployment.'); return; }
  assert.ok(args.every(arg => !arg.startsWith('--') || arg === '--catalog-only'), 'Unknown build flag.');
  const positional = args.filter(arg => !arg.startsWith('--'));
  assert.ok(positional.length <= 1, 'Provide at most one output directory.');
  const output = positional.length ? path.resolve(positional[0]) : path.join(ROOT, 'dist/stage3');
  const inputs = new Map();
  const read = filename => {
    const absolute = path.resolve(filename), raw = fs.readFileSync(absolute);
    if (!inputs.has(absolute)) inputs.set(absolute, {file:path.relative(ROOT, absolute).split(path.sep).join('/'), bytes:raw.length, sha256:digest(raw)});
    return raw;
  };
  const readText = filename => read(filename).toString('utf8');
  const loaded = new Map(DATA_FILES.map(file => {
    const rows = JSON.parse(readText(path.join(APP, file)));
    assert.ok(Array.isArray(rows), `Data file must be an array: ${file}`);
    const [, first, last] = file.match(/-(\d+)-(\d+)\.json$/);
    assert.ok(rows.every(row => row.lesson >= Number(first) && row.lesson <= Number(last)), `Wrong lesson in data partition: ${file}`);
    if (file.includes('listening')) assert.equal(rows.length, 25, `Listening partition must have 25 questions: ${file}`);
    return [file, rows];
  }));
  const courseMap = JSON.parse(readText(path.join(ROOT, 'docs/stage1/course-map.json')));
  const listening = SUFFIXES.flatMap(suffix => loaded.get(`data/listening-${suffix}.json`));
  const vocabulary = SUFFIXES.flatMap(suffix => loaded.get(`data/vocabulary-${suffix}.json`));
  const catalog = validateCatalog(listening, vocabulary, courseMap), generatedCatalog = catalogSource(catalog);
  // Parse the generated CommonJS form before writing it, without executing any UI code.
  const catalogContext = {module:{exports:{}}, window:{}};
  vm.runInNewContext(generatedCatalog, catalogContext, {timeout:3000, filename:'catalog.js'});
  assert.equal(catalogContext.module.exports.listening.length, 75);
  assert.equal(catalogContext.window.HSKStep3Catalog.vocabulary.length, 344);
  if (args.includes('--catalog-only')) {
    fs.writeFileSync(path.join(APP, 'catalog.js'), generatedCatalog);
    console.log(JSON.stringify({mode:'catalog-only', purpose:'Independent Stage 3 review; no production deployment', ...COUNT,
      file:path.join(APP, 'catalog.js'), bytes:Buffer.byteLength(generatedCatalog), sha256:digest(generatedCatalog)}));
    return;
  }

  const manifestPath = path.join(APP, 'media-manifest.json');
  const mediaManifest = JSON.parse(readText(manifestPath));
  assert.equal(mediaManifest.listeningCount, 75, 'Build the complete listening media first.');
  assert.equal(mediaManifest.vocabularyAudioRecords, 330, 'Build the complete vocabulary media first.');
  assert.ok(Array.isArray(mediaManifest.clips) && mediaManifest.clips.length === 405, 'Expected 405 decoded standalone clips.');
  const mediaSource = new Map(mediaManifest.sourceData.map(item => [item.file, item.sha256]));
  for (const file of DATA_FILES) {
    const absolute = path.join(APP, file), input = inputs.get(absolute);
    assert.equal(mediaSource.get(input.file), input.sha256, `Media was built from stale data: ${input.file}. Rebuild media with tools/build-stage3-media.py after content review.`);
  }
  const mediaIndexText = readText(path.join(APP, 'media-index.js'));
  const mediaContext = {window:{}};
  vm.runInNewContext(mediaIndexText, mediaContext, {timeout:3000, filename:'media-index.js'});
  const mediaIndex = mediaContext.window.HSKStep3MediaIndex;
  assert.ok(record(mediaIndex) && record(mediaIndex.clips), 'Missing generated media index.');
  const mediaFiles = range(1, 15).map(n => `media/lesson-${String(n).padStart(2, '0')}.js`);
  const bundles = mediaFiles.map(file => ({file, text:readText(path.join(APP, file))}));
  for (const bundle of bundles) vm.runInNewContext(bundle.text, mediaContext, {timeout:3000, filename:bundle.file});
  const media = mediaContext.window.HSKStep3Media;
  assert.ok(record(media), 'Missing decoded media bundles.');
  const rowsWithAudio = [...listening, ...vocabulary.filter(v => v.audio !== null)];
  const expectedMediaIds = rowsWithAudio.map(row => row.id).sort();
  const clipById = new Map(mediaManifest.clips.map(clip => [clip.id, clip]));
  assert.equal(clipById.size, COUNT.mediaClips, 'Duplicate manifest clip ID.');
  assert.deepEqual([...clipById.keys()].sort(), expectedMediaIds, 'Media manifest ID set differs from the catalog.');
  assert.deepEqual(Object.keys(mediaIndex.clips).sort(), expectedMediaIds, 'Media index ID set differs from the catalog.');
  assert.deepEqual(Object.keys(media).sort(), expectedMediaIds, 'Media bundles ID set differs from the catalog.');
  const checkedBlobs = new Map();
  for (const row of rowsWithAudio) {
    const clip = clipById.get(row.id), index = mediaIndex.clips[row.id], uri = media[row.id];
    assert.equal(clip.lesson, row.lesson, `Wrong media lesson: ${row.id}`);
    assert.equal(clip.track, row.audio.track, `Wrong source track: ${row.id}`);
    assert.equal(clip.start, row.audio.start, `Stale media start: ${row.id}`);
    assert.equal(clip.end, row.audio.end, `Stale media end: ${row.id}`);
    assert.equal(clip.timingBasis, row.audio.timingBasis, `Stale timing review metadata: ${row.id}`);
    assert.ok(Number.isFinite(clip.duration) && clip.duration > 0 && shaOkay(clip.sha256), `Invalid media metadata: ${row.id}`);
    for (const key of ['lesson', 'duration', 'sha256', 'bytes']) assert.equal(index[key], clip[key], `Media index disagrees on ${key}: ${row.id}`);
    assert.ok(typeof uri === 'string' && uri.startsWith('data:audio/mpeg;base64,'), `Audio is not embedded: ${row.id}`);
    if (!checkedBlobs.has(uri)) {
      const encoded = uri.slice('data:audio/mpeg;base64,'.length), raw = Buffer.from(encoded, 'base64');
      assert.equal(raw.toString('base64'), encoded, `Invalid base64 audio: ${row.id}`);
      checkedBlobs.set(uri, {bytes:raw.length, sha256:digest(raw)});
    }
    const blob = checkedBlobs.get(uri);
    assert.equal(blob.bytes, clip.bytes, `Audio byte count differs: ${row.id}`);
    assert.equal(blob.sha256, clip.sha256, `Audio hash differs: ${row.id}`);
  }

  let html = readText(path.join(APP, 'index.html'));
  const replaceOnce = (needle, replacement) => {
    assert.equal(html.split(needle).length - 1, 1, `Expected exactly one HTML asset reference: ${needle}`);
    html = html.replace(needle, () => replacement);
  };
  for (const href of ['../learning.css', 'styles.css']) {
    const css = readText(path.resolve(APP, href)).replace(/^\s*@charset[^;]+;/, '');
    assert.ok(!/<\/style/i.test(css) && !/@import\b/i.test(css), `Unsupported inline stylesheet: ${href}`);
    for (const match of css.matchAll(/url\(\s*['"]?([^)'"\s]+)["']?\s*\)/gi)) assert.ok(/^(?:data:|#)/i.test(match[1]), `Offline CSS refers to an external asset: ${href}`);
    replaceOnce(`<link rel="stylesheet" href="${href}">`, `<style data-stage3-file="${href}">\n${css}\n</style>`);
  }
  const inline = (file, js) => {
    assert.ok(!/<\/script/i.test(js), `Unsafe inline closing tag in ${file}`);
    return `<script data-stage3-file="${file}">\n${js}\n</script>`;
  };
  replaceOnce('<script src="catalog.js"></script>', inline('catalog.js', generatedCatalog));
  replaceOnce('<script src="media-index.js"></script>', inline('media-index.js', mediaIndexText) + '\n' + bundles.map(b => inline(b.file, b.text)).join('\n'));
  for (const file of ['engine.js', 'player.js', 'app.js']) replaceOnce(`<script src="${file}"></script>`, inline(file, readText(path.join(APP, file))));
  assert.ok(!/<script\b[^>]*\ssrc\s*=|<link\b[^>]*\brel\s*=\s*["']stylesheet/i.test(html), 'Offline page still has external script or stylesheet references.');
  for (const match of html.matchAll(/<(?:link|img|audio|video|source|iframe|object|embed)\b[^>]*\s(?:src|href|data|poster)\s*=\s*["']([^"']+)["']/gi)) {
    assert.ok(/^(?:data:|#)/i.test(match[1]), `Offline page still refers to an external asset: ${match[1]}`);
  }
  html = html.replace('<!doctype html>', '<!doctype html>\n<!-- Independent Stage 3 review build; no production deployment. -->');
  for (const [absolute, input] of inputs) assert.equal(digest(fs.readFileSync(absolute)), input.sha256, `Source changed during the build: ${input.file}. Run again after review edits finish.`);
  fs.mkdirSync(output, {recursive:true});
  fs.writeFileSync(path.join(APP, 'catalog.js'), generatedCatalog);
  const studentFile = 'HSK1-Step3-Listening-Vocabulary.html', target = path.join(output, studentFile);
  fs.writeFileSync(target, html);
  const buildManifest = {version:VERSION, purpose:'Independent Stage 3 listening and vocabulary review; no production deployment',
    ...COUNT, studentFile, bytes:Buffer.byteLength(html), sha256:digest(html),
    catalog:{file:'new-hsk1/hsk1/stage3/catalog.js', bytes:Buffer.byteLength(generatedCatalog), sha256:digest(generatedCatalog)},
    media:{bundles:15, clips:COUNT.mediaClips, uniqueEmbeddedAudioBlobs:checkedBlobs.size,
      manifestSha256:inputs.get(manifestPath).sha256, allAudioEmbedded:true},
    sources:[...inputs.values()]};
  fs.writeFileSync(path.join(output, 'build-manifest.json'), JSON.stringify(buildManifest, null, 2) + '\n');
  console.log(JSON.stringify({file:target, ...buildManifest}));
}
if (require.main === module) main();
module.exports = {validateCatalog, catalogSource, main, COUNT};
