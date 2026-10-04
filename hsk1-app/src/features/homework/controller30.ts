import { captureHomeworkDraft, commitHomeworkPresentation, restartHomeworkPresentation, homeworkDisplaySnapshot } from '../../services/content/vi-presentation-state.ts';
import { defaultOfficialViRegistry, type OfficialViRegistry } from '../../services/content/official-vi-revisions.ts';
import legacy from '../../domain/homework/engine.js';
import { HOMEWORK30_PARTS, blankHomework30, homework30CanOpen, homework30Group, homework30Answered, homework30Check, homework30ValidDraft, homework30LessonTotals, homework30CourseTotals, submitHomework30, restartHomework30 } from '../../domain/homework30/engine.ts';
import type { Homework30Part, Homework30State } from '../../domain/homework30/engine.ts';
import type { Answer } from '../../domain/types.ts';
import type { Homework30Lesson } from '../../services/content/homework30.ts';
import type { SortQuestion } from '../../services/content/homework.ts';
import type { HomeworkStore, ActionResult } from './controller.ts';
export const HOMEWORK30_LIMITS = Object.freeze({ text: legacy.MAX_TRANSLATION_LENGTH, profile: legacy.MAX_PROFILE_LENGTH });
export function createHomework30Controller(options: { store: HomeworkStore; bank: readonly Homework30Lesson[]; lesson: number; part: Homework30Part; now?: () => number; onChange?: () => void; viRegistry?: OfficialViRegistry }) {
  const { store, part } = options;
  const lesson = options.bank.find(row => row.lesson === options.lesson);
  if (!lesson || !HOMEWORK30_PARTS.includes(part)) throw new Error('Bài tập không hợp lệ.');
  const questions = lesson[part], now = options.now ?? Date.now;
  const viRegistry = options.viRegistry ?? defaultOfficialViRegistry();
  const state = () => store.snapshot().data.homework30 ?? blankHomework30();
  const current = (s = state()) => s.lessons[String(lesson.lesson)]?.[part] ?? null;
  const writable = (): ActionResult => !homework30CanOpen(state(), lesson.lesson, part) ? { ok: false, reason: 'locked' } : current()?.attempt ? { ok: false, reason: 'submitted' } : { ok: true };
  const changed = (fn: (draft: Homework30State) => void) => { store.edit(data => { fn(data.homework30 ??= blankHomework30()); data.homework30.updatedAt = now(); }); options.onChange?.(); };
  const tokenOrder = (question: SortQuestion) => {
    const order = question.tokens.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j]!, order[i]!]; }
    if (order.length > 1 && order.every((n, i) => n === i)) order.push(order.shift()!);
    return order;
  };
  return {
    canOpen: (target: Homework30Part) => homework30CanOpen(state(), lesson.lesson, target),
    read() { const s = state(), group = current(s), totals = homework30LessonTotals(s, lesson.lesson); return { lesson, part, questions, group, profile: s.profile, locked: !homework30CanOpen(s, lesson.lesson, part), total: questions.length, answered: questions.filter(q => homework30Answered(q, group?.draft[q.id])).length, automaticTotals: totals.automatic, lessonTotals: totals, courseTotals: homework30CourseTotals(s) }; },
    answer(id: string, value: Answer): ActionResult {
      const question = questions.find(q => q.id === id); if (!question) return { ok: false, reason: 'unknown' };
      const permission = writable(); if (!permission.ok) return permission;
      if (!homework30ValidDraft(question, value)) return { ok: false, reason: 'invalid' };
      if (value === '' && current()?.draft[id] === undefined) return { ok: true };
      if (JSON.stringify(current()?.draft[id]) !== JSON.stringify(value)) {
        const before = store.snapshot().data; const previousDraft = before.homework30?.lessons[String(lesson.lesson)]?.[part]?.draft ?? {};
        const displayed = homeworkDisplaySnapshot(before, '30-v1', lesson.lesson, part, questions, 'draft', viRegistry);
        store.edit(data => { const s = data.homework30 ??= blankHomework30(); homework30Group(s, lesson.lesson, part).draft[id] = structuredClone(value); s.updatedAt = now(); captureHomeworkDraft(data, '30-v1', lesson.lesson, part, previousDraft, displayed); }); options.onChange?.();
      }
      return { ok: true };
    },
    profile(field: 'name' | 'className', value: string): ActionResult { if (!['name', 'className'].includes(field) || typeof value !== 'string' || value.length > HOMEWORK30_LIMITS.profile) return { ok: false, reason: 'invalid' }; if (state().profile[field] !== value) changed(s => { s.profile[field] = value; }); return { ok: true }; },
    ensureSortOrders(): ActionResult {
      if (part !== 'sort') return { ok: true };
      const permission = writable(); if (!permission.ok) return permission;
      const needed = lesson.sort.filter(q => !Object.prototype.hasOwnProperty.call(current()?.orders ?? {}, q.id));
      if (needed.length) changed(s => { const group = homework30Group(s, lesson.lesson, part); for (const q of needed) group.orders[q.id] = tokenOrder(q); });
      return { ok: true };
    },
    submit() { const stamp = now(), outcome = submitHomework30(state(), lesson, part, stamp); if (!outcome.ok) return outcome; store.edit(data => { const before = structuredClone(data.homework30?.lessons[String(lesson.lesson)]?.[part]); submitHomework30(data.homework30 ??= blankHomework30(), lesson, part, stamp); commitHomeworkPresentation(data, '30-v1', lesson.lesson, part, before); }); options.onChange?.(); return outcome; },
    restart(): ActionResult { const permission = homework30CanOpen(state(), lesson.lesson, part); if (!permission) return { ok: false, reason: 'locked' }; if (!current()?.attempt) return { ok: false, reason: 'invalid' }; store.edit(data => { restartHomework30(data.homework30 ??= blankHomework30(), lesson.lesson, part, now()); restartHomeworkPresentation(data, '30-v1', lesson.lesson, part); }); options.onChange?.(); return { ok: true }; },
    isAnswered(id: string): boolean { const question = questions.find(q => q.id === id); return !!question && homework30Answered(question, current()?.draft[id]); },
    check(id: string): boolean | null { const question = questions.find(q => q.id === id); return question ? homework30Check(question, current()?.draft[id]) : false; },
  };
}
