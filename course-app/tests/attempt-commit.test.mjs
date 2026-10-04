import test from 'node:test';
import assert from 'node:assert/strict';
import { commitCourseAttempt } from '../src/attempt-commit.ts';
import { createLearningStore, grade, recordAttempt } from '../src/state.ts';
import { configs } from '../src/config.ts';

function fixture(level, individual = false) {
  const config = configs[level], memory = new Map();
  let fail = false, held = false, release;
  const gate = new Promise(resolve => release = resolve);
  const storage = {
    getItem: key => memory.get(key) ?? null,
    setItem: (key, value) => {
      if (fail) throw new DOMException('quota fixture', 'QuotaExceededError');
      memory.set(key, value);
    },
  };
  const store = createLearningStore(config, storage, async action => {
    if (held) await gate;
    return action();
  });
  const q = {
    id: config.id + ':l01:q1', part: individual ? 'listening' : 'vocabGrammar',
    prompt: { zh: '当前题目', vi: 'Câu hiện tại' }, options: ['甲', '乙'], answer: 1,
    source: { printedPage: 1, pdfPage: 15, section: 'fixture', provenance: 'supplemental' }, focus: 'fixture',
  };
  const key = individual ? q.id + ':individual' : config.id + ':l01:vocabGrammar';
  const kind = individual ? 'listening' : 'homework';
  store.edit(state => {
    state.profile = { name: 'Saved learner', className: 'Old class' };
    const old = grade([{ ...q, prompt: { zh: '旧题目', vi: 'Câu cũ' } }], { [q.id]: 0 }, 10, state.profile);
    recordAttempt(state, key, old, kind);
    if (individual) state.listeningRound = {
      selected: [1], limit: 5, wrongOnly: false, queue: [q.id], index: 0,
      answers: { [q.id]: 1 }, submitted: {}, playCounts: { [q.id]: 2 }, startedAt: 20,
    };
    else state.drafts[key] = { answers: { [q.id]: 1 }, updatedAt: 20 };
  });
  const attempt = grade([q], { [q.id]: 1 }, 30, store.snapshot().data.profile);
  const round = individual ? store.snapshot().data.listeningRound : undefined;
  return {
    store, config, storage, q, key, kind, attempt, round, memory,
    fail: value => fail = value, hold: () => held = true,
    release: () => { held = false; release(); },
    raw: () => memory.get(config.storageKey),
    disk: () => JSON.parse(memory.get(config.storageKey)).data,
    commit: signal => commitCourseAttempt(store, key, attempt, kind, signal, () => false, round),
  };
}

for (const level of [2, 3]) for (const individual of [false, true]) {
  const label = `HSK${level} ${individual ? 'individual listening' : 'homework'}`;
  test(label + ' quota rejection leaves receipts out of the live draft and later ordinary saves', async () => {
    const f = fixture(level, individual);
    await f.store.save();
    const before = f.store.snapshot().data, raw = f.raw();
    f.fail(true);
    assert.equal(await f.commit(new AbortController().signal), false);
    assert.deepEqual(f.store.snapshot().data, before);
    assert.equal(f.raw(), raw);
    f.fail(false);
    f.store.edit(state => state.favorites.push(f.config.id + ':word:fixture'));
    assert.equal((await f.store.save()).ok, true);
    assert.deepEqual(f.disk()[f.kind][f.key], before[f.kind][f.key]);
    if (individual) assert.deepEqual(f.disk().listeningRound.submitted, {});
    else assert.deepEqual(f.disk().drafts[f.key], before.drafts[f.key]);
  });
  test(label + ' waits without an adopted receipt and confirms exactly one immutable attempt', async () => {
    const f = fixture(level, individual);
    await f.store.save();
    const before = f.store.snapshot().data, raw = f.raw();
    f.hold();
    const pending = f.commit(new AbortController().signal);
    assert.deepEqual(f.store.snapshot().data, before);
    assert.equal(f.raw(), raw);
    f.release();
    assert.equal(await pending, true);
    const history = f.disk()[f.kind][f.key];
    assert.equal(history.submissions, before[f.kind][f.key].submissions + 1);
    assert.deepEqual(history.first, before[f.kind][f.key].first);
    assert.deepEqual(history.latest, f.attempt);
    if (individual) assert.deepEqual(f.disk().listeningRound.submitted[f.q.id], f.attempt);
    else assert.equal(f.disk().drafts[f.key], undefined);
    const reload = createLearningStore(f.config, f.storage, async action => action());
    assert.deepEqual(reload.snapshot().data[f.kind][f.key], history);
  });
  test(label + ' cancelled lock wait cannot reappear in a later draft save', async () => {
    const f = fixture(level, individual);
    await f.store.save();
    const before = f.store.snapshot().data;
    f.hold();
    const controller = new AbortController(), pending = f.commit(controller.signal);
    controller.abort(); f.release();
    assert.equal(await pending, false);
    assert.equal((await f.store.save()).ok, true);
    assert.deepEqual(f.disk(), before);
  });
  test(label + ' newer answer during a lock wait wins without a submission', async () => {
    const f = fixture(level, individual);
    await f.store.save();
    const old = f.disk()[f.kind][f.key];
    f.hold();
    const pending = f.commit(new AbortController().signal);
    f.store.edit(state => {
      if (individual) state.listeningRound.answers[f.q.id] = 0;
      else state.drafts[f.key].answers[f.q.id] = 0;
    });
    f.release();
    assert.equal(await pending, false);
    assert.equal((await f.store.save()).ok, true);
    assert.deepEqual(f.disk()[f.kind][f.key], old);
    assert.equal(individual ? f.disk().listeningRound.answers[f.q.id] : f.disk().drafts[f.key].answers[f.q.id], 0);
    if (individual) assert.deepEqual(f.disk().listeningRound.submitted, {});
  });
}

test('individual listening rejects stale rounds, answers and already submitted questions', async () => {
  const f = fixture(2, true), signal = new AbortController().signal;
  await f.store.save();
  const raw = f.raw();
  for (const change of [r => r.startedAt++, r => r.queue.push(f.config.id + ':l02:q1'), r => r.index++]) {
    const stale = structuredClone(f.round); change(stale);
    assert.equal(await commitCourseAttempt(f.store, f.key, f.attempt, f.kind, signal, () => false, stale), false);
    assert.equal(f.raw(), raw);
  }
  assert.equal(await commitCourseAttempt(f.store, f.key, f.attempt, f.kind, signal, () => true, f.round), false);
  f.store.edit(state => state.profile.name = 'Changed learner');
  assert.equal(await f.commit(signal), false);
  f.store.edit(state => state.profile = structuredClone(f.attempt.profile));
  assert.equal(await f.commit(signal), true);
  const accepted = f.raw();
  assert.equal(await f.commit(signal), false);
  assert.equal(f.raw(), accepted);
});

test('an unavailable write lock never adopts a homework receipt', async () => {
  const f = fixture(3);
  await f.store.save();
  const before = f.disk(), noLock = createLearningStore(f.config, f.storage);
  assert.equal(await commitCourseAttempt(noLock, f.key, f.attempt, f.kind, new AbortController().signal), false);
  assert.deepEqual(noLock.snapshot().data, before);
  assert.deepEqual(f.disk(), before);
});
