import test from 'node:test';
import assert from 'node:assert/strict';
import { homeworkCopy, receiptCopy, homeworkParts, assignmentSaveCopy, assignmentSaveFailed } from '../src/app/i18n/homework.ts';
import { listeningCopy, listeningAudioStates, listeningFailure, listeningAudioFailure } from '../src/app/i18n/listening.ts';
const paired = value => { assert.equal(typeof value.zh, 'string'); assert.equal(typeof value.vi, 'string'); assert.match(value.zh, /\p{Script=Han}/u); assert.ok(value.vi.length > 0); };

test('assignment interface static copy has explicit Chinese and Vietnamese text', () => {
  for (const section of [homeworkCopy, receiptCopy, homeworkParts, listeningCopy, listeningAudioStates]) {
    for (const value of Object.values(section)) if (typeof value !== 'function') paired(value);
  }
});
test('save presentation separates queued autosave from confirmed failure without changing storage', () => {
  const pending = { status: 'unsaved', issue: null };
  assert.equal(assignmentSaveFailed(pending), false);
  assert.match(assignmentSaveCopy(pending).zh, /等待自动保存/);
  assert.match(assignmentSaveCopy(pending).vi, /chờ tự động lưu/);
  const failed = { status: 'unsaved', issue: 'Bộ nhớ đã đầy. Chưa lưu; bản nháp vẫn còn và có thể tải bản sao lưu.' };
  assert.equal(assignmentSaveFailed(failed), true);
  assert.match(assignmentSaveCopy(failed).zh, /存储空间已满/);
  assert.equal(assignmentSaveCopy(failed).vi, failed.issue);
  assert.equal(assignmentSaveFailed({ status: 'saving', issue: null }), false);
  assert.equal(assignmentSaveFailed({ status: 'saved', issue: null }), false);
  for (const status of ['conflict', 'corrupt', 'unavailable']) assert.equal(assignmentSaveFailed({ status, issue: null }), true);
  const unknown = { status: 'unsaved', issue: 'An unexpected diagnostic' };
  assert.equal(assignmentSaveCopy(unknown).vi, unknown.issue);
});
test('listening first/latest counts and session scope are separate bilingual facts', () => {
  const first = listeningCopy.firstScore(2, 4, 75), latest = listeningCopy.latestScore(3, 4);
  assert.match(first.zh, /首次.*2 \/ 4.*4 \/ 75/);
  assert.match(first.vi, /Lần đầu.*2 \/ 4.*4 \/ 75/);
  assert.match(latest.zh, /最近.*3 \/ 4/);
  assert.match(latest.vi, /Gần nhất.*3 \/ 4/);
  assert.doesNotMatch(first.zh, /3 \/ 4/);
  for (const count of [5, 10]) { paired(listeningCopy.questionCount(count)); paired(listeningCopy.scope([1, 10], 'wrong', count)); }
});
test('known controller and audio failures are translated semantically while unknown details survive', () => {
  for (const reason of ['empty', 'empty-session', 'already-submitted', 'not-current', 'invalid-answer', 'answer-required', 'content-changed', 'invalid-position', 'invalid-lessons', 'invalid-preferences', 'invalid-options', 'invalid-state']) paired(listeningFailure({ reason }));
  assert.match(listeningFailure({ reason: 'answer-required' }).zh, /先选择并提交/);
  assert.match(listeningAudioFailure('Trình duyệt chưa cho phép phát. Bấm Nghe lại để thử.').zh, /浏览器尚未允许/);
  assert.match(listeningAudioFailure('Native diagnostic').vi, /Native diagnostic/);
  paired(listeningAudioFailure(null, 'unsupported'));
});
test('manual receipt copy states no automatic score and interpolated content remains literal', () => {
  assert.match(receiptCopy.manualNote.zh, /不自动评分/);
  assert.match(receiptCopy.manualNote.vi, /không chấm điểm tự động/);
  assert.equal(homeworkCopy.removeToken('<中文>').zh, '从句子中移除 <中文>');
  paired(homeworkCopy.tooLong(3, 10000));
});
