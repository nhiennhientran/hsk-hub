import test from 'node:test';
import assert from 'node:assert/strict';
import { exerciseCopy, exerciseSets, exerciseGroups, exerciseFilters, exerciseSaveStates, exerciseAudioStates, exerciseText, exerciseIssue } from '../src/app/i18n/exercises.ts';

const paired = copy => { assert.match(copy.zh, /\p{Script=Han}/u); assert.ok(copy.vi.trim()); assert.notEqual(copy.zh, copy.vi); };
test('all exercise interface labels have explicit Chinese and Vietnamese copies', () => {
  for (const collection of [exerciseCopy, exerciseSets, exerciseGroups, exerciseFilters, exerciseSaveStates, exerciseAudioStates]) {
    for (const value of Object.values(collection)) paired(value);
  }
  assert.deepEqual(Object.keys(exerciseSets).sort(), ['homework-review', 'original', 'pilot']);
  assert.deepEqual(Object.keys(exerciseFilters).sort(), ['all', 'due', 'wrong']);
  assert.match(exerciseCopy.manualHint.zh, /不显示参考答案/); assert.match(exerciseCopy.manualHint.vi, /không tự chấm đúng\/sai/);
});
test('dynamic labels preserve all counts, source references and typed profile text without translating curriculum', () => {
  paired(exerciseText.question(2, 5, 'choice'));
  const summary = exerciseText.automaticSummary(3, 5, 1, 2);
  assert.match(summary.zh, /3\/5.*首次答对：1.*最近答对：2/); assert.match(summary.vi, /3\/5.*Đúng lần đầu: 1.*Đúng gần nhất: 2/);
  const manual = exerciseText.manualSummary(2, 5); assert.match(manual.zh, /2\/5.*不自动评分/); assert.match(manual.vi, /2\/5.*không tự chấm điểm/);
  const name = 'Nguyễn 安', className = 'A1'; const profile = exerciseText.profile(name, className);
  for (const value of Object.values(profile)) { assert.ok(value.includes(name)); assert.ok(value.includes(className)); }
  const source = exerciseText.source({ book: '新HSK教程1', page: 48, pdfPage: 63 }, 9);
  for (const value of Object.values(source)) { assert.match(value, /新HSK教程1/); assert.match(value, /48/); assert.match(value, /63/); }
  assert.ok(!exerciseText.source({ page: 48 }, 9).vi.includes('undefined'));
  const sourceLabel = 'Giáo trình, tr. 1, 2, 3'; assert.equal(exerciseText.source({ label: sourceLabel, printPages: [1, 2, 3] }, 1).vi, `Nguồn: ${sourceLabel}`);
});
test('pending-save copy never claims a failed write and known failure guidance remains specific', () => {
  assert.match(exerciseSaveStates.unsaved.zh, /等待保存/); assert.match(exerciseSaveStates.unsaved.vi, /chờ lưu/);
  const quota = 'Bộ nhớ đã đầy. Chưa lưu; bản nháp vẫn còn và có thể tải bản sao lưu.';
  const failure = exerciseIssue(quota, exerciseSaveStates.unsaved); assert.equal(failure.vi, quota); assert.match(failure.zh, /存储已满.*尚未保存.*下载备份/);
  const limit = 'Đã đạt giới hạn lịch sử cho câu này. Hãy sao lưu trước khi đặt lại.';
  assert.match(exerciseIssue(limit, exerciseCopy.submitFailed).zh, /上限.*先备份再重置/);
  const unknown = 'Unexpected provider detail'; const fallback = exerciseIssue(unknown, exerciseCopy.audioFailed);
  assert.equal(fallback.vi, unknown); assert.ok(fallback.zh.includes(unknown)); assert.ok(fallback.zh.includes(exerciseCopy.audioFailed.zh));
});
