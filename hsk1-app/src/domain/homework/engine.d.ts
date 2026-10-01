import type { HomeworkAttempt, HomeworkGroup, HomeworkKind, HomeworkState } from '../types.ts';
interface Totals {
  homework: { total: number; submitted: number; completedGroups: number; completedLessons: number; lessonCount: number; done: boolean };
  automatic: { total: number; submitted: number; firstCorrect: number; latestCorrect: number; firstPercent: number | null; latestPercent: number | null };
  manual: { total: number; submitted: number; correct: null };
}
declare const engine: {
  APP: 'hsk1-stage2'; KEY: string; STEP1_KEY: string; LEGACY_KEY: string; SCHEMA: 3;
  MAX_BACKUP_BYTES: number; MAX_ARCHIVE_BYTES: number; MAX_AUXILIARY_BYTES: number;
  MAX_TRANSLATION_LENGTH: number; MAX_PROFILE_LENGTH: number; MAX_BACKUP_WARNING_BYTES: number;
  blank(): HomeworkState;
  validateImport(input: unknown, bank: unknown): HomeworkState;
  migrateLegacy(input: unknown, bank: unknown, now?: number): HomeworkState;
  migrateStep1(input: unknown, bank: unknown, now?: number): HomeworkState;
  importBackup(input: unknown, bank: unknown, now?: number): HomeworkState;
  backupByteLength(input: unknown): number;
  courseTotals(state: HomeworkState, bank: unknown): Totals;
  group(state: HomeworkState, lesson: number | string, kind: HomeworkKind): HomeworkGroup;
  submit(state: HomeworkState, lesson: number | string, kind: HomeworkKind, questions: unknown, now?: number): HomeworkAttempt;
  restart(state: HomeworkState, lesson: number | string, kind: HomeworkKind, now?: number): HomeworkGroup;
  check(question: unknown, answer: unknown): boolean;
  normal(value: unknown): string;
  isAnswered(question: unknown, answer: unknown): boolean;
  canOpen(state: HomeworkState, lesson: number | string, kind: HomeworkKind): boolean;
};
export default engine;
