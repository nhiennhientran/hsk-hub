import test from 'node:test';
import assert from 'node:assert/strict';
import { createOfficialViRegistry, defaultOfficialViRegistry, viCanonical, viSHA256, viProposal, hsk1ViFields, viPointer, validateOfficialViConfig } from '../src/services/content/official-vi-revisions.ts';
import { getHomework30Bank } from '../src/services/content/homework30.ts';
import { createTextbookContent } from '../src/services/content/textbook.ts';
import { createVocabularyContent } from '../src/services/content/vocabulary.ts';
import { mixedVocabularyDeck, mixedCardFingerprint } from '../src/domain/vocabulary/mixed-state.ts';
import { fixtureRegistry, qField, sha, book, catalog, media, json } from './helpers/official-vi-fixture.mjs';
const q = getHomework30Bank()[0].choice[0];
test('inactive registry preserves object identity and has no synthetic accepted revision', () => {
  const r = defaultOfficialViRegistry(); assert.equal(r.revisionId, null); assert.equal(r.project(q, q.id, 'homework30'), q); assert.equal(r.snapshot([{ id: q.id, component: 'homework30' }]), null);
});
test('canonical proposal removes every exact independentReview key, preserves array order and hashes UTF-8', async () => {
  const v = { z: 'Tiếng Việt 中文', independentReview: { bad: 1 }, a: [{ independentReview: 2, x: 3 }, { x: 4 }] };
  assert.equal(viCanonical(viProposal(v)), '{"a":[{"x":3},{"x":4}],"z":"Tiếng Việt 中文"}');
  assert.equal(await viSHA256(viCanonical(v)), sha(viCanonical(v)));
});
test('accepted synthetic projection clones language only and preserves exact raw grading identity', async () => {
  const before = structuredClone(q), f = qField(q, 'homework30', 'prompt', 'Câu hiển thị thử nghiệm.'), { registry } = await fixtureRegistry('test-a', [f]);
  const dto = registry.project(q, q.id, 'homework30'); assert.notEqual(dto, q); assert.equal(dto.prompt, f.newValue); assert.deepEqual(q, before);
  const { prompt, ...rest } = dto, { prompt: rawPrompt, ...rawRest } = q; assert.deepEqual(rest, rawRest); assert.notEqual(prompt, rawPrompt);
});
test('whole registry rejects stale baseline, byte tampering, parent drift, duplicate field, self-review and foreign consumer before projection', async () => {
  const { inputs } = await fixtureRegistry('test-a', [qField(q, 'homework30', 'prompt', 'Thử nghiệm A.')]);
  for (const input of [ { ...inputs, manifestBytes: inputs.manifestBytes + ' ' }, { ...inputs, reviewBytes: inputs.reviewBytes + ' ' }, { ...inputs, parentDisplayRevision: 'wrong' }, { ...inputs, baselineFiles: [{ file: 'foreign.json', sha256: '0'.repeat(64) }] }, { ...inputs, fields: [{ ...inputs.fields[0], effectiveValue: 'stale' }] }, { ...inputs, fields: [inputs.fields[0], inputs.fields[0]] } ]) await assert.rejects(createOfficialViRegistry(input));
  for (const mutation of [ m => m.changes[0].consumers[0].ownerId = 'foreign', m => m.changes[0].independentReview.reviewer = 'fixture-author', m => m.changes[0].classification = 'unresolved-source', m => m.changes[0].classification = 'match', m => m.changes[0].sourceAnchor.pdfPages = [999], m => m.changes[0].sourceAnchor.zhContext = 'foreign Chinese' ]) await assert.rejects(fixtureRegistry('bad', inputs.fields, mutation));
  await assert.rejects(fixtureRegistry('x'.repeat(257), inputs.fields));
  const sealed = { ...inputs.fields[0], field: '/fixture/answer', relativeField: '/answer', effectiveValue: '2' }; await assert.rejects(fixtureRegistry('bad', [sealed]));
});
test('wordSenses and mixed cards project Vietnamese while catalog/sourceRecords/fingerprints remain raw', async () => {
  const item = catalog.vocabulary[0];
  const field = { baselineFile: 'content/stage3-catalog.json', field: '/vocabulary/0/vi', ownerId: item.id, component: 'vocabulary', lesson: item.lesson, relativeField: '/vi', effectiveValue: item.vi, zhContext: item.zh, newValue: 'Nghĩa thử nghiệm.' };
  const { registry } = await fixtureRegistry('test-word', [field]);
  const textbook = createTextbookContent(book, media, catalog, undefined, json('textbook-display-revisions'), registry);
  const word = textbook.lessons[0].vocab.find(w => w.catalogIds.includes(item.id)); assert.ok(word);
  assert.equal(textbook.wordSenses(1, word.id).find(s => s.catalogId === item.id).vi, field.newValue);
  const content = await createVocabularyContent(catalog, media, undefined, undefined, book, json('textbook-display-revisions'), registry);
  const deck = mixedVocabularyDeck(content.catalog, [1]); const raw = deck.cards.find(c => c.sourceRecords.some(r => r.id === item.id));
  const before = mixedCardFingerprint(raw), display = content.displayCard(raw);
  assert.equal(display.vi, field.newValue); assert.equal(display.sourceRecords, raw.sourceRecords); assert.equal(mixedCardFingerprint(raw), before); assert.equal(mixedCardFingerprint(display), before);
  assert.equal(content.catalog.vocabulary[0].vi, item.vi); assert.equal(content.items[0].vi, item.vi);
});

test('registered HSK1 source mapper uses actual original pointers, parent display leaves and unique semantic owners', () => {
  const values = Object.fromEntries(['textbook', 'textbook-display-revisions', 'stage2-bank', 'stage3-catalog', 'homework30-bank', 'course-index'].map(name => [`content/${name}.json`, json(name)]));
  const fields = hsk1ViFields(values); const seen = new Set();
  for (const f of fields) { let leaf = values[f.baselineFile]; for (const part of viPointer(f.field)) leaf = leaf[part]; assert.equal(leaf, f.effectiveValue, `${f.baselineFile}${f.field}`); const key = JSON.stringify([f.baselineFile, f.field, f.ownerId, f.component]); assert.equal(seen.has(key), false); seen.add(key); assert.ok(!f.relativeField.includes('/zh')); }
  assert.ok(fields.some(f => f.baselineFile === 'content/textbook-display-revisions.json')); assert.equal(fields.filter(f => f.component === 'course-index').length, 15); assert.equal(fields.filter(f => f.component === 'vocabulary').length, 344);
});

test('original option index guards reject frozen Chinese labels and ambiguous Vietnamese display options', async () => {
  const listening = catalog.listening[0];
  const ambiguous = { ...qField(listening, 'listening', 'promptVi', listening.options[1]), field: '/listening/0/options/0', relativeField: '/options/0', effectiveValue: listening.options[0] }; await assert.rejects(fixtureRegistry('ambiguous', [ambiguous]));
  const chinese = { ...qField(q, 'homework30', 'prompt', 'Nghĩa thử.'), field: '/lessons/0/choice/0/options/0', relativeField: '/options/0', effectiveValue: q.options[0] }; await assert.rejects(fixtureRegistry('chinese', [chinese]));
});

test('course overview title uses its exact owner while Chinese and all original count fields stay unchanged', async () => {
  const index = json('course-index'), raw = index.lessons[0], field = { baselineFile: 'content/course-index.json', field: '/lessons/0/titleVi', ownerId: 'course-index-l01', component: 'course-index', lesson: 1, relativeField: '/titleVi', effectiveValue: raw.titleVi, zhContext: raw.title, newValue: 'Tiêu đề thử nghiệm.' };
  const {registry} = await fixtureRegistry('index-A', [field]); const dto = registry.project(raw, field.ownerId, field.component); assert.equal(dto.titleVi, field.newValue); const {titleVi, ...countsAndZh} = dto; const {titleVi: oldVi, ...rawRest} = raw; assert.deepEqual(countsAndZh, rawRest); assert.notEqual(titleVi, oldVi);
});

test('both inactive and active config roots require the exact supported schema before asset loading', () => {
  const active = { manifestFile: 'content/official-vi-revisions/test.json', manifestSHA256: '1'.repeat(64), reviewFile: 'content/official-vi-revisions/review.json', reviewSHA256: '2'.repeat(64) };
  assert.deepEqual(validateOfficialViConfig({schemaVersion:1,active}), {schemaVersion:1,active});
  for (const config of [{schemaVersion:2,active}, {schemaVersion:1,active,unknown:true}, {schemaVersion:1}, {schemaVersion:1,active:{...active,foreign:true}}, {schemaVersion:1,active:{...active,reviewSHA256:'bad'}}]) assert.throws(()=>validateOfficialViConfig(config));
});
