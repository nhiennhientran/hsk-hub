import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import legacy from '../src/domain/homework/engine.js';
import { getHomework30Bank } from '../src/services/content/homework30.ts';
import { createCompatibility } from '../src/services/storage/compatibility.ts';
import { createStore, STORAGE_KEY } from '../src/services/storage/index.ts';
const json = name => JSON.parse(readFileSync(new URL(name, import.meta.url), 'utf8'));
const oldBank = json('../content/stage2-bank.json');
const compatibility = createCompatibility(oldBank, json('../content/stage3-catalog.json'), json('../content/textbook.json'));
const candidate = json('./fixtures/homework30/unreleased-candidate-a63e647.json');
const at = 1790812800000;
function order(q) {
  function walk(indices, remainder) {
    if (indices.length === q.tokens.length) return remainder ? null : indices;
    for (let i = 0; i < q.tokens.length; i++) if (!indices.includes(i)) {
      const token = legacy.normal(q.tokens[i]);
      if (remainder.startsWith(token)) { const found = walk([...indices, i], remainder.slice(token.length)); if (found) return found; }
    }
    return null;
  }
  const found = walk([], legacy.normal(q.answers[0])); assert.ok(found, q.id); return found;
}
test('unreleased v1 candidate identity is rejected without silently regrading earlier submitted answers', () => {
  assert.equal(candidate.synthetic, true);
  assert.equal(candidate.sourceCommit, 'a63e64775345d3a155deb3bfdd0849803fa014b1');
  const oldAttempt = candidate.envelope.data.homework30.lessons['1'].choice.latest;
  assert.equal(oldAttempt.correct, 10); assert.equal(oldAttempt.total, 10);
  assert.ok(getHomework30Bank()[0].choice.some(q => oldAttempt.questionFingerprints[q.id] !== q.fingerprint), 'This regression must exercise a real content identity change');
  const snapshot = structuredClone(candidate.envelope.data);
  assert.throws(() => compatibility.validate(candidate.envelope.data));
  assert.deepEqual(candidate.envelope.data, snapshot, 'Rejected input must remain intact');
  const store = createStore({ storage: { getItem: () => null, setItem: () => assert.fail('Preview must not write') }, blank: compatibility.blank, validate: compatibility.validate, lock: async task => task(), now: () => at });
  const before = store.snapshot();
  assert.throws(() => store.previewBackup(JSON.stringify({ app: 'hsk1-modular-backup', schema: 1, exportedAt: at, data: snapshot })));
  assert.deepEqual(store.snapshot(), before);
});
test('a stale unreleased candidate primary remains byte-exact exportable and cannot be overwritten by save', async () => {
  const raw = JSON.stringify(candidate.envelope, null, 2) + '\n';
  const memory = new Map([[STORAGE_KEY, raw]]); let writes = 0;
  const store = createStore({ storage: { getItem: key => memory.get(key) ?? null, setItem: () => writes++ }, blank: compatibility.blank, validate: compatibility.validate, lock: async task => task(), now: () => at });
  assert.equal(store.snapshot().status, 'corrupt'); assert.equal(store.snapshot().canWrite, false);
  assert.equal(store.exportOriginal(), raw); assert.equal((await store.save()).code, 'corrupt');
  assert.equal(writes, 0); assert.equal(memory.get(STORAGE_KEY), raw); assert.equal(store.exportOriginal(), raw);
});
test('all 225 pre-v1 legacy homework submissions remain accepted with their original fingerprints and scores', () => {
  const old = compatibility.blank(); delete old.homework30;
  for (const lesson of oldBank.lessons) for (const part of ['choice', 'sort', 'translation']) {
    legacy.group(old.homework, lesson.lesson, part).draft = Object.fromEntries(lesson[part].map(q => [q.id, part === 'translation' ? `历史中文写作 · ${q.id}` : part === 'sort' ? order(q) : q.answer]));
    assert.equal(legacy.submit(old.homework, lesson.lesson, part, lesson[part], at).ok, true);
  }
  const before = structuredClone(old.homework), validated = compatibility.validate(old);
  assert.deepEqual(validated.homework, before); assert.equal(validated.homework30, undefined);
  assert.equal(legacy.courseTotals(validated.homework, oldBank.lessons).homework.submitted, 225);
  assert.equal(legacy.courseTotals(validated.homework, oldBank.lessons).automatic.firstCorrect, 150);
  assert.equal(legacy.courseTotals(validated.homework, oldBank.lessons).manual.submitted, 75);
});
