import test from 'node:test';
import assert from 'node:assert/strict';
import { createRouter, normalizeRoute, parseRoute, routeHref, routeKey } from '../src/app/router.ts';

function fakeWindow(href) {
  let location = new URL(href);
  const entries = [{ href: location.href, state: null }];
  let index = 0;
  const handlers = new Map();
  const writes = [];
  const win = {
    get location() { return location; },
    history: {
      get state() { return entries[index].state; },
      pushState(state, title, href) {
        location = new URL(href, location);
        entries.splice(index + 1);
        entries.push({ href: location.href, state });
        index++;
        writes.push({ kind: 'push', href: location.href, state, title });
      },
      replaceState(state, title, href) {
        location = new URL(href, location);
        entries[index] = { href: location.href, state };
        writes.push({ kind: 'replace', href: location.href, state, title });
      },
    },
    addEventListener(type, listener) {
      if (!handlers.has(type)) handlers.set(type, new Set());
      handlers.get(type).add(listener);
    },
    removeEventListener(type, listener) { handlers.get(type)?.delete(listener); },
  };
  function dispatch(type) {
    for (const handler of [...(handlers.get(type) ?? [])]) handler({ type });
  }
  function travel(offset) {
    const next = index + offset;
    if (next < 0 || next >= entries.length) return;
    const before = location.hash;
    index = next;
    location = new URL(entries[index].href);
    dispatch('popstate');
    if (before !== location.hash) dispatch('hashchange');
  }
  return {
    win, writes, dispatch, back: () => travel(-1), forward: () => travel(1),
    setURL: href => { location = new URL(href, location); },
    listenerCount: type => handlers.get(type)?.size ?? 0,
    entryCount: () => entries.length,
  };
}

test('canonical hashes have highest priority and round-trip every route feature', () => {
  const examples = [
    { feature: 'home', lesson: 1 },
    { feature: 'textbook', lesson: 10, section: 'text' },
    { feature: 'homework', lesson: 10, part: 'sort' },
    { feature: 'listening', lesson: 15 },
    { feature: 'vocabulary', lesson: 3 },
    { feature: 'review', lesson: 2 },
    { feature: 'progress', lesson: 7 },
  ];
  for (const route of examples) {
    const href = routeHref(route);
    assert.deepEqual(parseRoute(`https://example.test/lesson.html?id=3&sec=grammar${href}`), route);
    assert.deepEqual(parseRoute(href), route);
    assert.equal(routeKey(route), href);
  }
  assert.equal(routeHref({ feature: 'textbook', lesson: 10, section: 'text' }), '#/textbook?lesson=10&section=text');
  assert.equal(routeHref({ feature: 'homework', lesson: 10, part: 'sort' }), '#/homework?lesson=10&part=sort');
  assert.deepEqual(parseRoute(new URL('https://example.test/?mode=review&lesson=2#/homework?lesson=10&part=translation')),
    { feature: 'homework', lesson: 10, part: 'translation' });
});

test('legacy mode, lesson pages, stages and integrated homework hashes are preserved', () => {
  const cases = [
    ['index.html', { feature: 'home', lesson: 1 }],
    ['learning.html', { feature: 'homework', lesson: 1, part: 'choice' }],
    ['learning-integrated.html?lesson=4', { feature: 'homework', lesson: 4, part: 'choice' }],
    ['learning.html?mode=vocab&lesson=10', { feature: 'vocabulary', lesson: 10 }],
    ['learning.html?mode=listening&lesson=2&stage=translation', { feature: 'listening', lesson: 2 }],
    ['learning.html?mode=homework&lesson=8&stage=sort', { feature: 'homework', lesson: 8, part: 'sort' }],
    ['learning.html?mode=homework&lesson=8&stage=sort#lesson=10&part=translation', { feature: 'homework', lesson: 10, part: 'translation' }],
    ['learning.html?mode=homework&lesson=8&stage=sort#part=translation', { feature: 'homework', lesson: 8, part: 'translation' }],
    ['learning.html?mode=vocab&lesson=8#lesson=10&part=translation', { feature: 'vocabulary', lesson: 8 }],
    ['lesson.html?id=3&sec=grammar', { feature: 'textbook', lesson: 3, section: 'grammar' }],
    ['lesson.html?id=4', { feature: 'textbook', lesson: 4, section: 'vocab' }],
    ['index.html?mode=review&lesson=6', { feature: 'review', lesson: 6 }],
  ];
  for (const [input, expected] of cases) assert.deepEqual(parseRoute(input), expected, input);
});

test('invalid route fields normalize safely and fields stay feature-specific', () => {
  for (const lesson of [undefined, 0, -1, 16, 2.5, NaN, Infinity, '3', null]) {
    assert.equal(normalizeRoute({ feature: 'homework', lesson }).lesson, 1);
  }
  assert.deepEqual(normalizeRoute({ feature: 'bogus', lesson: 4, section: 'grammar', part: 'sort' }), { feature: 'home', lesson: 4 });
  assert.deepEqual(normalizeRoute({ feature: 'textbook', lesson: 3, section: 'bogus', part: 'sort' }), { feature: 'textbook', lesson: 3, section: 'vocab' });
  assert.deepEqual(normalizeRoute({ feature: 'homework', lesson: 3, section: 'text', part: 'bogus' }), { feature: 'homework', lesson: 3, part: 'choice' });
  assert.deepEqual(normalizeRoute({ feature: 'listening', lesson: 3, section: 'text', part: 'sort' }), { feature: 'listening', lesson: 3 });
  for (const input of [
    '#/homework?lesson=abc&part=nope', '#/homework?lesson=16', '#/homework?lesson=-1',
    '#/homework?lesson=2.5', '#/homework?lesson=',
    'learning.html?lesson=999#lesson=nope&part=nope',
  ]) assert.deepEqual(parseRoute(input), { feature: 'homework', lesson: 1, part: 'choice' }, input);
  assert.deepEqual(parseRoute('lesson.html?id=nope&sec=nope'), { feature: 'textbook', lesson: 1, section: 'vocab' });
  assert.deepEqual(parseRoute('learning.html?mode=homework&lesson=8#/bogus?lesson=nope'), { feature: 'home', lesson: 1 });
  assert.deepEqual(parseRoute('http://['), { feature: 'home', lesson: 1 });
  assert.ok(Object.isFrozen(normalizeRoute({ feature: 'home', lesson: 1 })));
});

test('initial canonicalization replaces one entry only when the URL differs', () => {
  const legacy = fakeWindow('https://example.test/app/learning.html?mode=vocab&lesson=10');
  const router = createRouter(legacy.win);
  assert.deepEqual(router.current(), { feature: 'vocabulary', lesson: 10 });
  assert.equal(legacy.writes.length, 1);
  assert.equal(legacy.writes[0].kind, 'replace');
  assert.equal(legacy.win.location.href, 'https://example.test/app/learning.html#/vocabulary?lesson=10');
  assert.equal(legacy.entryCount(), 1);
  router.dispose();
  const canonical = fakeWindow('https://example.test/app/#/textbook?lesson=2&section=grammar');
  const canonicalRouter = createRouter(canonical.win);
  assert.equal(canonical.writes.length, 0);
  canonicalRouter.dispose();
  const reordered = fakeWindow('https://example.test/app/#/homework?part=sort&lesson=2');
  const reorderedRouter = createRouter(reordered.win);
  assert.equal(reordered.writes.length, 1);
  assert.equal(reordered.win.location.hash, '#/homework?lesson=2&part=sort');
  reorderedRouter.dispose();
});

test('500 equivalent navigations make zero writes; a changed route makes exactly one', () => {
  const fake = fakeWindow('https://example.test/app/#/homework?lesson=1&part=choice');
  const router = createRouter(fake.win);
  const updates = [];
  router.subscribe(route => updates.push(route));
  for (let index = 0; index < 500; index++) {
    router.navigate({ feature: 'homework', lesson: 1, section: 'grammar' }, { replace: index % 2 === 0 });
  }
  assert.equal(fake.writes.length, 0);
  assert.equal(updates.length, 0);
  router.navigate({ feature: 'homework', lesson: 10, part: 'translation' });
  assert.equal(fake.writes.length, 1);
  assert.equal(fake.writes[0].kind, 'push');
  assert.equal(updates.length, 1);
  assert.deepEqual(router.current(), { feature: 'homework', lesson: 10, part: 'translation' });
  assert.equal(router.href({ feature: 'textbook', lesson: 10 }), '#/textbook?lesson=10&section=vocab');
  router.navigate({ feature: 'textbook', lesson: 10, section: 'grammar' }, { replace: true });
  assert.equal(fake.writes.length, 2);
  assert.equal(fake.writes[1].kind, 'replace');
  assert.equal(fake.entryCount(), 2);
  router.dispose();
});

test('popstate/hashchange dedupe while back and forward restore the address route', () => {
  const fake = fakeWindow('https://example.test/app/#/home?lesson=1');
  const router = createRouter(fake.win);
  const updates = [];
  router.subscribe(route => updates.push(routeKey(route)));
  router.navigate({ feature: 'textbook', lesson: 3, section: 'grammar' });
  router.navigate({ feature: 'homework', lesson: 10, part: 'sort' });
  fake.back();
  assert.deepEqual(router.current(), { feature: 'textbook', lesson: 3, section: 'grammar' });
  fake.back();
  assert.deepEqual(router.current(), { feature: 'home', lesson: 1 });
  fake.forward();
  assert.deepEqual(router.current(), { feature: 'textbook', lesson: 3, section: 'grammar' });
  fake.forward();
  assert.deepEqual(router.current(), { feature: 'homework', lesson: 10, part: 'sort' });
  assert.deepEqual(updates, [
    '#/textbook?lesson=3&section=grammar', '#/homework?lesson=10&part=sort',
    '#/textbook?lesson=3&section=grammar', '#/home?lesson=1',
    '#/textbook?lesson=3&section=grammar', '#/homework?lesson=10&part=sort',
  ]);
  assert.equal(fake.writes.length, 2);
  fake.setURL('#/listening?lesson=5');
  assert.deepEqual(router.current(), { feature: 'listening', lesson: 5 });
  fake.dispatch('hashchange');
  fake.dispatch('popstate');
  assert.equal(updates.length, 7);
  fake.setURL('#/listening?section=grammar&lesson=5');
  fake.dispatch('hashchange');
  assert.equal(updates.length, 7);
  router.dispose();
});

test('unsubscribe and dispose release listeners and stop notifications/history writes', () => {
  const fake = fakeWindow('https://example.test/app/#/home?lesson=1');
  const router = createRouter(fake.win);
  let firstCalls = 0;
  let secondCalls = 0;
  const unsubscribe = router.subscribe(() => firstCalls++);
  router.subscribe(() => secondCalls++);
  assert.equal(fake.listenerCount('popstate'), 1);
  assert.equal(fake.listenerCount('hashchange'), 1);
  unsubscribe();
  unsubscribe();
  router.navigate({ feature: 'review', lesson: 2 });
  assert.equal(firstCalls, 0);
  assert.equal(secondCalls, 1);
  router.dispose();
  router.dispose();
  assert.equal(fake.listenerCount('popstate'), 0);
  assert.equal(fake.listenerCount('hashchange'), 0);
  fake.setURL('#/progress?lesson=7');
  fake.dispatch('popstate');
  fake.dispatch('hashchange');
  assert.equal(secondCalls, 1);
  router.navigate({ feature: 'homework', lesson: 3 });
  assert.equal(fake.writes.length, 1);
  assert.deepEqual(router.current(), { feature: 'progress', lesson: 7 });
  const afterDispose = router.subscribe(() => secondCalls++);
  afterDispose();
});

test('disposing during a notification stops remaining subscribers', () => {
  const fake = fakeWindow('https://example.test/app/#/home?lesson=1');
  const router = createRouter(fake.win);
  let calls = 0;
  router.subscribe(() => router.dispose());
  router.subscribe(() => calls++);
  router.navigate({ feature: 'textbook', lesson: 3 });
  assert.equal(calls, 0);
  assert.equal(fake.listenerCount('popstate'), 0);
  assert.equal(fake.listenerCount('hashchange'), 0);
});

test('navigation inside a subscriber does not deliver an obsolete route afterward', () => {
  const fake = fakeWindow('https://example.test/app/#/home?lesson=1');
  const router = createRouter(fake.win);
  const observed = [];
  router.subscribe(route => {
    if (route.feature === 'textbook') router.navigate({ feature: 'review', lesson: 3 });
  });
  router.subscribe(route => {
    observed.push(route.feature);
    assert.deepEqual(route, router.current());
  });
  router.navigate({ feature: 'textbook', lesson: 3 });
  assert.deepEqual(observed, ['review']);
  assert.deepEqual(router.current(), { feature: 'review', lesson: 3 });
  assert.equal(fake.writes.length, 2);
  router.dispose();
});
