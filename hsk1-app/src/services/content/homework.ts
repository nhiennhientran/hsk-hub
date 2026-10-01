import bankURL from '../../../content/stage2-bank.json?url';
import engine from '../../domain/homework/engine.js';

export type HomeworkPart = 'choice' | 'sort' | 'translation';
export interface QuestionSource {
  readonly label: string;
  readonly printPages: readonly number[];
  readonly pdfPages: readonly number[];
}
interface QuestionBase {
  readonly id: string;
  readonly lesson: number;
  readonly prompt: string;
  readonly source: QuestionSource;
  readonly fingerprint: string;
  readonly skill: string;
  readonly stem?: string;
  readonly meaning?: string;
}
export interface ChoiceQuestion extends QuestionBase {
  readonly kind: 'choice';
  readonly assessment: 'automatic';
  readonly options: readonly string[];
  readonly answer: number;
  readonly explanation: string;
  readonly optionFeedback: readonly string[];
}
export interface SortQuestion extends QuestionBase {
  readonly kind: 'sort';
  readonly assessment: 'automatic';
  readonly tokens: readonly string[];
  readonly answers: readonly string[];
  readonly explanation: string;
}
export interface TranslationQuestion extends QuestionBase {
  readonly kind: 'translation';
  readonly assessment: 'manual';
}
export type HomeworkQuestion = ChoiceQuestion | SortQuestion | TranslationQuestion;
export interface HomeworkLesson {
  readonly id: number;
  readonly lesson: number;
  readonly title: string;
  readonly title_vi: string;
  readonly goal_vi: string;
  readonly scope_note_vi: string;
  readonly source: QuestionSource;
  readonly choice: readonly ChoiceQuestion[];
  readonly sort: readonly SortQuestion[];
  readonly translation: readonly TranslationQuestion[];
}
const row = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const source = (value: unknown): boolean => row(value) && text(value.label) &&
  ['printPages', 'pdfPages'].every(key => Array.isArray(value[key]) && value[key].every(page => Number.isInteger(page) && page > 0));

/** Validate the student bank; manual tasks must never gain teacher answers. */
export function validateHomeworkBank(value: unknown): readonly HomeworkLesson[] {
  if (!row(value) || value.schemaVersion !== 1 || !Array.isArray(value.lessons) || value.lessons.length !== 15) {
    throw new Error('Ngân hàng bài tập không đúng phiên bản.');
  }
  for (const lesson of value.lessons) {
    if (!row(lesson) || lesson.id !== lesson.lesson || !Number.isInteger(lesson.id) || Number(lesson.id) < 1 || Number(lesson.id) > 15 ||
        !['title', 'title_vi', 'goal_vi', 'scope_note_vi'].every(key => text(lesson[key])) || !source(lesson.source)) {
      throw new Error('Thông tin bài học không hợp lệ.');
    }
    for (const part of ['choice', 'sort', 'translation'] as const) {
      const questions = lesson[part];
      if (!Array.isArray(questions) || questions.length !== 5 || questions.some(q => !row(q) ||
          q.lesson !== lesson.lesson || q.kind !== part || q.assessment !== (part === 'translation' ? 'manual' : 'automatic') ||
          !text(q.prompt) || !text(q.skill) || !source(q.source) ||
          typeof q.fingerprint !== 'string' || !/^[a-f0-9]{64}$/.test(q.fingerprint) ||
          (part !== 'translation' && !text(q.explanation)) ||
          (part === 'choice' && (!Array.isArray(q.optionFeedback) || q.optionFeedback.length !== 4 || !q.optionFeedback.every(text))) ||
          (part === 'translation' && Object.keys(q).some(key => !['id', 'kind', 'assessment', 'legacyCompatible', 'skill',
            'source', 'prompt', 'lesson', 'sourceQuestionId', 'fingerprint'].includes(key))))) {
        throw new Error('Nội dung hoặc giải thích bài tập không hợp lệ.');
      }
    }
  }
  // The existing rules check IDs, four choices, token permutations and manual assessment.
  engine.validateImport(engine.blank(), value.lessons);
  return value.lessons as unknown as readonly HomeworkLesson[];
}

export async function loadHomeworkBank(signal: AbortSignal): Promise<readonly HomeworkLesson[]> {
  const response = await fetch(bankURL, { signal });
  if (!response.ok) throw new Error(`Homework bank HTTP ${response.status}`);
  const value: unknown = await response.json();
  if (signal.aborted) throw new DOMException('Module left.', 'AbortError');
  return validateHomeworkBank(value);
}
