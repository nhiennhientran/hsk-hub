import assert from 'node:assert/strict';
import {readFileSync, mkdirSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {configs} from '../src/config.ts';
import {baselineViDisplayRevision, validateTrustedViRegistry, viBindingsForDocument} from '../src/official-vi-revisions.ts';
import {createOfficialViRegistry, hsk1ViFields, hsk1SourceViFiles} from '../../hsk1-app/src/services/content/official-vi-revisions.ts';
import {createTextbookContent} from '../../hsk1-app/src/services/content/textbook.ts';
import {grade} from '../src/state.ts';

const repo = resolve(import.meta.dirname, '../..');
const read = file => readFileSync(resolve(repo, file), 'utf8');
const json = file => JSON.parse(read(file));
const sha = value => createHash('sha256').update(value).digest('hex');
const pointer = (value, field) => field.slice(1).split('/').reduce((v, key) => v[key.replaceAll('~1', '/').replaceAll('~0', '~')], value);
const unchangedExcept = (oldValue, newValue, allowed, path = '') => {
  if (allowed.has(path)) {assert.equal(typeof newValue, 'string'); assert.ok(newValue.trim()); return;}
  if (oldValue === null || typeof oldValue !== 'object') {assert.deepEqual(newValue, oldValue, 'Sealed value changed: ' + path); return;}
  assert.equal(Array.isArray(newValue), Array.isArray(oldValue), path);
  assert.deepEqual(Object.keys(newValue), Object.keys(oldValue), 'Shape changed: ' + path);
  for (const key of Object.keys(oldValue)) unchangedExcept(oldValue[key], newValue[key], allowed, path + '/' + key.replaceAll('~', '~0').replaceAll('/', '~1'));
};
const summary = {schemaVersion: 1, status: 'passed', generatedAt: new Date().toISOString(), courses: [], lessons: 0, changes: 0, objectiveHomeworkChecks: 0, manualHomeworkChecks: 0, listeningChecks: 0};
const shared = json('course-app/content/official-vi-registry.json');
for (const level of [2, 3]) {
  const config = configs[level], entry = shared.courses[`hsk${level}`];
  assert.ok(entry, `HSK${level} official VI is inactive`);
  const manifestText = read(entry.manifestFile), reviewText = read(entry.reviewFile), manifest = JSON.parse(manifestText);
  const documents = manifest.baselineFiles.map(b => ({file: b.file, rawText: read(b.file)}));
  const registry = await validateTrustedViRegistry({courseId: config.id, parentDisplayRevision: baselineViDisplayRevision(config.id), manifestText, manifestSHA256: entry.manifestSHA256, reviewText, reviewSHA256: entry.reviewSHA256, reviewFile: entry.reviewFile, documents});
  let changed = 0;
  for (const document of documents) {
    const raw = JSON.parse(document.rawText), context = {baselineFile: document.file, sourceSHA256: sha(document.rawText)};
    const shown = /lesson-\d\d\.json$/.test(document.file) ? registry.projectLesson(raw, context) : /lexicon/.test(document.file) ? registry.projectLexicon(raw, context) : registry.projectCourseIndex(raw, context);
    const changes = manifest.changes.filter(c => c.baselineFile === document.file);
    unchangedExcept(raw, shown, new Set(changes.map(c => c.field)));
    for (const c of changes) assert.equal(pointer(shown, c.field), c.newValue, 'Accepted VI not projected: ' + c.changeId);
    changed += changes.length;
  }
  const registered = [];
  for (let number = 1; number <= config.count; number++) {
    const file = `course-app/content/hsk${level}/lesson-${String(number).padStart(2, '0')}.json`, rawText = read(file), raw = JSON.parse(rawText);
    const shown = registry.projectLesson(raw, {baselineFile: file, sourceSHA256: sha(rawText)});
    registered.push(...viBindingsForDocument(raw, file, config.id));
    assert.equal(shown.homework.length, 30);
    for (const [index, q] of shown.homework.entries()) {
      if (q.part === 'writing') {
        assert.equal(grade([q], {[q.id]: '人工书写核对'}, 1, {name: '', className: ''}).correct, null);
        assert.equal(q.answer, undefined); summary.manualHomeworkChecks++;
      } else {
        const current = grade([q], {[q.id]: q.answer}, 1, {name: '', className: ''});
        const original = grade([raw.homework[index]], {[q.id]: q.answer}, 1, {name: '', className: ''});
        assert.equal(current.correct, original.correct); assert.equal(current.correct, 1); summary.objectiveHomeworkChecks++;
      }
      if (q.options) assert.equal(q.options.length, 3);
    }
    for (const q of shown.listening) {assert.equal(q.options.length, 3); assert.equal(grade([q], {[q.id]: q.answer}, 1, {name: '', className: ''}).correct, 1); summary.listeningChecks++;}
  }
  assert.equal(changed, manifest.changes.length);
  summary.courses.push({level, lessons: config.count, revisionId: registry.revisionId, changed, registeredLessonFields: registered.length, manifestSHA256: entry.manifestSHA256, reviewSHA256: entry.reviewSHA256, originalAnswerOrderAndMediaPreserved: true});
  summary.lessons += config.count; summary.changes += changed;
}
const entry = json('hsk1-app/content/official-vi-registry.json').active;
assert.ok(entry, 'HSK1 official VI is inactive');
const manifestBytes = read('hsk1-app/' + entry.manifestFile), reviewBytes = read('hsk1-app/' + entry.reviewFile), manifest = JSON.parse(manifestBytes);
const files = ['textbook', 'textbook-display-revisions', 'stage2-bank', 'stage3-catalog', 'homework30-bank', 'course-index'].map(name => `content/${name}.json`).concat(hsk1SourceViFiles);
const values = Object.fromEntries(files.map(file => [file, json('hsk1-app/' + file)]));
const fields = hsk1ViFields(values);
const baselineFiles = manifest.baselineFiles.map(b => ({file: b.file, sha256: sha(read('hsk1-app/' + b.file))}));
const registry = await createOfficialViRegistry({manifestBytes, reviewBytes, manifestSHA256: entry.manifestSHA256, reviewSHA256: entry.reviewSHA256, reviewFile: entry.reviewFile, baselineFiles, parentDisplayRevision: values['content/textbook-display-revisions.json'].revision, fields: fields.filter(f => baselineFiles.some(b => b.file === f.baselineFile))});
const snapshot = registry.snapshot(manifest.changes.map(c => ({id: c.ownerId, component: c.component})));
assert.equal(snapshot.fields.length, manifest.changes.length);
for (const c of manifest.changes) {const f = fields.find(f => f.baselineFile === c.baselineFile && f.field === c.field && f.ownerId === c.ownerId && f.component === c.component); assert.ok(f); assert.ok(snapshot.fields.some(s => s.ownerId === f.ownerId && s.component === f.component && s.field === f.relativeField && s.value === c.newValue));}
const baselineRegistry = {revisionId: null, project: raw => raw, snapshot: () => null, displayVersion: (_owner, _component, original) => original};
const bookArgs = [values['content/textbook.json'], json('hsk1-app/content/media-references.json'), values['content/stage3-catalog.json'], undefined, values['content/textbook-display-revisions.json']];
const originalBook = createTextbookContent(...bookArgs, baselineRegistry), shownBook = createTextbookContent(...bookArgs, registry);
assert.equal(shownBook.lessons.length, 15);
const seal = value => Array.isArray(value) ? value.map(seal) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).filter(([key]) => !['vn', 'vn_title', 'place_vn', 'desc'].includes(key)).map(([key, v]) => [key, seal(v)])) : value;
assert.deepEqual(seal(shownBook.lessons), seal(originalBook.lessons), 'HSK1 Chinese, pinyin, identity or original media changed');
summary.courses.unshift({level: 1, lessons: 15, revisionId: registry.revisionId, changed: manifest.changes.length, registeredLessonFields: fields.length, manifestSHA256: entry.manifestSHA256, reviewSHA256: entry.reviewSHA256, originalAnswerOrderAndMediaPreserved: true});
summary.lessons += 15; summary.changes += manifest.changes.length;
assert.equal(summary.lessons, 48);
const output = resolve(repo, 'course-app/.repro-output/release-ready/adoption.json');
mkdirSync(resolve(output, '..'), {recursive: true}); writeFileSync(output, JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify(summary));
