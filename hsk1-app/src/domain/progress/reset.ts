import { dataWarning } from '../../services/storage/copy.ts';
import type { JsonRecord } from '../types.ts';
import type { AppData } from '../../services/storage/compatibility.ts';

export const RESET_MODULES = ['textbook', 'homework', 'listening', 'vocabulary', 'exercises'] as const;
export type ResetModule = typeof RESET_MODULES[number];
export type ResetScope = { module: ResetModule | 'all'; lesson: number | null; homeworkVersion?: '30-v1' | 'legacy' | 'all' };
export interface ResetResult { data: AppData; title: string; removed: number; warnings: string[] }
const chineseLabels: Record<ResetModule | 'all', string> = {
  all: '所有学习模块', textbook: '教材与掌握标记', homework: '作业', listening: '听力练习',
  vocabulary: '词汇复习计划', exercises: '原版练习、第9课拓展与句子复习',
};
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
  if ((scope.homeworkVersion !== undefined && !['30-v1', 'legacy', 'all'].includes(scope.homeworkVersion)) || !['all', ...RESET_MODULES].includes(scope.module) ||
      (scope.lesson !== null && (!Number.isInteger(scope.lesson) || scope.lesson < 1 || scope.lesson > 15))) {
    throw new Error(dataWarning({"zh": "重置范围无效。", "vi": "Phạm vi đặt lại không hợp lệ."}));
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
  if (targets('homework') && scope.homeworkVersion !== 'legacy' && data.homework30) {
    for (const id of Object.keys(data.homework30.lessons)) if (matches(id)) erase(data.homework30.lessons, id);
  }
  if (targets('homework') && scope.homeworkVersion !== '30-v1') {
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
        ? dataWarning({"zh": "当前听力练习将移除所选课次的题目，其他课次的答案、顺序和进度仍保留。", "vi": "Lượt nghe đang mở bỏ các câu của bài đã chọn; câu trả lời, thứ tự và tiến độ các bài khác vẫn được giữ."})
        : dataWarning({"zh": "此范围内的听力练习将结束，范围之外的成绩和草稿仍保留。", "vi": "Lượt nghe trong phạm vi này sẽ kết thúc. Kết quả và nháp ngoài phạm vi vẫn được giữ."}));
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
    if (shared) warnings.push(dataWarning({ zh: `保留 ${shared} 个与其他课次共享的义项复习计划，以免删除其他课次的进度。`, vi: `${shared} lịch ôn nghĩa dùng chung với bài khác được giữ nguyên để không xóa tiến độ của bài đó.` }));
    const review = data.practice.cards.review;
    if (review && (scope.lesson === null || (Array.isArray(review.lessons) && review.lessons.includes(scope.lesson)))) {
      const remaining = scope.lesson === null ? [] : (review.lessons as number[]).filter(id => id !== scope.lesson);
      const keptIds = new Set(catalog.vocabulary.filter(item => remaining.includes(item.lesson)).map(item => item.senseId));
      data.practice.cards.review = remainingSession(review, 'senseIds', keptIds, remaining, ['revealed', 'ratings']); removed++;
      warnings.push(data.practice.cards.review
        ? dataWarning({"zh": "当前词卡练习将移除仅属于所选课次的义项；其他课次的翻卡状态、自评和进度仍保留。", "vi": "Lượt thẻ đang mở bỏ các nghĩa chỉ thuộc bài đã chọn; trạng thái lật thẻ, tự đánh giá và tiến độ bài khác được giữ."})
        : dataWarning({"zh": "此范围内的词卡练习将结束，范围之外的复习计划仍保留。", "vi": "Lượt thẻ trong phạm vi này sẽ kết thúc. Các lịch ôn ngoài phạm vi vẫn được giữ."}));
    }
  }
  if (targets('homework')) warnings.push(dataWarning({ zh: scope.homeworkVersion === 'legacy' ? '仅重置旧版15题作业；新版30题记录保留。' : scope.homeworkVersion === '30-v1' ? '仅重置新版30题作业；旧版15题记录保留。' : '此范围包括新版30题与旧版15题作业；两版记录均会移除。', vi: scope.homeworkVersion === 'legacy' ? 'Chỉ đặt lại bài tập cũ 15 câu; giữ bản 30 câu.' : scope.homeworkVersion === '30-v1' ? 'Chỉ đặt lại bài tập mới 30 câu; giữ bản cũ 15 câu.' : 'Phạm vi gồm cả bài tập mới 30 câu và bản cũ 15 câu; xóa bản ghi của cả hai.' }));
  return { data, title: dataWarning({ zh: `重置${chineseLabels[scope.module]} · ${scope.lesson === null ? '15课' : `第${scope.lesson}课`}`,
    vi: `Đặt lại ${labels[scope.module]} · ${scope.lesson === null ? '15 bài' : `Bài ${scope.lesson}`}` }),
    removed, warnings };
}
