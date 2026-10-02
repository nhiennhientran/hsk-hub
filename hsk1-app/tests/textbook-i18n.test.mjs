import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { textbookCopy, textbookSection, textbookIssue, audioStatusCopy, readingStatusCopy } from '../src/app/i18n/textbook.ts';
import { practiceQuestions } from '../src/domain/textbook/practice.ts';
import { bilingualText } from '../src/app/bilingual.ts';

const book = JSON.parse(readFileSync(new URL('../content/textbook.json', import.meta.url), 'utf8'));

function checkPair(copy) {
  assert.equal(typeof copy.zh, 'string');
  assert.equal(typeof copy.vi, 'string');
  assert.match(copy.zh, /\p{Script=Han}/u);
  assert.ok(copy.vi.trim());
  assert.ok(!copy.zh.includes('undefined') && !copy.vi.includes('undefined'));
  assert.equal(bilingualText(copy), `${copy.zh} · ${copy.vi}`);
}

test('every textbook section and player/save state has explicit Chinese and Vietnamese copy', () => {
  for (const lesson of book.lessons) for (const section of ['vocab', 'text', 'grammar', 'hanzi', 'practice']) checkPair(textbookSection(section, lesson.id));
  assert.deepEqual(textbookSection('grammar', 1), textbookCopy.language.phonetics);
  assert.deepEqual(textbookSection('grammar', 2), textbookCopy.language.grammar);
  for (const state of ['idle', 'loading', 'playing', 'paused', 'ended', 'error']) checkPair(audioStatusCopy[state]);
  for (const state of ['empty', 'saved', 'unsaved', 'saving', 'conflict', 'corrupt', 'unavailable']) checkPair(readingStatusCopy[state]);
  assert.notDeepEqual(readingStatusCopy.unsaved, readingStatusCopy.unavailable);
});

test('known failures translate exactly and unknown diagnostics remain available without a guessed translation', () => {
  const missingVoice = 'Chưa có giọng máy tiếng Trung trên thiết bị. Cài giọng tiếng Trung rồi thử lại.';
  const result = textbookIssue(missingVoice, audioStatusCopy.error);
  checkPair(result);
  assert.equal(result.vi, missingVoice);
  assert.match(result.zh, /安装中文语音/);
  const quota = 'Bộ nhớ đã đầy. Chưa lưu; bản nháp vẫn còn và có thể tải bản sao lưu.';
  assert.match(textbookIssue(quota, readingStatusCopy.unsaved).zh, /存储空间已满/);
  const unknown = 'Native decoder error <diagnostic>';
  const fallback = textbookIssue(unknown, audioStatusCopy.error);
  assert.ok(fallback.zh.startsWith(audioStatusCopy.error.zh));
  assert.ok(fallback.vi.includes(unknown));
  assert.deepEqual(textbookIssue(null, readingStatusCopy.saved), readingStatusCopy.saved);
});

test('dynamic Hanzi and practice labels keep counts and characters in both languages', () => {
  for (const copy of [textbookCopy.hanzi.start('好'), textbookCopy.hanzi.mistake(3, 2), textbookCopy.hanzi.correct(3, 4), textbookCopy.hanzi.complete('好', 2), textbookCopy.hanzi.loadError('好'), textbookCopy.practice.result(4, 7, 57), textbookCopy.player.position(2, 3), textbookCopy.readingProgress(5, true)]) checkPair(copy);
  for (const value of Object.values(textbookCopy.hanzi)) if (value && typeof value === 'object' && 'zh' in value) checkPair(value);
  assert.match(textbookCopy.hanzi.correct(3, 4).zh, /3.*4/);
  assert.match(textbookCopy.hanzi.correct(3, 4).vi, /3.*4/);
});

test('practice instructions add no answer material and do not alter the question bank', () => {
  const before = JSON.stringify(book);
  for (const lesson of book.lessons) for (const questions of Object.values(practiceQuestions(lesson))) {
    for (const question of questions) {
      checkPair(textbookCopy.practice.types[question.type]);
      const instruction = textbookCopy.practice.prompts[question.type];
      assert.match(instruction, /^请选择/);
      assert.ok(!instruction.includes(question.answer), `answer leaked for ${question.prompt}`);
    }
  }
  assert.equal(JSON.stringify(book), before);
});
