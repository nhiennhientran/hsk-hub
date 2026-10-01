import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createCompatibility } from '../src/services/storage/compatibility.ts';
import { createStore } from '../src/services/storage/index.ts';
import { createLearningSession } from '../src/services/learning/session.ts';
import { createReadingController } from '../src/services/learning/reading.ts';
const json = name => JSON.parse(readFileSync(new URL('../content/' + name + '.json', import.meta.url)));
const book = json('textbook');
const compatibility = createCompatibility(json('stage2-bank'), json('stage3-catalog'), book);
function setup() {
  const memory = new Map(); let requests = 0;
  const store = createStore({ storage: { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value) }, blank: compatibility.blank, validate: compatibility.validate, lock: async task => task() });
  const session = createLearningSession({ store, compatibility });
  const changed = session.requestSave;
  session.requestSave = () => { requests++; changed(); };
  const reading = (lesson, section) => createReadingController({ session, route: { feature: 'textbook', lesson, section }, words: book.lessons[lesson - 1].vocab, now: () => 1790860000000 });
  return { session, store, reading, requests: () => requests };
}
test('opening five textbook sections records visited sections and exact continuation, never completion or homework scores', async () => {
  const s = setup(), untouched = structuredClone(s.store.snapshot().data.homework);
  for (const section of ['vocab', 'text', 'grammar', 'hanzi', 'practice']) s.reading(10, section).visit();
  const model = s.reading(10, 'practice').read();
  assert.deepEqual(model.modules, ['vocab', 'text', 'grammar', 'hanzi', 'practice']);
  assert.equal(model.visited, true); assert.equal(model.complete, false);
  assert.deepEqual(model.navigation, { feature: 'textbook', lesson: 10, section: 'practice' });
  assert.deepEqual(s.store.snapshot().data.homework, untouched);
  await s.session.dispose();
});
test('same route visited again does not schedule another write or duplicate shared sections', async () => {
  const s = setup(), r = s.reading(1, 'text'); r.visit(); await s.session.flush();
  const revision = s.store.snapshot().revision, requests = s.requests();
  r.visit(); await s.session.flush();
  assert.equal(s.requests(), requests); assert.equal(s.store.snapshot().revision, revision);
  assert.deepEqual(r.read().modules, ['text']); await s.session.dispose();
});
test('lesson completion is an explicit independent mark and can be removed without resetting visits or submitted work', async () => {
  const s = setup(), r = s.reading(15, 'grammar'); r.visit();
  const homework = JSON.stringify(s.store.snapshot().data.homework);
  r.setComplete(true); assert.equal(r.read().complete, true);
  r.setComplete(false); assert.equal(r.read().complete, false); assert.equal(r.read().visited, true);
  assert.equal(JSON.stringify(s.store.snapshot().data.homework), homework);
  assert.equal(s.reading(1, 'vocab').read().visited, false); await s.session.dispose();
});
test('mastered word keys remain compatible and restore across a validated backup; unknown words are rejected', async () => {
  const s = setup(), r = s.reading(12, 'vocab'), word = book.lessons[11].vocab[0];
  r.setMastered(word, true); assert.equal(r.isMastered(word), true);
  assert.equal(s.store.snapshot().data.reading.mastered['12-' + word.zh], true);
  assert.throws(() => r.setMastered('未知测试词', true));
  const other = setup(); assert.equal((await other.store.confirm(other.store.previewBackup(s.store.exportBackup()))).ok, true);
  assert.equal(other.reading(12, 'vocab').isMastered(word), true);
  r.setMastered(word, false); assert.equal(r.isMastered(word), false);
  await s.session.dispose(); await other.session.dispose();
});
