import test from 'node:test';
import assert from 'node:assert/strict';
import {createSessionAuth} from '../src/services/auth/index.ts';

const sessionKey = 'hsk_portal_unlocked_v2';
const aliases = [
  'hsk1_ranteacher_unlocked',
  'hsk_portal_unlocked',
  'hsk2_ranteacher_unlocked',
  'hsk3_ranteacher_unlocked',
  'hsk4_upper_ranteacher_unlocked',
  'hsk4_lower_ranteacher_unlocked',
];
const password = process.env.HSK_TEST_PASSWORD;
const requiresPassword = {skip: password ? false : 'Set HSK_TEST_PASSWORD to run the correct-password checks.'};

function storageFixture(initial = {}) {
  const values = new Map(Object.entries(initial));
  const reads = [];
  const writes = [];
  return {
    values,
    reads,
    writes,
    getItem(key) { reads.push(key); return values.get(key) ?? null; },
    setItem(key, value) { writes.push([key, value]); values.set(key, value); },
    removeItem(key) { values.delete(key); },
  };
}

const deniedStorage = {
  getItem() { throw new Error('Storage access denied'); },
  setItem() { throw new Error('Storage access denied'); },
  removeItem() { throw new Error('Storage access denied'); },
};

test('wrong and empty passwords cannot grant access or write any session key', async () => {
  const storage = storageFixture();
  const auth = createSessionAuth(storage);
  assert.equal(auth.isUnlocked(), false);
  for (const input of ['incorrect-auth-input', '', '   ']) {
    assert.deepEqual(await auth.unlock(input), {accepted: false, persisted: false});
    assert.equal(auth.isUnlocked(), false);
  }
  assert.deepEqual(storage.writes, []);
});

test('a v2 session is reused by a new service instance without extra writes', () => {
  const storage = storageFixture({[sessionKey]: '1'});
  assert.equal(createSessionAuth(storage).isUnlocked(), true);
  assert.equal(createSessionAuth(storage).isUnlocked(), true);
  assert.deepEqual(storage.writes, []);
  assert.deepEqual(storage.reads, [sessionKey, sessionKey]);
});

test('every legacy alias and obsolete local key fails to bypass v2 authorization', () => {
  for (const key of [...aliases, 'hsk_site_unlocked_v1']) {
    const storage = storageFixture({[key]: '1'});
    assert.equal(createSessionAuth(storage).isUnlocked(), false, key);
    assert.deepEqual(storage.reads, [sessionKey]);
    assert.deepEqual(storage.writes, []);
  }
  for (const value of ['', '0', 'true', '2']) {
    assert.equal(createSessionAuth(storageFixture({[sessionKey]: value})).isUnlocked(), false);
  }
});

test('a development hostname does not bypass the session gate', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'location');
  Object.defineProperty(globalThis, 'location', {configurable: true, value: {hostname: 'terminal.local'}});
  try {
    assert.equal(createSessionAuth(storageFixture()).isUnlocked(), false);
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'location', descriptor);
    else delete globalThis.location;
  }
});

test('storage exceptions do not imply authorization and wrong passwords remain rejected', async () => {
  const auth = createSessionAuth(deniedStorage);
  assert.equal(auth.isUnlocked(), false);
  assert.deepEqual(await auth.unlock('incorrect-auth-input'), {accepted: false, persisted: false});
  assert.equal(auth.isUnlocked(), false);
});

test('correct password writes the original v2 key and complete session aliases', requiresPassword, async () => {
  const storage = storageFixture();
  const auth = createSessionAuth(storage);
  assert.deepEqual(await auth.unlock(`  ${password}  `), {accepted: true, persisted: true});
  assert.equal(auth.isUnlocked(), true);
  assert.deepEqual(storage.writes, [sessionKey, ...aliases].map(key => [key, '1']));
  assert.equal(createSessionAuth(storage).isUnlocked(), true);
});

test('correct password allows only this instance when storage is denied', requiresPassword, async () => {
  const auth = createSessionAuth(deniedStorage);
  assert.deepEqual(await auth.unlock(password), {accepted: true, persisted: false});
  assert.equal(auth.isUnlocked(), true);
  assert.equal(createSessionAuth(deniedStorage).isUnlocked(), false);
});

test('correct password reports a failed persistence read without losing memory access', requiresPassword, async () => {
  const storage = storageFixture();
  storage.getItem = () => { throw new Error('Storage read denied'); };
  const auth = createSessionAuth(storage);
  assert.deepEqual(await auth.unlock(password), {accepted: true, persisted: false});
  assert.equal(auth.isUnlocked(), true);
  assert.equal(createSessionAuth(storage).isUnlocked(), false);
});

for (const [name, crypto] of [
  ['WebCrypto is unavailable', undefined],
  ['SubtleCrypto is unavailable', {}],
  ['WebCrypto digest throws', {subtle: {digest() { throw new Error('Digest unavailable'); }}}],
  ['WebCrypto digest rejects', {subtle: {digest() { return Promise.reject(new Error('Digest unavailable')); }}}],
]) {
  test(`password verification fails closed when ${name}`, requiresPassword, async () => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
    Object.defineProperty(globalThis, 'crypto', {configurable: true, value: crypto});
    try {
      const storage = storageFixture();
      const auth = createSessionAuth(storage);
      for (const input of ['incorrect-auth-input', password, `  ${password}  `]) {
        assert.deepEqual(await auth.unlock(input), {accepted: false, persisted: false, reason: 'unsupported-crypto'});
        assert.equal(auth.isUnlocked(), false);
      }
      for (const input of ['', '   ']) {
        assert.deepEqual(await auth.unlock(input), {accepted: false, persisted: false});
        assert.equal(auth.isUnlocked(), false);
      }
      assert.deepEqual(storage.writes, []);
      const existing = storageFixture({[sessionKey]: '1'});
      assert.equal(createSessionAuth(existing).isUnlocked(), true);
      assert.deepEqual(existing.writes, []);
    } finally {
      if (descriptor) Object.defineProperty(globalThis, 'crypto', descriptor);
      else delete globalThis.crypto;
    }
  });
}
