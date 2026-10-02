import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { vocabularyCopy, vocabularyDynamic } from '../src/app/i18n/vocabulary.ts';
import { listeningCopy } from '../src/app/i18n/listening.ts';
import { mixedVocabularyCopy } from '../src/app/i18n/mixed-vocabulary.ts';

const source = path => readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8');

test('next-round disclosures initialize once from saved rounds and keep content first', () => {
  const vocabulary = source('features/vocabulary/view.ts');
  const listening = source('features/listening/index.ts');
  assert.match(vocabulary, /const settings = node\('details'\)/);
  assert.match(vocabulary, /settings.open = !controller.read\(\).round/);
  assert.match(vocabulary, /controls.append\(settings, legacy, message, exercise, save, saveActions\)/);
  assert.match(listening, /const settings = element\('details'\)/);
  assert.match(listening, /settings.open = !listening.read\(\).current/);
  assert.match(listening, /copy.controls\), message, exercise, settings, summary, saveBox/);
  for (const text of [vocabulary, listening]) {
    assert.match(text, /settings.open = false/);
    assert.doesNotMatch(text, /setPreferences\([^;]+(?:start|redo)\(/);
  }
});

test('mixed cards use independent reversible native buttons and free group navigation', () => {
  const text = source('features/vocabulary/view.ts');
  assert.match(text, /flip.type = 'button'/);
  assert.match(text, /flip.setAttribute\('aria-pressed'/);
  assert.match(text, /faces.delete\(card.senseId\)/);
  assert.match(text, /faces.add\(card.senseId\)/);
  assert.match(text, /on\(previous, 'click', \(\) => move\(-pageSize\)\)/);
  assert.match(text, /on\(next, 'click', \(\) => move\(pageSize\)\)/);
  assert.doesNotMatch(text, /controller.rate|rateActions|vocabulary-filter|vocabulary-direction/);
  assert.match(text, /shell.append\(audioRow\)/);
});

test('practice enters mixed cards directly while listening remains independently available from courses', () => {
  assert.match(source('features/review/index.ts'), /mountVocabulary\(host, context, 'review'\)/);
  assert.match(source('features/home/index.ts'), /\['homework', 'listening'\]/);
  assert.doesNotMatch(source('features/textbook/index.ts'), /feature: 'exercises'/);
  assert.match(listeningCopy.introduction.vi, /không tính vào bài tập được giao/);
});

test('Hanzi canvas precedes the complete bank and dialogue selectors are responsive alternatives', () => {
  assert.match(source('features/textbook/hanzi.ts'), /host.replaceChildren\(details, bank\)/);
  assert.match(source('features/textbook/hanzi.ts'), /bank.open = true/);
  const css = source('features/textbook/textbook.css');
  assert.match(css, /\.textbook-body \.textbook-scene-picker \{ display: none/);
  assert.match(css, /\.textbook-scene-tabs \{ display: none/);
  assert.match(css, /\.textbook-body \.textbook-scene-picker \{ display: block/);
});

test('new GUI copy remains bilingual and long contiguous active scopes stay compact', () => {
  for (const group of [mixedVocabularyCopy, vocabularyCopy, listeningCopy]) for (const [name, value] of Object.entries(group)) {
    if (typeof value === 'function') continue;
    assert.match(value.zh, /\p{Script=Han}/u, name);
    assert.ok(value.vi.trim(), name);
  }
  const all = Array.from({ length: 15 }, (_, index) => index + 1);
  assert.match(vocabularyDynamic.scope(all, 'all', 'zh-vi').zh, /1–15/);
  assert.match(vocabularyDynamic.scope([7, 10], 'all', 'zh-vi').vi, /7, 10/);
  assert.match(listeningCopy.scope(all, 'all', 75).vi, /1–15/);
});
