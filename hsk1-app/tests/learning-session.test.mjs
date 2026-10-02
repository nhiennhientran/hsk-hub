import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createStore, STORAGE_KEY } from '../src/services/storage/index.ts';
import { createCompatibility } from '../src/services/storage/compatibility.ts';
import { bindUnsavedExit, createLearningSession } from '../src/services/learning/session.ts';

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

test('the single exit guard collects a DOM-only tail before checking dirty state and coalesces repeated exit attempts', async () => {
  let gate;
  const setup = makeSession({ lock: async task => gate ? gate.lock(task) : task() });
  setup.edit('已保存的输入'); await setup.session.flush();
  assert.equal(setup.store.snapshot().hasUnsavedChanges, false);
  const target = new EventTarget();
  // The native listener exists before the view registers its collector.
  const cleanup = bindUnsavedExit(target, setup.session);
  let collections = 0, visibleText = '尚未发送 input 事件的中文尾部';
  const removeDraft = setup.session.registerExitDraft(() => {
    collections++;
    const current = setup.store.snapshot().data.homework.lessons['1'].translation.draft[qid];
    if (current !== visibleText) setup.edit(visibleText);
    return false;
  });
  gate = heldLock();
  for (let attempt = 0; attempt < 2; attempt++) {
    const event = new Event('beforeunload', { cancelable: true });
    target.dispatchEvent(event);
    assert.equal(event.defaultPrevented, true);
  }
  assert.equal(collections, 2, 'exactly one collection per exit attempt');
  assert.equal(gate.calls, 1, 'repeated exits share the same pending locked save');
  assert.equal(setup.writes.length, 1, 'no exit write bypasses the lock');
  assert.equal(persisted(setup), '已保存的输入');
  assert.equal(setup.store.snapshot().data.homework.lessons['1'].translation.draft[qid], visibleText);
  gate.release(); await setup.session.flush();
  assert.equal(setup.writes.length, 2);
  assert.equal(persisted(setup), visibleText);
  const savedExit = new Event('beforeunload', { cancelable: true });
  target.dispatchEvent(savedExit);
  assert.equal(savedExit.defaultPrevented, false);
  assert.equal(setup.writes.length, 2, 'unchanged collection does not create another write');
  removeDraft(); removeDraft(); visibleText = '卸载后的旧 DOM';
  assert.equal(setup.session.prepareExit(), false);
  assert.equal(collections, 3);
  cleanup(); await setup.session.dispose();
});

test('an invalid DOM-only draft warns even when the store is clean without inventing a persisted draft', async () => {
  const setup = makeSession(), target = new EventTarget();
  const cleanup = bindUnsavedExit(target, setup.session);
  const removeDraft = setup.session.registerExitDraft(() => true);
  const invalidExit = new Event('beforeunload', { cancelable: true });
  target.dispatchEvent(invalidExit);
  assert.equal(invalidExit.defaultPrevented, true);
  assert.equal(setup.store.snapshot().hasUnsavedChanges, false);
  assert.equal(setup.writes.length, 0);
  removeDraft();
  const cleanExit = new Event('beforeunload', { cancelable: true });
  target.dispatchEvent(cleanExit);
  assert.equal(cleanExit.defaultPrevented, false);
  cleanup(); await setup.session.dispose();
});

test('only the current exit collector runs; stale unsubscribe and disposal cannot revive or clear another registration', async () => {
  const setup = makeSession();
  let oldCalls = 0, currentCalls = 0;
  const removeOld = setup.session.registerExitDraft(() => { oldCalls++; return true; });
  const current = () => { currentCalls++; return false; };
  const removeFirst = setup.session.registerExitDraft(current);
  const removeSecond = setup.session.registerExitDraft(current);
  removeOld(); removeFirst(); removeFirst();
  assert.equal(setup.session.prepareExit(), false);
  assert.equal(oldCalls, 0);
  assert.equal(currentCalls, 1, 'same function re-registration has its own ownership');
  removeSecond();
  assert.equal(setup.session.prepareExit(), false);
  assert.equal(currentCalls, 1);
  setup.session.registerExitDraft(current);
  await setup.session.dispose();
  assert.equal(setup.session.prepareExit(), false);
  setup.session.registerExitDraft(current)();
  assert.equal(setup.session.prepareExit(), false);
  assert.equal(currentCalls, 1, 'closed sessions retain no collector');
});

test('an exit collector failure cannot silently permit abandoning visible input', async () => {
  const setup = makeSession(), target = new EventTarget();
  setup.session.registerExitDraft(() => { throw new Error('Draft collection failed'); });
  const cleanup = bindUnsavedExit(target, setup.session);
  const event = new Event('beforeunload', { cancelable: true });
  target.dispatchEvent(event);
  assert.equal(event.defaultPrevented, true);
  assert.equal(setup.writes.length, 0);
  cleanup(); await setup.session.dispose();
});

test('beforeunload protects an unsaved draft while its normal locked flush is pending, and saved state does not prompt', async () => {
  const held = heldLock();
  const setup = makeSession({ lock: held.lock });
  const target = new EventTarget();
  let flushes = 0;
  const cleanup = bindUnsavedExit(target, { store: setup.store, prepareExit: setup.session.prepareExit,
    flush() { flushes++; return setup.session.flush(); } });
  const emptyExit = new Event('beforeunload', { cancelable: true });
  target.dispatchEvent(emptyExit);
  assert.equal(emptyExit.defaultPrevented, false);
  assert.equal(flushes, 0);
  setup.edit('立即刷新之前的最后稿');
  const dirtyExit = new Event('beforeunload', { cancelable: true });
  target.dispatchEvent(dirtyExit);
  assert.equal(dirtyExit.defaultPrevented, true);
  assert.equal(flushes, 1);
  assert.equal(held.calls, 1);
  assert.equal(setup.clock.count, 0);
  assert.equal(setup.writes.length, 0, 'exit protection must never bypass the queued Web Lock');
  assert.equal(setup.store.snapshot().hasUnsavedChanges, true);
  held.release();
  await setup.session.flush();
  assert.equal(persisted(setup), '立即刷新之前的最后稿');
  const savedExit = new Event('beforeunload', { cancelable: true });
  target.dispatchEvent(savedExit);
  assert.equal(savedExit.defaultPrevented, false);
  assert.equal(flushes, 1);
  cleanup(); cleanup();
  setup.edit('移除保护监听之后的草稿');
  const disposedExit = new Event('beforeunload', { cancelable: true });
  target.dispatchEvent(disposedExit);
  assert.equal(disposedExit.defaultPrevented, false);
  assert.equal(flushes, 1, 'cleanup must detach the listener');
  await setup.session.dispose();
});

test('failed saves keep exit protection active and an explicit discard reload clears it', async () => {
  const setup = makeSession();
  const target = new EventTarget();
  const cleanup = bindUnsavedExit(target, setup.session);
  setup.fail(true); setup.edit('容量不足但仍需保护的稿');
  assert.deepEqual(await setup.session.flush(), { ok: false, code: 'quota' });
  const failedExit = new Event('beforeunload', { cancelable: true });
  target.dispatchEvent(failedExit);
  assert.equal(failedExit.defaultPrevented, true);
  assert.deepEqual(await setup.session.flush(), { ok: false, code: 'quota' });
  assert.equal(setup.store.snapshot().hasUnsavedChanges, true);
  assert.equal(JSON.parse(setup.store.exportBackup()).data.homework.lessons['1'].translation.draft[qid], '容量不足但仍需保护的稿');
  setup.store.reloadDiscardingDraft();
  const discardedExit = new Event('beforeunload', { cancelable: true });
  target.dispatchEvent(discardedExit);
  assert.equal(discardedExit.defaultPrevented, false);
  cleanup(); await setup.session.dispose();
});

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
