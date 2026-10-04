import test from 'node:test';
import assert from 'node:assert/strict';
import { createLifecycle } from '../src/app/lifecycle.ts';

class Element {
  constructor(tagName, ownerDocument) {
    this.tagName = tagName.toUpperCase();
    this.ownerDocument = ownerDocument;
    this.attributes = new Map();
    this.children = [];
    this.parent = null;
    this.inert = false;
    this.disabled = false;
  }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  removeAttribute(name) { this.attributes.delete(name); }
  appendChild(child) {
    child.remove();
    child.parent = this;
    this.children.push(child);
    return child;
  }
  replaceChildren(...children) {
    for (const child of [...this.children]) child.remove();
    for (const child of children) this.appendChild(child);
  }
  remove() {
    if (this.parent) {
      this.parent.children = this.parent.children.filter(child => child !== this);
      this.parent = null;
    }
  }
  querySelectorAll(selector) {
    assert.equal(selector, 'fieldset[data-module-controls]');
    return this.children.flatMap(child => [
      ...(child.tagName === 'FIELDSET' && child.attributes.has('data-module-controls') ? [child] : []),
      ...child.querySelectorAll(selector),
    ]);
  }
}

function host() {
  const document = { createElement: tag => new Element(tag, document) };
  return document.createElement('main');
}
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const turn = () => new Promise(resolve => setImmediate(resolve));
const route = (feature, lesson = 1) => ({ feature, lesson });
const readyModule = () => ({ mount: () => ({ ready: Promise.resolve(), unmount() {} }) });

test('loading gates module fieldsets until ready and preserves individual button rules', async () => {
  const main = host(), ready = deferred(), states = [];
  const target = route('textbook', 3);
  let surface, fieldset, button, context;
  const navigate = () => {};
  const lifecycle = createLifecycle({
    host: main,
    navigate,
    onState: status => states.push(status),
    loadModule: async () => ({ mount: (element, value) => {
      surface = element; context = value;
      fieldset = element.ownerDocument.createElement('fieldset');
      fieldset.setAttribute('data-module-controls', '');
      button = element.ownerDocument.createElement('button');
      button.disabled = true;
      fieldset.appendChild(button);
      element.appendChild(fieldset);
      return { ready: ready.promise, unmount() {} };
    } }),
  });
  const showing = lifecycle.show(target);
  assert.equal(main.getAttribute('data-state'), 'loading');
  assert.equal(main.getAttribute('aria-busy'), 'true');
  assert.equal(main.inert, true);
  await turn();
  assert.notEqual(surface, main);
  assert.equal(surface.parent, main);
  assert.equal(context.route, target);
  assert.equal(context.navigate, navigate);
  assert.equal(fieldset.disabled, true);
  ready.resolve();
  await showing;
  assert.deepEqual(states.map(state => state.state), ['loading', 'ready']);
  assert.equal(main.getAttribute('aria-busy'), 'false');
  assert.equal(main.inert, false);
  assert.equal(fieldset.disabled, false);
  assert.equal(button.disabled, true);
  lifecycle.dispose();
});

test('a new route synchronously aborts and unmounts the old module', async () => {
  const main = host(), imported = deferred(), states = [], events = [];
  let oldSurface;
  const lifecycle = createLifecycle({
    host: main,
    navigate() {},
    onState: status => states.push(status),
    loadModule: async feature => feature === 'home' ? { mount: (element, context) => {
      oldSurface = element;
      context.signal.addEventListener('abort', () => events.push('abort'));
      return { ready: Promise.resolve(), unmount: () => events.push('unmount') };
    } } : imported.promise,
  });
  await lifecycle.show(route('home'));
  const next = lifecycle.show(route('textbook'));
  assert.deepEqual(events, ['abort', 'unmount']);
  assert.equal(oldSurface.parent, null);
  assert.equal(main.children.length, 1);
  assert.notEqual(main.children[0], oldSurface);
  assert.equal(states.at(-1).state, 'loading');
  imported.resolve(readyModule());
  await next;
  lifecycle.dispose();
});

test('a late importer cannot mount or replace the current surface', async () => {
  const main = host(), imported = deferred(), states = [];
  let oldSignal, oldMounts = 0;
  const lifecycle = createLifecycle({
    host: main,
    navigate() {},
    onState: status => states.push(status),
    loadModule: (feature, signal) => {
      if (feature === 'home') { oldSignal = signal; return imported.promise; }
      return Promise.resolve(readyModule());
    },
  });
  const old = lifecycle.show(route('home'));
  await lifecycle.show(route('textbook'));
  await old;
  const current = main.children[0], count = states.length;
  assert.equal(oldSignal.aborted, true);
  imported.resolve({ mount() { oldMounts++; throw new Error('must not mount'); } });
  await turn();
  assert.equal(oldMounts, 0);
  assert.equal(main.children[0], current);
  assert.equal(states.length, count);
  lifecycle.dispose();
});

test('a late ready and old surface writes cannot affect the new module', async () => {
  const main = host(), ready = deferred(), states = [];
  let oldSurface, oldSignal, unmounts = 0;
  const lifecycle = createLifecycle({
    host: main,
    navigate() {},
    onState: status => states.push(status),
    loadModule: async feature => feature === 'home' ? { mount: (element, context) => {
      oldSurface = element; oldSignal = context.signal;
      return { ready: ready.promise, unmount: () => unmounts++ };
    } } : readyModule(),
  });
  const old = lifecycle.show(route('home'));
  await turn();
  await lifecycle.show(route('textbook'));
  await old;
  const current = main.children[0], count = states.length;
  oldSurface.replaceChildren(main.ownerDocument.createElement('aside'));
  ready.resolve();
  await turn();
  assert.equal(oldSignal.aborted, true);
  assert.equal(unmounts, 1);
  assert.equal(oldSurface.parent, null);
  assert.equal(main.children[0], current);
  assert.equal(states.length, count);
  assert.equal(states.at(-1).state, 'ready');
  lifecycle.dispose();
});

test('late rejected import and ready promises stay observed after cancellation', async () => {
  const main = host(), imported = deferred(), ready = deferred(), states = [], unhandled = [];
  const record = error => unhandled.push(error);
  process.on('unhandledRejection', record);
  const lifecycle = createLifecycle({
    host: main,
    navigate() {},
    onState: status => states.push(status),
    loadModule: async feature => {
      if (feature === 'home') return imported.promise;
      if (feature === 'textbook') return { mount: () => ({ ready: ready.promise, unmount() {} }) };
      return readyModule();
    },
  });
  try {
    const first = lifecycle.show(route('home'));
    const second = lifecycle.show(route('textbook'));
    await turn();
    await lifecycle.show(route('review'));
    await Promise.all([first, second]);
    const count = states.length;
    imported.reject(new Error('late import failure'));
    ready.reject(new Error('late ready failure'));
    await turn();
    assert.deepEqual(unhandled, []);
    assert.equal(states.length, count);
    assert.equal(states.at(-1).route.feature, 'review');
  } finally {
    lifecycle.dispose();
    process.off('unhandledRejection', record);
  }
});

test('import and ready failures clean up and retry the latest route', async () => {
  const main = host(), states = [], readyError = new Error('first render failed');
  const target = route('listening', 7);
  let loads = 0, unmounts = 0, signal;
  const lifecycle = createLifecycle({
    host: main,
    navigate() {},
    onState: status => states.push(status),
    loadModule: async () => {
      loads++;
      if (loads === 1) throw new Error('import failed');
      if (loads === 2) return { mount: (_element, context) => {
        signal = context.signal;
        return { ready: Promise.reject(readyError), unmount: () => unmounts++ };
      } };
      return readyModule();
    },
  });
  await lifecycle.show(target);
  assert.equal(states.at(-1).state, 'error');
  assert.equal(main.children.length, 0);
  assert.equal(main.inert, false);
  assert.equal(main.getAttribute('aria-busy'), 'false');
  await lifecycle.retry();
  assert.equal(states.at(-1).error, readyError);
  assert.equal(unmounts, 1);
  assert.equal(signal.aborted, true);
  assert.equal(main.children.length, 0);
  await lifecycle.retry();
  assert.equal(loads, 3);
  assert.equal(states.at(-1).state, 'ready');
  assert.equal(states.at(-1).route, target);
  lifecycle.dispose();
});

test('a throwing unmount blocks the next mount and remains available for retry', async () => {
  const main = host(), states = [], cleanupError = new Error('cleanup incomplete');
  let unmounts = 0, nextLoads = 0, oldSignal;
  const lifecycle = createLifecycle({
    host: main,
    navigate() {},
    onState: status => states.push(status),
    loadModule: async feature => {
      if (feature !== 'home') { nextLoads++; return readyModule(); }
      return { mount: (_element, context) => {
        oldSignal = context.signal;
        return { ready: Promise.resolve(), unmount() {
          unmounts++;
          if (unmounts === 1) throw cleanupError;
        } };
      } };
    },
  });
  await lifecycle.show(route('home'));
  const target = route('vocabulary');
  await lifecycle.show(target);
  assert.equal(oldSignal.aborted, true);
  assert.equal(unmounts, 1);
  assert.equal(nextLoads, 0);
  assert.equal(main.children.length, 0);
  assert.equal(states.at(-1).state, 'error');
  assert.equal(states.at(-1).error, cleanupError);
  assert.equal(states.at(-1).route, target);
  await lifecycle.retry();
  assert.equal(unmounts, 2);
  assert.equal(nextLoads, 1);
  assert.equal(states.at(-1).state, 'ready');
  lifecycle.dispose();
});

test('navigation during a throwing unmount cannot hide the cleanup failure', async () => {
  const main = host(), states = [], cleanupError = new Error('cleanup incomplete');
  let nested, unmounts = 0, reviewMounts = 0;
  const lifecycle = createLifecycle({
    host: main,
    navigate() {},
    onState: status => states.push(status),
    loadModule: async feature => feature === 'home' ? { mount: () => ({
      ready: Promise.resolve(),
      unmount() {
        unmounts++;
        if (unmounts === 1) {
          nested = lifecycle.show(route('review'));
          throw cleanupError;
        }
      },
    }) } : { mount: () => {
      if (feature === 'review') reviewMounts++;
      return { ready: Promise.resolve(), unmount() {} };
    } },
  });
  await lifecycle.show(route('home'));
  await lifecycle.show(route('textbook'));
  await nested;
  assert.equal(reviewMounts, 0);
  assert.equal(states.at(-1).state, 'error');
  assert.equal(states.at(-1).route.feature, 'review');
  assert.equal(states.at(-1).error, cleanupError);
  assert.equal(main.children.length, 0);
  await lifecycle.retry();
  assert.equal(unmounts, 2);
  assert.equal(reviewMounts, 1);
  assert.equal(states.at(-1).state, 'ready');
  lifecycle.dispose();
});

test('navigation during error cleanup also preserves a throwing unmount', async () => {
  const main = host(), states = [], cleanupError = new Error('cleanup incomplete');
  let nested, unmounts = 0, reviewMounts = 0;
  const lifecycle = createLifecycle({
    host: main,
    navigate() {},
    onState: status => states.push(status),
    loadModule: async feature => feature === 'home' ? { mount: () => ({
      ready: Promise.reject(new Error('render failed')),
      unmount() {
        unmounts++;
        if (unmounts === 1) {
          nested = lifecycle.show(route('review'));
          throw cleanupError;
        }
      },
    }) } : { mount: () => {
      reviewMounts++;
      return { ready: Promise.resolve(), unmount() {} };
    } },
  });
  await lifecycle.show(route('home'));
  await nested;
  assert.equal(reviewMounts, 0);
  assert.equal(states.at(-1).state, 'error');
  assert.equal(states.at(-1).route.feature, 'review');
  assert.equal(states.at(-1).error, cleanupError);
  await lifecycle.retry();
  assert.equal(unmounts, 2);
  assert.equal(reviewMounts, 1);
  assert.equal(states.at(-1).state, 'ready');
  lifecycle.dispose();
});

test('dispose aborts pending work, unmounts once, and stays idempotent', async () => {
  const main = host(), ready = deferred(), states = [];
  let unmounts = 0, signal;
  const lifecycle = createLifecycle({
    host: main,
    navigate() {},
    onState: status => states.push(status),
    loadModule: async () => ({ mount: (_element, context) => {
      signal = context.signal;
      return { ready: ready.promise, unmount: () => unmounts++ };
    } }),
  });
  const showing = lifecycle.show(route('home'));
  await turn();
  lifecycle.dispose();
  lifecycle.dispose();
  await showing;
  const count = states.length;
  ready.reject(new Error('disposed render failure'));
  await turn();
  await lifecycle.show(route('textbook'));
  await lifecycle.retry();
  assert.equal(signal.aborted, true);
  assert.equal(unmounts, 1);
  assert.equal(main.children.length, 0);
  assert.equal(main.inert, false);
  assert.equal(main.getAttribute('aria-busy'), 'false');
  assert.equal(main.getAttribute('data-state'), null);
  assert.equal(states.length, count);
});

test('dispose during import prevents a late mount', async () => {
  const main = host(), imported = deferred(), states = [];
  let mounts = 0;
  const lifecycle = createLifecycle({
    host: main,
    navigate() {},
    onState: status => states.push(status),
    loadModule: () => imported.promise,
  });
  const showing = lifecycle.show(route('home'));
  lifecycle.dispose();
  await showing;
  imported.resolve({ mount() { mounts++; return { ready: Promise.resolve(), unmount() {} }; } });
  await turn();
  assert.equal(mounts, 0);
  assert.deepEqual(states.map(status => status.state), ['loading']);
  assert.equal(main.children.length, 0);
});

test('dispose inside a throwing unmount still reports the cleanup failure', async () => {
  const main = host(), states = [], cleanupError = new Error('cleanup incomplete');
  let unmounts = 0;
  const lifecycle = createLifecycle({
    host: main,
    navigate() {},
    onState: status => states.push(status),
    loadModule: async () => ({ mount: () => ({
      ready: Promise.resolve(),
      unmount() {
        unmounts++;
        lifecycle.dispose();
        throw cleanupError;
      },
    }) }),
  });
  await lifecycle.show(route('home'));
  await lifecycle.show(route('review'));
  assert.equal(states.at(-1).state, 'error');
  assert.equal(states.at(-1).error, cleanupError);
  assert.equal(main.children.length, 0);
  assert.equal(main.inert, false);
  lifecycle.dispose();
  assert.equal(unmounts, 1);
});

test('ready in-place route updates keep their view, skip remount focus, and retry the latest route', async () => {
  const main = host(), seen = [], states = [];
  let mounts = 0, unmounts = 0, rejectUpdate = false;
  const lifecycle = createLifecycle({ host: main, navigate() {}, onState: s => states.push(s.state),
    loadModule: async () => ({ mount: (_, context) => {
      mounts++;
      return { ready: Promise.resolve(), updateRoute(next) {
        seen.push(next); if (rejectUpdate) return false;
        return next.feature === context.route.feature && next.lesson === context.route.lesson;
      }, unmount() { unmounts++; } };
    } }) });
  await lifecycle.show({ feature: 'textbook', lesson: 1, section: 'text', scene: 1 });
  const surface = main.children[0];
  await lifecycle.show({ feature: 'textbook', lesson: 1, section: 'text', scene: 2 });
  assert.equal(mounts, 1); assert.equal(unmounts, 0); assert.equal(main.children[0], surface);
  assert.deepEqual(states, ['loading', 'ready']);
  rejectUpdate = true; await lifecycle.retry();
  assert.equal(seen.at(-1).scene, 2); assert.equal(mounts, 2); assert.equal(unmounts, 1);
  await lifecycle.show({ feature: 'home', lesson: 1 });
  assert.equal(mounts, 3); lifecycle.dispose(); assert.equal(unmounts, 3);
});

test('in-place updates are never attempted on loading or disposed views', async () => {
  const pending = deferred(); let updates = 0, mounts = 0;
  const lifecycle = createLifecycle({ host: host(), navigate() {}, onState() {},
    loadModule: async () => ({ mount: () => ({ ready: ++mounts === 1 ? pending.promise : Promise.resolve(),
      updateRoute() { updates++; return true; }, unmount() {} }) }) });
  const first = lifecycle.show(route('textbook')); await turn();
  await lifecycle.show(route('textbook', 2)); await first;
  assert.equal(updates, 0); assert.equal(mounts, 2);
  lifecycle.dispose(); await lifecycle.show(route('textbook', 3));
  assert.equal(updates, 0); pending.resolve();
});
