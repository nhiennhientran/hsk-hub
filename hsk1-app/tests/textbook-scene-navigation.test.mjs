import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mountText } from '../src/features/textbook/text.ts';

// Deliberately small renderer DOM, not a substitute for native accessibility/layout QA.
class Node extends EventTarget {
  constructor(tag, document) { super(); this.tagName = tag.toUpperCase(); this.ownerDocument = document; this.children = []; this.dataset = {}; this.attributes = {}; this.checked = false; this.hidden = false; this.classList = { add() {} }; }
  append(...nodes) { for (const node of nodes) { node.remove(); this.children.push(node); node.parent = this; } }
  replaceChildren(...nodes) { for (const node of [...this.children]) node.remove(); this.append(...nodes); }
  remove() { if (this.parent) this.parent.children = this.parent.children.filter(n => n !== this); this.parent = null; }
  setAttribute(key, value) { this.attributes[key] = value; }
  getAttribute(key) { return this.attributes[key]; }
  getClientRects() { return []; }
  focus() { this.ownerDocument.activeElement = this; }
  querySelectorAll(selector) {
    const match = node => selector === '[data-original-text]' ? 'originalText' in node.dataset : selector.startsWith('#') ? node.id === selector.slice(1) : selector === '[data-scene-tab]' ? 'sceneTab' in node.dataset : selector === '[data-line-audio]' ? 'lineAudio' in node.dataset : false;
    return this.children.flatMap(n => [...(match(n) ? [n] : []), ...n.querySelectorAll(selector)]);
  }
}
const book = JSON.parse(readFileSync(new URL('../content/textbook.json', import.meta.url)));
function setup(lessonNumber = 1) {
  const document = { createElement: tag => new Node(tag, document) };
  globalThis.document = document;
  const host = document.createElement('main'), lifetime = new AbortController(), plays = [], stops = [];
  const lesson = book.lessons.find(l => l.id === lessonNumber);
  const audio = { stop: () => stops.push(1), setRate: rate => plays.push({ rate }), play: (request, options) => { plays.push({ request, signal: options.signal }); return Promise.resolve({ ok: true }); } };
  const content = { resolveScene: () => ({ available: true, request: { url: 'scene.mp3' } }), resolveLine: () => ({ available: true, request: { url: 'line.mp3' } }), tongue: () => ({ available: false }) };
  let routeScene = 1, view;
  view = mountText(host, { lesson, content, audio, signal: lifetime.signal, onSceneChange: scene => { routeScene = scene; view.updateScene(scene); } });
  return { host, view, document, plays, stops, lifetime, scene: () => routeScene, get: selector => host.querySelectorAll(selector)[0] };
}
const change = input => input.dispatchEvent(new Event('change'));
const click = input => input.dispatchEvent(new Event('click'));
function hidden(s, expected = true) { const nodes = s.host.querySelectorAll('[data-original-text]'); assert.ok(nodes.length); assert.ok(nodes.every(n => n.hidden === expected)); }

test('listen-only and hide-original survive tabs, picker, arrows and history-equivalent route updates', () => {
  const s = setup(), mode = s.get('#text-listen-mode'), show = s.get('#text-show-original');
  hidden(s, false); assert.equal(mode.checked, false); assert.equal(show.checked, true);
  mode.checked = true; change(mode); hidden(s);
  click(s.host.querySelectorAll('[data-scene-tab]')[1]); assert.equal(s.scene(), 2); hidden(s);
  assert.equal(s.document.activeElement.id, 'scene-tab-1');
  const picker = s.get('#scene-select'); picker.value = '0'; change(picker); hidden(s); assert.equal(s.document.activeElement, picker);
  const event = new Event('keydown', { cancelable: true }); Object.defineProperty(event, 'key', { value: 'ArrowRight' });
  s.host.querySelectorAll('[data-scene-tab]')[0].dispatchEvent(event); hidden(s); assert.equal(s.scene(), 2); assert.equal(s.document.activeElement.id, 'scene-tab-1');
  for (const scene of [1, 2, 1]) { s.view.updateScene(scene); hidden(s); assert.equal(mode.checked, true); assert.equal(show.checked, false); }
  mode.checked = false; change(mode); show.checked = false; change(show);
  s.view.updateScene(2); hidden(s); assert.equal(mode.checked, false);
  s.lifetime.abort(); s.view.dispose(); const fresh = setup(); hidden(fresh, false); fresh.lifetime.abort();
});

test('hidden line controls keep neutral labels, stop old scene media, and remain playable', () => {
  const s = setup(), show = s.get('#text-show-original'); show.checked = false; change(show);
  click(s.get('[data-line-audio]')); const first = s.plays.at(-1);
  assert.equal(first.signal.aborted, false); assert.equal(first.request.url, 'line.mp3');
  for (const scene of book.lessons[0].scenes) for (const line of scene.lines) assert.ok(!first.request.label.includes(line.zh));
  s.view.updateScene(2); assert.equal(first.signal.aborted, true); assert.ok(s.stops.length); hidden(s);
  click(s.get('#scene-slow')); assert.ok(s.plays.some(p => p.rate === .75)); assert.equal(s.plays.at(-1).request.url, 'scene.mp3');
  s.lifetime.abort(); assert.equal(s.plays.at(-1).signal.aborted, true); s.view.dispose();
});
