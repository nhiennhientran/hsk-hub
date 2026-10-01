import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {practiceQuestions, gradePractice} from '../src/domain/textbook/practice.ts';

const book = JSON.parse(fs.readFileSync(new URL('../content/textbook.json', import.meta.url), 'utf8'));
const legacy = fs.readFileSync(new URL('../../new-hsk1/hsk1/app-practice.js', import.meta.url), 'utf8').split('function qHtml')[0];
const clone = value => JSON.parse(JSON.stringify(value));

test('all 15 textbook practice banks match the independent original-script oracle, including option order and explanations', () => {
  for (const lesson of book.lessons) {
    const context = vm.createContext({L: clone(lesson), id: lesson.id});
    vm.runInContext(legacy, context);
    const expected = vm.runInContext('JSON.stringify(practiceQuestions())', context);
    assert.deepEqual(practiceQuestions(lesson), JSON.parse(expected), `lesson ${lesson.id}`);
    assert.equal(practiceQuestions(lesson).basic.length, 7);
    assert.equal(practiceQuestions(lesson).advanced.length, 3);
  }
});

test('textbook review grades all 150 original questions separately and permits unselected submissions', () => {
  let total = 0;
  for (const lesson of book.lessons) {
    for (const items of Object.values(practiceQuestions(lesson))) {
      total += items.length;
      const correct = Object.fromEntries(items.map((q, index) => [index, q.options.indexOf(q.answer)]));
      const wrong = Object.fromEntries(items.map((q, index) => [index, q.options.findIndex(option => option !== q.answer)]));
      assert.equal(gradePractice(items, correct).correct, items.length);
      assert.equal(gradePractice(items, correct).percent, 100);
      assert.equal(gradePractice(items, wrong).correct, 0);
      const missing = gradePractice(items, {});
      assert.equal(missing.correct, 0);
      assert.ok(missing.results.every(result => result.picked === null && result.correct === false));
    }
  }
  assert.equal(total, 150);
});

test('review generation and grading do not mutate the frozen lesson or caller selections; invalid indexes count as unselected', () => {
  const lesson = clone(book.lessons[0]), before = clone(lesson);
  const bank = practiceQuestions(lesson), selection = {0: -1, 1: 100, 2: 1.5};
  const selectionBefore = clone(selection), bankBefore = clone(bank);
  const result = gradePractice(bank.basic, selection);
  assert.ok(result.results.every(value => value.picked === null));
  assert.deepEqual(lesson, before);
  assert.deepEqual(selection, selectionBefore);
  assert.deepEqual(bank, bankBefore);
  assert.deepEqual(gradePractice([], {}), {correct: 0, total: 0, percent: 0, results: []});
});

test('the bundled Hanzi Writer 3.7.3 body is byte-identical to the frozen source; only the lifecycle adapter is added', () => {
  const original = fs.readFileSync(new URL('../../new-hsk1/assets/hanzi-writer.min.js', import.meta.url), 'utf8');
  const copied = fs.readFileSync(new URL('../src/services/hanzi/vendor.js', import.meta.url), 'utf8');
  const body = original.split('\n//# sourceMappingURL=')[0];
  assert.equal(copied.slice(0, body.length), body);
  assert.match(original, /Hanzi Writer v3\.7\.3/);
  assert.equal(createHash('sha256').update(original).digest('hex'), '17b11a1e025b780cb518d49b30faacc770dfa7fbc387aa3876e3e5c1bd31e642');
  assert.ok(copied.includes('export class ManagedHanziWriter extends HanziWriter'));
});

test('the Hanzi lifecycle adapter removes every pointer listener and cancels active quiz/render work on disposal', () => {
  const copied = fs.readFileSync(new URL('../src/services/hanzi/vendor.js', import.meta.url), 'utf8');
  const adapter = copied.slice(copied.indexOf('export class ManagedHanziWriter')).replace('export class', 'class');
  const node = new EventTarget(), documentTarget = new EventTarget();
  node.ownerDocument = documentTarget;
  const calls = [];
  class Writer {
    constructor() {
      this.target = {node, _getMousePoint: () => 'mouse', _getTouchPoint: () => 'touch'};
      this._quiz = {startUserStroke: point => calls.push(`start:${point}`), continueUserStroke: point => calls.push(`move:${point}`), endUserStroke: () => calls.push('end')};
      this._renderState = {cancelAll: () => calls.push('cancel-render')};
      this._hanziWriterRenderer = {destroy: () => calls.push('destroy-renderer')};
      this._setupListeners();
    }
    cancelQuiz() {calls.push('cancel-quiz'); this._quiz = null;}
  }
  const context = vm.createContext({HanziWriter: Writer, AbortController});
  vm.runInContext(`${adapter}\nthis.Managed = ManagedHanziWriter;`, context);
  const writer = new context.Managed();
  node.dispatchEvent(new Event('mousedown', {cancelable: true}));
  node.dispatchEvent(new Event('touchstart', {cancelable: true}));
  node.dispatchEvent(new Event('mousemove', {cancelable: true}));
  node.dispatchEvent(new Event('touchmove', {cancelable: true}));
  for (const type of ['mouseup', 'touchend', 'touchcancel']) documentTarget.dispatchEvent(new Event(type));
  assert.deepEqual(calls, ['start:mouse', 'start:touch', 'move:mouse', 'move:touch', 'end', 'end', 'end']);
  writer.dispose();
  assert.deepEqual(calls.slice(-3), ['cancel-quiz', 'cancel-render', 'destroy-renderer']);
  const count = calls.length;
  for (const type of ['mousedown', 'touchstart', 'mousemove', 'touchmove']) node.dispatchEvent(new Event(type));
  for (const type of ['mouseup', 'touchend', 'touchcancel']) documentTarget.dispatchEvent(new Event(type));
  assert.equal(calls.length, count, 'disposed writer must never receive new pointer work');
});
