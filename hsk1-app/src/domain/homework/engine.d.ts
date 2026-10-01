import type { HomeworkAttempt, HomeworkGroup, HomeworkKind, HomeworkState } from '../types.ts';
export interface AutomaticTotals {
  total: number; submitted: number; firstCorrect: number; latestCorrect: number;
  firstPercent: number | null; latestPercent: number | null;
}
export interface LessonTotals {
  homework: { total: number; submitted: number; completedGroups: number; done: boolean };
  automatic: AutomaticTotals;
  manual: { total: number; submitted: number; correct: null };
  listening: AutomaticTotals & { available: boolean };
}
export interface CourseTotals extends Omit<LessonTotals, 'homework'> {
  homework: LessonTotals['homework'] & { completedLessons: number; lessonCount: number };
}
export type SubmitResult =
  | { ok: false; reason: 'locked' | 'submitted' }
  | { ok: false; reason: 'missing'; missing: string[] }
  | { ok: true; manual: boolean; correct: number | null; total: number; completed: true; attempt: HomeworkAttempt };
declare const engine: {
  APP: 'hsk1-stage2'; KEY: string; STEP1_KEY: string; LEGACY_KEY: string; SCHEMA: 3;
  KINDS: readonly HomeworkKind[]; PATH: readonly ['choice', 'sort', 'translation'];
  MAX_BACKUP_BYTES: number; MAX_ARCHIVE_BYTES: number; MAX_AUXILIARY_BYTES: number;
  MAX_TRANSLATION_LENGTH: number; MAX_PROFILE_LENGTH: number; MAX_BACKUP_WARNING_BYTES: number;
  blank(): HomeworkState;
  validateImport(input: unknown, bank: unknown): HomeworkState;
  migrateLegacy(input: unknown, bank: unknown, now?: number): HomeworkState;
  migrateStep1(input: unknown, bank: unknown, now?: number): HomeworkState;
  importBackup(input: unknown, bank: unknown, now?: number): HomeworkState;
  backupByteLength(input: unknown): number;
  courseTotals(state: HomeworkState, bank: unknown): CourseTotals;
  totals(state: HomeworkState, lesson: number | string, bank: unknown): LessonTotals;
  group(state: HomeworkState, lesson: number | string, kind: HomeworkKind): HomeworkGroup;
  submit(state: HomeworkState, lesson: number | string, kind: HomeworkKind, questions: unknown, now?: number): SubmitResult;
  restart(state: HomeworkState, lesson: number | string, kind: HomeworkKind, now?: number): HomeworkGroup;
  check(question: unknown, answer: unknown): boolean | null;
  normal(value: unknown): string;
  isAnswered(question: unknown, answer: unknown): boolean;
  canOpen(state: HomeworkState, lesson: number | string, kind: HomeworkKind): boolean;
};
export default engine;
