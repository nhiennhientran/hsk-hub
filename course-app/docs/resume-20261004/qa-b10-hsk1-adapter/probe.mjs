import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { createCompatibility } from '../../../../hsk1-app/src/services/storage/compatibility.ts';
import { createStore, STORAGE_KEY } from '../../../../hsk1-app/src/services/storage/index.ts';
import { createHomework30Controller } from '../../../../hsk1-app/src/features/homework/controller30.ts';
import { createListeningController } from '../../../../hsk1-app/src/domain/listening/controller.ts';
import { getHomework30Bank } from '../../../../hsk1-app/src/services/content/homework30.ts';
import { createLearningSession } from '../../../../hsk1-app/src/services/learning/session.ts';
import { fixtureRegistry, qField, oldBank, catalog, book } from '../../../../hsk1-app/tests/helpers/official-vi-fixture.mjs';
import { setup as pairSetup, sourceData } from '../../../../hsk1-app/tests/source-pair-fixture.mjs';
import { SOURCE_STORAGE_KEY, SOURCE_JOURNAL_KEY } from '../../../../hsk1-app/src/services/source-activities/store.ts';

// Independent synthetic engineering probes. This is not an official Vietnamese review.
const compatibility = createCompatibility(oldBank, catalog, book), bank = getHomework30Bank(), q = bank[0].choice[0];
const stamp = 1790899200000;
function setup(seed = compatibility.blank(), options = {}) {
  const memory = options.memory ?? new Map();
  const storage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value), removeItem: key => memory.delete(key) };
  const store = createStore({ storage, blank: () => structuredClone(seed), validate: compatibility.validate, now: () => stamp, lock: options.lock ?? (async task => task()) });
  const session = createLearningSession({ store, compatibility, setTimer: () => 1, clearTimer: () => {} }); session.requestSave = () => {};
  return { store, memory, storage, session,
    homework: registry => createHomework30Controller({ store, bank, lesson: 1, part: 'choice', now: () => stamp, viRegistry: registry }),
    listen: registry => createListeningController({ session, catalog, now: () => stamp, random: () => 0.271, viRegistry: registry }) };
}
const data = fixture => fixture.store.snapshot().data;
function fill(c) { for (const question of c.read().questions) assert.equal(c.answer(question.id, question.answer).ok, true); }
const revision = async id => (await fixtureRegistry(id, [qField(q, 'homework30', 'prompt', `Thử độc lập ${id}.`)])).registry;
const results = [];
async function probe(id, run) {
  try { const details = await run(); results.push({ id, status: 'observed', ...details }); }
  catch (error) { results.push({ id, status: 'probe-error', error: error.stack }); }
}

await probe('partial-listening-reset-retained-submission', async () => {
  const questions = [catalog.listening[0], catalog.listening.find(question => question.lesson === 2)];
  const registry = (await fixtureRegistry('independent-two-lessons', questions.map(question => qField(question, 'listening', 'promptVi', `Thử bài ${question.lesson}.`)))).registry;
  const f = setup(), c = f.listen(registry); c.visit(1); c.setPreferences({ lessons: [1, 2], shuffle: false }); assert.equal(c.start('all').ok, true);
  const position = c.read().session.questionIds.indexOf(questions[1].id);
  for (let i = 0; i <= position; i++) { const current = c.read().current; const raw = catalog.listening.find(question => question.id === current.id); assert.equal(c.select(current.id, raw.answer).ok, true); assert.equal(c.submit().ok, true); if (i < position) assert.equal(c.next().ok, true); }
  const before = data(f); assert.deepEqual(compatibility.validate(before), before);
  try { const after = compatibility.reset(before, { module: 'listening', lesson: 1 }).data; return { expected: 'reset accepted; lesson 2 answer and display preserved', outcome: 'accepted', retained: after.practice.listening.records[questions[1].id] !== undefined }; }
  catch (error) { return { expected: 'reset accepted; lesson 2 answer and display preserved', outcome: 'rejected', error: error.message, rawRoundId: before.practice.listening.session.id, retainedQuestion: questions[1].id }; }
});

await probe('cap20-forged-first-uses-latest-binding', async () => {
  const f = setup(), registry = await revision('same-values'); let c;
  for (let i = 0; i < 21; i++) { c = f.homework(registry); if (i) c.restart(); fill(c); c.submit(); }
  const candidate = data(f), saved = candidate.viPresentation.homework['30-v1:1:choice'];
  const before = { first: saved.first, latest: saved.latest, history: saved.history.slice() }; saved.first = saved.latest;
  // The original first is now orphaned, so remove it to avoid an unrelated GC guard.
  delete candidate.viPresentation.bindings[before.first];
  try { compatibility.validate(candidate); return { expected: 'reject merged first/latest logical submissions', outcome: 'accepted', before, forgedFirst: saved.first }; }
  catch (error) { return { expected: 'reject merged first/latest logical submissions', outcome: 'rejected', error: error.message }; }
});

await probe('exactly20-first-binding-remains-first-history-entry', async () => {
  const f = setup(), registry = await revision('exactly20'); let c;
  for (let i = 0; i < 20; i++) { c = f.homework(registry); if (i) c.restart(); fill(c); c.submit(); }
  const candidate = data(f), saved = candidate.viPresentation.homework['30-v1:1:choice']; assert.equal(saved.first, saved.history[0]); assert.notEqual(saved.first, saved.latest); assert.deepEqual(compatibility.validate(candidate), candidate);
  return { outcome: 'legitimate first=history[0] accepted; first/latest distinct' };
});

await probe('old-baseline-first-new-display-latest-preserves-null-first', async () => {
  const f = setup(); let c = f.homework(); fill(c); c.submit(); const baselineFirst = structuredClone(c.read().group.first); c.restart(); c = f.homework(await revision('after-baseline')); fill(c); c.submit();
  const current = data(f), saved = current.viPresentation.homework['30-v1:1:choice']; assert.equal(saved.first, null); assert.equal(saved.history[0], null); assert.ok(saved.latest); assert.deepEqual(c.read().group.first, baselineFirst); assert.deepEqual(compatibility.validate(current), current);
  return { outcome: 'baseline first remains null; new latest bound independently' };
});

await probe('cross-context-binding-rejected', async () => {
  const f = setup(), c = f.homework(await revision('context')); fill(c); c.submit(); const candidate = data(f), saved = candidate.viPresentation.homework['30-v1:1:choice'];
  candidate.viPresentation.bindings[saved.latest].context = 'attempt:legacy:1:choice';
  assert.throws(() => compatibility.validate(candidate)); return { outcome: 'rejected-as-required' };
});

await probe('original-option-index-out-of-range-rejected', async () => {
  const f = setup(), c = f.homework(await revision('index')); fill(c); c.submit(); const candidate = data(f);
  Object.values(candidate.viPresentation.payloads)[0].fields[0].field = '/options/4';
  assert.throws(() => compatibility.validate(candidate)); return { outcome: 'rejected-as-required' };
});

await probe('baseline-round-started-before-new-registry-stays-unbound', async () => {
  const f = setup(), old = f.listen(); old.visit(1); old.setPreferences({ shuffle: false }); old.start(5);
  const question = catalog.listening[0], r = (await fixtureRegistry('new-listening', [qField(question, 'listening', 'promptVi', 'Thử mới.')])).registry;
  const continued = f.listen(r); continued.select(question.id, question.answer); continued.submit(); assert.equal(data(f).viPresentation, undefined);
  return { outcome: 'baseline-preserved' };
});

await probe('saved-presentation-chinese-answer-option', async () => {
  assert.ok(/[\p{Script=Han}]/u.test(q.options[0]));
  const f = setup(), c = f.homework(await revision('sealed-options')); fill(c); c.submit(); const candidate = data(f);
  const field = Object.values(candidate.viPresentation.payloads)[0].fields[0]; field.field = '/options/0'; field.value = 'Thay đáp án tiếng Trung bằng tiếng Việt.';
  try { compatibility.validate(candidate); return { expected: 'reject sealed Chinese answer option as VI leaf', outcome: 'accepted', originalOption: q.options[0], forgedDisplay: field.value }; }
  catch (error) { return { expected: 'reject sealed Chinese answer option as VI leaf', outcome: 'rejected', error: error.message }; }
});

await probe('duplicate-revised-listening-option-label', async () => {
  const question = catalog.listening[0], field = { ...qField(question, 'listening', 'promptVi', question.options[1]), field: `/fixture/${question.id}/options/0`, relativeField: '/options/0', effectiveValue: question.options[0] };
  try { const registry = (await fixtureRegistry('duplicate-label', [field])).registry; const displayed = registry.project(question, question.id, 'listening'); return { expected: 'reject ambiguous duplicate option text', outcome: 'accepted', options: displayed.options }; }
  catch (error) { return { expected: 'reject ambiguous duplicate option text', outcome: 'rejected', error: error.message }; }
});

await probe('paired-complete-import-reset-restore-with-presentation', async () => {
  const f = setup(), c = f.homework(await revision('paired')); fill(c); c.submit(); const original = data(f), paired = pairSetup();
  const sourceBefore = paired.source.snapshot().data;
  assert.equal((await paired.pair.confirm(paired.pair.preview(original, sourceBefore))).ok, true);
  const exported = await paired.pair.exportComplete(); assert.equal(exported.kind, 'complete');
  const second = pairSetup(); assert.equal((await second.pair.confirm(second.pair.previewBackup(exported.text))).ok, true); assert.deepEqual(second.primary.snapshot().data.viPresentation, original.viPresentation);
  const cleared = compatibility.reset(second.primary.snapshot().data, { module: 'homework', lesson: 1, homeworkVersion: '30-v1' }).data;
  assert.equal((await second.pair.confirm(second.pair.previewReset(cleared))).ok, true); assert.equal(second.primary.snapshot().data.viPresentation, undefined);
  assert.equal((await second.pair.confirm(second.pair.previewRestore())).ok, true); assert.deepEqual(second.primary.snapshot().data, original); assert.deepEqual(second.source.snapshot().data, sourceBefore);
  return { outcome: 'preserved-through-complete-import-reset-restore' };
});

await probe('utf8-metadata-near-actual-eight-mib-byte-budget', async () => {
  const f = setup(); let c;
  for (let i = 0; i < 21; i++) { c = f.homework(await revision(`budget-${i}`)); if (i) c.restart(); fill(c); c.submit(); }
  const candidate = data(f), expand = (size, count) => {
    const copy = structuredClone(candidate);
    Object.values(copy.viPresentation.payloads).forEach((payload, i) => {
      payload.fields = bank[0].choice.flatMap(question => ['prompt', 'explanation'].map(field => ({ ownerId: question.id, component: 'homework30', field: `/${field}`, value: `${i}:` + 'ế'.repeat(size) }))).slice(0, count);
    });
    return copy;
  };
  const below = expand(8188, 15), above = expand(8188, 20), bytes = value => new TextEncoder().encode(JSON.stringify(value.viPresentation)).byteLength;
  assert.deepEqual(compatibility.validate(below).viPresentation, below.viPresentation); assert.throws(() => compatibility.validate(above));
  const full = f.store.previewReplacement(below, 'import'); assert.ok(full.data.viPresentation);
  return { outcome: 'below-limit accepted; above-limit rejected', belowMetadataBytes: bytes(below), aboveMetadataBytes: bytes(above), belowBackupBytes: new TextEncoder().encode(JSON.stringify(below)).byteLength };
});

for (const crashKey of [STORAGE_KEY, SOURCE_STORAGE_KEY]) await probe(`paired-recovery-with-vi-crash-after-${crashKey}`, async () => {
  const f = setup(), c = f.homework(await revision('crash')); fill(c); c.submit(); const revised = data(f), paired = pairSetup(), before = paired.primary.snapshot().data;
  const sourceAfter = sourceData('independent-after'), token = paired.pair.preview(revised, sourceAfter);
  const originalSet = paired.storage.setItem.bind(paired.storage), originalGet = paired.storage.getItem.bind(paired.storage), originalRemove = paired.storage.removeItem.bind(paired.storage); let dead = false;
  paired.storage.setItem = (key, value) => { if (dead) throw Error('simulated process stopped'); originalSet(key, value); if (key === crashKey) { dead = true; throw Error('simulated process stopped after durable write'); } };
  paired.storage.getItem = key => { if (dead) throw Error('simulated process stopped'); return originalGet(key); };
  paired.storage.removeItem = key => { if (dead) throw Error('simulated process stopped'); return originalRemove(key); };
  assert.equal((await paired.pair.confirm(token)).ok, false); assert.ok(paired.storage.values.has(SOURCE_JOURNAL_KEY));
  paired.storage.setItem = originalSet; paired.storage.getItem = originalGet; paired.storage.removeItem = originalRemove;
  const restarted = pairSetup({ storage: paired.storage }); assert.equal((await restarted.pair.recover()).ok, true); assert.equal(paired.storage.values.has(SOURCE_JOURNAL_KEY), false);
  if (crashKey === STORAGE_KEY) { assert.deepEqual(restarted.primary.snapshot().data, before); return { outcome: 'rolled back primary display and raw together' }; }
  assert.deepEqual(restarted.primary.snapshot().data, revised); assert.deepEqual(restarted.source.snapshot().data, sourceAfter); return { outcome: 'completed both domains; display/raw/source preserved' };
});

await probe('cooperating-two-primary-tabs-keep-conflicting-display-live-unsaved', async () => {
  const f = setup(), initial = f.homework(await revision('initial')); fill(initial); initial.submit(); assert.equal((await f.store.save()).ok, true);
  const other = setup(undefined, { memory: f.memory });
  const a = f.homework(await revision('tab-A')), b = other.homework(await revision('tab-B')); a.restart(); b.restart(); fill(a); fill(b); a.submit(); b.submit();
  const unsavedA = data(f), savedB = data(other); assert.equal((await other.store.save()).ok, true); assert.equal((await f.store.save()).code, 'conflict');
  assert.deepEqual(data(f), unsavedA); assert.equal(f.store.snapshot().hasUnsavedChanges, true); assert.deepEqual(JSON.parse(f.store.exportBackup()).data, unsavedA);
  assert.deepEqual(setup(undefined, { memory: f.memory }).store.snapshot().data, savedB); return { outcome: 'tab B durable; tab A raw+display remain matching exportable unsaved candidate' };
});

writeFileSync(new URL('./results.json', import.meta.url), JSON.stringify({ executedAt: new Date().toISOString(), scope: 'synthetic unit pipeline only', results }, null, 2) + '\n');
process.stdout.write(JSON.stringify(results, null, 2) + '\n');
const required = { 'partial-listening-reset-retained-submission': 'accepted', 'cap20-forged-first-uses-latest-binding': 'rejected', 'saved-presentation-chinese-answer-option': 'rejected', 'duplicate-revised-listening-option-label': 'rejected' };
if (results.length !== 14 || results.some(r => r.status !== 'observed') || Object.entries(required).some(([id, outcome]) => results.find(r => r.id === id)?.outcome !== outcome)) process.exitCode = 1;
