import content from '../../../content/homework30-bank.json' with { type: 'json' };
import type { ChoiceQuestion, SortQuestion, TranslationQuestion, HomeworkLesson, QuestionSource } from './homework.ts';
import { HOMEWORK30_VERSION, HOMEWORK30_PARTS, HOMEWORK30_COUNTS } from '../../domain/homework30/engine.ts';
import type { AudioRequest } from '../audio/index.ts';

export interface Homework30ListeningQuestion extends Omit<ChoiceQuestion, 'kind'> {
  readonly kind: 'listening';
  readonly transcript: string;
  readonly audio: { readonly track: string; readonly start: number; readonly end: number };
  readonly pinyin?: string;
}
export type Homework30Question = ChoiceQuestion | SortQuestion | TranslationQuestion | Homework30ListeningQuestion;
export interface Homework30Lesson extends HomeworkLesson {
  readonly listening: readonly Homework30ListeningQuestion[];
  readonly translationChoice: readonly ChoiceQuestion[];
}
const row = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown) => typeof value === 'string' && value.trim().length > 0;
const source = (value: unknown): value is QuestionSource => row(value) && text(value.label) && ['printPages', 'pdfPages'].every(key => Array.isArray(value[key]) && value[key].every(page => Number.isInteger(page) && page > 0));
export function validateHomework30Bank(value: unknown): readonly Homework30Lesson[] {
  if (!row(value) || value.version !== HOMEWORK30_VERSION || value.schemaVersion !== 1 || !Array.isArray(value.lessons) || value.lessons.length !== 15) throw new Error('新版作业题库版本不匹配。 · Ngân hàng bài tập 30 câu không đúng phiên bản.');
  const ids = new Set<string>(), lessons = new Set<number>();
  for (const lesson of value.lessons) {
    if (!row(lesson) || !Number.isInteger(lesson.lesson) || Number(lesson.lesson) < 1 || Number(lesson.lesson) > 15 || lesson.id !== lesson.lesson || lessons.has(Number(lesson.lesson)) || !source(lesson.source)) throw new Error('Invalid homework30 lesson');
    lessons.add(Number(lesson.lesson));
    for (const part of HOMEWORK30_PARTS) {
      const questions = lesson[part];
      if (!Array.isArray(questions) || questions.length !== HOMEWORK30_COUNTS[part]) throw new Error('Homework30 requires exactly 10+5+5+5+5 questions');
      for (const q of questions) {
        const kind = part === 'translationChoice' ? 'choice' : part;
        if (!row(q) || typeof q.id !== 'string' || !q.id.startsWith(`hw30-v1-l${String(lesson.lesson).padStart(2, '0')}-${part}-`) || ids.has(q.id) || q.lesson !== lesson.lesson || q.kind !== kind || !text(q.prompt) || !source(q.source) || typeof q.fingerprint !== 'string' || !/^[a-f0-9]{64}$/.test(q.fingerprint) || q.assessment !== (part === 'translation' ? 'manual' : 'automatic')) throw new Error('Invalid homework30 identity');
        ids.add(q.id);
        if (kind === 'translation') {
          if (['answer', 'answers', 'options', 'explanation', 'optionFeedback'].some(key => key in q)) throw new Error('Manual writing must not contain automatic answers');
        } else if (kind === 'sort') {
          if (!Array.isArray(q.tokens) || q.tokens.length < 1 || !q.tokens.every(text) || !Array.isArray(q.answers) || !q.answers.length || !q.answers.every(text) || !text(q.explanation)) throw new Error('Invalid sorting question');
        } else {
          if (!Array.isArray(q.options) || q.options.length !== 4 || !q.options.every(text) || new Set(q.options).size !== 4 || !Number.isInteger(q.answer) || Number(q.answer) < 0 || Number(q.answer) > 3 || !text(q.explanation) || !Array.isArray(q.optionFeedback) || q.optionFeedback.length !== 4 || !q.optionFeedback.every(text)) throw new Error('Invalid multiple choice question');
        }
        if (kind === 'listening' && (!text(q.transcript) || !row(q.audio) || !/^[1-9]\d?-[1-9]\d?$/.test(String(q.audio.track)) || !Number.isFinite(q.audio.start) || !Number.isFinite(q.audio.end) || Number(q.audio.start) < 0 || Number(q.audio.end) <= Number(q.audio.start))) throw new Error('Invalid homework listening audio');
      }
    }
  }
  return value.lessons as unknown as readonly Homework30Lesson[];
}
let bank: readonly Homework30Lesson[] | undefined;
export function getHomework30Bank(): readonly Homework30Lesson[] { return bank ??= validateHomework30Bank(content); }
export async function loadHomework30Bank(signal: AbortSignal): Promise<readonly Homework30Lesson[]> { signal.throwIfAborted(); return getHomework30Bank(); }
export function homework30Audio(question: Homework30ListeningQuestion, base = document.baseURI): AudioRequest {
  return { url: new URL(`course-assets/audio/${question.audio.track}.mp3`, base).href, start: question.audio.start, end: question.audio.end, label: `第${question.lesson}课 · Bài ${question.lesson} · ${question.prompt}`, sourceKind: 'segment' };
}
