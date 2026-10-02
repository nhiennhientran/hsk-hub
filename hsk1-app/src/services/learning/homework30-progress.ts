import type { AppData } from '../storage/compatibility.ts';
import type { Route } from '../../app/contracts.ts';
import { HOMEWORK30_PARTS, blankHomework30, homework30CourseTotals, homework30LessonTotals } from '../../domain/homework30/engine.ts';
/** Counts only this explicit version. Legacy totals remain available via summarizeProgress. */
export function summarizeHomework30(data: AppData) {
  const state = data.homework30 ?? blankHomework30();
  const totals = homework30CourseTotals(state);
  const lessons = Array.from({ length: 15 }, (_, i) => {
    const lesson = i + 1, groups = state.lessons[String(lesson)] ?? {}, summary = homework30LessonTotals(state, lesson);
    const part = HOMEWORK30_PARTS.find(part => !groups[part]?.first) ?? 'choice';
    const manual = groups.translation, pending = manual && !manual.attempt ? manual.draft : {};
    const draftAnswered = Object.values(pending).filter(value => typeof value === 'string' && value.replace(/[\p{White_Space}\p{Default_Ignorable_Code_Point}]/gu, '').length > 0).length;
    return { lesson, ...summary, translation: { ...summary.manual, draftAnswered, hasDraft: Object.values(pending).some(value => typeof value === 'string' && value.length > 0), submittedAt: manual?.latest?.at ?? null },
      nextRoute: { feature: 'homework', lesson, part, homeworkVersion: '30-v1' } as Route };
  });
  return { version: state.version, ...totals, translation: { ...totals.manual, draftAnswered: lessons.reduce((n, row) => n + row.translation.draftAnswered, 0), draftLessons: lessons.filter(row => row.translation.hasDraft).length }, lessons };
}
