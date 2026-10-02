import type { Answer } from '../types.ts';
import type { ExerciseCatalogue, ExerciseEntry, ExerciseTask } from './catalogue.ts';
import { checkAnswer, validAnswer } from './catalogue.ts';
import { blankExercisesState, validateExercisesState } from './engine.ts';
import type { ExercisesState, ExerciseSubmission } from './engine.ts';
const row = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const stamp = (v: unknown): v is number => Number.isSafeInteger(v) && Number(v) > 0 && Number(v) < 8640000000000000 - 14 * 86400000;
function convertAnswer(entry: ExerciseEntry, task: ExerciseTask, value: unknown, complete: boolean): Answer | undefined {
  if (task.kind === 'manual') return undefined; // Old translation is MCQ, never manual writing.
  if (!validAnswer(task, value, complete)) return undefined;
  if (typeof value === 'number') return entry.optionOrder?.[value] ?? value;
  if (Array.isArray(value)) return value.map(index => entry.tokenOrder?.[index] ?? index);
  return undefined;
}
export interface LegacyExerciseMigration { state: ExercisesState; warnings: string[]; submitted: number; drafts: number; skipped: number }
/** Pinned original-v2 source witness, not a same-ID score transplant. All original bytes stay with the caller. */
export function migrateLegacyExercises(input: unknown, catalogue: ExerciseCatalogue, base: ExercisesState = blankExercisesState()): LegacyExerciseMigration {
  const state = validateExercisesState(base, catalogue), warnings = [
    'Bản học tập v2 không có dấu vân tay nội dung. Chỉ ánh xạ theo ngân hàng gốc 069f9d đã đối chiếu; điểm được tính lại từ đáp án, không tin số điểm trong tệp.',
    'Lịch sử cũ chỉ có số điểm không được biến thành lần nộp mới. Nguồn gốc vẫn được giữ nguyên để đối chiếu.',
  ];
  if (!row(input) || input.schema !== 2 || input.app !== undefined || !row(input.lessons)) throw new Error('Nguồn không phải định dạng học tập gốc v2.');
  let submitted = 0, drafts = 0, skipped = 0;
  const entries = catalogue.entries.filter(entry => entry.set === 'original');
  for (const [lesson, lessonValue] of Object.entries(input.lessons)) {
    if (!/^([1-9]|1[0-5])$/.test(lesson) || !row(lessonValue)) throw new Error('Bài học nguồn v2 không hợp lệ.');
    for (const [group, raw] of Object.entries(lessonValue)) {
      if (!['choice', 'sort', 'translation', 'listening'].includes(group) || !row(raw)) throw new Error('Nhóm bài nguồn v2 không hợp lệ.');
      const groupEntries = entries.filter(e => e.lesson === Number(lesson) && e.group === group);
      const expected = new Set(groupEntries.map(e => e.oldId));
      if (row(raw.draft) && Object.keys(raw.draft).some(id => !expected.has(id))) throw new Error('Mã câu không thuộc nhóm nguồn v2.');
      // A submitted group must contain complete answers in the old answer domain.
      const snapshots: { answers: Record<string, unknown>; at: number }[] = [];
      for (const name of ['first', 'attempt']) if (raw[name] !== null && raw[name] !== undefined) {
        const attempt = raw[name];
        if (!row(attempt) || !row(attempt.answers) || !stamp(attempt.at) || Object.keys(attempt.answers).some(id => !expected.has(id)) || groupEntries.some(e => convertAnswer(e, catalogue.tasks.get(e.authorityId)!, (attempt.answers as Record<string, unknown>)[e.oldId], true) === undefined)) throw new Error('Đáp án lần nộp nguồn v2 không đúng miền câu hỏi.');
        if (!snapshots.some(old => old.at === attempt.at && JSON.stringify(old.answers) === JSON.stringify(attempt.answers))) snapshots.push({ answers: attempt.answers, at: attempt.at });
      }
      for (const entry of groupEntries) {
        const task = catalogue.tasks.get(entry.authorityId)!; const witness = entry.migration;
        if (!witness || !witness.eligible || witness.schema !== 2 || witness.authorityFingerprint !== task.fingerprint || entry.source.commit !== '069f9d956c9a600a91e6b4ce82241ceccc184dce' || state.records[task.id] || state.drafts[task.id] !== undefined) { skipped++; continue; }
        const submissions: ExerciseSubmission[] = snapshots.map(snapshot => { const answer = convertAnswer(entry, task, snapshot.answers[entry.oldId], true)!; return { answer, correct: checkAnswer(task, answer), at: snapshot.at, fingerprint: task.fingerprint }; });
        if (submissions.length) { state.records[task.id] = { submissions }; submitted++; }
        if (submissions.length && raw.attempt === null && row(raw.first)) state.retrying.push(task.id);
        // Corrections were not another graded submission. Preserve a changed correction or restart draft explicitly.
        const rawDraft = row(raw.draft) ? raw.draft[entry.oldId] : undefined;
        if (rawDraft !== undefined) {
          const answer = convertAnswer(entry, task, rawDraft, false);
          if (answer === undefined) throw new Error('Bản nháp nguồn v2 không đúng miền câu hỏi.');
          if (!submissions.length || !raw.attempt || JSON.stringify(answer) !== JSON.stringify(submissions.at(-1)!.answer)) {
            if (submissions.length && !state.retrying.includes(task.id)) state.retrying.push(task.id);
            state.drafts[task.id] = answer; drafts++;
          }
        }
      }
    }
  }
  if (skipped) warnings.push(`${skipped} câu không chép đè: nội dung đã sửa, nguồn chưa khớp hoặc đã có lượt học mới. Bản gốc được giữ lại.`);
  return { state: validateExercisesState(state, catalogue), warnings, submitted, drafts, skipped };
}
