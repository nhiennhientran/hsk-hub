import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { vocabularyCopy, vocabularyDynamic } from '../src/app/i18n/vocabulary.ts';
import { listeningCopy } from '../src/app/i18n/listening.ts';
import { reviewCopy } from '../src/app/i18n/review.ts';

const source = path => readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8');

test('next-round disclosures initialize once from saved rounds and keep content first', () => {
  const vocabulary = source('features/vocabulary/view.ts');
  const listening = source('features/listening/index.ts');
  assert.match(vocabulary, /const settings = node\('details'\)/);
  assert.match(vocabulary, /settings.open = !controller.read\(\).current/);
  assert.match(vocabulary, /controls.append\(message, exercise, settings, summary, save, saveActions\)/);
  assert.match(listening, /const settings = element\('details'\)/);
  assert.match(listening, /settings.open = !listening.read\(\).current/);
  assert.match(listening, /copy.controls\), message, exercise, settings, summary, saveBox/);
  for (const text of [vocabulary, listening]) {
    assert.match(text, /settings.open = false/);
    assert.doesNotMatch(text, /setPreferences\([^;]+(?:start|redo)\(/);
  }
});

test('optional ratings stay hidden before reveal and next/skip share the existing navigation action', () => {
  const text = source('features/vocabulary/view.ts');
  assert.match(text, /rateActions.hidden = !current.revealed/);
  assert.match(text, /on\(next, 'click', advance\); on\(skip, 'click', advance\)/);
  assert.match(text, /controller.rate\(value as keyof typeof ratings\)\)\) \{ update\(\); next.focus\(\); \}/);
  assert.equal(vocabularyCopy.optionalRating.zh, '可选自评 · 仅安排复习');
});

test('the hub exposes only independent vocabulary, listening and textbook self-practice destinations', () => {
  const text = source('features/review/index.ts');
  for (const feature of ['vocabulary', 'listening', 'textbook']) assert.match(text, new RegExp(`feature: '${feature}'`));
  assert.doesNotMatch(text, /feature: '(?:exercises|homework)'/);
  assert.doesNotMatch(source('features/textbook/index.ts'), /feature: 'exercises'/);
  assert.match(reviewCopy.listeningDetail.zh, /75/);
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
  for (const group of [reviewCopy, vocabularyCopy, listeningCopy]) for (const [name, value] of Object.entries(group)) {
    if (typeof value === 'function') continue;
    assert.match(value.zh, /\p{Script=Han}/u, name);
    assert.ok(value.vi.trim(), name);
  }
  const all = Array.from({ length: 15 }, (_, index) => index + 1);
  assert.match(vocabularyDynamic.scope(all, 'all', 'zh-vi').zh, /1–15/);
  assert.match(vocabularyDynamic.scope([7, 10], 'all', 'zh-vi').vi, /7, 10/);
  assert.match(listeningCopy.scope(all, 'all', 75).vi, /1–15/);
});
