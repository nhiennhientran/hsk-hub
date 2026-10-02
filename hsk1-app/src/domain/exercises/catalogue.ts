import type { Answer } from '../types.ts';

export type ExerciseSet = 'original' | 'pilot' | 'homework-review';
export type ExerciseFilter = 'all' | 'wrong' | 'due';
export type ExerciseGroup = 'choice' | 'sort' | 'translation' | 'listening' | 'words' | 'grammar' | 'reading' | 'ordering';
export interface ExerciseSource { readonly file?: string; readonly commit?: string; readonly line?: number; readonly book?: string; readonly page?: number; readonly pdfPage?: number; readonly label?: string; readonly printPages?: readonly number[]; readonly pdfPages?: readonly number[]; readonly [key: string]: unknown }
interface TaskBase { readonly id: string; readonly lesson: number; readonly prompt: string; readonly fingerprint: string; readonly stem?: string; readonly meaning?: string; readonly skill?: string }
export interface ChoiceTask extends TaskBase { readonly kind: 'choice'; readonly assessment: 'automatic'; readonly options: readonly string[]; readonly answer: number; readonly explanation: string; readonly audio?: { readonly track: string; readonly start: number; readonly end: number }; readonly transcript?: string; readonly pinyin?: string }
export interface SortTask extends TaskBase { readonly kind: 'sort'; readonly assessment: 'automatic'; readonly tokens: readonly string[]; readonly answers: readonly string[]; readonly explanation: string }
export interface ManualTask extends TaskBase { readonly kind: 'manual'; readonly assessment: 'manual' }
export type ExerciseTask = ChoiceTask | SortTask | ManualTask;
export interface ExerciseEntry { readonly id: string; readonly oldId: string; readonly set: ExerciseSet; readonly group: ExerciseGroup; readonly lesson: number; readonly authorityId: string; readonly source: ExerciseSource; readonly prompt?: string; readonly stem?: string; readonly meaning?: string; readonly explanation?: string; readonly optionOrder?: readonly number[]; readonly tokenOrder?: readonly number[]; readonly passageId?: string; readonly migration?: { readonly schema: 2; readonly authorityFingerprint: string; readonly sourcePayloadSha256: string; readonly eligible: boolean } }
export interface OralActivity { readonly id: string; readonly lesson: number; readonly title: string; readonly prompt: string; readonly stems: readonly string[]; readonly note: string; readonly source: ExerciseSource }
export interface ExerciseCatalogue { readonly tasks: ReadonlyMap<string, ExerciseTask>; readonly entries: readonly ExerciseEntry[]; readonly entryById: ReadonlyMap<string, ExerciseEntry>; readonly passages: Readonly<Record<string, { readonly lines: readonly string[]; readonly source: ExerciseSource }>>; readonly oral: readonly OralActivity[] }
export const exerciseGroupLabels: Record<ExerciseGroup, string> = { choice: 'Chọn đáp án', sort: 'Xếp câu', translation: 'Dịch Việt → Trung', listening: 'Nghe chọn đáp án', words: 'Từ vựng & pinyin', grammar: 'Ngữ pháp', reading: 'Đọc hiểu', ordering: 'Xếp câu' };
export const exerciseSetLabels: Record<ExerciseSet, string> = { original: 'Luyện tổng hợp · 300 câu', pilot: 'Bài 9 mở rộng · 30 câu', 'homework-review': 'Ôn câu đã nộp' };
type Row = Record<string, unknown>;
const row = (v: unknown): v is Row => v !== null && typeof v === 'object' && !Array.isArray(v);
const text = (v: unknown): v is string => typeof v === 'string' && !!v.trim();
const strings = (v: unknown): v is string[] => Array.isArray(v) && v.length > 0 && v.every(text);
const hash = (v: unknown) => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v);
const validLesson = (v: unknown) => Number.isInteger(v) && Number(v) >= 1 && Number(v) <= 15;
function fail(): never { throw new Error('Nội dung bài tập bổ sung không hợp lệ.'); }
function freeze<T>(v: T): T { if (v && typeof v === 'object') { Object.values(v).forEach(freeze); Object.freeze(v); } return v; }
function validateTask(q: unknown): ExerciseTask {
  if (!row(q) || !text(q.id) || !validLesson(q.lesson) || !text(q.prompt) || !hash(q.fingerprint)) fail();
  if (q.kind === 'manual') {
    if (q.assessment !== 'manual' || Object.keys(q).some(k => !['id', 'lesson', 'kind', 'assessment', 'prompt', 'fingerprint'].includes(k))) fail();
  } else if (q.kind === 'choice') {
    if (q.assessment !== 'automatic' || !strings(q.options) || q.options.length !== 4 || new Set(q.options).size !== 4 || !Number.isInteger(q.answer) || Number(q.answer) < 0 || Number(q.answer) > 3 || !text(q.explanation)) fail();
    if (q.audio !== undefined && (!row(q.audio) || !new RegExp(`^${q.lesson}-[1-7]$`).test(String(q.audio.track)) || typeof q.audio.start !== 'number' || !Number.isFinite(q.audio.start) || q.audio.start < 0 || typeof q.audio.end !== 'number' || !Number.isFinite(q.audio.end) || q.audio.end <= q.audio.start || !text(q.transcript) || !text(q.pinyin))) fail();
  } else if (q.kind === 'sort') {
    if (q.assessment !== 'automatic' || !strings(q.tokens) || !strings(q.answers) || !text(q.explanation)) fail();
    for (const answer of q.answers) if (normal(answer).split('').sort().join('') !== normal(q.tokens.join('')).split('').sort().join('')) fail();
  } else fail();
  return freeze(q as unknown as ExerciseTask);
}
export const normal = (value: string): string => value.normalize('NFKC').replace(/[\s\p{P}\p{S}]/gu, '').toLowerCase();

/** Existing answer data is referenced once; source-specific prompts are entry metadata. */
export function createExerciseCatalogue(legacyInput: unknown, bankInput: unknown, _listeningInput?: unknown): ExerciseCatalogue {
  const input = structuredClone(legacyInput), bank = structuredClone(bankInput);
  if (!row(input) || input.schemaVersion !== 1 || !Array.isArray(input.tasks) || !Array.isArray(input.entries) || !row(input.passages) || !Array.isArray(input.oral)) fail();
  const lessons = Array.isArray(bank) ? bank : row(bank) ? bank.lessons : null;
  if (!Array.isArray(lessons) || lessons.length !== 15) fail();
  const tasks = new Map<string, ExerciseTask>(), entries: ExerciseEntry[] = [];
  for (const lesson of lessons) {
    if (!row(lesson)) fail();
    for (const kind of ['choice', 'sort', 'translation'] as const) {
      const questions = lesson[kind]; if (!Array.isArray(questions)) fail();
      for (const raw of questions) {
        if (!row(raw) || !text(raw.id)) fail();
        const id = `homework:${raw.id}`;
        const q = kind === 'translation' ? { id, lesson: raw.lesson, kind: 'manual', assessment: 'manual', prompt: raw.prompt, fingerprint: raw.fingerprint }
          : { ...Object.fromEntries(Object.entries(raw).filter(([k]) => ['lesson', 'kind', 'assessment', 'prompt', 'stem', 'meaning', 'options', 'answer', 'tokens', 'answers', 'explanation', 'skill', 'fingerprint'].includes(k))), id };
        tasks.set(id, validateTask(q));
        if (kind !== 'translation') entries.push(freeze({ id, oldId: raw.id, set: 'homework-review', group: kind, lesson: Number(raw.lesson), authorityId: id, source: raw.source as ExerciseSource }));
      }
    }
  }
  for (const raw of input.tasks) { const q = validateTask(raw); if (!q.id.startsWith('legacy:') || tasks.has(q.id)) fail(); tasks.set(q.id, q); }
  for (const raw of input.entries) {
    if (!row(raw) || !text(raw.id) || !text(raw.oldId) || !['original', 'pilot'].includes(String(raw.set)) || !Object.hasOwn(exerciseGroupLabels, String(raw.group)) || !validLesson(raw.lesson) || !text(raw.authorityId) || !row(raw.source)) fail();
    const task = tasks.get(raw.authorityId); if (!task || task.lesson !== raw.lesson || (raw.set === 'pilot' && raw.lesson !== 9)) fail();
    if (task.kind === 'manual' && Object.keys(raw).some(k => !['id', 'oldId', 'set', 'group', 'lesson', 'authorityId', 'source', 'prompt'].includes(k))) fail();
    for (const key of ['optionOrder', 'tokenOrder'] as const) {
      const order = raw[key]; if (order === undefined) continue;
      const size = key === 'optionOrder' && task.kind === 'choice' ? task.options.length : key === 'tokenOrder' && task.kind === 'sort' ? task.tokens.length : 0;
      if (!Array.isArray(order) || order.length !== size || new Set(order).size !== size || order.some(x => !Number.isInteger(x) || x < 0 || x >= size)) fail();
    }
    if (raw.passageId !== undefined && (!text(raw.passageId) || !row(input.passages[raw.passageId]))) fail();
    entries.push(freeze(raw as unknown as ExerciseEntry));
  }
  if (entries.filter(e => e.set === 'original').length !== 300 || entries.filter(e => e.set === 'pilot').length !== 30 || entries.filter(e => e.set === 'homework-review').length !== 150 || new Set(entries.map(e => e.id)).size !== entries.length) fail();
  for (let lesson = 1; lesson <= 15; lesson++) for (const group of ['choice', 'sort', 'translation', 'listening']) if (entries.filter(e => e.set === 'original' && e.lesson === lesson && e.group === group).length !== 5) fail();
  for (const passage of Object.values(input.passages)) if (!row(passage) || !strings(passage.lines) || !row(passage.source)) fail();
  for (const activity of input.oral) if (!row(activity) || !validLesson(activity.lesson) || !['id', 'title', 'prompt', 'note'].every(k => text(activity[k])) || !strings(activity.stems) || !row(activity.source)) fail();
  return Object.freeze({ tasks, entries: freeze(entries), entryById: new Map(entries.map(e => [e.id, e])), passages: freeze(input.passages) as ExerciseCatalogue['passages'], oral: freeze(input.oral) as unknown as readonly OralActivity[] });
}
export function validAnswer(task: ExerciseTask, answer: unknown, complete = false): answer is Answer {
  if (task.kind === 'manual') return typeof answer === 'string' && answer.length <= 4000 && (!complete || !!answer.replace(/[\p{White_Space}\p{Default_Ignorable_Code_Point}]/gu, ''));
  if (task.kind === 'choice') return Number.isInteger(answer) && Number(answer) >= 0 && Number(answer) < task.options.length;
  return Array.isArray(answer) && answer.length <= task.tokens.length && (!complete || answer.length === task.tokens.length) && new Set(answer).size === answer.length && answer.every(index => Number.isInteger(index) && index >= 0 && index < task.tokens.length);
}
export function checkAnswer(task: ExerciseTask, answer: Answer): boolean | null {
  if (!validAnswer(task, answer, true)) throw new Error('Hãy trả lời đầy đủ trước khi nộp.');
  if (task.kind === 'manual') return null;
  return task.kind === 'choice' ? answer === task.answer : task.answers.some(correct => normal(correct) === normal((answer as number[]).map(index => task.tokens[index]).join('')));
}
