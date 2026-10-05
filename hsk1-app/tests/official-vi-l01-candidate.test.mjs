import test from 'node:test';
import assert from 'node:assert/strict';
import { createOfficialViRegistry, defaultOfficialViRegistry, validateOfficialViConfig } from '../src/services/content/official-vi-revisions.ts';
import { createTextbookContent } from '../src/services/content/textbook.ts';
import { createVocabularyContent } from '../src/services/content/vocabulary.ts';
import { mixedVocabularyDeck, mixedCardFingerprint } from '../src/domain/vocabulary/mixed-state.ts';
import { createCompatibility } from '../src/services/storage/compatibility.ts';
import { createStore } from '../src/services/storage/index.ts';
import { createHomework30Controller } from '../src/features/homework/controller30.ts';
import { createHomeworkController } from '../src/features/homework/controller.ts';
import { getHomework30Bank } from '../src/services/content/homework30.ts';
import { projectHomeworkQuestion } from '../src/services/content/vi-presentation-state.ts';
import { candidateJSON, candidatePointer, candidateSHA, candidateSourceBytes, loadOfficialViL01Candidate } from './helpers/official-vi-l01-candidate.mjs';
const ownFields = (candidate, owner, component) => candidate.manifest.changes.filter(change => change.ownerId === owner && change.component === component);
const rawBook = c => c.values['content/textbook.json'];
const rawCatalog = c => c.values['content/stage3-catalog.json'];
const revisions = c => c.values['content/textbook-display-revisions.json'];
const bookContent = c => createTextbookContent(rawBook(c), candidateJSON('media-references'), rawCatalog(c), undefined, revisions(c), c.registry);
function stripChangedLeaves(value, owner, component, candidate) {
  const copy = structuredClone(value);
  for (const change of ownFields(candidate, owner, component)) {
    const field = candidate.inputs.fields.find(f => f.ownerId === owner && f.field === change.field && f.component === component);
    assert.ok(field); const parts = field.relativeField.slice(1).split('/');
    let parent = copy; for (const key of parts.slice(0, -1)) parent = parent[key]; delete parent[parts.at(-1)];
  }
  return copy;
}
test('real L01 payload validates actual baseline bytes and independent proof in the inactive baseline fixture', async () => {
  const c = await loadOfficialViL01Candidate();
  assert.equal(c.manifest.changes.length, 24); assert.equal(c.manifest.changes.filter(x => x.component === 'textbook').length, 15);
  assert.equal(c.manifest.changes.filter(x => x.component === 'vocabulary').length, 9);
  assert.ok(c.manifest.changes.every(x => x.lesson === 1 && x.expectedEffectiveValue !== x.newValue));
  assert.notEqual(c.proof.author, c.proof.reviewer); assert.equal(c.proof.status, 'accepted');
  assert.deepEqual(c.inputs.baselineFiles, c.manifest.baselineFiles);
  for (const change of c.manifest.changes) assert.equal(candidatePointer(c.values[change.baselineFile], change.field), change.expectedEffectiveValue);
  assert.equal(defaultOfficialViRegistry().revisionId, null);
  // Activation is a separate accepted revision; it must not rewrite this
  // historical 24-field candidate or change the baseline fixture's registry.
  validateOfficialViConfig(candidateJSON('official-vi-registry'));
});
test('actual candidate projects book words and dialogue bodies only, preserving Chinese pinyin IDs source and audio identities', async () => {
  const c = await loadOfficialViL01Candidate(), before = structuredClone(c.values), current = bookContent(c);
  const inactive = createTextbookContent(rawBook(c), candidateJSON('media-references'), rawCatalog(c), undefined, revisions(c), defaultOfficialViRegistry());
  const expected = structuredClone({ lessons: inactive.lessons });
  for (const change of c.manifest.changes.filter(x => x.component === 'textbook')) {
    const parts = change.field.slice(1).split('/'); let parent = expected;
    for (const key of parts.slice(0, -1)) parent = parent[key]; parent[parts.at(-1)] = change.newValue;
  }
  assert.deepEqual(current.lessons, expected.lessons);
  const first = current.lessons[0]; assert.equal(first.vn_title, 'Xin chào AI Tiểu Ngữ!');
  for (const old of [...inactive.lessons[0].vocab, ...inactive.lessons[0].scenes.flatMap(s => s.lines)]) {
    const shown = [...first.vocab, ...first.scenes.flatMap(s => s.lines)].find(x => x.id === old.id); assert.ok(shown);
    for (const change of ownFields(c, old.id, 'textbook')) assert.equal(shown.vn, change.newValue);
    assert.deepEqual(stripChangedLeaves(shown, old.id, 'textbook', c), stripChangedLeaves(old, old.id, 'textbook', c));
  }
  assert.deepEqual(current.lessons.slice(1), inactive.lessons.slice(1));
  for (const word of first.vocab) assert.deepEqual(current.resolveWord(1, word.id), inactive.resolveWord(1, word.id));
  for (const scene of first.scenes) {
    assert.deepEqual(current.resolveScene(1, scene.id), inactive.resolveScene(1, scene.id));
    for (const line of scene.lines) assert.deepEqual(current.resolveLine(1, scene.id, line.id), inactive.resolveLine(1, scene.id, line.id));
  }
  assert.deepEqual(c.values, before);
});
test('real reviewed catalog copies reach wordSenses and mixed card display without changing raw senses or saved fingerprints', async () => {
  const c = await loadOfficialViL01Candidate(), catalog = rawCatalog(c), before = structuredClone(catalog), textbook = bookContent(c);
  const vocabulary = await createVocabularyContent(catalog, candidateJSON('media-references'), undefined, undefined, rawBook(c), revisions(c), c.registry);
  const deck = mixedVocabularyDeck(vocabulary.catalog, [1]);
  for (const change of c.manifest.changes.filter(x => x.component === 'vocabulary')) {
    const record = catalog.vocabulary.find(x => x.id === change.ownerId), word = textbook.lessons[0].vocab.find(x => x.catalogIds.includes(record.id));
    assert.ok(word); assert.equal(textbook.wordSenses(1, word.id).find(x => x.catalogId === record.id).vi, change.newValue);
    const raw = deck.cards.find(x => x.sourceRecords.some(r => r.id === record.id)); assert.ok(raw);
    const shown = vocabulary.displayCard(raw); assert.equal(vocabulary.displayItem(record.id).vi, change.newValue);
    assert.equal(shown.sourceRecords, raw.sourceRecords); assert.equal(mixedCardFingerprint(shown), mixedCardFingerprint(raw));
    assert.equal(vocabulary.catalog.vocabulary.find(x => x.id === record.id).vi, record.vi);
  }
  assert.deepEqual(catalog, before);
});
test('real core-only candidate retains nonempty old and new homework submissions, baseline display and exact backup round-trip', async () => {
  const c = await loadOfficialViL01Candidate(), oldBank = c.values['content/stage2-bank.json'], compatibility = createCompatibility(oldBank, rawCatalog(c), rawBook(c)), memory = new Map();
  const storage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value) };
  const makeStore = () => createStore({ storage, blank: compatibility.blank, validate: compatibility.validate, now: () => 1791202800000, lock: async task => task() });
  const store = makeStore(), newBank = getHomework30Bank();
  for (const version of ['legacy', '30-v1']) {
    const make = registry => version === 'legacy' ? createHomeworkController({ store, bank: oldBank.lessons, lesson: 1, part: 'choice', viRegistry: registry, now: () => 1791202800000 }) : createHomework30Controller({ store, bank: newBank, lesson: 1, part: 'choice', viRegistry: registry, now: () => 1791202800000 });
    let controller = make(defaultOfficialViRegistry());
    for (const q of controller.read().questions) assert.equal(controller.answer(q.id, q.answer).ok, true);
    assert.equal(controller.submit().ok, true); const first = structuredClone(controller.read().group.first);
    assert.equal(controller.restart().ok, true); controller = make(c.registry);
    for (const q of controller.read().questions) assert.equal(controller.answer(q.id, q.answer).ok, true);
    assert.equal(controller.submit().ok, true); assert.deepEqual(controller.read().group.first, first);
    assert.equal(controller.read().group.latest.correct, first.correct); assert.equal(controller.read().group.latest.total, first.total);
    const qs = version === 'legacy' ? oldBank.lessons[0].choice : newBank[0].choice;
    assert.deepEqual(projectHomeworkQuestion(store.snapshot().data, version, 1, 'choice', qs[0], qs, 'first', c.registry), qs[0]);
  }
  assert.equal(store.snapshot().data.viPresentation, undefined); assert.equal((await store.save()).ok, true);
  const original = store.snapshot().data, backup = store.exportBackup(), freshMemory = new Map();
  const freshStorage = { getItem: key => freshMemory.get(key) ?? null, setItem: (key, value) => freshMemory.set(key, value) };
  const fresh = createStore({ storage: freshStorage, blank: compatibility.blank, validate: compatibility.validate, now: () => 1791202800000, lock: async task => task() });
  assert.equal((await fresh.confirm(fresh.previewBackup(backup))).ok, true); assert.deepEqual(fresh.snapshot().data, original);
  assert.deepEqual(createStore({ storage: freshStorage, blank: compatibility.blank, validate: compatibility.validate }).snapshot().data, original);
  assert.deepEqual(makeStore().snapshot().data, original);
  assert.equal(defaultOfficialViRegistry().revisionId, null);
});
test('fresh explicitly projected book and vocabulary snapshots contain real candidate fields and cannot mutate the registry or old raw values', async () => {
  const c = await loadOfficialViL01Candidate(), owners = c.manifest.changes.map(x => ({ id: x.ownerId, component: x.component }));
  assert.equal(defaultOfficialViRegistry().snapshot(owners), null);
  const saved = c.registry.snapshot(owners); assert.equal(saved.revisionId, c.manifest.revisionId); assert.equal(saved.fields.length, 24);
  const expected = structuredClone(saved); saved.fields[0].value = 'client-only accidental mutation'; assert.deepEqual(c.registry.snapshot(owners), expected);
  for (const field of expected.fields) {
    const change = c.manifest.changes.find(x => x.ownerId === field.ownerId && x.component === field.component); assert.equal(field.value, change.newValue);
    assert.equal(candidatePointer(c.values[change.baselineFile], change.field), change.expectedEffectiveValue);
  }
});
test('actual candidate fails closed for tampered bytes stale baselines and stale consumers without forging new acceptance', async () => {
  const c = await loadOfficialViL01Candidate();
  for (const input of [{ ...c.inputs, manifestBytes: c.inputs.manifestBytes + ' ' }, { ...c.inputs, reviewBytes: c.inputs.reviewBytes + ' ' },
    { ...c.inputs, parentDisplayRevision: 'stale-parent' }, { ...c.inputs, baselineFiles: c.inputs.baselineFiles.map((x, i) => i ? x : { ...x, sha256: '0'.repeat(64) }) },
    { ...c.inputs, fields: c.inputs.fields.map(x => x.ownerId === c.manifest.changes[0].ownerId ? { ...x, effectiveValue: 'stale-current-display' } : x) }]) await assert.rejects(createOfficialViRegistry(input));
  for (const [file, bytes] of Object.entries(c.rawBytes)) assert.equal(candidateSHA(bytes), candidateSHA(candidateSourceBytes(file)));
  assert.equal(defaultOfficialViRegistry().revisionId, null);
});
