import type { Answer, HomeworkState } from '../types.ts';
import { checkAnswer, validAnswer } from './catalogue.ts';
import type { ExerciseCatalogue, ExerciseEntry, ExerciseFilter, ExerciseTask } from './catalogue.ts';

export interface ExerciseSubmission { answer: Answer; correct: boolean | null; at: number; fingerprint: string; homeworkAttempts?: number }
export interface ExercisesState { schema: 1; drafts: Record<string, Answer>; records: Record<string, { submissions: ExerciseSubmission[] }>; positions: Record<string, string>; retrying: string[] }
export interface ExerciseReview { attempts: number; streak: number; mistakes: number; lastCorrect: boolean | null; lastAt: number; dueAt: number | null }
const DAY = 86400000;
const row = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const stamp = (v: unknown): v is number => Number.isSafeInteger(v) && Number(v) > 0 && Number(v) < 8640000000000000 - 14 * DAY;
const exact = (v: Record<string, unknown>, keys: string[]) => Object.keys(v).every(key => keys.includes(key));
function fail(): never { throw new Error('Dữ liệu luyện câu không hợp lệ hoặc kết quả đã bị sửa.'); }
export function blankExercisesState(): ExercisesState { return { schema: 1, drafts: {}, records: {}, positions: {}, retrying: [] }; }
export function exerciseScope(entry: Pick<ExerciseEntry, 'set' | 'lesson' | 'group'>, filter: ExerciseFilter = 'all'): string { return `${entry.set}:${entry.lesson}:${entry.group}:${filter}`; }

/** Never trust imported score/streak/due fields: scores are checked against answers, schedules are derived. */
export function validateExercisesState(input: unknown, catalogue: ExerciseCatalogue): ExercisesState {
  if (input === undefined) return blankExercisesState();
  if (!row(input) || input.schema !== 1 || !exact(input, ['schema', 'drafts', 'records', 'positions', 'retrying']) || !row(input.drafts) || !row(input.records) || !row(input.positions) || !Array.isArray(input.retrying)) fail();
  const output = blankExercisesState();
  for (const [id, value] of Object.entries(input.records)) {
    const task = catalogue.tasks.get(id);
    if (!task || !row(value) || !exact(value, ['submissions']) || !Array.isArray(value.submissions) || !value.submissions.length || value.submissions.length > 1000) fail();
    const submissions = value.submissions.map(raw => {
      if (!row(raw) || !exact(raw, ['answer', 'correct', 'at', 'fingerprint', 'homeworkAttempts']) || !stamp(raw.at) || raw.fingerprint !== task.fingerprint || !validAnswer(task, raw.answer, true) || raw.correct !== checkAnswer(task, raw.answer)) fail();
      if (raw.homeworkAttempts !== undefined && (!task.id.startsWith('homework:') || task.assessment !== 'automatic' || !Number.isSafeInteger(raw.homeworkAttempts) || Number(raw.homeworkAttempts) < 0)) fail();
      return structuredClone(raw) as unknown as ExerciseSubmission;
    });
    output.records[id] = { submissions };
  }
  if (new Set(input.retrying).size !== input.retrying.length || input.retrying.some(id => typeof id !== 'string' || !Object.hasOwn(output.records, id))) fail();
  output.retrying = input.retrying.slice() as string[];
  for (const [id, answer] of Object.entries(input.drafts)) {
    const task = catalogue.tasks.get(id);
    if (!task || !validAnswer(task, answer) || (output.records[id] && !output.retrying.includes(id))) fail();
    output.drafts[id] = structuredClone(answer);
  }
  for (const [scope, id] of Object.entries(input.positions)) {
    if (typeof id !== 'string') fail();
    const entry = catalogue.entryById.get(id);
    if (!entry || !(['all', 'wrong', 'due'] as const).some(filter => scope === exerciseScope(entry, filter))) fail();
    output.positions[scope] = id;
  }
  return output;
}
export function resetExercises(state: ExercisesState, catalogue: ExerciseCatalogue, lesson?: number): ExercisesState {
  if (lesson === undefined) return blankExercisesState();
  if (!Number.isInteger(lesson) || lesson < 1 || lesson > 15) throw new Error('Bài học không hợp lệ.');
  const output = structuredClone(state);
  for (const id of catalogue.tasks.keys()) if (catalogue.tasks.get(id)!.lesson === lesson) { delete output.drafts[id]; delete output.records[id]; output.retrying = output.retrying.filter(key => key !== id); }
  for (const [scope, id] of Object.entries(output.positions)) if (catalogue.entryById.get(id)?.lesson === lesson) delete output.positions[scope];
  return output;
}
export function isSubmitted(state: ExercisesState, id: string): boolean { return !!state.records[id] && !state.retrying.includes(id); }
export function answerExercise(state: ExercisesState, task: ExerciseTask, answer: Answer): boolean {
  if (isSubmitted(state, task.id) || !validAnswer(task, answer)) return false;
  state.drafts[task.id] = structuredClone(answer); return true;
}
export function submitExercise(state: ExercisesState, task: ExerciseTask, at = Date.now(), homework?: HomeworkState): ExerciseSubmission | null {
  const answer = state.drafts[task.id];
  if (isSubmitted(state, task.id) || !validAnswer(task, answer, true)) return null;
  const submissions = state.records[task.id]?.submissions ?? [];
  if (!stamp(at)) throw new Error('Thời gian nộp không hợp lệ.');
  if (submissions.length >= 1000) throw new Error('Đã đạt giới hạn lịch sử cho câu này. Hãy sao lưu trước khi đặt lại.');
  const submission: ExerciseSubmission = { answer: structuredClone(answer), correct: checkAnswer(task, answer), at, fingerprint: task.fingerprint };
  if (task.id.startsWith('homework:') && task.assessment === 'automatic' && homework) {
    const original = homework.questionReviews[task.id.slice(9)];
    const attempts = row(original) ? original.attempts : 0;
    if (!Number.isSafeInteger(attempts) || Number(attempts) < 0) throw new Error('Số lượt bài tập gốc không hợp lệ.');
    submission.homeworkAttempts = Number(attempts);
  }
  state.records[task.id] = { submissions: [...submissions, submission] };
  delete state.drafts[task.id]; state.retrying = state.retrying.filter(id => id !== task.id);
  return submission;
}
export function restartExercise(state: ExercisesState, task: ExerciseTask): boolean {
  if (!isSubmitted(state, task.id)) return false;
  state.retrying.push(task.id); delete state.drafts[task.id]; return true;
}
export function exerciseReview(state: ExercisesState, task: ExerciseTask, homework?: HomeworkState): ExerciseReview | null {
  const submissions = state.records[task.id]?.submissions ?? [];
  let streak = 0, mistakes = 0;
  for (const submission of submissions) { if (submission.correct === true) streak++; else if (submission.correct === false) { streak = 0; mistakes++; } }
  const latest = submissions.at(-1);
  const review: ExerciseReview | null = latest ? { attempts: submissions.length, streak, mistakes, lastCorrect: latest.correct, lastAt: latest.at, dueAt: latest.correct === null ? null : latest.at + (latest.correct ? [1, 3, 7, 14][Math.min(streak - 1, 3)]! : 0) * DAY } : null;
  // The current homework engine derives these records from original submitted answers.
  // Use the homework attempt counter observed at review time, never wall-clock order.
  // Old backups without this optional witness keep their explicit practice record;
  // a new review records the counter and can observe future original submissions.
  const original = task.id.startsWith('homework:') ? homework?.questionReviews[task.id.slice(9)] : null;
  if (row(original) && typeof original.lastCorrect === 'boolean' && stamp(original.lastAt) && typeof original.dueAt === 'number' && (!review || (latest?.homeworkAttempts !== undefined && Number(original.attempts) > latest.homeworkAttempts))) return { attempts: Number(original.attempts), streak: Number(original.streak), mistakes: Number(original.mistakes), lastCorrect: original.lastCorrect, lastAt: original.lastAt, dueAt: original.dueAt };
  return review;
}
export function exerciseQueue(catalogue: ExerciseCatalogue, state: ExercisesState, options: { set: ExerciseEntry['set']; lesson: number; group?: string; filter?: ExerciseFilter; now?: number; homework?: HomeworkState }): ExerciseEntry[] {
  const now = options.now ?? Date.now(), filter = options.filter ?? 'all';
  return catalogue.entries.filter(entry => {
    if (entry.set !== options.set || entry.lesson !== options.lesson || (options.group && entry.group !== options.group)) return false;
    if (filter === 'all') return true;
    const task = catalogue.tasks.get(entry.authorityId)!; if (task.assessment === 'manual') return false;
    const review = exerciseReview(state, task, options.homework);
    return !!review && (filter === 'wrong' ? review.lastCorrect === false : review.dueAt !== null && review.dueAt <= now);
  });
}
export function exerciseTotals(catalogue: ExerciseCatalogue, state: ExercisesState, entries: readonly ExerciseEntry[]) {
  const ids = [...new Set(entries.map(entry => entry.authorityId))];
  let automatic = 0, submitted = 0, firstCorrect = 0, latestCorrect = 0, manual = 0, manualSubmitted = 0;
  for (const id of ids) {
    const task = catalogue.tasks.get(id)!; const submissions = state.records[id]?.submissions;
    if (task.assessment === 'manual') { manual++; if (submissions) manualSubmitted++; }
    else { automatic++; if (submissions) { submitted++; if (submissions[0]!.correct) firstCorrect++; if (submissions.at(-1)!.correct) latestCorrect++; } }
  }
  return { automatic, submitted, firstCorrect, latestCorrect, manual, manualSubmitted };
}
