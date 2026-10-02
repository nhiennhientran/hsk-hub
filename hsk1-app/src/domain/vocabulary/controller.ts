import engine from '../practice/engine.js';
import type { PracticeState } from '../types.ts';
import type { VocabularyCatalog } from '../../services/content/vocabulary.ts';
import type { LearningSession } from '../../services/learning/session.ts';
import type { Route } from '../../app/contracts.ts';
import type { VocabularyCurrent, VocabularyFilter, VocabularyPreferences, VocabularyRating, VocabularyResult, VocabularyReview, VocabularySchedule } from './types.ts';

interface ControllerOptions {
  session: LearningSession;
  catalog: VocabularyCatalog;
  now?: () => number;
  random?: () => number;
}
const success: VocabularyResult = { ok: true };
const failed = (reason: string, message: string): VocabularyResult => ({ ok: false, reason, message });
const same = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);
const reviewState = (state: PracticeState) => state.cards.review as unknown as VocabularyReview | null;
const errorResult = (error: unknown): VocabularyResult => failed(
  error instanceof Error && 'code' in error ? String(error.code).toLowerCase().replaceAll('_', '-') : 'invalid',
  error instanceof Error ? error.message : 'Không thực hiện được thao tác ôn từ.',
);

/** Vocabulary and due review share the application's existing practice store and round. */
export function createVocabularyController({ session: learning, catalog, now = Date.now, random = Math.random }: ControllerOptions) {
  const { store } = learning;
  engine.importBackup(store.snapshot().data.practice, catalog);
  let feature: 'vocabulary' | 'review' = store.snapshot().data.navigation?.feature === 'review' ? 'review' : 'vocabulary';
  const state = () => store.snapshot().data.practice;
  // A draft search never changes an active queue. Once started, its query is
  // saved with the queue and validated by the engine on reload/import.
  let search = reviewState(state())?.search ?? '';
  function current(practice: PracticeState, stamp: number): VocabularyCurrent | null {
    const review = reviewState(practice), id = review?.senseIds[review.position];
    if (!review || !id) return null;
    // A saved round owns its lessons, order and direction. Current preferences
    // and newly changed due times must never hide, replace or reorder its cards.
    const deck = engine.makeDeck(practice, catalog, { lessons: review.lessons, filter: 'all', direction: review.direction, shuffle: false }, stamp);
    const card = deck.cards.find(item => item.senseId === id);
    if (!card) return null;
    return { ...card, revealed: review.revealed[id] === true, rating: review.ratings[id] ?? null,
      schedule: (practice.cards.schedule[id] as unknown as VocabularySchedule | undefined) ?? null, direction: review.direction };
  }
  function change(mutator: (practice: PracticeState, stamp: number) => void, navigate = false): VocabularyResult {
    try {
      const before = store.snapshot().data, candidate = before.practice, original = JSON.stringify(candidate), stamp = now();
      mutator(candidate, stamp);
      const card = navigate ? current(candidate, stamp) : null;
      const navigation: Route | null = card ? { feature, lesson: card.lessons[0] } : before.navigation;
      if (original === JSON.stringify(candidate) && same(navigation, before.navigation)) return success;
      store.edit(draft => { draft.practice = candidate; if (navigate) draft.navigation = navigation; });
      learning.requestSave();
      return success;
    } catch (error) { return errorResult(error); }
  }
  return {
    read() {
      const practice = state(), stamp = now();
      const { lessons, vocabularyFilter, direction, shuffle, rate } = practice.preferences;
      const available = engine.makeDeck(practice, catalog, { shuffle: false, search }, stamp);
      return { preferences: { lessons, vocabularyFilter, direction, shuffle, rate }, search, review: reviewState(practice),
        current: current(practice, stamp), available, availableCount: available.filteredCount,
        dueCount: engine.makeDeck(practice, catalog, { shuffle: false, filter: 'due', search }, stamp).filteredCount,
        summary: engine.cardSummary(practice, catalog, stamp) };
    },
    visit(routeLesson: number, routeFeature: 'vocabulary' | 'review' = 'vocabulary'): VocabularyResult {
      if (!Number.isInteger(routeLesson) || routeLesson < 1 || routeLesson > 15 || !['vocabulary', 'review'].includes(routeFeature)) {
        return failed('invalid', 'Bài học hoặc mục ôn từ không hợp lệ.');
      }
      try {
        const data = store.snapshot().data, practice = data.practice, stamp = now();
        const initial = practice.updatedAt === null && practice.sequence === 0 && practice.cards.review === null;
        const navigation: Route = { feature: routeFeature, lesson: current(practice, stamp)?.lessons[0] ?? routeLesson };
        if (!initial && practice.preferences.module === 'vocabulary' && same(navigation, data.navigation)) {
          feature = routeFeature; return success;
        }
        store.edit(draft => {
          if (initial || draft.practice.preferences.module !== 'vocabulary') {
            engine.setPreferences(draft.practice, { module: 'vocabulary', ...(initial ? { lessons: [routeLesson] } : {}) }, stamp);
          }
          draft.navigation = navigation;
        });
        feature = routeFeature;
        learning.requestSave();
        return success;
      } catch (error) { return errorResult(error); }
    },
    setPreferences(patch: Partial<VocabularyPreferences>): VocabularyResult {
      if (!patch || typeof patch !== 'object' || Array.isArray(patch) ||
          Object.keys(patch).some(key => !['lessons', 'vocabularyFilter', 'direction', 'shuffle', 'rate'].includes(key))) {
        return failed('invalid', 'Tùy chọn ôn từ không hợp lệ.');
      }
      return change((practice, stamp) => {
        const previous = practice.preferences, updatedAt = practice.updatedAt;
        engine.setPreferences(practice, patch, stamp);
        if (same(previous, practice.preferences)) practice.updatedAt = updatedAt;
      });
    },
    setSearch(value: string): VocabularyResult {
      try {
        // Use the engine's validation and matching rules without a storage write.
        engine.makeDeck(state(), catalog, { shuffle: false, search: value }, now());
        search = value.trim().replace(/\s+/gu, ' ');
        return success;
      } catch (error) { return errorResult(error); }
    },
    start(filter?: VocabularyFilter): VocabularyResult {
      try {
        const stamp = now();
        if (!engine.makeDeck(state(), catalog, { ...(filter !== undefined ? { filter } : {}), shuffle: false, search }, stamp).filteredCount) {
          return failed('empty', 'Không có thẻ trong các bài và bộ lọc đã chọn.');
        }
        return change(practice => {
          engine.setPreferences(practice, { module: 'vocabulary', ...(filter !== undefined ? { vocabularyFilter: filter } : {}) }, stamp);
          engine.startReview(practice, catalog, { search }, stamp, random);
        }, true);
      } catch (error) { return errorResult(error); }
    },
    reveal(): VocabularyResult {
      const review = reviewState(state()), id = review?.senseIds[review.position];
      if (id && review?.revealed[id]) return success;
      return change((practice, stamp) => { engine.revealCard(practice, id ?? '', stamp); });
    },
    rate(rating: VocabularyRating): VocabularyResult {
      return change((practice, stamp) => { engine.rateCard(practice, catalog, rating, stamp); });
    },
    move(position: number): VocabularyResult {
      if (reviewState(state())?.position === position) return success;
      return change((practice, stamp) => { engine.moveCard(practice, position, stamp); }, true);
    },
    next(): VocabularyResult {
      const review = reviewState(state());
      if (review?.senseIds.length && review.position === review.senseIds.length - 1) return success;
      return change((practice, stamp) => { engine.nextCard(practice, stamp); }, true);
    },
  };
}
export type VocabularyController = ReturnType<typeof createVocabularyController>;
