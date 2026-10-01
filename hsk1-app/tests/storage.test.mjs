import test from 'node:test';
import assert from 'node:assert/strict';
import {createStore, STORAGE_KEY} from '../src/services/storage/index.ts';

const stamp = 1_790_856_000_000;
const clone = value => structuredClone(value);
const isRecord = value => !!value && typeof value === 'object' && !Array.isArray(value);

// A nonempty manual submission and a different unfinished draft make data loss visible.
function learningData(label = 'original') {
  return {
    schema: 1,
    label,
    profile: {name: 'Học viên thử nghiệm', className: 'Lớp 3'},
    homework: {
      first: {assessment: 'manual', answers: {q3: '首次提交 A\n你好，我是学生。'}, correct: null, results: null, at: stamp - 20},
      latest: {assessment: 'manual', answers: {q3: '最近提交 A\n我在学习汉语。'}, correct: null, results: null, at: stamp - 10},
      draft: {q3: `重做草稿 B\n${label}：今天还没有提交。`},
      completed: true,
    },
  };
}

function validateLearning(value) {
  if (!isRecord(value) || value.schema !== 1 || typeof value.label !== 'string' ||
      Object.keys(value).some(key => !['schema', 'label', 'profile', 'homework'].includes(key)) ||
      !isRecord(value.profile) || typeof value.profile.name !== 'string' || typeof value.profile.className !== 'string' ||
      !isRecord(value.homework) || !isRecord(value.homework.draft) || typeof value.homework.draft.q3 !== 'string' ||
      typeof value.homework.completed !== 'boolean') throw new Error('Invalid learning schema');
  for (const submission of [value.homework.first, value.homework.latest]) {
    if (!isRecord(submission) || submission.assessment !== 'manual' || !isRecord(submission.answers) ||
        typeof submission.answers.q3 !== 'string' || submission.correct !== null || submission.results !== null ||
        !Number.isSafeInteger(submission.at) || submission.at <= 0) throw new Error('Invalid manual submission');
  }
  return value;
}

function envelope(data = learningData(), recovery = null, revision = 7) {
  return JSON.stringify({app: 'hsk1-modular', schema: 1, revision, updatedAt: stamp, data, recovery});
}

function memoryStorage(raw = envelope()) {
  const values = new Map(raw === null ? [] : [[STORAGE_KEY, raw]]);
  const reads = [];
  const writes = [];
  return {
    values, reads, writes,
    getItem(key) { reads.push(key); return values.get(key) ?? null; },
    setItem(key, value) { writes.push([key, value]); values.set(key, value); },
  };
}

function serialLock() {
  let tail = Promise.resolve();
  return task => {
    const next = tail.then(task);
    tail = next.then(() => undefined, () => undefined);
    return next;
  };
}

function heldLock() {
  let enter, release;
  const entered = new Promise(resolve => { enter = resolve; });
  const barrier = new Promise(resolve => { release = resolve; });
  return {entered, release, lock: async task => { enter(); await barrier; return task(); }};
}

function makeStore(storage, overrides = {}) {
  return createStore({storage, blank: () => learningData('blank'), validate: validateLearning,
    now: () => stamp + 100, lock: serialLock(), ...overrides});
}

function exportedData(store) { return JSON.parse(store.exportBackup()).data; }

test('replacement and recovery commit in one write, never nest, and restore submitted A with draft B', async () => {
  const original = learningData();
  const imported = learningData('first import');
  const second = learningData('second import');
  const storage = memoryStorage(envelope(original));
  const store = makeStore(storage);
  assert.deepEqual(await store.confirm(store.previewReplacement(imported, 'import')), {ok: true, code: 'saved'});
  assert.equal(storage.writes.length, 1, 'current and recovery must use the same atomic record');
  const firstCommit = JSON.parse(storage.values.get(STORAGE_KEY));
  assert.deepEqual(firstCommit.data, imported);
  assert.deepEqual(firstCommit.recovery.data, original);
  assert.equal(firstCommit.recovery.reason, 'import');
  assert.equal(firstCommit.recovery.revision, 7);
  assert.equal('recovery' in firstCommit.recovery, false);

  assert.deepEqual(await store.confirm(store.previewReplacement(second, 'import')), {ok: true, code: 'saved'});
  const secondCommit = JSON.parse(storage.values.get(STORAGE_KEY));
  assert.equal(storage.writes.length, 2);
  assert.deepEqual(secondCommit.recovery.data, imported);
  assert.equal('recovery' in secondCommit.recovery, false);
  const restored = makeStore(storage);
  assert.deepEqual(await restored.restore(), {ok: true, code: 'saved'});
  assert.deepEqual(restored.snapshot().data, imported);
  assert.deepEqual(JSON.parse(storage.values.get(STORAGE_KEY)).recovery.data, second);
  assert.deepEqual(exportedData(restored).homework, imported.homework);
  assert.notEqual(imported.homework.first.answers.q3, imported.homework.latest.answers.q3);
  assert.notEqual(imported.homework.latest.answers.q3, imported.homework.draft.q3);
});

test('quota leaves original raw intact and exports the actual unsaved multiline draft', async () => {
  const raw = envelope();
  const storage = memoryStorage(raw);
  storage.setItem = (key, value) => { storage.writes.push([key, value]); throw new DOMException('full', 'QuotaExceededError'); };
  const store = makeStore(storage);
  store.edit(data => { data.homework.draft.q3 = '未保存的新草稿 B\n不要丢失我的输入。'; });
  assert.deepEqual(await store.save(), {ok: false, code: 'quota'});
  assert.equal(storage.values.get(STORAGE_KEY), raw);
  assert.equal(storage.writes.length, 1, 'no fallback write may discard recovery to force a save');
  assert.equal(store.snapshot().status, 'unsaved');
  assert.equal(exportedData(store).homework.draft.q3, '未保存的新草稿 B\n不要丢失我的输入。');
  assert.deepEqual(makeStore(memoryStorage(raw)).snapshot().data, learningData());
});

test('a denied import changes neither current data nor original raw, while its candidate remains exportable', async () => {
  const raw = envelope();
  const storage = memoryStorage(raw);
  const store = makeStore(storage);
  const candidate = learningData('pending import');
  const preview = store.previewReplacement(candidate, 'import');
  storage.setItem = (key, value) => { storage.writes.push([key, value]); throw new DOMException('denied', 'SecurityError'); };
  assert.deepEqual(await store.confirm(preview), {ok: false, code: 'write-unconfirmed'});
  assert.deepEqual(store.snapshot().data, learningData());
  assert.equal(storage.values.get(STORAGE_KEY), raw);
  assert.deepEqual(JSON.parse(store.exportPreview(preview)).data, candidate);
  assert.equal(storage.writes.length, 1);
});

test('read access denial and missing Web Locks prevent writes but allow exporting memory work', async () => {
  const denied = memoryStorage();
  denied.getItem = () => { throw new DOMException('denied', 'SecurityError'); };
  const unreadable = makeStore(denied);
  unreadable.edit(data => { data.homework.draft.q3 = '只在内存中的稿\n可以备份。'; });
  assert.deepEqual(await unreadable.save(), {ok: false, code: 'unavailable'});
  assert.equal(unreadable.snapshot().status, 'unavailable');
  assert.equal(exportedData(unreadable).homework.draft.q3, '只在内存中的稿\n可以备份。');
  assert.deepEqual(denied.writes, []);

  const storage = memoryStorage();
  const store = makeStore(storage, {lock: undefined});
  store.edit(data => { data.homework.draft.q3 = '没有安全锁\n仍可下载。'; });
  assert.deepEqual(await store.save(), {ok: false, code: 'lock-unavailable'});
  assert.equal(store.snapshot().canWrite, false);
  assert.equal(exportedData(store).homework.draft.q3, '没有安全锁\n仍可下载。');
  assert.deepEqual(storage.writes, []);
});

test('two cooperating tabs sharing a lock keep the first commit and reject the second without losing its draft', async () => {
  const storage = memoryStorage();
  const lock = serialLock();
  const tabA = makeStore(storage, {lock});
  const tabB = makeStore(storage, {lock});
  tabA.edit(data => { data.homework.draft.q3 = 'A 标签页\n第一份提交'; });
  tabB.edit(data => { data.homework.draft.q3 = 'B 标签页\n尚未保存'; });
  const [a, b] = await Promise.all([tabA.save(), tabB.save()]);
  assert.deepEqual(a, {ok: true, code: 'saved'});
  assert.deepEqual(b, {ok: false, code: 'conflict'});
  assert.equal(storage.writes.length, 1);
  assert.equal(JSON.parse(storage.values.get(STORAGE_KEY)).data.homework.draft.q3, 'A 标签页\n第一份提交');
  assert.equal(tabB.snapshot().status, 'conflict');
  assert.equal(exportedData(tabB).homework.draft.q3, 'B 标签页\n尚未保存');
  tabB.observeExternalChange();
  assert.equal(exportedData(tabB).homework.draft.q3, 'B 标签页\n尚未保存');
});

test('a preview expires after a local edit, including an edit while confirmation waits for the lock', async () => {
  const storage = memoryStorage();
  const barrier = heldLock();
  const store = makeStore(storage, {lock: barrier.lock});
  const preview = store.previewReplacement(learningData('imported'), 'import');
  const pending = store.confirm(preview);
  await barrier.entered;
  store.edit(data => { data.homework.draft.q3 = '预览后继续编辑\n这份稿必须保留。'; });
  barrier.release();
  assert.deepEqual(await pending, {ok: false, code: 'stale-preview'});
  assert.equal(exportedData(store).homework.draft.q3, '预览后继续编辑\n这份稿必须保留。');
  assert.deepEqual(storage.writes, []);
});

test('same revision with different raw is a conflict for preview confirmation and ordinary save', async () => {
  for (const action of ['confirm', 'save']) {
    const storage = memoryStorage();
    const barrier = heldLock();
    const store = makeStore(storage, {lock: barrier.lock});
    const preview = store.previewReplacement(learningData('candidate'), 'import');
    const pending = action === 'confirm' ? store.confirm(preview) : store.save();
    await barrier.entered;
    const foreign = envelope(learningData('other tab'), null, 7);
    storage.values.set(STORAGE_KEY, foreign);
    barrier.release();
    assert.deepEqual(await pending, {ok: false, code: 'conflict'}, action);
    assert.equal(storage.values.get(STORAGE_KEY), foreign, action);
    assert.deepEqual(storage.writes, [], action);
    assert.deepEqual(store.snapshot().data, learningData(), action);
  }
});

test('a preview held by the service is immune to mutation or fabrication by its caller', async () => {
  const storage = memoryStorage();
  const store = makeStore(storage);
  const original = learningData('candidate');
  const preview = store.previewReplacement(original, 'import');
  original.homework.draft.q3 = '源对象随后被改';
  preview.data.homework.draft.q3 = '预览显示对象随后被改';
  assert.throws(() => store.exportPreview({...preview}), /Không có bản xem trước/);
  assert.deepEqual(await store.confirm({...preview}), {ok: false, code: 'stale-preview'});
  assert.deepEqual(JSON.parse(store.exportPreview(preview)).data, learningData('candidate'));
  assert.deepEqual(await store.confirm(preview), {ok: true, code: 'saved'});
  assert.deepEqual(store.snapshot().data, learningData('candidate'));
  assert.deepEqual(await store.confirm(preview), {ok: false, code: 'stale-preview'});
  assert.equal(storage.writes.length, 1);
});

test('corrupt current JSON, app, schema, or recovery stays byte-for-byte exportable and cannot be overwritten', async () => {
  const nestedRecovery = {data: learningData(), revision: 6, updatedAt: stamp - 1, reason: 'import', recovery: null};
  for (const raw of ['{"broken":', envelope({...learningData(), schema: 2}),
    JSON.stringify({...JSON.parse(envelope()), app: 'some-other-app'}), envelope(learningData(), nestedRecovery)]) {
    const storage = memoryStorage(raw);
    const store = makeStore(storage);
    assert.equal(store.snapshot().status, 'corrupt');
    assert.equal(store.exportOriginal(), raw);
    store.edit(data => { data.homework.draft.q3 = '损坏记录旁边的内存稿\n不覆盖原记录。'; });
    assert.deepEqual(await store.save(), {ok: false, code: 'corrupt'});
    assert.throws(() => store.previewReplacement(learningData('replacement'), 'import'));
    assert.equal(exportedData(store).homework.draft.q3, '损坏记录旁边的内存稿\n不覆盖原记录。');
    assert.equal(store.exportOriginal(), raw);
    assert.equal(storage.values.get(STORAGE_KEY), raw);
    assert.deepEqual(storage.writes, []);
  }
});

test('invalid backup identity and learning schema reject before any write; backup excludes unrelated auth keys', () => {
  const storage = memoryStorage();
  storage.values.set('hsk_site_unlocked_v1', '1');
  storage.values.set('hsk_portal_unlocked_v2', '1');
  const store = makeStore(storage);
  const backup = JSON.parse(store.exportBackup());
  assert.equal(backup.app, 'hsk1-modular-backup');
  assert.deepEqual(backup.data, learningData());
  for (const malformed of ['{', JSON.stringify({...backup, app: 'hsk1-stage3'}),
    JSON.stringify({...backup, schema: 2}), JSON.stringify({...backup, exportedAt: 0}),
    JSON.stringify({...backup, data: {...backup.data, schema: 2}}),
    JSON.stringify({...backup, data: {...backup.data, hsk_portal_unlocked_v2: '1'}})]) {
    assert.throws(() => store.previewBackup(malformed));
  }
  assert.deepEqual(storage.writes, []);
  assert.equal(storage.values.get('hsk_site_unlocked_v1'), '1');
  assert.equal(storage.values.get('hsk_portal_unlocked_v2'), '1');
  assert.equal(storage.reads.every(key => key === STORAGE_KEY), true);
  assert.equal(store.exportBackup().includes('unlocked'), false);
});

test('queued save and confirmation cannot write or publish after disposal', async () => {
  for (const action of ['save', 'confirm']) {
    const raw = envelope();
    const storage = memoryStorage(raw);
    const barrier = heldLock();
    const store = makeStore(storage, {lock: barrier.lock});
    const preview = store.previewReplacement(learningData('candidate'), 'import');
    let notifications = 0;
    store.subscribe(() => { notifications++; });
    const pending = action === 'save' ? store.save() : store.confirm(preview);
    await barrier.entered;
    const beforeDisposal = notifications;
    store.dispose();
    barrier.release();
    assert.deepEqual(await pending, {ok: false, code: 'disposed'}, action);
    assert.equal(storage.values.get(STORAGE_KEY), raw, action);
    assert.deepEqual(storage.writes, [], action);
    assert.equal(notifications, beforeDisposal, action);
  }
});

test('a write that takes effect and then throws is accepted only after exact read-back confirmation', async () => {
  const storage = memoryStorage();
  storage.setItem = (key, value) => {
    storage.writes.push([key, value]); storage.values.set(key, value);
    throw new DOMException('adapter threw after writing', 'QuotaExceededError');
  };
  const store = makeStore(storage);
  store.edit(data => { data.homework.draft.q3 = '实际已经写入\n必须据实确认。'; });
  assert.deepEqual(await store.save(), {ok: true, code: 'saved'});
  assert.equal(store.snapshot().status, 'saved');
  assert.equal(storage.writes.length, 1);
  assert.deepEqual(makeStore(storage).snapshot().data, store.snapshot().data);
});

test('read-back denial never reports saved even when the attempted write may have reached storage', async () => {
  const storage = memoryStorage();
  let unreadable = false;
  storage.getItem = key => { if (unreadable) throw new DOMException('denied', 'SecurityError'); return storage.values.get(key) ?? null; };
  storage.setItem = (key, value) => { storage.writes.push([key, value]); storage.values.set(key, value); unreadable = true; };
  const store = makeStore(storage);
  store.edit(data => { data.homework.draft.q3 = '保存结果尚未确认\n仍需导出。'; });
  assert.deepEqual(await store.save(), {ok: false, code: 'write-unconfirmed'});
  assert.equal(store.snapshot().status, 'unsaved');
  assert.equal(exportedData(store).homework.draft.q3, '保存结果尚未确认\n仍需导出。');
  assert.equal(storage.writes.length, 1);
  unreadable = false;
  assert.equal(makeStore(storage).snapshot().data.homework.draft.q3, '保存结果尚未确认\n仍需导出。');
});

test('an unexpected third-party value is never rolled back after a failed write', async () => {
  const storage = memoryStorage();
  const foreign = envelope(learningData('foreign writer'), null, 8);
  storage.setItem = (key, value) => {
    storage.writes.push([key, value]); storage.values.set(key, foreign);
    throw new DOMException('unexpected adapter failure', 'SecurityError');
  };
  const store = makeStore(storage);
  store.edit(data => { data.homework.draft.q3 = '本标签页的稿\n冲突时也保留。'; });
  assert.deepEqual(await store.save(), {ok: false, code: 'conflict'});
  assert.equal(storage.values.get(STORAGE_KEY), foreign);
  assert.equal(storage.writes.length, 1, 'rollback would overwrite the foreign writer');
  assert.equal(exportedData(store).homework.draft.q3, '本标签页的稿\n冲突时也保留。');
});
