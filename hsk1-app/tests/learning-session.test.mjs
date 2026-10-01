import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createStore, STORAGE_KEY } from '../src/services/storage/index.ts';
import { createCompatibility } from '../src/services/storage/compatibility.ts';
import { createLearningSession } from '../src/services/learning/session.ts';

const json = name => JSON.parse(readFileSync(new URL(`../content/${name}.json`, import.meta.url), 'utf8'));
const bank = json('stage2-bank');
const compatibility = createCompatibility(bank, json('stage3-catalog'), json('textbook'));
const stamp = 1_790_856_000_000;
const qid = bank.lessons[0].translation[0].id;
const turns = async () => { for (let index = 0; index < 8; index++) await Promise.resolve(); };

function timers() {
  let next = 0;
  const queued = new Map();
  return {
    setTimer(callback, delay) { const id = ++next; queued.set(id, { callback, delay }); return id; },
    clearTimer(id) { queued.delete(id); },
    get count() { return queued.size; },
    get delays() { return [...queued.values()].map(value => value.delay); },
    async fire() {
      const pending = [...queued.values()]; queued.clear();
      for (const { callback } of pending) callback();
      await turns();
    },
  };
}

function heldLock() {
  let release;
  const barrier = new Promise(resolve => { release = resolve; });
  let calls = 0;
  return { release, get calls() { return calls; }, lock: async task => { calls++; await barrier; return task(); } };
}

function makeSession(options = {}) {
  const values = new Map();
  const writes = [];
  let fail = false;
  const storage = {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, raw) {
      writes.push([key, raw]);
      if (fail) throw new DOMException('full', 'QuotaExceededError');
      values.set(key, raw);
    },
  };
  const clock = timers();
  const store = createStore({ storage, blank: compatibility.blank, validate: compatibility.validate,
    now: () => stamp, lock: options.lock ?? (async task => task()) });
  const session = createLearningSession({ store, compatibility, setTimer: clock.setTimer, clearTimer: clock.clearTimer });
  const edit = text => {
    store.edit(data => { data.homework.lessons['1'] ??= {};
      data.homework.lessons['1'].translation ??= { draft: {}, orders: {}, first: null, attempt: null, latest: null, completed: false, history: [] };
      data.homework.lessons['1'].translation.draft[qid] = text;
    });
    session.requestSave();
  };
  return { session, store, clock, storage, values, writes, edit, fail: value => { fail = value; } };
}

const persisted = setup => JSON.parse(setup.values.get(STORAGE_KEY)).data.homework.lessons['1'].translation.draft[qid];

test('opening or flushing a clean app does not create a learning record', async () => {
  const setup = makeSession();
  assert.equal(setup.store.snapshot().status, 'empty');
  assert.deepEqual(await setup.session.flush(), { ok: true, code: 'unchanged' });
  await setup.session.dispose();
  assert.equal(setup.writes.length, 0);
});

test('rapid edits keep the latest multiline Chinese in memory and debounce to one confirmed write', async () => {
  const setup = makeSession();
  const answer = '我正在学习汉语。\nBài dịch chưa nộp：你好吗？\n' + '中文与越语\n'.repeat(260);
  for (const text of ['中', '中文', answer]) setup.edit(text);
  assert.equal(setup.clock.count, 1);
  assert.deepEqual(setup.clock.delays, [300]);
  assert.equal(setup.writes.length, 0);
  assert.equal(setup.store.snapshot().data.homework.lessons['1'].translation.draft[qid], answer);
  await setup.clock.fire();
  await setup.session.flush();
  assert.equal(setup.writes.length, 1);
  assert.equal(persisted(setup), answer);
  assert.equal(setup.store.snapshot().status, 'saved');
  assert.equal(setup.clock.count, 0);
  await setup.session.dispose();
});

test('concurrent flush callers share a pending write and edits while waiting for the lock enter that write', async () => {
  const held = heldLock();
  const setup = makeSession({ lock: held.lock });
  setup.edit('排队前的稿');
  const first = setup.session.flush();
  assert.equal(setup.session.flush(), first);
  setup.edit('等锁时继续写\n完整的新稿');
  assert.equal(setup.session.flush(), first);
  assert.equal(held.calls, 1);
  held.release();
  await first;
  assert.equal(setup.writes.length, 1);
  assert.equal(persisted(setup), '等锁时继续写\n完整的新稿');
  assert.equal(setup.clock.count, 0);
  await setup.session.dispose();
});

test('an edit published immediately after a commit receives a second write without losing the newer draft', async () => {
  const setup = makeSession();
  let edited = false;
  const unsubscribe = setup.store.subscribe(() => {
    if (!edited && setup.store.snapshot().status === 'saved') {
      edited = true;
      setup.edit('提交存储回调之后的新稿\n仍要保存');
    }
  });
  setup.edit('第一稿');
  await setup.session.flush();
  assert.equal(setup.writes.length, 2);
  assert.equal(persisted(setup), '提交存储回调之后的新稿\n仍要保存');
  assert.equal(setup.store.snapshot().status, 'saved');
  unsubscribe();
  await setup.session.dispose();
});

test('quota failure stops automatic retries, preserves exportable memory work, and allows explicit retry', async () => {
  const setup = makeSession();
  setup.fail(true);
  setup.edit('本地保存失败\n切换到备份页仍要保留');
  assert.deepEqual(await setup.session.flush(), { ok: false, code: 'quota' });
  assert.equal(setup.writes.length, 1);
  assert.equal(setup.clock.count, 0);
  await setup.clock.fire();
  assert.equal(setup.writes.length, 1, 'a failed save must not start an automatic retry loop');
  assert.equal(JSON.parse(setup.store.exportBackup()).data.homework.lessons['1'].translation.draft[qid], '本地保存失败\n切换到备份页仍要保留');
  setup.fail(false);
  assert.deepEqual(await setup.session.flush(), { ok: true, code: 'saved' });
  assert.equal(setup.writes.length, 2);
  assert.equal(persisted(setup), '本地保存失败\n切换到备份页仍要保留');
  await setup.session.dispose();
});

test('dispose cancels its debounce timer and waits for the final lock before closing the shared store', async () => {
  const held = heldLock();
  const setup = makeSession({ lock: held.lock });
  setup.edit('离开应用前的最后一稿\n保留完整换行');
  const disposal = setup.session.dispose();
  assert.equal(setup.session.dispose(), disposal, 'application cleanup is idempotent');
  assert.equal(setup.clock.count, 0);
  assert.equal(setup.store.snapshot().canWrite, true, 'the final queued save must still be allowed');
  setup.session.requestSave();
  assert.equal(setup.clock.count, 0, 'a closed session accepts no new debounce tasks');
  held.release();
  await disposal;
  assert.equal(setup.writes.length, 1);
  assert.equal(persisted(setup), '离开应用前的最后一稿\n保留完整换行');
  assert.equal(setup.store.snapshot().canWrite, false);
  assert.throws(() => setup.store.edit(() => {}), /đã đóng/);
});

test('external conflict preserves memory and final flushing never overwrites another tab', async () => {
  const setup = makeSession();
  setup.edit('A 标签页已保存');
  await setup.session.flush();
  setup.edit('A 标签页未保存的新稿');
  const foreign = JSON.parse(setup.values.get(STORAGE_KEY));
  foreign.revision++;
  foreign.data.homework.lessons['1'].translation.draft[qid] = 'B 标签页已经保存';
  const foreignRaw = JSON.stringify(foreign);
  setup.values.set(STORAGE_KEY, foreignRaw);
  setup.store.observeExternalChange();
  assert.equal(setup.store.snapshot().status, 'conflict');
  assert.deepEqual(await setup.session.flush(), { ok: false, code: 'conflict' });
  assert.equal(setup.values.get(STORAGE_KEY), foreignRaw);
  assert.equal(JSON.parse(setup.store.exportBackup()).data.homework.lessons['1'].translation.draft[qid], 'A 标签页未保存的新稿');
  assert.equal(setup.writes.length, 1);
  await setup.session.dispose();
  assert.equal(setup.values.get(STORAGE_KEY), foreignRaw);
});

test('leaving a data view cancels its queued import or restore while the application session remains writable', async () => {
  for (const action of ['confirm', 'restore']) {
    let gate;
    const setup = makeSession({ lock: async task => gate ? gate.lock(task) : task() });
    setup.edit('当前共享稿');
    await setup.session.flush();
    const candidate = structuredClone(setup.store.snapshot().data);
    candidate.homework.profile.name = '待导入学生';
    if (action === 'restore') await setup.store.confirm(setup.store.previewReplacement(candidate, 'import'));
    const beforeRaw = setup.values.get(STORAGE_KEY);
    const beforeData = setup.store.snapshot().data;
    const beforeWrites = setup.writes.length;
    const view = new AbortController();
    gate = heldLock();
    const preview = action === 'confirm' ? setup.store.previewReplacement(candidate, 'import') : undefined;
    const pending = action === 'confirm' ? setup.store.confirm(preview, view.signal) : setup.store.restore(view.signal);
    assert.equal(gate.calls, 1, action);
    view.abort();
    gate.release();
    assert.deepEqual(await pending, { ok: false, code: 'cancelled' }, action);
    assert.equal(setup.values.get(STORAGE_KEY), beforeRaw, action);
    assert.deepEqual(setup.store.snapshot().data, beforeData, action);
    assert.equal(setup.writes.length, beforeWrites, action);
    assert.equal(setup.store.snapshot().canWrite, true, action);
    if (preview) assert.equal(JSON.parse(setup.store.exportPreview(preview)).data.homework.profile.name, '待导入学生');
    gate = undefined;
    setup.edit('切回作业后继续写\n共享会话仍可保存');
    assert.deepEqual(await setup.session.flush(), { ok: true, code: 'saved' }, action);
    assert.equal(persisted(setup), '切回作业后继续写\n共享会话仍可保存', action);
    assert.equal(setup.writes.length, beforeWrites + 1, action);
    await setup.session.dispose();
  }
});
