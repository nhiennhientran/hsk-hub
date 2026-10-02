/** Versioned adapter. The frozen stage2 engine still owns legacy submissions. */
import legacy from '../homework/engine.js';
import type { Answer, HomeworkAttempt, HomeworkGroup } from '../types.ts';
import type { SubmitResult } from '../homework/engine.js';
import type { Homework30Lesson, Homework30Question } from '../../services/content/homework30.ts';

export const HOMEWORK30_VERSION = 'hsk1-homework-30-v1' as const;
export const HOMEWORK30_PARTS = ['choice', 'sort', 'listening', 'translationChoice', 'translation'] as const;
export type Homework30Part = typeof HOMEWORK30_PARTS[number];
export const HOMEWORK30_COUNTS = Object.freeze({ choice: 10, sort: 5, listening: 5, translationChoice: 5, translation: 5 });
export interface Homework30State {
  version: typeof HOMEWORK30_VERSION;
  lessons: Record<string, Partial<Record<Homework30Part, HomeworkGroup>>>;
  profile: { name: string; className: string };
  updatedAt: number | null;
}
const own = (row: object, key: string) => Object.prototype.hasOwnProperty.call(row, key);
const record = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value));
function fail(): never { throw new Error('新版作业备份的题目、成绩或提交状态无效。 · Câu hỏi, điểm hoặc trạng thái bản lưu bài tập 30 câu không hợp lệ.'); }
const stamp = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) >= 0 && Number(value) <= 8640000000000000;
const lessonId = (value: string | number) => /^([1-9]|1[0-5])$/.test(String(value));
const exact = (value: Record<string, unknown>, keys: readonly string[]) => { if (Object.keys(value).some(key => !keys.includes(key))) fail(); };
function same(left: unknown, right: unknown): boolean {
  if (left === right) return true;
  if (Array.isArray(left) && Array.isArray(right)) return left.length === right.length && left.every((value, i) => same(value, right[i]));
  return record(left) && record(right) && Object.keys(left).length === Object.keys(right).length && Object.keys(left).every(key => own(right, key) && same(left[key], right[key]));
}
export const blankHomework30 = (): Homework30State => ({ version: HOMEWORK30_VERSION, lessons: {}, profile: { name: '', className: '' }, updatedAt: null });
export function homework30Group(state: Homework30State, lesson: number, part: Homework30Part): HomeworkGroup {
  if (!lessonId(lesson) || !HOMEWORK30_PARTS.includes(part)) fail();
  const row = state.lessons[String(lesson)] ??= {};
  return row[part] ??= { draft: {}, orders: {}, first: null, attempt: null, latest: null, completed: false, history: [] };
}
export function homework30CanOpen(state: Homework30State, lesson: number, part: Homework30Part): boolean {
  const index = HOMEWORK30_PARTS.indexOf(part);
  return lessonId(lesson) && index >= 0 && HOMEWORK30_PARTS.slice(0, index).every(previous => !!state.lessons[String(lesson)]?.[previous]?.first);
}
export const homework30Answered = (question: Homework30Question, value: unknown) => legacy.isAnswered(question, value);
export const homework30Check = (question: Homework30Question, value: unknown) => legacy.check(question, value);
export function homework30ValidDraft(question: Homework30Question, value: unknown): value is Answer {
  if (question.kind === 'translation') return typeof value === 'string' && value.length <= legacy.MAX_TRANSLATION_LENGTH;
  if (question.kind === 'sort') return Array.isArray(value) && value.length <= question.tokens.length && new Set(value).size === value.length && value.every(i => Number.isInteger(i) && i >= 0 && i < question.tokens.length);
  return homework30Answered(question, value);
}
function makeAttempt(part: Homework30Part, questions: readonly Homework30Question[], answers: Record<string, Answer>, at: number): HomeworkAttempt {
  if (!stamp(at) || questions.length !== HOMEWORK30_COUNTS[part] || questions.some(q => !homework30Answered(q, answers[q.id]))) fail();
  const manual = part === 'translation';
  const results = manual ? null : Object.fromEntries(questions.map(q => [q.id, homework30Check(q, answers[q.id]) === true]));
  return { assessment: manual ? 'manual' : 'automatic', answers: Object.fromEntries(questions.map(q => [q.id, structuredClone(answers[q.id]!)])),
    results, correct: results ? Object.values(results).filter(Boolean).length : null, total: questions.length, at,
    questionFingerprints: Object.fromEntries(questions.map(q => [q.id, q.fingerprint])) };
}
export function submitHomework30(state: Homework30State, lesson: Homework30Lesson, part: Homework30Part, now = Date.now()): SubmitResult {
  if (!homework30CanOpen(state, lesson.lesson, part)) return { ok: false, reason: 'locked' };
  const current = state.lessons[String(lesson.lesson)]?.[part];
  if (current?.attempt) return { ok: false, reason: 'submitted' };
  const questions = lesson[part], draft = current?.draft ?? {};
  const missing = questions.filter(q => !homework30Answered(q, draft[q.id])).map(q => q.id);
  if (missing.length) return { ok: false, reason: 'missing', missing };
  const attempt = makeAttempt(part, questions, draft, now), group = homework30Group(state, lesson.lesson, part);
  group.first ??= structuredClone(attempt); group.latest = structuredClone(attempt); group.attempt = structuredClone(attempt);
  group.history = [...group.history, structuredClone(attempt)].slice(-20); group.completed = true; state.updatedAt = now;
  return { ok: true, manual: part === 'translation', correct: attempt.correct, total: attempt.total, completed: true, attempt };
}
export function restartHomework30(state: Homework30State, lesson: number, part: Homework30Part, now = Date.now()): void {
  const group = homework30Group(state, lesson, part); group.draft = {}; group.orders = {}; group.attempt = null; state.updatedAt = now;
}
/** Strict validation: reject fabricated scores, wrong fingerprints and any cross-version IDs. */
export function validateHomework30(input: unknown, bank: readonly Homework30Lesson[]): Homework30State {
  if (!record(input) || input.version !== HOMEWORK30_VERSION || !record(input.lessons) || !record(input.profile)) fail();
  exact(input, ['version', 'lessons', 'profile', 'updatedAt']); exact(input.profile, ['name', 'className']);
  const profile = input.profile;
  if (['name', 'className'].some(key => typeof profile[key] !== 'string' || (profile[key] as string).length > legacy.MAX_PROFILE_LENGTH) || (input.updatedAt !== null && !stamp(input.updatedAt))) fail();
  if (legacy.backupByteLength(input) > legacy.MAX_BACKUP_BYTES) fail();
  const state = blankHomework30(); state.profile = { name: input.profile.name as string, className: input.profile.className as string }; state.updatedAt = input.updatedAt as number | null;
  for (const [id, row] of Object.entries(input.lessons)) {
    const lesson = bank.find(item => item.lesson === Number(id));
    if (!lessonId(id) || !lesson || !record(row)) fail();
    exact(row, HOMEWORK30_PARTS);
    for (const part of HOMEWORK30_PARTS) {
      if (!own(row, part)) continue;
      const source = row[part]; if (!record(source)) fail();
      exact(source, ['draft', 'orders', 'first', 'attempt', 'latest', 'completed', 'history']);
      const questions = lesson[part], group = homework30Group(state, Number(id), part);
      if (!record(source.draft) || !record(source.orders)) fail();
      for (const [qid, answer] of Object.entries(source.draft)) {
        const question = questions.find(q => q.id === qid); if (!question || !homework30ValidDraft(question, answer)) fail();
        group.draft[qid] = structuredClone(answer);
      }
      for (const [qid, order] of Object.entries(source.orders)) {
        const question = questions.find(q => q.id === qid);
        if (!question || question.kind !== 'sort' || !Array.isArray(order) || order.length !== question.tokens.length || !homework30Answered(question, order)) fail();
        group.orders[qid] = order.slice();
      }
      const readAttempt = (value: unknown): HomeworkAttempt | null => {
        if (value === null) return null;
        if (!record(value) || !record(value.answers) || !stamp(value.at)) fail();
        exact(value, ['assessment', 'answers', 'results', 'correct', 'total', 'at', 'questionFingerprints']);
        const expected = makeAttempt(part, questions, value.answers as Record<string, Answer>, value.at);
        if (!same(value, expected)) fail();
        return expected;
      };
      group.first = readAttempt(source.first); group.latest = readAttempt(source.latest); group.attempt = readAttempt(source.attempt);
      if (!Array.isArray(source.history) || source.history.length > 20) fail();
      group.history = source.history.map(value => { const attempt = readAttempt(value); if (!attempt) fail(); return attempt; });
      group.completed = !!group.first;
      if (source.completed !== group.completed) fail();
      if (!group.first && (group.latest || group.attempt || group.history.length)) fail();
      if (group.first) {
        if (!group.latest || !group.history.length || !same(group.history.at(-1), group.latest) || (group.history.length < 20 && !same(group.history[0], group.first))) fail();
        if (group.attempt && (!same(group.attempt, group.latest) || !same(group.draft, group.attempt.answers))) fail();
      }
    }
  }
  for (const [id, row] of Object.entries(state.lessons)) for (const part of HOMEWORK30_PARTS) if (row[part]?.first && !homework30CanOpen(state, Number(id), part)) fail();
  return state;
}
export function homework30LessonTotals(state: Homework30State, lesson: number) {
  const row = state.lessons[String(lesson)] ?? {};
  const automaticParts = HOMEWORK30_PARTS.filter(part => part !== 'translation');
  const submitted = automaticParts.reduce((sum, part) => sum + (row[part]?.first?.total ?? 0), 0);
  const firstCorrect = automaticParts.reduce((sum, part) => sum + (row[part]?.first?.correct ?? 0), 0);
  const latestCorrect = automaticParts.reduce((sum, part) => sum + (row[part]?.latest?.correct ?? 0), 0);
  const completedGroups = HOMEWORK30_PARTS.filter(part => !!row[part]?.first).length;
  const manual = { total: 5, submitted: row.translation?.first?.total ?? 0, correct: null };
  return { homework: { total: 30, submitted: submitted + manual.submitted, completedGroups, done: completedGroups === 5 },
    automatic: { total: 25, submitted, firstCorrect, latestCorrect, firstPercent: submitted ? Math.round(firstCorrect / submitted * 100) : null, latestPercent: submitted ? Math.round(latestCorrect / submitted * 100) : null }, manual };
}
export function homework30CourseTotals(state: Homework30State) {
  const lessons = Array.from({ length: 15 }, (_, index) => homework30LessonTotals(state, index + 1));
  const submitted = lessons.reduce((n, row) => n + row.automatic.submitted, 0), firstCorrect = lessons.reduce((n, row) => n + row.automatic.firstCorrect, 0), latestCorrect = lessons.reduce((n, row) => n + row.automatic.latestCorrect, 0);
  const completedLessons = lessons.filter(row => row.homework.done).length;
  return { homework: { total: 450, submitted: lessons.reduce((n, row) => n + row.homework.submitted, 0), completedGroups: lessons.reduce((n, row) => n + row.homework.completedGroups, 0), completedLessons, lessonCount: 15, done: completedLessons === 15 },
    automatic: { total: 375, submitted, firstCorrect, latestCorrect, firstPercent: submitted ? Math.round(firstCorrect / submitted * 100) : null, latestPercent: submitted ? Math.round(latestCorrect / submitted * 100) : null },
    manual: { total: 75, submitted: lessons.reduce((n, row) => n + row.manual.submitted, 0), correct: null } };
}
