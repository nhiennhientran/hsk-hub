import { setup as pairedSetup } from './source-pair-fixture.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCompatibility } from '../src/services/storage/compatibility.ts';
import { createStore, STORAGE_KEY } from '../src/services/storage/index.ts';
import { createHomework30Controller } from '../src/features/homework/controller30.ts';
import { createHomeworkController } from '../src/features/homework/controller.ts';
import { createListeningController } from '../src/domain/listening/controller.ts';
import { getHomework30Bank } from '../src/services/content/homework30.ts';
import { createLearningSession } from '../src/services/learning/session.ts';
import { projectListeningCurrent } from '../src/services/content/listening.ts';
import { projectHomeworkQuestion, VI_PRESENTATION_LIMITS } from '../src/services/content/vi-presentation-state.ts';
import { createExerciseCatalogue } from '../src/domain/exercises/catalogue.ts';
import { archivedExercises } from '../src/features/exercises/archive-data.ts';
import { fixtureRegistry, qField, oldBank, catalog, book, json } from './helpers/official-vi-fixture.mjs';
const bank = getHomework30Bank(), q = bank[0].choice[0], stamp = 1790899200000;
const compatibility = createCompatibility(oldBank, catalog, book);
const registry = async (id, question = q, component = 'homework30') => (await fixtureRegistry(id, [qField(question, component, component === 'listening' ? 'promptVi' : 'prompt', `Văn bản ${id}.`)])).registry;
function setup(seed = compatibility.blank(), options = {}) {
  const memory = options.memory ?? new Map(); let quota = false;
  const storage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => { if (quota) { const e = new Error('quota'); e.name = 'QuotaExceededError'; throw e; } memory.set(key, value); } };
  const store = createStore({ storage, blank: () => structuredClone(seed), validate: compatibility.validate, now: () => stamp, lock: options.lock ?? (async task => task()) });
  const session = createLearningSession({ store, compatibility, setTimer: () => 1, clearTimer: () => {} }); session.requestSave = () => {};
  return { store, session, memory, setQuota: v => quota = v,
    homework: (r, version = '30-v1', lesson = 1, part = 'choice') => version === '30-v1' ? createHomework30Controller({ store, bank, lesson, part, now: () => stamp, viRegistry: r }) : createHomeworkController({ store, bank: oldBank.lessons, lesson, part, now: () => stamp, viRegistry: r }),
    listen: r => createListeningController({ session, catalog, now: () => stamp, random: () => 0.271, viRegistry: r }) };
}
const data = f => f.store.snapshot().data;
const binding = f => data(f).viPresentation.homework['30-v1:1:choice'];
const display = (f, r, slot = 'draft', version = '30-v1', question = q) => projectHomeworkQuestion(data(f), version, 1, 'choice', question, version === '30-v1' ? bank[0].choice : oldBank.lessons[0].choice, slot, r).prompt;
const fill = c => { for (const question of c.read().questions) assert.equal(c.answer(question.id, question.answer).ok, true); };
test('family 1: inactive read/profile/no-op answer does not create presentation or alter raw grading', () => {
  const f = setup(), c = f.homework(); c.read(); assert.equal(data(f).viPresentation, undefined); c.profile('name', 'Learner'); assert.equal(data(f).viPresentation, undefined);
  fill(c); assert.equal(c.submit().ok, true); assert.equal(data(f).viPresentation, undefined); assert.equal(c.read().group.first.correct, 10);
});
test('family 2: first real answer captures displayed revision; reload/continued answers retain it while profile and reads are inert', async () => {
  const a = await registry('A'), b = await registry('B'), f = setup(), c = f.homework(a);
  assert.equal(display(f, a), 'Văn bản A.'); c.profile('name', 'A'); assert.equal(data(f).viPresentation, undefined);
  c.answer(q.id, q.answer); const captured = structuredClone(data(f).viPresentation);
  c.answer(q.id, q.answer); c.read(); assert.deepEqual(data(f).viPresentation, captured);
  await f.store.save(); const fresh = setup(undefined, { memory: f.memory }), continued = fresh.homework(b);
  assert.equal(display(fresh, b), 'Văn bản A.'); fill(continued); continued.submit(); assert.equal(display(fresh, b, 'latest'), 'Văn bản A.');
});
test('family 3: legacy unbound draft and old submission remain baseline despite a new active display revision', async () => {
  const r = await registry('A'), f = setup(), baseline = f.homework(); baseline.answer(q.id, q.answer);
  const c = f.homework(r); assert.equal(display(f, r), q.prompt); fill(c); c.submit(); assert.equal(display(f, r, 'latest'), q.prompt); assert.equal(data(f).viPresentation, undefined);
});
test('family 4: same-clock same-answer submissions get distinct binding IDs and exact first/current/latest/history display', async () => {
  const a = await registry('A'), b = await registry('B'), f = setup(); let c = f.homework(a); fill(c); c.submit(); const first = binding(f).first, rawFirst = structuredClone(c.read().group.first);
  c.restart(); c = f.homework(b); fill(c); c.submit(); const saved = binding(f);
  assert.deepEqual(c.read().group.latest, rawFirst); assert.notEqual(saved.first, saved.latest); assert.equal(saved.current, saved.latest); assert.deepEqual(saved.history, [first, saved.latest]);
  assert.equal(display(f, b, 'first'), 'Văn bản A.'); assert.equal(display(f, b, 'latest'), 'Văn bản B.'); assert.equal(display(f, b, 0), 'Văn bản A.'); assert.equal(display(f, b, 1), 'Văn bản B.');
});
test('family 5: history cap20 keeps first binding/payload and collects only unreferenced revisions', async () => {
  const f = setup(); let c;
  for (let i = 0; i < 23; i++) { const r = await registry(`R${i}`); c = f.homework(r); if (i) c.restart(); fill(c); c.submit(); }
  const saved = binding(f), state = data(f).viPresentation;
  assert.equal(saved.history.length, 20); assert.equal(new Set(saved.history).size, 20); assert.ok(!saved.history.includes(saved.first)); assert.ok(state.bindings[saved.first]);
  assert.equal(display(f, undefined, 'first'), 'Văn bản R0.'); assert.equal(display(f, undefined, 0), 'Văn bản R3.'); assert.equal(display(f, undefined, 'latest'), 'Văn bản R22.');
  assert.equal(Object.keys(state.bindings).length, 21); assert.equal(Object.keys(state.payloads).length, 21); assert.deepEqual(compatibility.validate(data(f)), data(f));
});
test('family 6: restart clears current/draft only, preserves first/latest/history; next fresh answer may bind new revision', async () => {
  const a = await registry('A'), b = await registry('B'), f = setup(), c = f.homework(a); fill(c); c.submit(); const before = binding(f); c.restart();
  const saved = binding(f); assert.equal(saved.current, null); assert.equal(saved.draft, null); assert.equal(saved.first, before.first); assert.equal(saved.latest, before.latest); assert.deepEqual(saved.history, before.history);
  assert.equal(display(f, b), 'Văn bản B.'); f.homework(b).answer(q.id, q.answer); assert.equal(display(f, a), 'Văn bản B.');
});
test('family 7: listening round is fixed across reload; randomized option indices and raw answers/fingerprints stay authoritative', async () => {
  const question = catalog.listening[0];
  const fields = [qField(question, 'listening', 'promptVi', 'Nghe bản thử A.'), { ...qField(question, 'listening', 'promptVi', 'Cảm ơn thử A.'), field: '/fixture/options/0', relativeField: '/options/0', effectiveValue: question.options[0] }];
  const a = (await fixtureRegistry('listen-A', fields)).registry, b = await registry('listen-B', question, 'listening'), f = setup(); let c = f.listen(a); c.visit(1); c.setPreferences({ shuffle: false }); c.start(5);
  const raw = c.read().current; assert.equal(raw.id, question.id); const dto = projectListeningCurrent(raw, data(f), catalog); assert.equal(dto.promptVi, 'Nghe bản thử A.'); assert.equal(dto.options.find(o => o.index === 0).text, 'Cảm ơn thử A.'); assert.deepEqual(dto.options.map(o => o.index), raw.options.map(o => o.index));
  await f.store.save(); const fresh = setup(undefined, { memory: f.memory }); c = fresh.listen(b); assert.equal(projectListeningCurrent(c.read().current, data(fresh), catalog).promptVi, 'Nghe bản thử A.');
  c.select(question.id, question.answer); c.submit(); const first = data(fresh).viPresentation.listening.records[question.id].first;
  assert.equal(c.read().current.feedback.correct, true); assert.equal(c.read().current.feedback.answer, question.answer);
  c.start(5); c.select(question.id, question.answer); c.submit(); const saved = data(fresh).viPresentation.listening.records[question.id]; assert.notEqual(saved.first, saved.latest); assert.equal(saved.first, first); assert.deepEqual(compatibility.validate(data(fresh)), data(fresh));
});
test('family 8: full backup/import/recovery round-trips display and raw authority together without applying current revision', async () => {
  const a = await registry('A'), f = setup(), c = f.homework(a); fill(c); c.submit(); await f.store.save(); const original = data(f), backup = f.store.exportBackup();
  const fresh = setup(); assert.equal((await fresh.store.confirm(fresh.store.previewBackup(backup))).ok, true); assert.deepEqual(data(fresh), original);
  const replacement = compatibility.reset(original, { module: 'homework', lesson: 1, homeworkVersion: '30-v1' }).data; assert.equal((await fresh.store.confirm(fresh.store.previewReplacement(replacement, 'reset'))).ok, true); assert.equal(data(fresh).viPresentation, undefined);
  assert.equal((await fresh.store.restore()).ok, true); assert.deepEqual(data(fresh), original);
});
test('family 9: strict import rejects wrong raw authority, foreign owner, sealed Chinese field, orphan payload, duplicate history binding and unknown key atomically', async () => {
  const a = await registry('A'), f = setup(), c = f.homework(a); fill(c); c.submit(); c.restart(); fill(c); c.submit(); const original = data(f);
  const mutations = [ d => d.viPresentation.bindings[binding(f).latest].authority = '{}', d => Object.values(d.viPresentation.payloads)[0].fields[0].ownerId = 'foreign', d => Object.values(d.viPresentation.payloads)[0].fields[0].field = '/zh', d => d.viPresentation.payloads.p999 = structuredClone(Object.values(d.viPresentation.payloads)[0]), d => d.viPresentation.homework['30-v1:1:choice'].history[0] = d.viPresentation.homework['30-v1:1:choice'].history[1], d => d.viPresentation.unknown = true, d => d.viPresentation.sequence = 0 ];
  for (const mutate of mutations) { const d = structuredClone(original); mutate(d); assert.throws(() => f.store.previewReplacement(d, 'import')); assert.deepEqual(data(f), original); }
  const historical = structuredClone(original); for (const p of Object.values(historical.viPresentation.payloads)) p.revisionId = 'historical-unavailable-revision'; assert.deepEqual(compatibility.validate(historical), historical);
});
test('family 10: scoped lesson/version/module reset prunes matching presentation and preserves unrelated homework/listening data', async () => {
  const a = await registry('A'), oldQ = oldBank.lessons[0].choice[0], oldR = await registry('old-A', oldQ, 'homework'), f = setup(); let c = f.homework(a); fill(c); c.submit(); c = f.homework(oldR, 'legacy'); fill(c); c.submit();
  const l = f.listen(await registry('listen-A', catalog.listening[0], 'listening')); l.visit(1); l.setPreferences({ shuffle: false }); l.start(5); l.select(catalog.listening[0].id, 0); l.submit();
  const old = structuredClone(data(f).viPresentation.homework['legacy:1:choice']), listen = structuredClone(data(f).viPresentation.listening);
  const result = compatibility.reset(data(f), { module: 'homework', lesson: 1, homeworkVersion: '30-v1' }).data; assert.equal(result.viPresentation.homework['30-v1:1:choice'], undefined); assert.deepEqual(result.viPresentation.homework['legacy:1:choice'], old); assert.deepEqual(result.viPresentation.listening, listen);
  const removed = compatibility.reset(result, { module: 'listening', lesson: 1 }).data; assert.deepEqual(removed.viPresentation.homework['legacy:1:choice'], old); assert.deepEqual(removed.viPresentation.listening, { round: null, records: {} });
});
test('family 11: explicit legacy replacement clears only its replaced display domain; discovery preserves valid existing bindings', async () => {
  const a = await registry('A'), oldQ = oldBank.lessons[0].choice[0], oldR = await registry('old-A', oldQ, 'homework'), f = setup(); let c = f.homework(a); fill(c); c.submit(); c = f.homework(oldR, 'legacy'); fill(c); c.submit();
  const current = data(f), newSaved = structuredClone(current.viPresentation.homework['30-v1:1:choice']);
  const imported = compatibility.importLegacy(current.homework, current, stamp).data; assert.equal(imported.viPresentation.homework['legacy:1:choice'], undefined); assert.deepEqual(imported.viPresentation.homework['30-v1:1:choice'], newSaved);
  const discovered = compatibility.migrate({}, stamp, current).data; assert.deepEqual(discovered.viPresentation, current.viPresentation);
});
test('family 12: quota/held-lock retain H1 live-unsaved submission+display export; retry writes the same binding once', async () => {
  const a = await registry('A'), f = setup(), c = f.homework(a); fill(c); c.submit(); const saved = structuredClone(data(f)), id = binding(f).latest; f.setQuota(true);
  assert.equal((await f.store.save()).ok, false); assert.equal(f.store.snapshot().hasUnsavedChanges, true); assert.deepEqual(JSON.parse(f.store.exportBackup()).data, saved); assert.equal(f.memory.get(STORAGE_KEY), undefined);
  f.setQuota(false); assert.equal((await f.store.save()).ok, true); assert.equal(binding(f).latest, id); assert.deepEqual(setup(undefined, { memory: f.memory }).store.snapshot().data, saved);
  let release, entered; const started = new Promise(r => entered = r); const held = new Promise(r => release = r);
  const locked = setup(undefined, { lock: async task => { entered(); await held; return task(); } }); const hc = locked.homework(a); fill(hc); hc.submit(); const pending = locked.store.save(); await started; assert.equal(locked.memory.get(STORAGE_KEY), undefined); assert.equal(binding(locked).latest, binding(locked).history[0]); release(); assert.equal((await pending).ok, true);
});
test('archive projection preserves distinct same-clock logical slots while raw answer/grade and raw task stay explicit', async () => {
  const question = oldBank.lessons[0].choice[0], a = await registry('old-A', question, 'homework'), b = await registry('old-B', question, 'homework'), f = setup(); let c = f.homework(a, 'legacy'); fill(c); c.submit(); c.restart(); c = f.homework(b, 'legacy'); fill(c); c.submit();
  const catalogue = createExerciseCatalogue(json('legacy-exercises'), oldBank.lessons, catalog), entries = archivedExercises(catalogue, data(f).exercises, { feature: 'exercises', lesson: 1, exerciseSet: 'homework-review', exerciseGroup: 'choice', exerciseFilter: 'all' }, data(f).homework, data(f));
  const entry = entries.find(e => e.entry.oldId === question.id), timeline = entry.timelines.find(t => t.source === 'homework');
  assert.equal(entry.task.prompt, question.prompt); assert.equal(timeline.first.displayTask.prompt, 'Văn bản old-A.'); assert.equal(timeline.latest.displayTask.prompt, 'Văn bản old-B.'); assert.notEqual(timeline.first.displayBindingId, timeline.latest.displayBindingId); assert.equal(timeline.first.answer, timeline.latest.answer); assert.equal(timeline.first.at, timeline.latest.at); assert.equal(timeline.first.correct, true);
});
test('UTF-8 budget is enforced on actual multilingual bytes, with no truncation of saved Vietnamese', async () => {
  const a = await registry('A'), f = setup(), c = f.homework(a); fill(c); c.submit(); const d = data(f); const snapshot = Object.values(d.viPresentation.payloads)[0]; snapshot.fields[0].value = 'ế'.repeat(VI_PRESENTATION_LIMITS.text + 1); assert.throws(() => compatibility.validate(d));
  assert.ok(new TextEncoder().encode('ế').byteLength > 'ế'.length); assert.ok(new TextEncoder().encode(JSON.stringify(data(f).viPresentation)).byteLength < VI_PRESENTATION_LIMITS.bytes);
});

test('paired backup/import/restore carries nonempty presentation and independent source data atomically', async () => {
  const f = pairedSetup(), question = bank[1].choice[0], r = await registry('paired-A', question);
  const c = createHomework30Controller({ store: f.primary, bank, lesson: 2, part: 'choice', now: () => stamp, viRegistry: r }); fill(c); c.submit(); assert.equal((await f.primary.save()).ok, true);
  const primary = f.primary.snapshot().data, source = f.source.snapshot().data; assert.ok(primary.viPresentation);
  const full = await f.pair.exportComplete(); assert.equal(full.kind, 'complete'); const fresh = pairedSetup({ primaryAbsent: true, absent: true });
  assert.equal((await fresh.pair.confirm(fresh.pair.previewBackup(full.text))).ok, true); assert.deepEqual(fresh.primary.snapshot().data, primary); assert.deepEqual(fresh.source.snapshot().data, source);
  const reset = compatibility.reset(primary, { module: 'homework', lesson: 2, homeworkVersion: '30-v1' }).data;
  assert.equal((await fresh.pair.confirm(fresh.pair.preview(reset, source, 'reset'))).ok, true); assert.equal(fresh.primary.snapshot().data.viPresentation, undefined);
  assert.equal((await fresh.pair.confirm(fresh.pair.previewRestore())).ok, true); assert.deepEqual(fresh.primary.snapshot().data, primary); assert.deepEqual(fresh.source.snapshot().data, source);
});
test('partial listening reset retains other lesson display/response bindings and trims round payload by actual kept IDs', async () => {
  const questions = [catalog.listening[0], catalog.listening.find(q => q.lesson === 2)];
  const r = (await fixtureRegistry('multi-listen', questions.map(q => qField(q, 'listening', 'promptVi', `Nghe thử ${q.lesson}.`)))).registry, f = setup(), c = f.listen(r);
  c.visit(1); c.setPreferences({ lessons: [1, 2], shuffle: false }); c.start('all');
  while (c.read().current.lesson === 1) { const current = c.read().current, q = catalog.listening.find(q => q.id === current.id); c.select(q.id, q.answer); c.submit(); c.next(); }
  const current = c.read().current, q = catalog.listening.find(q => q.id === current.id); c.select(q.id, q.answer); c.submit();
  const before = data(f), keep = before.viPresentation.listening.records[q.id];
  const reset = compatibility.reset(before, { module: 'listening', lesson: 1 }).data;
  assert.deepEqual(reset.viPresentation.listening.records[q.id], keep); assert.equal(reset.practice.listening.session.questionIds.some(id => id.startsWith('l01-')), false);
  assert.ok(Object.values(reset.viPresentation.payloads).some(p => p.fields.some(f => f.ownerId === q.id))); assert.deepEqual(compatibility.validate(reset), reset);
});
test('baseline unbound listening round after an old revision updates latest as baseline without retagging it', async () => {
  const r = await registry('listen-A', catalog.listening[0], 'listening'), f = setup(), c = f.listen(r); c.visit(1); c.setPreferences({ shuffle: false }); c.start(5); c.select(catalog.listening[0].id, 0); c.submit();
  c.start(5); f.store.edit(d => { d.viPresentation.listening.round = null; const used = new Set(Object.values(d.viPresentation.bindings).map(b => b.payloadId)); for (const id of Object.keys(d.viPresentation.payloads)) if (!used.has(id)) delete d.viPresentation.payloads[id]; });
  c.select(catalog.listening[0].id, 0); c.submit(); const saved = data(f).viPresentation.listening.records[catalog.listening[0].id]; assert.ok(saved.first); assert.equal(saved.latest, null); assert.deepEqual(compatibility.validate(data(f)), data(f));
});

test('cap20 import cannot merge the real first logical submission with later same-clock binding', async () => {
  const a = await registry('A'), f = setup(), c = f.homework(a);
  for (let i = 0; i < 21; i++) { if (i) c.restart(); fill(c); c.submit(); }
  const forged = data(f), saved = forged.viPresentation.homework['30-v1:1:choice'], first = saved.first; saved.first = saved.latest; delete forged.viPresentation.bindings[first];
  assert.throws(() => compatibility.validate(forged));
});
