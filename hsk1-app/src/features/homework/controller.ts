import { captureHomeworkDraft, commitHomeworkPresentation, restartHomeworkPresentation, homeworkDisplaySnapshot } from '../../services/content/vi-presentation-state.ts';
import { defaultOfficialViRegistry, type OfficialViRegistry } from '../../services/content/official-vi-revisions.ts';
import engine from '../../domain/homework/engine.js';
import type { SubmitResult } from '../../domain/homework/engine.js';
import type { Answer, HomeworkState } from '../../domain/types.ts';
import type { AppData } from '../../services/storage/compatibility.ts';
import type { HomeworkLesson, HomeworkPart, SortQuestion } from '../../services/content/homework.ts';

export const HOMEWORK_LIMITS = Object.freeze({ text: engine.MAX_TRANSLATION_LENGTH, profile: engine.MAX_PROFILE_LENGTH });

export interface HomeworkStore {
  snapshot(): { data: AppData };
  edit(mutator: (draft: AppData) => void): void;
}
export type ActionResult = { ok: true } | { ok: false; reason: 'locked' | 'submitted' | 'invalid' | 'unknown' };
export interface ControllerOptions {
  store: HomeworkStore;
  bank: readonly HomeworkLesson[];
  lesson: number;
  part: HomeworkPart;
  now?: () => number;
  onChange?: () => void;
  viRegistry?: OfficialViRegistry;
}
const equalAnswer = (left: Answer | undefined, right: Answer) => JSON.stringify(left) === JSON.stringify(right);
const own = (object: object, key: string) => Object.prototype.hasOwnProperty.call(object, key);

/** View actions touch only this lesson's homework; the application owns persistence. */
export function createHomeworkController(options: ControllerOptions) {
  const { store, bank, part } = options;
  const lesson = bank.find(row => row.lesson === options.lesson);
  if (!lesson || !['choice', 'sort', 'translation'].includes(part)) throw new Error('Bài tập không hợp lệ.');
  const questions = lesson[part];
  const now = options.now ?? Date.now;
  const viRegistry = options.viRegistry ?? defaultOfficialViRegistry();
  const changed = (mutator: (state: HomeworkState) => void) => {
    store.edit(data => { mutator(data.homework); data.homework.updatedAt = now(); });
    options.onChange?.();
  };
  const current = (state: HomeworkState) => state.lessons[String(lesson.lesson)]?.[part] ?? null;
  const writable = (state: HomeworkState): ActionResult => !engine.canOpen(state, lesson.lesson, part)
    ? { ok: false, reason: 'locked' } : current(state)?.attempt ? { ok: false, reason: 'submitted' } : { ok: true };
  function tokenOrder(question: SortQuestion): number[] {
    const order = question.tokens.map((_, index) => index);
    for (let index = order.length - 1; index > 0; index--) {
      const next = Math.floor(Math.random() * (index + 1));
      [order[index], order[next]] = [order[next], order[index]];
    }
    if (order.length > 1 && order.every((value, index) => value === index)) order.push(order.shift()!);
    return order;
  }
  return {
    canOpen(kind: HomeworkPart): boolean { return engine.canOpen(store.snapshot().data.homework, lesson.lesson, kind); },
    read() {
      const state = store.snapshot().data.homework;
      const group = current(state);
      const totals = engine.totals(state, lesson.lesson, lesson);
      return { lesson, part, questions, group, profile: state.profile,
        locked: !engine.canOpen(state, lesson.lesson, part), total: questions.length,
        answered: questions.filter(q => engine.isAnswered(q, group?.draft[q.id])).length,
        automaticTotals: totals.automatic, lessonTotals: totals, courseTotals: engine.courseTotals(state, bank) };
    },
    answer(id: string, value: Answer): ActionResult {
      const question = questions.find(q => q.id === id);
      if (!question) return { ok: false, reason: 'unknown' };
      const state = store.snapshot().data.homework;
      const canWrite = writable(state); if (!canWrite.ok) return canWrite;
      const valid = question.kind === 'translation'
        ? typeof value === 'string' && value.length <= engine.MAX_TRANSLATION_LENGTH
        : question.kind === 'sort' ? Array.isArray(value) && value.length <= question.tokens.length &&
          new Set(value).size === value.length && Array.from(value).every(index => Number.isInteger(index) && index >= 0 && index < question.tokens.length)
          : engine.isAnswered(question, value);
      if (!valid) return { ok: false, reason: 'invalid' };
      // Collecting an untouched textarea must not create a draft or an exit warning.
      // Clearing previously entered text still persists the explicit empty answer.
      if (question.kind === 'translation' && value === '' && current(state)?.draft[id] === undefined) return { ok: true };
      if (!equalAnswer(current(state)?.draft[id], value)) {
        const before = store.snapshot().data;
        const displayed = homeworkDisplaySnapshot(before, 'legacy', lesson.lesson, part, questions, 'draft', viRegistry);
        const previousDraft = current(before.homework)?.draft ?? {};
        store.edit(data => { engine.group(data.homework, lesson.lesson, part).draft[id] = value; data.homework.updatedAt = now(); captureHomeworkDraft(data, 'legacy', lesson.lesson, part, previousDraft, displayed); });
        options.onChange?.();
      }
      return { ok: true };
    },
    profile(field: 'name' | 'className', value: string): ActionResult {
      if (!['name', 'className'].includes(field) || typeof value !== 'string' || value.length > engine.MAX_PROFILE_LENGTH) {
        return { ok: false, reason: 'invalid' };
      }
      if (store.snapshot().data.homework.profile[field] !== value) changed(state => { state.profile[field] = value; });
      return { ok: true };
    },
    ensureSortOrders(): ActionResult {
      if (part !== 'sort') return { ok: true };
      const state = store.snapshot().data.homework;
      const canWrite = writable(state); if (!canWrite.ok) return canWrite;
      const needed = lesson.sort.filter(q => !own(current(state)?.orders ?? {}, q.id));
      if (needed.length) changed(draft => {
        const group = engine.group(draft, lesson.lesson, part);
        for (const question of needed) group.orders[question.id] = tokenOrder(question);
      });
      return { ok: true };
    },
    submit(): SubmitResult {
      // Run against the independent snapshot first: missing/repeated attempts never create dirty data.
      const state = store.snapshot().data.homework;
      const stamp = now();
      const outcome = engine.submit(state, lesson.lesson, part, questions, stamp);
      if (!outcome.ok) return outcome;
      store.edit(data => { const before = structuredClone(current(data.homework) ?? undefined); engine.submit(data.homework, lesson.lesson, part, questions, stamp); commitHomeworkPresentation(data, 'legacy', lesson.lesson, part, before); });
      options.onChange?.();
      return outcome;
    },
    restart(): ActionResult {
      const state = store.snapshot().data.homework;
      if (!engine.canOpen(state, lesson.lesson, part)) return { ok: false, reason: 'locked' };
      if (!current(state)?.attempt) return { ok: false, reason: 'invalid' };
      store.edit(data => {
        const group = engine.restart(data.homework, lesson.lesson, part, now());
        if (part === 'sort') for (const question of lesson.sort) group.orders[question.id] = tokenOrder(question);
        restartHomeworkPresentation(data, 'legacy', lesson.lesson, part);
      }); options.onChange?.();
      return { ok: true };
    },
    isAnswered(id: string): boolean {
      const question = questions.find(q => q.id === id);
      return !!question && engine.isAnswered(question, current(store.snapshot().data.homework)?.draft[id]);
    },
    check(id: string): boolean | null {
      const question = questions.find(q => q.id === id);
      return question ? engine.check(question, current(store.snapshot().data.homework)?.draft[id]) : false;
    },
  };
}
export type HomeworkController = ReturnType<typeof createHomeworkController>;
