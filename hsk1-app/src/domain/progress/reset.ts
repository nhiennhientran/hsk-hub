import type { JsonRecord } from '../types.ts';
import type { AppData } from '../../services/storage/compatibility.ts';

export const RESET_MODULES = ['textbook', 'homework', 'listening', 'vocabulary', 'exercises'] as const;
export type ResetModule = typeof RESET_MODULES[number];
export type ResetScope = { module: ResetModule | 'all'; lesson: number | null };
export interface ResetResult { data: AppData; title: string; removed: number; warnings: string[] }
const labels: Record<ResetModule | 'all', string> = {
  all: 'tất cả phần học', textbook: 'giáo trình và dấu từ đã thuộc', homework: 'bài tập',
  listening: 'luyện nghe', vocabulary: 'lịch ôn từ vựng', exercises: 'bài gốc, Bài 9 mở rộng và ôn câu',
};
function remainingSession(session: JsonRecord, field: 'questionIds' | 'senseIds', allowed: Set<string>, lessons: number[], maps: string[]): JsonRecord | null {
  const oldIds = session[field];
  if (!Array.isArray(oldIds)) return null;
  const ids = oldIds.filter((id): id is string => typeof id === 'string' && allowed.has(id));
  if (!lessons.length || !ids.length) return null;
  const output = structuredClone(session);
  output[field] = ids; output.lessons = lessons;
  output.position = Math.min(ids.length - 1, oldIds.slice(0, Number(session.position)).filter(id => typeof id === 'string' && allowed.has(id)).length);
  for (const key of ['fingerprints', ...maps]) {
    const values = session[key];
    output[key] = values && typeof values === 'object' && !Array.isArray(values)
      ? Object.fromEntries(Object.entries(values).filter(([id]) => allowed.has(id))) : {};
  }
  // Domain validation recalculates the finish timestamp from retained submissions/ratings.
  output.finishedAt = null;
  return output;
}

type Catalog = { listening: { id: string; lesson: number }[]; vocabulary: { senseId: string; lesson: number }[] };

/** Pure candidate only. The caller must show scope and confirm through the atomic store. */
export function resetProgress(input: AppData, scope: ResetScope, catalog: Catalog): ResetResult {
  if (!['all', ...RESET_MODULES].includes(scope.module) ||
      (scope.lesson !== null && (!Number.isInteger(scope.lesson) || scope.lesson < 1 || scope.lesson > 15))) {
    throw new Error('Phạm vi đặt lại không hợp lệ.');
  }
  const data = structuredClone(input), warnings: string[] = [];
  let removed = 0;
  const targets = (module: ResetModule) => scope.module === 'all' || scope.module === module;
  const matches = (id: number | string) => scope.lesson === null || Number(id) === scope.lesson;
  const erase = (values: object, key: string) => {
    if (Object.prototype.hasOwnProperty.call(values, key)) { delete (values as Record<string, unknown>)[key]; removed++; }
  };
  if (targets('textbook')) {
    for (const id of Object.keys(data.reading.lessons)) if (matches(id)) erase(data.reading.lessons, id);
    for (const id of Object.keys(data.reading.mastered)) if (matches(id.split('-')[0]!)) erase(data.reading.mastered, id);
    for (const id of Object.keys(data.reading.modules)) if (matches(id.slice(5))) erase(data.reading.modules, id);
  }
  if (targets('homework')) {
    for (const id of Object.keys(data.homework.lessons)) if (matches(id)) erase(data.homework.lessons, id);
    for (const [id, record] of Object.entries(data.exercises.records)) {
      if (!id.startsWith('homework:')) continue;
      const source = input.homework.questionReviews[id.slice(9)];
      const latest = record.submissions.at(-1);
      if (latest?.homeworkAttempts !== undefined && (scope.lesson === null ||
          (source && typeof source === 'object' && !Array.isArray(source) && matches(source.lesson as number)))) latest.homeworkAttempts = 0;
    }
    // Reviews are rebuilt from the remaining attempts by compatibility.validate.
    for (const [id, value] of Object.entries(data.homework.questionReviews)) {
      if (scope.lesson === null || (value && typeof value === 'object' && !Array.isArray(value) && matches(value.lesson as number))) erase(data.homework.questionReviews, id);
    }
  }
  if (targets('listening')) {
    const ids = new Set(catalog.listening.filter(q => matches(q.lesson)).map(q => q.id));
    for (const id of Object.keys(data.practice.listening.records)) if (ids.has(id)) erase(data.practice.listening.records, id);
    const session = data.practice.listening.session;
    if (session && (scope.lesson === null || (Array.isArray(session.lessons) && session.lessons.includes(scope.lesson)))) {
      const remaining = scope.lesson === null ? [] : (session.lessons as number[]).filter(id => id !== scope.lesson);
      const keptIds = new Set(catalog.listening.filter(q => remaining.includes(q.lesson)).map(q => q.id));
      data.practice.listening.session = remainingSession(session, 'questionIds', keptIds, remaining, ['optionOrders', 'responses']); removed++;
      const kept = data.practice.listening.session;
      if (kept && scope.lesson !== null) {
        const previous = session.resetScope as JsonRecord | undefined;
        kept.resetScope = { lessons: previous?.lessons ?? session.lessons!, questionIds: previous?.questionIds ?? session.questionIds!,
          removedLessons: [...new Set([...(Array.isArray(previous?.removedLessons) ? previous.removedLessons as number[] : []), scope.lesson])].sort((a, b) => a - b) };
      }
      warnings.push(data.practice.listening.session
        ? 'Lượt nghe đang mở bỏ các câu của bài đã chọn; câu trả lời, thứ tự và tiến độ các bài khác vẫn được giữ.'
        : 'Lượt nghe trong phạm vi này sẽ kết thúc. Kết quả và nháp ngoài phạm vi vẫn được giữ.');
    }
  }
  if (targets('vocabulary')) {
    const senses = new Map<string, number[]>();
    for (const item of catalog.vocabulary) senses.set(item.senseId, [...(senses.get(item.senseId) ?? []), item.lesson]);
    let shared = 0;
    for (const id of Object.keys(data.practice.cards.schedule)) {
      const lessons = senses.get(id) ?? [];
      if (!lessons.some(matches)) continue;
      // A sense has one shared schedule, never one pretend copy per lesson.
      if (scope.lesson !== null && lessons.some(n => n !== scope.lesson)) { shared++; continue; }
      erase(data.practice.cards.schedule, id);
    }
    if (shared) warnings.push(`${shared} lịch ôn nghĩa dùng chung với bài khác được giữ nguyên để không xóa tiến độ của bài đó.`);
    const review = data.practice.cards.review;
    if (review && (scope.lesson === null || (Array.isArray(review.lessons) && review.lessons.includes(scope.lesson)))) {
      const remaining = scope.lesson === null ? [] : (review.lessons as number[]).filter(id => id !== scope.lesson);
      const keptIds = new Set(catalog.vocabulary.filter(item => remaining.includes(item.lesson)).map(item => item.senseId));
      data.practice.cards.review = remainingSession(review, 'senseIds', keptIds, remaining, ['revealed', 'ratings']); removed++;
      warnings.push(data.practice.cards.review
        ? 'Lượt thẻ đang mở bỏ các nghĩa chỉ thuộc bài đã chọn; trạng thái lật thẻ, tự đánh giá và tiến độ bài khác được giữ.'
        : 'Lượt thẻ trong phạm vi này sẽ kết thúc. Các lịch ôn ngoài phạm vi vẫn được giữ.');
    }
  }
  return { data, title: `Đặt lại ${labels[scope.module]} · ${scope.lesson === null ? '15 bài' : `Bài ${scope.lesson}`}`,
    removed, warnings };
}
