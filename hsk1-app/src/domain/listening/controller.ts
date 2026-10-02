import engine from '../practice/engine.js';
import type { PracticeState } from '../types.ts';
import type { ListeningCatalog } from '../../services/content/listening.ts';
import type { LearningSession } from '../../services/learning/session.ts';
import type { Route } from '../../app/contracts.ts';
import type { ListeningCurrent, ListeningPreferences, ListeningResult, ListeningSession } from './types.ts';

interface ControllerOptions {
  session: LearningSession;
  catalog: ListeningCatalog;
  now?: () => number;
  random?: () => number;
}
const success: ListeningResult = { ok: true };
const failed = (reason: string, message: string): ListeningResult => ({ ok: false, reason, message });
const same = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);
const listeningSession = (state: PracticeState) => state.listening.session as unknown as ListeningSession | null;
const errorResult = (error: unknown): ListeningResult => failed(
  error instanceof Error && 'code' in error ? String(error.code).toLowerCase().replaceAll('_', '-') : 'invalid',
  error instanceof Error ? error.message : 'Không thực hiện được thao tác luyện nghe.',
);

/** Pure view actions over the application's session: no media, timers or second store. */
export function createListeningController({ session: learning, catalog, now = Date.now, random = Math.random }: ControllerOptions) {
  const { store } = learning;
  // The existing importer verifies the same question fingerprints used by grading.
  // Construction and reads never create an empty round or dirty saved data.
  engine.importBackup(store.snapshot().data.practice, catalog);
  const questions = new Map(catalog.listening.map(question => [question.id, question]));
  const listened = new Set<string>();
  const state = () => store.snapshot().data.practice;
  const available = (practice: PracticeState, mode = practice.preferences.listeningMode) => catalog.listening.filter(question =>
    practice.preferences.lessons.includes(question.lesson) && (mode === 'all' || practice.listening.records[question.id]?.latest.correct === false));
  function current(practice: PracticeState): ListeningCurrent | null {
    const round = listeningSession(practice);
    const id = round?.questionIds[round.position];
    const question = id ? questions.get(id) : undefined;
    if (!round || !id || !question) return null;
    const response = round.responses[id];
    return { id, lesson: question.lesson, kind: question.kind, promptVi: question.promptVi, audio: question.audio,
      options: round.optionOrders[id].map(index => ({ index, text: question.options[index] })),
      selected: response.selected, submitted: !!response.submission, listenCount: response.listenCount,
      feedback: response.submission ? { answer: question.answer, correct: response.submission.correct, transcript: question.transcript,
        explanationVi: question.explanationVi, optionFeedback: question.optionFeedback, keywords: question.keywords, source: question.source } : null };
  }
  function change(mutator: (practice: PracticeState) => void, navigate = false): ListeningResult {
    try {
      const before = store.snapshot().data, candidate = before.practice;
      const original = JSON.stringify(candidate);
      mutator(candidate);
      const question = navigate ? current(candidate) : null;
      const navigation: Route | null = question ? { feature: 'listening', lesson: question.lesson } : before.navigation;
      if (original === JSON.stringify(candidate) && same(navigation, before.navigation)) return success;
      store.edit(draft => { draft.practice = candidate; if (navigate) draft.navigation = navigation; });
      learning.requestSave();
      return success;
    } catch (error) { return errorResult(error); }
  }
  function start(mode?: ListeningPreferences['listeningMode'], limit: 5 | 10 | 'all' = 'all'): ListeningResult {
    if (!available(state(), mode).length) return failed('empty', 'Không có câu nghe trong các bài và bộ lọc đã chọn.');
    const result = change(practice => {
      const stamp = now();
      engine.setPreferences(practice, { module: 'listening', ...(mode ? { listeningMode: mode } : {}) }, stamp);
      engine.createListeningSession(practice, catalog, { limit }, stamp, random);
    }, true);
    if (result.ok) listened.clear();
    return result;
  }
  return {
    read() {
      const practice = state();
      const { lessons, listeningMode, shuffle, rate } = practice.preferences;
      return { preferences: { lessons, listeningMode, shuffle, rate }, session: listeningSession(practice), current: current(practice),
        summary: engine.listeningSummary(practice, catalog), availableCount: available(practice).length };
    },
    visit(routeLesson: number): ListeningResult {
      if (!Number.isInteger(routeLesson) || routeLesson < 1 || routeLesson > 15) return failed('invalid', 'Bài học không hợp lệ.');
      const data = store.snapshot().data, practice = data.practice;
      const initial = practice.updatedAt === null && practice.sequence === 0 && practice.listening.session === null;
      const navigation: Route = { feature: 'listening', lesson: current(practice)?.lesson ?? routeLesson };
      if (!initial && practice.preferences.module === 'listening' && same(navigation, data.navigation)) return success;
      try {
        store.edit(draft => {
          if (initial || draft.practice.preferences.module !== 'listening') {
            engine.setPreferences(draft.practice, { module: 'listening', ...(initial ? { lessons: [routeLesson] } : {}) }, now());
          }
          draft.navigation = navigation;
        });
        learning.requestSave();
        return success;
      } catch (error) { return errorResult(error); }
    },
    setPreferences(patch: Partial<ListeningPreferences>): ListeningResult {
      if (!patch || typeof patch !== 'object' || Array.isArray(patch) ||
          Object.keys(patch).some(key => !['lessons', 'listeningMode', 'shuffle', 'rate'].includes(key))) {
        return failed('invalid', 'Tùy chọn luyện nghe không hợp lệ.');
      }
      return change(practice => {
        // Let the preserved engine normalize and validate before deciding whether to save.
        const previous = practice.preferences, stamp = practice.updatedAt;
        engine.setPreferences(practice, patch, now());
        if (same(previous, practice.preferences)) practice.updatedAt = stamp;
      });
    },
    start(limit: 5 | 10 | 'all' = 'all') { return start(undefined, limit); },
    redo(limit: 5 | 10 | 'all' = 'all') { return start('wrong', limit); },
    select(id: string, optionIndex: number): ListeningResult {
      const model = current(state());
      if (!model) return failed('empty', 'Hãy bắt đầu một lượt nghe.');
      if (model.id !== id) return failed('not-current', 'Hãy chọn đáp án cho câu đang mở.');
      if (model.submitted) return failed('already-submitted', 'Câu này đã nộp. Hãy mở lượt mới để luyện lại.');
      if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex > 3) return failed('invalid-answer', 'Đáp án cần là một trong bốn lựa chọn.');
      if (model.selected === optionIndex) return success;
      return change(practice => { engine.selectListening(practice, catalog, id, optionIndex, now()); });
    },
    submit(): ListeningResult {
      return change(practice => { engine.submitListening(practice, catalog, now()); });
    },
    move(position: number): ListeningResult {
      const round = listeningSession(state());
      if (round?.position === position) return success;
      return change(practice => { engine.moveListening(practice, position, now()); }, true);
    },
    next(): ListeningResult {
      const round = listeningSession(state());
      if (round?.questionIds.length && round.position === round.questionIds.length - 1 && round.responses[round.questionIds[round.position]].submission) return success;
      return change(practice => { engine.nextListening(practice, now()); }, true);
    },
    recordListen(token: { sessionId: string; questionId: string; playbackId: string }): ListeningResult {
      const round = listeningSession(state());
      if (!token || typeof token.playbackId !== 'string' || !token.playbackId || token.playbackId.length > 200) return failed('invalid', 'Mã phát âm thanh không hợp lệ.');
      if (!round || round.id !== token.sessionId || round.questionIds[round.position] !== token.questionId) {
        return failed('not-current', 'Âm thanh không thuộc câu đang mở.');
      }
      const key = JSON.stringify([token.sessionId, token.questionId, token.playbackId]);
      if (listened.has(key)) return success;
      const result = change(practice => { engine.recordListen(practice, catalog, token.questionId, now()); });
      if (result.ok) listened.add(key);
      return result;
    },
  };
}
export type ListeningController = ReturnType<typeof createListeningController>;
